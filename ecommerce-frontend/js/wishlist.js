/**
 * wishlist.js
 * Wishlist model persisted to localStorage, with the same subscribe pattern as Cart.
 */
window.VELORA = window.VELORA || {};

(function (V) {
  'use strict';

  const STORAGE_KEY = 'velora.wishlist.v1';

  class Wishlist {
    constructor(storage = window.localStorage) {
      this.storage = storage;
      this.ids = new Set(this.#load());
      this.listeners = new Set();
    }

    #load() {
      try {
        const raw = JSON.parse(this.storage.getItem(STORAGE_KEY) || '[]');
        if (!Array.isArray(raw)) return [];
        return raw.map(Number).filter((id) => V.getProductById(id));
      } catch (err) {
        console.warn('[Wishlist] Could not read saved wishlist, starting empty.', err);
        return [];
      }
    }

    #emit() {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify([...this.ids]));
      } catch (err) {
        console.warn('[Wishlist] Could not persist wishlist.', err);
      }
      this.listeners.forEach((fn) => fn(this));
    }

    subscribe(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    has(id) {
      return this.ids.has(Number(id));
    }

    /** @returns {boolean} true if the product is now saved, false if removed */
    toggle(id) {
      const n = Number(id);
      if (!V.getProductById(n)) return false;
      const nowSaved = !this.ids.has(n);
      nowSaved ? this.ids.add(n) : this.ids.delete(n);
      this.#emit();
      return nowSaved;
    }

    get count() {
      return this.ids.size;
    }
  }

  V.Wishlist = Wishlist;
})(window.VELORA);
