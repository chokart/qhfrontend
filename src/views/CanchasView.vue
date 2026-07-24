<template>
  <div class="canchas-view">
    <AppNavbar />

    <div class="canchas-container">
      <div class="sub-header">
        <div class="title-section">
          <h1>Control de Canchas</h1>
        </div>
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-label">Canchas Observadas:</span>
            <span class="stat-value error">{{ observedCount }}</span>
          </div>
          <button class="btn-pdf" @click="downloadReport" :disabled="loading">
            <span>📄</span> Exportar PDF
          </button>
        </div>
      </div>

      <!-- Leyenda Visual de Colores por Estado -->
      <div class="color-legend-card">
        <span class="legend-title">Leyenda de Estados:</span>
        <div class="legend-chips">
          <div v-for="(color, status) in STATUS_COLORS" :key="status" class="legend-chip">
            <span class="legend-dot" :style="{ backgroundColor: color }"></span>
            <span class="legend-name">{{ formatStatusText(status) }}</span>
          </div>
        </div>
      </div>

      <!-- Barra de Herramientas y Visibilidad de Canchas -->
      <div class="visibility-toolbar-card">
        <div class="toolbar-top">
          <div class="toolbar-title" @click="showVisibilityPanel = !showVisibilityPanel">
            <span class="icon">👁️</span>
            <div>
              <h3>Visibilidad y Filtros de Canchas</h3>
              <span class="subtitle-text">
                <template v-if="totalHiddenCount > 0">
                  ⚠️ <b>{{ totalHiddenCount }}</b> {{ totalHiddenCount === 1 ? 'cancha ocultada' : 'canchas ocultadas' }}
                </template>
                <template v-else>
                  Todas las canchas están visibles
                </template>
              </span>
            </div>
            <span class="toggle-arrow">{{ showVisibilityPanel ? '🔼' : '🔽' }}</span>
          </div>

          <div class="toolbar-quick-actions">
            <button 
              class="btn-toggle-section" 
              :class="{ active: showSectionPrincipal }"
              @click="showSectionPrincipal = !showSectionPrincipal"
            >
              {{ showSectionPrincipal ? '👁️ Principal' : '🙈 Principal' }}
            </button>
            <button 
              class="btn-toggle-section" 
              :class="{ active: showSectionLateral }"
              @click="showSectionLateral = !showSectionLateral"
            >
              {{ showSectionLateral ? '👁️ Lateral' : '🙈 Lateral' }}
            </button>

            <button v-if="totalHiddenCount > 0" class="btn-reset-visibility" @click="showAllCanchas">
              🔄 Mostrar Todas
            </button>
          </div>
        </div>

        <!-- Panel Desplegable de Control de Visibilidad -->
        <transition name="expand">
          <div v-if="showVisibilityPanel" class="visibility-panel-body">
            <!-- Filtro por Estado Operativo -->
            <div class="panel-row">
              <label class="row-label">Filtrar por Estado:</label>
              <div class="status-filters-list">
                <button 
                  v-for="st in statusOptions" 
                  :key="st.value"
                  :class="['status-chip', { active: selectedStatusFilter === st.value }]"
                  @click="selectedStatusFilter = st.value"
                >
                  <span v-if="st.value !== 'ALL'" class="chip-color-dot" :style="{ backgroundColor: getStatusColor(st.value) }"></span>
                  {{ st.label }}
                </button>
              </div>
            </div>

            <!-- Visibilidad Individual - Dique Principal -->
            <div class="panel-row" v-if="canchasNiveles.length > 0">
              <div class="row-header">
                <span class="row-label">Canchas Dique Principal:</span>
                <div class="row-actions">
                  <button @click="selectAllPrincipal(true)" class="btn-mini-link">Mostrar todas</button>
                  <button @click="selectAllPrincipal(false)" class="btn-mini-link">Ocultar todas</button>
                </div>
              </div>
              <div class="canchas-chips-grid">
                <button 
                  v-for="cancha in canchasNiveles" 
                  :key="'chip_p_'+cancha.id"
                  :class="['cancha-toggle-chip', { hidden: hiddenPrincipalIds.has(cancha.id) }]"
                  @click="toggleCanchaPrincipal(cancha.id)"
                  :title="hiddenPrincipalIds.has(cancha.id) ? 'Clic para mostrar' : 'Clic para ocultar'"
                >
                  <span class="chip-eye">{{ hiddenPrincipalIds.has(cancha.id) ? '🙈' : '👁️' }}</span>
                  <span class="chip-num">#{{ cancha.number }}</span>
                </button>
              </div>
            </div>

            <!-- Visibilidad Individual - Dique Lateral -->
            <div class="panel-row" v-if="canchasCapas.length > 0">
              <div class="row-header">
                <span class="row-label">Canchas Dique Lateral:</span>
                <div class="row-actions">
                  <button @click="selectAllLateral(true)" class="btn-mini-link">Mostrar todas</button>
                  <button @click="selectAllLateral(false)" class="btn-mini-link">Ocultar todas</button>
                </div>
              </div>
              <div class="canchas-chips-grid">
                <button 
                  v-for="cancha in canchasCapas" 
                  :key="'chip_l_'+cancha.id"
                  :class="['cancha-toggle-chip', { hidden: hiddenLateralIds.has(cancha.id) }]"
                  @click="toggleCanchaLateral(cancha.id)"
                  :title="hiddenLateralIds.has(cancha.id) ? 'Clic para mostrar' : 'Clic para ocultar'"
                >
                  <span class="chip-eye">{{ hiddenLateralIds.has(cancha.id) ? '🙈' : '👁️' }}</span>
                  <span class="chip-num">#{{ cancha.number }}</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div v-if="loading" class="loading-state">
        Cargando información de canchas...
      </div>

      <div v-else class="content-wrapper">
        <!-- Sección de Niveles (Dique Principal) -->
        <transition name="fade">
          <div v-if="showSectionPrincipal" class="canchas-section-block">
            <div class="section-title">
              <h2>Canchas Dique Principal</h2>
              <span class="stat-badge">Promedio Altura: {{ avgHeight.toFixed(2) }}m</span>
              <span class="counter-text">({{ filteredNiveles.length }} de {{ canchasNiveles.length }} visibles)</span>
            </div>
            <div class="parallel-container">
              <div v-if="filteredNiveles.length > 0" class="canchas-parallel">
                <CanchaCard 
                  v-for="cancha in filteredNiveles" 
                  :key="'n_'+cancha.id" 
                  :cancha="cancha" 
                  @click="openModalNivel(cancha)"
                  @hide="toggleCanchaPrincipal(cancha.id)"
                />
              </div>
              <div v-else class="empty-section-msg">
                No hay canchas visibles en esta sección (ocultadas o filtradas).
              </div>
            </div>
          </div>
        </transition>

        <!-- Sección de Capas (Dique Lateral) -->
        <transition name="fade">
          <div v-if="showSectionLateral" class="canchas-section-block" style="margin-top: 1.5rem;">
            <div class="section-title">
              <h2>Canchas Dique Lateral</h2>
              <span class="counter-text">({{ filteredCapas.length }} de {{ canchasCapas.length }} visibles)</span>
            </div>
            <div class="parallel-container">
              <div v-if="filteredCapas.length > 0" class="canchas-parallel canchas-capas-parallel">
                <CanchaCapaCard 
                  v-for="cancha in filteredCapas" 
                  :key="'c_'+cancha.id" 
                  :cancha="cancha" 
                  @click="openModalCapa(cancha)"
                  @hide="toggleCanchaLateral(cancha.id)"
                />
              </div>
              <div v-else class="empty-section-msg">
                No hay canchas visibles en esta sección (ocultadas o filtradas).
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Modales de Edición -->
    <CanchaModal 
      :show="showModalNivel" 
      :cancha="selectedCanchaNivel" 
      @close="showModalNivel = false" 
      @updated="fetchData"
    />
    <CanchaCapaModal 
      :show="showModalCapa" 
      :cancha="selectedCanchaCapa" 
      @close="showModalCapa = false" 
      @updated="fetchData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import api from '../api';
import AppNavbar from '../components/AppNavbar.vue';
import CanchaCard from '../components/CanchaCard.vue';
import CanchaCapaCard from '../components/CanchaCapaCard.vue';
import CanchaModal from '../components/CanchaModal.vue';
import CanchaCapaModal from '../components/CanchaCapaModal.vue';
import { generateCanchasPDF } from '../utils/reportGenerator';
import { STATUS_COLORS, getStatusColor, formatStatusText } from '../utils/canchaColors';

const canchasNiveles = ref([]);
const canchasCapas = ref([]);
const loading = ref(true);

const showModalNivel = ref(false);
const selectedCanchaNivel = ref(null);

const showModalCapa = ref(false);
const selectedCanchaCapa = ref(null);

// Estado de Visibilidad
const showVisibilityPanel = ref(false);
const showSectionPrincipal = ref(true);
const showSectionLateral = ref(true);
const selectedStatusFilter = ref('ALL');

const hiddenPrincipalIds = ref(new Set());
const hiddenLateralIds = ref(new Set());

const statusOptions = [
  { value: 'ALL', label: 'Todos los Estados' },
  { value: 'CICLONEANDO', label: 'Cicloneando' },
  { value: 'POR_CICLONEAR', label: 'Por Ciclonear' },
  { value: 'POR_COMPACTAR', label: 'Por Compactar' },
  { value: 'COMPACTADO', label: 'Compactado' },
  { value: 'POR_PREPARAR_BERMA', label: 'Por Preparar Berma' },
  { value: 'DRENANDO', label: 'Drenando' },
  { value: 'STAND_BY', label: 'Stand By' },
  { value: 'OBSERVADA', label: 'Observadas' }
];

// Cargar preferencias guardadas en localStorage
const loadVisibilityPreferences = () => {
  try {
    const saved = localStorage.getItem('canchas_visibility_prefs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.hiddenPrincipal)) hiddenPrincipalIds.value = new Set(parsed.hiddenPrincipal);
      if (Array.isArray(parsed.hiddenLateral)) hiddenLateralIds.value = new Set(parsed.hiddenLateral);
      if (typeof parsed.showPrincipal === 'boolean') showSectionPrincipal.value = parsed.showPrincipal;
      if (typeof parsed.showLateral === 'boolean') showSectionLateral.value = parsed.showLateral;
      if (parsed.statusFilter) selectedStatusFilter.value = parsed.statusFilter;
    }
  } catch (e) {
    console.error("Error loading visibility preferences:", e);
  }
};

// Guardar preferencias en localStorage
const saveVisibilityPreferences = () => {
  try {
    const data = {
      hiddenPrincipal: Array.from(hiddenPrincipalIds.value),
      hiddenLateral: Array.from(hiddenLateralIds.value),
      showPrincipal: showSectionPrincipal.value,
      showLateral: showSectionLateral.value,
      statusFilter: selectedStatusFilter.value
    };
    localStorage.setItem('canchas_visibility_prefs', JSON.stringify(data));
  } catch (e) {
    console.error("Error saving visibility preferences:", e);
  }
};

watch([showSectionPrincipal, showSectionLateral, selectedStatusFilter], saveVisibilityPreferences);

const toggleCanchaPrincipal = (id) => {
  const newSet = new Set(hiddenPrincipalIds.value);
  if (newSet.has(id)) newSet.delete(id);
  else newSet.add(id);
  hiddenPrincipalIds.value = newSet;
  saveVisibilityPreferences();
};

const toggleCanchaLateral = (id) => {
  const newSet = new Set(hiddenLateralIds.value);
  if (newSet.has(id)) newSet.delete(id);
  else newSet.add(id);
  hiddenLateralIds.value = newSet;
  saveVisibilityPreferences();
};

const selectAllPrincipal = (showAll) => {
  if (showAll) {
    hiddenPrincipalIds.value = new Set();
  } else {
    hiddenPrincipalIds.value = new Set(canchasNiveles.value.map(c => c.id));
  }
  saveVisibilityPreferences();
};

const selectAllLateral = (showAll) => {
  if (showAll) {
    hiddenLateralIds.value = new Set();
  } else {
    hiddenLateralIds.value = new Set(canchasCapas.value.map(c => c.id));
  }
  saveVisibilityPreferences();
};

const showAllCanchas = () => {
  hiddenPrincipalIds.value = new Set();
  hiddenLateralIds.value = new Set();
  showSectionPrincipal.value = true;
  showSectionLateral.value = true;
  selectedStatusFilter.value = 'ALL';
  saveVisibilityPreferences();
};

const totalHiddenCount = computed(() => {
  let count = hiddenPrincipalIds.value.size + hiddenLateralIds.value.size;
  if (!showSectionPrincipal.value) count += (canchasNiveles.value.length - hiddenPrincipalIds.value.size);
  if (!showSectionLateral.value) count += (canchasCapas.value.length - hiddenLateralIds.value.size);
  return count;
});

// Canchas Filtradas Visibles
const filteredNiveles = computed(() => {
  return canchasNiveles.value.filter(c => {
    const notHidden = !hiddenPrincipalIds.value.has(c.id);
    const matchesStatus = selectedStatusFilter.value === 'ALL' || c.status === selectedStatusFilter.value;
    return notHidden && matchesStatus;
  });
});

const filteredCapas = computed(() => {
  return canchasCapas.value.filter(c => {
    const notHidden = !hiddenLateralIds.value.has(c.id);
    const matchesStatus = selectedStatusFilter.value === 'ALL' || c.status === selectedStatusFilter.value;
    return notHidden && matchesStatus;
  });
});

const downloadReport = () => {
  generateCanchasPDF(filteredNiveles.value, filteredCapas.value);
};

const fetchData = async () => {
  try {
    const [resNiveles, resCapas] = await Promise.all([
      api.get('/api/v1/canchas'),
      api.get('/api/v1/canchas-capas')
    ]);
    canchasNiveles.value = resNiveles.data;
    canchasCapas.value = resCapas.data;
  } catch (error) {
    console.error("Error fetching canchas:", error);
  } finally {
    loading.value = false;
  }
};

const openModalNivel = (cancha) => {
  selectedCanchaNivel.value = cancha;
  showModalNivel.value = true;
};

const openModalCapa = (cancha) => {
  selectedCanchaCapa.value = cancha;
  showModalCapa.value = true;
};

const avgHeight = computed(() => {
  if (filteredNiveles.value.length === 0) return 0;
  const sum = filteredNiveles.value.reduce((acc, c) => acc + c.currentHeight, 0);
  return sum / filteredNiveles.value.length;
});

const observedCount = computed(() => {
  const countNiveles = filteredNiveles.value.filter(c => c.status === 'OBSERVADA').length;
  const countCapas = filteredCapas.value.filter(c => c.status === 'OBSERVADA').length;
  return countNiveles + countCapas;
});

onMounted(() => {
  loadVisibilityPreferences();
  fetchData();
});
</script>

<style scoped>
.canchas-view { min-height: 100vh; background: #f8fafc; padding-bottom: 2rem; }
.canchas-container { padding: 0 1.5rem; max-width: 1400px; margin: 0 auto; }

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 600px) {
  .sub-header { padding: 1rem; flex-direction: column; align-items: stretch; text-align: center; }
  .title-section { flex-direction: column; gap: 0.75rem; }
  .stats-bar { justify-content: center; }
}

.title-section { display: flex; align-items: center; gap: 1.5rem; }
h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }

.stats-bar { display: flex; gap: 2rem; align-items: center; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; }

@media (max-width: 600px) {
  .stat-item { align-items: center; }
}

.stat-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { font-size: 1.25rem; font-weight: 900; color: #6366f1; }
.stat-value.error { color: #ef4444; }

.btn-pdf {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  color: #6366f1;
  border: 2px solid #6366f1;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-pdf:hover:not(:disabled) {
  background: #6366f1;
  color: white;
}
.btn-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tarjeta de Control de Visibilidad */
.visibility-toolbar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.5rem;
}

.toolbar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.toolbar-title .icon {
  font-size: 1.35rem;
}

.toolbar-title h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.subtitle-text {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 500;
}

.toggle-arrow {
  font-size: 0.8rem;
  color: #94a3b8;
}

.toolbar-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn-toggle-section {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.4rem 0.85rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle-section.active {
  background: #e0e7ff;
  border-color: #a5b4fc;
  color: #4338ca;
}

.btn-reset-visibility {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.4rem 0.85rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-reset-visibility:hover {
  background: #dc2626;
  color: white;
}

/* Panel Desplegable de Visibilidad */
.visibility-panel-body {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.row-label {
  font-size: 0.78rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn-mini-link {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0 0.35rem;
}
.btn-mini-link:hover { text-decoration: underline; }

.status-filters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-chip.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

.canchas-chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.cancha-toggle-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.cancha-toggle-chip:hover {
  border-color: #6366f1;
  background: #f8fafc;
}

.cancha-toggle-chip.hidden {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #94a3b8;
  opacity: 0.7;
}

.chip-eye { font-size: 0.85rem; }

/* Contenido Principal de Canchas */
.content-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }

.canchas-section-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.section-title h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #334155; }
.stat-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.7rem; font-weight: 800; }
.counter-text { font-size: 0.78rem; color: #64748b; font-weight: 600; }

.parallel-container {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 1rem;
  overflow-x: auto;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
  .parallel-container { padding: 1rem 0.5rem; }
}

.canchas-parallel {
  display: flex;
  flex-direction: row-reverse;
  gap: 6px;
  min-width: max-content;
  padding-bottom: 0.5rem;
  justify-content: center;
}

@media (max-width: 1200px) {
  .canchas-parallel { justify-content: flex-start; }
}

.canchas-capas-parallel {
  flex-direction: row;
}

.empty-section-msg {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  padding: 5rem;
  color: #64748b;
  font-weight: 600;
}

/* Transiciones */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Leyenda de Colores */
.color-legend-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.legend-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.legend-chips {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.legend-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.legend-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
  text-transform: capitalize;
}

/* Custom Scrollbar */
.parallel-container::-webkit-scrollbar { height: 8px; }
.parallel-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
.parallel-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.parallel-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
