// Simple in-memory cache with TTL (Time To Live)
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, { value, expiry: Date.now() + ttl });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
