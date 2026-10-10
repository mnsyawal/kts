// ==========================================
// Cloudflare Worker - Proxy API untuk Karang Taruna Sidrap
// Sembunyikan URL Google Apps Script dari publik
// ==========================================

// GANTI dengan Web App URL Google Apps Script Anda (dari Deploy > Web App di GAS editor)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbziOhytTct3Ysyq93SsFgIZxLd9H0bGK6SyU3-OhtSOQAon40TJliSHmd1nqYkkLdMX/exec';

// Daftar origin yang diizinkan mengakses API (CORS)
// TAMBAHKAN domain Cloudflare Pages kamu di sini setelah deploy
const ALLOWED_ORIGINS = [
    'https://karangtaruna-sidrap.pages.dev',
    'https://karangtaruna.example.com',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

// ==========================================
// MAIN HANDLER
// ==========================================
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin') || '';
        const method = request.method;

        // ========================================================
        // PENTING: Hanya tangani request ke /api/*
        // Request lain (HTML, CSS, JS, gambar, dll) harus
        // dilewatkan ke Cloudflare Pages — jangan dikirim ke GAS!
        // ========================================================
        const path = url.pathname;
        if (!path.startsWith('/api')) {
            // Bukan request API — biarkan Pages yang menangani
            return new Response('Bukan endpoint API. Gunakan /api/* untuk request data.', {
                status: 404,
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
        }

        // Hapus prefix /api dari path, sisanya query params utuh
        // Contoh: /api?action=getBerita → action=getBerita
        const apiParams = new URLSearchParams(url.search);

        // Tangani CORS preflight (OPTIONS)
        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': origin || '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            });
        }

        // Hanya izinkan GET dan POST
        if (method !== 'GET' && method !== 'POST') {
            return jsonResponse({ success: false, message: 'Method not allowed', error_code: 'METHOD_NOT_ALLOWED' }, origin, 405);
        }

        try {
            let gasResponse;

            if (method === 'GET') {
                // Forward GET request ke GAS (sertakan semua query params)
                const gasUrl = GAS_URL + '?' + apiParams.toString();
                gasResponse = await fetch(gasUrl, { method: 'GET' });
            } else {
                // Forward POST request ke GAS (body mentah)
                const body = await request.text();
                gasResponse = await fetch(GAS_URL, {
                    method: 'POST',
                    body: body
                });
            }

            const data = await gasResponse.json();
            return jsonResponse(data, origin, gasResponse.status);

        } catch (error) {
            return jsonResponse({
                success: false,
                message: 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.',
                error_code: 'PROXY_ERROR'
            }, origin, 502);
        }
    }
};

// ==========================================
// HELPER: Response JSON dengan CORS headers
// ==========================================
function jsonResponse(data, origin, status = 200) {
    const headers = {
        'Content-Type': 'application/json;charset=utf-8',
        'X-Proxy-By': 'Cloudflare-Worker'
    };

    // Izinkan origin yang dikenali, atau fallback ke '*' untuk development
    if (origin && (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*'))) {
        headers['Access-Control-Allow-Origin'] = origin;
    } else if (origin) {
        // Untuk development: izinkan semua origin (nanti dibatasi setelah production)
        headers['Access-Control-Allow-Origin'] = origin;
    } else {
        headers['Access-Control-Allow-Origin'] = '*';
    }

    return new Response(JSON.stringify(data), { status, headers });
}
