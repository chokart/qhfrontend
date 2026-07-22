<template>
  <div class="personal-page">
    <AppNavbar />

    <div class="personal-container">
      <!-- Encabezado del Módulo -->
      <div class="header-section">
        <div class="title-group">
          <h1>👥 Módulo de Personal y Turnos</h1>
          <p class="subtitle">Directorio de los 127 operadores y programación de turnos (Julio - Diciembre 2026).</p>
        </div>

        <!-- Pestañas de Navegación del Módulo -->
        <div class="module-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'directory' }]"
            @click="activeTab = 'directory'"
          >
            📋 Directorio de Personal
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'calendar' }]"
            @click="activeTab = 'calendar'"
          >
            📅 Calendario de Turnos (Julio - Dic 2026)
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'daily' }]"
            @click="activeTab = 'daily'"
          >
            🔎 Guardia del Día
          </button>
        </div>
      </div>

      <!-- VISTA 1: Directorio de Personal -->
      <div v-if="activeTab === 'directory'" class="tab-content">
        <!-- Tarjetas de Resumen Dinámicas -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon blue">👷</div>
            <div class="metric-info">
              <span class="metric-label">Operadores Registrados</span>
              <span class="metric-value">{{ operators.length }}</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon green">🛡️</div>
            <div class="metric-info">
              <span class="metric-label">Guardias de Trabajo</span>
              <span class="metric-value">12</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon amber">🔍</div>
            <div class="metric-info">
              <span class="metric-label">Filtro de Búsqueda</span>
              <span class="metric-value">{{ filteredOperators.length }}</span>
            </div>
          </div>
        </div>

        <!-- Contenedor Principal / Tabla de Personal -->
        <div class="content-card">
          <div class="card-header">
            <div class="header-left">
              <h3>Directorio de Operadores por Guardia</h3>
              <span class="badge-count">{{ filteredOperators.length }} registros</span>
            </div>
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Buscar por código, nombre o guardia..." 
                class="search-input"
              />
              <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
            </div>
          </div>

          <!-- Indicador de carga -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando directorio de personal...</p>
          </div>

          <!-- Tabla de datos -->
          <div v-else-if="filteredOperators.length > 0" class="table-responsive">
            <table class="personal-table">
              <thead>
                <tr>
                  <th style="width: 60px;">#</th>
                  <th style="width: 120px;">CÓDIGO</th>
                  <th>NOMBRE COMPLETO</th>
                  <th style="width: 160px;">GUARDIA / GRUPO</th>
                  <th style="width: 110px; text-align: center;">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(op, idx) in filteredOperators" :key="op.id || idx">
                  <td class="col-idx">{{ idx + 1 }}</td>
                  <td class="col-code">
                    <span v-if="op.code" class="code-badge">{{ op.code }}</span>
                    <span v-else class="no-code">Sin código</span>
                  </td>
                  <td class="col-name">{{ op.name }}</td>
                  <td class="col-guardia">
                    <span 
                      v-if="op.group" 
                      class="guardia-badge"
                      :style="{ backgroundColor: op.group.color || '#4f46e5' }"
                    >
                      {{ op.group.name }}
                    </span>
                    <span v-else class="no-guardia">Sin Guardia</span>
                  </td>
                  <td class="col-status">
                    <span class="status-pill active">Activo</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Estado vacío -->
          <div v-else class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No se encontraron operadores</h3>
            <p>No hay personal que coincida con "<b>{{ searchQuery }}</b>".</p>
          </div>
        </div>
      </div>

      <!-- VISTA 2: Calendario de Turnos (Julio - Dic 2026) -->
      <div v-else-if="activeTab === 'calendar'" class="tab-content">
        <ShiftCalendar 
          ref="shiftCalendarRef"
          @openGroupManager="showGroupManagerModal = true"
        />
      </div>

      <!-- VISTA 3: Guardia del Día -->
      <div v-else-if="activeTab === 'daily'" class="tab-content">
        <DailyRosterView />
      </div>
    </div>

    <!-- Modal Gestor de Guardias -->
    <GroupManagerModal 
      :show="showGroupManagerModal"
      @close="showGroupManagerModal = false"
      @updated="refreshAllData"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppNavbar from '../components/AppNavbar.vue';
import ShiftCalendar from '../components/ShiftCalendar.vue';
import GroupManagerModal from '../components/GroupManagerModal.vue';
import DailyRosterView from '../components/DailyRosterView.vue';
import api from '../api';

const activeTab = ref('calendar'); // Pestaña predeterminada al entrar
const showGroupManagerModal = ref(false);
const operators = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const shiftCalendarRef = ref(null);

const fetchOperators = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/v1/operators');
    operators.value = res.data;
  } catch (err) {
    console.error("Error al cargar personal:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOperators);

const refreshAllData = () => {
  fetchOperators();
  if (shiftCalendarRef.value && shiftCalendarRef.value.fetchMatrix) {
    shiftCalendarRef.value.fetchMatrix();
  }
};

const filteredOperators = computed(() => {
  if (!searchQuery.value.trim()) return operators.value;
  const q = searchQuery.value.toLowerCase().trim();
  return operators.value.filter(op => {
    const nameMatch = op.name && op.name.toLowerCase().includes(q);
    const codeMatch = op.code && op.code.toLowerCase().includes(q);
    const groupMatch = op.group && op.group.name && op.group.name.toLowerCase().includes(q);
    return nameMatch || codeMatch || groupMatch;
  });
});
</script>

<style scoped>
.personal-page {
  min-height: 100vh;
  background: #f8fafc;
}

.personal-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-group h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #64748b;
  font-size: 0.92rem;
  margin: 0;
}

.module-tabs {
  display: flex;
  background: white;
  padding: 0.35rem;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  gap: 0.35rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #4f46e5;
  color: white;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: white;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.metric-icon.blue { background: #e0e7ff; }
.metric-icon.green { background: #dcfce7; }
.metric-icon.amber { background: #fef3c7; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.content-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.badge-count {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 0.9rem;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.55rem 2.2rem 0.55rem 2.2rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.clear-btn {
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.9rem;
}

.table-responsive {
  overflow-x: auto;
}

.personal-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.personal-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
}

.personal-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  color: #334155;
  vertical-align: middle;
}

.personal-table tr:hover td {
  background: #f8fafc;
}

.col-idx {
  color: #94a3b8;
  font-weight: 600;
}

.code-badge {
  background: #3b82f6;
  color: white;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.03em;
  font-family: monospace;
}

.guardia-badge {
  color: white;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.no-code, .no-guardia {
  color: #94a3b8;
  font-size: 0.8rem;
  font-style: italic;
}

.col-name {
  font-weight: 600;
  color: #0f172a;
}

.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.active {
  background: #dcfce7;
  color: #166534;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.empty-state p {
  color: #64748b;
  font-size: 0.88rem;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
