// Ganti URL ini dengan Web App URL dari Google Apps Script Anda
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzs4L9GRdjJCL28GqzFlJh1eyLK2uPH-7aDrdVBWMqe7WpJaXWIxVqlLz2aYU-G4Vv/exec'; 

// Elemen DOM
const form = document.getElementById('drama-form');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');
const dramaTbody = document.getElementById('drama-tbody');
const loader = document.getElementById('loader');
const tableContainer = document.getElementById('table-container');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');

// Elemen DOM Modal
const dramaModal = document.getElementById('drama-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const dramaIdInput = document.getElementById('drama-id');

// Elemen DOM Hapus
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteStatus = document.getElementById('delete-status');

let dramaData = []; 
let idToDelete = null;

// Modal Logic
function openModal(isEdit = false) {
    dramaModal.classList.remove('hidden');
    if (!isEdit) {
        modalTitle.textContent = 'Tambah Drama Baru';
        form.reset();
        dramaIdInput.value = ''; // Kosongkan ID
    } else {
        modalTitle.textContent = 'Edit Drama';
    }
    statusMessage.classList.add('hidden');
}

function closeModal() {
    dramaModal.classList.add('hidden');
}

openModalBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);

// Hapus Modal Logic
function openDeleteModal(id) {
    idToDelete = id;
    deleteModal.classList.remove('hidden');
    deleteStatus.classList.add('hidden');
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.innerHTML = 'Ya, Hapus';
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    idToDelete = null;
}

cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Fetch Data
async function fetchDramaData() {
    if (!APPS_SCRIPT_URL) return;

    loader.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
        const response = await fetch(APPS_SCRIPT_URL + "?action=read");
        const result = await response.json();

        if (result.status === 'success') {
            dramaData = result.data;
            renderTable(dramaData);
        } else {
            throw new Error(result.message || 'Gagal mengambil data');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        loader.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `<p style="color:var(--error-color)">Gagal memuat data.</p>`;
    }
}

// Render Tabel
function renderTable(dataToRender) {
    loader.classList.add('hidden');
    
    if (!dataToRender || dataToRender.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = '<p>Belum ada drama yang ditambahkan atau tidak ditemukan.</p>';
        return;
    }

    tableContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
    dramaTbody.innerHTML = '';
    
    dataToRender.forEach(drama => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--text-light)">${drama.Judul || '-'}</td>
            <td><span class="badge">${drama.Country || '-'}</span></td>
            <td>${drama.Genre || '-'}</td>
            <td>${drama.Release || '-'}</td>
            <td>${drama.JumlahEpisode || '-'} Eps</td>
            <td><span class="badge" style="background:rgba(255,255,255,0.1); border-color:rgba(255,255,255,0.3); color:white">${drama.StatusTontonan || '-'}</span></td>
            <td><span class="badge" style="background:rgba(40,167,69,0.1); border-color:rgba(40,167,69,0.3); color:var(--success-color)">${drama.StatusRilis || '-'}</span></td>
            <td>
                <button class="btn-action btn-edit" onclick="handleEdit('${drama.ID}')">Edit</button>
                <button class="btn-action btn-delete" onclick="handleDelete('${drama.ID}')">Hapus</button>
            </td>
        `;
        dramaTbody.appendChild(tr);
    });
}

// Fitur Pencarian
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm === '') {
        renderTable(dramaData);
        return;
    }
    const filteredData = dramaData.filter(drama => {
        return (drama.Judul && drama.Judul.toLowerCase().includes(searchTerm)) ||
               (drama.Country && drama.Country.toLowerCase().includes(searchTerm)) ||
               (drama.Genre && drama.Genre.toLowerCase().includes(searchTerm));
    });
    renderTable(filteredData);
});

// Edit Button Click
window.handleEdit = function(id) {
    const drama = dramaData.find(d => String(d.ID) === String(id));
    if (!drama) return;

    dramaIdInput.value = drama.ID;
    document.getElementById('judul').value = drama.Judul;
    document.getElementById('country').value = drama.Country;
    document.getElementById('genre').value = drama.Genre;
    document.getElementById('release').value = drama.Release;
    document.getElementById('episode').value = drama.JumlahEpisode;
    document.getElementById('statusTontonan').value = drama.StatusTontonan;
    document.getElementById('statusRilis').value = drama.StatusRilis;
    
    openModal(true);
};

// Delete Button Click
window.handleDelete = function(id) {
    openDeleteModal(id);
};

// Submit form (Tambah & Edit)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!APPS_SCRIPT_URL) return;

    // Tambahkan action type
    const formData = new FormData(form);
    if(dramaIdInput.value) {
        formData.append('action', 'edit');
    } else {
        formData.append('action', 'add');
        // Buat ID unik sementara (akan digunakan di server)
        formData.append('id', new Date().getTime()); 
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Menyimpan...';
    statusMessage.className = 'hidden';

    try {
        const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus('Berhasil disimpan!', 'success');
            setTimeout(() => {
                closeModal();
                fetchDramaData(); // Refresh Data
            }, 1000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showStatus('Gagal menyimpan: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Drama';
    }
});

// Proses Hapus setelah Konfirmasi
confirmDeleteBtn.addEventListener('click', async () => {
    if(!idToDelete || !APPS_SCRIPT_URL) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = 'Menghapus...';
    
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', idToDelete);

    try {
        const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.status === 'success') {
            closeDeleteModal();
            fetchDramaData(); // Refresh Data
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        deleteStatus.textContent = 'Gagal menghapus: ' + error.message;
        deleteStatus.className = 'error';
        deleteStatus.classList.remove('hidden');
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = 'Ya, Hapus';
    }
});

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.classList.remove('hidden');
}

// Init
fetchDramaData();
