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

// Array data testimonial dengan rating
const testimonials = [
  new Testimonial("asset/img/Rahim4.jpg", "Bermanfaat", "Rahiim", 5),
  new Testimonial("asset/img/Rahim.png", "Sangat Kerenn!", "Tahajjadan", 4),
  new Testimonial("asset/img/Rahim2.jpg", "Mantapp!", "Zhaahir", 2),
  new Testimonial("asset/img/Rahim3.jpg", "Baik sekali", "Haq", 3),
  new Testimonial("asset/img/dumbways.png", "Baik", "Admin", 1),
];

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

// Panggil fungsi untuk menampilkan semua testimonial saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => filterByRating("all"));
