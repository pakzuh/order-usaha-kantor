
function saveCartToStorage() {
  localStorage.setItem('po_cart', JSON.stringify(state.cart));
}
// Logika Aplikasi Web Order PO Internal Teman Kantor

function safeGetJSON(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

// State
let state = {
  activeMerchant: "all",
  searchQuery: "",
  cart: safeGetJSON("po_cart", []),
  savedOrders: safeGetJSON("po_orders", []),
  currentProductModal: null,
  activeView: "menu", // 'menu' | 'recap'
  buyerName: localStorage.getItem("po_buyer_name") || "",
  buyerDivision: localStorage.getItem("po_buyer_division") || "",
  recapMerchantFilter: "all"
};

// Format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

// Inisialisasi aman (kompatibel dengan Cloudflare Rocket Loader & dynamic script loading)
function initApp() {
  const data = window.MERCHANTS_DATA || (typeof MERCHANTS_DATA !== "undefined" ? MERCHANTS_DATA : null);
  if (!data || !Array.isArray(data)) {
    setTimeout(initApp, 50);
    return;
  }
  renderMerchantDirectory();
  renderMerchantTabs();
  renderProducts();
  updateCartBadge();
  initEventListeners();
  renderRecap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// Event Listeners
function initEventListeners() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", debounceSearch);
  }

  // Input profile simpan ke localstorage
  const buyerNameInput = document.getElementById("buyer-name-input");
  if (buyerNameInput) {
    buyerNameInput.value = state.buyerName;
    buyerNameInput.addEventListener("input", (e) => {
      state.buyerName = e.target.value;
      localStorage.setItem("po_buyer_name", state.buyerName);
    });
  }

  const buyerDivisionInput = document.getElementById("buyer-division-input");
  if (buyerDivisionInput) {
    buyerDivisionInput.value = state.buyerDivision;
    buyerDivisionInput.addEventListener("input", (e) => {
      state.buyerDivision = e.target.value;
      localStorage.setItem("po_buyer_division", state.buyerDivision);
    });
  }
}

// Data Visual & Ilustrasi untuk Showcase Usaha Teman
function getMerchantVisuals(merchantId) {
  const visuals = {
    "street-devri": {
      gradient: "from-amber-500 via-orange-500 to-red-500",
      statusText: "● Buka PO",
      statusClass: "bg-emerald-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
        </svg>
      `
    },
    "naspad-faldo": {
      gradient: "from-red-600 via-rose-700 to-amber-700",
      statusText: "● Buka PO",
      statusClass: "bg-emerald-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      `
    },
    "western-kenomie": {
      gradient: "from-rose-500 via-pink-600 to-amber-500",
      statusText: "● Buka PO",
      statusClass: "bg-emerald-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
        </svg>
      `
    },
    "daily-wash": {
      gradient: "from-cyan-500 via-sky-500 to-blue-600",
      statusText: "Ready Stok",
      statusClass: "bg-sky-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
        </svg>
      `
    },
    "jajan-nia": {
      gradient: "from-red-500 via-rose-500 to-amber-500",
      statusText: "● Buka PO",
      statusClass: "bg-emerald-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      `
    },
    "gabin-giani": {
      gradient: "from-emerald-600 via-teal-600 to-amber-500",
      statusText: "● Buka PO",
      statusClass: "bg-emerald-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      `
    },
    "nasjag-galuh": {
      gradient: "from-amber-400 via-yellow-500 to-orange-500",
      statusText: "● Buka PO",
      statusClass: "bg-emerald-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `
    },
    "aparsi-shop": {
      gradient: "from-slate-800 via-indigo-900 to-blue-950",
      statusText: "🌐 Website",
      statusClass: "bg-indigo-500 text-white",
      svgIllustration: `
        <svg class="absolute -right-3 -bottom-3 w-20 h-20 text-white/20 select-none pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
      `
    }
  };
  return visuals[merchantId] || {
    gradient: "from-orange-500 to-amber-500",
    statusText: "Buka PO",
    statusClass: "bg-emerald-500 text-white",
    svgIllustration: ""
  };
}

// Render Showcase Direktori Usaha Teman
function renderMerchantDirectory() {
  const container = document.getElementById("merchant-directory-grid");
  if (!container) return;

  let html = "";
  MERCHANTS_DATA.forEach((m) => {
    const isActive = state.activeMerchant === m.id;
    const isExternal = m.isExternalWeb;
    const vis = getMerchantVisuals(m.id);
    const shortOwner = m.owner.replace(/\s*\(.*?\)/g, "").trim();

    html += `
      <div onclick="selectMerchant('${m.id}')" 
        class="cursor-pointer group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 ${
          isActive 
            ? "border-orange-500 ring-2 ring-orange-500/50 shadow-md bg-orange-50/20" 
            : "border-slate-200/90 shadow-xs hover:border-orange-300"
        }">
        
        <!-- Header Visual Ilustrasi Bisnis -->
        <div class="h-20 sm:h-24 bg-gradient-to-tr ${vis.gradient} p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden select-none">
          ${vis.svgIllustration}
          <div class="flex items-center justify-between z-10">
            <span class="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-xs flex items-center justify-center text-lg shadow-sm">
              ${m.avatar}
            </span>
            <span class="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full ${vis.statusClass} shadow-xs">
              ${vis.statusText}
            </span>
          </div>
          <div class="z-10">
            <span class="text-[10px] sm:text-[11px] font-bold text-white/95 drop-shadow-xs block tracking-wide uppercase">
              PIC: ${shortOwner}
            </span>
          </div>
        </div>

        <!-- Body Info Usaha -->
        <div class="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-orange-600 transition-colors line-clamp-1">
              ${m.name}
            </h4>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              ${m.tagline}
            </p>
          </div>

          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[9px] sm:text-[10px] font-bold text-slate-500">
              ${m.products.length} Menu
            </span>
            <span class="text-[10px] sm:text-[11px] font-bold text-orange-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>${isActive ? "Aktif" : "Buka Menu"}</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </span>
          </div>
        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

// Render Tabs Merchant
function renderMerchantTabs() {
  const container = document.getElementById("merchant-tabs");
  if (!container) return;

  let html = `
    <button onclick="selectMerchant('all')" class="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
      state.activeMerchant === "all"
        ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
    }">
      <span>🌟</span> Semua Toko (${MERCHANTS_DATA.length})
    </button>
  `;

  MERCHANTS_DATA.forEach((m) => {
    const isActive = state.activeMerchant === m.id;
    html += `
      <button onclick="selectMerchant('${m.id}')" class="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
        isActive
          ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
      }">
        <span>${m.avatar}</span>
        <span>${m.name}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

// Select Merchant
function selectMerchant(merchantId) {
  state.activeMerchant = merchantId;
  renderMerchantTabs();
  renderMerchantDirectory();
  renderProducts();

  // Scroll smooth ke container produk
  const el = document.getElementById("product-section-title");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Render Produk
function renderProducts() {
  const container = document.getElementById("products-container");
  const sectionTitle = document.getElementById("product-section-title");
  const merchantBanner = document.getElementById("merchant-banner");

  if (!container) return;

  // Filter merchants
  const merchantsToDisplay = state.activeMerchant === "all"
    ? MERCHANTS_DATA
    : MERCHANTS_DATA.filter((m) => m.id === state.activeMerchant);

  // Update banner jika spesifik merchant
  if (merchantBanner) {
    if (state.activeMerchant !== "all") {
      const current = MERCHANTS_DATA.find((m) => m.id === state.activeMerchant);
      if (current) {
        merchantBanner.classList.remove("hidden");
        if (current.isExternalWeb) {
        merchantBanner.innerHTML = `
          <div class="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0 border border-red-100">
                ${current.avatar}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-bold text-slate-900 text-lg sm:text-xl">${current.name}</h3>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    🌐 Website Khusus
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-600 mt-0.5">PIC: <span class="font-medium text-slate-800">${current.owner}</span> • ${current.tagline}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span class="flex items-center gap-1">🕒 ${current.schedule}</span>
                  <span class="flex items-center gap-1 font-semibold text-slate-700">🛒 Website: aparsi.shop</span>
                </div>
              </div>
            </div>
            <a href="${current.website}" target="_blank" 
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all self-end sm:self-center">
              <span>Buka Website aparsi.shop ↗</span>
            </a>
          </div>
        `;
      } else {
        merchantBanner.innerHTML = `
          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/70 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex items-start gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl shrink-0 border border-orange-100">
                ${current.avatar}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-bold text-slate-900 text-lg sm:text-xl">${current.name}</h3>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    ● Buka PO
                  </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-600 mt-0.5">PIC: <span class="font-medium text-slate-800">${current.owner}</span> • ${current.tagline}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span class="flex items-center gap-1">🕒 ${current.schedule}</span>
                  <span class="flex items-center gap-1 font-semibold text-slate-700">💳 ${current.payment.bank}: ${current.payment.accountNumber}</span>
                </div>
              </div>
            </div>
            <button onclick="copyToClipboard('${current.payment.accountNumber}', 'Nomor rekening ${current.payment.bank} berhasil disalin!')" 
              class="px-3.5 py-1.5 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all self-end sm:self-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Salin Rekening
            </button>
          </div>
        `;
      }
    } else {
      merchantBanner.classList.add("hidden");
    }
  } else {
    merchantBanner.classList.add("hidden");
  }
  }

  let fullHtml = "";
  let totalMatches = 0;

  merchantsToDisplay.forEach((merchant) => {
    // Filter produk berdasarkan search
    const matchingProducts = merchant.products.filter((p) => {
      const q = state.searchQuery;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });

    if (matchingProducts.length === 0) return;
    totalMatches += matchingProducts.length;

    fullHtml += `
      <div class="mb-10">
        <div class="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">${merchant.avatar}</span>
            <div>
              <h3 class="font-bold text-slate-900 text-base sm:text-lg">${merchant.name}</h3>
              <p class="text-xs text-slate-500">${merchant.owner} • ${merchant.schedule}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${merchant.isExternalWeb ? `<a href="${merchant.website}" target="_blank" class="text-xs font-bold text-red-600 hover:underline">aparsi.shop ↗</a>` : ''}
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              ${matchingProducts.length} Menu
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          ${matchingProducts
            .map((product) => renderProductCard(merchant, product))
            .join("")}
        </div>
      </div>
    `;
  });

  if (totalMatches === 0) {
    container.innerHTML = `
      <div class="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
        <div class="text-4xl mb-2">🔍</div>
        <h4 class="font-bold text-slate-800 text-base">Menu tidak ditemukan</h4>
        <p class="text-xs text-slate-500 mt-1">Coba kata kunci lain atau pilih toko yang berbeda.</p>
        <button onclick="document.getElementById('search-input').value=''; state.searchQuery=''; renderProducts();" class="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium">Reset Pencarian</button>
      </div>
    `;
    return;
  }

  container.innerHTML = fullHtml;
}

// Render Card Produk (Compact 2 Kolom Mobile)
function renderProductCard(merchant, product) {
  const isExternal = product.isExternalLink || merchant.isExternalWeb;
  const hasCustomization = product.hasLevel || (product.options && product.options.length > 0);

  let buttonHtml = "";
  if (isExternal) {
    buttonHtml = `
      <a href="${product.directUrl || merchant.website}" target="_blank" 
        class="w-full py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs bg-red-600 hover:bg-red-700 text-white shadow-red-600/20">
        <span>Buka Web ↗</span>
      </a>
    `;
  } else {
    buttonHtml = `
      <button onclick="handleProductClick('${merchant.id}', '${product.id}')" 
        class="w-full py-1.5 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs ${
          hasCustomization
            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
            : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
        }">
        ${
          hasCustomization
            ? `<span>Pilih Opsi</span> <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`
            : `<span>+ Tambah</span>`
        }
      </button>
    `;
  }

  return `
    <div class="bg-white rounded-2xl border border-slate-200/80 p-2.5 sm:p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-orange-300">
      <div>
        <div class="flex items-start justify-between gap-1 mb-1.5 flex-wrap">
          <span class="inline-block px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-slate-100 text-slate-600 truncate max-w-[90px] sm:max-w-none">
            ${product.category}
          </span>
          ${
            product.hasLevel
              ? '<span class="inline-block px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-red-100 text-red-700">🌶️ Lv 0-6</span>'
              : isExternal
              ? '<span class="inline-block px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-amber-100 text-amber-800">🌐 Web</span>'
              : ""
          }
        </div>
        <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-orange-600 transition-colors line-clamp-2">
          ${product.name}
        </h4>
        <p class="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          ${product.description}
        </p>
      </div>

      <div class="mt-2.5 pt-2 border-t border-slate-100 flex flex-col">
        <div class="flex items-baseline justify-between gap-1 mb-1.5">
          <span class="text-[9px] sm:text-[10px] text-slate-400 font-medium">Mulai</span>
          <span class="text-xs sm:text-sm font-extrabold text-slate-900">${formatRupiah(product.price)}</span>
        </div>
        ${buttonHtml}
      </div>
    </div>
  `;
}

// Handle Klik Produk
function handleProductClick(merchantId, productId) {
  const merchant = MERCHANTS_DATA.find((m) => m.id === merchantId);
  const product = merchant.products.find((p) => p.id === productId);

  const hasCustomization = product.hasLevel || (product.options && product.options.length > 0);

  if (!hasCustomization) {
    // Tambah langsung ke cart
    addToCartDirect(merchant, product);
  } else {
    // Buka modal kustomisasi
    openProductModal(merchant, product);
  }
}

// Buka Modal Kustomisasi
function openProductModal(merchant, product) {
  state.currentProductModal = {
    merchant,
    product,
    selectedOptions: {},
    spicyLevel: product.hasLevel ? 3 : null,
    notes: "",
    qty: 1
  };

  // Set default opsi pertama
  if (product.options) {
    product.options.forEach((opt, idx) => {
      state.currentProductModal.selectedOptions[opt.name] = {
        choice: opt.choices[0],
        priceDiff: opt.priceDiff ? opt.priceDiff[0] : 0
      };
    });
  }

  const modal = document.getElementById("product-modal");
  const modalContent = document.getElementById("product-modal-content");
  if (!modal || !modalContent) return;

  renderModalContent();
  modal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  state.currentProductModal = null;
}

// Render Isi Modal
function renderModalContent() {
  const modalContent = document.getElementById("product-modal-content");
  if (!modalContent || !state.currentProductModal) return;

  const { merchant, product, spicyLevel, selectedOptions, notes, qty } = state.currentProductModal;

  // Hitung harga per item
  let itemPrice = product.price;
  Object.values(selectedOptions).forEach((opt) => {
    if (opt.priceDiff) itemPrice += opt.priceDiff;
  });

  const totalPrice = itemPrice * qty;

  let optionsHtml = "";

  // Render opsi dropdown/radio
  if (product.options && product.options.length > 0) {
    product.options.forEach((opt) => {
      optionsHtml += `
        <div class="mb-4">
          <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">${opt.name}</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${opt.choices
              .map((choice, idx) => {
                const diff = opt.priceDiff ? opt.priceDiff[idx] : 0;
                const diffText = diff > 0 ? ` (+${formatRupiah(diff)})` : diff < 0 ? ` (${formatRupiah(diff)})` : "";
                const isSelected = selectedOptions[opt.name] && selectedOptions[opt.name].choice === choice;

                return `
                  <button type="button" onclick="setModalOption('${opt.name}', '${choice}', ${diff})"
                    class="p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-orange-500 bg-orange-50 text-orange-950 font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }">
                    <span>${choice}</span>
                    <span class="text-[11px] opacity-75">${diffText}</span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    });
  }

  // Render Level Pedas Slider/Buttons
  let spicyHtml = "";
  if (product.hasLevel) {
    spicyHtml = `
      <div class="mb-4 p-3.5 bg-red-50/70 border border-red-200/60 rounded-2xl">
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>🌶️</span> Level Pedas Cabai (0 - 6)
          </label>
          <span class="px-2 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-xs">
            ${spicyLevel === 0 ? "Tidak Pedas (0 Cabai)" : `Cabai ${spicyLevel}`}
          </span>
        </div>
        <div class="flex items-center gap-1.5 mt-2 justify-between">
          ${[0, 1, 2, 3, 4, 5, 6]
            .map(
              (lvl) => `
            <button type="button" onclick="setModalSpicyLevel(${lvl})"
              class="w-10 h-10 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                spicyLevel === lvl
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                  : "bg-white text-slate-700 border border-red-200 hover:bg-red-100"
              }">
              ${lvl === 0 ? "0" : `${lvl}🌶`}
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <div class="p-4 sm:p-6">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <span class="text-xs font-semibold text-slate-400">${merchant.name}</span>
          <h3 class="font-extrabold text-slate-900 text-lg sm:text-xl">${product.name}</h3>
          <p class="text-xs text-slate-500 mt-1">${product.description}</p>
        </div>
        <button onclick="closeProductModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">✕</button>
      </div>

      <div class="my-4 max-h-[60vh] overflow-y-auto pr-1">
        ${spicyHtml}
        ${optionsHtml}

        <div class="mb-4">
          <label class="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Catatan Khusus (Opsional)</label>
          <input type="text" id="modal-notes" value="${notes}" oninput="state.currentProductModal.notes = this.value"
            placeholder="Contoh: tanpa kubis, paha bawah, sambal pisah, garing"
            class="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50 focus:bg-white" />
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
          <button type="button" onclick="changeModalQty(-1)" class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100">−</button>
          <span class="w-8 text-center font-bold text-slate-900 text-sm">${qty}</span>
          <button type="button" onclick="changeModalQty(1)" class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100">+</button>
        </div>

        <button type="button" onclick="saveModalToCart()"
          class="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 flex items-center justify-between transition-all">
          <span>Tambahkan ke Keranjang</span>
          <span>${formatRupiah(totalPrice)}</span>
        </button>
      </div>
    </div>
  `;
}

function setModalOption(optionName, choice, priceDiff) {
  if (!state.currentProductModal) return;
  state.currentProductModal.selectedOptions[optionName] = { choice, priceDiff };
  renderModalContent();
}

function setModalSpicyLevel(lvl) {
  if (!state.currentProductModal) return;
  state.currentProductModal.spicyLevel = lvl;
  renderModalContent();
}

function changeModalQty(delta) {
  if (!state.currentProductModal) return;
  const newQty = state.currentProductModal.qty + delta;
  if (newQty >= 1) {
    state.currentProductModal.qty = newQty;
    renderModalContent();
  }
}

// Simpan dari Modal ke Cart
function saveModalToCart() {
  if (!state.currentProductModal) return;

  const { merchant, product, spicyLevel, selectedOptions, notes, qty } = state.currentProductModal;

  let unitPrice = product.price;
  let optionsTextArr = [];

  if (spicyLevel !== null) {
    optionsTextArr.push(spicyLevel === 0 ? "Tidak Pedas" : `Cabai ${spicyLevel}`);
  }

  Object.entries(selectedOptions).forEach(([name, opt]) => {
    if (opt.priceDiff) unitPrice += opt.priceDiff;
    optionsTextArr.push(opt.choice);
  });

  const cartItem = {
    cartId: "cart-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
    merchantId: merchant.id,
    merchantName: merchant.name,
    merchantOwner: merchant.owner,
    merchantPhone: merchant.phone,
    merchantBank: merchant.payment.bank,
    merchantAccount: merchant.payment.accountNumber,
    merchantAccountName: merchant.payment.accountName,
    productId: product.id,
    productName: product.name,
    unitPrice: unitPrice,
    qty: qty,
    optionsText: optionsTextArr.join(", "),
    notes: notes ? notes.trim() : ""
  };

  state.cart.push(cartItem);
  saveCart();
  closeProductModal();
  showToast(`${product.name} ditambahkan ke keranjang!`);
  updateCartBadge();
}

// Tambah Produk Tanpa Opsi Langsung ke Cart
function addToCartDirect(merchant, product) {
  const cartItem = {
    cartId: "cart-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
    merchantId: merchant.id,
    merchantName: merchant.name,
    merchantOwner: merchant.owner,
    merchantPhone: merchant.phone,
    merchantBank: merchant.payment.bank,
    merchantAccount: merchant.payment.accountNumber,
    merchantAccountName: merchant.payment.accountName,
    productId: product.id,
    productName: product.name,
    unitPrice: product.price,
    qty: 1,
    optionsText: "",
    notes: ""
  };

  state.cart.push(cartItem);
  saveCart();
  showToast(`${product.name} ditambahkan ke keranjang!`);
  updateCartBadge();
}

// Simpan Cart ke LocalStorage
function saveCart() {
  localStorage.setItem("po_cart", JSON.stringify(state.cart));
}

// Update Badge Keranjang Belanja
function updateCartBadge() {
  const badge = document.getElementById("cart-count-badge");
  const floatingBar = document.getElementById("floating-cart-bar");
  const floatingTotal = document.getElementById("floating-cart-total");
  const floatingItems = document.getElementById("floating-cart-items");

  const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  if (badge) {
    badge.innerText = totalQty;
    if (totalQty > 0) {
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  if (floatingBar) {
    if (totalQty > 0) {
      floatingBar.classList.remove("hidden");
      floatingTotal.innerText = formatRupiah(totalPrice);
      floatingItems.innerText = `${totalQty} Item Pesanan`;
    } else {
      floatingBar.classList.add("hidden");
    }
  }
}

// Buka/Tutup Drawer Keranjang
function openCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (!drawer) return;
  renderCartDrawer();
  drawer.classList.remove("translate-x-full");
  document.getElementById("cart-overlay").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (!drawer) return;
  drawer.classList.add("translate-x-full");
  document.getElementById("cart-overlay").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

// Render Isi Drawer Keranjang
function renderCartDrawer() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 px-4">
        <div class="text-5xl mb-3">🛒</div>
        <h4 class="font-bold text-slate-800 text-base">Keranjang Anda Kosong</h4>
        <p class="text-xs text-slate-500 mt-1">Pilih menu dari toko favorit Anda untuk memesan.</p>
        <button onclick="closeCartDrawer()" class="mt-4 px-4 py-2 bg-orange-500 text-white font-bold rounded-xl text-xs">
          Mulai Belanja
        </button>
      </div>
    `;
    return;
  }

  // Kelompokkan item per merchant
  const grouped = {};
  state.cart.forEach((item) => {
    if (!grouped[item.merchantId]) {
      grouped[item.merchantId] = {
        merchantId: item.merchantId,
        merchantName: item.merchantName,
        merchantOwner: item.merchantOwner,
        merchantPhone: item.merchantPhone,
        merchantBank: item.merchantBank,
        merchantAccount: item.merchantAccount,
        merchantAccountName: item.merchantAccountName,
        items: [],
        total: 0
      };
    }
    grouped[item.merchantId].items.push(item);
    grouped[item.merchantId].total += item.unitPrice * item.qty;
  });

  let html = `
    <!-- Input Nama Pemesan (Opsional) -->
    <div class="bg-white rounded-2xl border border-slate-200/90 p-3.5 mb-4 shadow-xs">
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>👤</span> Nama Pemesan <span class="text-slate-400 font-normal lowercase">(opsional)</span>
        </label>
        <span class="text-[10px] text-slate-400">Boleh kosong</span>
      </div>
      <input type="text" id="buyer-name-input" value="${state.buyerName || ''}" 
        oninput="state.buyerName = this.value; localStorage.setItem('po_buyer_name', this.value);" 
        placeholder="Nama / panggilan Anda (opsional)" 
        class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-orange-500 font-medium text-slate-800" />
    </div>
  `;

  Object.values(grouped).forEach((group) => {
    html += `
      <div class="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
          <div>
            <h4 class="font-bold text-slate-900 text-sm">${group.merchantName}</h4>
            <p class="text-[11px] text-slate-500">PIC: ${group.merchantOwner}</p>
          </div>
          <span class="text-xs font-extrabold text-orange-600">${formatRupiah(group.total)}</span>
        </div>

        <div class="space-y-3 mb-4">
          ${group.items
            .map(
              (item) => `
            <div class="flex items-start justify-between gap-2 text-xs border-b border-dashed border-slate-100 pb-2.5">
              <div class="flex-1">
                <div class="font-bold text-slate-800">${item.productName}</div>
                ${
                  item.optionsText
                    ? `<div class="text-[11px] text-orange-600 font-medium mt-0.5">🔹 ${item.optionsText}</div>`
                    : ""
                }
                ${
                  item.notes
                    ? `<div class="text-[11px] text-slate-500 italic mt-0.5">📝 Catatan: "${item.notes}"</div>`
                    : ""
                }
                <div class="text-slate-500 font-semibold mt-1">${formatRupiah(item.unitPrice)} x ${item.qty}</div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <div class="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                  <button onclick="updateCartItemQty('${item.cartId}', -1)" class="w-6 h-6 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-200 rounded-l-lg">−</button>
                  <span class="w-6 text-center font-bold text-slate-800 text-xs">${item.qty}</span>
                  <button onclick="updateCartItemQty('${item.cartId}', 1)" class="w-6 h-6 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-200 rounded-r-lg">+</button>
                </div>
                <button onclick="removeCartItem('${item.cartId}')" class="text-red-500 hover:text-red-700 p-1 text-sm font-bold">🗑️</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <!-- Rekening & Checkout Per Merchant -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs mb-3">
          <div class="flex items-center justify-between text-[11px] text-slate-600 mb-1">
            <span>Transfer ke ${group.merchantBank}:</span>
            <button onclick="copyToClipboard('${group.merchantAccount}', 'No. Rekening ${group.merchantBank} disalin!')" class="text-orange-600 hover:underline font-bold flex items-center gap-0.5">
              📋 Salin No Rek
            </button>
          </div>
          <div class="font-mono font-bold text-slate-900">${group.merchantAccount}</div>
          <div class="text-[11px] text-slate-500">a.n ${group.merchantAccountName}</div>
        </div>

        <button onclick="checkoutMerchant('${group.merchantId}')" 
          class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all">
          <span>💬 Order Toko Ini via WhatsApp (${formatRupiah(group.total)})</span>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Update Qty Item di Cart
function updateCartItemQty(cartId, delta) {
  const item = state.cart.find((i) => i.cartId === cartId);
  if (!item) return;

  const newQty = item.qty + delta;
  if (newQty <= 0) {
    removeCartItem(cartId);
  } else {
    item.qty = newQty;
    saveCart();
    renderCartDrawer();
    updateCartBadge();
  }
}

// Hapus Item dari Cart
function removeCartItem(cartId) {
  state.cart = state.cart.filter((i) => i.cartId !== cartId);
  saveCart();
  renderCartDrawer();
  updateCartBadge();
  showToast("Item dihapus dari keranjang");
}

// Checkout Per Merchant
function checkoutMerchant(merchantId) {
  const buyerName = (state.buyerName || "").trim();
  const buyerDivision = (state.buyerDivision || "").trim();

  const items = state.cart.filter((i) => i.merchantId === merchantId);
  if (items.length === 0) return;

  const sample = items[0];
  const merchantTotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

  // Buat pesan teks WhatsApp rapi
  let message = `*FORMAT ORDER ${sample.merchantName.toUpperCase()}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  if (buyerName) {
    message += `👤 *Nama Pemesan:* ${buyerName}\n`;
  }
  if (buyerDivision) {
    message += `🏢 *Divisi/Bagian:* ${buyerDivision}\n`;
  }
  message += `📅 *Tanggal:* ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n\n`;
  message += `📋 *Rincian Pesanan:*\n`;

  items.forEach((item, idx) => {
    message += `${idx + 1}. *${item.productName}* (${item.qty}x)\n`;
    if (item.optionsText) {
      message += `   ▪ Varian/Level: ${item.optionsText}\n`;
    }
    if (item.notes) {
      message += `   ▪ Catatan: _${item.notes}_\n`;
    }
    message += `   ▪ Subtotal: ${formatRupiah(item.unitPrice * item.qty)}\n`;
  });

  message += `\n💰 *Total Pembayaran:* ${formatRupiah(merchantTotal)}\n`;
  message += `💳 *Tujuan Transfer:* ${sample.merchantBank} ${sample.merchantAccount} (a.n. ${sample.merchantAccountName})\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_Pesanan dikirim via Web Order PO Internal_ ✨`;

  // Simpan riwayat order ke savedOrders
  const orderRecord = {
    orderId: "ORD-" + Date.now(),
    date: new Date().toISOString(),
    merchantId: sample.merchantId,
    merchantName: sample.merchantName,
    merchantOwner: sample.merchantOwner,
    buyerName: buyerName || "Rekan Kantor",
    buyerDivision: buyerDivision || "-",
    items: items,
    total: merchantTotal
  };

  state.savedOrders.unshift(orderRecord);
  localStorage.setItem("po_orders", JSON.stringify(state.savedOrders));

  // Hapus item merchant ini dari cart
  state.cart = state.cart.filter((i) => i.merchantId !== merchantId);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
  renderRecap();

  // Buka WhatsApp
  const phone = sample.merchantPhone ? sample.merchantPhone.replace(/[^0-9]/g, "") : "";
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(waUrl, "_blank");
}

// Salin ke Clipboard dengan Toast
function copyToClipboard(text, successMsg) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast(successMsg || "Berhasil disalin ke clipboard!");
    })
    .catch(() => {
      showToast("Gagal menyalin otomatis. Silakan salin manual.");
    });
}

// Toast Notifikasi
function showToast(msg) {
  const toast = document.getElementById("toast-notification");
  const toastText = document.getElementById("toast-text");
  if (!toast || !toastText) return;

  toastText.innerText = msg;
  toast.classList.remove("translate-y-24", "opacity-0");
  toast.classList.add("translate-y-0", "opacity-100");

  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.add("translate-y-24", "opacity-0");
    toast.classList.remove("translate-y-0", "opacity-100");
  }, 3000);
}

// Switch Antara Menu dan Rekap
function switchView(viewName) {
  state.activeView = viewName;

  const menuView = document.getElementById("menu-view");
  const recapView = document.getElementById("recap-view");
  const tabMenuBtn = document.getElementById("tab-view-menu");
  const tabRecapBtn = document.getElementById("tab-view-recap");

  if (viewName === "menu") {
    menuView.classList.remove("hidden");
    recapView.classList.add("hidden");

    tabMenuBtn.classList.add("bg-slate-900", "text-white");
    tabMenuBtn.classList.remove("bg-white", "text-slate-600");

    tabRecapBtn.classList.remove("bg-slate-900", "text-white");
    tabRecapBtn.classList.add("bg-white", "text-slate-600");
  } else {
    menuView.classList.add("hidden");
    recapView.classList.remove("hidden");

    tabRecapBtn.classList.add("bg-slate-900", "text-white");
    tabRecapBtn.classList.remove("bg-white", "text-slate-600");

    tabMenuBtn.classList.remove("bg-slate-900", "text-white");
    tabMenuBtn.classList.add("bg-white", "text-slate-600");

    renderRecap();
  }
}

// Render Tab Rekapitulasi (Admin/Penjual)
function renderRecap() {
  const container = document.getElementById("recap-container");
  const filterSelect = document.getElementById("recap-filter-merchant");
  if (!container) return;

  // Isi dropdown filter
  if (filterSelect && filterSelect.options.length <= 1) {
    MERCHANTS_DATA.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.innerText = `${m.avatar} ${m.name} (${m.owner})`;
      filterSelect.appendChild(opt);
    });
  }

  const selectedMerchant = filterSelect ? filterSelect.value : "all";

  const filteredOrders = selectedMerchant === "all"
    ? state.savedOrders
    : state.savedOrders.filter((o) => o.merchantId === selectedMerchant);

  if (filteredOrders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
        <div class="text-4xl mb-2">📋</div>
        <h4 class="font-bold text-slate-800 text-sm">Belum Ada Pesanan yang Direkap</h4>
        <p class="text-xs text-slate-500 mt-1">Pesanan yang di-checkout dari web ini akan otomatis masuk ke daftar rekap di sini.</p>
      </div>
    `;
    return;
  }

  // Hitung total omset
  const totalOmset = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  let html = `
    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <div class="text-xs text-emerald-800 font-semibold">Ringkasan Pesanan Terekap</div>
        <div class="text-xl font-extrabold text-emerald-950 mt-0.5">${formatRupiah(totalOmset)}</div>
        <div class="text-xs text-emerald-700 mt-0.5">${filteredOrders.length} Transaksi Pemesanan</div>
      </div>
      <button onclick="copyGroupRecap('${selectedMerchant}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
        <span>📋 Salin Format List WA Grup</span>
      </button>
    </div>

    <div class="space-y-4">
      ${filteredOrders
        .map(
          (order, idx) => `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-slate-300">
          <div class="flex items-start justify-between border-b border-slate-100 pb-2.5 mb-2.5">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 text-sm">${order.buyerName}</span>
                ${
                  order.buyerDivision
                    ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">${order.buyerDivision}</span>`
                    : ""
                }
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">${new Date(order.date).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })} • Toko: ${order.merchantName}</p>
            </div>
            <div class="text-right">
              <span class="font-bold text-sm text-slate-900">${formatRupiah(order.total)}</span>
            </div>
          </div>

          <div class="space-y-1.5 text-xs text-slate-700">
            ${order.items
              .map(
                (item) => `
              <div class="flex items-start justify-between">
                <span>• ${item.productName} (${item.qty}x) ${item.optionsText ? `<span class="text-orange-600 font-medium">[${item.optionsText}]</span>` : ""} ${item.notes ? `<span class="text-slate-400 italic">("${item.notes}")</span>` : ""}</span>
                <span class="font-medium text-slate-500">${formatRupiah(item.unitPrice * item.qty)}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  container.innerHTML = html;
}

// Salin Format List Rekap untuk WA Grup
function copyGroupRecap(merchantId) {
  const filteredOrders = merchantId === "all"
    ? state.savedOrders
    : state.savedOrders.filter((o) => o.merchantId === merchantId);

  if (filteredOrders.length === 0) return;

  const merchantName = merchantId === "all" ? "SEMUA BISNIS KANTOR" : filteredOrders[0].merchantName;

  let text = `📋 *REKAP PESANAN PO - ${merchantName.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  filteredOrders.forEach((order, idx) => {
    const itemsSummary = order.items
      .map((i) => {
        let s = `${i.productName} (${i.qty}x)`;
        if (i.optionsText) s += ` - ${i.optionsText}`;
        if (i.notes) s += ` (${i.notes})`;
        return s;
      })
      .join(", ");

    text += `${idx + 1}. *${order.buyerName}*: ${itemsSummary} - *${formatRupiah(order.total)}*\n`;
  });

  const totalOmset = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *TOTAL REKAP:* ${formatRupiah(totalOmset)} (${filteredOrders.length} Orang)\n`;
  text += `Mohon yang sudah transfer bisa konfirmasi / kirim bukti tf nggih 🙏`;

  copyToClipboard(text, "Format List WA Grup berhasil disalin!");
}


window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-to-top');
  if (btn) {
    if (window.scrollY > 300) {
      btn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.add('opacity-100', 'translate-y-0');
    } else {
      btn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      btn.classList.remove('opacity-100', 'translate-y-0');
    }
  }
});
