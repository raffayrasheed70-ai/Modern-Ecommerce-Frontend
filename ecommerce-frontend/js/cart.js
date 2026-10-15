/**
 * cart.js
 * Cart model with localStorage persistence and a tiny pub/sub so the UI can
 * re-render whenever the cart changes.
 */
window.VELORA = window.VELORA || {};

(function (V) {
  'use strict';

  const STORAGE_KEY = 'velora.cart.v1';
  const MIN_QTY = 1;
  const MAX_QTY = 10;

  class Cart {
    constructor(storage = window.localStorage) {
      this.storage = storage;
      this.items = this.#load(); // [{ id, qty }]
      this.listeners = new Set();
    }

    // ---------- persistence ----------
    #load() {
      try {
        const raw = JSON.parse(this.storage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(raw)) return [];
        // Defensive: drop corrupt rows and products that no longer exist.
        return raw
          .filter((row) => row && V.getProductById(row.id))
          .map((row) => ({ id: Number(row.id), qty: Cart.clampQty(row.qty) }));
      } catch (err) {
        console.warn('[Cart] Could not read saved cart, starting empty.', err);
        return [];
      }
    }

    #save() {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch (err) {
        console.warn('[Cart] Could not persist cart (storage unavailable).', err);
      }
    }

    #emit() {
      this.#save();
      this.listeners.forEach((fn) => fn(this));
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    // ---------- helpers ----------
    static clampQty(qty) {
      const n = Math.floor(Number(qty));
      if (!Number.isFinite(n)) return MIN_QTY;
      return Math.min(MAX_QTY, Math.max(MIN_QTY, n));
    }

    // ---------- mutations ----------
    /** @returns {{ok:boolean, capped:boolean}} */
    add(productId, qty = 1) {
      const id = Number(productId);
      if (!V.getProductById(id)) return { ok: false, capped: false };
      const addQty = Cart.clampQty(qty);
      const existing = this.items.find((i) => i.id === id);
      let capped = false;
      if (existing) {
        const next = existing.qty + addQty;
        capped = next > MAX_QTY;
        existing.qty = Cart.clampQty(next);
      } else {
        this.items.push({ id, qty: addQty });
      }
      this.#emit();
      return { ok: true, capped };
    }

    setQty(productId, qty) {
      const item = this.items.find((i) => i.id === Number(productId));
      if (!item) return false;
      item.qty = Cart.clampQty(qty);
      this.#emit();
      return true;
    }

    increment(productId) {
      const item = this.items.find((i) => i.id === Number(productId));
      if (!item || item.qty >= MAX_QTY) return false;
      item.qty += 1;
      this.#emit();
      return true;
    }

    /** Decrementing never goes below 1; use remove() to delete a line. */
    decrement(productId) {
      const item = this.items.find((i) => i.id === Number(productId));
      if (!item || item.qty <= MIN_QTY) return false;
      item.qty -= 1;
      this.#emit();
      return true;
    }

    remove(productId) {
      const before = this.items.length;
      this.items = this.items.filter((i) => i.id !== Number(productId));
      if (this.items.length !== before) this.#emit();
      return this.items.length !== before;
    }

    clear() {
      this.items = [];
      this.#emit();
    }

    // ---------- derived data ----------
    /** Cart rows joined with their product records. */
    get detailed() {
      return this.items
        .map((row) => ({ ...row, product: V.getProductById(row.id) }))
        .filter((row) => row.product);
    }

    get count() {
      return this.items.reduce((sum, i) => sum + i.qty, 0);
    }

    get totals() {
      // Work in cents to avoid floating point drift.
      const subtotalCents = this.detailed.reduce(
        (sum, { product, qty }) => sum + Math.round(product.price * 100) * qty, 0);
      const thresholdCents = V.FREE_SHIPPING_THRESHOLD * 100;
      const empty = subtotalCents === 0;
      const freeShipping = !empty && subtotalCents >= thresholdCents;
      const shippingCents = empty || freeShipping ? 0 : V.SHIPPING_FEE * 100;
      return {
        subtotal: subtotalCents / 100,
        shipping: shippingCents / 100,
        total: (subtotalCents + shippingCents) / 100,
        freeShipping,
        remainingForFree: Math.max(0, thresholdCents - subtotalCents) / 100,
        progress: Math.min(100, (subtotalCents / thresholdCents) * 100),
      };
    }
  }

  Cart.MIN_QTY = MIN_QTY;
  Cart.MAX_QTY = MAX_QTY;
  V.Cart = Cart;
})(window.VELORA);
