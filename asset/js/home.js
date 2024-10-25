document.addEventListener("DOMContentLoaded", () => {
    const url = 'https://api.npoint.io/050edf8e1fb4f88cc2e2'; // Ganti dengan URL API
  
    fetch(url)
      .then(response => response.json())
      .then(data => {
        document.getElementById('content').textContent = data.message;
        console.log("Data JSON diterima:", data);
      })
      .catch(error => console.error("Error fetching data:", error));
  });
  