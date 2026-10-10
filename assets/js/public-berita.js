// ==========================================
// FILE: assets/js/public-berita.js
// ==========================================

let currentPage = 1;
const limitPerPage = 6;

document.addEventListener("DOMContentLoaded", () => {
    loadBerita(currentPage);

    // Event filter dan pencarian
    document.getElementById('btnSearch').addEventListener('click', () => {
        currentPage = 1;
        loadBerita(currentPage);
    });

    document.getElementById('inputSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            loadBerita(currentPage);
        }
    });

    document.getElementById('filterKategori').addEventListener('change', () => {
        currentPage = 1;
        loadBerita(currentPage);
    });
});

async function loadBerita(page) {
    const container = document.getElementById('beritaContainer');
    const kategori = document.getElementById('filterKategori').value;
    const search = document.getElementById('inputSearch').value;

    // Tampilkan skeleton saat loading
    container.innerHTML = `
        <div class="col-md-4"><div class="card-custom p-3"><div class="skeleton skeleton-img mb-3"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div></div>
        <div class="col-md-4"><div class="card-custom p-3"><div class="skeleton skeleton-img mb-3"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div></div>
        <div class="col-md-4"><div class="card-custom p-3"><div class="skeleton skeleton-img mb-3"></div><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div></div>
    `;

    const response = await fetchAPI('getBerita', { page: page, limit: limitPerPage, search: search, kategori: kategori }, true);
    container.innerHTML = '';

    if (!response || !response.data || response.data.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-5">Belum ada berita yang ditemukan.</div>`;
        document.getElementById('paginationBerita').innerHTML = '';
        return;
    }

    response.data.forEach(berita => {
        const imgSrc = getImageUrl(berita.gambar);

        const card = `
            <div class="col-md-4 mb-4">
                <div class="card card-custom h-100">
                    <img src="${imgSrc}" class="card-img-top" alt="${berita.judul}" loading="lazy"
                         onerror="this.onerror=null; this.src=getImageUrl('');">
                    <div class="card-body">
                        <span class="badge-category mb-2">${berita.kategori}</span>
                        <h5 class="fw-bold mb-2"><a href="detail-berita.html?id=${berita.id}" class="text-decoration-none text-dark stretched-link">${berita.judul}</a></h5>
                        <p class="text-muted small mb-3"><i class="fa-solid fa-calendar me-1"></i> ${formatTanggal(berita.tanggal)}</p>
                        <p class="text-muted small">${berita.ringkasan}</p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });

    renderPagination(response.pagination);
}

function renderPagination(meta) {
    const paginationEl = document.getElementById('paginationBerita');
    let html = '';

    if (!meta || meta.total_pages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    // Prev Button
    html += `<li class="page-item ${meta.page === 1 ? 'disabled' : ''}">
                <button class="page-link text-success" onclick="goToPage(${meta.page - 1})">Sebelumnya</button>
             </li>`;
    
    // Page Numbers
    for (let i = 1; i <= meta.total_pages; i++) {
        html += `<li class="page-item ${meta.page === i ? 'active' : ''}">
                    <button class="page-link ${meta.page === i ? 'bg-success border-success text-white' : 'text-success'}" onclick="goToPage(${i})">${i}</button>
                 </li>`;
    }

    // Next Button
    html += `<li class="page-item ${meta.page === meta.total_pages ? 'disabled' : ''}">
                <button class="page-link text-success" onclick="goToPage(${meta.page + 1})">Selanjutnya</button>
             </li>`;

    paginationEl.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadBerita(currentPage);
}
