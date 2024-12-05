document.addEventListener("DOMContentLoaded", function () {
  fetch('cleaned_population_data.json') // Betöltjük a népességi adatokat
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

      const startButton = document.getElementById('startButton');
      const stopButton = document.getElementById('stopButton');
      const speedRange = document.getElementById('speedRange');
      const zoomInButton = document.getElementById('zoomIn');
      const zoomOutButton = document.getElementById('zoomOut');
      const resetViewButton = document.getElementById('resetView');
      const currentYearInput = document.getElementById('manualYear');

      let animationInterval = null;
      let animationSpeed = 1000;

      // Kamera Magyarország középpontjára pozicionálása
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(19.5033, 47.1625, 1500000) // Magyarország középpontja
      });

      // Henger létrehozása a népességi adatok alapján
      function createCylinders(year) {
        viewer.entities.removeAll(); // Az összes entitást eltávolítjuk

        let minPopulation = Infinity;
        let maxPopulation = -Infinity;
        let totalPopulation = 0;
        let count = 0;

        // Az összes megye oszlopának létrehozása
        data.forEach(entry => {
          const cylinderHeight = (entry[year] - 500000) / 1000; // Henger magasság számítása

          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(entry.Lon, entry.Lat),
            cylinder: {
              length: Math.max(cylinderHeight, 10000),  // A henger magasságának skálázása
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

          // Populáció statisztikák frissítése
          minPopulation = Math.min(minPopulation, entry[year]);
          maxPopulation = Math.max(maxPopulation, entry[year]);
          totalPopulation += entry[year];
          count++;
        });

        // Statikus statisztikák frissítése
        document.getElementById('avgPopulation').textContent = (totalPopulation / count).toFixed(2);
        document.getElementById('minPopulation').textContent = minPopulation;
        document.getElementById('maxPopulation').textContent = maxPopulation;

        // Év frissítése
        currentYearInput.value = year;
      }

      // Animáció indítása
      startButton.addEventListener('click', () => {
        let year = parseInt(currentYearInput.value);
        animationInterval = setInterval(() => {
          createCylinders(year);
          year++;
          if (year > 2020) year = 2001; // Ha elérjük az utolsó évet, kezdjük elölről
          currentYearInput.value = year;
        }, animationSpeed);
      });

      // Animáció leállítása
      stopButton.addEventListener('click', () => {
        clearInterval(animationInterval);
      });

      // Sebesség változtatása
      speedRange.addEventListener('input', () => {
        animationSpeed = parseInt(speedRange.value);
        if (animationInterval) {
          clearInterval(animationInterval);
          startButton.click();
        }
      });

      // Év kézi beállítása
      currentYearInput.addEventListener('change', () => {
        const year = parseInt(currentYearInput.value);
        createCylinders(year);
      });

      // Zoom gombok
      zoomInButton.addEventListener('click', () => {
        viewer.camera.zoomIn();
      });

      zoomOutButton.addEventListener('click', () => {
        viewer.camera.zoomOut();
      });

      resetViewButton.addEventListener('click', () => {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(19.5033, 47.1625, 1500000) // Magyarország középpontjára való visszaállás
        });
      });

      // Kezdeti henger létrehozás (2001-es év)
      createCylinders(2001);
    });
});
