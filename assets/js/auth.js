// ==========================================
// FILE: assets/js/auth.js
// SISTEM KEAMANAN & HALAMAN ADMIN
// ==========================================

// CATATAN: Fungsi postAPI() sudah didefinisikan di api.js.
// JANGAN mendefinisikan ulang postAPI di sini!

// Cek apakah user sudah login (Cek Token)
function checkAuth() {
    const token = localStorage.getItem('KT_TOKEN');
    if (!token) {
        // Belum login, tendang ke halaman login
        window.location.replace('login.html');
        return false;
    }
    return true;
}

// Cek Hak Akses (Role: ADMIN / USER)
function checkRole(allowedRoles) {
    const userString = localStorage.getItem('KT_USER');
    if (userString) {
        const user = JSON.parse(userString);
        if (!allowedRoles.includes(user.role)) {
            Swal.fire('Akses Ditolak', 'Anda tidak memiliki hak akses ke halaman ini.', 'error')
            .then(() => {
                window.location.replace('index.html');
            });
            document.body.style.display = 'none'; 
        }
    }
}

// Fungsi Logout
function logout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Anda akan keluar dari panel admin.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#166534',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Keluar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('KT_TOKEN');
            localStorage.removeItem('KT_USER');
            window.location.replace('login.html');
        }
    });
}

// Tampilkan nama user di header admin
document.addEventListener("DOMContentLoaded", () => {
    const userNameDisplay = document.getElementById('adminUserName');
    const userRoleDisplay = document.getElementById('adminUserRole');
    
    if (userNameDisplay) {
        const userString = localStorage.getItem('KT_USER');
        if (userString) {
            const user = JSON.parse(userString);
            userNameDisplay.innerText = user.nama || user.username;
            if(userRoleDisplay) userRoleDisplay.innerText = user.role;
        }
    }
});
