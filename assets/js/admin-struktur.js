// ==========================================
// FILE: assets/js/admin-struktur.js
// ==========================================

let strukturData = [];
let isEditMode = false;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('btnToggleSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('show');
        document.getElementById('sidebarOverlay').classList.add('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('show');
        document.getElementById('sidebarOverlay').classList.remove('show');
    });

    loadTableStruktur();
    document.getElementById('formStruktur').addEventListener('submit', handleSaveStruktur);
});

async function loadTableStruktur() {
    const tbody = document.getElementById('tableStrukturBody');
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data...</td></tr>`;

    const res = await fetchAPI('getAdminStruktur', {}, false);
    if (res && res.success) {
        strukturData = res.data;
        renderTable(strukturData);
    } else {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Gagal memuat data struktur.</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableStrukturBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada data pengurus.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const statusBadge = item.status === 'active' 
            ? `<span class="badge bg-success">Aktif</span>` 
            : `<span class="badge bg-secondary">Tidak Aktif</span>`;
            
        const imgThumb = item.foto 
            ? `<img src="${item.foto}" class="rounded-circle shadow-sm" style="width:45px; height:45px; object-fit:cover;">`
            : `<div class="bg-light rounded-circle shadow-sm d-flex align-items-center justify-content-center text-muted" style="width:45px; height:45px;"><i class="fa-solid fa-user"></i></div>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${imgThumb}</td>
            <td class="fw-bold">${item.nama}</td>
            <td>${item.jabatan}</td>
            <td>${item.urutan}</td>
            <td>${statusBadge}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-primary me-1" onclick="editStruktur('${item.id}')"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteStruktur('${item.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showForm() {
    isEditMode = false;
    document.getElementById('formStruktur').reset();
    document.getElementById('strukturId').value = '';
    document.getElementById('fotoLama').value = '';
    document.getElementById('formTitle').innerText = 'Tambah Pengurus Baru';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

function hideForm() {
    document.getElementById('viewForm').classList.add('d-none');
    document.getElementById('viewList').classList.remove('d-none');
}

function editStruktur(id) {
    const item = strukturData.find(s => s.id === id);
    if (!item) return;

    isEditMode = true;
    document.getElementById('strukturId').value = item.id;
    document.getElementById('nama').value = item.nama;
    document.getElementById('jabatan').value = item.jabatan;
    document.getElementById('periode').value = item.periode;
    document.getElementById('urutan').value = item.urutan;
    document.getElementById('status').value = item.status;
    document.getElementById('deskripsi').value = item.deskripsi || '';
    document.getElementById('fotoLama').value = item.foto;
    
    document.getElementById('formTitle').innerText = 'Edit Pengurus';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function handleSaveStruktur(e) {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveStruktur');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    btnSave.disabled = true;

    try {
        const fileInput = document.getElementById('fotoInput');
        let imageBase64 = '';
        if (fileInput.files.length > 0) {
            if (fileInput.files[0].size > 1 * 1024 * 1024) { 
                Swal.fire('Gagal', 'Ukuran foto maksimal 1MB', 'error');
                btnSave.innerHTML = originalText; btnSave.disabled = false; return;
            }
            imageBase64 = await fileToBase64(fileInput.files[0]);
        }

        const payloadData = {
            id: document.getElementById('strukturId').value,
            nama: document.getElementById('nama').value,
            jabatan: document.getElementById('jabatan').value,
            periode: document.getElementById('periode').value,
            urutan: document.getElementById('urutan').value,
            status: document.getElementById('status').value,
            deskripsi: document.getElementById('deskripsi').value,
            foto: document.getElementById('fotoLama').value,
            imageBase64: imageBase64
        };

        const action = isEditMode ? 'updateStruktur' : 'createStruktur';
        const res = await postAPI(action, payloadData, true);

        if (res && res.success) {
            Swal.fire('Berhasil', res.message, 'success').then(() => {
                hideForm();
                loadTableStruktur();
                localStorage.removeItem('KT_CACHE_getStruktur_{}');
            });
        } else {
            Swal.fire('Gagal', res ? res.message : 'Kesalahan sistem', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Gagal memproses data.', 'error');
    } finally {
        btnSave.innerHTML = originalText; btnSave.disabled = false;
    }
}

function deleteStruktur(id) {
    Swal.fire({
        title: 'Hapus Pengurus?', text: 'Data akan dihapus permanen.', icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Hapus'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await postAPI('deleteStruktur', { id: id }, true);
            if (res && res.success) {
                Swal.fire('Terhapus!', '', 'success');
                loadTableStruktur();
                localStorage.removeItem('KT_CACHE_getStruktur_{}');
            } else { Swal.fire('Gagal', '', 'error'); }
        }
    });
}
