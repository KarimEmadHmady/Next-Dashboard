# CLAUDE-integration.md — Connect the Backend to the External Store System (Areas / Branches / Orders)

> Read `CLAUDE.md` first (Auth, JWT, RBAC, rate limiting, validation, middleware chain). That foundation is working and tested. **Do not rewrite or break it.** This document describes an extension on top of it.
> Start implementing right away in the order given in "Implementation Order". Do not ask questions about anything that has a reasonable default here. The only mandatory stop points are listed in Step 0.

---

## 1. Context and Goal

**Current state**
- Our backend (Express + MySQL) owns: `users`, `areas`, `stores`, `refresh_tokens`, `audit_logs`.
- Areas and Stores are currently created locally (CRUD).

**External system** (WordPress + WooCommerce): `https://backend.Roxy-shawerma.com`
- It is the **source of truth** for Areas, Branches (= our "Stores") and Orders.
- Terminology: external **Area** = our `area`; external **Branch** = our `store`.

**Goal**
- Areas, Branches and Orders come from the external system.
- Users, roles, auth and permissions stay in our backend.
- The existing Permission Matrix is enforced on top of the external data:

| Role | Areas / Branches | Orders |
|------|------------------|--------|
| `OPERATION_MANAGER` | all | all |
| `AREA_MANAGER` | only the branches inside his area | only orders of branches in his area |
| `STORE_MANAGER` | only his branch | only his branch's orders |
| `STORE_USER` | only his branch | only his branch's orders |

---

## 2. External API Reference

Base URL: `EXTERNAL_API_BASE_URL` (env). Every request sends:
`Authorization: Bearer <externalToken>` and `lang: ar`.

### Areas
`GET /wp-json/api/v1/areas`
```json
{ "data": [ { "id": 77, "name": "New Cairo", "slug": "new-cairo", "description": "", "lat": null, "long": null } ] }
```

### Branches by Area
`GET /wp-json/api/v1/areas/{areaId}/branches/`
```json
{ "data": [ { "id": 292, "title": "Concord Plaza", "lat": "30.0249275", "long": "31.482889" } ] }
```
- `title` contains **HTML entities** (e.g. `&#8220;`, `&#8221;`). Decode them before storing or returning.
- `lat` / `long` can be empty strings or null. Normalize to `null`.

### Orders (user-token endpoints)
- `GET /wp-json/api/v1/orders` (query: `status`)
- `GET /wp-json/api/v1/order/{id}`
- `GET /wp-json/api/v1/orders/{id}/timeline`
- `GET /wp-json/api/v1/orders/statuses`
- `GET /wp-json/api/v1/orders/status/{status}`
- `GET /wp-json/api/v1/orders/{id}/status`

### Admin Orders (the one we mainly need)
`GET /wp-json/api/v1/admin/orders`

| Query param | Values |
|-------------|--------|
| `page` | default 1 |
| `limit` | default 20 |
| `status` | `pending`, `processing`, `on-hold`, `completed`, `cancelled`, `refunded`, `failed` |
| `search` | order number, customer email, or customer name |
| `orderby` | `date`, `total`, `id` (default `date`) |
| `order` | `ASC` / `DESC` (default `DESC`) |

Requires the `manage_woocommerce_orders` capability on the token used.

---

## 3. Step 0 (MANDATORY before any design or code): Discovery

1. Build the external client skeleton and call the real external API. Record the **actual response shapes** of `areas`, `branches`, `admin/orders` and `order/{id}` (log structure only, never tokens or customer PII).
2. Determine **which field on an order links it to a branch** (and to an area, if present): `branch_id`, `area_id`, order meta, shipping/pickup meta, etc. Also check whether `admin/orders` supports filtering by `branch_id` / `area_id` directly.
3. **STOP and report to me** if either is true:
   - No field links an order to a branch. Do not guess and do not build scoping on assumptions.
   - You cannot obtain a working external token (no known login endpoint, or no credentials in `.env`).
4. Never hardcode or commit external credentials/tokens. Never write them to logs.

Put the findings in a short "Discovery Results" section at the bottom of this file, then continue.

---

## 4. Design

### 4.1 External API Client (single entry point)
- One file, e.g. `src/services/externalApi.service.js`. **Nothing else** talks to the external system.
- Authenticates with a **service account** (credentials from env), caches the external JWT in memory until shortly before expiry, and on `401` refreshes the token and retries **once**.
- Timeout (default 10s). Retry at most 2 times, only on network errors and `5xx` (never on `4xx`), with small backoff.
- Never leak external error messages or stack traces to clients. Map failures to our unified error format:
  - `502 EXTERNAL_SERVICE_ERROR`
  - `504 EXTERNAL_SERVICE_TIMEOUT`
- Logging: method, path, status, duration only. No tokens, no customer data.
- New env vars (also add to `.env.example`):
  ```
  EXTERNAL_API_BASE_URL=https://backend.Roxy-shawerma.com
  EXTERNAL_API_LANG=ar
  EXTERNAL_API_USERNAME=
  EXTERNAL_API_PASSWORD=
  EXTERNAL_API_TOKEN=            # only if login is not possible; prefer the service account
  EXTERNAL_API_TIMEOUT_MS=10000
  EXTERNAL_SYNC_INTERVAL_MINUTES=15
  ORDERS_CACHE_TTL_SECONDS=30
  ```

### 4.2 Areas and Stores: local read-only mirror, kept in sync
We keep local `areas` and `stores` tables as a **mirror** so `users` foreign keys keep working and SQL scoping stays fast.

**Migration** (add to `initDb.js`; must be non-destructive, no data loss):
- `areas`: add `external_id INT NOT NULL UNIQUE`, `slug`, `lat`, `lng`, `is_active` (default 1), `synced_at`.
- `stores`: add `external_id INT NOT NULL UNIQUE`, `lat`, `lng`, `is_active` (default 1), `synced_at`. `area_id` stays an FK to local `areas`.
- Local PKs stay UUID; `external_id` is the link to the external system.
- If existing test data conflicts with the migration, ask me before deleting anything.

**Sync service**
- Fetch all areas, then branches for each area, and **upsert by `external_id`**. Decode HTML entities in names.
- If an area/branch disappears externally: **soft-deactivate** (`is_active = 0`), never delete (users reference them).
- If a branch appears under more than one area, choose a deterministic behavior (e.g. first area wins, log a warning) and document it here.
- Runs: on server start, every `EXTERNAL_SYNC_INTERVAL_MINUTES`, and manually via `POST /api/v1/sync/areas-stores` (**`OPERATION_MANAGER` only**).
- Prevent overlapping runs (simple in-process lock).
- On failure: log, keep serving the existing mirror, do not crash the server.
- Every run writes an `audit_logs` entry (added / updated / deactivated counts).

**Local CRUD removal**
- `POST/PATCH/DELETE` on `/areas` and `/stores` now return `405 METHOD_NOT_ALLOWED` with a message that the external system is the source of truth.
- `GET /areas`, `GET /areas/:id/stores`, `GET /stores` stay, with the **same scoping as today**, and include `externalId` in responses.

**Seed**
- Remove the sample areas/stores from `seed.js` (or limit them to `NODE_ENV=development`). The Super Admin seed stays as is.

### 4.3 Users
- `users.areaId` / `users.storeId` remain FKs to the local mirror tables.
- Validation on create/update: the referenced area/store must exist **and be active** in the mirror. Otherwise `400`.
- All creation rules and constraints from `CLAUDE.md` are unchanged.

### 4.4 Orders: proxy with scoping (no local storage of orders)
New routes under `/api/v1/orders`, all behind the full chain:
`rateLimit → authenticate → authorize → scopeGuard → validate → controller`

| Method | Path | Access |
|--------|------|--------|
| GET | `/orders` | all 4 roles (scoped) |
| GET | `/orders/statuses` | all 4 roles |
| GET | `/orders/:id` | all 4 roles (scoped) |
| GET | `/orders/:id/timeline` | all 4 roles (scoped) |

Query for the list: `page`, `limit` (max 100), `status`, `search`, `orderby`, `order`, and optional `storeId` / `areaId` (see rules). Validate with Joi, strict whitelist, same as everywhere else.

**Scoping rules (security critical)**
- The scope comes from `req.user` (role + areaId/storeId), **never** from query/body for non-`OPERATION_MANAGER` users.
- Resolve the actor's allowed external branch IDs from the local mirror:
  - `OPERATION_MANAGER`: all (optional `areaId`/`storeId` filters allowed).
  - `AREA_MANAGER`: external IDs of all active stores in his area. A `storeId` filter is allowed only if inside his area; otherwise return `404`.
  - `STORE_MANAGER` / `STORE_USER`: only his store's external ID.
- If the external API supports branch/area filtering, push the filter to the external call. Otherwise fetch and filter server-side, and handle pagination correctly (do not return wrong `total`/pages). Document the approach chosen in Discovery Results.
- `GET /orders/:id` and `/timeline`: fetch the order, verify its branch is inside the actor's scope, else return **`404`** (not `403`) so existence is not leaked.
- Never trust an order's branch from the client. Always derive it from the external response.
- Response: unified format with `meta` (`page`, `limit`, `total`). Normalize the order shape into a stable DTO (do not pass raw WooCommerce payloads through). Include `storeId` (local UUID) and `areaId` for convenience. Strip fields the frontend does not need.
- Short in-memory cache (`ORDERS_CACHE_TTL_SECONDS`) keyed by the **scoped** query, so different scopes never share a cache entry.
- Order status updates are **out of scope** for now (read-only). `STORE_USER` stays read-only until the open question below is answered.

### 4.5 Allowed pages and /auth/me
- No change to roles or `allowedPages`. `/auth/me` additionally returns the user's area and store (`id`, `name`, `externalId`) so the frontend can show them.

---

## 5. Security Checklist (additions)

- [ ] External credentials only in env; never in code, logs, or git.
- [ ] External errors never leak to clients.
- [ ] Order scoping verified on every order route; out-of-scope returns `404`.
- [ ] Cache keys include the scope; no cross-scope leakage.
- [ ] Customer PII (name, phone, email, address) only returned to roles that are allowed to see that order, and never written to logs.
- [ ] Rate limit the sync endpoint (e.g. 5 / hour) and the orders routes.
- [ ] Sync endpoint audited in `audit_logs`.

---

## 6. Testing Requirements

Use a **mocked external client** (no real network in tests). Add integration tests to `tests/` and extend `npm run test:api`:

- Sync: upsert creates, updates and soft-deactivates correctly; HTML entities decoded; sync failure keeps old data; overlapping runs blocked; only `OPERATION_MANAGER` can trigger.
- `/areas` and `/stores` mutations return `405`; `GET`s are still scoped.
- User creation rejects inactive or non-existent area/store.
- Orders scoping, for **every role**:
  - `OPERATION_MANAGER` sees all.
  - `AREA_MANAGER` of area A cannot see orders of area B (list and by-id).
  - `STORE_MANAGER` / `STORE_USER` of branch X cannot see branch Y orders.
  - Passing a foreign `storeId` / `areaId` in the query is rejected or ignored as specified.
  - Out-of-scope `GET /orders/:id` returns `404`.
  - Pagination `total` is correct after scoping.
- External failures: timeout returns `504`, `5xx` returns `502`, token refresh on `401` retries once.

---

## 7. Implementation Order

1. **Step 0 discovery** (external client skeleton, real response shapes, order-to-branch link, token). Stop and report if blocked.
2. External client with token caching, retries, and error mapping.
3. Migration for `external_id` and related columns.
4. Sync service plus `POST /sync/areas-stores` plus the scheduler.
5. Disable local CRUD on areas/stores (`405`); update the seed.
6. User validation against active mirror rows.
7. Orders module with scoping, DTO, and cache.
8. Update `/auth/me`.
9. Tests, Postman collection update, `.env.example`, and docs.

---

## 8. Rules for the Agent

- Do not change the existing Permission Matrix, auth flow, or middleware chain except where this document says so.
- Least privilege wins any ambiguity. Record the decision under "Open Questions".
- Every new route goes through the full middleware chain and gets tests.
- No destructive DB changes without asking me first.
- Keep `CLAUDE.md` updated: add a short pointer to this file and document any decision made here.

---

## 9. Open Questions

1. Can `STORE_USER` / `STORE_MANAGER` **change an order's status**, or is it read-only? (Default: read-only.)
2. Does a service-account login exist on the external WordPress (JWT login endpoint), or must we use a static token?
3. Should the manual sync also be exposed on the Operation Manager dashboard as a "Sync now" button?
4. Customer PII masking: Customer PII (email, phone, address) is masked in the DTO for `STORE_USER` unless decided otherwise.


---

## 10. Discovery Results

### 10.1 Verified Endpoints & Real Shapes
- **Base URL**: `https://backend.roxy-shawerma.com` (reachable).
- **Areas**: `GET /wp-json/api/v1/areas` (public, HTTP 200).
  Response format:
  ```json
  {
    "success": true,
    "data": [
      { "id": 79, "name": "Heliopolis", "slug": "heliopolis", "description": "", "lat": null, "long": null },
      { "id": 78, "name": "Nasr City", "slug": "nasr-city", "description": "", "lat": null, "long": null },
      { "id": 77, "name": "New Cairo", "slug": "new-cairo", "description": "", "lat": null, "long": null }
    ]
  }
  ```
- **Branches by Area**: `GET /wp-json/api/v1/areas/{id}/branches/` (public, HTTP 200).
  Response format:
  ```json
  {
    "success": true,
    "data": [
      { "id": 315, "title": "Domo 7 Plaza", "lat": "", "long": "" },
      { "id": 314, "title": "Madinaty &#8220;All season&#8221;", "lat": "", "long": "" }
    ]
  }
  ```
  - `title` contains HTML entities (e.g., `&#8220;`, `&#8221;`) that need decoding (using `he` or native entity decoding).
  - `lat` / `long` can be string `""` or numbers; normalized to float or `null`.

- **Admin Orders Endpoint**:
  - Found registered route on WordPress REST API: `GET /wp-json/api/v1/admin/orders` (note: `/custom-api/v1/admin/orders` returned 404).
  - Requires authentication (returns 401 Unauthorized without Bearer token).

- **Authentication Method**:
  - Found endpoint `POST /wp-json/api/v1/auth/login`.
  - Body payload required:
    ```json
    {
      "identifier": "<email_or_username_or_phone>",
      "password": "<password>"
    }
    ```
  - Also discovered `POST /wp-json/api/v1/auth/refresh`.

### 10.2 Mandatory Stop Point Encountered (Step 0, Rule 3)
- No credentials (`EXTERNAL_API_USERNAME`, `EXTERNAL_API_PASSWORD`, or `EXTERNAL_API_TOKEN`) were provided in `.env` or in the repository.
- As a result, requests to `GET /wp-json/api/v1/admin/orders` and `GET /wp-json/api/v1/order/{id}` return `401 Unauthorized`.
- We cannot inspect live order payloads to determine the exact field linking an order to a branch (e.g. `branch_id`, `store_id`, `meta_data`, etc.) or verify whether `admin/orders` supports branch query parameters.
- Reported to user per Step 0, Rule 3.

### 10.3 User Decision & Phase Implementation Order
- Proceed with Steps 2 through 6 immediately:
  1. External API client foundation (with login/refresh against `POST /wp-json/api/v1/auth/login` and `POST /wp-json/api/v1/auth/refresh`).
  2. Areas & branches sync works publicly without requiring a token.
  3. Migration for `external_id`, `slug`, `lat`, `lng`, `is_active`, `synced_at`.
  4. Sync service + manual sync `POST /api/v1/sync/areas-stores` + periodic scheduler.
  5. Local CRUD on `/areas` and `/stores` disabled with `405 METHOD_NOT_ALLOWED`.
  6. User creation & update validation against active mirror records.
  7. `/auth/me` includes user's area and store (`id`, `name`, `externalId`).
- Step 7 (Orders module scoping & proxying) is implemented in a FAIL-CLOSED way:

### 10.4 Sample Order Findings & Requirements for External System Developer
- **Sample Order Findings**:
  - Neither the orders list (`GET /wp-json/api/v1/admin/orders`) nor the single order endpoint (`GET /wp-json/api/v1/order/{id}`) contains any field linking an order to a branch or area (no `branch_id`, no `meta_data`, empty city/address).
- **Requirements for the External System Developer**:
  1. Add a `branch_id` field (integer matching the external branch ID from `/wp-json/api/v1/areas/{id}/branches/`) to each order in `admin/orders` and single order payloads.
  2. Optionally add `area_id` (integer matching external area ID).
  3. Ensure `GET /wp-json/api/v1/admin/orders` optionally accepts `branch_id` and `area_id` query parameters for high-performance server-side filtering.
- **Fail-Closed Implementation in Backend**:
  - Configurable field extraction via `ORDER_BRANCH_FIELD` (default `branch_id`) and `ORDER_AREA_FIELD` (default `area_id`) using a single mapper function `extractBranchAndArea`.
  - `OPERATION_MANAGER` sees all orders (including unmapped orders).
  - `AREA_MANAGER`, `STORE_MANAGER`, and `STORE_USER` only see orders whose mapped branch is inside their scope. If the field is missing, null, or unmapped on an order, they see **nothing** (empty list, and `404 NOT_FOUND` on single order / timeline).
  - Statuses are normalized across the board by stripping any `wc-` prefix.
  - Customer PII (email, phone, address) is masked for `STORE_USER`.
  - Cache is strictly keyed by actor scope (`role:areaId:storeId:actorId`) so cross-scope cache leakage is impossible.



