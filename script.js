let forecast; // This is what the chart will be assigned to. It is defined here in the global scope, so that it can be destroyed when a new chart has to be drawn

const appContainer = document.querySelector(".app-container");

// // SEARCH BUTTON
const btnSearch = document.querySelector(".search-btn");
const containerSearchOverlay = document.querySelector(".search-overlay-container");
const searchContainer = document.querySelector(".search-container");
const inputSearchCity = document.querySelector(".input-search");

// Opening the search window when pressing on the search symbol
btnSearch.addEventListener("click", function () {
  containerSearchOverlay.classList.toggle("hidden");
  inputSearchCity.focus();
});

// Closing the search window when pressing outside of its modal window
containerSearchOverlay.addEventListener("mousedown", function (e) {
  if (e.target === this || e.target === searchContainer) containerSearchOverlay.classList.toggle("hidden");
});

const getForecastData = async function (lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=b1e36bf120e56cf91d93313f23cbc780&units=${currentTempUnit === "celsius" ? "metric" : "imperial"}`)
    .then((response) => response.json())
    .then((data) => {
      // console.log(data);
      const temperatures = getTemperatures(data);
      const timestamps = getTimestamps(data);
      const timelabels = getTimelabels(data);
      const rain = getRain(data);
      const symbols = getOvercastSymbols(data);
      if (forecast) forecast.destroy(); // If a forecast label already exists from a previous search, destroy it before creating the new one
      createForecastChart(temperatures, timelabels, symbols, rain, timestamps);
    });
};

const getTemperatures = function (data) {
  return data.list.map((entry) => Number(entry.main.temp.toFixed(2)));
};

const getTimelabels = function (data) {
  return data.list.map((entry) => dayjs(entry.dt * 1000).format("HH:mm"));
};

const getTimestamps = function (data) {
  return data.list.map((entry) => entry.dt * 1000);
};

const getRain = function (data) {
  return data.list.map((entry) => (entry.rain ? entry.rain["3h"] : 0));
};

const getOvercastSymbols = function (data) {
  return data.list.map((entry) => getOvercastSymbol(entry.weather[0].id));
};

const getOvercastSymbol = function (id) {
  // These are the IDs of certain weather conditions. Each group shares the same weather icon (also see https://openweathermap.org/weather-conditions)
  const ids = [
    ["☀", 800], // clearSky
    ["🌤", 801], // partlyClouded
    ["☁", 802, 803, 804], // clouded
    ["🌧", 300, 301, 302, 310, 311, 312, 313, 314, 321, 520, 521, 522, 531], // rain
    ["🌦", 500, 501, 502, 503, 504], // rainAndSun
    ["🌩", 200, 201, 202, 210, 211, 212, 221, 230, 231, 232], // thunderstorm
    ["❄", 511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622], // snow
    ["🌫", 701, 711, 721, 731, 741, 751, 761, 762, 771, 781], // mist
  ];
  let symbol;

  // using a for-loop, so that the loop can be cancelled once the ID has been found
  for (let i = 0; i < ids.length; i++) {
    if (ids[i].includes(id)) {
      symbol = ids[i][0];
      break;
    }
  }
  return symbol;
};

const createForecastChart = function (temperatures, timeLabels, overcastSymbols, rain, timeStamps) {
  let annotationsArray = {};

  // This function creates the objects for the day annotations on the x-axis
  const createAnnotations = function () {
    const getPositions = function () {
      timeStamps.forEach((ts, i) => {
        if (dayjs(ts).format("HH") === "02" && i !== 0) {
          const dayName = dayjs(ts).format("dddd");
          createAnnotationObject(i, dayName);
        }
      });
    };
    const createAnnotationObject = function (pos, dayName) {
      annotationsArray[dayName] = {
        type: "line",
        xMin: pos - 2 / 3,
        xMax: pos - 2 / 3,
        label: {
          enabled: true,
          content: dayName,
          font: function (context) {
            const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
            let size = Math.round(avgSize / 32);
            size = size > 12 ? 12 : size;
            return {
              size: size,
              weight: 200,
            };
          },
          yAdjust: -5,
          position: "start",
          padding: {
            top: 3,
            bottom: 3,
            left: 6,
            right: 6,
          },
        },
      };
    };
    getPositions();
  };
  createAnnotations();
  Chart.defaults.font.family = "sans-serif, 'FontAwesome'";
  Chart.register(ChartDataLabels);

  const ctx = document.getElementById("myChart").getContext("2d");
  forecast = new Chart(ctx, {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: [
        {
          type: "line",
          label: "Temperatures",
          data: temperatures,
          borderWidth: 3,
          borderColor: "red",
          tension: 0.2,
          pointBackgroundColor: "red",
          pointBorderWidth: 0,
          pointRadius: 0,
        },
        {
          type: "bar",
          label: "Rain",
          data: rain,
          yAxisID: "rainAxis",
          backgroundColor: "blue",
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value + "°C";
            },
            font: function (context) {
              const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
              let size = Math.round(avgSize / 32);
              size = size > 14 ? 14 : size;
              return {
                size: size,
              };
            },
          },
        },
        rainAxis: {
          position: "right",
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
            drawBorder: false,
            drawTicks: false,
          },
          ticks: {
            font: function (context) {
              const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
              let size = Math.round(avgSize / 32);
              size = size > 14 ? 14 : size;
              return {
                size: size,
              };
            },
          },
          suggestedMax: 10,
        },
        x: {
          display: true,
          ticks: {
            callback: function (value, index, ticks) {
              return timeLabels[value];
            },
            font: function (context) {
              const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
              let size = Math.round(avgSize / 32);
              size = size > 14 ? 14 : size;
              return {
                size: size,
              };
            },
          },
        },
        x2: {
          type: "category",
          position: "top",
          ticks: {
            callback: function (value, index, ticks) {
              return overcastSymbols[value];
            },
            font: function (context) {
              const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
              let size = Math.round(avgSize / 32);
              size = size > 14 ? 14 : size;
              return {
                size: size,
              };
            },
            maxRotation: 0,
          },
          grid: {
            drawOnChartArea: false,
            drawTicks: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        annotation: {
          annotations: annotationsArray,
        },
        datalabels: {
          color: "white",
          backgroundColor: function (context) {
            if (context.chart.width < 1000) {
              return context.dataIndex % 2 === 0 && context.dataset.type === "line" ? "red" : "";
            } else {
              return context.dataset.type === "line" ? "red" : ""; //without this the background will also appear on the rain chart
            }
          },
          borderRadius: 5,
          padding: 2,
          font: function (context) {
            const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
            let size = Math.round(avgSize / 32);
            size = size > 12 ? 12 : size;
            return {
              size: size,
              weight: "bold",
            };
          },
          formatter: function (value, context) {
            if (context.chart.width < 1000) {
              return context.dataIndex % 2 === 0 && context.dataset.type === "line" ? Math.round(value) : "";
            } else {
              return context.dataset.type === "line" ? Math.round(value) : ""; // Datalabels should only be displayed for the temperature chart, not for the rain bars
            }
          },
        },
        tooltip: {
          enabled: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

const getCurrentWeather = async function (lat, lon, name, state, country) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=b1e36bf120e56cf91d93313f23cbc780&units=${currentTempUnit === "celsius" ? "metric" : "imperial"}`)
    .then((response) => response.json())
    .then((data) => {
      updateUI(data, name, state, country);
      // console.log(data);
    })
    .catch((err) => console.log("City does not exist"));
};

const elTownName = document.querySelector(".location-town");
const elStateAndCountry = document.querySelector(".location-state-and-country");
const elCurrentTemp = document.querySelector(".temperature");
const elHumidity = document.querySelector(".humidity-value");
const elWind = document.querySelector(".wind-value");
const elCurrentOvercast = document.querySelector("#current-overcast");
const elSunrise = document.querySelector(".sunrise");
const elSunset = document.querySelector(".sunset");

const updateUI = async function (weatherData, cityName, stateName, countryName) {
  const { lat, lon } = weatherData.coord;
  const addData = await fetch(`https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&format=jsonv2`)
    .then((response) => response.json())
    .then((data) => data);

  const name = cityName ? cityName : weatherData.name;
  const state = stateName ? stateName : addData.address.state;
  const country = countryName ? countryName : addData.address.country;
  const temp = Math.round(weatherData.main.temp);
  const humidity = weatherData.main.humidity;
  const wind = weatherData.wind.speed;
  const windDirection = weatherData.wind.deg;
  const timezone = weatherData.timezone - 7200; // Right now all the sunrise and sunset times are off by 2 hours, probably due to some timezone problem. This is a temporary solution until I found a better one
  const sunrise = dayjs((weatherData.sys.sunrise + timezone) * 1000).format("HH:mm");
  const sunset = dayjs((weatherData.sys.sunset + timezone) * 1000).format("HH:mm");
  const weatherSymbol = getOvercastSymbol(weatherData.weather[0].id);

  elTownName.textContent = name;
  elStateAndCountry.textContent = `${state ? `${state}, ` : ""} ${country}`;
  elCurrentTemp.textContent = temp;
  elHumidity.textContent = humidity;
  elWind.textContent = wind;
  elSunrise.textContent = sunrise;
  elSunset.textContent = sunset;
  elCurrentOvercast.textContent = weatherSymbol;

  containerSearchOverlay.classList.add("hidden");
};

const searchField = document.querySelector(".input-search");
const searchResultList = document.querySelector(".search-results");
const resultsContainer = document.querySelector(".results-container");
const loaderContainer = document.querySelector(".loader-container");

searchField.addEventListener("keypress", function (e) {
  if (e.key !== "Enter") return;
  searchResultList.innerHTML = "";
  searchAndDisplayResults(e.target.value);
  this.value = "";
});

const searchAndDisplayResults = async function (cityName) {
  resultsContainer.classList.remove("hidden");
  loaderContainer.classList.remove("hidden");
  mapContainer.classList.add("hidden");

  // There are a lot of search results, that for some reason are missing the name of the current city/town/village, so I'm using the typed-in name, instead of getting it from the API data
  const name = cityName
    .toLowerCase()
    .split(" ")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");

  // Find all locations that match the search term
  const locations = await fetch(`https://nominatim.openstreetmap.org/search.php?city=${cityName}&format=jsonv2`)
    .then((response) => response.json())
    .then((data) => data);

  // Filter out locations that are NOT a city, town, village, hamlet
  const citiesOnly = locations.filter((loc) => {
    return loc.type === "city" || loc.type === "town" || loc.type === "village" || loc.type === "hamlet" || loc.type === "administrative";
  });

  // For each city, get additional data (state, county, country)
  const addDataPromises = citiesOnly.map((city) => {
    const { lat, lon } = city;

    return fetch(`https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&format=jsonv2`)
      .then((response) => response.json())
      .then((data) => data);
  });

  const citiesFullData = await Promise.all(addDataPromises);

  console.log(citiesFullData);
  // Create an object for each city and store them all in an array
  const cities = citiesFullData.map((city) => {
    return {
      name: name,
      state: city.address.state,
      county: city.address.county,
      country: city.address.country,
      countryCode: city.address.country_code,
      lat: city.lat,
      lon: city.lon,
    };
  });

  // The API often returns cities multiple times, so duplicates have to be filtered out (filtering is based on if there is already a city which has the same state, county and country properties)
  const citiesFiltered = cities.reduce((acc, city) => {
    if (
      acc.some((entry) => {
        return entry.state === city.state && entry.county === city.county && entry.country === city.country;
      })
    )
      return acc;
    else {
      acc.push(city);
      return acc;
    }
  }, []);

  // Finally, we have to build an HTML string out of all the info in our city objects and attach that HTML element to the search result list
  citiesFiltered.forEach((city) => {
    const name = city.name;
    const state = city.state;
    const county = city.county;
    const country = city.country;
    const countryCode = city.countryCode;
    const lat = city.lat;
    const lon = city.lon;

    const html = `
      <div class="list-item-container" data-lat="${lat}" data-lon="${lon}" data-name="${name}" ${state ? `data-state="${state}"` : ""} ${county ? `data-county="${county}"` : ""}" data-country="${country}">
        <li>${name}, ${state ? `${state}, ` : ``}${county ? `${county}, ` : ``}${country}</li>
        <img src="https://countryflagsapi.com/png/${countryCode}" alt="Flag of ${country}">
      </div>
      
    `;

    searchResultList.insertAdjacentHTML("beforeend", html);
  });

  loaderContainer.classList.add("hidden");
};

searchResultList.addEventListener("click", function (e) {
  const responsibleContainer = e.target.closest(".list-item-container");
  const lat = responsibleContainer.dataset.lat;
  const lon = responsibleContainer.dataset.lon;
  const name = responsibleContainer.dataset.name;
  const state = responsibleContainer.dataset.state;
  const country = responsibleContainer.dataset.country;
  appContainer.classList.remove("hidden");
  getCurrentWeather(lat, lon, name, state, country);
  getForecastData(lat, lon);
});

// ******************************** MAP SEARCH ********************************
const map = L.map("map").setView([51.505, -0.09], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

const mapContainer = document.querySelector(".map-search-container");
const btnMapSearch = document.querySelector(".btn-map-search");
const btnMapCancel = document.querySelector(".btn-map-cancel");
const btnMapConfirm = document.querySelector(".btn-map-confirm");

btnMapSearch.addEventListener("click", function () {
  resultsContainer.classList.add("hidden");
  mapContainer.classList.remove("hidden");

  // There is a problem with Leaflet not properly loading the map tiles, due to the map being hidden initially
  setInterval(function () {
    map.invalidateSize();
  }, 100);
});

btnMapCancel.addEventListener("click", function () {
  mapContainer.classList.add("hidden");
});

btnMapConfirm.addEventListener("click", function () {
  // mapContainer.classList.add("hidden");
  const { lat, lng } = mapMarker.getLatLng();
  appContainer.classList.remove("hidden");
  getCurrentWeather(lat, lng);
  getForecastData(lat, lng);
});

let mapMarker;
let mapMarkerLayer;

map.on("click", function (e) {
  mapMarkerLayer?.clearLayers();
  const { lat, lng } = e.latlng;
  mapMarker = L.marker([lat, lng], {
    opacity: 1,
    draggable: true,
    autoPan: true,
  });
  mapMarkerLayer = L.layerGroup([mapMarker]).addTo(map);
});

// SWITCHING CELSIUS <-> FAHRENHEIT
let currentTempUnit = "celsius";
const celsiusSymbol = document.querySelector(".temperature-celsius");
const fahrenheitSymbol = document.querySelector(".temperature-fahrenheit");
const temperatureToggle = document.querySelector(".temperature-toggle");

temperatureToggle.addEventListener("click", function () {
  toggleTempUnitSymbol();
  convertCurrentTemp();
  convertForecastTemps();
  currentTempUnit = currentTempUnit === "celsius" ? "fahrenheit" : "celsius";
});

const toggleTempUnitSymbol = function () {
  celsiusSymbol.classList.toggle("active-temperature");
  fahrenheitSymbol.classList.toggle("active-temperature");
};

const convertCurrentTemp = function () {
  // Convert the value of the current temperature and update the display accordingly
  const currentTempValue = Number(elCurrentTemp.textContent);
  elCurrentTemp.textContent = currentTempUnit === "celsius" ? Math.round(celsiusToFahrenheit(currentTempValue)) : Math.round(fahrenheitToCelsius(currentTempValue));
};

const celsiusToFahrenheit = function (temp) {
  return temp * 1.8 + 32;
};

const fahrenheitToCelsius = function (temp) {
  return (temp - 32) * (5 / 9);
};

const convertForecastTemps = function () {
  // Get the current temperatures from the forecast chart
  const forecastTemps = forecast.data.datasets[0].data;

  // Convert the forecast temperatures to celsius/fahrenheit
  const forecastTempsConverted = forecastTemps.map((temp) => Number(currentTempUnit === "celsius" ? celsiusToFahrenheit(temp).toFixed(2) : fahrenheitToCelsius(temp).toFixed(2)));

  forecast.data.datasets[0].data = forecastTempsConverted;
  forecast.options.scales["y"].ticks.callback = function (value) {
    return currentTempUnit === "celsius" ? value + "°F" : value + "°C";
  };
  forecast.update();
};

// JUST TESTING
elCurrentOvercast.addEventListener("click", function () {
  forecast.data.datasets[0].data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  forecast.options.scales["y"].ticks.callback = function (value) {
    return value + "°F";
  };
  forecast.update();
});
