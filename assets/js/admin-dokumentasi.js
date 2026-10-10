// ==========================================
// FILE: assets/js/admin-dokumentasi.js
// ==========================================

let dokData = [];
let isEditMode = false;
let userRole = 'USER';

document.addEventListener("DOMContentLoaded", () => {
    // Sidebar Mobile Toggle
    document.getElementById('btnToggleSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('show');
        document.getElementById('sidebarOverlay').classList.add('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('show');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });

    // Validasi Role
    const userStr = localStorage.getItem('KT_USER');
    if (userStr) {
        const userObj = JSON.parse(userStr);
        userRole = userObj.role;
        if (userRole === 'ADMIN') {
            document.getElementById('adminOnlyMenu').style.display = 'block';
        }
    }

    loadTableDokumentasi();
    document.getElementById('formDokumentasi').addEventListener('submit', handleSaveDokumentasi);
});

async function loadTableDokumentasi() {
    const tbody = document.getElementById('tableDokumentasiBody');
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data...</td></tr>`;

    // Gunakan endpoint khusus admin agar foto berstatus 'draft' tetap terlihat
    const res = await fetchAPI('getAdminDokumentasi', {}, false);
    
    if (res && res.success) {
        dokData = res.data;
        renderTable(dokData);
    } else {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Gagal memuat data dokumentasi.</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableDokumentasiBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada dokumentasi.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const statusBadge = item.status === 'published' 
            ? `<span class="badge bg-success">Published</span>` 
            : `<span class="badge bg-secondary">Draft</span>`;
            
        const imgThumb = item.gambar 
            ? `<img src="${getImageUrl(item.gambar)}" class="rounded" style="width:60px; height:60px; object-fit:cover;" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="bg-light rounded d-flex align-items-center justify-content-center text-muted" style="width:60px; height:60px; display:none;"><i class="fa-solid fa-image"></i></div>`
            : `<div class="bg-light rounded d-flex align-items-center justify-content-center text-muted" style="width:60px; height:60px;"><i class="fa-solid fa-image"></i></div>`;

        let actionButtons = `<button class="btn btn-sm btn-primary me-1" onclick="editDokumentasi('${item.id}')" title="Edit"><i class="fa-solid fa-edit"></i></button>`;
        
        if (userRole === 'ADMIN') {
            actionButtons += `<button class="btn btn-sm btn-danger" onclick="deleteDokumentasi('${item.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${imgThumb}</td>
            <td class="fw-bold">${item.judul}</td>
            <td>${item.album}</td>
            <td>${formatTanggal(item.tanggal)}</td>
            <td>${statusBadge}</td>
            <td class="text-end">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showForm() {
    isEditMode = false;
    document.getElementById('formDokumentasi').reset();
    document.getElementById('dokId').value = '';
    document.getElementById('gambarLama').value = '';
    document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
    document.getElementById('gambarInput').required = true; // Wajib upload jika baru
    
    document.getElementById('formTitle').innerText = 'Tambah Foto Baru';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

function hideForm() {
    document.getElementById('viewForm').classList.add('d-none');
    document.getElementById('viewList').classList.remove('d-none');
}

function editDokumentasi(id) {
    const item = dokData.find(d => d.id === id);
    if (!item) return;

    isEditMode = true;
    document.getElementById('dokId').value = item.id;
    document.getElementById('judul').value = item.judul;
    document.getElementById('album').value = item.album;
    document.getElementById('tanggal').value = item.tanggal;
    document.getElementById('status').value = item.status;
    document.getElementById('deskripsi').value = item.deskripsi || '';
    document.getElementById('gambarLama').value = item.gambar;
    
    document.getElementById('gambarInput').required = false; // Boleh kosong jika edit
    
    document.getElementById('formTitle').innerText = 'Edit Dokumentasi';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function handleSaveDokumentasi(e) {
    e.preventDefault();
    
    const btnSave = document.getElementById('btnSaveDokumentasi');
    const originalText = btnSave.innerHTML;
    
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

        const dateVal = document.getElementById('tanggal').value;
        const yearVal = new Date(dateVal).getFullYear().toString();

        const payloadData = {
            id: document.getElementById('dokId').value,
            judul: document.getElementById('judul').value,
            album: document.getElementById('album').value,
            deskripsi: document.getElementById('deskripsi').value,
            tanggal: dateVal,
            tahun: yearVal,
            status: document.getElementById('status').value,
            gambar: document.getElementById('gambarLama').value,
            imageBase64: imageBase64
        };

        const action = isEditMode ? 'updateDokumentasi' : 'createDokumentasi';
        const res = await postAPI(action, payloadData, true);

        if (res && res.success) {
            Swal.fire('Berhasil', res.message, 'success').then(() => {
                hideForm();
                loadTableDokumentasi();
                // Clear public cache
                localStorage.removeItem('KT_CACHE_getDokumentasi_{}');
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

function deleteDokumentasi(id) {
    Swal.fire({
        title: 'Hapus Foto?',
        text: 'Foto akan dihapus secara permanen dari database!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.showLoading();
            const res = await postAPI('deleteDokumentasi', { id: id }, true);
            
            if (res && res.success) {
                Swal.fire('Terhapus!', res.message, 'success');
                loadTableDokumentasi();
                localStorage.removeItem('KT_CACHE_getDokumentasi_{}');
            } else {
                Swal.fire('Gagal', res ? res.message : 'Gagal menghapus', 'error');
            }
        }
    });
}
