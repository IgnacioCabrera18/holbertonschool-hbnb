document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          await loginUser(email, password);
      });
  }

  const priceFilter = document.getElementById('price-filter');
  if (priceFilter) {
      const priceOptions = [10, 50, 100, 'All'];
      priceOptions.forEach(option => {
          const opt = document.createElement('option');
          opt.value = option;
          opt.textContent = option;
          priceFilter.appendChild(opt);
      });
      priceFilter.addEventListener('change', (event) => {
          const selectedPrice = event.target.value;
          filterPlaces(selectedPrice);
      });
      checkAuthentication();
  }

  const placeDetailsSection = document.getElementById('place-details');
  if (placeDetailsSection) {
      const placeId = getPlaceIdFromURL();
      checkPlaceAuthentication(placeId);
  }
});

async function loginUser(email, password) {
  const response = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
  });

  if (response.ok) {
      const data = await response.json();
      document.cookie = `token=${data.access_token}; path=/`;
      window.location.href = 'index.html';
  } else {
      alert('Login failed: ' + response.statusText);
  }
}

function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let c of cookies) {
      const [key, value] = c.trim().split('=');
      if (key === name) return value;
  }
  return null;
}

let allPlaces = [];

function checkAuthentication() {
  const token = getCookie('token');
  const loginLink = document.getElementById('login-link');
  if (!token) {
      if (loginLink) loginLink.style.display = 'block';
  } else {
      if (loginLink) loginLink.style.display = 'none';
      fetchPlaces(token);
  }
}

async function fetchPlaces(token) {
  try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/places', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) { alert('Error fetching places: ' + response.statusText); return; }
      const data = await response.json();
      allPlaces = data;
      displayPlaces(allPlaces);
  } catch (error) { alert('Error connecting to server: ' + error.message); }
}

function displayPlaces(places) {
  const placesList = document.getElementById('places-list');
  if (!placesList) return;
  placesList.innerHTML = '';
  places.forEach(place => {
      const article = document.createElement('article');
      article.classList.add('place-card');
      article.dataset.price = place.price;
      article.innerHTML = `
          <h3>${place.name}</h3>
          <p>Price per night: $${place.price}</p>
          <p>${place.description || ''}</p>
          <a href="place.html?id=${place.id}" class="details-button">View Details</a>
      `;
      placesList.appendChild(article);
  });
}

function filterPlaces(maxPrice) {
  const placesList = document.getElementById('places-list');
  if (!placesList) return;
  const articles = placesList.querySelectorAll('.place-card');
  articles.forEach(article => {
      const price = parseFloat(article.dataset.price);
      article.style.display = (maxPrice === 'All' || price <= parseFloat(maxPrice)) ? 'block' : 'none';
  });
}

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function checkPlaceAuthentication(placeId) {
  const token = getCookie('token');
  const addReviewSection = document.getElementById('review-form');
  if (!token) {
      if (addReviewSection) addReviewSection.style.display = 'none';
      fetchPlaceDetails(null, placeId);
  } else {
      if (addReviewSection) addReviewSection.style.display = 'block';
      fetchPlaceDetails(token, placeId);
  }
}

async function fetchPlaceDetails(token, placeId) {
  try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`http://127.0.0.1:5000/api/v1/places/${placeId}`, { headers });
      if (!response.ok) { alert('Error fetching place details: ' + response.statusText); return; }
      const data = await response.json();
      displayPlaceDetails(data);
  } catch (error) { alert('Error connecting to server: ' + error.message); }
}

function displayPlaceDetails(place) {
  const section = document.getElementById('place-details');
  if (!section) return;
  section.innerHTML = `
      <h2>${place.name}</h2>
      <p>${place.description || ''}</p>
      <p>Price per night: $${place.price}</p>
      <p>Amenities: ${place.amenities ? place.amenities.join(', ') : 'None'}</p>
      <h3>Reviews:</h3>
      ${place.reviews && place.reviews.length > 0
          ? place.reviews.map(r => `<div class="review-card"><p>User: ${r.user_name}</p><p>Rating: ${r.rating}/5</p><p>Comment: ${r.text}</p></div>`).join('')
          : '<p>No reviews yet</p>'
      }
  `;
}
