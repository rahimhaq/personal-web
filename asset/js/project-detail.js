document.addEventListener('DOMContentLoaded', function () {
    // Ambil detail proyek dari localStorage
    const projectDetail = JSON.parse(localStorage.getItem('projectDetail'));

    if (projectDetail) {
        // Update informasi proyek pada halaman detail
        document.getElementById('projectTitle').innerText = projectDetail.name;
        document.getElementById('projectDuration').innerText = `${projectDetail.startDate} - ${projectDetail.endDate}`;
        document.getElementById('projectTime').innerText = projectDetail.duration;
        document.getElementById('projectTechnologies').innerHTML = projectDetail.techStack.split(', ').map(tech => `<li>${tech}</li>`).join('');
        document.getElementById('projectImage').src = projectDetail.imageUrl;
        document.querySelector('.project-description p').innerText = projectDetail.description;
    } else {
        console.error("No project details found in localStorage.");
    }
});
