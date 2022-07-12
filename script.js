"use strict";

/* ################################## GLOBAL VARIABLES ################################## */

let forecast; // This is what the forecast chart will be assigned to. It is defined here in the global scope, so that it can be destroyed when a new chart has to be drawn
let mapMarker;
let mapMarkerLayer;
let currentTempUnit = "celsius";

// ************ COLOR CONSTANTS *************
const COLOR_GRID_LINES = "rgba(255, 255, 255, 0.1)";
const COLOR_MAIN_AXIS = "rgba(255, 255, 255, 0.4)";
const COLOR_AXIS_LABELS = "rgba(255, 255, 255, 0.5)";
const COLOR_ANNOTATIONS_LINE = "rgba(3, 218, 198, 0.8)";
const COLOR_ANNOTATIONS_LABELBG = "rgba(3, 218, 198, 1)";
const COLOR_TEMP_CURVE = "rgb(227, 50, 50)";
const COLOR_RAIN_BARS = "rgb(84, 178, 255)";

/* ############################### HTML ELEMENT SELECTORS ############################### */

// *********** SEARCH WINDOW ***********
const $searchWindow = document.querySelector(".search-container");
const $searchWindowBackground = document.querySelector(".search-container-background");
const $searchWindowContent = document.querySelector(".content-container"); // the lower section of the search window, where map and search results appear
const $searchResultsContainer = document.querySelector(".results-container"); // necessary to have both container and list (see below)?
const $searchResultsList = document.querySelector(".search-result");
const $mapContainer = document.querySelector(".map-search-container");
const $loader = document.querySelector(".loader-container");
const $searchCityName = document.querySelector(".text-search-input");
const $errorTextSearch = document.querySelector(".text-search-error");
const $errorMapSearch = document.querySelector(".map-error");
const $btnMapToggle = document.querySelector(".map-toggle-btn");
const $btnMapCancel = document.querySelector(".btn-map-cancel");
const $btnMapConfirm = document.querySelector(".btn-map-confirm");

// ************ APP WINDOW *************
const $appContainer = document.querySelector(".app-container");
const $cityName = document.querySelector(".location-town");
const $stateAndCountry = document.querySelector(".location-state-and-country");
const $currentTemp = document.querySelector(".temperature");
const $humidity = document.querySelector(".humidity-value");
const $windSpeed = document.querySelector(".wind-value");
const $windDirectionArrow = document.querySelector(".wind-direction");
const $currentOvercast = document.querySelector("#current-overcast");
const $sunrise = document.querySelector(".sunrise");
const $sunset = document.querySelector(".sunset");
const $celsiusSymbol = document.querySelector(".temperature-celsius");
const $fahrenheitSymbol = document.querySelector(".temperature-fahrenheit");
const $btnOpenSearch = document.querySelector(".btn-open-search");
const $btnToggleTemperature = document.querySelector(".temperature-toggle");

/* ################################################################################# */
/* ############################### MAP FUNCTIONALITY ############################### */
/* ################################################################################# */

// CREATING THE MAP
const map = L.map("map").setView([51.505, -0.09], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

// HELPER FUNCTIONS
const makeMapToggleActive = function () {
  // Change the button into an ACTIVE state
  $btnMapToggle.classList.remove("map-toggle-btn-inactive");
  $btnMapToggle.classList.add("map-toggle-btn-active");
  $btnMapToggle.dataset.status = "active";
};

const makeMapToggleInactive = function () {
  // Change the button into an INACTIVE state
  $btnMapToggle.classList.add("map-toggle-btn-inactive");
  $btnMapToggle.classList.remove("map-toggle-btn-active");
  $btnMapToggle.dataset.status = "inactive";
};

const showMap = function () {
  // Unveil the lower section of the search window and the map container
  $searchWindowContent.classList.remove("hidden");
  $mapContainer.classList.remove("hidden");

  // Hide the search results, in case the user previously performed a text search
  $searchResultsContainer.classList.add("hidden");
};

const hideMap = function () {
  // Hide the lower section of the search window and the map container
  $mapContainer.classList.add("hidden");
  $searchWindowContent.classList.add("hidden");
};

// TOGGLING THE MAP VISIBILITY ON AND OFF
$btnMapToggle.addEventListener("click", function () {
  // Check if button is currently in an active or inactive state, then accordingly change the button state and hide/show the map
  if (this.dataset.status === "inactive") {
    makeMapToggleActive();
    showMap();
  } else {
    makeMapToggleInactive();
    hideMap();
  }

  // There is a problem with Leaflet not properly loading the map tiles, due to the map being hidden initially. The following code fixes it.
  setInterval(function () {
    map.invalidateSize(); // checks if map container size changed and if yes, updates the map
  }, 100);
});

// ADDING FUNCTIONALITY TO PLACE A MARKER ON THE MAP
map.on("click", function (e) {
  // Check if a marker is already present on the map. If yes, delete it, because there should never be more than one marker on the map
  mapMarkerLayer?.clearLayers();

  const { lat, lng } = e.latlng; // get coordinates of where the user clicked

  // At the clicked position, create a new marker with the following options
  mapMarker = L.marker([lat, lng], {
    opacity: 1,
    draggable: true,
    autoPan: true,
  });

  // Add the new marker to a layer group, then finally add that layer group to the map so that the marker shows up
  // Adding the marker to a layer group is necessary, so that an old marker can easily be deleted when a new one is created
  mapMarkerLayer = L.layerGroup([mapMarker]).addTo(map);
});

// CONFIRM BUTTON FUNCTIONALITY
$btnMapConfirm.addEventListener("click", async function () {
  // Check if the user has chosen a location on the map. If not, display an error message
  if (!mapMarker) {
    $errorMapSearch.classList.remove("hidden");
    return;
  }

  // Get the coordinates of the placed marker
  const { lat, lng } = mapMarker.getLatLng();

  // Get additional data based on those coordinates
  const additionalData = await getAdditionalData(lat, lng);
  const name = ""; // Unfortunately, the API to get the additionalData seems quite unreliable in regards to the location name, so I instead will be using the weather API later for this purpose
  const country = additionalData.address.country;
  const state = additionalData.address.state;

  createApp(lat, lng, name, state, country);
});

// CANCEL BUTTON FUNCTIONALITY
$btnMapCancel.addEventListener("click", function () {
  makeMapToggleInactive();
  hideMap();
});

// IN CASE THERE IS AN ERROR MESSAGE PRESENT ON THE MAP, REMOVE IT AS SOON AS THE USER STARTS ZOOMING OR MOVING THE MAP
map.on("moveend", function () {
  $errorMapSearch.classList.add("hidden");
});
map.on("zoomend", function () {
  $errorMapSearch.classList.add("hidden");
});

/* ################################################################################# */
/* ################################## TEXT SEARCH ################################## */
/* ################################################################################# */

// Fetch additional data. Used to get further information (like city, state and country name) based on a set of coordinates
const getAdditionalData = function (lat, lon) {
  return fetch(`https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&format=jsonv2`)
    .then((response) => response.json())
    .then((data) => data);
};

// Search for locations based on the users input, filter out non-cities and then display the remaining results
const searchAndDisplayResults = async function (cityName) {
  // Hide the map in case it was opened
  $mapContainer.classList.add("hidden");

  // Format the user's input by CAPITALIZING each word
  const name = cityName
    .toLowerCase()
    .split(" ")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");

  // Find all locations that match the search term
  const locations = await fetch(`https://nominatim.openstreetmap.org/search.php?city=${cityName}&format=jsonv2`)
    .then((response) => response.json())
    .then((data) => data);

  // The API doesn't seem to throw error messages, just an empty array if the location doesn't exists, so any errors will be caught based on if the returned array has a length of 0 (i.e. it is empty)
  if (!locations.length) {
    $errorTextSearch.classList.remove("hidden");
    return;
  }

  // Remove the error meessage, in case there was an error on a previous search
  $errorTextSearch.classList.add("hidden");

  // Show the lower section of the search window, including the loading spinner
  $searchWindowContent.classList.remove("hidden");
  $searchResultsContainer.classList.remove("hidden");
  $loader.classList.remove("hidden");

  // There's a visual bug when the loader is spinning, which can be fixed by temporarily turning off "overflow: auto" until the search has finished
  $searchWindowContent.style.overflow = "visible";

  // Filter out locations that are NOT a city, town, village, hamlet
  const citiesOnly = locations.filter((loc) => {
    return loc.type === "city" || loc.type === "town" || loc.type === "village" || loc.type === "hamlet" || loc.type === "administrative";
  });

  // For each city, get additional data (state, county, country)
  const additionalDataPromises = citiesOnly.map((city) => {
    const { lat, lon } = city;
    return getAdditionalData(lat, lon);
  });

  // Wait until the additional data for all cities has been received
  const citiesFullData = await Promise.all(additionalDataPromises);

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
    $searchResultsList.insertAdjacentHTML("beforeend", html);
  });

  // Remove the loading spinner
  $loader.classList.add("hidden");

  $searchWindowContent.style.overflow = "auto";
};

// LISTEN FOR "ENTER" KEY PRESSES IN THE SEARCH FIELD
$searchCityName.addEventListener("keypress", function (e) {
  if (e.key !== "Enter") return;

  // Deactivate the map toggle button, in case it was turned on
  makeMapToggleInactive();

  // Remove any prior search results, then search for new
  $searchResultsList.innerHTML = "";
  searchAndDisplayResults(e.target.value);

  // Reset the search input field
  this.value = "";
});

// LISTEN FOR CLICKS ON SEARCH RESULTS
$searchResultsList.addEventListener("click", function (e) {
  // find the parent container of the clicked search result
  const responsibleContainer = e.target.closest(".list-item-container");

  // Extract the data of the result, which is stored on data attributes
  const lat = responsibleContainer.dataset.lat;
  const lon = responsibleContainer.dataset.lon;
  const name = responsibleContainer.dataset.name;
  const state = responsibleContainer.dataset.state;
  const country = responsibleContainer.dataset.country;

  createApp(lat, lon, name, state, country);
});

/* ################################################################################# */
/* ################################ BUILDING THE APP ############################### */
/* ################################################################################# */

// HELPER FUNCTIONS

// Create an array of TEMPERATURES for the forecast chart
const getTemperatures = function (data) {
  return data.list.map((entry) => Number(entry.main.temp.toFixed(2)));
};

// Create an array of TIMELABELS for the forecast chart (for the lower x-axis)
const getTimelabels = function (data) {
  const timezone = data.city.timezone - 7200; // Right now all the sunrise and sunset times are off by 2 hours, probably due to some timezone problem. This is a temporary solution until I found a better one
  return data.list.map((entry) => dayjs((entry.dt + timezone) * 1000).format("HH:mm"));
};

const getTimestamps = function (data) {
  const timezone = data.city.timezone - 7200; // Right now all the sunrise and sunset times are off by 2 hours, probably due to some timezone problem. This is a temporary solution until I found a better one
  return data.list.map((entry) => (entry.dt + timezone) * 1000);
};

// Create an array of the PRECIPITATION for the forecast chart
const getRain = function (data) {
  return data.list.map((entry) => (entry.rain ? entry.rain["3h"] : 0));
};

// Create an array of WEATHER SYMBOLS for the forecast chart
const getWeatherSymbols = function (data) {
  return data.list.map((entry) => getWeatherSymbol(entry.weather[0].id, "emoji"));
};

// Get a single weather symbol (either png or emoji)
const getWeatherSymbol = function (id, iconType, isNight) {
  // These are the IDs of certain weather conditions. Each group shares the same weather icon (also see https://openweathermap.org/weather-conditions).
  // Each group contains a ".png" file (used for the main weather symbol in the top right) and an emoji (used for the chart symbols)
  // There is also some additional logic, which (where appropriate) changes between sun and moon symbols, depending on if it is night or not
  const ids = [
    [isNight ? "moon.png" : "sun.png", "☀", 800], // clearSky
    [isNight ? "moon-clouds.png" : "sun-clouds.png", "🌤", 801], // partlyClouded
    ["clouds.png", "☁", 802, 803, 804], // clouded
    ["rain.png", "🌧", 300, 301, 302, 310, 311, 312, 313, 314, 321, 520, 521, 522, 531], // rain
    [isNight ? "moon-rain.png" : "sun-rain.png", "🌦", 500, 501, 502, 503, 504], // rainAndSun/moon
    ["thunderstorm.png", "🌩", 200, 201, 202, 210, 211, 212, 221, 230, 231, 232], // thunderstorm
    ["snowflake.png", "❄", 511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622], // snow
    ["fog.png", "🌫", 701, 711, 721, 731, 741, 751, 761, 762, 771, 781], // mist
  ];
  let symbol;

  // Using a for-loop, so that the loop can be cancelled once the ID has been found
  // Loop through the "ids" array until the id has been found. Then return either the emoji or the .png, depending on what's requested
  for (let i = 0; i < ids.length; i++) {
    if (ids[i].includes(id)) {
      symbol = ids[i][iconType === "png" ? 0 : 1];
      break;
    }
  }

  return symbol;
};

// Rotate the wind direction symbol according to the wind degree
const setWindDirectionSymbol = function (deg) {
  // the original icon is already rotated by 45°, which is why 'north' corresponds to '-45°'
  const directions = ["-45", "0", "45", "90", "135", "180", "225", "270"];
  const id = Math.trunc(deg / 45);
  $windDirectionArrow.style.transform = `rotate(${directions[id]}deg)`;
};

// FETCHING DATA

// Fetch all the data that is necessary for building the forecast chart
const getForecastData = function (lat, lon) {
  return fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=b1e36bf120e56cf91d93313f23cbc780&units=${currentTempUnit === "celsius" ? "metric" : "imperial"}`)
    .then((response) => response.json())
    .then((data) => data);
};

// Fetch the current weather data
const getCurrentWeatherData = function (lat, lon) {
  return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=b1e36bf120e56cf91d93313f23cbc780&units=${currentTempUnit === "celsius" ? "metric" : "imperial"}`)
    .then((response) => response.json())
    .then((data) => data);
};

// DISPLAYING CURRENT WEATHER DATA
const displayCurrentWeather = async function (weatherData, cityName, stateName, countryName) {
  // For the sunrise and sunset times the timezone has to be taken into account
  const timezone = weatherData.timezone - 7200; // Right now all the sunrise and sunset times are off by 2 hours, probably due to some timezone problem. This is a temporary solution until I found a better one
  const sunrise = (weatherData.sys.sunrise + timezone) * 1000;
  const sunset = (weatherData.sys.sunset + timezone) * 1000;
  const localTime = (weatherData.dt + timezone) * 1000;

  // Check if it is currently night in the location, so that the 'moon' weather symbol can be used instead of the 'sun' symbol
  console.log("CURRENT TIME: " + dayjs(localTime).format("HH:mm"));
  console.log("SUNRISE: " + dayjs(sunrise).format("HH:mm"));
  console.log("SUNSET: " + dayjs(sunset).format("HH:mm"));

  const isNight = localTime > sunset || localTime < sunrise ? true : false;
  console.log(isNight);

  // Extract the current weather data and format it where appropriate
  const temp = Math.round(weatherData.main.temp);
  const humidity = weatherData.main.humidity;
  const windSpeed = Math.round(weatherData.wind.speed * 3.6); // converting the default unit of meters/sec to km/h
  const windDirection = weatherData.wind.deg;
  const weatherSymbol = getWeatherSymbol(weatherData.weather[0].id, "png", isNight);

  // Update the HTML elements with their respective data
  $cityName.textContent = cityName;
  $stateAndCountry.textContent = `${stateName ? `${stateName}, ` : ""} ${countryName}`; // some locations might not have a state, in which case print an empty string
  $currentTemp.textContent = temp;
  $humidity.textContent = humidity;
  $windSpeed.textContent = windSpeed;
  $sunrise.textContent = dayjs(sunrise).format("HH:mm");
  $sunset.textContent = dayjs(sunset).format("HH:mm");
  $currentOvercast.src = `icons/${weatherSymbol}`;

  // Rotate the wind direction symbol depending on the windDirection degree
  setWindDirectionSymbol(windDirection);
};

// This function creates an object holding the options for the day separator annotations
const createAnnotations = function (timeStamps) {
  let annotations = {};

  // First we need to find the first measurement of the day, because depending on the timezone it could be at 01:00, 03:00 etc.
  const hours = timeStamps.map((ts) => Number(dayjs(ts).format("HH")));
  const firstMeasurementOfDay = Math.min(...hours);

  // This function creates an options object for an annotation and adds it to the "annotations" object
  const createAnnotationObject = function (pos, dayName) {
    annotations[dayName] = {
      type: "line",
      xMin: pos - firstMeasurementOfDay / 3,
      xMax: pos - firstMeasurementOfDay / 3,
      borderColor: COLOR_ANNOTATIONS_LINE,
      label: {
        enabled: true,
        content: dayName,
        backgroundColor: COLOR_ANNOTATIONS_LABELBG,
        color: "black",
        font: function (context) {
          const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
          let size = Math.round(avgSize / 32);
          size = size > 12 ? 12 : size;
          return {
            size: size,
            weight: 200,
            family: "Inter",
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

  // Using the "firstMeasurementOfDay" variable we can now find the positions on which to place the day separator annotations and create an annotation object with it
  timeStamps.forEach((ts, i) => {
    // Don't create an annotation if it's on the very first point (cosmetic reasons)
    if (Number(dayjs(ts).format("HH")) === firstMeasurementOfDay && i !== 0) {
      const dayName = dayjs(ts).format("dddd"); // name of the day; used for the label
      createAnnotationObject(i, dayName);
    }
  });

  return annotations;
};

// BUILDING THE FORECAST CHART
const createForecastChart = function (data) {
  // If a forecast label already exists from a previous search, destroy it before creating the new one
  if (forecast) forecast.destroy();

  // Extract the relevant data from the forecast data
  const temperatures = getTemperatures(data);
  const timeStamps = getTimestamps(data);
  const timeLabels = getTimelabels(data);
  const rain = getRain(data);
  const overcastSymbols = getWeatherSymbols(data);

  // Create the annotations that are used the separate the different days on the chart
  const annotationsArray = createAnnotations(timeStamps);

  // OPTIONS FOR THE FORECAST CHART

  // A custom plugin that allows for coloring the chart background
  const backgroundColorPlugin = {
    id: "background",
    beforeDraw: (chart, args, opts) => {
      if (!opts.color) {
        return;
      }

      const { ctx, chartArea } = chart;

      ctx.fillStyle = opts.color;
      ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    },
  };
  // Registering the (custom) plugins
  Chart.register(backgroundColorPlugin);
  Chart.register(ChartDataLabels);

  // Configuring the options for the forecast chart
  const config = {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: [
        {
          type: "line",
          label: "Temperatures",
          data: temperatures,
          borderWidth: 5,
          borderColor: COLOR_TEMP_CURVE,
          borderCapStyle: "round",
          tension: 0.1,
          pointBorderWidth: 0,
          pointRadius: 0,
          borderJoinStyle: "round",
        },
        {
          type: "bar",
          label: "Rain",
          data: rain,
          yAxisID: "rainAxis",
          backgroundColor: COLOR_RAIN_BARS,
        },
      ],
    },
    options: {
      scales: {
        y: {
          // beginAtZero: true,
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
            color: COLOR_AXIS_LABELS,
          },
          grid: {
            borderColor: COLOR_MAIN_AXIS,
            color: COLOR_GRID_LINES,
          },
          grace: "50%", // adding a bit of "leeway" between the highest temperature point and the may point of the y scale, so that the temp datalabels don't interfere with the overcast symbols
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
            callback: function (value) {
              return value + "mm";
            },
            font: function (context) {
              const avgSize = Math.round((context.chart.height + context.chart.width) / 2);
              let size = Math.round(avgSize / 32);
              size = size > 14 ? 14 : size;
              return {
                size: size,
              };
            },
            color: COLOR_AXIS_LABELS,
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
            color: COLOR_AXIS_LABELS,
          },
          grid: {
            borderColor: COLOR_MAIN_AXIS,
            color: COLOR_GRID_LINES,
            // display: false,
          },
          offset: true,
        },
        x2: {
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
            color: function (value) {
              if (value.tick.label === "☀") return "rgb(255, 241, 107)";
              if (value.tick.label === "⛅") return "rgb(255, 246, 161)"; // seems to not be working?
              if (value.tick.label === "🌧") return "rgb(57, 114, 204)";
              if (value.tick.label === "🌦") return "rgb(110, 152, 219)";
              if (value.tick.label === "🌩") return "rgb(219, 77, 77)";
              if (value.tick.label === "☁") return "rgb(222, 222, 222)";
              if (value.tick.label === "🌫") return "rgb(181, 181, 181)";
              if (value.tick.label === "❄") return "rgb(61, 200, 255)";
              return "rgb(250, 226, 155)";
            },
          },
          grid: {
            drawOnChartArea: false,
            drawTicks: false,
          },
          offset: true, // aligning the top x axis with the bottom one
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
          align: "end",
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
          textShadowColor: "black",
        },
        tooltip: {
          enabled: false,
        },
        background: {
          color: "rgba(255, 255, 255, 0.05)", // grey
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  };

  // Drawing the chart
  const ctx = document.getElementById("myChart").getContext("2d");
  forecast = new Chart(ctx, config);
};

const createApp = async function (lat, lon, name, state, country) {
  // $appContainer.classList.remove("hidden");
  // Fetch the weather data for both the forecast and the current weather
  const [forecastData, currentWeatherData] = await Promise.all([getForecastData(lat, lon), getCurrentWeatherData(lat, lon)]);

  // When using the map search, the 'name' variable will be an empty string, due to an API that doesn't reliably retrieve the location name. Instead the "currentWeatherData" will be used to get the name of the location chosen on the map
  const locationName = name ? name : currentWeatherData.name;

  // Update the DOM with all current weather data and the location data
  displayCurrentWeather(currentWeatherData, locationName, state, country);
  createForecastChart(forecastData);

  // Unveil the app window if it is still hidden and remove the blur
  $appContainer.classList.remove("invisible");
  $appContainer.classList.remove("blurry");

  // Hide the search window
  $searchWindowBackground.classList.add("hidden");
};

// Opening the search window when pressing on the search symbol
$btnOpenSearch.addEventListener("click", function () {
  $searchWindowBackground.classList.remove("hidden");
  $appContainer.classList.add("blurry");
  $searchCityName.focus();
});

// Closing the search window when pressing outside of its modal window
$searchWindowBackground.addEventListener("mousedown", function (e) {
  // The search window should only be closeable if the app window is already visible, otherwise the user might accidentally close the search window without being able to open it up again
  if ($appContainer.classList.contains("invisible")) return;

  if (e.target === this || e.target === $searchWindow) {
    $searchWindowBackground.classList.add("hidden");
    $appContainer.classList.remove("blurry");
  }
});

// SWITCHING CELSIUS <-> FAHRENHEIT
const toggleTempUnitSymbol = function () {
  $celsiusSymbol.classList.toggle("active-temperature");
  $fahrenheitSymbol.classList.toggle("active-temperature");
};

const celsiusToFahrenheit = function (temp) {
  return temp * 1.8 + 32;
};

const fahrenheitToCelsius = function (temp) {
  return (temp - 32) * (5 / 9);
};

const convertCurrentTemp = function () {
  // Convert the value of the current temperature and update the display accordingly
  const currentTempValue = Number($currentTemp.textContent);
  $currentTemp.textContent = currentTempUnit === "celsius" ? Math.round(celsiusToFahrenheit(currentTempValue)) : Math.round(fahrenheitToCelsius(currentTempValue));
};

const convertForecastTemps = function () {
  // Get the current temperatures from the forecast chart
  const forecastTemps = forecast.data.datasets[0].data;

  // Convert the forecast temperatures to celsius/fahrenheit
  const forecastTempsConverted = forecastTemps.map((temp) => Number(currentTempUnit === "celsius" ? celsiusToFahrenheit(temp).toFixed(2) : fahrenheitToCelsius(temp).toFixed(2)));

  // Update the forecast chart with the new data
  forecast.data.datasets[0].data = forecastTempsConverted;
  forecast.options.scales["y"].ticks.callback = function (value) {
    return currentTempUnit === "celsius" ? value + "°F" : value + "°C";
  };
  forecast.update();
};

$btnToggleTemperature.addEventListener("click", function () {
  toggleTempUnitSymbol();
  convertCurrentTemp();
  convertForecastTemps();
  currentTempUnit = currentTempUnit === "celsius" ? "fahrenheit" : "celsius";
});
