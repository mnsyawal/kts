// ==========================================
// FILE: assets/js/public-struktur.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    loadStruktur();
});

async function loadStruktur() {
    const container = document.getElementById('strukturContainer');
    
    const response = await fetchAPI('getStruktur', {}, true);
    container.innerHTML = '';

    if (!response || !response.data || response.data.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-5">Struktur organisasi belum ditambahkan.</div>`;
        return;
    }

    response.data.forEach(item => {
        const fallbackImg = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.nama) + '&background=166534&color=fff&size=200';
        const imgSrc = item.foto ? getImageUrl(item.foto) : fallbackImg;
        
        const card = `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <div class="struktur-card">
                    <img src="${imgSrc}" class="struktur-img" alt="${item.nama}" loading="lazy"
                         onerror="this.onerror=null; this.src='${fallbackImg}';">
                    <h5 class="fw-bold mb-1">${item.nama}</h5>
                    <p class="text-success fw-bold small mb-2">${item.jabatan}</p>
                    <hr class="opacity-25 border-success">
                    <p class="text-muted small mb-0">${item.deskripsi || 'Pengurus Karang Taruna'}</p>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}
