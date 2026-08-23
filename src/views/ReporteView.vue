<template>
  <div class="reporte-view">
    <AppNavbar />

    <div class="page-container">
      <!-- Encabezado de la página -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">📊</div>
          <div>
            <h1>Reporte de Producción de Arenas</h1>
            <p class="subtitle">Producción en Dique Principal (DP) y Dique Lateral (DL) por Turno A (Día) y Turno B (Noche)</p>
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

          <!-- Botón Eliminar Mes -->
          <button v-if="selectedMonthKey" class="btn-delete-month" @click="deleteSelectedMonthReport" title="Eliminar reporte del mes seleccionado">
            <span>🗑️ Eliminar Mes</span>
          </button>

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
          <p>Procesando archivo Excel y tabulando partes diarios de producción...</p>
        </div>
      </div>

      <!-- Dashboard de Producción -->
      <div v-if="dashboardData" class="dashboard-content">

        <!-- TARJETAS DE KPIS PRINCIPALES DE PRODUCCIÓN -->
        <div class="kpi-grid">
          <!-- 1. Dique Principal -->
          <div class="kpi-card primary">
            <div class="kpi-icon">🏗️</div>
            <div class="kpi-info">
              <span class="kpi-label">Dique Principal (DP)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalDpArenas) }} <small>TM</small></span>
              <span class="kpi-sub">
                ☀️ <b>A:</b> {{ formatNumber(dashboardData.totalDpArenasA) }} | 🌙 <b>B:</b> {{ formatNumber(dashboardData.totalDpArenasB) }} TM
              </span>
            </div>
          </div>

          <!-- 2. Dique Lateral -->
          <div class="kpi-card info">
            <div class="kpi-icon">📐</div>
            <div class="kpi-info">
              <span class="kpi-label">Dique Lateral (DL)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalDlArenas) }} <small>TM</small></span>
              <span class="kpi-sub">
                ☀️ <b>A:</b> {{ formatNumber(dashboardData.totalDlArenasA) }} | 🌙 <b>B:</b> {{ formatNumber(dashboardData.totalDlArenasB) }} TM
              </span>
            </div>
          </div>

          <!-- 3. Total Turno A -->
          <div class="kpi-card warning">
            <div class="kpi-icon">☀️</div>
            <div class="kpi-info">
              <span class="kpi-label">Total Turno A (Día)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasA) }} <small>TM</small></span>
              <span class="kpi-sub">DP: {{ formatNumber(dashboardData.totalDpArenasA) }} | DL: {{ formatNumber(dashboardData.totalDlArenasA) }}</span>
            </div>
          </div>

          <!-- 4. Total Turno B -->
          <div class="kpi-card night">
            <div class="kpi-icon">🌙</div>
            <div class="kpi-info">
              <span class="kpi-label">Total Turno B (Noche)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasB) }} <small>TM</small></span>
              <span class="kpi-sub">DP: {{ formatNumber(dashboardData.totalDpArenasB) }} | DL: {{ formatNumber(dashboardData.totalDlArenasB) }}</span>
            </div>
          </div>

          <!-- 5. Producción Total Mes -->
          <div class="kpi-card success-card">
            <div class="kpi-icon">📦</div>
            <div class="kpi-info">
              <span class="kpi-label">Producción Total Mes</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasMes) }} <small>TM Secas</small></span>
              <span class="kpi-sub">Acumulado combinado DP + DL</span>
            </div>
          </div>
        </div>

        <!-- NAVEGACIÓN ENTRE VISTAS DEL DASHBOARD -->
        <div class="view-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'matrix' }]" 
            @click="activeTab = 'matrix'"
          >
            📋 Matriz Mensual de Producción (Día 01 - 31)
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'chart' }]" 
            @click="activeTab = 'chart'"
          >
            📊 Comparativo Visual (Turno A vs B)
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'inspector' }]" 
            @click="activeTab = 'inspector'"
          >
            📑 Detalle Diario por Fecha
          </button>
        </div>

        <!-- TAB 1: MATRIZ MENSUAL COMPLETA DE PRODUCCIÓN -->
        <div v-if="activeTab === 'matrix'" class="tab-pane">
          <div class="card table-card">
            <div class="card-header-inner">
              <div>
                <h3>📋 Tabla Mensual de Producción de Arenas</h3>
                <p class="table-sub-desc">Desglose en TM Secas para Dique Principal (DP) y Dique Lateral (DL) en Turnos A (Día) y B (Noche)</p>
              </div>
              <span class="badge-days-count">{{ dashboardData.dailyReports ? dashboardData.dailyReports.length : 0 }} Días del Mes Registrados</span>
            </div>

            <div class="table-wrapper-responsive">
              <table class="prod-matrix-table">
                <thead>
                  <tr class="header-group-row">
                    <th colspan="2" class="hdr-group date-hdr">FECHA DE OPERACIÓN</th>
                    <th colspan="3" class="hdr-group dp-hdr">DIQUE PRINCIPAL (DP)</th>
                    <th colspan="3" class="hdr-group dl-hdr">DIQUE LATERAL (DL)</th>
                    <th colspan="3" class="hdr-group tot-hdr">TOTAL PRODUCCIÓN ARENAS</th>
                    <th class="hdr-group act-hdr">ACCIÓN</th>
                  </tr>
                  <tr class="header-sub-row">
                    <th class="col-num">Nº</th>
                    <th class="col-date">FECHA</th>
                    <th class="col-val dp-col">TURNO A (TM)</th>
                    <th class="col-val dp-col">TURNO B (TM)</th>
                    <th class="col-val dp-tot-col">TOTAL DP (TM)</th>
                    <th class="col-val dl-col">TURNO A (TM)</th>
                    <th class="col-val dl-col">TURNO B (TM)</th>
                    <th class="col-val dl-tot-col">TOTAL DL (TM)</th>
                    <th class="col-val tot-a-col">TOTAL TURNO A</th>
                    <th class="col-val tot-b-col">TOTAL TURNO B</th>
                    <th class="col-val grand-tot-col">TOTAL DÍA (TM)</th>
                    <th class="col-act">EDITAR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in dashboardData.dailyReports" :key="d.id" :class="['row-daily', { 'row-empty-warning': isRowEmpty(d) }]">
                    <td class="cell-num"><b>{{ d.dayNumber < 10 ? '0' + d.dayNumber : d.dayNumber }}</b></td>
                    <td class="cell-date">
                      {{ d.reportDate }}
                      <span v-if="isRowEmpty(d)" class="empty-badge" title="Día sin datos en el reporte Excel">⚠️ Sin Registro</span>
                    </td>
                    
                    <!-- DP -->
                    <td class="cell-val dp-a">{{ formatNumber(d.dpArenasGuardiaA) }}</td>
                    <td class="cell-val dp-b">{{ formatNumber(d.dpArenasGuardiaB) }}</td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(d.dpArenasTotalDia) }}</b></td>
                    
                    <!-- DL -->
                    <td class="cell-val dl-a">{{ formatNumber(d.dlArenasGuardiaA) }}</td>
                    <td class="cell-val dl-b">{{ formatNumber(d.dlArenasGuardiaB) }}</td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(d.dlArenasTotalDia) }}</b></td>
                    
                    <!-- Totales Combinados por Turno y Día -->
                    <td class="cell-val tot-a"><b>{{ formatNumber((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0)) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0)) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(d.totalArenasDia) }}</b></td>
                    
                    <!-- Botón Editar -->
                    <td class="cell-act">
                      <button class="btn-edit-row" @click="openEditModal(d)" title="Modificar manualmente valores del día">
                        ✏️
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="summary-foot-row total-row">
                    <td colspan="2" class="foot-label"><b>TOTAL ACUMULADO MES</b></td>
                    <td class="cell-val dp-a"><b>{{ formatNumber(dashboardData.totalDpArenasA) }}</b></td>
                    <td class="cell-val dp-b"><b>{{ formatNumber(dashboardData.totalDpArenasB) }}</b></td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(dashboardData.totalDpArenas) }}</b></td>
                    <td class="cell-val dl-a"><b>{{ formatNumber(dashboardData.totalDlArenasA) }}</b></td>
                    <td class="cell-val dl-b"><b>{{ formatNumber(dashboardData.totalDlArenasB) }}</b></td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(dashboardData.totalDlArenas) }}</b></td>
                    <td class="cell-val tot-a"><b>{{ formatNumber(dashboardData.totalArenasA) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber(dashboardData.totalArenasB) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(dashboardData.totalArenasMes) }}</b></td>
                    <td></td>
                  </tr>
                  <tr class="summary-foot-row avg-row">
                    <td colspan="2" class="foot-label"><b>PROMEDIO DIARIO</b></td>
                    <td class="cell-val dp-a">{{ formatAvg(dashboardData.totalDpArenasA) }}</td>
                    <td class="cell-val dp-b">{{ formatAvg(dashboardData.totalDpArenasB) }}</td>
                    <td class="cell-val dp-tot">{{ formatAvg(dashboardData.totalDpArenas) }}</td>
                    <td class="cell-val dl-a">{{ formatAvg(dashboardData.totalDlArenasA) }}</td>
                    <td class="cell-val dl-b">{{ formatAvg(dashboardData.totalDlArenasB) }}</td>
                    <td class="cell-val dl-tot">{{ formatAvg(dashboardData.totalDlArenas) }}</td>
                    <td class="cell-val tot-a">{{ formatAvg(dashboardData.totalArenasA) }}</td>
                    <td class="cell-val tot-b">{{ formatAvg(dashboardData.totalArenasB) }}</td>
                    <td class="cell-val grand-tot">{{ formatAvg(dashboardData.totalArenasMes) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: COMPARATIVO VISUAL (BARRAS A VS B) -->
        <div v-if="activeTab === 'chart'" class="tab-pane">
          <div class="card chart-card">
            <div class="card-header-inner">
              <div>
                <h3>📊 Comparativo Diario: Turno A vs Turno B</h3>
                <p class="table-sub-desc">Contribución de producción (TM Secas) por guardia en Dique Principal y Dique Lateral</p>
              </div>
              <div class="legend-box">
                <span class="legend-item ta"><span class="dot"></span> Turno A (Día)</span>
                <span class="legend-item tb"><span class="dot"></span> Turno B (Noche)</span>
              </div>
            </div>

            <div class="bar-chart-container">
              <div 
                v-for="d in dashboardData.dailyReports" 
                :key="d.id" 
                class="chart-bar-group"
                :title="`Día ${d.dayNumber}: Turno A=${formatNumber((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0))}, Turno B=${formatNumber((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0))} TM`"
              >
                <div class="bar-stack">
                  <div 
                    class="bar-segment tb" 
                    :style="{ height: getBarHeight((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0)) + '%' }"
                  ></div>
                  <div 
                    class="bar-segment ta" 
                    :style="{ height: getBarHeight((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0)) + '%' }"
                  ></div>
                </div>
                <span class="bar-label">{{ d.dayNumber }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: INSPECTOR DE DETALLE DIARIO -->
        <div v-if="activeTab === 'inspector'" class="tab-pane">
          <div class="inspector-layout">
            <!-- Sidebar selector de días -->
            <div class="days-sidebar">
              <h4>Días del Mes</h4>
              <div class="days-grid">
                <button 
                  v-for="d in dashboardData.dailyReports" 
                  :key="d.id" 
                  :class="['day-btn', { active: selectedDayReport?.id === d.id, 'btn-missing': isRowEmpty(d) }]"
                  @click="selectedDayReport = d"
                >
                  {{ d.dayNumber < 10 ? '0' + d.dayNumber : d.dayNumber }}
                </button>
              </div>
            </div>

            <!-- Detalle del día seleccionado -->
            <div v-if="selectedDayReport" class="day-detail-card card">
              <div class="detail-header">
                <div>
                  <h2>Parte Diario: {{ selectedDayReport.reportDate }} (Día {{ selectedDayReport.dayNumber }})</h2>
                  <span v-if="isRowEmpty(selectedDayReport)" class="warning-text">⚠️ Este día no tuvo datos registrados en el libro Excel. Puedes completarlo haciendo clic en "Editar Registro".</span>
                </div>
                <div class="header-right-btns">
                  <span class="badge-total">Producción Total: {{ formatNumber(selectedDayReport.totalArenasDia) }} TM</span>
                  <button class="btn-edit-header" @click="openEditModal(selectedDayReport)">✏️ Editar Registro</button>
                </div>
              </div>

              <!-- Grilla de producción del día -->
              <div class="detail-sections">
                <div class="section-box full-width">
                  <h5>🏗️ Producción de Arenas por Sector y Turnos</h5>
                  <table class="sub-table">
                    <thead>
                      <tr>
                        <th>Sector / Dique</th>
                        <th>☀️ Turno A (Guardia Día)</th>
                        <th>🌙 Turno B (Guardia Noche)</th>
                        <th>Total Día (TM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>Dique Principal (DP)</b></td>
                        <td>{{ formatNumber(selectedDayReport.dpArenasGuardiaA) }} TM</td>
                        <td>{{ formatNumber(selectedDayReport.dpArenasGuardiaB) }} TM</td>
                        <td class="highlight-val">{{ formatNumber(selectedDayReport.dpArenasTotalDia) }} TM</td>
                      </tr>
                      <tr>
                        <td><b>Dique Lateral (DL)</b></td>
                        <td>{{ formatNumber(selectedDayReport.dlArenasGuardiaA) }} TM</td>
                        <td>{{ formatNumber(selectedDayReport.dlArenasGuardiaB) }} TM</td>
                        <td class="highlight-val">{{ formatNumber(selectedDayReport.dlArenasTotalDia) }} TM</td>
                      </tr>
                      <tr class="row-total-sub">
                        <td><b>TOTAL COMBINADO</b></td>
                        <td><b>{{ formatNumber((selectedDayReport.dpArenasGuardiaA || 0) + (selectedDayReport.dlArenasGuardiaA || 0)) }} TM</b></td>
                        <td><b>{{ formatNumber((selectedDayReport.dpArenasGuardiaB || 0) + (selectedDayReport.dlArenasGuardiaB || 0)) }} TM</b></td>
                        <td class="highlight-val grand"><b>{{ formatNumber(selectedDayReport.totalArenasDia) }} TM</b></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Estado sin reportes -->
      <div v-else-if="!isUploading" class="empty-state-card card">
        <div class="empty-icon">📁</div>
        <h3>No hay reportes de producción cargados aún</h3>
        <p>Haz clic en <b>"Subir Excel (.xlsm)"</b> para procesar el Reporte de Operaciones Quebrada Honda.</p>
        <button class="btn-upload margin-top" @click="triggerFileSelect">📤 Subir Reporte Excel</button>
      </div>

    </div>

    <!-- MODAL EDITAR / COMPLETAR PRODUCCIÓN DEL DÍA -->
    <div v-if="showEditModal" class="modal-backdrop" @click.self="showEditModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>✏️ Editar Producción del Día: {{ editForm.reportDate }} (Día {{ editForm.dayNumber }})</h3>
          <button class="btn-close" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-sub-desc">Ingresa o corrige la producción en TM Secas para cada dique y turno:</p>

          <!-- Sección DP -->
          <div class="edit-section-box blue">
            <h4>🏗️ Dique Principal (DP)</h4>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">☀️ Turno A (Día) - TM:</label>
                <input type="number" v-model.number="editForm.dpArenasGuardiaA" class="form-input" min="0" step="any" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">🌙 Turno B (Noche) - TM:</label>
                <input type="number" v-model.number="editForm.dpArenasGuardiaB" class="form-input" min="0" step="any" placeholder="0" />
              </div>
            </div>
            <div class="sub-total-row">
              <span>Total DP Día: <b>{{ formatNumber((editForm.dpArenasGuardiaA || 0) + (editForm.dpArenasGuardiaB || 0)) }} TM</b></span>
            </div>
          </div>

          <!-- Sección DL -->
          <div class="edit-section-box green">
            <h4>📐 Dique Lateral (DL)</h4>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">☀️ Turno A (Día) - TM:</label>
                <input type="number" v-model.number="editForm.dlArenasGuardiaA" class="form-input" min="0" step="any" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">🌙 Turno B (Noche) - TM:</label>
                <input type="number" v-model.number="editForm.dlArenasGuardiaB" class="form-input" min="0" step="any" placeholder="0" />
              </div>
            </div>
            <div class="sub-total-row">
              <span>Total DL Día: <b>{{ formatNumber((editForm.dlArenasGuardiaA || 0) + (editForm.dlArenasGuardiaB || 0)) }} TM</b></span>
            </div>
          </div>

          <!-- Resumen Gran Total -->
          <div class="grand-total-summary-card">
            <div class="gt-title">📦 Gran Total Producción Día (DP + DL)</div>
            <div class="gt-value">{{ formatNumber((editForm.dpArenasGuardiaA || 0) + (editForm.dpArenasGuardiaB || 0) + (editForm.dlArenasGuardiaA || 0) + (editForm.dlArenasGuardiaB || 0)) }} <small>TM Secas</small></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">Cancelar</button>
          <button class="btn-save-edit" :disabled="savingEdit" @click="saveDailyReportEdit">
            <span v-if="savingEdit">Guardando...</span>
            <span v-else>💾 Guardar Producción</span>
          </button>
        </div>
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
const activeTab = ref('matrix');

// Modal de edición
const showEditModal = ref(false);
const savingEdit = ref(false);
const editForm = reactive({
  id: null,
  reportDate: '',
  dayNumber: 0,
  dpArenasGuardiaA: 0,
  dpArenasGuardiaB: 0,
  dlArenasGuardiaA: 0,
  dlArenasGuardiaB: 0
});

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

const formatAvg = (totalVal) => {
  if (!dashboardData.value || !dashboardData.value.dailyReports || dashboardData.value.dailyReports.length === 0) return '0';
  const count = dashboardData.value.dailyReports.length;
  return Math.round((totalVal || 0) / count).toLocaleString('es-PE');
};

const isRowEmpty = (d) => {
  if (!d) return true;
  const tot = (d.dpArenasGuardiaA || 0) + (d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaA || 0) + (d.dlArenasGuardiaB || 0);
  return tot === 0;
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

const deleteSelectedMonthReport = async () => {
  if (!selectedMonthKey.value) return;
  const [year, month] = selectedMonthKey.value.split('-');
  const monthName = getMonthName(parseInt(month));

  if (!confirm(`¿Estás seguro de eliminar todo el reporte cargado de ${monthName} ${year}?\n\nEsta acción borrará las partes diarias de producción de dicho mes.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/v1/reports?year=${year}&month=${month}`);
    uploadStatus.message = res.data.message || `Reporte de ${monthName} ${year} eliminado.`;
    uploadStatus.isSuccess = true;
    dashboardData.value = null;
    selectedMonthKey.value = '';
    await loadAvailableMonths();
  } catch (err) {
    console.error("Error al eliminar reporte:", err);
    uploadStatus.message = err.response?.data?.message || 'Error al eliminar el reporte del mes.';
    uploadStatus.isSuccess = false;
  }
};

const openEditModal = (d) => {
  editForm.id = d.id;
  editForm.reportDate = d.reportDate;
  editForm.dayNumber = d.dayNumber;
  editForm.dpArenasGuardiaA = d.dpArenasGuardiaA || 0;
  editForm.dpArenasGuardiaB = d.dpArenasGuardiaB || 0;
  editForm.dlArenasGuardiaA = d.dlArenasGuardiaA || 0;
  editForm.dlArenasGuardiaB = d.dlArenasGuardiaB || 0;
  showEditModal.value = true;
};

const saveDailyReportEdit = async () => {
  if (!editForm.id) return;
  savingEdit.value = true;
  try {
    await api.put(`/api/v1/reports/daily/${editForm.id}`, {
      dpArenasGuardiaA: editForm.dpArenasGuardiaA || 0,
      dpArenasGuardiaB: editForm.dpArenasGuardiaB || 0,
      dlArenasGuardiaA: editForm.dlArenasGuardiaA || 0,
      dlArenasGuardiaB: editForm.dlArenasGuardiaB || 0
    });

    uploadStatus.message = `Producción del día ${editForm.dayNumber} ( ${editForm.reportDate} ) actualizada correctamente.`;
    uploadStatus.isSuccess = true;
    showEditModal.value = false;

    if (selectedMonthKey.value) {
      const [year, month] = selectedMonthKey.value.split('-');
      await loadDashboardData(year, month);
    }
  } catch (err) {
    console.error("Error al actualizar producción del día:", err);
    uploadStatus.message = err.response?.data?.message || 'Error al guardar cambios de producción.';
    uploadStatus.isSuccess = false;
  } finally {
    savingEdit.value = false;
  }
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
    const res = await api.post('/api/v1/reports/upload', formData);

    uploadStatus.message = `Procesados ${res.data.daysProcessed} días de producción exitosamente.`;
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

const maxDailyProd = computed(() => {
  if (!dashboardData.value || !dashboardData.value.dailyReports) return 50000;
  let max = 10000;
  dashboardData.value.dailyReports.forEach(d => {
    const tot = (d.totalArenasDia || 0);
    if (tot > max) max = tot;
  });
  return max;
});

const getBarHeight = (val) => {
  if (!val) return 0;
  return Math.min(100, (val / maxDailyProd.value) * 100);
};

onMounted(loadAvailableMonths);
</script>

<style scoped>
.reporte-view {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 4rem;
}

.page-container {
  max-width: 1440px;
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

.btn-delete-month {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete-month:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
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
  border: 4px solid #cbd5e1;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1.25rem auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Grid de KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease;
}
.kpi-card:hover { transform: translateY(-2px); }

.kpi-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}
.kpi-card.primary .kpi-icon { background: #e0e7ff; color: #4338ca; }
.kpi-card.info .kpi-icon { background: #dcfce7; color: #15803d; }
.kpi-card.warning .kpi-icon { background: #fef08a; color: #854d0e; }
.kpi-card.night .kpi-icon { background: #ede9fe; color: #6d28d9; }
.kpi-card.success-card .kpi-icon { background: #d1fae5; color: #047857; }

.kpi-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.kpi-label { font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.kpi-value { font-size: 1.35rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
.kpi-value small { font-size: 0.75rem; font-weight: 700; color: #64748b; }
.kpi-sub { font-size: 0.72rem; color: #475569; font-weight: 600; }

/* Tabs de navegación */
.view-tabs {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.4rem;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn.active {
  background: #4f46e5;
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 1.5rem;
}

.card-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-header-inner h3 {
  margin: 0 0 0.2rem 0;
  font-size: 1.1rem;
  color: #0f172a;
  font-weight: 800;
}

.table-sub-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
}

.badge-days-count {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 800;
}

/* Matriz de Producción */
.table-wrapper-responsive {
  overflow-x: auto;
}

.prod-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.prod-matrix-table th, .prod-matrix-table td {
  padding: 0.55rem 0.65rem;
  border: 1px solid #cbd5e1;
  text-align: right;
  vertical-align: middle;
}

.header-group-row th {
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.03em;
  padding: 0.6rem 0.5rem;
}

.date-hdr { background: #f1f5f9; color: #334155; }
.dp-hdr { background: #eff6ff; color: #1e40af; border-bottom-color: #bfdbfe; }
.dl-hdr { background: #f0fdf4; color: #166534; border-bottom-color: #bbf7d0; }
.tot-hdr { background: #faf5ff; color: #6b21a8; border-bottom-color: #e9d5ff; }
.act-hdr { background: #f8fafc; color: #475569; width: 60px; }

.header-sub-row th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
  text-align: center;
}

.col-num { width: 35px; text-align: center !important; }
.col-date { width: 110px; text-align: center !important; }
.col-act { width: 50px; text-align: center !important; }

.row-daily:hover { background: #f8fafc; }
.row-empty-warning { background: #fffbe6; }

.empty-badge {
  display: block;
  font-size: 0.65rem;
  color: #d97706;
  font-weight: 800;
  margin-top: 0.15rem;
}

.cell-num { text-align: center !important; color: #64748b; font-size: 0.78rem; }
.cell-date { text-align: center !important; font-weight: 600; color: #334155; }
.cell-act { text-align: center !important; }

.btn-edit-row {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.25rem 0.45rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s ease;
}
.btn-edit-row:hover {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.dp-a, .dp-b { color: #1e3a8a; }
.dp-tot { background: #eff6ff; color: #1e40af; }

.dl-a, .dl-b { color: #14532d; }
.dl-tot { background: #f0fdf4; color: #166534; }

.tot-a, .tot-b { color: #581c87; }
.grand-tot { background: #faf5ff; color: #6b21a8; font-size: 0.86rem; }

.summary-foot-row td {
  border-top: 2px solid #94a3b8;
  font-size: 0.83rem;
}
.total-row { background: #f1f5f9; }
.avg-row { background: #ffffff; }

.foot-label { text-align: left !important; color: #0f172a; padding-left: 0.8rem !important; }

/* Charts Visuales */
.legend-box { display: flex; gap: 1rem; }
.legend-item { font-size: 0.78rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 0.35rem; }
.legend-item .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.legend-item.ta .dot { background: #eab308; }
.legend-item.tb .dot { background: #6366f1; }

.bar-chart-container {
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  height: 220px;
  padding-top: 1rem;
  overflow-x: auto;
  border-bottom: 2px solid #e2e8f0;
}

.chart-bar-group {
  flex: 1;
  min-width: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.bar-stack {
  width: 100%;
  max-width: 22px;
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  background: #f1f5f9;
}

.bar-segment.ta { background: #eab308; }
.bar-segment.tb { background: #6366f1; }
.bar-label { font-size: 0.65rem; color: #64748b; font-weight: 700; margin-top: 0.35rem; }

/* Inspector por dia */
.inspector-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
}

.days-sidebar {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
}
.days-sidebar h4 { margin: 0 0 1rem 0; font-size: 0.9rem; color: #0f172a; }

.days-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
}

.day-btn {
  padding: 0.45rem 0.2rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.78rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}
.day-btn.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}
.day-btn.btn-missing {
  border-color: #fcd34d;
  background: #fffbe6;
  color: #b45309;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.detail-header h2 { margin: 0 0 0.2rem 0; font-size: 1.15rem; color: #0f172a; }
.warning-text { font-size: 0.78rem; color: #d97706; font-weight: 700; }

.header-right-btns {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-edit-header {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-edit-header:hover { background: #4338ca; }

.badge-total { background: #dcfce7; color: #15803d; padding: 0.35rem 0.8rem; border-radius: 20px; font-weight: 800; font-size: 0.85rem; }

.detail-sections { display: flex; flex-direction: column; gap: 1.25rem; }
.section-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
.section-box h5 { margin: 0 0 0.85rem 0; font-size: 0.95rem; color: #1e293b; }

.sub-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.sub-table th, .sub-table td { padding: 0.6rem 0.8rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
.highlight-val { color: #4338ca; font-weight: 800; }
.highlight-val.grand { color: #15803d; font-size: 0.95rem; }

.row-total-sub { background: #eff6ff; }

/* Modal de Edición */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  backdrop-filter: blur(4px);
}
.modal-dialog {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalIn 0.2s ease-out;
}
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.modal-header h3 { margin: 0; font-size: 1.05rem; color: #0f172a; font-weight: 800; }
.btn-close { background: none; border: none; font-size: 1.2rem; color: #64748b; cursor: pointer; }

.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.modal-sub-desc { font-size: 0.82rem; color: #64748b; margin: 0 0 0.5rem 0; }

.edit-section-box {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
}
.edit-section-box.blue { background: #eff6ff; border-color: #bfdbfe; }
.edit-section-box.green { background: #f0fdf4; border-color: #bbf7d0; }

.edit-section-box h4 { margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #1e293b; }

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-label { font-size: 0.78rem; font-weight: 700; color: #475569; }
.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  outline: none;
}
.form-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); }

.sub-total-row {
  margin-top: 0.6rem;
  text-align: right;
  font-size: 0.82rem;
  color: #334155;
}

.grand-total-summary-card {
  background: #faf5ff;
  border: 1px dashed #c084fc;
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
}
.gt-title { font-size: 0.8rem; font-weight: 800; color: #6b21a8; text-transform: uppercase; }
.gt-value { font-size: 1.4rem; font-weight: 800; color: #581c87; margin-top: 0.2rem; }
.gt-value small { font-size: 0.8rem; color: #7e22ce; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}
.btn-cancel { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
.btn-save-edit { background: #10b981; color: white; border: none; padding: 0.55rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
.btn-save-edit:hover { background: #059669; }

.empty-state-card { text-align: center; padding: 4rem 2rem; color: #64748b; }
.empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
.margin-top { margin-top: 1rem; }

@media (max-width: 1024px) {
  .inspector-layout { grid-template-columns: 1fr; }
  .days-grid { grid-template-columns: repeat(8, 1fr); }
}
</style>
