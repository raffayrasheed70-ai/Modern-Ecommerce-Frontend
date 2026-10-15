/**
 * products.js
 * Centralised product catalogue + shared helpers.
 * Everything is attached to a single `VELORA` namespace so the project works
 * when index.html is opened directly (file://) as well as via Live Server.
 */
window.VELORA = window.VELORA || {};

(function (V) {
  'use strict';

  const img = (id, w = 800) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

  /** @typedef {{id:number,name:string,category:string,price:number,originalPrice:number|null,rating:number,reviews:number,badge:string|null,isNew:boolean,addedAt:string,image:string,description:string}} Product */

  /** @type {Product[]} */
  const PRODUCTS = [
    // ---------- Fashion ----------
    { id: 1, name: 'Essential Cotton Tee', category: 'Fashion', price: 29, originalPrice: null, rating: 4.6, reviews: 412, badge: 'Bestseller', addedAt: '2026-05-02', image: img('photo-1521572163474-6864f9cf17ab'), description: 'A heavyweight, pre-washed organic cotton tee with a relaxed fit. Soft from day one and built to last through hundreds of washes.' },
    { id: 2, name: 'Oversized Wool Overcoat', category: 'Fashion', price: 189, originalPrice: 249, rating: 4.8, reviews: 156, badge: null, addedAt: '2026-08-14', image: img('photo-1539533018447-63fcce2678e3'), description: 'A statement overcoat in a soft wool blend with a drop shoulder and clean lines. Fully lined and warm without the bulk.' },
    { id: 3, name: 'Classic Denim Jacket', category: 'Fashion', price: 89, originalPrice: 119, rating: 4.4, reviews: 233, badge: null, addedAt: '2026-03-21', image: img('photo-1551028719-00167b16eac5'), description: 'A timeless mid-wash denim jacket cut from durable rigid denim. Layer it over anything, any season.' },
    { id: 4, name: 'Linen Summer Shirt', category: 'Fashion', price: 54, originalPrice: null, rating: 4.3, reviews: 98, badge: 'New', addedAt: '2026-09-28', image: img('photo-1596755094514-f87e34085b2c'), description: 'Breathable pure linen shirt with a relaxed collar and mother-of-pearl style buttons. Gets softer with every wear.' },
    { id: 5, name: 'Everyday Running Sneakers', category: 'Fashion', price: 119, originalPrice: 149, rating: 4.7, reviews: 521, badge: 'Bestseller', addedAt: '2026-04-10', image: img('photo-1542291026-7eec264c27ff'), description: 'Lightweight cushioned sneakers with a breathable knit upper and a responsive foam midsole for all-day comfort.' },
    { id: 6, name: 'Pleated Midi Skirt', category: 'Fashion', price: 64, originalPrice: null, rating: 4.1, reviews: 74, badge: 'New', addedAt: '2026-10-02', image: img('photo-1583496661160-fb5886a13d77'), description: 'A fluid pleated midi skirt with an elasticated waist. Dresses up with heels or down with sneakers.' },

    // ---------- Electronics ----------
    { id: 7, name: 'Studio Wireless Headphones', category: 'Electronics', price: 249, originalPrice: 329, rating: 4.8, reviews: 884, badge: 'Bestseller', addedAt: '2026-02-18', image: img('photo-1505740420928-5e560c06d30e'), description: 'Over-ear headphones with adaptive noise cancelling, 40-hour battery life and plush memory-foam ear cushions.' },
    { id: 8, name: 'Pulse Smartwatch Series 3', category: 'Electronics', price: 199, originalPrice: null, rating: 4.5, reviews: 367, badge: 'New', addedAt: '2026-09-15', image: img('photo-1546868871-7041f2a55e12'), description: 'Track workouts, sleep and heart rate on a bright always-on display. Water resistant with 7-day battery life.' },
    { id: 9, name: 'Aero 14" Ultrabook', category: 'Electronics', price: 899, originalPrice: 1099, rating: 4.6, reviews: 142, badge: null, addedAt: '2026-06-30', image: img('photo-1496181133206-80ce9b88a853'), description: 'A razor-thin 14-inch laptop with a crisp display, all-day battery and a quiet fanless design.' },
    { id: 10, name: 'True Wireless Earbuds', category: 'Electronics', price: 79, originalPrice: 99, rating: 4.2, reviews: 619, badge: null, addedAt: '2026-01-25', image: img('photo-1590658268037-6bf12165a8df'), description: 'Compact earbuds with punchy sound, a secure fit and a pocketable charging case for 24 hours of playback.' },
    { id: 11, name: 'Portable Bluetooth Speaker', category: 'Electronics', price: 59, originalPrice: null, rating: 4.4, reviews: 278, badge: null, addedAt: '2026-07-07', image: img('photo-1608043152269-423dbba4e7e1'), description: 'Rugged, water-resistant speaker delivering room-filling 360 degree sound for up to 15 hours.' },
    { id: 12, name: 'Mechanical Keyboard K2', category: 'Electronics', price: 129, originalPrice: 159, rating: 4.7, reviews: 203, badge: 'New', addedAt: '2026-10-05', image: img('photo-1587829741301-dc798b83add3'), description: 'Hot-swappable compact mechanical keyboard with tactile switches, PBT keycaps and soft white backlighting.' },

    // ---------- Home & Living ----------
    { id: 13, name: 'Sculpted Ceramic Vase', category: 'Home & Living', price: 42, originalPrice: null, rating: 4.5, reviews: 87, badge: null, addedAt: '2026-05-19', image: img('photo-1578500494198-246f612d3b3d'), description: 'Hand-finished stoneware vase with a matte glaze and organic silhouette. A quiet centrepiece for any shelf.' },
    { id: 14, name: 'Arc Floor Lamp', category: 'Home & Living', price: 138, originalPrice: 175, rating: 4.6, reviews: 119, badge: null, addedAt: '2026-04-27', image: img('photo-1507473885765-e6ed057f782c'), description: 'A graceful arched floor lamp with a warm dimmable glow and a weighted marble base for stability.' },
    { id: 15, name: 'Soy Wax Scented Candle', category: 'Home & Living', price: 24, originalPrice: null, rating: 4.9, reviews: 745, badge: 'Bestseller', addedAt: '2026-03-03', image: img('photo-1602874801007-bd458bb1b8b6'), description: 'Hand-poured soy candle with notes of cedar, amber and fig. Around 50 hours of clean, even burn time.' },
    { id: 16, name: 'Woven Throw Blanket', category: 'Home & Living', price: 68, originalPrice: 85, rating: 4.7, reviews: 301, badge: null, addedAt: '2026-08-02', image: img('photo-1580301762395-21ce84d00bc6'), description: 'A chunky woven throw in soft cotton-blend yarn. Drape it over a sofa for instant warmth and texture.' },
    { id: 17, name: 'Oak Side Table', category: 'Home & Living', price: 159, originalPrice: null, rating: 4.3, reviews: 64, badge: 'New', addedAt: '2026-09-20', image: img('photo-1532372320572-cda25653a26d'), description: 'Solid oak side table with a rounded top and tapered legs, finished with a natural oil.' },

    // ---------- Accessories ----------
    { id: 18, name: 'Classic Leather Watch', category: 'Accessories', price: 149, originalPrice: 199, rating: 4.6, reviews: 412, badge: 'Bestseller', addedAt: '2026-02-09', image: img('photo-1523275335684-37898b6baf30'), description: 'Minimal quartz watch with a sapphire-coated crystal, brushed steel case and genuine leather strap.' },
    { id: 19, name: 'Aviator Sunglasses', category: 'Accessories', price: 69, originalPrice: null, rating: 4.2, reviews: 190, badge: null, addedAt: '2026-06-12', image: img('photo-1572635196237-14b3f281503f'), description: 'Lightweight metal-frame aviators with polarised UV400 lenses for sharp, glare-free vision.' },
    { id: 20, name: 'Everyday Canvas Backpack', category: 'Accessories', price: 79, originalPrice: 99, rating: 4.5, reviews: 327, badge: null, addedAt: '2026-07-22', image: img('photo-1553062407-98eeb64c6a62'), description: 'Water-resistant waxed canvas backpack with a padded 15-inch laptop sleeve and plenty of pockets.' },
    { id: 21, name: 'Structured Leather Tote', category: 'Accessories', price: 159, originalPrice: 210, rating: 4.8, reviews: 138, badge: 'New', addedAt: '2026-10-08', image: img('photo-1584917865442-de89df76afd3'), description: 'A roomy full-grain leather tote with a magnetic closure and an inner zip pocket. Ages beautifully.' },
    { id: 22, name: 'Merino Wool Scarf', category: 'Accessories', price: 45, originalPrice: null, rating: 4.4, reviews: 82, badge: null, addedAt: '2026-09-02', image: img('photo-1520903920243-00d872a2d1c9'), description: 'A generous scarf in ultra-soft merino wool. Lightweight, warm and gentle on skin.' },
    { id: 23, name: 'Slim Leather Wallet', category: 'Accessories', price: 39, originalPrice: 49, rating: 4.3, reviews: 255, badge: null, addedAt: '2026-01-14', image: img('photo-1627123424574-724758594e93'), description: 'Slim bifold wallet in vegetable-tanned leather with six card slots and a hidden note compartment.' },
    { id: 24, name: 'Gold-Tone Hoop Earrings', category: 'Accessories', price: 34, originalPrice: null, rating: 4.1, reviews: 66, badge: 'New', addedAt: '2026-10-10', image: img('photo-1535632066927-ab7c9ab60908'), description: 'Lightweight hoops plated in 18k gold-tone over hypoallergenic brass. Everyday jewellery that goes with everything.' },
  ];

  const CATEGORIES = [
    { name: 'Fashion', icon: 'bi-handbag', image: img('photo-1490481651871-ab68de25d43d', 700), blurb: 'Wardrobe staples' },
    { name: 'Electronics', icon: 'bi-headphones', image: img('photo-1498049794561-7780e7231661', 700), blurb: 'Tech that works' },
    { name: 'Home & Living', icon: 'bi-house-heart', image: img('photo-1493663284031-b7e3aefcae8e', 700), blurb: 'Calm spaces' },
    { name: 'Accessories', icon: 'bi-watch', image: img('photo-1511499767150-a48a237f0083', 700), blurb: 'Finishing touches' },
  ];

  // Inline SVG shown if a remote image fails to load (keeps cards from looking broken).
  const FALLBACK_IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#ece8e1"/><g fill="none" stroke="#b8b0a4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><rect x="130" y="190" width="140" height="110" rx="12"/><circle cx="170" cy="230" r="12"/><path d="M135 285l45-40 35 30 25-20 25 25"/></g></svg>'
    );

  const FREE_SHIPPING_THRESHOLD = 100;
  const SHIPPING_FEE = 8;

  /** Formats a number as USD. */
  const formatPrice = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

  /** Percentage discount for a product (0 when not on sale). */
  const discountPercent = (p) =>
    p.originalPrice && p.originalPrice > p.price
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : 0;

  const getProductById = (id) => PRODUCTS.find((p) => p.id === Number(id)) || null;

  /** Escape text before inserting into innerHTML templates. */
  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  Object.assign(V, {
    PRODUCTS, CATEGORIES, FALLBACK_IMG, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE,
    formatPrice, discountPercent, getProductById, escapeHTML,
  });
})(window.VELORA);
