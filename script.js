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
const judulSuggestions = document.getElementById('judul-suggestions');
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
            updateTitleSuggestions(dramaData);
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
            <td style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="btn-action btn-edit" onclick="handleEdit('${drama.ID}')" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-action btn-delete" onclick="handleDelete('${drama.ID}')" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        `;
        dramaTbody.appendChild(tr);
    });
}

// Filtering Feature (Search & Status)
let currentFilter = 'All';

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    let filteredData = dramaData;

    if (currentFilter !== 'All') {
        filteredData = filteredData.filter(drama => drama.WatchStatus === currentFilter);
    }

    if (searchTerm !== '') {
        filteredData = filteredData.filter(drama => {
            return (drama.Title && drama.Title.toLowerCase().includes(searchTerm)) ||
                   (drama.Country && drama.Country.toLowerCase().includes(searchTerm)) ||
                   (drama.Genre && drama.Genre.toLowerCase().includes(searchTerm));
        });
    }

    renderTable(filteredData);
}

// Search Input Event
searchInput.addEventListener('input', applyFilters);

// Summary Cards Click Event
const summaryCards = document.querySelectorAll('.summary-card');
summaryCards.forEach(card => {
    card.addEventListener('click', () => {
        const filterVal = card.getAttribute('data-filter');
        
        // Toggle behavior: if clicking the active filter (except 'All'), revert to 'All'
        if (currentFilter === filterVal && filterVal !== 'All') {
            currentFilter = 'All';
        } else {
            currentFilter = filterVal;
        }

        // Update active class
        summaryCards.forEach(c => c.classList.remove('active-filter'));
        const activeCard = Array.from(summaryCards).find(c => c.getAttribute('data-filter') === currentFilter);
        if (activeCard) activeCard.classList.add('active-filter');

        applyFilters();
    });
});

// Update Title Suggestions for Autocomplete
function updateTitleSuggestions(data) {
    if (!judulSuggestions) return;
    
    // Get unique titles
    const uniqueTitles = [...new Set(data.map(d => (d.Title || '').trim()).filter(Boolean))];
    
    judulSuggestions.innerHTML = '';
    uniqueTitles.forEach(title => {
        const option = document.createElement('option');
        option.value = title;
        judulSuggestions.appendChild(option);
    });
}

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
