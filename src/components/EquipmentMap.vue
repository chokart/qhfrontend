<template>
  <div class="equipment-map-wrapper">
    <!-- Panel de Control y Filtros Superior (Fuera del Mapa) -->
    <div class="filter-toolbar-card">
      <div class="toolbar-header">
        <div class="toolbar-title">
          <span class="title-icon">🎯</span>
          <div>
            <h3>Filtros y Control de Equipos</h3>
            <span class="counter-badge">
              Mostrando <b>{{ filteredEquipment.length }}</b> de {{ equipmentList.length }} equipos
            </span>
          </div>
        </div>

        <div class="toolbar-actions">
          <button class="btn-create-header" @click="openCreateModal" title="Registrar un nuevo equipo">
            ➕ Crear Equipo
          </button>

          <!-- Selector de Modo Mapa / Lista -->
          <div class="mode-switch-group">
            <button 
              :class="['btn-mode-switch', { active: viewMode === 'MAP' }]" 
              @click="setViewMode('MAP')"
            >
              🗺️ Modo Mapa
            </button>
            <button 
              :class="['btn-mode-switch', { active: viewMode === 'LIST' }]" 
              @click="setViewMode('LIST')"
            >
              📋 Modo Lista
            </button>
          </div>

          <button 
            v-if="viewMode === 'MAP'"
            class="btn-toggle-drag" 
            :class="{ 'active': isMoveMode }"
            @click="isMoveMode = !isMoveMode"
            :title="isMoveMode ? 'Bloquear movimiento en el mapa' : 'Habilitar arrastre de equipos en el mapa'"
          >
            {{ isMoveMode ? '🔓 Arrastre Activado' : '🔒 Habilitar Arrastre' }}
          </button>
          <button 
            class="btn-toggle-all" 
            @click="toggleAllCategories"
          >
            {{ isAllSelected ? '❌ Limpiar Tipos' : '✅ Todos los Tipos' }}
          </button>
        </div>
      </div>

      <!-- Fila de Controles (Búsqueda, Estado, Ubicador) -->
      <div class="toolbar-body">
        <!-- 1. Búsqueda por Texto -->
        <div class="filter-group search-group">
          <label class="filter-label">Buscar equipo:</label>
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Nombre, código o nota..." 
              class="search-input"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">✕</button>
          </div>
        </div>

        <!-- 2. Filtro por Estado Operativo -->
        <div class="filter-group status-group">
          <label class="filter-label">Estado de operación:</label>
          <select v-model="statusFilter" class="select-input">
            <option value="ALL">Todos los estados</option>
            <option value="OPERATIVO">🟢 Operativo</option>
            <option value="STAND_BY">🟡 Stand By</option>
            <option value="INOPERATIVO">🔴 Inoperativo</option>
          </select>
        </div>

        <!-- 3. Selección y Ubicación de Equipo Específico -->
        <div class="filter-group locate-group">
          <label class="filter-label">Enfocar en Mapa:</label>
          <select v-model="selectedEquipmentId" class="select-input highlight-select">
            <option :value="null">-- Seleccionar Equipo --</option>
            <option v-for="eq in filteredEquipment" :key="eq.id" :value="eq.id">
              {{ eq.shortCode ? eq.shortCode + ' - ' : '' }}{{ eq.name }} ({{ eq.status }})
            </option>
          </select>
        </div>
      </div>

      <!-- Chips de Categorías / Tipos de Equipos -->
      <div class="categories-bar">
        <span class="categories-label">Tipos:</span>
        <div class="chips-list">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            :class="['category-chip', { active: selectedFilters.includes(cat.id) }]"
            @click="toggleFilter(cat.id)"
          >
            <span class="chip-color-dot" :style="{ backgroundColor: cat.color }"></span>
            <span class="chip-name">{{ cat.label }}</span>
            <span class="chip-count">{{ getCategoryCount(cat.id) }}</span>
          </button>
        </div>
      </div>

      <!-- Formulario Flotante/Edición del Equipo Seleccionado -->
      <transition name="expand">
        <div v-if="selectedEquipmentId" class="selected-equipment-panel">
          <div class="selected-header">
            <div class="eq-info">
              <span class="eq-title"><b>{{ selectedEquipmentName }}</b></span>
              <span class="area-badge" :class="{ 'in-area': currentAreaName && currentAreaName !== 'Fuera de zona' }">
                📍 {{ currentAreaName || 'Fuera de zona' }}
              </span>
            </div>
            <button @click="selectedEquipmentId = null" class="btn-close-panel">✕ Cerrar</button>
          </div>

          <div class="selected-actions-form">
            <div class="form-item">
              <label>Nuevo Estado:</label>
              <select v-model="editStatus" class="mini-select">
                <option value="OPERATIVO">🟢 OPERATIVO</option>
                <option value="STAND_BY">🟡 STAND_BY</option>
                <option value="INOPERATIVO">🔴 INOPERATIVO</option>
              </select>
            </div>

            <div class="form-item comment-item">
              <label>Observaciones:</label>
              <input type="text" v-model="editComment" placeholder="Comentarios / notas..." class="mini-text-input" />
            </div>

            <button @click="saveStatus" :disabled="isSaving" class="btn-update-status">
              {{ isSaving ? 'Guardando...' : '💾 Actualizar Estado' }}
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Contenedor del Mapa (Modo Mapa) -->
    <div v-show="viewMode === 'MAP'" id="map-container">
      <div id="map"></div>
      
      <!-- Leyenda de Estados en Esquina Inferior -->
      <div class="map-legend status-legend">
        <h4>Estado de Equipos</h4>
        <div class="legend-item"><span class="dot op"></span> Operativo</div>
        <div class="legend-item"><span class="dot sb"></span> Stand By</div>
        <div class="legend-item"><span class="dot in"></span> Inoperativo</div>
      </div>

      <!-- Botón de Candado / Habilitar Arrastre Flotante Superior -->
      <button 
        @click="isMoveMode = !isMoveMode" 
        class="fab-lock" 
        :class="{ 'unlocked': isMoveMode }"
        :title="isMoveMode ? 'Bloquear movimiento en el mapa' : 'Habilitar arrastre de equipos en el mapa'"
      >
        <span>{{ isMoveMode ? '🔓 Arrastre Activado' : '🔒 Habilitar Arrastre' }}</span>
      </button>
    </div>

    <!-- Contenedor de la Lista (Modo Lista) -->
    <div v-if="viewMode === 'LIST'" class="list-mode-container">
      <EquipmentList 
        :equipment="filteredEquipment" 
        @update-required="loadData"
        @open-create-modal="openCreateModal"
      />
    </div>

    <!-- Modal Crear Nuevo Equipo -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>➕ Registrar Nuevo Equipo</h3>
          <button class="btn-close" @click="closeCreateModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nombre / Código Equipo *:</label>
              <input type="text" v-model="createForm.name" class="form-input-text" placeholder="Ej. Cisterna #01, D85-1" />
            </div>

            <div class="form-group">
              <label class="form-label">Resumen / Iniciales:</label>
              <input type="text" v-model="createForm.shortCode" class="form-input-text" placeholder="Ej. CIS-01, D8-01" />
            </div>

            <div class="form-group">
              <label class="form-label">Tipo de Equipo:</label>
              <select v-model="createForm.equipmentType" class="form-select">
                <option value="TRACTOR">Tractor de Oruga</option>
                <option value="EXCAVADORA">Excavadora</option>
                <option value="CISTERNA">Camión Cisterna</option>
                <option value="TRACTO">Tractocamión / Tracto</option>
                <option value="CAMION_GRUA">Camión Grúa / Pluma</option>
                <option value="CAMABAJA">Camabaja / Lowboy</option>
                <option value="MOTONIVELADORA">Motoniveladora</option>
                <option value="VOLQUETE">Volquete</option>
                <option value="RODILLO">Rodillo Compactador</option>
                <option value="CARGADOR">Cargador Frontal</option>
                <option value="HIDROCICLON">Hidrociclón / Nido</option>
                <option value="OTROS">Otros Equipos</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Placa:</label>
              <input type="text" v-model="createForm.plate" class="form-input-text" placeholder="Ej. ABC-123" />
            </div>

            <div class="form-group">
              <label class="form-label">Código SPCC:</label>
              <input type="text" v-model="createForm.spccCode" class="form-input-text" placeholder="Ej. SPCC-9012" />
            </div>

            <div class="form-group">
              <label class="form-label">Estado Inicial:</label>
              <select v-model="createForm.status" class="form-select">
                <option value="OPERATIVO">🟢 OPERATIVO</option>
                <option value="STAND_BY">🟡 STAND_BY</option>
                <option value="INOPERATIVO">🔴 INOPERATIVO</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width" style="margin-top: 1rem;">
            <label class="form-label">Descripción Detallada:</label>
            <input type="text" v-model="createForm.description" class="form-input-text" placeholder="Ej. Camión Cisterna 5000 GAL para regado de acceso en dique" />
          </div>

          <div class="form-group full-width" style="margin-top: 0.75rem;">
            <label class="form-label">Observaciones / Comentarios:</label>
            <input type="text" v-model="createForm.comment" class="form-input-text" placeholder="Comentarios iniciales..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel-modal" @click="closeCreateModal">Cancelar</button>
          <button class="btn-save-modal" :disabled="creating" @click="saveNewEquipment">
            <span v-if="creating">Creando...</span>
            <span v-else>💾 Registrar Equipo</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import EquipmentList from './EquipmentList.vue';

const authStore = useAuthStore();
const equipmentList = ref([]);
const dynamicAreas = ref([]);
const selectedEquipmentId = ref(null);
const map = ref(null);
const markers = ref({}); 
const areaLayers = ref({});
const processedPolygons = ref([]);
const isDrawingMode = ref(false);
const isMoveMode = ref(false);
const viewMode = ref('MAP'); // 'MAP' | 'LIST'

const setViewMode = (mode) => {
  viewMode.value = mode;
  if (mode === 'MAP') {
    setTimeout(() => {
      if (map.value) {
        map.value.invalidateSize();
      }
    }, 150);
  }
};

const isSaving = ref(false);
const editStatus = ref('');
const editComment = ref('');

// Estado de Filtros
const searchQuery = ref('');
const statusFilter = ref('ALL');
const selectedFilters = ref(['TRACTOR', 'EXCAVADORA']);

// Estados para Modal Crear Nuevo Equipo
const showCreateModal = ref(false);
const creating = ref(false);
const createForm = reactive({
  name: '',
  shortCode: '',
  description: '',
  plate: '',
  spccCode: '',
  equipmentType: 'TRACTOR',
  status: 'OPERATIVO',
  comment: '',
  latitude: -17.2750,
  longitude: -70.9200
});

const openCreateModal = () => {
  let defaultLat = -17.459974;
  let defaultLng = -70.801105;
  if (map.value) {
    const center = map.value.getCenter();
    defaultLat = center.lat;
    defaultLng = center.lng;
  }

  createForm.name = '';
  createForm.shortCode = '';
  createForm.description = '';
  createForm.plate = '';
  createForm.spccCode = '';
  createForm.equipmentType = 'TRACTOR';
  createForm.status = 'OPERATIVO';
  createForm.comment = '';
  createForm.latitude = defaultLat;
  createForm.longitude = defaultLng;
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const saveNewEquipment = async () => {
  if (!createForm.name.trim()) {
    alert("Por favor ingresa un nombre o código para el equipo.");
    return;
  }

  creating.value = true;
  try {
    const response = await api.post('/api/v1/equipment', createForm);
    const newEq = response.data;
    closeCreateModal();
    await loadData();
    if (newEq && newEq.id) {
      selectedEquipmentId.value = newEq.id;
      if (newEq.latitude && newEq.longitude && map.value) {
        map.value.setView([newEq.latitude, newEq.longitude], 16, { animate: true });
        setTimeout(() => {
          if (markers.value[newEq.id]) {
            markers.value[newEq.id].openPopup();
          }
        }, 300);
      }
    }
  } catch (error) {
    console.error("Error al registrar nuevo equipo:", error);
    alert("Ocurrió un error al registrar el nuevo equipo.");
  } finally {
    creating.value = false;
  }
};

const categories = [
  { id: 'TRACTOR', label: 'Tractores', short: 'Trac', color: '#ff4757' },
  { id: 'EXCAVADORA', label: 'Excavadoras', short: 'Exc', color: '#ffa502' },
  { id: 'CISTERNA', label: 'Cisternas', short: 'Cist', color: '#0984e3' },
  { id: 'TRACTO', label: 'Tractos', short: 'Tracto', color: '#d63031' },
  { id: 'CAMION_GRUA', label: 'Camión Grúa', short: 'Grúa', color: '#e17055' },
  { id: 'CAMABAJA', label: 'Camabaja', short: 'Cama', color: '#27ae60' },
  { id: 'MOTONIVELADORA', label: 'Motoniveladoras', short: 'Moto', color: '#fdcb6e' },
  { id: 'VOLQUETE', label: 'Volquetes', short: 'Volq', color: '#1e272e' },
  { id: 'RODILLO', label: 'Rodillos', short: 'Rod', color: '#747d8c' },
  { id: 'CARGADOR', label: 'Cargadores', short: 'Carg', color: '#e17055' },
  { id: 'HIDROCICLON', label: 'Hidrociclones', short: 'Hidro', color: '#00cec9' },
  { id: 'OTROS', label: 'Otros', short: 'Otro', color: '#6c5ce7' }
];

const getCategory = (eqOrName) => {
  if (!eqOrName) return 'OTROS';
  const name = typeof eqOrName === 'string' ? eqOrName : (eqOrName.name || '');
  const type = typeof eqOrName === 'object' ? eqOrName.equipmentType : null;

  if (type && categories.some(c => c.id === type)) {
    return type;
  }

  const lower = name.toLowerCase();
  if (name.startsWith('BATERIA') || name.startsWith('NIDO')) return 'HIDROCICLON';
  if (name.startsWith('D8') || name.startsWith('D9') || name.startsWith('D10') || lower.includes('tractor')) return 'TRACTOR';
  if (name.includes('Exc.') || lower.includes('excavadora')) return 'EXCAVADORA';
  if (lower.includes('cisterna') || lower.includes('agua')) return 'CISTERNA';
  if (lower.includes('tracto')) return 'TRACTO';
  if (lower.includes('grúa') || lower.includes('grua')) return 'CAMION_GRUA';
  if (lower.includes('camabaja')) return 'CAMABAJA';
  if (lower.includes('cargador')) return 'CARGADOR';
  if (lower.includes('volquete')) return 'VOLQUETE';
  if (lower.includes('rodillo')) return 'RODILLO';
  if (lower.includes('motoniveladora')) return 'MOTONIVELADORA';
  return 'OTROS';
};

const getCategoryCount = (catId) => {
  return equipmentList.value.filter(eq => getCategory(eq) === catId).length;
};

const isAllSelected = computed(() => {
  return categories.every(cat => selectedFilters.value.includes(cat.id));
});

const toggleAllCategories = () => {
  if (isAllSelected.value) {
    selectedFilters.value = [];
  } else {
    selectedFilters.value = categories.map(cat => cat.id);
  }
};

const toggleFilter = (id) => {
  const index = selectedFilters.value.indexOf(id);
  if (index > -1) selectedFilters.value.splice(index, 1);
  else selectedFilters.value.push(id);
};

const filteredEquipment = computed(() => {
  return equipmentList.value.filter(eq => {
    // 1. Filtro por Tipo / Categoría
    const cat = getCategory(eq);
    const matchesCategory = selectedFilters.value.length === 0 || selectedFilters.value.includes(cat);

    // 2. Filtro por Estado
    const matchesStatus = statusFilter.value === 'ALL' || eq.status === statusFilter.value;

    // 3. Filtro por Búsqueda de Texto
    const query = searchQuery.value.trim().toLowerCase();
    const matchesSearch = !query || 
      eq.name.toLowerCase().includes(query) || 
      (eq.shortCode && eq.shortCode.toLowerCase().includes(query)) ||
      (eq.description && eq.description.toLowerCase().includes(query)) ||
      (eq.plate && eq.plate.toLowerCase().includes(query)) ||
      (eq.spccCode && eq.spccCode.toLowerCase().includes(query)) ||
      (eq.comment && eq.comment.toLowerCase().includes(query));

    return matchesCategory && matchesStatus && matchesSearch;
  });
});

// Reactividad de Renderizado de Marcadores
watch([filteredEquipment, selectedFilters, statusFilter, searchQuery], () => {
  renderMarkers();
});

const syncEditForm = (id) => {
  const eq = equipmentList.value.find(e => e.id === id);
  if (eq) {
    editStatus.value = eq.status;
    editComment.value = eq.comment || '';
  }
};

watch(selectedEquipmentId, (newId) => {
  if (newId) {
    syncEditForm(newId);
    const eq = equipmentList.value.find(e => e.id === newId);
    if (eq && eq.latitude && eq.longitude && map.value) {
      map.value.setView([eq.latitude, eq.longitude], 16, { animate: true });
      if (markers.value[newId]) {
        markers.value[newId].openPopup();
      }
    }
  }
});

watch(isMoveMode, (enabled) => {
  Object.values(markers.value).forEach(marker => {
    if (enabled) marker.dragging.enable();
    else marker.dragging.disable();
  });
});

const saveStatus = async () => {
  if (!selectedEquipmentId.value) return;
  isSaving.value = true;
  try {
    await api.put(`/api/v1/equipment/${selectedEquipmentId.value}/status`, {
      status: editStatus.value,
      comment: editComment.value
    });
    await loadData();
    syncEditForm(selectedEquipmentId.value);
  } catch (error) {
    alert("Error al actualizar estado");
  } finally {
    isSaving.value = false;
  }
};

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

const formatShortName = (eqOrName) => {
  if (!eqOrName) return '';
  if (typeof eqOrName === 'object' && eqOrName.shortCode && eqOrName.shortCode.trim()) {
    return eqOrName.shortCode.trim();
  }

  const name = typeof eqOrName === 'string' ? eqOrName : (eqOrName.name || '');
  const n = name.trim();
  if (n.startsWith('BATERIA')) return 'B' + n.replace('BATERIA', '').trim();
  if (n.startsWith('NIDO')) return 'N' + n.replace('NIDO', '').trim();
  if (n.startsWith('Rodillo #')) return 'R' + n.replace('Rodillo #', '').trim();
  if (n.startsWith('Volquete #')) return 'V' + n.replace('Volquete #', '').trim();
  if (n.toLowerCase().startsWith('cisterna')) return 'CIS' + n.replace(/cisterna/gi, '').replace('#', '').trim();
  if (n.toLowerCase().startsWith('tracto')) return 'TR' + n.replace(/tracto/gi, '').replace('#', '').trim();
  if (n.toLowerCase().startsWith('retroexcavadora')) return 'RT' + n.replace(/retroexcavadora/gi, '').trim();
  if (n.toLowerCase().startsWith('motoniveladora')) return 'MN' + n.replace(/motoniveladora/gi, '').trim();
  if (n.toLowerCase().startsWith('cargador')) return 'CF' + n.replace(/cargador/gi, '').trim();
  if (n.toLowerCase().startsWith('exc.')) return 'EXC-' + n.replace('Exc.', '').trim();
  return n;
};

const getProSVG = (eqOrName, status) => {
  let mainColor = "#2ed573";
  if (status === 'INOPERATIVO') mainColor = "#ff4757";
  if (status === 'STAND_BY') mainColor = "#ffa502";

  const cat = getCategory(eqOrName);
  const name = typeof eqOrName === 'string' ? eqOrName : (eqOrName.name || '');

  let paths = "";
  if (cat === 'HIDROCICLON') {
    paths = `
      <path d="M7 5h10l-3 12h-4z" fill="${mainColor}"/>
      <path d="M10 17h4v4h-4z" fill="#555"/>
      <path d="M8 3h8v2H8z" fill="#555"/>
      <path d="M4 7h4v2H4z" fill="#333"/>
      <circle cx="12" cy="11" r="2" fill="rgba(255,255,255,0.3)"/>
    `;
  } else if (cat === 'CISTERNA') {
    paths = `
      <circle cx="6" cy="19" r="2" fill="#333"/>
      <circle cx="17" cy="19" r="2" fill="#333"/>
      <rect x="2" y="10" width="6" height="7" rx="1" fill="#555"/>
      <rect x="7" y="9" width="14" height="8" rx="4" fill="${mainColor}"/>
      <path d="M10 6h8v3h-8z" fill="#00cec9"/>
    `;
  } else if (cat === 'TRACTO') {
    paths = `
      <circle cx="6" cy="19" r="2.5" fill="#333"/>
      <circle cx="14" cy="19" r="2.5" fill="#333"/>
      <circle cx="18" cy="19" r="2.5" fill="#333"/>
      <path d="M3 10h8v7H3z" fill="${mainColor}"/>
      <path d="M11 13h10v4H11z" fill="#555"/>
      <path d="M4 11h4v3H4z" fill="#dfe6e9"/>
    `;
  } else if (cat === 'CAMION_GRUA') {
    paths = `
      <circle cx="6" cy="19" r="2" fill="#333"/>
      <circle cx="17" cy="19" r="2" fill="#333"/>
      <rect x="3" y="12" width="15" height="5" fill="${mainColor}"/>
      <path d="M5 12L17 3l2 2L8 14z" fill="#d63031"/>
      <path d="M17 3v7" stroke="#333" stroke-width="1.5"/>
    `;
  } else if (cat === 'CAMABAJA') {
    paths = `
      <circle cx="5" cy="19" r="2" fill="#333"/>
      <circle cx="15" cy="19" r="2" fill="#333"/>
      <circle cx="19" cy="19" r="2" fill="#333"/>
      <path d="M2 11h5v6H2z" fill="${mainColor}"/>
      <path d="M7 16h15v2H7z" fill="#6366f1"/>
    `;
  } else if (cat === 'TRACTOR') {
    paths = `<path d="M4 18h16v2H4z" fill="#333"/><path d="M6 10h10l2 4H4z" fill="${mainColor}"/><path d="M2 14h20v2H2z" fill="${mainColor}"/><path d="M20 10l2 6h-2z" fill="#555"/>`;
  } else if (cat === 'EXCAVADORA') {
    paths = `<path d="M4 18h12v2H4z" fill="#333"/><path d="M4 12h10v6H4z" fill="${mainColor}"/><path d="M12 14l8-8 2 2-6 8z" fill="#555"/><path d="M20 4l3 3-2 2-3-3z" fill="#333"/>`;
  } else if (cat === 'VOLQUETE') {
    paths = `<circle cx="7" cy="19" r="2" fill="#333"/><circle cx="17" cy="19" r="2" fill="#333"/><path d="M3 14h10v4H3z" fill="${mainColor}"/><path d="M10 8l11 2v6H10z" fill="${mainColor}"/>`;
  } else if (cat === 'CARGADOR') {
    paths = `<circle cx="6" cy="18" r="3" fill="#333"/><circle cx="16" cy="18" r="3" fill="#333"/><path d="M5 12h8v4H5z" fill="${mainColor}"/><path d="M13 14l7-4v8z" fill="${mainColor}"/><path d="M20 10l3 6h-3z" fill="#555"/>`;
  } else if (cat === 'MOTONIVELADORA') {
    paths = `<circle cx="5" cy="19" r="2" fill="#333"/><circle cx="15" cy="19" r="2" fill="#333"/><circle cx="19" cy="19" r="2" fill="#333"/><path d="M4 15h16v2H4z" fill="#555"/><path d="M14 10h5v5h-5z" fill="${mainColor}"/><path d="M8 17l6-2v1z" fill="#333"/>`;
  } else if (cat === 'RODILLO') {
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
      <div class="icon-label" style="background: ${mainColor}">${formatShortName(eqOrName)}</div>
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
  if (!map.value) return;

  const visibleIds = new Set(filteredEquipment.value.map(e => e.id));

  // Remover marcadores no visibles
  Object.keys(markers.value).forEach(id => {
    const numericId = parseInt(id);
    if (!visibleIds.has(numericId)) {
      if (map.value.hasLayer(markers.value[id])) {
        map.value.removeLayer(markers.value[id]);
      }
    }
  });

  // Renderizar o actualizar marcadores visibles
  filteredEquipment.value.forEach(eq => {
    if (eq.latitude && eq.longitude) {
      const customIcon = L.divIcon({
        html: getProSVG(eq, eq.status),
        className: 'leaflet-pro-icon',
        iconSize: [36, 48],
        iconAnchor: [18, 24],
        popupAnchor: [0, -24]
      });
      
      const popupContent = `
        <div style="font-family: inherit; color: #333; padding: 4px;">
          <b style="font-size: 14px;">${eq.shortCode ? eq.shortCode + ' - ' : ''}${eq.name}</b><br>
          <span style="font-size: 12px;"><b>Estado:</b> ${eq.status}</span><br>
          ${eq.spccCode ? `<span style="font-size: 11px;"><b>SPCC:</b> ${eq.spccCode}</span><br>` : ''}
          ${eq.plate ? `<span style="font-size: 11px;"><b>Placa:</b> ${eq.plate}</span><br>` : ''}
          <span style="font-size: 11px; color: #666;"><b>Ubicación:</b> ${eq.currentArea || 'Fuera de zona'}</span><br>
          ${eq.description ? `<span style="font-size: 11px; color: #475569;"><b>Desc:</b> ${eq.description}</span><br>` : ''}
          ${eq.comment ? `<hr style="margin: 5px 0; border: 0; border-top: 1px solid #eee;"><span style="font-size: 11px; color: #666;"><i>${eq.comment}</i></span>` : ''}
        </div>
      `;

      if (markers.value[eq.id]) {
        if (!map.value.hasLayer(markers.value[eq.id])) markers.value[eq.id].addTo(map.value);
        markers.value[eq.id].setLatLng([eq.latitude, eq.longitude]);
        markers.value[eq.id].setIcon(customIcon);
        markers.value[eq.id].setPopupContent(popupContent);
      } else {
        markers.value[eq.id] = L.marker([eq.latitude, eq.longitude], { 
          icon: customIcon
        }).addTo(map.value)
          .bindPopup(popupContent);

        markers.value[eq.id].on('click', () => {
          selectedEquipmentId.value = eq.id;
        });

        markers.value[eq.id].on('dragend', async (event) => {
          const marker = event.target;
          const position = marker.getLatLng();
          eq.latitude = position.lat;
          eq.longitude = position.lng;
          const area = checkAreaForPoint(position.lat, position.lng);
          eq.currentArea = area;
          try {
            await api.put(`/api/v1/equipment/${eq.id}/location`, 
              { latitude: position.lat, longitude: position.lng, currentArea: area },
              { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            loadData();
          } catch (error) { loadData(); }
        });
      }

      // Habilitar o deshabilitar arrastre según el modo activo
      if (markers.value[eq.id] && markers.value[eq.id].dragging) {
        if (isMoveMode.value) {
          markers.value[eq.id].dragging.enable();
        } else {
          markers.value[eq.id].dragging.disable();
        }
      }
    }
  });
};

const renderAreas = () => {
  if (!map.value) return;
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
  loadData();
});
</script>

<style scoped>
.equipment-map-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

/* Panel de Filtros Superior */
.filter-toolbar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.toolbar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.85rem;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  font-size: 1.5rem;
}

.toolbar-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.btn-create-header {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}
.btn-create-header:hover {
  background: #4338ca;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.mode-switch-group {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  gap: 0.25rem;
}

.btn-mode-switch {
  background: transparent;
  border: none;
  color: #64748b;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-mode-switch:hover {
  color: #0f172a;
}

.btn-mode-switch.active {
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

.btn-toggle-drag {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-toggle-drag:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-toggle-drag.active {
  background: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.btn-toggle-all {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-toggle-all:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Fila de Controles (Grid) */
.toolbar-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 0.9rem;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2rem 0.6rem 2.2rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  background: #ffffff;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.btn-clear-search {
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: bold;
}

.select-input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #0f172a;
  outline: none;
  font-weight: 600;
  transition: all 0.2s;
}

.select-input:focus {
  background: #ffffff;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.highlight-select {
  background: #e0e7ff;
  border-color: #a5b4fc;
  color: #3730a3;
}

/* Categorías (Chips Bar) */
.categories-bar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.categories-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-chip:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}

.category-chip.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

.chip-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chip-count {
  font-size: 0.72rem;
  opacity: 0.85;
  background: rgba(0, 0, 0, 0.1);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.category-chip.active .chip-count {
  background: rgba(255, 255, 255, 0.25);
}

/* Panel del Equipo Seleccionado */
.selected-equipment-panel {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eq-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.eq-title {
  font-size: 1rem;
  color: #1e1b4b;
}

.area-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: #e2e8f0;
  color: #475569;
}

.area-badge.in-area {
  background: #dcfce7;
  color: #15803d;
}

.btn-close-panel {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.selected-actions-form {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-item label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #3730a3;
}

.comment-item {
  flex: 1;
  min-width: 200px;
}

.mini-select, .mini-text-input {
  padding: 0.45rem 0.65rem;
  background: #ffffff;
  border: 1px solid #a5b4fc;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
}

.mini-text-input {
  width: 100%;
}

.btn-update-status {
  background: #4f46e5;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-update-status:hover {
  background: #4338ca;
}

/* Mapa Leaflet Container */
#map-container { position: relative; width: 100%; overflow: hidden; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
#map { height: 70vh; width: 100%; min-height: 520px; }

.fab-lock {
  position: absolute; top: 15px; right: 15px; z-index: 1000;
  padding: 0.45rem 0.95rem; border-radius: 20px;
  background: rgba(255, 255, 255, 0.95); border: 2px solid #cbd5e1;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.82rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  color: #334155;
  backdrop-filter: blur(4px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fab-lock.unlocked { 
  background: #2ed573; 
  border-color: #26af5f; 
  color: white; 
  box-shadow: 0 4px 14px rgba(46, 213, 115, 0.4); 
}
.fab-lock:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.fab-lock:active { transform: scale(0.95); }

.map-legend {
  position: absolute; bottom: 20px; left: 10px; z-index: 1000;
  background: rgba(28, 28, 30, 0.9); padding: 10px 14px; border-radius: 10px;
  color: white; font-size: 11px; border: 1px solid rgba(255,255,255,0.1); pointer-events: none;
  backdrop-filter: blur(4px);
}
.map-legend h4 { margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #e4e4e7; }
.legend-item { display: flex; align-items: center; margin-bottom: 4px; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.op { background: #2ed573; }
.sb { background: #ffa502; }
.in { background: #ff4757; }

@media (max-width: 768px) {
  .filter-toolbar-card {
    padding: 1rem;
    gap: 1rem;
  }
  #map {
    height: calc(100vh - 280px);
    min-height: 380px;
  }
  .toolbar-body {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
  .categories-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .chips-grid {
    width: 100%;
  }
}

:deep(.leaflet-pro-icon) {
  background: transparent !important;
  border: none !important;
  width: 36px !important;
  height: 48px !important;
  overflow: visible !important;
}

:deep(.pro-icon-wrapper) {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 36px !important;
  height: 48px !important;
  pointer-events: auto !important;
}

:deep(.icon-label) {
  font-size: 9px;
  font-weight: 800;
  color: #0f172a;
  padding: 1px 5px;
  border-radius: 4px;
  margin-top: -6px;
  white-space: nowrap;
  border: 1px solid rgba(0,0,0,0.25);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  z-index: 10;
}

/* Transiciones */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* MODAL STYLES EN EQUIPMENT MAP */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 1rem;
}

.modal-dialog {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 650px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: modalIn 0.2s ease-out;
  border: 1px solid #e2e8f0;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 800; }
.btn-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; }

.modal-body { padding: 1.5rem; max-height: 75vh; overflow-y: auto; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: 0.8rem; font-weight: 700; color: #475569; }

.form-input-text, .form-select {
  padding: 0.55rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.15s ease;
}
.form-input-text:focus, .form-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel-modal {
  background: #e2e8f0; color: #475569; border: none; padding: 0.55rem 1.1rem; border-radius: 8px; font-weight: 700; cursor: pointer;
}
.btn-save-modal {
  background: #4f46e5; color: white; border: none; padding: 0.55rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer;
}
.btn-save-modal:hover { background: #4338ca; }
</style>
