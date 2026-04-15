<template>
  <div id="map-container">
    <div id="map"></div>
    
    <!-- Leyenda de Estados -->
    <div class="map-legend status-legend">
      <h4>Estado de Equipos</h4>
      <div class="legend-item"><span class="dot op"></span> Operativo</div>
      <div class="legend-item"><span class="dot sb"></span> Stand By</div>
      <div class="legend-item"><span class="dot in"></span> Inoperativo</div>
    </div>

    <div class="map-controls">
      <h3>Control de Equipos</h3>
      <select v-model="selectedEquipmentId">
        <option :value="null">Seleccionar Equipo</option>
        <option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
          {{ eq.name }}
        </option>
      </select>
      
      <div v-if="selectedEquipmentId" class="status-box">
        <p>Moviendo: <b>{{ selectedEquipmentName }}</b></p>
        <p>Área actual: <b :class="{ highlight: currentAreaName && currentAreaName !== 'Fuera de zona' }">{{ currentAreaName || 'Fuera de zona' }}</b></p>
        <p class="hint">Haz clic en el mapa para posicionar</p>
      </div>

      <div v-if="authStore.isAdmin" class="admin-controls">
        <hr />
        <p class="hint-admin">Pulsa el icono del cuadrado [ ] para crear nuevas zonas de trabajo</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const equipmentList = ref([]);
const dynamicAreas = ref([]);
const selectedEquipmentId = ref(null);
const map = ref(null);
const markers = ref({}); 
const areaLayers = ref({});
const processedPolygons = ref([]);
const isDrawingMode = ref(false);

const emit = defineEmits(['update-list', 'update-areas']);
defineExpose({ loadData: () => loadData() });

const selectedEquipmentName = computed(() => {
  const eq = equipmentList.value.find(e => e.id === selectedEquipmentId.value);
  return eq ? eq.name : '';
});

const currentAreaName = computed(() => {
  const eq = equipmentList.value.find(e => e.id === selectedEquipmentId.value);
  return eq ? eq.currentArea : '';
});

const formatShortName = (name) => {
  if (!name) return '';
  if (name.startsWith('Rodillo #')) return 'R' + name.replace('Rodillo #', '');
  if (name.startsWith('Volquete #')) return 'V' + name.replace('Volquete #', '');
  if (name.startsWith('Retroexcavadora')) return 'Rt' + name.replace('Retroexcavadora', '').trim();
  if (name.startsWith('Motoniveladora')) return 'M' + name.replace('Motoniveladora', '').trim().split(' ')[0];
  if (name.startsWith('Cargador')) return 'C' + name.replace('Cargador', '').trim().split(' ')[0];
  if (name.startsWith('Exc.')) return 'E' + name.replace('Exc.', '').trim().split(' ')[0];
  if (name.startsWith('D')) return name.replace('-', '');
  return name.slice(0, 6);
};

const getProSVG = (name, status) => {
  let mainColor = "#2ed573";
  if (status === 'INOPERATIVO') mainColor = "#ff4757";
  if (status === 'STAND_BY') mainColor = "#ffa502";

  let paths = "";
  if (name.startsWith("D")) {
    paths = `<path d="M4 18h16v2H4z" fill="#333"/><path d="M6 10h10l2 4H4z" fill="${mainColor}"/><path d="M2 14h20v2H2z" fill="${mainColor}"/><path d="M20 10l2 6h-2z" fill="#555"/>`;
  } else if (name.includes("Exc.")) {
    paths = `<path d="M4 18h12v2H4z" fill="#333"/><path d="M4 12h10v6H4z" fill="${mainColor}"/><path d="M12 14l8-8 2 2-6 8z" fill="#555"/><path d="M20 4l3 3-2 2-3-3z" fill="#333"/>`;
  } else if (name.includes("Volquete")) {
    paths = `<circle cx="7" cy="19" r="2" fill="#333"/><circle cx="17" cy="19" r="2" fill="#333"/><path d="M3 14h10v4H3z" fill="${mainColor}"/><path d="M10 8l11 2v6H10z" fill="${mainColor}"/>`;
  } else if (name.includes("Cargador")) {
    paths = `<circle cx="6" cy="18" r="3" fill="#333"/><circle cx="16" cy="18" r="3" fill="#333"/><path d="M5 12h8v4H5z" fill="${mainColor}"/><path d="M13 14l7-4v8z" fill="${mainColor}"/><path d="M20 10l3 6h-3z" fill="#555"/>`;
  } else if (name.includes("Motoniveladora")) {
    paths = `<circle cx="5" cy="19" r="2" fill="#333"/><circle cx="15" cy="19" r="2" fill="#333"/><circle cx="19" cy="19" r="2" fill="#333"/><path d="M4 15h16v2H4z" fill="#555"/><path d="M14 10h5v5h-5z" fill="${mainColor}"/><path d="M8 17l6-2v1z" fill="#333"/>`;
  } else if (name.includes("Rodillo")) {
    paths = `<circle cx="6" cy="16" r="5" fill="#777" stroke="#333"/><circle cx="18" cy="18" r="3" fill="#333"/><path d="M8 12h10v4H8z" fill="${mainColor}"/>`;
  } else {
    paths = `<path d="M12 2L4 20h16L12 2z" fill="${mainColor}"/>`;
  }

  return `
    <div class="pro-icon-wrapper">
      <svg viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5))">
        <rect x="0" y="0" width="24" height="24" rx="4" fill="rgba(255,255,255,0.2)" />
        ${paths}
      </svg>
      <div class="icon-label" style="background: ${mainColor}">${formatShortName(name)}</div>
    </div>
  `;
};

const loadData = async () => {
  try {
    const [eqRes, areaRes] = await Promise.all([
      api.get('/api/v1/equipment'),
      api.get('/api/v1/areas')
    ]);
    equipmentList.value = eqRes.data.sort((a, b) => a.id - b.id);
    dynamicAreas.value = areaRes.data;
    processedPolygons.value = dynamicAreas.value.map(area => {
      try {
        const rawCoords = JSON.parse(area.coordinatesJson);
        return { name: area.name, polygon: turf.polygon([[...rawCoords, rawCoords[0]].map(c => [c[1], c[0]])]) };
      } catch (e) { return null; }
    }).filter(p => p !== null);
    emit('update-list', equipmentList.value);
    emit('update-areas', dynamicAreas.value);
    renderMarkers();
    renderAreas();
  } catch (error) { console.error(error); }
};

const renderMarkers = () => {
  equipmentList.value.forEach(eq => {
    if (eq.latitude && eq.longitude) {
      const customIcon = L.divIcon({
        html: getProSVG(eq.name, eq.status),
        className: 'leaflet-pro-icon',
        iconSize: [36, 46],
        iconAnchor: [18, 40]
      });
      
      const popupContent = `
        <div style="font-family: inherit; color: #333;">
          <b style="font-size: 14px;">${eq.name}</b><br>
          <span style="font-size: 12px;"><b>Estado:</b> ${eq.status}</span><br>
          ${eq.comment ? `<hr style="margin: 5px 0; border: 0; border-top: 1px solid #eee;"><span style="font-size: 11px; color: #666;"><i>${eq.comment}</i></span>` : ''}
        </div>
      `;

      if (markers.value[eq.id]) {
        markers.value[eq.id].setLatLng([eq.latitude, eq.longitude]);
        markers.value[eq.id].setIcon(customIcon);
        markers.value[eq.id].setPopupContent(popupContent);
        // Asegurar que la propiedad draggable esté sincronizada (opcional)
        markers.value[eq.id].dragging.enable();
      } else {
        markers.value[eq.id] = L.marker([eq.latitude, eq.longitude], { 
          icon: customIcon,
          draggable: true // Habilitamos el arrastre
        }).addTo(map.value)
          .bindPopup(popupContent);

        // Escuchar cuando el usuario termina de arrastrar el equipo
        markers.value[eq.id].on('dragend', async (event) => {
          const marker = event.target;
          const position = marker.getLatLng();
          
          // Calculamos automáticamente si cayó en una zona nueva
          const area = checkAreaForPoint(position.lat, position.lng);
          
          try {
            await api.put(`/api/v1/equipment/${eq.id}/location`, 
              { 
                latitude: position.lat, 
                longitude: position.lng, 
                currentArea: area 
              },
              { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            
            // Recargamos datos para que las tablas y resúmenes se actualicen
            loadData();
          } catch (error) {
            console.error("Error al actualizar ubicación por arrastre:", error);
            // Si hay error (ej. conexión), devolvemos el marcador a su posición real
            loadData(); 
          }
        });
      }
    }
  });
};

const renderAreas = () => {
  Object.values(areaLayers.value).forEach(l => map.value.removeLayer(l));
  areaLayers.value = {};
  dynamicAreas.value.forEach(area => {
    try {
      const polygon = L.polygon(JSON.parse(area.coordinatesJson), {
        color: '#aa3bff', fillOpacity: 0.2, weight: 2
      }).addTo(map.value);
      polygon.bindTooltip(area.name, { permanent: false });
      areaLayers.value[area.id] = polygon;
    } catch (e) {}
  });
};

const checkAreaForPoint = (lat, lng) => {
  const pt = turf.point([lng, lat]);
  for (const item of processedPolygons.value) {
    if (turf.booleanPointInPolygon(pt, item.polygon)) return item.name;
  }
  return 'Fuera de zona';
};

onMounted(() => {
  map.value = L.map('map', { zoomSnap: 0.5 }).setView([-17.459974, -70.801105], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map.value);

  if (authStore.isAdmin) {
    const drawnItems = new L.FeatureGroup();
    map.value.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
      draw: { polygon: { allowIntersection: false, shapeOptions: { color: '#aa3bff' } }, rectangle: { shapeOptions: { color: '#aa3bff' } }, polyline: false, circle: false, marker: false, circlemarker: false },
      edit: { featureGroup: drawnItems, remove: false }
    });
    map.value.addControl(drawControl);
    map.value.on(L.Draw.Event.DRAWSTART, () => { isDrawingMode.value = true; });
    map.value.on(L.Draw.Event.CREATED, async (e) => {
      isDrawingMode.value = false;
      const latlngs = e.layer.getLatLngs()[0];
      const coords = latlngs.map(ll => [ll.lat, ll.lng]);
      const name = prompt("Nombre de la nueva área:");
      if (name) {
        await api.post('/api/v1/areas', { name, coordinatesJson: JSON.stringify(coords) }, 
          { headers: { Authorization: `Bearer ${authStore.token}` } });
        loadData();
      }
    });
  }

  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map.value);

  map.value.on('click', async (e) => {
    if (selectedEquipmentId.value && !isDrawingMode.value) {
      const area = checkAreaForPoint(e.latlng.lat, e.latlng.lng);
      try {
        await api.put(`/api/v1/equipment/${selectedEquipmentId.value}/location`, 
          { latitude: e.latlng.lat, longitude: e.latlng.lng, currentArea: area },
          { headers: { Authorization: `Bearer ${authStore.token}` } });
        loadData();
      } catch (error) {}
    }
  });
  loadData();
});
</script>

<style scoped>
#map-container { position: relative; height: 100%; width: 100%; }
#map { height: 75vh; width: 100%; border-radius: 12px; min-height: 500px; }
.map-controls {
  position: absolute; top: 10px; right: 10px; z-index: 1000;
  background: rgba(30, 30, 30, 0.95); padding: 12px; border-radius: 8px;
  color: white; width: 220px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid #444;
}
.map-legend {
  position: absolute; bottom: 20px; right: 10px; z-index: 1000;
  background: rgba(30, 30, 30, 0.9); padding: 10px; border-radius: 8px;
  color: white; font-size: 12px; border: 1px solid #444; pointer-events: none;
}
.legend-item { display: flex; align-items: center; margin-bottom: 4px; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.op { background: #2ed573; }
.sb { background: #ffa502; }
.in { background: #ff4757; }

:deep(.leaflet-pro-icon) { background: none; border: none; }
:deep(.pro-icon-wrapper) { display: flex; flex-direction: column; align-items: center; }
:deep(.icon-label) {
  font-size: 9px; font-weight: bold; color: #000; padding: 1px 4px; border-radius: 3px;
  margin-top: -5px; white-space: nowrap; border: 1px solid rgba(0,0,0,0.3);
}
.status-box { margin-top: 12px; padding: 12px; background: #222; border-radius: 8px; font-size: 13px; border: 1px solid #444; }
.edit-mini-form { display: flex; flex-direction: column; gap: 8px; margin: 10px 0; padding-top: 10px; border-top: 1px solid #444; }
.mini-input { width: 100%; background: #333; border: 1px solid #555; color: white; border-radius: 4px; padding: 5px; font-size: 12px; }
.mini-textarea { height: 40px; resize: none; font-family: inherit; }
.btn-save-mini { background: #6366f1; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px; }
.btn-save-mini:hover { background: #4f46e5; }
.btn-save-mini:disabled { opacity: 0.5; cursor: not-allowed; }
.highlight { color: #2ed573; font-weight: bold; }
.hint, .hint-admin { font-size: 11px; color: #aaa; margin-top: 5px; }
select { width: 100%; padding: 8px; background: #444; color: white; border: 1px solid #666; border-radius: 4px; }
</style>
ld; }
.hint, .hint-admin { font-size: 11px; color: #aaa; margin-top: 5px; }
select { width: 100%; padding: 8px; background: #444; color: white; border: 1px solid #666; border-radius: 4px; }
</style>
