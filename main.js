fetch('cleaned_population_data.json')
  .then(response => response.json())
  .then(data => {
    const viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider: new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        credit: 'Map data © OpenStreetMap contributors',
        subdomains: ['a', 'b', 'c']
      }),
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      baseLayerPicker: false
    });

    const currentYearInput = document.getElementById('manualYear');
    const modalDataBody = document.getElementById('modalDataBody');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const speedRange = document.getElementById('speedRange');
    const zoomInButton = document.getElementById('zoomIn');
    const zoomOutButton = document.getElementById('zoomOut');
    const resetViewButton = document.getElementById('resetView');
    const countySelect = document.getElementById('countySelect');

    let animationInterval = null;
    let animationSpeed = 1000;

    // Kamera Magyarország fölé pozicionálása
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(19.5033, 47.1625, 1500000)
    });

    // Megyék listájának betöltése a legördülő menübe
    data.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.Megye;
      option.textContent = entry.Megye;
      countySelect.appendChild(option);
    });

    // Henger létrehozása a népességi adatok alapján
    function createCylinders(year) {
      viewer.entities.removeAll();
      data.forEach(entry => {
        const cylinderHeight = (entry[year] - 500000) / 1000;

        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(entry.Lon, entry.Lat),
          cylinder: {
            length: cylinderHeight,
            topRadius: 10000,
            bottomRadius: 10000,
            material: Cesium.Color.BLUE.withAlpha(0.8),
            outline: true,
            outlineColor: Cesium.Color.BLACK
          },
          properties: {
            name: entry.Megye,
            data: entry
          }
        });
      });

      currentYearInput.value = year;
    }

    startButton.addEventListener('click', () => {
      let year = parseInt(currentYearInput.value);
      animationInterval = setInterval(() => {
        createCylinders(year);
        year++;
        if (year > 2020) year = 2001;
        currentYearInput.value = year;
      }, animationSpeed);
    });

    stopButton.addEventListener('click', () => {
      clearInterval(animationInterval);
    });

    speedRange.addEventListener('input', () => {
      animationSpeed = parseInt(speedRange.value);
      if (animationInterval) {
        clearInterval(animationInterval);
        startButton.click();
      }
    });

    currentYearInput.addEventListener('change', () => {
      const year = parseInt(currentYearInput.value);
      createCylinders(year);
    });

    zoomInButton.addEventListener('click', () => {
      viewer.camera.zoomIn();
    });

    zoomOutButton.addEventListener('click', () => {
      viewer.camera.zoomOut();
    });

    resetViewButton.addEventListener('click', () => {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(19.5033, 47.1625, 1500000)
      });
    });

    countySelect.addEventListener('change', (e) => {
      const selectedCounty = e.target.value;
      viewer.entities.removeAll();

      if (selectedCounty === 'all') {
        createCylinders(parseInt(currentYearInput.value));
      } else {
        const selectedData = data.find(entry => entry.Megye === selectedCounty);
        if (selectedData) {
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(selectedData.Lon, selectedData.Lat),
            cylinder: {
              length: (selectedData[parseInt(currentYearInput.value)] - 500000) / 1000,
              topRadius: 10000,
              bottomRadius: 10000,
              material: Cesium.Color.RED.withAlpha(0.8),
              outline: true,
              outlineColor: Cesium.Color.BLACK
            },
            properties: {
              name: selectedData.Megye,
              data: selectedData
            }
          });
        }
      }
    });

    createCylinders(2001);
  });
