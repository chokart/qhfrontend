<template>
  <div class="reporte-view">
    <AppNavbar />

    <div class="page-container">
      <!-- Encabezado de la página -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">📊</div>
          <div>
            <h1>Reporte & Dashboard Operacional</h1>
            <p class="subtitle">Carga de libros Excel acumulativos y análisis integral de operaciones Quebrada Honda</p>
          </div>
        </div>

        <div class="header-actions">
          <!-- Selector de Mes/Año -->
          <div v-if="availableMonths.length > 0" class="month-selector-wrap">
            <span class="selector-icon">📅</span>
            <select v-model="selectedMonthKey" @change="onMonthChange" class="month-select">
              <option v-for="m in availableMonths" :key="`${m.year}-${m.month}`" :value="`${m.year}-${m.month}`">
                {{ getMonthName(m.month) }} {{ m.year }}
              </option>
            </select>
          </div>

          <!-- Botón Cargar Excel -->
          <button class="btn-upload" @click="triggerFileSelect">
            <span>📤 Subir Excel (.xlsm)</span>
          </button>
          <input 
            type="file" 
            ref="fileInputRef" 
            @change="handleFileUpload" 
            accept=".xlsm,.xlsx,.xls" 
            style="display: none;" 
          />
        </div>
      </div>

      <!-- Alerta / Estado de carga -->
      <transition name="fade">
        <div v-if="uploadStatus.message" :class="['status-banner', uploadStatus.isSuccess ? 'success' : 'error']">
          <span class="status-icon">{{ uploadStatus.isSuccess ? '✅' : '❌' }}</span>
          <span>{{ uploadStatus.message }}</span>
        </div>
      </transition>

      <!-- Overlay Spinner durante la subida -->
      <div v-if="isUploading" class="uploading-overlay">
        <div class="spinner-card">
          <div class="spinner-large"></div>
          <p>Procesando archivo Excel y tabulando 31 partes diarios...</p>
        </div>
      </div>

      <!-- Dashboard de Datos -->
      <div v-if="dashboardData" class="dashboard-content">

        <!-- TARJETAS DE KPIS PRINCIPALES -->
        <div class="kpi-grid">
          <div class="kpi-card primary">
            <div class="kpi-icon">🏗️</div>
            <div class="kpi-info">
              <span class="kpi-label">Producción Total Arenas</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasMes) }} <small>TM Secas</small></span>
              <span class="kpi-sub">Acumulado del Mes</span>
            </div>
          </div>

          <div class="kpi-card info">
            <div class="kpi-icon">📐</div>
            <div class="kpi-info">
              <span class="kpi-label">Dique Principal vs Lateral</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalDpArenas) }} / {{ formatNumber(dashboardData.totalDlArenas) }}</span>
              <span class="kpi-sub">DP (TM) / DL (TM)</span>
            </div>
          </div>

          <div class="kpi-card warning">
            <div class="kpi-icon">🌊</div>
            <div class="kpi-info">
              <span class="kpi-label">Promedio Cota Agua / Presa</span>
              <span class="kpi-value">{{ dashboardData.avgNivelAgua.toFixed(2) }} <small>msnm</small></span>
              <span class="kpi-sub">Presa DP: {{ dashboardData.avgNivelPresaDp.toFixed(2) }} msnm</span>
            </div>
          </div>

          <div class="kpi-card danger">
            <div class="kpi-icon">🛠️</div>
            <div class="kpi-info">
              <span class="kpi-label">Avisos SAP Pendientes</span>
              <span class="kpi-value">{{ dashboardData.activeSapCount }} <small>Reportados</small></span>
              <span class="kpi-sub">Total Bitácora: {{ dashboardData.sapNotices ? dashboardData.sapNotices.length : 0 }}</span>
            </div>
          </div>
        </div>

        <!-- NAVEGACIÓN ENTRE VISTAS DEL DASHBOARD -->
        <div class="view-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'tendencias' }]" 
            @click="activeTab = 'tendencias'"
          >
            📈 Tendencias Diarias
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'inspector' }]" 
            @click="activeTab = 'inspector'"
          >
            📑 Inspector por Día (01 - 31)
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'sap' }]" 
            @click="activeTab = 'sap'"
          >
            📋 Bitácora Avisos SAP ({{ dashboardData.sapNotices ? dashboardData.sapNotices.length : 0 }})
          </button>
        </div>

        <!-- TAB 1: TENDENCIAS DIARIAS -->
        <div v-if="activeTab === 'tendencias'" class="tab-pane">
          <!-- Gráfico Visual de Producción Diaria (Barras / SVG) -->
          <div class="card chart-card">
            <div class="card-header-inner">
              <h3>📊 Producción Diaria de Arenas (TM Secas por Día)</h3>
              <div class="legend-box">
                <span class="legend-item dp"><span class="dot"></span> Dique Principal</span>
                <span class="legend-item dl"><span class="dot"></span> Dique Lateral</span>
              </div>
            </div>

            <div class="bar-chart-container">
              <div 
                v-for="d in dashboardData.dailyReports" 
                :key="d.id" 
                class="chart-bar-group"
                :title="`Día ${d.dayNumber}: DP=${formatNumber(d.dpArenasTotalDia)}, DL=${formatNumber(d.dlArenasTotalDia)} TM`"
              >
                <div class="bar-stack">
                  <div 
                    class="bar-segment dl" 
                    :style="{ height: getBarHeight(d.dlArenasTotalDia) + '%' }"
                  ></div>
                  <div 
                    class="bar-segment dp" 
                    :style="{ height: getBarHeight(d.dpArenasTotalDia) + '%' }"
                  ></div>
                </div>
                <span class="bar-label">{{ d.dayNumber }}</span>
              </div>
            </div>
          </div>

          <!-- Gráfico Visual de Niveles Operacionales (Presa & Agua) -->
          <div class="card chart-card margin-top">
            <div class="card-header-inner">
              <h3>🌊 Comportamiento de Cota de Agua y Presa (msnm)</h3>
              <div class="legend-box">
                <span class="legend-item agua"><span class="dot"></span> Nivel Agua</span>
                <span class="legend-item presa"><span class="dot"></span> Presa DP</span>
              </div>
            </div>

            <div class="line-chart-container">
              <svg viewBox="0 0 1000 200" class="svg-chart">
                <!-- Línea de Agua -->
                <polyline 
                  fill="none" 
                  stroke="#3b82f6" 
                  stroke-width="3" 
                  :points="getPolylinePoints('nivelAguaMsnm', 1190, 1205)" 
                />
                <!-- Línea Presa DP -->
                <polyline 
                  fill="none" 
                  stroke="#10b981" 
                  stroke-width="3" 
                  stroke-dasharray="5,5"
                  :points="getPolylinePoints('nivelPresaDpMsnm', 1190, 1215)" 
                />
              </svg>
              <div class="svg-labels">
                <span v-for="d in dashboardData.dailyReports" :key="d.id" class="svg-day-label">
                  {{ d.dayNumber }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: INSPECTOR DETALLADO POR DÍA -->
        <div v-if="activeTab === 'inspector'" class="tab-pane">
          <div class="inspector-layout">
            <!-- Sidebar selector de días -->
            <div class="days-sidebar">
              <h4>Días del Mes</h4>
              <div class="days-grid">
                <button 
                  v-for="d in dashboardData.dailyReports" 
                  :key="d.id" 
                  :class="['day-btn', { active: selectedDayReport?.id === d.id }]"
                  @click="selectedDayReport = d"
                >
                  {{ d.dayNumber < 10 ? '0' + d.dayNumber : d.dayNumber }}
                </button>
              </div>
            </div>

            <!-- Detalle del día seleccionado -->
            <div v-if="selectedDayReport" class="day-detail-card card">
              <div class="detail-header">
                <h2>Parte Diario: {{ selectedDayReport.reportDate }} (Día {{ selectedDayReport.dayNumber }})</h2>
                <span class="badge-total">Producción Total: {{ formatNumber(selectedDayReport.totalArenasDia) }} TM</span>
              </div>

              <!-- Grilla de secciones del día -->
              <div class="detail-sections">

                <!-- Seccion Arenas -->
                <div class="section-box">
                  <h5>🏗️ Producción de Arenas por Sector</h5>
                  <table class="sub-table">
                    <thead>
                      <tr>
                        <th>Sector</th>
                        <th>Guardia A</th>
                        <th>Guardia B</th>
                        <th>Total Día</th>
                        <th>Plan Día</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>Dique Principal</b></td>
                        <td>{{ formatNumber(selectedDayReport.dpArenasGuardiaA) }} TM</td>
                        <td>{{ formatNumber(selectedDayReport.dpArenasGuardiaB) }} TM</td>
                        <td class="highlight-val">{{ formatNumber(selectedDayReport.dpArenasTotalDia) }} TM</td>
                        <td>{{ formatNumber(selectedDayReport.dpArenasPlanDia) }} TM</td>
                      </tr>
                      <tr>
                        <td><b>Dique Lateral</b></td>
                        <td>{{ formatNumber(selectedDayReport.dlArenasGuardiaA) }} TM</td>
                        <td>{{ formatNumber(selectedDayReport.dlArenasGuardiaB) }} TM</td>
                        <td class="highlight-val">{{ formatNumber(selectedDayReport.dlArenasTotalDia) }} TM</td>
                        <td>{{ formatNumber(selectedDayReport.dlArenasPlanDia) }} TM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Seccion Niveles e Hídrico -->
                <div class="section-box">
                  <h5>🌊 Cotas, Ciclones y Parámetros Hídricos</h5>
                  <div class="params-grid">
                    <div class="param-item">
                      <span class="p-label">Presa DP / DL:</span>
                      <span class="p-val">{{ selectedDayReport.nivelPresaDpMsnm }} / {{ selectedDayReport.nivelPresaDlMsnm }} msnm</span>
                    </div>
                    <div class="param-item">
                      <span class="p-label">Agua / Lama:</span>
                      <span class="p-val">{{ selectedDayReport.nivelAguaMsnm }} msnm / {{ selectedDayReport.nivelLamaM }} m</span>
                    </div>
                    <div class="param-item">
                      <span class="p-label">Hidrociclones (N1/N2):</span>
                      <span class="p-val">{{ selectedDayReport.hidrociclonesNido1 }} / {{ selectedDayReport.hidrociclonesNido2 }} operando</span>
                    </div>
                    <div class="param-item">
                      <span class="p-label">Agua Recuperada:</span>
                      <span class="p-val">{{ selectedDayReport.caudalAguaRecuperadaM3h }} m³/h</span>
                    </div>
                    <div class="param-item">
                      <span class="p-label">pH Barcazas / PF4:</span>
                      <span class="p-val">{{ selectedDayReport.phLagunaBarcazas }} / {{ selectedDayReport.phPf4 }}</span>
                    </div>
                    <div class="param-item">
                      <span class="p-label">Tractores Operativos (A/B):</span>
                      <span class="p-val">{{ selectedDayReport.tractoresOperativosA }} / {{ selectedDayReport.tractoresOperativosB }} ({{ selectedDayReport.utilizacionTractoresPct }}%)</span>
                    </div>
                  </div>
                </div>

                <!-- Asistencia de Personal -->
                <div class="section-box full-width">
                  <h5>👥 Novedades y Asistencia por Guardia</h5>
                  <div class="notes-grid">
                    <div class="note-box">
                      <h6>Turno A</h6>
                      <p>{{ selectedDayReport.asistenciaTurnoA || 'Sin novedades registradas.' }}</p>
                    </div>
                    <div class="note-box">
                      <h6>Turno B</h6>
                      <p>{{ selectedDayReport.asistenciaTurnoB || 'Sin novedades registradas.' }}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: BITÁCORA DE AVISOS SAP -->
        <div v-if="activeTab === 'sap'" class="tab-pane">
          <div class="card">
            <div class="sap-header">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input 
                  v-model="sapSearch" 
                  type="text" 
                  placeholder="Buscar equipo, responsable, aviso SAP..." 
                  class="search-input"
                />
              </div>
              <div class="filter-chips">
                <button 
                  :class="['chip', { active: sapFilter === 'ALL' }]" 
                  @click="sapFilter = 'ALL'"
                >Todos</button>
                <button 
                  :class="['chip', { active: sapFilter === 'Reportado' }]" 
                  @click="sapFilter = 'Reportado'"
                >🔴 Pendientes</button>
                <button 
                  :class="['chip', { active: sapFilter === 'Levantado' }]" 
                  @click="sapFilter = 'Levantado'"
                >🟢 Levantados</button>
              </div>
            </div>

            <div class="table-wrapper">
              <table class="sap-table">
                <thead>
                  <tr>
                    <th>Nº AVISO</th>
                    <th>FECHA</th>
                    <th>EQUIPO</th>
                    <th>DESCRIPCIÓN / FALLA</th>
                    <th>ÁREA RESPONSABLE</th>
                    <th>RESPONSABLE REGISTRO</th>
                    <th>ESTADO</th>
                    <th>DEMORA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in filteredSapNotices" :key="s.id">
                    <td><b>{{ s.noticeNumber }}</b></td>
                    <td>{{ s.noticeDate }}</td>
                    <td class="eq-name">{{ s.equipmentName }}</td>
                    <td class="desc-cell">{{ s.description }}</td>
                    <td><span class="area-tag">{{ s.responsibleArea }}</span></td>
                    <td>{{ s.reporterName }} ({{ s.guard }})</td>
                    <td>
                      <span :class="['status-tag', s.status === 'Reportado' ? 'status-pending' : 'status-done']">
                        {{ s.status }}
                      </span>
                    </td>
                    <td>{{ s.delayDays }} días</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- Estado sin reportes -->
      <div v-else-if="!isUploading" class="empty-state-card card">
        <div class="empty-icon">📁</div>
        <h3>No hay reportes cargados aún</h3>
        <p>Haz clic en <b>"Subir Excel (.xlsm)"</b> para procesar el Reporte de Operaciones Quebrada Honda.</p>
        <button class="btn-upload margin-top" @click="triggerFileSelect">📤 Subir Reporte Excel</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../api';
import AppNavbar from '../components/AppNavbar.vue';

const fileInputRef = ref(null);
const isUploading = ref(false);
const availableMonths = ref([]);
const selectedMonthKey = ref('');
const dashboardData = ref(null);
const selectedDayReport = ref(null);
const activeTab = ref('tendencias');
const sapSearch = ref('');
const sapFilter = ref('ALL');

const uploadStatus = reactive({
  message: '',
  isSuccess: false
});

const getMonthName = (m) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[m - 1] || m;
};

const formatNumber = (val) => {
  if (val === null || val === undefined) return '0';
  return Math.round(val).toLocaleString('es-PE');
};

const loadAvailableMonths = async () => {
  try {
    const res = await api.get('/api/v1/reports/months');
    availableMonths.value = res.data;
    if (availableMonths.value.length > 0 && !selectedMonthKey.value) {
      const first = availableMonths.value[0];
      selectedMonthKey.value = `${first.year}-${first.month}`;
      await loadDashboardData(first.year, first.month);
    }
  } catch (err) {
    console.error("Error al cargar meses disponibles:", err);
    uploadStatus.message = "No se pudieron cargar datos históricos del servidor. Puedes subir un reporte Excel para iniciar.";
    uploadStatus.isSuccess = false;
  }
};

const loadDashboardData = async (year, month) => {
  try {
    const res = await api.get(`/api/v1/reports/dashboard?year=${year}&month=${month}`);
    dashboardData.value = res.data;
    if (dashboardData.value.dailyReports && dashboardData.value.dailyReports.length > 0) {
      selectedDayReport.value = dashboardData.value.dailyReports[0];
    }
  } catch (err) {
    console.error("Error al cargar dashboard data:", err);
  }
};

const onMonthChange = () => {
  if (!selectedMonthKey.value) return;
  const [year, month] = selectedMonthKey.value.split('-');
  loadDashboardData(year, month);
};

const triggerFileSelect = () => {
  fileInputRef.value.click();
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  isUploading.value = true;
  uploadStatus.message = '';

  try {
    const res = await api.post('/api/v1/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    uploadStatus.message = `Procesados ${res.data.daysProcessed} días y ${res.data.sapNoticesProcessed} avisos SAP exitosamente.`;
    uploadStatus.isSuccess = true;

    await loadAvailableMonths();
    if (res.data.year && res.data.month) {
      selectedMonthKey.value = `${res.data.year}-${res.data.month}`;
      await loadDashboardData(res.data.year, res.data.month);
    }
  } catch (err) {
    console.error("Error al subir archivo Excel:", err);
    uploadStatus.message = err.response?.data?.message || 'Error al procesar el archivo Excel.';
    uploadStatus.isSuccess = false;
  } finally {
    isUploading.value = false;
    event.target.value = '';
  }
};

// Cálculo de alturas para barras de producción en SVG/CSS
const maxDailyProd = computed(() => {
  if (!dashboardData.value || !dashboardData.value.dailyReports) return 50000;
  let max = 10000;
  dashboardData.value.dailyReports.forEach(d => {
    const tot = (d.dpArenasTotalDia || 0) + (d.dlArenasTotalDia || 0);
    if (tot > max) max = tot;
  });
  return max;
});

const getBarHeight = (val) => {
  if (!val) return 0;
  return Math.min(100, (val / maxDailyProd.value) * 100);
};

const getPolylinePoints = (field, minVal, maxVal) => {
  if (!dashboardData.value || !dashboardData.value.dailyReports) return '';
  const reports = dashboardData.value.dailyReports;
  const count = reports.length;
  if (count === 0) return '';

  const stepX = 960 / Math.max(1, count - 1);
  return reports.map((d, i) => {
    const x = 20 + i * stepX;
    const val = d[field] || minVal;
    const pct = (val - minVal) / (maxVal - minVal);
    const y = 180 - (Math.max(0, Math.min(1, pct)) * 160);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
};

const filteredSapNotices = computed(() => {
  if (!dashboardData.value || !dashboardData.value.sapNotices) return [];
  let list = dashboardData.value.sapNotices;

  if (sapFilter.value !== 'ALL') {
    list = list.filter(s => s.status === sapFilter.value);
  }

  if (sapSearch.value.trim()) {
    const q = sapSearch.value.toLowerCase();
    list = list.filter(s => 
      (s.equipmentName && s.equipmentName.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      (s.noticeNumber && s.noticeNumber.toLowerCase().includes(q)) ||
      (s.responsibleArea && s.responsibleArea.toLowerCase().includes(q))
    );
  }

  return list;
});

onMounted(loadAvailableMonths);
</script>

<style scoped>
.reporte-view {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 4rem;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-wrap {
  font-size: 2rem;
  background: #e0e7ff;
  padding: 0.6rem 0.75rem;
  border-radius: 14px;
}

h1 {
  font-size: 1.65rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.2rem 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #64748b;
  font-size: 0.88rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.month-selector-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.8rem;
  border-radius: 10px;
}

.month-select {
  border: none;
  background: transparent;
  font-weight: 700;
  color: #1e293b;
  outline: none;
  font-size: 0.9rem;
}

.btn-upload {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}
.btn-upload:hover { background: #4338ca; transform: translateY(-1px); }

/* Banner de estado */
.status-banner {
  padding: 0.85rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.status-banner.success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.status-banner.error   { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

/* Overlay de subida */
.uploading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.spinner-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
}
.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1.25rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Tarjetas KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.75rem;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.kpi-icon {
  font-size: 2.2rem;
  background: #f1f5f9;
  padding: 0.5rem;
  border-radius: 12px;
}
.kpi-info { display: flex; flex-direction: column; }
.kpi-label { font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.kpi-value { font-size: 1.4rem; font-weight: 900; color: #0f172a; margin: 0.1rem 0; }
.kpi-value small { font-size: 0.75rem; font-weight: 600; color: #64748b; }
.kpi-sub { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

/* Tabs */
.view-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}
.tab-btn {
  background: none;
  border: none;
  padding: 0.6rem 1.25rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.tab-btn.active {
  background: #4f46e5;
  color: white;
}

.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.margin-top { margin-top: 1.5rem; }

/* Gráficos de barras */
.card-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.card-header-inner h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
.legend-box { display: flex; gap: 1rem; font-size: 0.8rem; font-weight: 700; }
.legend-item { display: flex; align-items: center; gap: 0.4rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.legend-item.dp .dot { background: #4f46e5; }
.legend-item.dl .dot { background: #06b6d4; }
.legend-item.agua .dot { background: #3b82f6; }
.legend-item.presa .dot { background: #10b981; }

.bar-chart-container {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 220px;
  padding-top: 1rem;
  overflow-x: auto;
}
.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 24px;
  height: 100%;
}
.bar-stack {
  width: 100%;
  height: 180px;
  background: #f1f5f9;
  border-radius: 6px;
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
}
.bar-segment { width: 100%; transition: height 0.3s; }
.bar-segment.dp { background: #4f46e5; }
.bar-segment.dl { background: #06b6d4; }
.bar-label { font-size: 0.7rem; font-weight: 700; color: #64748b; margin-top: 0.3rem; }

/* Line Chart SVG */
.line-chart-container {
  position: relative;
  height: 200px;
}
.svg-chart { width: 100%; height: 170px; background: #f8fafc; border-radius: 10px; }
.svg-labels { display: flex; justify-content: space-between; padding: 0 0.5rem; font-size: 0.7rem; color: #64748b; font-weight: 700; }

/* Inspector por día */
.inspector-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.5rem;
}
.days-sidebar {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}
.days-sidebar h4 { margin: 0 0 1rem 0; color: #1e293b; }
.days-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}
.day-btn {
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}
.day-btn.active { background: #4f46e5; color: white; border-color: #4f46e5; }

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
}
.detail-header h2 { margin: 0; font-size: 1.25rem; color: #0f172a; }
.badge-total { background: #e0e7ff; color: #4338ca; padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: 800; font-size: 0.85rem; }

.detail-sections { display: flex; flex-direction: column; gap: 1.5rem; }
.section-box { background: #f8fafc; border-radius: 12px; padding: 1.25rem; border: 1px solid #e2e8f0; }
.section-box h5 { margin: 0 0 1rem 0; font-size: 0.95rem; color: #1e293b; }

.sub-table { width: 100%; border-collapse: collapse; }
.sub-table th, .sub-table td { padding: 0.6rem 0.8rem; text-align: left; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; }
.sub-table th { background: #e2e8f0; color: #475569; font-weight: 700; }
.highlight-val { font-weight: 800; color: #4f46e5; }

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.8rem;
}
.param-item { display: flex; flex-direction: column; background: white; padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0; }
.p-label { font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
.p-val { font-size: 0.9rem; font-weight: 800; color: #0f172a; margin-top: 0.2rem; }

.notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.note-box { background: white; padding: 0.9rem; border-radius: 8px; border: 1px solid #e2e8f0; }
.note-box h6 { margin: 0 0 0.5rem 0; font-size: 0.82rem; color: #4f46e5; text-transform: uppercase; }
.note-box p { margin: 0; font-size: 0.85rem; color: #334155; white-space: pre-line; }

/* Bitácora SAP */
.sap-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.search-input { padding: 0.5rem 1rem 0.5rem 2rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; width: 260px; outline: none; }
.search-box { position: relative; }
.search-icon { position: absolute; left: 0.6rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.filter-chips { display: flex; gap: 0.4rem; }
.chip { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 0.4rem 0.85rem; border-radius: 20px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
.chip.active { background: #1e293b; color: white; border-color: #1e293b; }

.table-wrapper { overflow-x: auto; }
.sap-table { width: 100%; border-collapse: collapse; }
.sap-table th, .sap-table td { padding: 0.75rem 0.9rem; font-size: 0.85rem; border-bottom: 1px solid #f1f5f9; text-align: left; }
.sap-table th { background: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 0.72rem; }
.eq-name { font-weight: 700; color: #0f172a; }
.desc-cell { max-width: 250px; }
.area-tag { background: #e0e7ff; color: #3730a3; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
.status-tag { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 800; }
.status-pending { background: #fef2f2; color: #dc2626; }
.status-done    { background: #ecfdf5; color: #059669; }

.empty-state-card { text-align: center; padding: 4rem 2rem; color: #64748b; }
.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }

@media (max-width: 900px) {
  .inspector-layout { grid-template-columns: 1fr; }
  .notes-grid { grid-template-columns: 1fr; }
}
</style>
