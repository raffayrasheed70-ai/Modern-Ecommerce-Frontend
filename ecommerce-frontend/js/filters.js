/**
 * filters.js
 * Pure filtering / searching / sorting logic. No DOM access, which keeps it
 * easy to unit-test and reuse.
 */
window.VELORA = window.VELORA || {};

(function (V) {
  'use strict';

  const DEFAULT_STATE = Object.freeze({
    search: '',
    category: 'all',
    minPrice: null,
    maxPrice: null,
    minRating: 0,
    onSale: false,
    wishlistOnly: false,
    sort: 'featured',
  });

  const SORTERS = {
    featured: null, // keep catalogue order
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
    newest: (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
  };

  const SORT_LABELS = {
    featured: 'Featured',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    rating: 'Top Rated',
    newest: 'Newest',
  };

  /** Normalises a raw numeric input value to a non-negative number or null. */
  const toPrice = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  /**
   * Applies every active filter at once, then sorts.
   * @param {Array} products
   * @param {object} state
   * @param {Set<number>|number[]} wishlistIds
   */
  function applyFilters(products, state, wishlistIds = []) {
    const s = { ...DEFAULT_STATE, ...state };
    const term = s.search.trim().toLowerCase();
    const saved = wishlistIds instanceof Set ? wishlistIds : new Set(wishlistIds);

    let min = toPrice(s.minPrice);
    let max = toPrice(s.maxPrice);
    // Forgive a swapped range instead of silently showing nothing.
    if (min !== null && max !== null && min > max) [min, max] = [max, min];

    const result = products.filter((p) => {
      if (term && !p.name.toLowerCase().includes(term)) return false;
      if (s.category !== 'all' && p.category !== s.category) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      if (p.rating < s.minRating) return false;
      if (s.onSale && !(p.originalPrice && p.originalPrice > p.price)) return false;
      if (s.wishlistOnly && !saved.has(p.id)) return false;
      return true;
    });

    const sorter = SORTERS[s.sort];
    return sorter ? [...result].sort(sorter) : result;
  }

  /**
   * Builds the list of "active filter" chips shown above the grid.
   * Each chip knows which state keys to reset when removed.
   */
  function getActiveFilters(state) {
    const s = { ...DEFAULT_STATE, ...state };
    const chips = [];
    if (s.search.trim()) chips.push({ key: 'search', label: `Search: "${s.search.trim()}"` });
    if (s.category !== 'all') chips.push({ key: 'category', label: s.category });
    let min = toPrice(s.minPrice);
    let max = toPrice(s.maxPrice);
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    if (min !== null || max !== null) {
      const label =
        min !== null && max !== null ? `$${min} – $${max}`
        : min !== null ? `From $${min}`
        : `Up to $${max}`;
      chips.push({ key: 'price', label });
    }
    if (s.minRating > 0) chips.push({ key: 'minRating', label: `${s.minRating}★ & up` });
    if (s.onSale) chips.push({ key: 'onSale', label: 'On sale' });
    if (s.wishlistOnly) chips.push({ key: 'wishlistOnly', label: 'Wishlist' });
    return chips;
  }

  /** Returns a new state with the given chip key reset to its default. */
  function resetFilter(state, key) {
    const next = { ...state };
    if (key === 'price') {
      next.minPrice = DEFAULT_STATE.minPrice;
      next.maxPrice = DEFAULT_STATE.maxPrice;
    } else if (key in DEFAULT_STATE) {
      next[key] = DEFAULT_STATE[key];
    }
    return next;
  }

  /** Counts products per category (respecting nothing but the catalogue itself). */
  const countByCategory = (products) =>
    products.reduce((acc, p) => ((acc[p.category] = (acc[p.category] || 0) + 1), acc), {});

  const hasActiveFilters = (state) => getActiveFilters(state).length > 0;

  V.Filters = {
    DEFAULT_STATE, SORT_LABELS, applyFilters, getActiveFilters, resetFilter,
    countByCategory, hasActiveFilters, toPrice,
  };
})(window.VELORA);
