// Replace this URL with your new Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9JK23x-L7m7KWa0B8qD0V41CxhQWJYhpK-h5wJdRQIZyr_HB7gKz9LBfKywVPJAUU/exec'; 

// DOM Elements
const form = document.getElementById('drama-form');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');
const dramaTbody = document.getElementById('drama-tbody');
const loader = document.getElementById('loader');
const tableContainer = document.getElementById('table-container');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');

// Dashboard Elements
const countTotal = document.getElementById('count-total');
const countSelesai = document.getElementById('count-selesai');
const countSedang = document.getElementById('count-sedang');
const countBelum = document.getElementById('count-belum');

// Modal DOM Elements
const dramaModal = document.getElementById('drama-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const dramaIdInput = document.getElementById('drama-id');
const judulInput = document.getElementById('judul');
const titleWarning = document.getElementById('title-warning');

// Delete Modal DOM Elements
const deleteModal = document.getElementById('delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const deleteStatus = document.getElementById('delete-status');

let dramaData = []; 
let idToDelete = null;

// Modal Logic
function openModal(isEdit = false) {
    dramaModal.classList.add('active');
    if (!isEdit) {
        modalTitle.textContent = 'Add New Drama';
        form.reset();
        dramaIdInput.value = ''; // Clear ID
    } else {
        modalTitle.textContent = 'Edit Drama';
    }
    statusMessage.classList.add('hidden');
    
    // Reset warning
    titleWarning.classList.add('hidden');
    submitBtn.disabled = false;
    judulInput.style.borderColor = '';
}

function closeModal() {
    dramaModal.classList.remove('active');
}

openModalBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);

// Delete Modal Logic
function openDeleteModal(id) {
    idToDelete = id;
    deleteModal.classList.add('active');
    deleteStatus.classList.add('hidden');
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.innerHTML = 'Yes, Delete';
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
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
            updateSummaryCards(dramaData);
            renderTable(dramaData);
        } else {
            throw new Error(result.message || 'Failed to fetch data');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        loader.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `<p style="color:var(--error-color)">Failed to load data.</p>`;
    }
}

// Update Dashboard Cards
function updateSummaryCards(data) {
    if (!data) return;
    countTotal.textContent = data.length;
    
    let completed = 0;
    let watching = 0;
    let planToWatch = 0;
    
    data.forEach(drama => {
        if (drama.WatchStatus === 'Completed') completed++;
        if (drama.WatchStatus === 'Watching') watching++;
        if (drama.WatchStatus === 'Plan to Watch') planToWatch++;
    });
    
    countSelesai.textContent = completed;
    countSedang.textContent = watching;
    countBelum.textContent = planToWatch;
}

// Render Table
function renderTable(dataToRender) {
    loader.classList.add('hidden');
    
    if (!dataToRender || dataToRender.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = '<p>No dramas added yet or not found.</p>';
        return;
    }

    tableContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
    dramaTbody.innerHTML = '';
    
    dataToRender.forEach((drama, index) => {
        const tr = document.createElement('tr');
        
        // Tambahkan class animasi dengan delay berdasarkan index agar muncul bergantian
        tr.className = 'animate-fade-in-up';
        tr.style.animationDelay = (0.1 * Math.min(index, 10)) + 's';

        const watchStatus = drama.WatchStatus || '-';
        const releaseStatus = drama.ReleaseStatus || '-';

        const watchStatusClass =
            watchStatus === 'Completed' ? 'status-completed' :
            watchStatus === 'Watching' ? 'status-watching' :
            watchStatus === 'Plan to Watch' ? 'status-plan' :
            watchStatus === 'Dropped' ? 'status-dropped' :
            '';

        const releaseStatusClass =
            releaseStatus === 'Completed' ? 'release-completed' :
            releaseStatus === 'Ongoing' ? 'release-ongoing' :
            '';

        tr.innerHTML = `
            <td class="cell-title">${drama.Title || '-'}</td>
            <td><span class="badge badge-chip">${drama.Country || '-'}</span></td>
            <td>${drama.Genre || '-'}</td>
            <td>${drama.ReleaseYear || '-'}</td>
            <td>${drama.Episodes || '-'} Eps</td>
            <td><span class="badge ${watchStatusClass}">${watchStatus}</span></td>
            <td><span class="badge ${releaseStatusClass}">${releaseStatus}</span></td>
            <td>
                <button class="btn-action btn-edit" onclick="handleEdit('${drama.ID}')">Edit</button>
                <button class="btn-action btn-delete" onclick="handleDelete('${drama.ID}')">Delete</button>
            </td>
        `;
        dramaTbody.appendChild(tr);
    });
}

// Search Feature
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm === '') {
        renderTable(dramaData);
        return;
    }
    const filteredData = dramaData.filter(drama => {
        return (drama.Title && drama.Title.toLowerCase().includes(searchTerm)) ||
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
    judulInput.value = drama.Title;
    document.getElementById('country').value = drama.Country;
    document.getElementById('genre').value = drama.Genre;
    document.getElementById('release').value = drama.ReleaseYear;
    document.getElementById('episode').value = drama.Episodes;
    document.getElementById('statusTontonan').value = drama.WatchStatus;
    document.getElementById('statusRilis').value = drama.ReleaseStatus;
    
    openModal(true);
};

// Title Duplicate Validation
judulInput.addEventListener('input', (e) => {
    const inputTitle = e.target.value.trim().toLowerCase();
    const currentId = dramaIdInput.value;

    const isDuplicate = dramaData.some(drama => {
        const dramaTitle = (drama.Title || '').trim().toLowerCase();
        
        // Ignore itself when editing
        if (currentId && String(drama.ID) === String(currentId)) {
            return false; 
        }
        
        return dramaTitle === inputTitle && inputTitle !== '';
    });

    if (isDuplicate) {
        titleWarning.classList.remove('hidden');
        submitBtn.disabled = true;
        judulInput.style.borderColor = 'var(--error-color)';
    } else {
        titleWarning.classList.add('hidden');
        submitBtn.disabled = false;
        judulInput.style.borderColor = '';
    }
});

// Delete Button Click
window.handleDelete = function(id) {
    openDeleteModal(id);
};

// Submit form (Add & Edit)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!APPS_SCRIPT_URL) return;

    // Add action type
    const formData = new FormData(form);
    if(dramaIdInput.value) {
        formData.append('action', 'edit');
    } else {
        formData.append('action', 'add');
        // Create temporary ID (will be used on server)
        formData.append('id', new Date().getTime()); 
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Saving...';
    statusMessage.className = 'hidden';

    try {
        const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus('Saved successfully!', 'success');
            setTimeout(() => {
                closeModal();
                fetchDramaData(); // Refresh Data
            }, 1000);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showStatus('Failed to save: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Drama';
    }
});

// Delete Process after Confirmation
confirmDeleteBtn.addEventListener('click', async () => {
    if(!idToDelete || !APPS_SCRIPT_URL) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = 'Deleting...';
    
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
        deleteStatus.textContent = 'Failed to delete: ' + error.message;
        deleteStatus.className = 'error';
        deleteStatus.classList.remove('hidden');
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = 'Yes, Delete';
    }
});

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.classList.remove('hidden');
}

// Init
fetchDramaData();
