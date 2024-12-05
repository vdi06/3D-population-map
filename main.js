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
      const currentYearDisplay = document.getElementById('currentYear'); // Év felirat frissítése

      let animationInterval = null;
      let animationSpeed = 1000;
      let year = 2001;

      // Kamera Magyarország középpontjára pozicionálása
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(19.5033, 47.1625, 1500000) // Magyarország középpontja
      });

      // Véletlenszerű szín generálása a megyék számára
      function getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return new Cesium.Color(r / 255, g / 255, b / 255, 1);
      }

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
          const randomColor = getRandomColor(); // Minden megye más színű

          const cylinderEntity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(entry.Lon, entry.Lat),
            cylinder: {
              length: Math.max(cylinderHeight, 20000),  // Henger magasságának skálázása (biztosan látható)
              topRadius: 10000,
              bottomRadius: 10000,
              material: randomColor, // Minden megye más színű
              outline: true,
              outlineColor: Cesium.Color.BLACK
            },
            properties: {
              name: entry.Megye,
              data: entry,
              color: randomColor // Szín tárolása a színváltozáshoz
            }
          });

          // Populáció statisztikák frissítése
          minPopulation = Math.min(minPopulation, entry[year]);
          maxPopulation = Math.max(maxPopulation, entry[year]);
          totalPopulation += entry[year];
          count++;

          // Szöveg hozzáadása az oszlopokhoz (az oszlop felett)
          const label = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(entry.Lon, entry.Lat, cylinderHeight + 25000), // Az oszlop felett jelenik meg
            label: {
              text: entry[year].toString(),  // Népesség megjelenítése
              font: '16px Helvetica',
              fillColor: Cesium.Color.BLACK, // Szöveg fekete
              backgroundColor: Cesium.Color.WHITE.withAlpha(0.7), // Háttér fehér, átlátszó
              outlineColor: Cesium.Color.BLACK, // Fekete kontúr
              outlineWidth: 3, // Vastag kontúr a jobb láthatóság érdekében
              scale: 2
            }
          });

          // Hover események - a hengereken való mozgás
          viewer.screenSpaceEventHandler.setInputAction(function (movement) {
            const pickedObject = viewer.scene.pick(movement.endPosition);
            if (Cesium.defined(pickedObject) && pickedObject.id === cylinderEntity) {
              label.show = true; // Ha ráviszed az egeret, megjeleníti az adatokat
              pickedObject.id.cylinder.material = Cesium.Color.YELLOW; // Amikor ráviszik, változtassuk a színt sárgára
            } else {
              label.show = false; // Ha elhagyod az egeret, eltünteti az adatokat
              pickedObject.id.cylinder.material = pickedObject.id.color; // Visszaállítjuk az eredeti színt
            }
          }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        });

        // Statikus statisztikák frissítése
        document.getElementById('avgPopulation').textContent = (totalPopulation / count).toFixed(2);
        document.getElementById('minPopulation').textContent = minPopulation;
        document.getElementById('maxPopulation').textContent = maxPopulation;

        // Év frissítése
        currentYearInput.value = year;
        currentYearDisplay.textContent = `Year: ${year}`; // Év frissítése
      }

      // Animáció indítása
      startButton.addEventListener('click', () => {
        if (animationInterval !== null) clearInterval(animationInterval); // Leállítjuk az előző animációt, ha már fut
        animationInterval = setInterval(() => {
          createCylinders(year);
          year++;
          if (year > 2020) {
            clearInterval(animationInterval); // Megállítjuk az animációt, ha elérjük az utolsó évet
          } else {
            currentYearInput.value = year;
            currentYearDisplay.textContent = `Year: ${year}`; // Év frissítése
          }
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
        currentYearDisplay.textContent = `Year: ${year}`; // Év frissítése
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
