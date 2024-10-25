// asset/js/testimonial.js

// Class untuk menyimpan data testimonial
class Testimonial {
  constructor(image, text, author, rating) {
    this.image = image;
    this.text = text;
    this.author = author;
    this.rating = rating;
  }

  // Method untuk membuat elemen HTML untuk setiap testimonial
  createTestimonialElement() {
    const card = document.createElement("div");
    card.className = "testimonial-card";

    card.innerHTML = `
      <img src="${this.image}" alt="${this.author}" />
      <p class="testimonial-text">"${this.text}"</p>
      <p class="testimonial-author">- ${this.author}</p>
      <p class="testimonial-rating">${"★".repeat(this.rating)}</p>
    `;

    return card;
  }
}

// Array untuk menyimpan testimonial yang diambil melalui AJAX
let testimonials = [];

// Fungsi untuk mengambil testimonial dari URL JSON menggunakan AJAX
function loadTestimonials() {
  const url = 'https://api.npoint.io/fa2fb7b28a929d02cc10'; // Ganti dengan URL API 

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      // Buat objek Testimonial dari data yang diambil dan simpan dalam array
      testimonials = data.map(item => new Testimonial(item.image, item.text, item.author, item.rating));
      filterByRating("all");  // Tampilkan semua testimonial setelah data di-load
    })
    .catch(error => console.error("Error loading testimonials:", error));
}


// Fungsi Higher-Order untuk memfilter testimonial berdasarkan rating
function filterTestimonials(filterFn) {
  return testimonials.filter(filterFn);
}

// Fungsi callback untuk filter berdasarkan rating
function filterByRating(rating) {
  const container = document.getElementById("testimonialsContainer");
  container.innerHTML = "";

  let filteredTestimonials;

  if (rating === "all") {
    filteredTestimonials = testimonials;
  } else {
    filteredTestimonials = filterTestimonials(
      (testimonial) => testimonial.rating === rating
    );
  }

  filteredTestimonials.forEach((testimonial) => {
    const testimonialElement = testimonial.createTestimonialElement();
    container.appendChild(testimonialElement);
  });
}

// Panggil fungsi untuk mengambil testimonial dengan AJAX saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => loadTestimonials());
