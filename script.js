// const temperatures = [16.29, 14, 11.27, 16.51, 22.48, 25.49, 26.79, 24.61, 18.72, 15.82, 14.61, 20.42, 27.41, 30.61, 30.95, 28.03, 20.59, 17.91, 14.7, 19, 23.32, 25.01, 28.61, 25.23, 17.75, 13.71, 11.83, 16.64, 20.79, 24.21, 25.88, 23.58, 16.31, 12.94, 11.29, 16.37, 21.51, 25.69, 26.44, 22.15];
// const times = ["17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00"];
const overcasts = ["\uf76c", "☀", "☁", "🌧", "☁", "☀", "☁", "🌧", "🌧", "☁", "☀", "☁", "☀", "☁", "☁", "☁", "☁", "☁", "☀", "☁", "☁", "☁", "☀", "🌦", "☁", "🌧", "☁", "🌧", "🌧", "🌧", "☁", "☁", "🌧", "🌧", "☁", "☁", "☁", "☁", "☁", "☁"];
const rain = [0, 0, 0, 0, 0, 0.25, 0.54, 0.32, 0, 0, 0, 0, 0, 0.23, 0, 0, 0, 0.17, 1.2, 0.6, 0.15, 1, 0.73, 0.11, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0.16, 0, 0.1, 0, 0, 0.16, 0.3];

let forecast; // This is what the chart will be assigned to. It is defined here in the global scope, so that it can be destroyed when a new chart has to be drawn

// SEARCH BUTTON
const btnSearch = document.querySelector(".search-btn");
const containerSearch = document.querySelector(".search-overlay-container");
const inputSearchCity = document.querySelector(".search-city");

btnSearch.addEventListener("click", function () {
  toggleSearchContainerVisibility();
  inputSearchCity.focus();
});

containerSearch.addEventListener("mousedown", function (e) {
  if (e.target !== this) return;
  console.log("Bingo");
  toggleSearchContainerVisibility();
});

inputSearchCity.addEventListener("keypress", function (e) {
  if (e.key !== "Enter") return;
  const cityName = e.target.value;
  getForecastData(cityName);
  getCurrentWeather(cityName);
  this.value = "";
  toggleSearchContainerVisibility();
});

const toggleSearchContainerVisibility = function () {
  containerSearch.classList.toggle("hidden");
};

const getForecastData = async function (cityName) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=b1e36bf120e56cf91d93313f23cbc780`)
    .then((response) => response.json())
    .then((data) => {
      const temperatures = getTemperatures(data);
      const timestamps = getTimestamps(data);
      const timelabels = getTimelabels(data);
      const symbols = getOvercastSymbols(data);
      const rain = getRain(data);
      if (forecast) forecast.destroy();
      createForecastChart(temperatures, timelabels, symbols, rain, timestamps);
    });
};

const getTemperatures = function (data) {
  return data.list.map((entry) => Number((entry.main.temp - 273.15).toFixed(2)));
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
  return data.list.map((entry) => {
    let symbol;

    // using a for loop instead of forEach, so that the loop can be cancelled once the ID has been found
    for (let i = 0; i < ids.length; i++) {
      if (ids[i].includes(entry.weather[0].id)) {
        symbol = ids[i][0];
        break;
      }
    }
    return symbol;
  });
};

const createForecastChart = function (temperatures, timeLabels, overcastSymbols, rain, timeStamps) {
  // let annotationsArray = [];
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
      // const annotationObject = {};
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
            callback: function (value, index, ticks) {
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
          // display: false,
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

const getCurrentWeather = async function (cityName) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=b1e36bf120e56cf91d93313f23cbc780&units=metric`)
    .then((response) => response.json())
    .then((data) => {
      updateUI(data);
      console.log(data);
    })
    .catch((err) => console.log("City does not exist"));
};

const townName = document.querySelector(".location-town");
const stateAndCountry = document.querySelector(".location-state-and-country");
const currentTemp = document.querySelector(".temperature");
const humidity = document.querySelector(".humidity-value");
const wind = document.querySelector(".wind-value");
const currentOvercast = document.querySelector("#current-overcast");

const updateUI = async function (weatherData) {
  console.log(weatherData);
  const { lat, lon } = weatherData.coord;
  // const url = `https://nominatim.openstreetmap.org/reverse.php?lat=${lat}&lon=${lon}&format=jsonv2`;
  const url = `https://nominatim.openstreetmap.org/reverse.php?lat=51.9912263&lon=9.5631186&format=jsonv2`;
  await fetch(url)
    .then((response) => response.json())
    .then((data) => console.log(data));
};

const searchForCityName = function (cityName) {
  fetch(`https://nominatim.openstreetmap.org/search.php?city=${cityName}&format=jsonv2`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    });
};

searchForCityName("Halle");
