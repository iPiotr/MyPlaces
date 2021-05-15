'use strict';

class Place {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, city, name, height) {
    this.coords = coords;
    this.city = city;
    this.name = name;
    this.height = height;
  }

  _setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} in ${
      this.city
    }
      <br>
      ⬆️ Above mean sea level: ${this.height}, ${this.id}`;
  }
}

class Mountain extends Place {
  type = 'mountain';

  constructor(coords, city, name, height) {
    super(coords, city, name, height);
    this._setDescription();
  }
}

class Other extends Place {
  type = 'other';

  constructor(coords, city, name) {
    super(coords, city, name);
    this._setDescription();
  }
}

const form = document.querySelector('.form');
const containerPlaces = document.querySelector('.places');
const inputType = document.querySelector('.form__input--type');
const inputCity = document.querySelector('.form__input--city');
const inputName = document.querySelector('.form__input--name');
const inputHeight = document.querySelector('.form__input--height');
const resetButton = document.querySelector('.reset__btn');

class App {
  _map;
  _mapZoomLevel = 13;
  _mapEvent;
  _places = [];

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newPlace.bind(this));
    containerPlaces.addEventListener('click', this._moveToPopup.bind(this));
    resetButton.addEventListener('click', this._resetData.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    console.log(coords);

    this._map = L.map('map').setView(coords, this._mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    const searchControl = L.esri.Geocoding.geosearch({
      placeholder: 'Enter an address or place',
      useMapBounds: false,
      providers: [
        L.esri.Geocoding.arcgisOnlineProvider({
          apikey:
            'AAPK2aa7a6832a674883bf78bf289218dcd65bQLmf6RRDOb5AjN6V_CKMUAKAkFIxYjTwUeJgq4NpRMaEk3gcS7vRJ7htefSyIS',
        }),
      ],
    }).addTo(this._map);

    const results = L.layerGroup().addTo(this._map);

    searchControl.on('results', function (data) {
      results.clearLayers();
      for (let i = data.results.length - 1; i >= 0; i--) {
        results.addLayer(L.marker(data.results[i].latlng));
      }
    });

    this._map.on('click', this._showForm.bind(this));

    this._places.forEach((work) => {
      this._renderPlaceMarker(work);
      this._map.setView(coords, this._mapZoomLevel);
    });
  }

  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove('hidden');
    inputCity.focus();
  }

  _hideForm() {
    inputCity.value = inputName.value = inputHeight.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newPlace(e) {
    const validInputs = (...inputs) => inputs.every((inp) => inp);
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    const type = inputType.value;
    const city = inputCity.value;
    const name = inputName.value;
    const height = inputHeight.value;
    const { lat, lng } = this._mapEvent.latlng;
    let place;

    if (type === 'mountain') {
      if (!validInputs(city, name, height)) {
        return alert('Complete all fields!');
      }

      place = new Mountain([lat, lng], city, name, height);
    }

    if (type === 'other') {
      if (!validInputs(city, name) || !allPositive())
        return alert('Complete all fields!');

      place = new Other([lat, lng], city, name);
    }

    this._places.push(place);
    console.log(place.id);

    this._renderPlaceMarker(place);

    this._renderPlace(place);

    this._hideForm();

    this._setLocalStorage();
  }

  _renderPlaceMarker(place) {
    L.marker(place.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          classcity: `${place.type}-popup`,
        })
      )
      .setPopupContent(
        `${place.type === 'mountain' ? '🏔️' : '🌄'} ${place.description}`
      )
      .openPopup();
  }

  _renderPlace(place) {
    let html = `
      <li class="place place--${place.type}" data-id="${place.id}">
        <h2 class="place__title">${place.description}</h2>
        <div class="place__details">
          <span class="place__icon">🏙️</span>
          <span class="place__value"> ${place.city}</span>
        </div>
        <div class="place__details">
          <span class="place__icon">🏛️</span>
          <span class="place__value">${place.name}</span>
        </div>
        <div class="place__details">
          <span class="place__icon">⬆️</span>
          <span class="place__value">${place.height}</span>
        </div>
        
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    if (!this._map) return;

    const placeEl = e.target.closest('.place');

    if (!placeEl) return;

    const place = this._places.find((place) => place.id === placeEl.dataset.id);
    const placeID = place.id;
    console.log(placeID);

    this._map.setView(place.coords, this._mapZoomLevel, {
      animate: true,
      pan: {
        name: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('places', JSON.stringify(this._places));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('places'));
    console.log(data);

    if (!data) return;

    this._places = data;

    this._places.forEach((work) => {
      this._renderPlace(work);
    });
  }

  _resetData() {
    localStorage.removeItem('places');
    location.reload();
  }
}

const app = new App();
