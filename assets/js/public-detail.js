// ==========================================
// FILE: assets/js/public-detail.js
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Ambil ID dari URL (?id=BRT-123)
    const urlParams = new URLSearchParams(window.location.search);
    const idBerita = urlParams.get('id');

    if (!idBerita) {
        Swal.fire('Error', 'ID Berita tidak ditemukan', 'error').then(() => {
            window.location.href = 'berita.html';
        });
        return;
    }

    loadDetailBerita(idBerita);
});

async function loadDetailBerita(id) {
    const loadingUI = document.getElementById('loadingDetail');
    const contentUI = document.getElementById('contentDetail');

    // Fetch tanpa cache agresif agar update berita langsung terlihat
    const response = await fetchAPI('getBeritaById', { id: id }, false);

    if (!response || !response.success || !response.data) {
        loadingUI.innerHTML = `<div class="text-center text-muted">Maaf, berita tidak ditemukan.</div>`;
        return;
    }

    const data = response.data;

    // Update DOM
    document.title = `${data.judul} - Karang Taruna`;
    document.getElementById('detKategori').innerText = data.kategori;
    document.getElementById('detJudul').innerText = data.judul;
    document.getElementById('detTanggal').innerText = formatTanggal(data.tanggal);
    document.getElementById('detPenulis').innerText = data.penulis;
    document.getElementById('detIsi').innerHTML = data.isi.replace(/\n/g, '<br>'); // Jika isi berupa plain text dengan enter
    
    if (data.gambar) {
        document.getElementById('detGambar').src = getImageUrl(data.gambar);
    } else {
        document.getElementById('detGambar').style.display = 'none';
    }

    // Tampilkan konten, sembunyikan loading
    loadingUI.classList.add('d-none');
    contentUI.classList.remove('d-none');
}

// Fitur Share
function shareWA() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.getElementById('detJudul').innerText);
    window.open(`https://api.whatsapp.com/send?text=${text}%20-%20Baca%20selengkapnya%20di:%20${url}`);
}

function shareFB() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Link berita disalin ke clipboard!',
            timer: 1500,
            showConfirmButton: false
        });
    });
}
