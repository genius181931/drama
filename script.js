// Ganti URL ini dengan Web App URL dari Google Apps Script Anda nanti
// Contoh format: 'https://script.google.com/macros/s/AKfycb.../exec'
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzFRNNkaphgv25jobA3eeVuNMjCQQTMmyBaLSbJ-e0dtThDEKKioTiWC6nWQUEyph9Z/exec'; 

const form = document.getElementById('drama-form');
const submitBtn = document.getElementById('submit-btn');
const statusMessage = document.getElementById('status-message');
const dramaTbody = document.getElementById('drama-tbody');
const loader = document.getElementById('loader');
const tableContainer = document.getElementById('table-container');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');

let dramaData = []; // Untuk menyimpan data lokal agar bisa di-search

// Ambil Data dari Google Sheets
async function fetchDramaData() {
    if (!APPS_SCRIPT_URL) {
        loader.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = '<p style="color:var(--error-color)">URL Apps Script belum diatur. Silakan ganti nilai APPS_SCRIPT_URL di script.js terlebih dahulu.</p>';
        return;
    }

    // Tampilkan loader, sembunyikan tabel
    loader.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
        const response = await fetch(APPS_SCRIPT_URL);
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
        emptyState.innerHTML = `<p style="color:var(--error-color)">Gagal memuat data. Pastikan URL Apps Script sudah benar dan memiliki izin akses yang tepat.</p><p style="font-size:0.8rem;margin-top:0.5rem">${error.message}</p>`;
    }
}

// Render data ke dalam tabel
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
        `;
        
        dramaTbody.appendChild(tr);
    });
}

// Fitur Pencarian Real-time
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

// Submit Form Data ke Google Sheets
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!APPS_SCRIPT_URL) {
        showStatus('URL Apps Script belum diatur.', 'error');
        return;
    }

    // Validasi sederhana
    const judul = document.getElementById('judul').value;
    const country = document.getElementById('country').value;
    const genre = document.getElementById('genre').value;
    const release = document.getElementById('release').value;
    const episode = document.getElementById('episode').value;

    if(!judul || !country || !genre || !release || !episode) {
        showStatus('Harap isi semua kolom wajib', 'error');
        return;
    }

    // Siapkan FormData
    const formData = new FormData(form);
    
    // Update UI Loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Menyimpan...';
    statusMessage.className = 'hidden';

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus('Drama berhasil ditambahkan!', 'success');
            form.reset();
            // Refresh tabel
            fetchDramaData();
        } else {
            throw new Error(result.message || 'Gagal menyimpan data');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showStatus('Gagal menyimpan. Pastikan URL benar dan skrip Apps Script telah di-deploy dengan opsi "Anyone".', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Drama';
    }
});

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    statusMessage.classList.remove('hidden');
    
    // Hilangkan pesan setelah 5 detik
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 5000);
}

// Inisialisasi: Muat data saat halaman dibuka
fetchDramaData();
