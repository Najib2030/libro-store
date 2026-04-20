// -------------------- FIREBASE CONFIGURATION --------------------
const firebaseConfig = {
    apiKey: "AIzaSyDldtF6Q5T1mBdkp2hSNf2W9plHaZ3joiw",
    authDomain: "librostore-6053c.firebaseapp.com",
    projectId: "librostore-6053c",
    storageBucket: "librostore-6053c.firebasestorage.app",
    messagingSenderId: "479620573072",
    appId: "1:479620573072:web:efcfad07146e841f457515",
    measurementId: "G-LWWS2S092S"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, orderBy, writeBatch, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('email');
provider.setCustomParameters({ prompt: 'select_account' });

const productsCol = collection(db, "products");
const storeSettingsRef = doc(db, "config", "storeSettings");

// Global state
let productsArray = [];
let cart = [];
let unsubscribeProducts = null;
let selectedCategory = "all";
let searchQuery = "";
let sortOption = "name-asc";
let currentUser = null;
let userRole = null;
let chatUnsubscribe = null;
let currentChatId = null;
let sellerId = null;
let storeOpen = true;
let storeUnsubscribe = null;
let currentUsername = null;

// NEW: Listener for unreadUserCount
let unreadChatUnsubscribe = null;
let currentUnreadCount = 0;

// -------------------- I18N TRANSLATIONS --------------------
let currentLanguage = localStorage.getItem('lang') || 'en';

const translations = {
  en: {
    cart_button: "Cart",
    sign_in_button: "🔑 Sign in with Google",
    logout_button: "Logout",
    chat_button: "Chat with Seller",
    categories_title: "📚 Categories",
    all_category: "All",
    mobile_categories: "Categories",
    hero_title: "Discover literary treasures",
    hero_subtitle: "Handpicked collection for readers & dreamers",
    search_placeholder: "Search by name or description...",
    sort_label: "Sort by:",
    sort_name_asc: "Name (A-Z)",
    sort_name_desc: "Name (Z-A)",
    sort_price_asc: "Price (Low to High)",
    sort_price_desc: "Price (High to Low)",
    sort_stock_desc: "Stock (High to Low)",
    in_stock: "📦 In stock: {stock}",
    add_to_cart: "Add to Cart",
    cart_modal_title: "🛒 Your Cart",
    cart_empty: "📭 Your cart is empty.",
    cart_total_label: "Total: {total} DH",
    clear_cart_button: "🗑️ Clear Cart",
    send_order_button: "📨 Send Order",
    username_modal_title: "✨ Choose a username",
    username_placeholder: "Username (unique, visible to seller)",
    username_save_button: "Save & Continue",
    chat_header_title: "LibroCart Support",
    chat_header_online: "Online",
    chat_header_offline: "Offline",
    chat_placeholder: "Type a message...",
    chat_send_button: "Send",
    store_closed_banner: "🔒 Store is currently closed. The seller may not reply immediately. 🔒",
    toast_cart_cleared: "Cart cleared",
    toast_sign_in_first: "Please sign in first",
    toast_cart_empty: "Your cart is empty",
    toast_seller_not_found: "Seller not found",
    toast_stock_limit: "Stock limit reached",
    toast_not_enough_stock: "Not enough stock for {name}",
    toast_added_to_cart: "➕ {quantity} × {name} added",
    toast_order_sent: "Order sent! Stock has been reserved.",
    toast_username_taken: "Username already taken",
    toast_username_short: "Username must be at least 3 characters",
    toast_welcome: "Welcome back, {username}",
    toast_signed_out: "Signed out",
    toast_error_prefix: "Error: ",
    toast_only_stock_left: "Only {maxStock} left",
    toast_order_placed: "Order #{orderId} placed",
    loading_products: "Loading products...",
    no_products_found: "📭 No matching products found.",
    order_placed_title: "🛒 ORDER PLACED",
    order_items_format: "{name} x{quantity} = {subtotal} DH",
    order_total_format: "**Total:** {total} DH",
    loading_spinner: "Processing..."
  },
  fr: {
    cart_button: "Panier",
    sign_in_button: "Se connecter avec Google",
    logout_button: "Déconnexion",
    chat_button: "Discuter avec le vendeur",
    categories_title: "📚 Catégories",
    all_category: "Tous",
    mobile_categories: "Catégories",
    hero_title: "Découvrez des trésors littéraires",
    hero_subtitle: "Collection soigneusement sélectionnée pour les lecteurs et rêveurs",
    search_placeholder: "Rechercher par nom ou description...",
    sort_label: "Trier par :",
    sort_name_asc: "Nom (A-Z)",
    sort_name_desc: "Nom (Z-A)",
    sort_price_asc: "Prix (croissant)",
    sort_price_desc: "Prix (décroissant)",
    sort_stock_desc: "Stock (décroissant)",
    in_stock: "📦 En stock : {stock}",
    add_to_cart: "Ajouter au panier",
    cart_modal_title: "🛒 Votre panier",
    cart_empty: "📭 Votre panier est vide.",
    cart_total_label: "Total : {total} DH",
    clear_cart_button: "🗑️ Vider le panier",
    send_order_button: "📨 Envoyer la commande",
    username_modal_title: "✨ Choisissez un nom d'utilisateur",
    username_placeholder: "Nom d'utilisateur (unique, visible par le vendeur)",
    username_save_button: "Enregistrer et continuer",
    chat_header_title: "Support LibroCart",
    chat_header_online: "En ligne",
    chat_header_offline: "Hors ligne",
    chat_placeholder: "Tapez un message...",
    chat_send_button: "Envoyer",
    store_closed_banner: "🔒 La boutique est actuellement fermée. Le vendeur peut ne pas répondre immédiatement. 🔒",
    toast_cart_cleared: "Panier vidé",
    toast_sign_in_first: "Veuillez vous connecter d'abord",
    toast_cart_empty: "Votre panier est vide",
    toast_seller_not_found: "Vendeur non trouvé",
    toast_stock_limit: "Limite de stock atteinte",
    toast_not_enough_stock: "Stock insuffisant pour {name}",
    toast_added_to_cart: "➕ {quantity} × {name} ajouté",
    toast_order_sent: "Commande envoyée ! Stock réservé.",
    toast_username_taken: "Nom d'utilisateur déjà pris",
    toast_username_short: "Le nom d'utilisateur doit comporter au moins 3 caractères",
    toast_welcome: "Bon retour, {username}",
    toast_signed_out: "Déconnecté",
    toast_error_prefix: "Erreur : ",
    toast_only_stock_left: "Seulement {maxStock} restant",
    toast_order_placed: "Commande #{orderId} passée",
    loading_products: "Chargement des produits...",
    no_products_found: "📭 Aucun produit correspondant trouvé.",
    order_placed_title: "🛒 COMMANDE PASSÉE",
    order_items_format: "{name} x{quantity} = {subtotal} DH",
    order_total_format: "**Total :** {total} DH",
    loading_spinner: "Traitement..."
  }
};

function t(key, params = {}) {
  let text = translations[currentLanguage][key] || translations['en'][key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return text;
}

function setLanguage(lang) {
  if (lang === 'en' || lang === 'fr') {
    currentLanguage = lang;
    localStorage.setItem('lang', lang);
    updateAllLanguageDependentUI();
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) {
      langToggle.innerHTML = currentLanguage === 'en' ? '🌐 FR' : '🌐 EN';
    }
    showToast(t('toast_welcome', { username: 'Language updated' }), 'info');
  }
}

function toggleLanguage() {
  const newLang = currentLanguage === 'en' ? 'fr' : 'en';
  setLanguage(newLang);
}

function updateAllLanguageDependentUI() {
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) heroTitle.textContent = t('hero_title');
  const heroSubtitle = document.getElementById('heroSubtitle');
  if (heroSubtitle) heroSubtitle.textContent = t('hero_subtitle');
  const sortLabel = document.getElementById('sortLabel');
  if (sortLabel) sortLabel.textContent = t('sort_label');
  const searchInput = document.getElementById('productSearch');
  if (searchInput) searchInput.placeholder = t('search_placeholder');
  const cartText = document.getElementById('cartText');
  if (cartText) cartText.textContent = t('cart_button');
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.textContent = t('sign_in_button');
  const logoutBtn = document.getElementById('logoutUserBtn');
  if (logoutBtn) logoutBtn.innerHTML = `🚪 ${t('logout_button')}`;
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) chatBtn.innerHTML = `💬 ${t('chat_button')} <span id="chatUnreadBadge" class="unread-badge" style="display: none;">0</span>`;
  const sidebarTitle = document.getElementById('sidebarTitle');
  if (sidebarTitle) sidebarTitle.textContent = t('categories_title');
  const mobileCategoryText = document.getElementById('mobileCategoryText');
  if (mobileCategoryText) mobileCategoryText.textContent = t('mobile_categories');
  const cartModalTitle = document.getElementById('cartModalTitle');
  if (cartModalTitle) cartModalTitle.innerHTML = t('cart_modal_title');
  const clearCartBtn = document.getElementById('clearCartBtn');
  if (clearCartBtn) clearCartBtn.innerHTML = t('clear_cart_button');
  const sendOrderBtn = document.getElementById('sendOrderBtn');
  if (sendOrderBtn) sendOrderBtn.innerHTML = t('send_order_button');
  const usernameModalTitle = document.getElementById('usernameModalTitle');
  if (usernameModalTitle) usernameModalTitle.textContent = t('username_modal_title');
  const usernameInputPlaceholder = document.getElementById('usernameInput');
  if (usernameInputPlaceholder) usernameInputPlaceholder.placeholder = t('username_placeholder');
  const saveUsernameBtn = document.getElementById('saveUsernameBtn');
  if (saveUsernameBtn) saveUsernameBtn.textContent = t('username_save_button');
  const chatHeaderTitle = document.getElementById('chatHeaderTitle');
  if (chatHeaderTitle) chatHeaderTitle.textContent = t('chat_header_title');
  const chatInputPlaceholder = document.getElementById('chatInput');
  if (chatInputPlaceholder) chatInputPlaceholder.placeholder = t('chat_placeholder');
  const sendChatBtn = document.getElementById('sendChatBtn');
  if (sendChatBtn) sendChatBtn.textContent = t('chat_send_button');
  
  populateSortOptions();
  
  const banner = document.querySelector('.store-closed-banner');
  if (banner) {
    banner.innerHTML = `<span>🔒</span> ${t('store_closed_banner')}<span>🔒</span>`;
  }
  
  updateChatHeaderStatus();
  renderCategories();
  renderCustomerProducts();
  renderCartModal();
}

function populateSortOptions() {
  const sortSelect = document.getElementById('productSort');
  if (!sortSelect) return;
  const options = [
    { value: 'name-asc', key: 'sort_name_asc' },
    { value: 'name-desc', key: 'sort_name_desc' },
    { value: 'price-asc', key: 'sort_price_asc' },
    { value: 'price-desc', key: 'sort_price_desc' },
    { value: 'stock-desc', key: 'sort_stock_desc' }
  ];
  const currentValue = sortSelect.value;
  sortSelect.innerHTML = '';
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = t(opt.key);
    sortSelect.appendChild(option);
  });
  if (options.some(opt => opt.value === currentValue)) {
    sortSelect.value = currentValue;
  } else {
    sortSelect.value = sortOption;
  }
  sortSelect.removeEventListener('change', handleSortChange);
  sortSelect.addEventListener('change', handleSortChange);
}

function handleSortChange(e) {
  sortOption = e.target.value;
  renderCustomerProducts();
}

// DOM elements
const customerGrid = document.getElementById('customerProductGrid');
const cartButton = document.getElementById('cartButton');
const cartCountSpan = document.getElementById('cartCountBadge');
const cartModal = document.getElementById('cartModal');
const cartItemsDiv = document.getElementById('cartItemsList');
const cartTotalSpan = document.getElementById('cartTotal');
const sendOrderBtn = document.getElementById('sendOrderBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const productSearch = document.getElementById('productSearch');
const productSort = document.getElementById('productSort');
const darkModeToggle = document.getElementById('darkModeToggle');
const categoryListDiv = document.getElementById('categoryList');
const loginBtn = document.getElementById('loginBtn');
const chatBtn = document.getElementById('chatBtn');
const logoutUserBtn = document.getElementById('logoutUserBtn');
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');
const saveUsernameBtn = document.getElementById('saveUsernameBtn');
const chatModal = document.getElementById('chatModal');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessagesDiv = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatHeaderStatusSpan = document.querySelector('#chatModal .chat-header-text span');
const userInfoContainer = document.getElementById('userInfoContainer');
const userFullnameSpan = document.querySelector('.user-fullname');
const userSubnameSpan = document.querySelector('.user-subname');
const chatUnreadBadge = document.getElementById('chatUnreadBadge');

// Mobile sidebar
const mobileToggleBtn = document.getElementById('mobileCategoryToggle');
const sidebar = document.getElementById('categorySidebar');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
let sidebarOverlay = null;

// -------------------- LOADING SPINNER HELPERS --------------------
function setButtonLoading(button, isLoading, originalText = null) {
  if (!button) return;
  if (isLoading) {
    let loadingText = "";
    if (originalText === null) {
      button._originalText = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add('btn-loading');
    if (button._originalText !== "Send") {
      loadingText = t('loading_spinner');
    }
    button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    if (button._originalText !== undefined) {
      button.innerHTML = button._originalText;
      delete button._originalText;
    }
  }
}

async function withLoading(button, asyncFn) {
  if (!button) return asyncFn();
  if (button.disabled) return;
  setButtonLoading(button, true);
  try {
    return await asyncFn();
  } finally {
    setButtonLoading(button, false);
  }
}

// -------------------- USER HEADER DISPLAY --------------------
function updateUserHeaderDisplay(fullName, username) {
  if (!userInfoContainer || !userFullnameSpan || !userSubnameSpan) return;
  const displayName = fullName || currentUser?.email?.split('@')[0] || 'User';
  userFullnameSpan.textContent = displayName;
  if (username) {
    userSubnameSpan.textContent = username;
    userSubnameSpan.style.display = 'block';
  } else {
    userSubnameSpan.textContent = '';
    userSubnameSpan.style.display = 'none';
  }
  userInfoContainer.style.display = 'flex';
}

function hideUserHeader() {
  if (userInfoContainer) userInfoContainer.style.display = 'none';
}

// -------------------- TOAST --------------------
function showToast(message, type = 'info') {
  let existingToast = document.querySelector('.toast-msg');
  if (existingToast) existingToast.remove();
  const toast = document.createElement('div');
  toast.className = `toast-msg toast-${type}`;
  let icon = '';
  if (type === 'success') icon = '✅ ';
  else if (type === 'error') icon = '❌ ';
  else icon = 'ℹ️ ';
  toast.innerHTML = `${icon}${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// -------------------- UNREAD MESSAGES (CUSTOMER) --------------------
// Start listening to the chat document for unreadUserCount
async function startUnreadListener() {
  if (unreadChatUnsubscribe) unreadChatUnsubscribe();
  if (!currentUser || !sellerId) return;

  const chatId = currentUser.uid < sellerId ? `${currentUser.uid}_${sellerId}` : `${sellerId}_${currentUser.uid}`;
  currentChatId = chatId;
  const chatRef = doc(db, "chats", chatId);
  
  unreadChatUnsubscribe = onSnapshot(chatRef, (docSnap) => {
    if (docSnap.exists()) {
      const unread = docSnap.data().unreadUserCount || 0;
      currentUnreadCount = unread;
      updateUnreadBadge(unread);
    } else {
      currentUnreadCount = 0;
      updateUnreadBadge(0);
    }
  }, (err) => {
    console.error("Unread listener error:", err);
    updateUnreadBadge(0);
  });
}

function updateUnreadBadge(count) {
  if (chatUnreadBadge) {
    if (count > 0) {
      chatUnreadBadge.textContent = count > 99 ? '99+' : count;
      chatUnreadBadge.style.display = 'inline-block';
    } else {
      chatUnreadBadge.style.display = 'none';
    }
  }
}

// Reset unread count when opening chat
async function resetUnreadCount() {
  if (!currentChatId) return;
  const chatRef = doc(db, "chats", currentChatId);
  await updateDoc(chatRef, { unreadUserCount: 0 });
  currentUnreadCount = 0;
  updateUnreadBadge(0);
}

// -------------------- STORE STATUS --------------------
function initStoreStatusListener() {
  if (storeUnsubscribe) storeUnsubscribe();
  storeUnsubscribe = onSnapshot(storeSettingsRef, (docSnap) => {
    if (docSnap.exists()) storeOpen = docSnap.data().isOpen ?? true;
    else storeOpen = true;
    updateStoreStatusUI();
    updateChatHeaderStatus();
  }, (err) => {
    console.error("Store status listener error:", err);
    storeOpen = true;
    updateStoreStatusUI();
    updateChatHeaderStatus();
  });
}

function updateStoreStatusUI() {
  let banner = document.querySelector('.store-closed-banner');
  if (!storeOpen) {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'store-closed-banner';
      banner.innerHTML = `<span>🔒</span> ${t('store_closed_banner')}<span>🔒</span>`;
      const heroSection = document.querySelector('.hero-section');
      if (heroSection) heroSection.insertAdjacentElement('afterend', banner);
    }
    banner.style.display = 'flex';
  } else {
    if (banner) banner.style.display = 'none';
  }
}

function updateChatHeaderStatus() {
  if (chatHeaderStatusSpan) {
    chatHeaderStatusSpan.textContent = storeOpen ? t('chat_header_online') : t('chat_header_offline');
    chatHeaderStatusSpan.style.color = storeOpen ? "var(--success)" : "var(--danger)";
  }
}

// -------------------- CART FUNCTIONS --------------------
function loadCart() {
  const saved = localStorage.getItem('libro_cart');
  if (saved) try { cart = JSON.parse(saved); } catch(e) { cart = []; }
  else cart = [];
  updateCartBadge();
}
function saveCart() {
  localStorage.setItem('libro_cart', JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountSpan) cartCountSpan.innerText = totalItems;
}
function clearCart() {
  cart = [];
  saveCart();
  renderCartModal();
  showToast(t('toast_cart_cleared'), 'info');
}

// -------------------- PRODUCT FILTERING & RENDERING --------------------
function filterAndSortProducts() {
  let filtered = [...productsArray];
  if (selectedCategory !== "all") filtered = filtered.filter(p => p.category === selectedCategory);
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }
  if (sortOption === "name-asc") filtered.sort((a,b) => a.name.localeCompare(b.name));
  else if (sortOption === "name-desc") filtered.sort((a,b) => b.name.localeCompare(a.name));
  else if (sortOption === "price-asc") filtered.sort((a,b) => a.price - b.price);
  else if (sortOption === "price-desc") filtered.sort((a,b) => b.price - a.price);
  else if (sortOption === "stock-desc") filtered.sort((a,b) => b.stock - a.stock);
  return filtered;
}

function renderCategories() {
  if (!categoryListDiv) return;
  const categoriesSet = new Set();
  productsArray.forEach(p => { if (p.category) categoriesSet.add(p.category); });
  const categories = Array.from(categoriesSet).sort();
  let html = `<button class="category-btn ${selectedCategory === 'all' ? 'active' : ''}" data-category="all">${t('all_category')}</button>`;
  categories.forEach(cat => {
    html += `<button class="category-btn ${selectedCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
  });
  categoryListDiv.innerHTML = html;
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.category;
      renderCategories();
      renderCustomerProducts();
      if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
        sidebarOverlay?.classList.remove('active');
        sidebar.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });
}

function renderCustomerProducts() {
  if (!customerGrid) return;
  const filtered = filterAndSortProducts();
  if (filtered.length === 0) {
    customerGrid.innerHTML = `<div class="loading-skeleton">${t('no_products_found')}</div>`;
    return;
  }
  let html = '';
  filtered.forEach(prod => {
    const stockLeft = prod.stock;
    const disabled = stockLeft <= 0;
    const desc = prod.description ? prod.description.substring(0, 80) : '';
    html += `
      <div class="product-card">
        <img class="product-img" src="${prod.imageUrl}" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
        <div class="product-info">
          <div class="product-title">${escapeHtml(prod.name)}</div>
          <div class="product-price">${prod.price.toFixed(2)} DH</div>
          ${prod.category ? `<div class="product-category">📁 ${escapeHtml(prod.category)}</div>` : ''}
          ${desc ? `<div class="product-desc">${escapeHtml(desc)}...</div>` : ''}
          <div class="stock-info ${stockLeft <= 3 ? 'stock-low' : ''}">${t('in_stock', { stock: stockLeft })}</div>
          <div class="cart-control">
            <input type="number" id="qty-${prod.id}" class="qty-input" value="1" min="1" max="${stockLeft}" ${disabled ? 'disabled' : ''}>
            <button class="btn-add" data-id="${prod.id}" data-name="${escapeHtml(prod.name)}" data-price="${prod.price}" data-stock="${stockLeft}" ${disabled ? 'disabled' : ''}>➕ ${t('add_to_cart')}</button>
          </div>
        </div>
      </div>
    `;
  });
  customerGrid.innerHTML = html;
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      const maxStock = parseInt(btn.dataset.stock);
      const qtyInput = document.getElementById(`qty-${id}`);
      let quantity = parseInt(qtyInput?.value || 1);
      if (isNaN(quantity) || quantity < 1) quantity = 1;
      if (quantity > maxStock) { showToast(t('toast_only_stock_left', { maxStock }), 'error'); return; }
      const existing = cart.findIndex(item => item.id === id);
      if (existing !== -1) {
        const newQty = cart[existing].quantity + quantity;
        if (newQty > maxStock) { showToast(t('toast_stock_limit'), 'error'); return; }
        cart[existing].quantity = newQty;
      } else cart.push({ id, name, price, quantity });
      saveCart();
      renderCartModal();
      showToast(t('toast_added_to_cart', { quantity, name }), 'success');
    });
  });
}

// -------------------- CART MODAL --------------------
function renderCartModal() {
  if (!cartItemsDiv || !cartTotalSpan) return;
  if (cart.length === 0) { cartItemsDiv.innerHTML = `<p class="empty-cart">${t('cart_empty')}</p>`; cartTotalSpan.innerText = t('cart_total_label', { total: '0.00' }); return; }
  let html = ''; let total = 0;
  cart.forEach((item, idx) => {
    const subtotal = item.price * item.quantity; total += subtotal;
    html += `<div class="cart-item"><div class="cart-item-info"><strong>${escapeHtml(item.name)}</strong><small> ${item.quantity} x ${item.price} DH</small></div><div class="cart-item-actions"><button class="btn-outline" data-cart-index="${idx}" data-action="remove">🗑️</button><button class="btn-outline" data-cart-index="${idx}" data-action="dec">-</button><button class="btn-outline" data-cart-index="${idx}" data-action="inc">+</button></div></div>`;
  });
  cartItemsDiv.innerHTML = html;
  cartTotalSpan.innerText = t('cart_total_label', { total: total.toFixed(2) });
  document.querySelectorAll('[data-cart-index]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.cartIndex);
      const action = btn.dataset.action;
      if (action === 'remove') cart.splice(idx, 1);
      else if (action === 'dec') { if (cart[idx].quantity > 1) cart[idx].quantity--; else cart.splice(idx, 1); }
      else if (action === 'inc') { const product = productsArray.find(p => p.id === cart[idx].id); if (product && cart[idx].quantity < product.stock) cart[idx].quantity++; else showToast(t('toast_stock_limit'), 'error'); }
      saveCart(); renderCartModal();
    });
  });
}

async function updateProductStock(productId, delta) {
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);
  if (productSnap.exists()) {
    const currentStock = productSnap.data().stock;
    const newStock = Math.max(0, currentStock + delta);
    await updateDoc(productRef, { stock: newStock });
  }
}

// -------------------- SEND ORDER --------------------
async function sendOrderAsMessage() {
  if (!currentUser) { showToast(t('toast_sign_in_first'), 'error'); return; }
  if (cart.length === 0) { showToast(t('toast_cart_empty'), 'error'); return; }
  if (!sellerId) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "seller"));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) sellerId = querySnap.docs[0].id;
    else { showToast(t('toast_seller_not_found'), 'error'); return; }
  }
  
  let total = 0;
  const orderItems = cart.map(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    return { productId: item.id, name: item.name, price: item.price, quantity: item.quantity };
  });
  
  const batch = writeBatch(db);
  for (const item of cart) {
    const productRef = doc(db, "products", item.id);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const newStock = productSnap.data().stock - item.quantity;
      if (newStock < 0) { showToast(t('toast_not_enough_stock', { name: item.name }), 'error'); return; }
      batch.update(productRef, { stock: newStock });
    }
  }
  await batch.commit();
  
  const userNameForOrder = currentUsername || currentUser.displayName || currentUser.email;
  const orderData = {
    userId: currentUser.uid,
    userName: userNameForOrder,
    items: orderItems,
    total: total,
    status: "pending",
    hidden: false,
    timestamp: new Date()
  };
  const orderRef = await addDoc(collection(db, "orders"), orderData);
  const orderId = orderRef.id;
  
  const chatId = currentUser.uid < sellerId ? `${currentUser.uid}_${sellerId}` : `${sellerId}_${currentUser.uid}`;
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    await setDoc(chatRef, { participants: [currentUser.uid, sellerId], lastMessage: t('toast_order_placed', { orderId: orderId.slice(-6) }), lastUpdated: new Date(), unreadUserCount: 0, unreadAdminCount: 0 });
  }
  const messagesRef = collection(chatRef, "messages");
  const orderMessageHeader = t('order_placed_title');
  const orderItemsText = orderItems.map(item => t('order_items_format', { name: item.name, quantity: item.quantity, subtotal: (item.price * item.quantity).toFixed(2) })).join('\n');
  const orderTotalText = t('order_total_format', { total: total.toFixed(2) });
  const orderMessage = `${orderMessageHeader}\n\n${orderItemsText}\n\n${orderTotalText}`;
  await addDoc(messagesRef, { senderId: currentUser.uid, text: orderMessage, timestamp: new Date(), isOrder: true, orderId: orderId });
  await updateDoc(chatRef, { lastMessage: t('toast_order_placed', { orderId: orderId.slice(-6) }), lastUpdated: new Date() });
  
  // Increment admin unread count (so seller sees notification)
  await updateDoc(chatRef, { unreadAdminCount: increment(1) });
  
  showToast(t('toast_order_sent'), 'success');
  cart = [];
  saveCart();
  renderCartModal();
  if (cartModal) cartModal.style.display = 'none';
  openChatModal();
}

// -------------------- CHAT UI --------------------
async function openChatModal() {
  if (!currentUser) { showToast(t('toast_sign_in_first'), 'error'); return; }
  if (!sellerId) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "seller"));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) sellerId = querySnap.docs[0].id;
    else { showToast(t('toast_seller_not_found'), 'error'); return; }
  }
  
  // Ensure chat document exists and we have currentChatId
  const chatId = currentUser.uid < sellerId ? `${currentUser.uid}_${sellerId}` : `${sellerId}_${currentUser.uid}`;
  currentChatId = chatId;
  
  // Reset unread count for this chat
  await resetUnreadCount();
  
  if (chatUnsubscribe) chatUnsubscribe();
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  chatUnsubscribe = onSnapshot(q, (snapshot) => {
    if (chatMessagesDiv) {
      chatMessagesDiv.innerHTML = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        const isMe = msg.senderId === currentUser.uid;
        const messageHtml = `
          <div class="chat-bubble ${isMe ? 'me' : 'other'}">
            <div class="bubble-text">${escapeHtml(msg.text).replace(/\n/g, '<br>')}</div>
            <div class="bubble-time">${msg.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
          </div>
        `;
        chatMessagesDiv.innerHTML += messageHtml;
      });
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
  });
  if (chatModal) chatModal.style.display = 'flex';
}

async function sendChatMessage() {
  const text = chatInput?.value.trim();
  if (!text || !currentUser || !currentChatId) return;
  await withLoading(sendChatBtn, async () => {
    const chatRef = doc(db, "chats", currentChatId);
    const messagesRef = collection(chatRef, "messages");
    // Increment admin unread count (so seller sees notification)
    await updateDoc(chatRef, { unreadAdminCount: increment(1) });
    await updateDoc(chatRef, { lastMessage: text.substring(0, 100), lastUpdated: new Date() });
    chatInput.value = '';
    await addDoc(messagesRef, { senderId: currentUser.uid, text: text, timestamp: new Date() });
  });
}

// -------------------- AUTHENTICATION --------------------
async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      currentUser = user;
      if (usernameModal) usernameModal.style.display = 'flex';
    } else {
      currentUser = user;
      userRole = userDoc.data().role;
      const savedUsername = userDoc.data().username;
      currentUsername = savedUsername;
      updateUIForLoggedIn(savedUsername);
      showToast(t('toast_welcome', { username: savedUsername || user.displayName }), 'success');
    }
  } catch (error) {
    console.error("Sign-in error:", error);
    let errorMsg = error.message;
    if (error.code === 'auth/popup-blocked') errorMsg = "Popup blocked! Please allow popups for this site.";
    else if (error.code === 'auth/unauthorized-domain') errorMsg = "Domain not authorized. Add localhost to Firebase authorized domains.";
    else if (error.code === 'auth/operation-not-allowed') errorMsg = "Google Sign-In not enabled. Enable it in Firebase Console.";
    showToast(t('toast_error_prefix') + errorMsg, 'error');
  }
}

async function saveUsername() {
  const username = usernameInput?.value.trim();
  if (!username || username.length < 3) { showToast(t('toast_username_short'), 'error'); return; }
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username));
  const existing = await getDocs(q);
  if (!existing.empty) { showToast(t('toast_username_taken'), 'error'); return; }
  await setDoc(doc(db, "users", currentUser.uid), {
    email: currentUser.email,
    username: username,
    role: "customer",
    createdAt: new Date()
  });
  userRole = "customer";
  currentUsername = username;
  if (usernameModal) usernameModal.style.display = 'none';
  updateUIForLoggedIn(username);
  showToast(t('toast_welcome', { username }), 'success');
}

function updateUIForLoggedIn(username) {
  currentUsername = username;
  if (loginBtn) loginBtn.style.display = 'none';
  if (chatBtn) chatBtn.style.display = 'flex';
  if (logoutUserBtn) logoutUserBtn.style.display = 'flex';
  
  const fullName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  updateUserHeaderDisplay(fullName, currentUsername);
  
  if (logoutUserBtn) logoutUserBtn.innerHTML = `🚪 ${t('logout_button')}`;
  if (chatBtn) chatBtn.innerHTML = `💬 ${t('chat_button')} <span id="chatUnreadBadge" class="unread-badge" style="display: none;">0</span>`;
  
  // Fetch sellerId first, then start unread listener
  fetchSellerIdAndStartUnreadListener();
}

async function fetchSellerIdAndStartUnreadListener() {
  if (!currentUser) return;
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", "seller"));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    sellerId = querySnap.docs[0].id;
    await startUnreadListener();
  } else {
    console.warn("Seller not found, cannot listen for unread messages");
  }
}

function signOutUser() {
  signOut(auth).then(() => {
    currentUser = null;
    userRole = null;
    currentUsername = null;
    sellerId = null;
    if (loginBtn) loginBtn.style.display = 'flex';
    if (chatBtn) chatBtn.style.display = 'none';
    if (logoutUserBtn) logoutUserBtn.style.display = 'none';
    hideUserHeader();
    if (chatUnsubscribe) chatUnsubscribe();
    if (unreadChatUnsubscribe) unreadChatUnsubscribe();
    updateUnreadBadge(0);
    showToast(t('toast_signed_out'), 'info');
  }).catch(err => showToast(t('toast_error_prefix') + err.message, 'error'));
}

// -------------------- PRODUCT LISTENER --------------------
function initProductsListener() {
  if (unsubscribeProducts) unsubscribeProducts();
  unsubscribeProducts = onSnapshot(productsCol, (snapshot) => {
    productsArray = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderCategories();
    renderCustomerProducts();
  }, (err) => showToast(t('toast_error_prefix') + err.message, 'error'));
}

// -------------------- AUTH STATE LISTENER --------------------
function initAuthListener() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userRole = userDoc.data().role;
        const savedUsername = userDoc.data().username;
        currentUsername = savedUsername;
        updateUIForLoggedIn(savedUsername);
      } else {
        if (usernameModal) usernameModal.style.display = 'flex';
        hideUserHeader();
      }
    } else {
      currentUser = null;
      userRole = null;
      currentUsername = null;
      sellerId = null;
      if (loginBtn) loginBtn.style.display = 'flex';
      if (chatBtn) chatBtn.style.display = 'none';
      if (logoutUserBtn) logoutUserBtn.style.display = 'none';
      hideUserHeader();
      if (chatUnsubscribe) chatUnsubscribe();
      if (unreadChatUnsubscribe) unreadChatUnsubscribe();
      updateUnreadBadge(0);
    }
  });
}

// -------------------- EVENT BINDING --------------------
function bindEvents() {
  if (loginBtn) loginBtn.addEventListener('click', handleGoogleSignIn);
  if (chatBtn) chatBtn.addEventListener('click', openChatModal);
  if (logoutUserBtn) logoutUserBtn.addEventListener('click', signOutUser);
  if (sendOrderBtn) sendOrderBtn.addEventListener('click', () => withLoading(sendOrderBtn, sendOrderAsMessage));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => { if (cartModal) cartModal.style.display = 'none'; });
  if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
  if (cartButton) cartButton.addEventListener('click', () => { renderCartModal(); if (cartModal) cartModal.style.display = 'flex'; });
  if (productSearch) productSearch.addEventListener('input', (e) => { searchQuery = e.target.value; renderCustomerProducts(); });
  if (saveUsernameBtn) saveUsernameBtn.addEventListener('click', saveUsername);
  if (closeChatBtn) closeChatBtn.addEventListener('click', () => { if (chatModal) chatModal.style.display = 'none'; });
  if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
  if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
  const langToggle = document.getElementById('languageToggle');
  if (langToggle) langToggle.addEventListener('click', toggleLanguage);
  window.addEventListener('click', (e) => {
    if (cartModal && e.target === cartModal) cartModal.style.display = 'none';
    if (chatModal && e.target === chatModal) chatModal.style.display = 'none';
  });
}

// -------------------- DARK MODE --------------------
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'enabled') document.body.classList.add('dark');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('darkMode', document.body.classList.contains('dark') ? 'enabled' : 'disabled');
    });
  }
}

// -------------------- MOBILE SIDEBAR --------------------
function initMobileSidebar() {
  if (!document.querySelector('.sidebar-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    sidebarOverlay = overlay;
  } else {
    sidebarOverlay = document.querySelector('.sidebar-overlay');
  }
  function openSidebar() {
    if (window.innerWidth <= 768 && sidebar) {
      sidebar.classList.add('open');
      sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeSidebar();
      if (sidebar) sidebar.style.display = '';
    } else {
      if (sidebar && !sidebar.classList.contains('open') && sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// -------------------- INITIALIZATION --------------------
console.log("Customer JS loaded");
initDarkMode();
loadCart();
bindEvents();
initMobileSidebar();
initProductsListener();
initAuthListener();
initStoreStatusListener();
setLanguage(currentLanguage);