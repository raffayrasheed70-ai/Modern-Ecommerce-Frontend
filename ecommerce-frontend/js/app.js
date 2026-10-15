/**
 * app.js
 * Application controller. Owns the state, wires events (via delegation) and
 * calls the pure modules (Filters, Cart, Wishlist) and UI components.
 */
(function (V) {
  'use strict';

  const { PRODUCTS, CATEGORIES, Filters, UI, Cart, Wishlist, formatPrice: money } = V;

  // ---------- tiny DOM helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const debounce = (fn, wait = 200) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };

  /** localStorage can throw (private mode, blocked cookies) — fall back to memory. */
  function getStorage() {
    try {
      const s = window.localStorage;
      const probe = '__velora_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch (err) {
      console.warn('[Storage] localStorage unavailable, using in-memory storage.', err);
      const mem = {};
      return {
        getItem: (k) => (k in mem ? mem[k] : null),
        setItem: (k, v) => { mem[k] = String(v); },
        removeItem: (k) => { delete mem[k]; },
      };
    }
  }

  // ---------- state ----------
  const storage = getStorage();
  const cart = new Cart(storage);
  const wishlist = new Wishlist(storage);
  let filterState = { ...Filters.DEFAULT_STATE };
  let catalogueReady = false;
  let quickViewQty = 1;
  let lastCartCount = cart.count;
  let lastWishCount = wishlist.count;

  // ---------- element cache ----------
  const els = {};
  function cacheElements() {
    [
      'siteHeader', 'searchToggle', 'searchBar', 'searchForm', 'searchInput', 'searchClose',
      'wishlistBadge', 'cartBadge', 'categoryGrid', 'categoryFilters', 'ratingFilters',
      'minPrice', 'maxPrice', 'onSale', 'wishlistOnly', 'sortSelect', 'resultCount',
      'activeFilters', 'productGrid', 'noResults', 'drawerCount', 'filterDot', 'featuredGrid',
      'cartDrawer', 'cartItems', 'cartFooter', 'cartHeaderCount', 'shipProgress',
      'cartSubtotal', 'cartShipping', 'cartTotal', 'quickViewModal', 'quickViewBody',
      'toastContainer', 'newsletterForm', 'newsletterEmail', 'newsletterFeedback', 'mainNav', 'year',
    ].forEach((id) => { els[id] = document.getElementById(id); });
  }

  // ---------- helpers ----------
  const scrollToShop = () => document.getElementById('shop')?.scrollIntoView();

  function hideOffcanvas(el) {
    if (el && window.bootstrap) bootstrap.Offcanvas.getOrCreateInstance(el).hide();
  }
  function closeMobileNav() {
    if (els.mainNav?.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(els.mainNav).hide();
  }

  function showToast(message, type = 'success') {
    const container = els.toastContainer;
    // Keep the stack short so rapid actions don't flood the screen.
    while (container.children.length >= 3) container.firstElementChild.remove();
    const el = UI.Toast(message, type);
    container.append(el);
    const toast = new bootstrap.Toast(el, { delay: type === 'warn' ? 4000 : 2600 });
    el.addEventListener('hidden.bs.toast', () => el.remove());
    toast.show();
  }

  // ---------- catalogue rendering ----------
  function renderSkeletons(count = 6) {
    els.productGrid.setAttribute('aria-busy', 'true');
    els.productGrid.innerHTML = Array.from({ length: count }, () => UI.SkeletonCard()).join('');
  }

  function getResults() {
    return Filters.applyFilters(PRODUCTS, filterState, wishlist.ids);
  }

  function renderProducts() {
    const results = getResults();
    const chips = Filters.getActiveFilters(filterState);

    els.productGrid.setAttribute('aria-busy', 'false');
    els.productGrid.innerHTML = results
      .map((p, i) => UI.ProductCard(p, { wished: wishlist.has(p.id), index: i }))
      .join('');

    els.noResults.hidden = results.length > 0;
    if (!results.length) updateNoResultsCopy();

    const n = results.length;
    els.resultCount.innerHTML = `Showing <strong>${n}</strong> of ${PRODUCTS.length} product${PRODUCTS.length === 1 ? '' : 's'}`;
    els.drawerCount.textContent = n;
    els.activeFilters.innerHTML = UI.ActiveFilterChips(chips);
    els.filterDot.hidden = chips.length === 0;
  }

  function updateNoResultsCopy() {
    const title = $('h3', els.noResults);
    const text = $('p', els.noResults);
    if (filterState.wishlistOnly && wishlist.count === 0) {
      title.textContent = 'Your wishlist is empty';
      text.textContent = 'Tap the heart on any product to save it here for later.';
    } else {
      title.textContent = 'No products match your filters';
      text.textContent = 'Try a different search term, widen the price range or remove a filter.';
    }
  }

  /** Push filterState back into the form controls (after chips / reset / category cards). */
  function syncControls({ skipPrice = false, skipSearch = false } = {}) {
    $$('input[name="category"]', els.categoryFilters).forEach((r) => { r.checked = r.value === filterState.category; });
    $$('input[name="rating"]', els.ratingFilters).forEach((r) => { r.checked = Number(r.value) === filterState.minRating; });
    if (!skipPrice) {
      els.minPrice.value = filterState.minPrice ?? '';
      els.maxPrice.value = filterState.maxPrice ?? '';
    }
    if (!skipSearch) els.searchInput.value = filterState.search;
    els.onSale.checked = filterState.onSale;
    els.wishlistOnly.checked = filterState.wishlistOnly;
    els.sortSelect.value = filterState.sort;
  }

  function setFilters(patch, { sync = true, scroll = false, syncOpts } = {}) {
    filterState = { ...filterState, ...patch };
    if (sync) syncControls(syncOpts);
    if (catalogueReady) renderProducts();
    if (scroll) scrollToShop();
  }

  const resetFilters = (opts) => setFilters({ ...Filters.DEFAULT_STATE }, opts);

  // ---------- one-off renders ----------
  function renderCategories() {
    const counts = Filters.countByCategory(PRODUCTS);
    els.categoryGrid.innerHTML = CATEGORIES.map((c) => UI.CategoryCard(c, counts[c.name] || 0)).join('');
    els.categoryFilters.innerHTML = UI.CategoryOptions(CATEGORIES, counts, filterState.category);
    els.ratingFilters.innerHTML = UI.RatingOptions(filterState.minRating);
  }

  function renderFeatured() {
    const featured = PRODUCTS.filter((p) => p.badge === 'Bestseller')
      .sort((a, b) => b.rating - a.rating).slice(0, 4);
    els.featuredGrid.innerHTML = featured
      .map((p, i) => UI.ProductCard(p, { wished: wishlist.has(p.id), index: i, cols: 'col-6 col-lg-3' }))
      .join('');
  }

  // ---------- cart rendering ----------
  function renderCart() {
    const rows = cart.detailed;
    const count = cart.count;
    const t = cart.totals;

    // Badge
    els.cartBadge.textContent = count;
    els.cartBadge.hidden = count === 0;
    if (count > lastCartCount) {
      els.cartBadge.classList.remove('bump');
      void els.cartBadge.offsetWidth; // restart the animation
      els.cartBadge.classList.add('bump');
    }
    lastCartCount = count;

    els.cartHeaderCount.textContent = count ? `(${count} item${count === 1 ? '' : 's'})` : '';

    if (!rows.length) {
      els.cartItems.innerHTML = UI.EmptyCart();
      els.cartFooter.hidden = true;
      els.shipProgress.hidden = true;
      return;
    }

    els.cartItems.innerHTML = rows.map((r) => UI.CartItem(r, Cart.MAX_QTY)).join('');
    els.cartFooter.hidden = false;
    els.cartSubtotal.textContent = money(t.subtotal);
    els.cartShipping.textContent = t.freeShipping ? 'Free' : money(t.shipping);
    els.cartTotal.textContent = money(t.total);

    const progress = UI.ShippingProgress(t);
    els.shipProgress.hidden = false;
    els.shipProgress.innerHTML = progress.html;
    els.shipProgress.classList.toggle('is-free', progress.free);
  }

  function renderWishlistBadge() {
    els.wishlistBadge.textContent = wishlist.count;
    els.wishlistBadge.hidden = wishlist.count === 0;
    if (wishlist.count > lastWishCount) {
      els.wishlistBadge.classList.remove('bump');
      void els.wishlistBadge.offsetWidth;
      els.wishlistBadge.classList.add('bump');
    }
    lastWishCount = wishlist.count;
  }

  /** Update every heart button for a product without re-rendering the grid. */
  function updateWishButtons(id, saved) {
    const p = V.getProductById(id);
    $$(`[data-action="wish"][data-id="${id}"]`).forEach((btn) => {
      btn.classList.toggle('is-active', saved);
      btn.setAttribute('aria-pressed', String(saved));
      btn.setAttribute('aria-label', btn.classList.contains('qv-wish')
        ? `${saved ? 'Remove from' : 'Add to'} wishlist`
        : `${saved ? 'Remove' : 'Add'} ${p.name} ${saved ? 'from' : 'to'} wishlist`);
      if (btn.classList.contains('pc-wish')) {
        btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      }
    });
  }

  // ---------- actions ----------
  function addToCart(id, qty = 1, triggerBtn = null) {
    const p = V.getProductById(id);
    const res = cart.add(id, qty);
    if (!res.ok) { showToast('Sorry, that product is unavailable.', 'warn'); return false; }
    if (res.capped) {
      showToast(`Maximum of ${Cart.MAX_QTY} per item reached for ${p.name}.`, 'warn');
    } else {
      showToast(`${p.name} added to cart`);
    }
    if (triggerBtn && triggerBtn.classList.contains('pc-add')) {
      triggerBtn.classList.add('added');
      triggerBtn.innerHTML = '<i class="bi bi-check-lg" aria-hidden="true"></i>';
      setTimeout(() => {
        triggerBtn.classList.remove('added');
        triggerBtn.innerHTML = '<i class="bi bi-bag-plus" aria-hidden="true"></i>';
      }, 1200);
    }
    return true;
  }

  function toggleWishlist(id) {
    const p = V.getProductById(id);
    if (!p) return;
    const saved = wishlist.toggle(id);
    updateWishButtons(id, saved);
    showToast(saved ? `${p.name} saved to wishlist` : `${p.name} removed from wishlist`, saved ? 'success' : 'info');
    // In wishlist view the removed card should disappear straight away.
    if (filterState.wishlistOnly) renderProducts();
  }

  function openQuickView(id) {
    const p = V.getProductById(id);
    if (!p) return;
    quickViewQty = 1;
    els.quickViewBody.innerHTML = UI.QuickView(p, { wished: wishlist.has(id), maxQty: Cart.MAX_QTY });
    bootstrap.Modal.getOrCreateInstance(els.quickViewModal).show();
  }

  function setQuickViewQty(next) {
    quickViewQty = Math.min(Cart.MAX_QTY, Math.max(Cart.MIN_QTY, next));
    const out = $('#qvQty');
    if (out) out.textContent = quickViewQty;
  }

  function showSale() {
    resetFilters({ sync: false });
    setFilters({ onSale: true, sort: 'price-asc' });
  }

  // ---------- event delegation ----------
  const actions = {
    'add-to-cart': (btn) => addToCart(btn.dataset.id, 1, btn),
    wish: (btn) => toggleWishlist(btn.dataset.id),
    'quick-view': (btn) => openQuickView(btn.dataset.id),

    'qv-inc': () => setQuickViewQty(quickViewQty + 1),
    'qv-dec': () => setQuickViewQty(quickViewQty - 1),
    'qv-add': (btn) => {
      if (addToCart(btn.dataset.id, quickViewQty)) bootstrap.Modal.getOrCreateInstance(els.quickViewModal).hide();
    },

    'cart-inc': (btn) => { if (!cart.increment(btn.dataset.id)) showToast(`Maximum of ${Cart.MAX_QTY} per item.`, 'warn'); },
    'cart-dec': (btn) => cart.decrement(btn.dataset.id),
    'cart-remove': (btn) => {
      const p = V.getProductById(btn.dataset.id);
      if (cart.remove(btn.dataset.id)) showToast(`${p.name} removed from cart`, 'info');
    },
    'clear-cart': () => { if (cart.count) { cart.clear(); showToast('Cart cleared', 'info'); } },
    checkout: () => showToast('This is a demo store — checkout isn’t connected, so no order was placed.', 'info'),
    'continue-shopping': () => { hideOffcanvas(els.cartDrawer); scrollToShop(); },

    'pick-category': (btn) => setFilters({ category: btn.dataset.category }, { scroll: true }),
    'clear-filters': () => resetFilters(),
    'remove-filter': (btn) => {
      filterState = Filters.resetFilter(filterState, btn.dataset.key);
      syncControls();
      renderProducts();
    },
    'shop-sale': () => { showSale(); closeMobileNav(); },
    'show-all': () => { resetFilters(); closeMobileNav(); },
    'show-wishlist': () => { setFilters({ wishlistOnly: true }, { scroll: true }); closeMobileNav(); },
  };

  function onDocumentClick(e) {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl && actions[actionEl.dataset.action]) {
      actions[actionEl.dataset.action](actionEl, e);
      return;
    }

    // Footer category links
    const catLink = e.target.closest('a[data-category]');
    if (catLink) {
      setFilters({ category: catLink.dataset.category });
      return; // the href="#shop" handles the scroll
    }

    // Close the mobile menu after choosing an in-page link
    if (e.target.closest('#mainNav .nav-link')) closeMobileNav();
  }

  // ---------- filter form wiring ----------
  function bindFilters() {
    els.categoryFilters.addEventListener('change', (e) => {
      if (e.target.name === 'category') setFilters({ category: e.target.value }, { sync: false });
    });
    els.ratingFilters.addEventListener('change', (e) => {
      if (e.target.name === 'rating') setFilters({ minRating: Number(e.target.value) }, { sync: false });
    });

    const onPrice = debounce(() => {
      setFilters({
        minPrice: Filters.toPrice(els.minPrice.value),
        maxPrice: Filters.toPrice(els.maxPrice.value),
      }, { sync: false });
    }, 250);
    els.minPrice.addEventListener('input', onPrice);
    els.maxPrice.addEventListener('input', onPrice);

    els.onSale.addEventListener('change', () => setFilters({ onSale: els.onSale.checked }, { sync: false }));
    els.wishlistOnly.addEventListener('change', () => setFilters({ wishlistOnly: els.wishlistOnly.checked }, { sync: false }));
    els.sortSelect.addEventListener('change', () => setFilters({ sort: els.sortSelect.value }, { sync: false }));
  }

  // ---------- search ----------
  function setSearchOpen(open) {
    els.searchBar.hidden = !open;
    els.searchToggle.setAttribute('aria-expanded', String(open));
    els.searchToggle.classList.toggle('is-active', open);
    if (open) els.searchInput.focus();
    else els.searchToggle.focus();
  }

  function bindSearch() {
    els.searchToggle.addEventListener('click', () => setSearchOpen(els.searchBar.hidden));
    els.searchClose.addEventListener('click', () => setSearchOpen(false));
    els.searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') setSearchOpen(false); });

    const onType = debounce(() => {
      setFilters({ search: els.searchInput.value }, { syncOpts: { skipSearch: true } });
    }, 150);
    els.searchInput.addEventListener('input', onType);

    els.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      setFilters({ search: els.searchInput.value }, { syncOpts: { skipSearch: true }, scroll: true });
    });
  }

  // ---------- newsletter ----------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function bindNewsletter() {
    const { newsletterForm: form, newsletterEmail: input, newsletterFeedback: out } = els;

    const setFeedback = (msg, kind) => {
      out.textContent = msg;
      out.className = `newsletter-feedback ${kind ? `is-${kind}` : ''}`;
      input.setAttribute('aria-invalid', String(kind === 'error'));
    };

    input.addEventListener('input', () => { if (out.classList.contains('is-error')) setFeedback('', null); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email) return setFeedback('Please enter your email address.', 'error'), input.focus();
      if (!EMAIL_RE.test(email)) return setFeedback('That doesn’t look like a valid email address.', 'error'), input.focus();
      // Frontend-only demo: nothing is sent anywhere.
      setFeedback('Thanks for subscribing! (Demo only — your email was not sent or stored.)', 'success');
      form.reset();
    });
  }

  // ---------- visual polish ----------
  function bindHeaderScroll() {
    let ticking = false;
    const update = () => { els.siteHeader.classList.toggle('is-scrolled', window.scrollY > 8); ticking = false; };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function initReveal() {
    const targets = $$('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /** Fade images in once loaded; swap in a placeholder if a remote image fails. */
  function bindImageEvents() {
    document.addEventListener('load', (e) => {
      if (e.target.tagName === 'IMG') e.target.classList.add('is-loaded');
    }, true);
    document.addEventListener('error', (e) => {
      const img = e.target;
      if (img.tagName !== 'IMG' || img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = V.FALLBACK_IMG;
      img.classList.add('is-loaded');
    }, true);
  }

  // ---------- init ----------
  function init() {
    cacheElements();
    els.year.textContent = new Date().getFullYear();

    bindImageEvents();
    renderCategories();
    renderFeatured();
    renderCart();
    renderWishlistBadge();
    renderSkeletons();

    cart.subscribe(renderCart);
    wishlist.subscribe(renderWishlistBadge);

    document.addEventListener('click', onDocumentClick);
    bindFilters();
    bindSearch();
    bindNewsletter();
    bindHeaderScroll();
    initReveal();

    // Brief skeleton state so the first paint feels intentional.
    setTimeout(() => {
      catalogueReady = true;
      renderProducts();
    }, prefersReducedMotion ? 0 : 500);
  }

  if (!V.PRODUCTS || !V.Filters || !V.Cart || !V.Wishlist || !V.UI) {
    console.error('[VELORA] A script failed to load. Check the <script> order in index.html.');
    return;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.VELORA);
