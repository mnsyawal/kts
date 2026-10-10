// ==========================================
// FILE: assets/js/admin-users.js
// ==========================================

let usersData = [];
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

    loadTableUsers();
    document.getElementById('formUser').addEventListener('submit', handleSaveUser);
});

async function loadTableUsers() {
    const tbody = document.getElementById('tableUserBody');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data...</td></tr>`;

    const res = await fetchAPI('getUsers', {}, false);
    if (res && res.success) {
        usersData = res.data;
        renderTable(usersData);
    } else {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Gagal memuat data.</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableUserBody');
    tbody.innerHTML = '';

    data.forEach(item => {
        const statusBadge = item.status === 'active' 
            ? `<span class="badge bg-success">Aktif</span>` : `<span class="badge bg-danger">Nonaktif</span>`;
        const roleBadge = item.role === 'ADMIN' 
            ? `<span class="badge bg-primary">ADMIN</span>` : `<span class="badge bg-secondary">USER</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold">${item.nama}</td>
            <td>${item.username}</td>
            <td>${roleBadge}</td>
            <td>${statusBadge}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-primary me-1" onclick="editUser('${item.id}')"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${item.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showForm() {
    isEditMode = false;
    document.getElementById('formUser').reset();
    document.getElementById('userId').value = '';
    document.getElementById('username').disabled = false;
    document.getElementById('password').required = true;
    document.getElementById('passLabel').innerText = "(Wajib untuk akun baru)";
    
    document.getElementById('formTitle').innerText = 'Tambah Akun Baru';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

function hideForm() {
    document.getElementById('viewForm').classList.add('d-none');
    document.getElementById('viewList').classList.remove('d-none');
}

function editUser(id) {
    const item = usersData.find(u => u.id === id);
    if (!item) return;

    isEditMode = true;
    document.getElementById('userId').value = item.id;
    document.getElementById('namaUser').value = item.nama;
    document.getElementById('username').value = item.username;
    document.getElementById('username').disabled = true; // Username tidak boleh diedit
    document.getElementById('role').value = item.role;
    document.getElementById('statusUser').value = item.status;
    
    document.getElementById('password').required = false;
    document.getElementById('password').value = '';
    document.getElementById('passLabel').innerText = "(Kosongkan jika tidak ubah password)";
    
    document.getElementById('formTitle').innerText = 'Edit Akun';
    document.getElementById('viewList').classList.add('d-none');
    document.getElementById('viewForm').classList.remove('d-none');
}

async function handleSaveUser(e) {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveUser');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
    btnSave.disabled = true;

    try {
        const payloadData = {
            id: document.getElementById('userId').value,
            nama: document.getElementById('namaUser').value,
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
            status: document.getElementById('statusUser').value
        };

        const action = isEditMode ? 'updateUser' : 'createUser';
        const res = await postAPI(action, payloadData, true);

        if (res && res.success) {
            Swal.fire('Berhasil', res.message, 'success').then(() => {
                hideForm();
                loadTableUsers();
            });
        } else {
            Swal.fire('Gagal', res ? res.message : 'Username mungkin sudah dipakai', 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Gagal memproses data.', 'error');
    } finally {
        btnSave.innerHTML = originalText; btnSave.disabled = false;
    }
}

function deleteUser(id) {
    Swal.fire({
        title: 'Hapus Akun?', text: 'Akun ini tidak akan bisa login lagi!', icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Hapus'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const res = await postAPI('deleteUser', { id: id }, true);
            if (res && res.success) {
                Swal.fire('Terhapus!', '', 'success');
                loadTableUsers();
            } else { Swal.fire('Gagal', '', 'error'); }
        }
    });
}
