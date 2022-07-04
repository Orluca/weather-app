Chart.defaults.font.family = "sans-serif, 'FontAwesome'";

const temperatures = [16.29, 14, 11.27, 16.51, 22.48, 25.49, 26.79, 24.61, 18.72, 15.82, 14.61, 20.42, 27.41, 30.61, 30.95, 28.03, 20.59, 17.91, 14.7, 19, 23.32, 25.01, 28.61, 25.23, 17.75, 13.71, 11.83, 16.64, 20.79, 24.21, 25.88, 23.58, 16.31, 12.94, 11.29, 16.37, 21.51, 25.69, 26.44, 22.15];
const times = ["17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00", "02:00", "05:00", "08:00", "11:00", "14:00"];
const overcasts = ["\uf76c", "☀", "☁", "🌧", "☁", "☀", "☁", "🌧", "🌧", "☁", "☀", "☁", "☀", "☁", "☁", "☁", "☁", "☁", "☀", "☁", "☁", "☁", "☀", "🌦", "☁", "🌧", "☁", "🌧", "🌧", "🌧", "☁", "☁", "🌧", "🌧", "☁", "☁", "☁", "☁", "☁", "☁"];
const rain = [0, 0, 0, 0, 0, 0.25, 0.54, 0.32, 0, 0, 0, 0, 0, 0.23, 0, 0, 0, 0.17, 1.2, 0.6, 0.15, 1, 0.73, 0.11, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0.16, 0, 0.1, 0, 0, 0.16, 0.3];
// Chart.register.ChartDataLabels;
Chart.register(ChartDataLabels);

const ctx = document.getElementById("myChart").getContext("2d");
const myChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: times,
    datasets: [
      {
        type: "line",
        label: "Temperatures",
        data: temperatures,
        borderWidth: 1,
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
        },
      },
      rainAxis: {
        position: "right",
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        suggestedMax: 10,
      },
      x: {
        display: true,
        ticks: {
          callback: function (value, index, ticks) {
            return times[value];
          },
          font: {
            size: "10vw",
            padding: 0,
          },
        },
      },
      x2: {
        type: "category",
        position: "top",
        ticks: {
          callback: function (value, index, ticks) {
            return overcasts[value];
          },
          font: {
            size: "15vw",
            padding: 0,
          },
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
        annotations: {
          day1: {
            type: "line",
            xMin: 7 / 3,
            xMax: 7 / 3,
            label: {
              enabled: true,
              content: "Monday",
              font: {
                size: "10vw",
              },
              xAdjust: 25,
              yAdjust: -5,
              position: "start",
              padding: {
                top: 3,
                bottom: 3,
                left: 6,
                right: 6,
              },
            },
          },
          day2: {
            type: "line",
            xMin: 7 / 3 + 8,
            xMax: 7 / 3 + 8,
            label: {
              enabled: true,
              content: "Tuesday",
              font: {
                size: "10vw",
              },
              xAdjust: 25,
              yAdjust: -5,
              position: "start",
              padding: 5,
            },
          },
          day3: {
            type: "line",
            xMin: 7 / 3 + 16,
            xMax: 7 / 3 + 16,
            label: {
              enabled: true,
              content: "Wednesday",
              font: {
                size: "10vw",
              },
              xAdjust: 25,
              yAdjust: -5,
              position: "start",
              padding: 5,
            },
          },
          day4: {
            type: "line",
            xMin: 7 / 3 + 24,
            xMax: 7 / 3 + 24,
            label: {
              enabled: true,
              content: "Thursday",
              font: {
                size: "10vw",
              },
              xAdjust: 25,
              yAdjust: -5,
              position: "start",
              padding: 5,
            },
          },
          day5: {
            type: "line",
            xMin: 7 / 3 + 32,
            xMax: 7 / 3 + 32,
            label: {
              enabled: true,
              content: "Friday",
              font: {
                size: "10vw",
              },
              xAdjust: 25,
              yAdjust: -5,
              position: "start",
              padding: 5,
            },
          },
        },
      },
      datalabels: {
        color: "white",
        formatter: function (value, context) {
          return context.dataset.type === "line" ? Math.round(value) : ""; // Datalabels should only be displayed for the temperature chart, not for the rain bars
        },
      },
    },
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.4,
  },
});

// MAP STUFF

// const map = L.map("map").setView([51.505, -0.09], 13);
// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   maxZoom: 19,
//   attribution: "© OpenStreetMap",
// }).addTo(map);
// L.tileLayer("https://tile.openweathermap.org/map/precipitation_new/13/{x}/{y}.png?appid=b1e36bf120e56cf91d93313f23cbc780", {
//   maxZoom: 19,
//   attribution: "© OpenStreetMap",
// }).addTo(map);
