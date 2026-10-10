// ==========================================
// FILE: assets/js/public-home.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // PARALLEL LOAD: berita + statistik di-fetch bersamaan
    loadBeritaTerbaru();
    loadStatistik();
});

async function loadBeritaTerbaru() {
    const container = document.getElementById('beritaTerbaruContainer');
    
    // Panggil API (Limit 3, Cache aktif)
    const response = await fetchAPI('getBerita', { limit: 3 }, true);
    
    container.innerHTML = ''; // Hapus skeleton

    if (!response || !response.data || response.data.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted">Belum ada berita yang dipublikasikan.</div>`;
        return;
    }

    // Build semua card sekaligus lalu append (lebih cepat dari innerHTML += per item)
    let cardsHTML = '';
    response.data.forEach(berita => {
        const imgSrc = getImageUrl(berita.gambar);
        cardsHTML += `
            <div class="col-md-4">
                <div class="card card-custom h-100">
                    <img src="${imgSrc}" class="card-img-top" alt="${escapeHtml(berita.judul)}" loading="lazy"
                         onerror="this.onerror=null; this.src=getImageUrl('');">
                    <div class="card-body">
                        <span class="badge-category mb-2">${escapeHtml(berita.kategori)}</span>
                        <h5 class="fw-bold mb-2 text-dark"><a href="detail-berita.html?id=${berita.id}" class="text-decoration-none text-dark stretched-link">${escapeHtml(berita.judul)}</a></h5>
                        <p class="text-muted small mb-3"><i class="fa-solid fa-calendar me-1"></i> ${formatTanggal(berita.tanggal)}</p>
                        <p class="text-muted small">${escapeHtml(berita.ringkasan || '')}</p>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = cardsHTML;
}

async function loadStatistik() {
    const response = await fetchAPI('getStatistik', {}, true);
    if (response && response.data) {
        const d = response.data;
        document.getElementById('statBerita').innerText = (d.berita || 0) + '+';
        document.getElementById('statDokumentasi').innerText = (d.dokumentasi || 0) + '+';
        document.getElementById('statArsip').innerText = (d.arsip || 0) + '+';
        document.getElementById('statAnggota').innerText = (d.users || 0) + '+';
    }
}

// Helper: escape HTML untuk mencegah XSS
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
