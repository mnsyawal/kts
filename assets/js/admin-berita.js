// ==========================================
// FILE: assets/js/admin-berita.js
// ==========================================

let beritaData = [];
let quill;
let isEditMode = false;
let userRole = 'USER';

document.addEventListener("DOMContentLoaded", () => {
    // Setup Sidebar Mobile
    document.getElementById('btnToggleSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('show');
        document.getElementById('sidebarOverlay').classList.add('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('show');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });

    // Cek Role & Inisialisasi
    const userStr = localStorage.getItem('KT_USER');
    if (userStr) {
        const userObj = JSON.parse(userStr);
        userRole = userObj.role;
        if (userRole === 'ADMIN') {
            document.getElementById('adminOnlyMenu').style.display = 'block';
        }
    }

    // Inisialisasi Quill Editor (Rich Text) dengan dukungan upload gambar inline
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],  // <-- Tambah tombol image
                    [{ 'align': [] }],
                    ['clean']
                ],
                handlers: {
                    image: imageHandler  // Custom handler untuk upload ke Drive
                }
            }
        }
    });

    loadTableBerita();

    // Event Submit Form
    document.getElementById('formBerita').addEventListener('submit', handleSaveBerita);
});

// Ambil Data Berita
async function loadTableBerita() {
    const tbody = document.getElementById('tableBeritaBody');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data...</td></tr>`;

    // Ambil data (useCache = false khusus admin agar data selalu terbaru)
    const res = await fetchAPI('getBerita', { limit: 100 }, false);
    
    if (res && res.success) {
        beritaData = res.data;
        renderTable(beritaData);
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Gagal memuat data berita.</td></tr>`;
    }
}

// Render Tabel
function renderTable(data) {
    const tbody = document.getElementById('tableBeritaBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Belum ada berita.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const statusBadge = item.status === 'published' 
            ? `<span class="badge bg-success">Published</span>` 
            : `<span class="badge bg-secondary">Draft</span>`;
        
        let actionButtons = `<button class="btn btn-sm btn-primary me-1" onclick="editBerita('${item.id}')" title="Edit"><i class="fa-solid fa-edit"></i></button>`;
        
        // Sembunyikan tombol hapus jika role nya bukan ADMIN
        if (userRole === 'ADMIN') {
            actionButtons += `<button class="btn btn-sm btn-danger" onclick="deleteBerita('${item.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${item.judul}</td>
            <td>${item.kategori}</td>
            <td>${item.tanggal}</td>
            <td>${statusBadge}</td>
            <td class="text-end">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Tampilkan Form (Tambah Baru)
function showForm() {
    isEditMode = false;
    document.getElementById('formBerita').reset();
    document.getElementById('beritaId').value = '';
    document.getElementById('gambarLama').value = '';
    quill.root.innerHTML = ''; // Kosongkan editor
    document.getElementById('kode_embed').value = ''; // Kosongkan Embed
    document.getElementById('tanggal').value = new Date().toISOString().split('T')[0]; // Hari ini
    
    document.getElementById('formTitle').innerText = 'Tulis Berita Baru';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

// Sembunyikan Form
function hideForm() {
    document.getElementById('viewForm').classList.add('d-none');
    document.getElementById('viewList').classList.remove('d-none');
}

// Edit Berita (Isi Form dengan data yang ada)
function editBerita(id) {
    const item = beritaData.find(b => b.id === id);
    if (!item) return;

    isEditMode = true;
    document.getElementById('beritaId').value = item.id;
    document.getElementById('judul').value = item.judul;
    document.getElementById('kategori').value = item.kategori;
    document.getElementById('tanggal').value = item.tanggal;
    document.getElementById('status').value = item.status;
    document.getElementById('gambarLama').value = item.gambar;
    
    // PISAHKAN ISI DAN KODE EMBED (Jika ada)
    let rawIsi = item.isi || '';
    let embedCode = '';
    
    // Cek apakah ada div embed-container di dalam isi
    const embedMarker = '<div class="embed-container mt-4">';
    if (rawIsi.includes(embedMarker)) {
        const parts = rawIsi.split(embedMarker);
        quill.root.innerHTML = parts[0]; // Bagian teks ke Quill
        embedCode = parts[1].replace('</div>', '').trim(); // Bagian kode ke Textarea
        document.getElementById('kode_embed').value = embedCode;
    } else {
        quill.root.innerHTML = rawIsi;
        document.getElementById('kode_embed').value = '';
    }

    document.getElementById('formTitle').innerText = 'Edit Berita';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

// Helper: Convert File ke Base64
const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// === CUSTOM HANDLER: Upload Gambar Inline ke Quill Editor ===
function imageHandler() {
    // Buat input file tersembunyi dan langsung trigger
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            Swal.fire('Gagal', 'Ukuran gambar inline maksimal 2MB', 'error');
            return;
        }

        Swal.fire({
            title: 'Mengunggah gambar...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const base64 = await fileToBase64(file);
            
            // Upload gambar langsung via POST ke GAS
            const res = await postAPI('uploadInlineImage', { 
                imageBase64: base64,
                filename: 'INLINE_' + new Date().getTime()
            }, true);

            Swal.close();

            if (res && res.success && res.data && res.data.url) {
                // Dapatkan posisi kursor saat ini
                const range = quill.getSelection(true);
                // Sisipkan gambar di posisi kursor dengan styling proporsional
                quill.insertEmbed(range.index, 'image', res.data.url);
                // Geser kursor setelah gambar
                quill.setSelection(range.index + 1);
            } else {
                Swal.fire('Gagal', res ? res.message : 'Gagal mengunggah gambar', 'error');
            }
        } catch (err) {
            Swal.close();
            Swal.fire('Error', 'Gagal memproses gambar.', 'error');
        }
    };
}

// Simpan atau Update Berita
async function handleSaveBerita(e) {
    e.preventDefault();
    
    const btnSave = document.getElementById('btnSaveBerita');
    const originalText = btnSave.innerHTML;
    
    let isiHTML = quill.root.innerHTML;
    if (isiHTML === '<p><br></p>') {
        Swal.fire('Peringatan', 'Isi berita tidak boleh kosong', 'warning');
        return;
    }

    // GABUNGKAN KODE EMBED KE DALAM ISI HTML
    const kodeEmbedVal = document.getElementById('kode_embed').value.trim();
    if (kodeEmbedVal !== '') {
        // Jika form edit, pastikan kita tidak menumpuk div embed-container berkali-kali
        if (isiHTML.includes('<div class="embed-container mt-4">')) {
             // (Secara teori tidak akan masuk sini karena di editBerita sudah dipisah)
        } else {
            // Bungkus kode embed dengan div khusus untuk styling responsive
            isiHTML += `\n<div class="embed-container mt-4">\n${kodeEmbedVal}\n</div>`;
        }
    }

    btnSave.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    btnSave.disabled = true;

    try {
        const fileInput = document.getElementById('gambarInput');
        let imageBase64 = '';
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 2 * 1024 * 1024) { // Limit 2MB
                Swal.fire('Gagal', 'Ukuran foto maksimal 2MB', 'error');
                btnSave.innerHTML = originalText;
                btnSave.disabled = false;
                return;
            }
            imageBase64 = await fileToBase64(file);
        }

        const payloadData = {
            id: document.getElementById('beritaId').value,
            judul: document.getElementById('judul').value,
            kategori: document.getElementById('kategori').value,
            tanggal: document.getElementById('tanggal').value,
            status: document.getElementById('status').value,
            isi: isiHTML, // <-- Mengirim HTML gabungan
            gambar: document.getElementById('gambarLama').value, // Bawa URL gambar lama jika tidak upload baru
            imageBase64: imageBase64
        };

        const action = isEditMode ? 'updateBerita' : 'createBerita';
        const res = await postAPI(action, payloadData, true);

        if (res && res.success) {
            Swal.fire('Berhasil', res.message, 'success').then(() => {
                hideForm();
                loadTableBerita();
                
                // Clear cache berita publik agar update langsung terlihat di web
                localStorage.removeItem('KT_CACHE_getBerita_{"limit":3}');
                localStorage.removeItem('KT_CACHE_getBerita_{"page":1,"limit":6,"search":"","kategori":""}');
            });
        } else {
            Swal.fire('Gagal', res ? res.message : 'Terjadi kesalahan sistem', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Gagal memproses data.', 'error');
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

// Hapus Berita
function deleteBerita(id) {
    Swal.fire({
        title: 'Hapus Berita?',
        text: 'Data yang dihapus tidak dapat dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.showLoading();
            const res = await postAPI('deleteBerita', { id: id }, true);
            
            if (res && res.success) {
                Swal.fire('Terhapus!', res.message, 'success');
                loadTableBerita();
            } else {
                Swal.fire('Gagal', res ? res.message : 'Gagal menghapus berita', 'error');
            }
        }
    });
}
