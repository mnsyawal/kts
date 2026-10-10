// ==========================================
// FILE: assets/js/api.js
// CORE API WRAPPER & CACHE SYSTEM
// ==========================================

const APP_CONFIG = {
    // Web App URL Google Apps Script (langsung, tanpa proxy)
    API_URL: 'https://script.google.com/macros/s/AKfycbziOhytTct3Ysyq93SsFgIZxLd9H0bGK6SyU3-OhtSOQAon40TJliSHmd1nqYkkLdMX/exec',
    CACHE_TIME_MINUTES: 10 // Berita publik di-cache 10 menit agar akses cepat
};

// ==========================================
// FUNGSI GAMBAR: Normalisasi URL & Fallback
// ==========================================

/**
 * Mengembalikan URL gambar yang siap ditampilkan.
 * Menangani berbagai format Google Drive URL dan fallback ke placeholder.
 */
function getImageUrl(rawUrl) {
    if (!rawUrl || rawUrl.toString().trim() === '') {
        return getPlaceholderImage('No Image');
    }

    const url = rawUrl.toString().trim();

    // Jika sudah thumbnail yang valid, langsung pakai
    if (url.includes('drive.google.com/thumbnail')) {
        return url;
    }

    // Jika format uc?export=view (lama), konversi ke thumbnail
    if (url.includes('drive.google.com/uc') && url.includes('id=')) {
        const match = url.match(/[?&]id=([^&]+)/);
        if (match && match[1]) {
            return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1000';
        }
    }

    // Jika format /file/d/.../view, ekstrak ID dan konversi
    if (url.includes('drive.google.com/file/d/')) {
        const match = url.match(/\/d\/([^/]+)/);
        if (match && match[1]) {
            return 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1000';
        }
    }

    // Jika URL lain (http/https) yang bukan Google Drive, pakai langsung
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Tidak dikenali, fallback
    return getPlaceholderImage('Invalid URL');
}

/**
 * Placeholder image saat gambar tidak tersedia.
 * Menggunakan placeholder sederhana berbasis SVG data URI agar selalu muncul.
 */
function getPlaceholderImage(text) {
    const encodedText = encodeURIComponent(text || 'No Image');
    return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" fill="#e2e8f0">' +
        '<rect width="100%" height="100%" fill="#166534"/>' +
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
        'fill="white" font-size="20" font-family="Arial, sans-serif">' + text + '</text>' +
        '</svg>'
    );
}

// ==========================================
// HELPER: Ambil Token dari LocalStorage
// ==========================================
function getToken() {
    return localStorage.getItem('KT_TOKEN') || '';
}

// ==========================================
// HELPER: Ambil User dari LocalStorage
// ==========================================
function getUser() {
    const u = localStorage.getItem('KT_USER');
    return u ? JSON.parse(u) : null;
}

// Fungsi Format Tanggal Indonesia
function formatTanggal(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Fungsi Fetch API GET dengan mekanisme Caching
// OTOMATIS menyertakan token untuk endpoint admin
async function fetchAPI(action, params = {}, useCache = true) {
    // Selalu sertakan token jika tersedia, agar endpoint admin bisa membaca data
    const token = getToken();
    const allParams = { action: action, ...params };
    if (token) {
        allParams.token = token;
    }

    // Susun Query String
    const urlParams = new URLSearchParams(allParams);
    const fullUrl = `${APP_CONFIG.API_URL}?${urlParams.toString()}`;

    // Hanya cache untuk request publik (tanpa token), jangan cache data admin
    const isPublicRequest = !token;
    const shouldUseCache = useCache && isPublicRequest;
    const cacheKey = `KT_CACHE_${action}_${JSON.stringify(params)}`;

    // 1. Cek Cache di LocalStorage (hanya untuk request publik)
    if (shouldUseCache) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            const now = new Date().getTime();
            if (now - parsedCache.timestamp < APP_CONFIG.CACHE_TIME_MINUTES * 60 * 1000) {
                console.log(`[CACHE HIT] Mengambil dari cache: ${action}`);
                return parsedCache.data;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }
    }

    // 2. Fetch ke Server
    try {
        console.log(`[API FETCH] Memanggil server: ${action}` + (token ? ' (dengan token)' : ' (publik)'));
        const response = await fetch(fullUrl);
        const result = await response.json();

        if (result.success) {
            // Hanya simpan cache untuk request publik
            if (shouldUseCache) {
                const cacheObject = {
                    timestamp: new Date().getTime(),
                    data: result
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
            }
            return result;
        } else {
            // Jika token expired, redirect ke login
            if (result.error_code === 'UNAUTHORIZED' && token) {
                console.warn('Token expired, redirect ke login...');
                localStorage.removeItem('KT_TOKEN');
                localStorage.removeItem('KT_USER');
                if (window.location.pathname.includes('/admin/')) {
                    window.location.replace('login.html');
                }
            }
            console.error("API Error:", result.message);
            return result; // Kembalikan error agar bisa ditampilkan
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        // Fallback cache hanya untuk request publik
        if (shouldUseCache) {
            const oldCache = localStorage.getItem(cacheKey);
            if (oldCache) {
                console.warn("Fallback to expired cache due to network error.");
                return JSON.parse(oldCache).data;
            }
        }
        return null;
    }
}

// Fungsi POST API (Untuk Login & Kirim Data - Tanpa Cache)
// Ini adalah SATU-SATUNYA definisi postAPI. auth.js tidak boleh menimpanya.
async function postAPI(action, dataObj, includeToken = true) {
    const payload = {
        action: action,
        data: dataObj
    };

    if (includeToken) {
        const token = getToken();
        if (token) payload.token = token;
    }

    try {
        const response = await fetch(APP_CONFIG.API_URL, {
            method: 'POST',
            // Gunakan text/plain agar tidak memicu CORS preflight (OPTIONS) di GAS
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        // Jika token expired, redirect ke login
        if (!result.success && result.error_code === 'UNAUTHORIZED') {
            localStorage.removeItem('KT_TOKEN');
            localStorage.removeItem('KT_USER');
            if (window.location.pathname.includes('/admin/')) {
                window.location.replace('login.html');
            }
        }
        
        return result;
    } catch (error) {
        console.error('POST Error:', error);
        return { success: false, message: 'Gagal menghubungi server.' };
    }
}

// ==========================================
// FUNGSI GLOBAL CMS PENGATURAN WEB
// ==========================================
async function applyGlobalWebSettings() {
    const res = await fetchAPI('getSettings', {}, true); 
    
    if (res && res.data) {
        const s = res.data;
        
        // --- APLIKASIKAN TEMA WARNA ---
        applyThemeColors(s);
        
        document.querySelectorAll('.cms-org-name').forEach(el => el.innerText = s.org_name || 'Karang Taruna');
        document.querySelectorAll('.cms-org-shortname').forEach(el => el.innerText = s.org_shortname || 'KT');
        document.querySelectorAll('.cms-org-desc').forEach(el => el.innerText = s.org_description || '');
        
        document.querySelectorAll('.cms-address').forEach(el => el.innerText = s.org_address || '');
        document.querySelectorAll('.cms-phone').forEach(el => el.innerText = s.phone || '');
        document.querySelectorAll('.cms-email').forEach(el => el.innerText = s.email || '');
        document.querySelectorAll('.cms-footer-text').forEach(el => el.innerText = s.footer_text || '');
        
        document.querySelectorAll('.cms-link-fb').forEach(a => {
            if(s.facebook_url) a.href = s.facebook_url;
        });
        document.querySelectorAll('.cms-link-ig').forEach(a => {
            if(s.instagram_url) a.href = s.instagram_url;
        });
        
        if (s.logo_url) {
            document.querySelectorAll('.cms-logo').forEach(img => {
                img.src = getImageUrl(s.logo_url);
            });
        }

        // --- HERO BACKGROUND IMAGE ---
        if (s.hero_bg_image) {
            document.querySelectorAll('.hero-section').forEach(hero => {
                hero.classList.add('has-bg-image');
                hero.style.setProperty('--hero-bg', 'url(' + getImageUrl(s.hero_bg_image) + ')');
                hero.style.setProperty('background-image', 'url(' + getImageUrl(s.hero_bg_image) + ')');
            });
        }
    }
}

/**
 * Terapkan warna tema dari settings ke CSS custom properties.
 * Dipanggil setiap halaman load agar tema selalu up-to-date.
 */
function applyThemeColors(s) {
    const root = document.documentElement;
    
    // Gunakan nilai dari settings, fallback ke default hijau
    const primary = s.theme_primary || '#166534';
    const secondary = s.theme_secondary || '#22C55E';
    const dark = s.theme_dark || '#14532D';
    const bg = s.theme_bg || '#F8FAFC';
    
    // Generate light color dari primary (untuk badge, background ringan)
    const light = hexToLight(primary);
    
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--dark', dark);
    root.style.setProperty('--bg-color', bg);
    root.style.setProperty('--light', light);
    
    // Sesuaikan text color berdasarkan kecerahan background
    root.style.setProperty('--text-main', '#1F2937');
    root.style.setProperty('--text-muted', '#6B7280');
    root.style.setProperty('--white', '#FFFFFF');
}

/**
 * Menghasilkan warna terang (light tint) dari sebuah hex color.
 */
function hexToLight(hex, factor = 0.9) {
    let r, g, b;
    const h = hex.replace('#', '');
    if (h.length === 3) {
        r = parseInt(h[0] + h[0], 16);
        g = parseInt(h[1] + h[1], 16);
        b = parseInt(h[2] + h[2], 16);
    } else {
        r = parseInt(h.substring(0, 2), 16);
        g = parseInt(h.substring(2, 4), 16);
        b = parseInt(h.substring(4, 6), 16);
    }
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalWebSettings();
});
