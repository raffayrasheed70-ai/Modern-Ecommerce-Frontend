# VELORA — Modern E-Commerce Frontend

A responsive storefront built with **HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons and vanilla ES6+ JavaScript** — no frameworks, no backend. Product data is sample data; no payments or orders are processed.

## Run it

**Easiest:** double-click `index.html`. The scripts are plain `<script>` files sharing one `VELORA` namespace, so it works from `file://` (an internet connection is needed for the Bootstrap/Google Fonts CDNs and product photos).

**In VS Code (recommended):**
1. Open the `ecommerce-frontend` folder (File → Open Folder).
2. Install the **Live Server** extension.
3. Right-click `index.html` → **Open with Live Server**.

## Structure

```
ecommerce-frontend/
├── index.html          semantic markup, drawers, modal, toast container
├── css/style.css       design tokens, components, responsive + reduced-motion rules
└── js/
    ├── products.js     product + category data, formatting helpers, constants
    ├── filters.js      pure search / filter / sort logic (no DOM)
    ├── cart.js         Cart class: quantities, totals in cents, localStorage, pub/sub
    ├── wishlist.js     Wishlist class: toggle, localStorage, pub/sub
    ├── components.js   template functions: ProductCard, CartItem, QuickView, Toast…
    └── app.js          controller: state, event delegation, rendering
```

Data flows one way: user event → `app.js` updates state → pure modules compute → components render HTML.

## Test checklist

| # | Scenario | How |
|---|----------|-----|
| 1 | Search | Click the search icon, type "watch" — grid filters live; count updates |
| 2 | Category | Click a category card, or pick one in the sidebar |
| 3 | Combined filters | Category + min/max price + rating + search together |
| 4 | Sorting | Sort dropdown: price ↑/↓, top rated, newest |
| 5 | Clear filters | "Clear all", a chip's ✕, or "Reset all filters" on the empty state |
| 6–8 | Cart | Bag icon on cards / Quick View; use +/− and the trash icon in the drawer |
| 9 | Persistence | Refresh the page — cart and wishlist remain |
| 10 | Wishlist | Heart on a card; heart icon in the navbar shows only saved items |
| 11 | Quick view | "Quick view" on a card (always visible on touch devices); close with ✕, Esc or backdrop |
| 12 | Mobile | Narrow the window below 992px: hamburger menu + "Filters" drawer |
| 13 | Newsletter | Submit empty / `abc` (error) then `you@example.com` (success message) |
| 14 | Empty states | Empty cart drawer; search "zzzz" for no results |

Cart rules: quantity 1–10 per item; free shipping from $100, otherwise $8.
