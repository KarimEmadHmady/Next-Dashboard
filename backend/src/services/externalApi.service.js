import dotenv from 'dotenv';
import { logger } from '../utils/logger.util.js';
import { ExternalServiceError, ExternalServiceTimeoutError } from '../utils/errors.util.js';

dotenv.config();

/**
 * Decodes HTML entities (both numeric &#8220; and named &quot;)
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Normalizes latitude / longitude to finite number or null
 */
export function normalizeCoordinate(val) {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return Number.isFinite(num) ? num : null;
}

class ExternalApiClient {
  constructor() {
    this.baseUrl = (process.env.EXTERNAL_API_BASE_URL || 'https://backend.roxy-shawerma.com').replace(/\/+$/, '');
    this.lang = process.env.EXTERNAL_API_LANG || 'ar';
    this.timeoutMs = parseInt(process.env.EXTERNAL_API_TIMEOUT_MS || '10000', 10);

    // In-memory token cache
    this.cachedToken = null;
    this.cachedRefreshToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Resolve an auth token if configured; returns null if no credentials configured.
   */
  async getAuthToken(forceRefresh = false) {
    // 1. Static token takes precedence if provided in env
    if (process.env.EXTERNAL_API_TOKEN) {
      return process.env.EXTERNAL_API_TOKEN.trim();
    }

    const username = process.env.EXTERNAL_API_USERNAME;
    const password = process.env.EXTERNAL_API_PASSWORD;

    // If no credentials configured, return null (public endpoints will proceed without token)
    if (!username || !password) {
      return null;
    }

    // 2. Return cached token if valid and not forcing refresh (buffer 60 seconds)
    const now = Date.now();
    if (!forceRefresh && this.cachedToken && this.tokenExpiresAt && this.tokenExpiresAt - now > 60000) {
      return this.cachedToken;
    }

    // 3. If refresh token is available and forceRefresh is requested, try refresh endpoint first
    if (forceRefresh && this.cachedRefreshToken) {
      try {
        const refreshRes = await this.executeRawRequest('/wp-json/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.cachedRefreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.token || data.accessToken || data.data?.token || data.data?.accessToken;
          if (newToken) {
            this.cachedToken = newToken;
            if (data.refreshToken || data.data?.refreshToken) {
              this.cachedRefreshToken = data.refreshToken || data.data?.refreshToken;
            }
            // Assume 1 hour expiry if not specified
            const expiresInSec = data.expiresIn || data.data?.expiresIn || 3600;
            this.tokenExpiresAt = Date.now() + expiresInSec * 1000;
            return this.cachedToken;
          }
        }
      } catch (err) {
        logger.warn('External token refresh attempt failed, falling back to login');
      }
    }

    // 4. Authenticate via login endpoint
    try {
      const loginRes = await this.executeRawRequest('/wp-json/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: username,
          password: password,
        }),
      });

      if (!loginRes.ok) {
        throw new Error(`Login failed with status ${loginRes.status}`);
      }

      const data = await loginRes.json();
      const token = data.token || data.accessToken || data.data?.token || data.data?.accessToken;
      if (!token) {
        throw new Error('Token not found in login response');
      }

      this.cachedToken = token;
      this.cachedRefreshToken = data.refreshToken || data.data?.refreshToken || null;
      const expiresInSec = data.expiresIn || data.data?.expiresIn || 3600;
      this.tokenExpiresAt = Date.now() + expiresInSec * 1000;

      return this.cachedToken;
    } catch (err) {
      logger.error('Failed to authenticate external service account:', err.message);
      return null;
    }
  }

  /**
   * Raw low-level fetch with timeout
   */
  async executeRawRequest(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Main request method with token injection, timeout, retry (max 2 on network/5xx),
   * token refresh on 401 (1 retry), and safe logging.
   */
  async request(path, options = {}, retryCount = 0, isAuthRetry = false) {
    const startTime = Date.now();
    const method = options.method || 'GET';
    const token = await this.getAuthToken(isAuthRetry);

    const headers = {
      lang: this.lang,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    let response;
    try {
      response = await this.executeRawRequest(path, {
        ...options,
        headers,
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      if (err.name === 'AbortError') {
        logger.error(`[ExternalApi] ${method} ${path} - TIMEOUT (${duration}ms)`);
        throw new ExternalServiceTimeoutError('External store service timed out');
      }

      // Retry network errors up to 2 times
      if (retryCount < 2) {
        const backoff = (retryCount + 1) * 300;
        await new Promise((r) => setTimeout(r, backoff));
        return this.request(path, options, retryCount + 1, isAuthRetry);
      }

      logger.error(`[ExternalApi] ${method} ${path} - NETWORK_ERROR (${duration}ms)`);
      throw new ExternalServiceError('External store service is unavailable');
    }

    const duration = Date.now() - startTime;
    logger.info(`[ExternalApi] ${method} ${path} - Status: ${response.status} (${duration}ms)`);

    // Handle 401 with 1 token refresh retry (if credentials are configured)
    if (response.status === 401 && !isAuthRetry && (process.env.EXTERNAL_API_USERNAME || process.env.EXTERNAL_API_TOKEN)) {
      logger.warn(`[ExternalApi] 401 received for ${path}. Refreshing token and retrying once...`);
      return this.request(path, options, retryCount, true);
    }

    // Retry 5xx errors up to 2 times
    if (response.status >= 500 && retryCount < 2) {
      const backoff = (retryCount + 1) * 300;
      await new Promise((r) => setTimeout(r, backoff));
      return this.request(path, options, retryCount + 1, isAuthRetry);
    }

    if (response.status >= 500) {
      throw new ExternalServiceError('External store service returned a server error');
    }

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  }

  // ================== Areas & Branches APIs ==================

  /**
   * Fetch all external areas
   * Endpoint: GET /wp-json/api/v1/areas
   */
  async getAreas() {
    const res = await this.request('/wp-json/api/v1/areas');
    if (!res.ok) {
      throw new ExternalServiceError(`Failed to fetch areas from external API (status ${res.status})`);
    }

    const rawList = res.data?.data || res.data || [];
    if (!Array.isArray(rawList)) {
      throw new ExternalServiceError('Unexpected areas payload from external API');
    }

    return rawList.map((area) => ({
      externalId: Number(area.id),
      name: decodeHtmlEntities(area.name),
      slug: area.slug || null,
      description: area.description || '',
      lat: normalizeCoordinate(area.lat),
      lng: normalizeCoordinate(area.long !== undefined ? area.long : area.lng),
    }));
  }

  /**
   * Fetch branches for an area
   * Endpoint: GET /wp-json/api/v1/areas/{areaId}/branches/
   */
  async getBranchesByArea(areaExternalId) {
    const res = await this.request(`/wp-json/api/v1/areas/${areaExternalId}/branches/`);
    if (!res.ok) {
      throw new ExternalServiceError(
        `Failed to fetch branches for area ${areaExternalId} from external API (status ${res.status})`
      );
    }

    const rawList = res.data?.data || res.data || [];
    if (!Array.isArray(rawList)) {
      return [];
    }

    return rawList.map((branch) => ({
      externalId: Number(branch.id),
      name: decodeHtmlEntities(branch.title || branch.name),
      lat: normalizeCoordinate(branch.lat),
      lng: normalizeCoordinate(branch.long !== undefined ? branch.long : branch.lng),
    }));
  }

  // ================== Orders APIs (Stubs - Blocked: awaiting order shape) ==================

  /**
   * Admin Orders (blocked: awaiting credentials or sample order shape to determine branch linkage)
   */
  async getAdminOrders(params = {}) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new ExternalServiceError('External credentials not configured for orders module');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page);
    if (params.limit) queryParams.set('limit', params.limit);
    if (params.status) queryParams.set('status', params.status);
    if (params.search) queryParams.set('search', params.search);
    if (params.orderby) queryParams.set('orderby', params.orderby);
    if (params.order) queryParams.set('order', params.order);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/wp-json/api/v1/admin/orders${queryString}`);
  }

  async getOrderById(orderId) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new ExternalServiceError('External credentials not configured for orders module');
    }
    return this.request(`/wp-json/api/v1/order/${orderId}`);
  }

  async getOrderTimeline(orderId) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new ExternalServiceError('External credentials not configured for orders module');
    }
    return this.request(`/wp-json/api/v1/orders/${orderId}/timeline`);
  }

  async getOrderStatuses() {
    return this.request('/wp-json/api/v1/orders/statuses');
  }
}

export const externalApi = new ExternalApiClient();
