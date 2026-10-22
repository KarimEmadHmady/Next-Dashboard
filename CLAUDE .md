# CLAUDE.md — Store System Backend (Auth & Authorization)

> الملف ده هو المرجع الأساسي للباك اند. اقراه كله قبل ما تكتب أي كود، وابدأ التنفيذ على طول بالترتيب المكتوب في قسم "Implementation Order".
> الدوكيومنت متكتب بالعربي، لكن كل الكود والأسماء والـ API بالإنجليزي.

---

## 1. Project Overview

- في داشبورد Frontend (Next.js على `localhost:3000/en/dashboard/...`) كانت كلها static.
- الباك اند ده هو اللي هيشغّل كل الداشبورد بـ data حقيقية.
- **المرحلة الأولى (الحالية):** Authentication + Authorization + إدارة المستخدمين. أي حاجة تانية (orders, analytics, stores CRUD) تتبني بعد كده فوق نفس الأساس.

### Dashboard Pages (Frontend)

| Page | Route | Role-gated to |
|------|-------|---------------|
| Operation Manager | `/dashboard/manager` | `OPERATION_MANAGER` |
| Area Manager | `/dashboard/area-manager` | `AREA_MANAGER` |
| Stores | `/dashboard/branch-manager` | `OPERATION_MANAGER`, `AREA_MANAGER` (ضمن الإيريا بتاعته) |
| Store Manager | `/dashboard/branch-responsible` | `STORE_MANAGER` |
| Orders | `/dashboard/orders` | كل الأدوار (بنطاق كل دور) |
| User Store | `/dashboard/branch-user` | `STORE_USER` |
| Out of Coverage | `/dashboard/out-of-coverage` | `OPERATION_MANAGER`, `AREA_MANAGER` (ضمن الإيريا بتاعته) |

---

## 2. Roles & Hierarchy

التسلسل من الأعلى للأدنى:

```
OPERATION_MANAGER  (Super Admin)
   └── AREA_MANAGER        (مسؤول عن Area واحدة، مثال: New Cairo — 20 stores)
          └── STORE_MANAGER     (مسؤول عن Store واحد)
                 └── STORE_USER      (موظف في Store واحد)
```

### 2.1 OPERATION_MANAGER (Super Admin)
- يشوف ويتحكم في **كل حاجة**: كل الـ analytics، كل الـ stores، كل الـ areas، كل الـ orders.
- يقدر **ينشئ / يعدّل / يحذف (soft) / يوقف / يفعّل** أي يوزر من أي نوع (بما فيهم Area Managers وحتى Operation Managers تانيين).
- يقدر يعمل Area ويحدد الـ stores اللي تحتها، ويعيّن Area Manager لكل Area.
- الصفحات: كل الصفحات.

### 2.2 AREA_MANAGER
- بيتحددله **Area واحدة** (مثال: `New Cairo`، فيها ~20 store).
- مسؤول عن كل الـ stores اللي جوه الـ Area بتاعته.
- يقدر **ينشئ / يعدّل / يوقف / يحذف (soft)** يوزرات من نوع `STORE_MANAGER` و `STORE_USER` **اللي في الـ Area بتاعته بس**.
- **ممنوع** يشوف أو يعدّل: Operation Managers، Area Managers تانيين، أي يوزر/store/order خارج الـ Area بتاعته.
- **ممنوع** يعمل يوزر بدور أعلى منه أو بنفس مستواه (`AREA_MANAGER` أو `OPERATION_MANAGER`).
- يشوف analytics و orders للـ Area بتاعته بس.
- الصفحات: Area Manager, Stores, Orders, Out of Coverage (كلهم بنطاق الـ Area).

### 2.3 STORE_MANAGER
- مربوط بـ **Store واحد** بس.
- يشوف ويتحكم في الـ orders بتاعة الـ store بتاعه بس، ويدير إعدادات الـ store بتاعه فقط.
- يقدر **ينشئ / يعدّل / يوقف / يحذف (soft)** يوزرات من نوع `STORE_USER` **فقط، وفي الـ store بتاعه بس**.
- **ممنوع** يعمل `STORE_MANAGER` تاني أو أي دور أعلى.
- الصفحات: Store Manager, Orders (store بتاعه).

### 2.4 STORE_USER
- موظف مربوط بـ **Store واحد** بس.
- يشوف الـ orders بتاعة الـ store بتاعه بس (قراءة + تحديث الحالة لو الـ business بيسمح — اسأل قبل ما تضيف).
- **مفيش** أي analytics.
- **مفيش** إنشاء أو تعديل يوزرات.
- الصفحات: User Store, Orders (store بتاعه).

---

## 3. Permission Matrix

| Action | OPERATION_MANAGER | AREA_MANAGER | STORE_MANAGER | STORE_USER |
|--------|:-:|:-:|:-:|:-:|
| Create OPERATION_MANAGER | ✅ | ❌ | ❌ | ❌ |
| Create AREA_MANAGER | ✅ | ❌ | ❌ | ❌ |
| Create STORE_MANAGER | ✅ | ✅ (in own area) | ❌ | ❌ |
| Create STORE_USER | ✅ | ✅ (in own area) | ✅ (own store) | ❌ |
| Update / Deactivate / Delete users | ✅ all | ✅ below him, own area | ✅ STORE_USER, own store | ❌ |
| View all analytics | ✅ | ❌ | ❌ | ❌ |
| View area analytics | ✅ | ✅ own area | ❌ | ❌ |
| View store analytics | ✅ | ✅ own area | ✅ own store | ❌ |
| View orders | ✅ all | ✅ own area | ✅ own store | ✅ own store |
| Manage areas | ✅ | ❌ | ❌ | ❌ |
| Manage stores | ✅ | ✅ own area (update only) | ✅ own store (settings only) | ❌ |
| Out of Coverage | ✅ all | ✅ own area | ❌ | ❌ |

**قاعدة ذهبية:** أي يوزر لا يقدر يعمل/يعدّل/يشوف يوزر **دوره أعلى أو يساوي دوره** (إلا الـ OPERATION_MANAGER). وكمان أي request لازم يتحقق من الـ **scope** (area / store) مش بس من الـ role.

> لو في حاجة مش واضحة في الـ matrix، اختار الأكثر تقييدًا (least privilege) وسجّلها في قسم "Open Questions" تحت.

---

## 4. Data Model (أساسي)

> الـ ORM/DB حسب اللي مستخدمه المشروع حاليًا. لو مفيش، استخدم PostgreSQL + Prisma أو TypeORM. اتبع الـ stack الموجود في الـ repo لو موجود.

### User
```
id               uuid (PK)
name             string
email            string (unique, lowercase)
phone            string? (unique)
passwordHash     string          // argon2id أو bcrypt (cost >= 12)
role             enum: OPERATION_MANAGER | AREA_MANAGER | STORE_MANAGER | STORE_USER
areaId           uuid? (FK → Area)   // مطلوب لـ AREA_MANAGER، ويتورّث من الـ store للباقي
storeId          uuid? (FK → Store)  // مطلوب لـ STORE_MANAGER و STORE_USER
isActive         boolean (default true)
createdById      uuid? (FK → User)
failedLoginCount int (default 0)
lockedUntil      datetime?
lastLoginAt      datetime?
tokenVersion     int (default 0)   // لإبطال كل التوكنز عند تغيير الباسورد/الإيقاف
createdAt, updatedAt, deletedAt (soft delete)
```

### Area
```
id, name (مثال: "New Cairo"), createdAt, updatedAt
```

### Store
```
id, name, areaId (FK → Area), isActive, createdAt, updatedAt
```

### RefreshToken
```
id, userId (FK), tokenHash (sha256 — متخزنش الـ token نفسه), familyId,
expiresAt, revokedAt?, replacedById?, userAgent?, ip?, createdAt
```

### Constraints (في الـ validation وفي الـ DB)
- `AREA_MANAGER` → لازم `areaId`، و `storeId = null`.
- `STORE_MANAGER` / `STORE_USER` → لازم `storeId`، والـ `areaId` يتشتق من الـ store.
- `OPERATION_MANAGER` → `areaId = null` و `storeId = null`.
- كل Store له Store Manager واحد نشط على الأكثر (لو الـ business كده — أكّد في Open Questions).

---

## 5. Authentication

### 5.1 Strategy: JWT (Access + Refresh)
- **Access Token:** عمره قصير (15 دقيقة). بيحتوي على:
  ```json
  { "sub": "<userId>", "role": "STORE_MANAGER", "areaId": "...", "storeId": "...", "tv": 3 }
  ```
- **Refresh Token:** عمره 7 أيام، **rotating** (كل refresh بيطلع token جديد ويلغي القديم). متخزن hashed في الـ DB.
- **Reuse detection:** لو refresh token اتلغى واتستخدم تاني → الغي كل الـ family (والـ user يعمل login من جديد).
- التوكنز تتبعت كـ **httpOnly + Secure + SameSite=Lax** cookies (الأفضل مع Next.js)، مع دعم `Authorization: Bearer` كـ fallback للـ API clients.
- الأسرار (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) من env variables فقط، مختلفين عن بعض، ومش بيتكتبوا في الكود أو الـ logs.
- في كل request محمي: بعد التحقق من الـ JWT، جيب اليوزر من الـ DB (أو cache قصير) وتأكد: `isActive = true`، `deletedAt = null`، و `tokenVersion` متطابق مع `tv`. ده بيخلي الإيقاف/تغيير الباسورد يسري فورًا.

### 5.2 Password
- Hash بـ **argon2id** (أو bcrypt بـ cost ≥ 12).
- Policy: 8+ حروف على الأقل، فيها حرف كبير وصغير ورقم. ممنوع الباسوردات الشائعة.
- عند تغيير الباسورد أو إعادة تعيينه: `tokenVersion++` وإلغاء كل الـ refresh tokens.
- مفيش public signup. **كل اليوزرات بتتعمل من جوه الداشبورد** بواسطة اليوزر المسموح له (قسم 3).
- أول `OPERATION_MANAGER`: يتعمل بـ seed script من env variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) ويتجاهل لو موجود.

### 5.3 Rate Limiting & Brute-force Protection
| Endpoint | Limit |
|----------|-------|
| `POST /auth/login` | 5 محاولات / 15 دقيقة لكل (IP + email) |
| `POST /auth/refresh` | 30 / 15 دقيقة لكل IP |
| `POST /auth/forgot-password` | 3 / ساعة لكل email/IP |
| `POST /users` (إنشاء يوزر) | 20 / ساعة لكل يوزر |
| باقي الـ API | 100 / دقيقة لكل IP (global) |

- بعد **5 محاولات login فاشلة** على نفس الحساب: `lockedUntil = now + 15 min`.
- رسالة الخطأ في login دايمًا عامة: `Invalid email or password` (من غير ما تقول أنهي واحد غلط).
- استخدم Redis لو متاح (وإلا in-memory store مع ملاحظة إنه مش مناسب لأكتر من instance).
- رجّع `429` مع header `Retry-After`.

### 5.4 Validation (كل input)
- استخدم مكتبة schema validation (Zod / class-validator / Joi حسب الـ stack).
- **Whitelist فقط:** أي field مش معرّف في الـ schema يتشال/يترفض (حماية من mass-assignment، خصوصًا `role`, `areaId`, `storeId`, `isActive`).
- Normalize: `email` → trim + lowercase.
- الـ IDs لازم UUID صحيح.
- الـ pagination: `page >= 1`, `limit` بحد أقصى 100.
- رجّع `400` بـ format موحد (قسم 8) مع تفاصيل الـ fields.

---

## 6. Authorization (Middleware ثابت)

### 6.1 Middleware Chain
كل route محمي بنفس الترتيب:

```
rateLimit → authenticate → authorize(roles) → scopeGuard → validate(schema) → controller
```

### 6.2 `authenticate`
- يستخرج الـ access token (cookie ثم Bearer header).
- يتحقق من التوقيع والانتهاء، ويجيب اليوزر ويتحقق من `isActive` / `tokenVersion`.
- يحط `req.user = { id, role, areaId, storeId }`.
- فشل → `401`.

### 6.3 `authorize(...allowedRoles)`
- Role-based check بسيط: `authorize(Role.OPERATION_MANAGER, Role.AREA_MANAGER)`.
- فشل → `403`.
- اعمل ثابت للـ roles والـ permissions في ملف واحد (`src/config/permissions.*`) — **ممنوع hardcode strings للأدوار في الـ routes**.

### 6.4 `scopeGuard` / Policy functions
الـ role لوحده مش كفاية. اعمل policy helpers مركزية (`src/policies/*`):

```
canManageUser(actor, targetUser)      // role أقل + نفس الـ scope
canCreateUser(actor, { role, areaId, storeId })
canAccessStore(actor, storeId)
canAccessArea(actor, areaId)
canViewOrder(actor, order)
```

القواعد:
- `OPERATION_MANAGER` → true دايمًا.
- `AREA_MANAGER` → الـ target (store/user/order) لازم يبقى `areaId === actor.areaId`، والـ role بتاع الـ target أقل منه.
- `STORE_MANAGER` → الـ target لازم `storeId === actor.storeId` والـ role = `STORE_USER`.
- `STORE_USER` → قراءة orders بتاعة `storeId === actor.storeId` فقط.

### 6.5 Data Scoping في الـ Queries (مهم جدًا)
- القوائم (users, stores, orders) **تتفلتر في الـ query نفسه** حسب scope اليوزر (`WHERE areaId = ...` / `WHERE storeId = ...`)، مش بعد ما تجيب الداتا.
- لو اليوزر طلب resource بره الـ scope بتاعه رجّع **`404`** (مش 403) علشان منكشفش وجوده.
- ممنوع تثق في `areaId` / `storeId` جاية من الـ body أو الـ query لو اليوزر مش `OPERATION_MANAGER`؛ خدها من `req.user`.

### 6.6 Frontend Contract
- `GET /auth/me` بيرجّع بيانات اليوزر + `role` + `allowedPages` (قايمة الصفحات اللي تظهرله) + `permissions`.
- الـ Frontend بيعرض الصفحات حسب `allowedPages` بس، **لكن الباك اند هو المصدر الحقيقي للأمان** (الـ frontend hiding مش حماية).

Role → allowedPages:
```
OPERATION_MANAGER: manager, area-manager, branch-manager, branch-responsible, orders, branch-user, out-of-coverage
AREA_MANAGER:      area-manager, branch-manager, orders, out-of-coverage
STORE_MANAGER:     branch-responsible, orders
STORE_USER:        branch-user, orders
```

---

## 7. API Endpoints (المرحلة الأولى)

Base: `/api/v1`

### Auth
| Method | Path | Access | Notes |
|--------|------|--------|-------|
| POST | `/auth/login` | Public (rate limited) | يرجّع user + يحط cookies |
| POST | `/auth/refresh` | Public (refresh cookie) | rotation + reuse detection |
| POST | `/auth/logout` | Authenticated | يلغي الـ refresh token الحالي |
| POST | `/auth/logout-all` | Authenticated | `tokenVersion++` |
| GET | `/auth/me` | Authenticated | user + allowedPages |
| POST | `/auth/change-password` | Authenticated | يتطلب الباسورد القديم |
| POST | `/auth/forgot-password` | Public (rate limited) | (اختياري في المرحلة 1) |
| POST | `/auth/reset-password` | Public (token) | (اختياري في المرحلة 1) |

### Users
| Method | Path | Access |
|--------|------|--------|
| POST | `/users` | OPERATION_MANAGER, AREA_MANAGER, STORE_MANAGER (حسب policy) |
| GET | `/users` | الثلاثة (مفلترة بالـ scope) + filter/search/pagination |
| GET | `/users/:id` | حسب `canManageUser` |
| PATCH | `/users/:id` | حسب `canManageUser` |
| PATCH | `/users/:id/status` | تفعيل/إيقاف — حسب `canManageUser` |
| DELETE | `/users/:id` | soft delete — حسب `canManageUser` |

> التعديل ممنوع يغيّر `role` لدور أعلى من دور الـ actor، وممنوع ينقل يوزر لـ area/store بره scope الـ actor.
> اليوزر ممنوع يوقف/يحذف نفسه.

### Areas & Stores (قراءة وإدارة أساسية لدعم الـ users)
| Method | Path | Access |
|--------|------|--------|
| GET/POST/PATCH/DELETE | `/areas` | OPERATION_MANAGER |
| GET | `/areas/:id/stores` | OPERATION_MANAGER, AREA_MANAGER (own) |
| GET/POST/PATCH | `/stores` | OPERATION_MANAGER (full), AREA_MANAGER (own area) |

---

## 8. Response & Error Format (موحد)

Success:
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 100 } }
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | input غلط |
| 401 | `UNAUTHENTICATED` / `TOKEN_EXPIRED` | مفيش توكن أو منتهي |
| 403 | `FORBIDDEN` | الدور مش مسموح له |
| 404 | `NOT_FOUND` | مش موجود أو بره الـ scope |
| 409 | `CONFLICT` | email/phone مكرر |
| 423 | `ACCOUNT_LOCKED` | الحساب مقفول مؤقتًا |
| 429 | `RATE_LIMITED` | تخطى الـ limit |
| 500 | `INTERNAL_ERROR` | رسالة عامة، والتفاصيل في الـ logs فقط |

---

## 9. Security Checklist

- [ ] CORS: origin الـ frontend بس (من env)، `credentials: true`.
- [ ] `helmet` أو ما يعادله لـ security headers.
- [ ] CSRF: لو بتستخدم cookies → `SameSite` + CSRF token أو Origin check على الـ mutating requests.
- [ ] مفيش `passwordHash` أو tokens في أي response أو log.
- [ ] Parameterized queries / ORM فقط (مفيش string concatenation في SQL).
- [ ] Request body size limit (مثلاً 100kb).
- [ ] Audit log لكل: login (نجح/فشل)، logout، إنشاء/تعديل/حذف/إيقاف يوزر، تغيير باسورد (مين عمل إيه في إيه ومتى ومن أنهي IP).
- [ ] Logging منظم (pino/winston) من غير بيانات حساسة.
- [ ] `.env.example` موجود، و `.env` في `.gitignore`.
- [ ] Graceful error handler مركزي، من غير stack traces في production.

---

## 10. Suggested Project Structure

> اتبع الـ structure الحالي في الـ repo لو موجود. لو مفيش، استخدم ده:

```
src/
  config/        env.*, permissions.*, roles.*
  middleware/    authenticate.*, authorize.*, scopeGuard.*, rateLimit.*, validate.*, errorHandler.*
  policies/      user.policy.*, store.policy.*, order.policy.*
  modules/
    auth/        routes, controller, service, schemas
    users/       routes, controller, service, schemas
    areas/
    stores/
  utils/         password.*, tokens.*, errors.*, logger.*
  db/            schema/migrations, seed.*
tests/
```

---

## 11. Implementation Order (ابدأ من هنا على طول)

1. Setup: env validation، DB connection، error handler، logger، response helpers.
2. Models/migrations: `Area`, `Store`, `User`, `RefreshToken`, `AuditLog` + الـ constraints.
3. Seed script لأول `OPERATION_MANAGER`.
4. Password + JWT utils.
5. `rateLimit` + `validate` middleware.
6. `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/me`, `/auth/change-password`.
7. `authenticate` + `authorize` + policies + `scopeGuard`.
8. Users module (CRUD) بتطبيق الـ matrix (قسم 3) بالكامل.
9. Areas & Stores (الأساسيات المطلوبة للـ users).
10. Audit logging.
11. Tests (قسم 12).
12. Docs: Swagger/OpenAPI أو Postman collection للـ endpoints.

---

## 12. Testing Requirements

لازم tests (unit + integration) تغطي على الأقل:
- Login: نجاح، باسورد غلط، حساب موقوف، حساب مقفول، rate limit.
- Refresh: rotation، reuse detection، token منتهي.
- كل خانة في الـ Permission Matrix: مسموح ✅ ومرفوض ❌.
- Scope isolation: Area Manager A ميقدرش يشوف/يعدّل حاجة في Area B. Store Manager ميقدرش يشوف store تاني.
- Privilege escalation: محاولة إنشاء يوزر بدور أعلى، تعديل `role` للنفس، تمرير `areaId`/`storeId` مزيف في الـ body.
- يوزر موقوف/محذوف توكنه بيتوقف يشتغل فورًا.

---

## 13. Rules لـ Claude أثناء التنفيذ

- ابدأ التنفيذ مباشرة بالترتيب في قسم 11، ومتسألش على حاجة عندها default معقول في الملف ده.
- أي قرار مش مغطى هنا: اختار الأكثر أمانًا وتقييدًا، واكتبه في "Open Questions".
- ممنوع تعمل shortcuts في الأمان (hardcoded secrets، تخطي الـ validation، فحص الأدوار في الـ frontend بس).
- كل route جديد لازم يعدي على الـ middleware chain (قسم 6.1)، ولازم يتحط له test.
- متعدلش الـ Permission Matrix من نفسك؛ التغيير يتم بتعديل الملف ده بس.

---

## 14. Open Questions (للمراجعة مع صاحب المشروع)

1. هل `STORE_USER` يقدر **يحدّث حالة الـ order** ولا قراءة فقط؟
2. هل Store ممكن يبقى له أكتر من `STORE_MANAGER` ولا واحد فقط؟
3. هل الـ `AREA_MANAGER` يقدر ينشئ/يعدّل Stores جوه الـ Area بتاعته ولا يعدّل بس؟
4. تسجيل الدخول بالـ email ولا بالـ phone (أو الاتنين)؟
5. هل في 2FA مطلوب لـ `OPERATION_MANAGER` في المراحل الجاية؟
6. صفحة "Stores" (`branch-manager`) و "Out of Coverage": تأكيد إنها لـ Operation + Area Manager فقط.
