// ==========================================
// FILE: assets/js/public-dokumentasi.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadDokumentasi();
});

async function loadDokumentasi() {
    const container = document.getElementById('galeriContainer');
    
    // Ambil data dari API
    const response = await fetchAPI('getDokumentasi', {}, true);
    container.innerHTML = '';

    if (!response || !response.data || response.data.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-5">Belum ada dokumentasi kegiatan.</div>`;
        return;
    }

    response.data.forEach(item => {
        const imgSrc = getImageUrl(item.gambar);
        
        // Buat elemen card gambar
        const card = `
            <div class="col-6 col-md-4 col-lg-3 mb-4">
                <div class="card card-custom border-0 h-100" style="cursor: pointer;" onclick="openLightbox('${imgSrc}', '${item.judul || 'Dokumentasi'}')">
                    <img src="${imgSrc}" class="card-img-top rounded-3 shadow-sm" alt="Dokumentasi" style="height: 200px; object-fit: cover;" loading="lazy"
                         onerror="this.onerror=null; this.src=getImageUrl('');">
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// Fungsi untuk membuka gambar besar (Lightbox/Modal)
function openLightbox(imgSrc, title) {
    document.getElementById('lightboxImg').src = imgSrc;
    document.getElementById('lightboxDesc').innerText = title;
    
    // Panggil Bootstrap Modal
    const modal = new bootstrap.Modal(document.getElementById('lightboxModal'));
    modal.show();
}
