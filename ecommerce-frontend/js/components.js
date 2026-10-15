/**
 * components.js
 * Reusable UI "components": pure functions that take data and return HTML
 * strings (or DOM nodes for toasts). No state and no event listeners here —
 * app.js owns behaviour via event delegation.
 */
window.VELORA = window.VELORA || {};

(function (V) {
  'use strict';

  const { escapeHTML: esc, formatPrice: money, discountPercent } = V;

  /** Star rating (supports half stars) with an accessible text label. */
  function Stars(rating) {
    const rounded = Math.round(rating * 2) / 2;
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const icon = rounded >= i ? 'bi-star-fill' : rounded >= i - 0.5 ? 'bi-star-half' : 'bi-star';
      html += `<i class="bi ${icon}" aria-hidden="true"></i>`;
    }
    return `<span class="stars" role="img" aria-label="Rated ${rating.toFixed(1)} out of 5">${html}</span>`;
  }

  /** Badges: discount %, bestseller / new. */
  function Badges(p) {
    const pct = discountPercent(p);
    return [
      pct ? `<span class="badge-pill badge-sale">-${pct}%</span>` : '',
      p.badge === 'Bestseller' ? '<span class="badge-pill badge-best">Bestseller</span>' : '',
      p.badge === 'New' ? '<span class="badge-pill badge-new">New</span>' : '',
    ].join('');
  }

  function Price(p) {
    return `<span class="now">${money(p.price)}</span>${
      p.originalPrice ? `<span class="was"><span class="visually-hidden">Was </span>${money(p.originalPrice)}</span>` : ''
    }`;
  }

  /**
   * Product card. `index` only staggers the entrance animation.
   * @param {object} p product
   * @param {{wished:boolean, index:number, cols:string}} opts
   */
  function ProductCard(p, { wished = false, index = 0, cols = 'col-6 col-md-4' } = {}) {
    return `
      <div class="${cols}">
        <article class="product-card card-in" style="--i:${Math.min(index, 12)}" data-id="${p.id}">
          <div class="pc-media">
            <div class="pc-badges">${Badges(p)}</div>
            <button type="button" class="pc-wish ${wished ? 'is-active' : ''}" data-action="wish" data-id="${p.id}"
                    aria-pressed="${wished}" aria-label="${wished ? 'Remove' : 'Add'} ${esc(p.name)} ${wished ? 'from' : 'to'} wishlist">
              <i class="bi bi-heart" aria-hidden="true"></i>
            </button>
            <img src="${p.image}" alt="${esc(p.name)}" loading="lazy" width="800" height="1000" decoding="async">
            <button type="button" class="pc-quick" data-action="quick-view" data-id="${p.id}" aria-label="Quick view ${esc(p.name)}">
              <i class="bi bi-eye me-1" aria-hidden="true"></i> Quick view
            </button>
          </div>
          <div class="pc-body">
            <span class="pc-cat">${esc(p.category)}</span>
            <h3 class="pc-title">${esc(p.name)}</h3>
            <div class="pc-rating">${Stars(p.rating)}<span>${p.rating.toFixed(1)} (${p.reviews})</span></div>
            <div class="pc-foot">
              <div class="pc-price">${Price(p)}</div>
              <button type="button" class="pc-add" data-action="add-to-cart" data-id="${p.id}" aria-label="Add ${esc(p.name)} to cart">
                <i class="bi bi-bag-plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </article>
      </div>`;
  }

  /** Loading placeholder shown while the catalogue "loads". */
  function SkeletonCard(cols = 'col-6 col-md-4') {
    return `
      <div class="${cols}" aria-hidden="true">
        <div class="skeleton-card">
          <div class="sk sk-img"></div>
          <div class="sk sk-line w-50"></div>
          <div class="sk sk-line w-75"></div>
          <div class="sk sk-line w-30"></div>
        </div>
      </div>`;
  }

  function CategoryCard(c, count) {
    return `
      <div class="col-6 col-lg-3 reveal">
        <button type="button" class="cat-card" data-action="pick-category" data-category="${esc(c.name)}"
                aria-label="Shop ${esc(c.name)}, ${count} products">
          <img src="${c.image}" alt="" loading="lazy" width="700" height="875">
          <div class="cat-info">
            <div><h3>${esc(c.name)}</h3><small>${count} products · ${esc(c.blurb)}</small></div>
            <span class="cat-arrow" aria-hidden="true"><i class="bi bi-arrow-right"></i></span>
          </div>
        </button>
      </div>`;
  }

  /** Sidebar radio options for categories (with live counts). */
  function CategoryOptions(categories, counts, selected) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const opt = (value, label, n) => `
      <label class="filter-option">
        <input type="radio" name="category" value="${esc(value)}" ${selected === value ? 'checked' : ''}>
        <span>${esc(label)}</span><span class="n">${n}</span>
      </label>`;
    return opt('all', 'All categories', total) + categories.map((c) => opt(c.name, c.name, counts[c.name] || 0)).join('');
  }

  function RatingOptions(selected) {
    const opts = [
      [0, 'Any rating'],
      [4.5, '4.5 & up'],
      [4, '4.0 & up'],
      [3, '3.0 & up'],
    ];
    return opts.map(([value, label]) => `
      <label class="filter-option">
        <input type="radio" name="rating" value="${value}" ${Number(selected) === value ? 'checked' : ''}>
        ${value ? Stars(value) : ''}<span>${label}</span>
      </label>`).join('');
  }

  /** Active filter chips, plus a "Clear all" chip when more than one is set. */
  function ActiveFilterChips(chips) {
    if (!chips.length) return '';
    const items = chips.map((c) => `
      <button type="button" class="chip" data-action="remove-filter" data-key="${c.key}" aria-label="Remove filter: ${esc(c.label)}">
        ${esc(c.label)}<i class="bi bi-x" aria-hidden="true"></i>
      </button>`).join('');
    const clear = chips.length > 1
      ? '<button type="button" class="chip chip-clear" data-action="clear-filters">Clear all</button>' : '';
    return items + clear;
  }

  function CartItem({ product: p, qty }, maxQty) {
    return `
      <div class="cart-item" data-id="${p.id}">
        <img class="ci-img" src="${p.image}" alt="${esc(p.name)}" width="84" height="104" loading="lazy">
        <div>
          <div class="ci-top">
            <div><h3 class="ci-title">${esc(p.name)}</h3><span class="ci-cat">${esc(p.category)}</span></div>
            <button type="button" class="ci-remove" data-action="cart-remove" data-id="${p.id}" aria-label="Remove ${esc(p.name)} from cart">
              <i class="bi bi-trash3" aria-hidden="true"></i>
            </button>
          </div>
          <div class="ci-bottom">
            <div class="qty" role="group" aria-label="Quantity for ${esc(p.name)}">
              <button type="button" data-action="cart-dec" data-id="${p.id}" aria-label="Decrease quantity" ${qty <= 1 ? 'disabled' : ''}><i class="bi bi-dash" aria-hidden="true"></i></button>
              <output aria-live="polite">${qty}</output>
              <button type="button" data-action="cart-inc" data-id="${p.id}" aria-label="Increase quantity" ${qty >= maxQty ? 'disabled' : ''}><i class="bi bi-plus" aria-hidden="true"></i></button>
            </div>
            <div class="ci-line">${money(p.price * qty)}${qty > 1 ? `<span class="ci-unit">${money(p.price)} each</span>` : ''}</div>
          </div>
        </div>
      </div>`;
  }

  function EmptyCart() {
    return `
      <div class="cart-empty">
        <div class="empty-icon"><i class="bi bi-bag" aria-hidden="true"></i></div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven’t added anything yet.</p>
        <button type="button" class="btn btn-accent" data-action="continue-shopping">Start shopping</button>
      </div>`;
  }

  function ShippingProgress(t) {
    if (t.subtotal === 0) return { html: '', free: false };
    const html = t.freeShipping
      ? '<i class="bi bi-check-circle-fill me-1" aria-hidden="true"></i> You’ve unlocked free shipping!'
      : `Add <strong>${money(t.remainingForFree)}</strong> more for free shipping`;
    return {
      free: t.freeShipping,
      html: `${html}<div class="ship-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(t.progress)}" aria-label="Progress to free shipping"><span style="width:${t.progress}%"></span></div>`,
    };
  }

  /** Quick view modal content. */
  function QuickView(p, { wished = false, maxQty = 10 } = {}) {
    const pct = discountPercent(p);
    return `
      <button type="button" class="btn-close qv-close" data-bs-dismiss="modal" aria-label="Close quick view"></button>
      <div class="qv" data-id="${p.id}">
        <div class="qv-media">
          <div class="pc-badges">${Badges(p)}</div>
          <img src="${p.image.replace('w=800', 'w=1000')}" alt="${esc(p.name)}" width="1000" height="1250">
        </div>
        <div class="qv-body">
          <span class="pc-cat">${esc(p.category)}</span>
          <h2 class="qv-title" id="qvTitle">${esc(p.name)}</h2>
          <div class="pc-rating">${Stars(p.rating)}<span>${p.rating.toFixed(1)} · ${p.reviews} reviews</span></div>
          <div class="qv-price">
            <span class="now">${money(p.price)}</span>
            ${p.originalPrice ? `<span class="was">${money(p.originalPrice)}</span><span class="save">Save ${pct}%</span>` : ''}
          </div>
          <p class="qv-desc">${esc(p.description)}</p>
          <div class="qv-actions">
            <div class="qty" role="group" aria-label="Quantity">
              <button type="button" data-action="qv-dec" aria-label="Decrease quantity"><i class="bi bi-dash" aria-hidden="true"></i></button>
              <output id="qvQty" aria-live="polite">1</output>
              <button type="button" data-action="qv-inc" aria-label="Increase quantity"><i class="bi bi-plus" aria-hidden="true"></i></button>
            </div>
            <button type="button" class="btn btn-accent btn-lg" data-action="qv-add" data-id="${p.id}"><i class="bi bi-bag-plus me-2" aria-hidden="true"></i>Add to cart</button>
            <button type="button" class="qv-wish ${wished ? 'is-active' : ''}" data-action="wish" data-id="${p.id}" aria-pressed="${wished}" aria-label="${wished ? 'Remove from' : 'Add to'} wishlist">
              <i class="bi bi-heart" aria-hidden="true"></i>
            </button>
          </div>
          <p class="visually-hidden">Maximum ${maxQty} per order.</p>
          <div class="qv-meta">
            <span><i class="bi bi-truck" aria-hidden="true"></i>Free shipping over $100</span>
            <span><i class="bi bi-arrow-repeat" aria-hidden="true"></i>30-day returns</span>
          </div>
        </div>
      </div>`;
  }

  /** Toast DOM node. type: success | info | warn */
  function Toast(message, type = 'success') {
    const icons = { success: 'bi-check-circle-fill', info: 'bi-info-circle-fill', warn: 'bi-exclamation-triangle-fill' };
    const el = document.createElement('div');
    el.className = `toast t-${type}`;
    el.setAttribute('role', type === 'warn' ? 'alert' : 'status');
    el.setAttribute('aria-live', type === 'warn' ? 'assertive' : 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
      <div class="toast-body">
        <i class="bi ${icons[type] || icons.info} t-icon" aria-hidden="true"></i>
        <span>${esc(message)}</span>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Dismiss notification"></button>
      </div>`;
    return el;
  }

  V.UI = {
    Stars, ProductCard, SkeletonCard, CategoryCard, CategoryOptions, RatingOptions,
    ActiveFilterChips, CartItem, EmptyCart, ShippingProgress, QuickView, Toast,
  };
})(window.VELORA);
