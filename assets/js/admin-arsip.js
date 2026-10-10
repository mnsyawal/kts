// ==========================================
// FILE: assets/js/admin-arsip.js
// ==========================================

let arsipData = [];
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

    loadTableArsip();

    // Event form submit
    document.getElementById('formArsip').addEventListener('submit', handleSaveArsip);
});

async function loadTableArsip() {
    const tbody = document.getElementById('tableArsipBody');
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data...</td></tr>`;

    const res = await fetchAPI('getArsip', { limit: 200 }, false);
    
    if (res && res.success) {
        arsipData = res.data;
        renderTable(arsipData);
    } else {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Gagal memuat data arsip.</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableArsipBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada arsip tercatat.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const badgeColor = item.jenis === 'Masuk' ? 'bg-info' : (item.jenis === 'Keluar' ? 'bg-warning text-dark' : 'bg-secondary');
        const fileLink = item.file_url 
            ? `<a href="${item.file_url}" target="_blank" class="btn btn-sm btn-outline-success"><i class="fa-solid fa-download"></i></a>` 
            : `<span class="text-muted small">Tidak ada file</span>`;

        let actionButtons = `<button class="btn btn-sm btn-primary me-1" onclick="editArsip('${item.id}')" title="Edit"><i class="fa-solid fa-edit"></i></button>`;
        
        if (userRole === 'ADMIN') {
            actionButtons += `<button class="btn btn-sm btn-danger" onclick="deleteArsip('${item.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${item.nomor_surat}</td>
            <td>${item.perihal}</td>
            <td><span class="badge ${badgeColor}">${item.jenis}</span></td>
            <td>${formatTanggal(item.tanggal)}</td>
            <td class="text-center">${fileLink}</td>
            <td class="text-end">${actionButtons}</td>
        `;
        tbody.appendChild(tr);
    });
}

function showForm() {
    isEditMode = false;
    document.getElementById('formArsip').reset();
    document.getElementById('arsipId').value = '';
    document.getElementById('fileLama').value = '';
    document.getElementById('tanggal').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('formTitle').innerText = 'Tambah Arsip Baru';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

function hideForm() {
    document.getElementById('viewForm').classList.add('d-none');
    document.getElementById('viewList').classList.remove('d-none');
}

function editArsip(id) {
    const item = arsipData.find(a => a.id === id);
    if (!item) return;

    isEditMode = true;
    document.getElementById('arsipId').value = item.id;
    document.getElementById('nomorSurat').value = item.nomor_surat;
    document.getElementById('jenisSurat').value = item.jenis;
    document.getElementById('perihal').value = item.perihal;
    document.getElementById('tanggal').value = item.tanggal;
    document.getElementById('keterangan').value = item.keterangan || '';
    document.getElementById('fileLama').value = item.file_url;
    
    document.getElementById('formTitle').innerText = 'Edit Data Arsip';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function handleSaveArsip(e) {
    e.preventDefault();
    
    const btnSave = document.getElementById('btnSaveArsip');
    const originalText = btnSave.innerHTML;
    
    btnSave.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    btnSave.disabled = true;

    try {
        const fileInput = document.getElementById('fileInput');
        let fileBase64 = '';
        let fileName = '';
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 3 * 1024 * 1024) { // Limit 3MB
                Swal.fire('Gagal', 'Ukuran dokumen maksimal 3MB', 'error');
                btnSave.innerHTML = originalText;
                btnSave.disabled = false;
                return;
            }
            fileBase64 = await fileToBase64(file);
            fileName = file.name;
        }

        const dateVal = document.getElementById('tanggal').value;
        const yearVal = new Date(dateVal).getFullYear().toString();

        const payloadData = {
            id: document.getElementById('arsipId').value,
            nomor_surat: document.getElementById('nomorSurat').value,
            jenis: document.getElementById('jenisSurat').value,
            perihal: document.getElementById('perihal').value,
            tanggal: dateVal,
            tahun: yearVal,
            keterangan: document.getElementById('keterangan').value,
            file_url: document.getElementById('fileLama').value,
            fileBase64: fileBase64,
            file_name: fileName
        };

        const action = isEditMode ? 'updateArsip' : 'createArsip';
        const res = await postAPI(action, payloadData, true);

        if (res && res.success) {
            Swal.fire('Berhasil', res.message, 'success').then(() => {
                hideForm();
                loadTableArsip();
                // Clear public cache
                localStorage.removeItem('KT_CACHE_getArsip_{"page":1,"limit":1000}');
            });
        } else {
            Swal.fire('Gagal', res ? res.message : 'Terjadi kesalahan sistem', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Gagal memproses data arsip.', 'error');
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
}

function deleteArsip(id) {
    Swal.fire({
        title: 'Hapus Arsip?',
        text: 'Data yang dihapus tidak dapat dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.showLoading();
            const res = await postAPI('deleteArsip', { id: id }, true);
            
            if (res && res.success) {
                Swal.fire('Terhapus!', res.message, 'success');
                loadTableArsip();
            } else {
                Swal.fire('Gagal', res ? res.message : 'Gagal menghapus arsip', 'error');
            }
        }
    });
}
