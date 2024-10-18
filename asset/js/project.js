// Fungsi untuk memformat tanggal menjadi format "12 Jan 2024"
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);  // Format: dd MMM yyyy
}

// Fungsi untuk menghitung durasi proyek dan mengonversi ke minggu jika lebih dari 5 hari
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 5) {
        const weeks = Math.ceil(diffDays / 7);
        return `${weeks} week(s)`;  // Menghitung dalam minggu jika lebih dari 5 hari
    } else {
        return `${diffDays} day(s)`;  // Menghitung dalam hari jika kurang dari 5 hari
    }
}

// Ambil form dan container project cards
const form = document.getElementById('project-form');
const projectCardsContainer = document.getElementById('projectCardsContainer');

// Event listener untuk form submit
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const projectName = document.getElementById('project-name').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const description = document.getElementById('description').value;
    const technologies = Array.from(document.querySelectorAll('input[name="tech"]:checked')).map(checkbox => checkbox.value);
    const imageInput = document.getElementById('image');
    const imageUrl = imageInput.files[0] ? URL.createObjectURL(imageInput.files[0]) : 'default-image.jpg';

    const newProject = `
        <div class="project-card" onclick="openProjectDetail('${projectName}', '${formatDate(startDate)}', '${formatDate(endDate)}', '${description}', '${technologies.join(', ')}', '${imageUrl}', '${calculateDuration(startDate, endDate)}')">
            <img src="${imageUrl}" alt="${projectName}">
            <h3>${projectName} - ${formatDate(startDate)} to ${formatDate(endDate)}</h3>
            <p>${description}</p>
            <p><strong>Technologies:</strong> ${technologies.join(', ')}</p>
            <p><strong>Duration:</strong> ${calculateDuration(startDate, endDate)}</p>
        </div>
    `;

    projectCardsContainer.innerHTML += newProject;

    form.reset();  // Reset form setelah menambahkan proyek
});

// Fungsi untuk membuka detail proyek dan menyimpan ke localStorage
function openProjectDetail(name, startDate, endDate, description, techStack, imageUrl, duration) {
    localStorage.setItem('projectDetail', JSON.stringify({
        name,
        startDate,
        endDate,
        description,
        techStack,
        imageUrl,
        duration
    }));
    window.location.href = 'project-detail.html';  // Pindah ke halaman detail proyek
}
