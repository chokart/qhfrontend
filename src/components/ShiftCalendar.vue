<template>
  <div class="shift-calendar-container">
    <!-- Header de Control de Turnos -->
    <div class="calendar-controls">
      <!-- Selector de Modo de Consulta -->
      <div class="mode-switch-bar">
        <button 
          :class="['mode-tab-btn', { active: dateSelectionMode === 'month' }]"
          @click="dateSelectionMode = 'month'"
        >
          📅 Consulta por Mes
        </button>
        <button 
          :class="['mode-tab-btn', { active: dateSelectionMode === 'range' }]"
          @click="dateSelectionMode = 'range'"
        >
          🗓️ Rango de Fechas
        </button>
      </div>

      <!-- Selector de Meses -->
      <div v-if="dateSelectionMode === 'month'" class="month-selector">
        <button 
          v-for="m in monthOptions" 
          :key="m.value"
          :class="['month-btn', { active: currentMonth === m.value }]"
          @click="currentMonth = m.value"
        >
          {{ m.label }}
        </button>
      </div>

      <!-- Selector de Rango Personalizado -->
      <div v-else class="range-inputs-group">
        <div class="input-date-item">
          <label>Desde:</label>
          <input type="date" v-model="rangeStartDate" class="control-date-input" />
        </div>
        <div class="input-date-item">
          <label>Hasta:</label>
          <input type="date" v-model="rangeEndDate" class="control-date-input" />
        </div>
        <button @click="fetchMatrix" class="btn-fetch-range">
          🔍 Consultar
        </button>
      </div>

      <div class="filter-controls">
        <!-- Selector de Filtro de Turno (Día vs Noche) -->
        <select v-model="selectedShiftFilter" class="control-select-shift" title="Filtrar personal por turno">
          <option value="ALL">📋 Todos los Turnos</option>
          <option value="DIA">☀️ Turno Día (incluye Vacaciones y DM)</option>
          <option value="NOCHE">🌙 Turno Noche (incluye Vacaciones y DM)</option>
        </select>

        <!-- Selector Multiselección de Guardias -->
        <div class="multi-select-container" ref="multiSelectContainerRef">
          <button class="multi-select-trigger" @click.stop="showGroupDropdown = !showGroupDropdown">
            <span v-if="selectedGroupIds.length === 0">Todas las Guardias ({{ groups.length }})</span>
            <span v-else-if="selectedGroupIds.length === 1">1 Guardia Seleccionada</span>
            <span v-else>{{ selectedGroupIds.length }} Guardias Seleccionadas</span>
            <span class="dropdown-arrow">▼</span>
          </button>

          <div v-if="showGroupDropdown" class="multi-select-dropdown" @click.stop>
            <div class="dropdown-actions">
              <button class="btn-select-all" @click="selectAllGroups">Seleccionar Todas</button>
              <button class="btn-clear-all" @click="clearAllGroups">Limpiar Todo</button>
            </div>
            <div class="dropdown-options-list">
              <label 
                v-for="g in groups" 
                :key="g.id" 
                class="dropdown-checkbox-label"
              >
                <input 
                  type="checkbox" 
                  :value="g.id" 
                  v-model="selectedGroupIds"
                />
                <span class="badge-dot" :style="{ backgroundColor: g.color || '#94a3b8' }"></span>
                <span class="group-option-name">{{ g.name }} ({{ g.programType || 'Rotación' }})</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Buscador de Operador -->
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar operador o código..." 
            class="control-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">✕</button>
        </div>

        <!-- Botón Exportar PDF -->
        <button @click="exportToPDF" class="btn-export-pdf" :disabled="loading || filteredOperators.length === 0">
          📄 Exportar PDF
        </button>

        <button @click="$emit('openGroupManager')" class="btn-config-groups">
          ⚙️ Guardias
        </button>
      </div>
    </div>

    <!-- Leyenda de Estados de Turno -->
    <div class="shift-legend">
      <div class="legend-badge shift-d"><span>☀️</span> <b>D</b> - Turno Día</div>
      <div class="legend-badge shift-n"><span>🌙</span> <b>N</b> - Turno Noche</div>
      <div class="legend-badge shift-l"><span>🏖️</span> <b>L</b> - Día Libre</div>
      <div class="legend-badge shift-v"><span>🌴</span> <b>V</b> - Vacaciones</div>
      <div class="legend-badge shift-st-d"><span>☀️⏰</span> <b>ST-D</b> - Sobretiempo Día</div>
      <div class="legend-badge shift-st-n"><span>🌙⏰</span> <b>ST-N</b> - Sobretiempo Noche</div>
      <div class="legend-badge shift-dm"><span>🩺</span> <b>DM</b> - Descanso Médico</div>
    </div>

    <!-- Estado de Carga -->
    <div v-if="loading" class="calendar-loading">
      <div class="spinner"></div>
      <p>Calculando programación de turnos...</p>
    </div>

    <!-- Matriz Cuadrícula de Turnos -->
    <div v-else class="matrix-wrapper">
      <table class="shift-matrix-table">
        <thead>
          <tr>
            <th class="sticky-col col-code-hdr">CÓDIGO</th>
            <th class="sticky-col col-name-hdr">NOMBRES Y APELLIDOS</th>
            <th class="sticky-col col-guardia-hdr">GUARDIA</th>
            <th 
              v-for="d in calendarDays" 
              :key="d.key" 
              :class="['col-day', { 'weekend-header': d.isWeekend }]"
            >
              <div class="day-num">{{ d.dayNum }}</div>
              <div class="day-name">{{ d.dayName }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="op in filteredOperators" :key="op.operatorId">
            <!-- Columna 1: CÓDIGO -->
            <td class="sticky-col col-code-cell">
              <span v-if="op.code" class="op-code-tag">{{ op.code }}</span>
              <span v-else class="no-code-tag">-</span>
            </td>
            <!-- Columna 2: NOMBRE COMPLETO -->
            <td class="sticky-col col-name-cell">
              <div class="name-cell-inner">
                <span class="op-name" :title="op.name">{{ op.name }}</span>
                <span v-if="op.onlyDayShift" class="sun-icon-inline" title="Operador en modalidad Solo Día (convierte turnos Noche 'N' a Día 'D')">☀️</span>
              </div>
            </td>
            <!-- Columna 3: GUARDIA -->
            <td class="sticky-col col-guardia-cell">
              <span 
                class="op-guardia-tag" 
                :style="{ backgroundColor: op.groupColor || '#94a3b8' }"
              >
                {{ op.groupName }}
              </span>
            </td>

            <!-- Celdas de Turnos para cada día -->
            <td 
              v-for="d in calendarDays" 
              :key="d.key" 
              class="col-shift-cell"
              @click="openOverrideModal(op, d.dayNum)"
            >
              <div 
                :class="[
                  'shift-cell-badge',
                  getShiftClass(op.shifts ? op.shifts[d.key] : null),
                  { 'is-override': op.isOverride && op.isOverride[d.key] }
                ]"
                :title="op.comments && op.comments[d.key] ? op.comments[d.key] : `Día ${d.dayNum}: ${getShiftLabel(op.shifts ? op.shifts[d.key] : null)}`"
              >
                {{ op.shifts ? op.shifts[d.key] || 'L' : 'L' }}
              </div>
            </td>
          </tr>
        </tbody>
        <!-- Fila de Resumen Diario de Cobertura -->
        <tfoot>
          <tr class="summary-row">
            <td colspan="3" class="sticky-col col-operator summary-label">
              <b>TOTAL DÍA (☀️)</b>
            </td>
            <td v-for="d in calendarDays" :key="d.key" class="col-summary count-d">
              {{ dailySummary[d.key]?.D || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td colspan="3" class="sticky-col col-operator summary-label">
              <b>TOTAL NOCHE (🌙)</b>
            </td>
            <td v-for="d in calendarDays" :key="d.key" class="col-summary count-n">
              {{ dailySummary[d.key]?.N || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td colspan="3" class="sticky-col col-operator summary-label">
              <b>TOTAL LIBRES (🏖️)</b>
            </td>
            <td v-for="d in calendarDays" :key="d.key" class="col-summary count-l">
              {{ dailySummary[d.key]?.L || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td colspan="3" class="sticky-col col-operator summary-label">
              <b>VACACIONES (🌴)</b>
            </td>
            <td v-for="d in calendarDays" :key="d.key" class="col-summary count-v">
              {{ dailySummary[d.key]?.V || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td colspan="3" class="sticky-col col-operator summary-label">
              <b>SOBRETIEMPO DÍA (☀️⏰)</b>
            </td>
            <td v-for="d in calendarDays" :key="d.key" class="col-summary count-st-d">
              {{ dailySummary[d.key]?.['ST-D'] || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td colspan="3" class="sticky-col col-operator summary-label">
              <b>SOBRETIEMPO NOCHE (🌙⏰)</b>
            </td>
            <td v-for="d in calendarDays" :key="d.key" class="col-summary count-st-n">
              {{ dailySummary[d.key]?.['ST-N'] || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td colspan="3" class="sticky-col col-operator summary-label">
              <b>DESCANSO MÉDICO (🩺)</b>
            </td>
            <td v-for="d in calendarDays" :key="d.key" class="col-summary count-dm">
              {{ dailySummary[d.key]?.DM || 0 }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Modal para Registrar Excepción o Vacaciones -->
    <div v-if="selectedCell" class="modal-backdrop" @click.self="selectedCell = null">
      <div class="override-modal-card">
        <h3>Modificar Turno / Excepción de Operador</h3>
        <p class="modal-op-name"><b>{{ selectedCell.opName }}</b> ({{ selectedCell.opCode }})</p>
        <p class="modal-date-info">Fecha de inicio: <b>2026-{{ currentMonth < 10 ? '0' + currentMonth : currentMonth }}-{{ selectedCell.day < 10 ? '0' + selectedCell.day : selectedCell.day }}</b></p>

        <div class="form-group-modal">
          <label>Nuevo Estado / Turno:</label>
          <div class="shift-radio-group">
            <button 
              :class="['btn-shift-radio', 'd', { active: overrideShiftType === 'D' }]"
              @click="overrideShiftType = 'D'"
            >☀️ Día (D)</button>
            <button 
              :class="['btn-shift-radio', 'n', { active: overrideShiftType === 'N' }]"
              @click="overrideShiftType = 'N'"
            >🌙 Noche (N)</button>
            <button 
              :class="['btn-shift-radio', 'l', { active: overrideShiftType === 'L' }]"
              @click="overrideShiftType = 'L'"
            >🏖️ Libre (L)</button>
            <button 
              :class="['btn-shift-radio', 'v', { active: overrideShiftType === 'V' }]"
              @click="overrideShiftType = 'V'"
            >🌴 Vacaciones (V)</button>
            <button 
              :class="['btn-shift-radio', 'st-d', { active: overrideShiftType === 'ST-D' }]"
              @click="overrideShiftType = 'ST-D'"
            >☀️⏰ ST Día</button>
            <button 
              :class="['btn-shift-radio', 'st-n', { active: overrideShiftType === 'ST-N' }]"
              @click="overrideShiftType = 'ST-N'"
            >🌙⏰ ST Noche</button>
            <button 
              :class="['btn-shift-radio', 'dm', { active: overrideShiftType === 'DM' }]"
              @click="overrideShiftType = 'DM'"
            >🩺 Descanso Médico</button>
          </div>
        </div>

        <div v-if="['V', 'DM', 'ST-D', 'ST-N', 'ST'].includes(overrideShiftType)" class="form-group-modal">
          <label>Fecha Fin (Opcional para Rango):</label>
          <input type="date" v-model="overrideEndDate" class="input-modal-date" />
        </div>

        <div class="form-group-modal">
          <label>Comentario / Observación:</label>
          <input type="text" v-model="overrideComment" placeholder="Ej. Solicitud de vacaciones aprobada" class="input-modal-text" />
        </div>

        <div class="modal-actions">
          <button @click="selectedCell = null" class="btn-modal-cancel">Cancelar</button>
          <button v-if="selectedCell.isOverride" @click="removeOverride" class="btn-modal-delete">Eliminar Excepción</button>
          <button @click="saveOverride" :disabled="savingOverride" class="btn-modal-save">
            {{ savingOverride ? 'Guardando...' : 'Guardar Turno' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

const emit = defineEmits(['openGroupManager']);

const now = new Date();
const currentRealMonth = now.getMonth() + 1;
const currentMonth = ref(currentRealMonth >= 1 && currentRealMonth <= 12 ? currentRealMonth : 8);

// Selección de Modo de Fecha (Mes vs Rango Personalizado)
const dateSelectionMode = ref('month'); // 'month' | 'range'
const rangeStartDate = ref(`2026-08-01`);
const rangeEndDate = ref(`2026-08-20`);

// Filtro Multiselección de Guardias
const selectedGroupIds = ref([]); // Lista de IDs de guardias seleccionadas (vacío = todas)
const showGroupDropdown = ref(false);
const multiSelectContainerRef = ref(null);

// Filtro de Turno / Modalidad (Día, Noche, Vacaciones, DM, Libre)
const selectedShiftFilter = ref('ALL');

const searchQuery = ref('');
const loading = ref(true);
const groups = ref([]);

const matrixData = ref({
  year: 2026,
  month: currentMonth.value,
  daysInMonth: 31,
  operators: []
});

// Modal Excepción
const selectedCell = ref(null);
const overrideShiftType = ref('V');
const overrideEndDate = ref('');
const overrideComment = ref('');
const savingOverride = ref(false);

const monthOptions = [
  { value: 1, label: 'Enero 2026' },
  { value: 2, label: 'Febrero 2026' },
  { value: 3, label: 'Marzo 2026' },
  { value: 4, label: 'Abril 2026' },
  { value: 5, label: 'Mayo 2026' },
  { value: 6, label: 'Junio 2026' },
  { value: 7, label: 'Julio 2026' },
  { value: 8, label: 'Agosto 2026' },
  { value: 9, label: 'Septiembre 2026' },
  { value: 10, label: 'Octubre 2026' },
  { value: 11, label: 'Noviembre 2026' },
  { value: 12, label: 'Diciembre 2026' }
];

const selectAllGroups = () => {
  selectedGroupIds.value = groups.value.map(g => g.id);
};

const clearAllGroups = () => {
  selectedGroupIds.value = [];
};

const handleOutsideClick = (e) => {
  if (multiSelectContainerRef.value && !multiSelectContainerRef.value.contains(e.target)) {
    showGroupDropdown.value = false;
  }
};

const fetchGroups = async () => {
  try {
    const res = await api.get('/api/v1/groups');
    groups.value = res.data;
  } catch (err) {
    console.error("Error al cargar guardias:", err);
  }
};

const fetchMatrix = async () => {
  loading.value = true;
  try {
    if (dateSelectionMode.value === 'month') {
      const res = await api.get(`/api/v1/shifts/matrix?year=2026&month=${currentMonth.value}`);
      matrixData.value = res.data;
    } else {
      if (!rangeStartDate.value || !rangeEndDate.value) {
        alert("Ingrese tanto Fecha Inicio como Fecha Fin.");
        loading.value = false;
        return;
      }
      if (rangeStartDate.value > rangeEndDate.value) {
        alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
        loading.value = false;
        return;
      }
      const res = await api.get(`/api/v1/shifts/range?startDate=${rangeStartDate.value}&endDate=${rangeEndDate.value}`);
      const ops = (res.data.operators || []).map(op => {
        const shifts = {};
        const isOverride = {};
        const comments = {};
        if (op.dailyShifts) {
          Object.entries(op.dailyShifts).forEach(([dateStr, detail]) => {
            shifts[dateStr] = detail.finalShift || 'L';
            if (detail.isOverride) isOverride[dateStr] = true;
            if (detail.comment) comments[dateStr] = detail.comment;
          });
        }
        return {
          operatorId: op.operatorId,
          code: op.code,
          name: op.name,
          role: op.role,
          groupId: op.groupId,
          groupName: op.groupName,
          groupColor: op.groupColor,
          shifts,
          isOverride,
          comments
        };
      });
      matrixData.value = { operators: ops };
    }
  } catch (err) {
    console.error("Error al cargar matriz de turnos:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGroups();
  fetchMatrix();
  window.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick);
});

watch([currentMonth, dateSelectionMode], () => {
  fetchMatrix();
});

const currentMonthName = computed(() => {
  const m = monthOptions.find(opt => opt.value === currentMonth.value);
  return m ? m.label : 'Mes';
});

const calendarDays = computed(() => {
  if (dateSelectionMode.value === 'month') {
    const days = [];
    const count = matrixData.value.daysInMonth || 31;
    const daysNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    for (let d = 1; d <= count; d++) {
      const dateObj = new Date(2026, currentMonth.value - 1, d);
      const isWknd = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      days.push({
        key: d,
        dayNum: d,
        dayName: daysNames[dateObj.getDay()],
        isWeekend: isWknd
      });
    }
    return days;
  } else {
    if (!rangeStartDate.value || !rangeEndDate.value) return [];
    const days = [];
    let curr = new Date(rangeStartDate.value + 'T00:00:00');
    const end = new Date(rangeEndDate.value + 'T00:00:00');
    const daysNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    while (curr <= end) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isWknd = curr.getDay() === 0 || curr.getDay() === 6;
      days.push({
        key: dateStr,
        dayNum: parseInt(dd),
        dayName: daysNames[curr.getDay()],
        isWeekend: isWknd
      });
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }
});

const filteredOperators = computed(() => {
  let list = matrixData.value.operators || [];

  // Filtro por multiselección de guardias
  if (selectedGroupIds.value.length > 0) {
    list = list.filter(op => op.groupId && selectedGroupIds.value.includes(op.groupId));
  }

  // Filtro por turno (Día vs Noche)
  if (selectedShiftFilter.value !== 'ALL') {
    const filter = selectedShiftFilter.value;
    list = list.filter(op => {
      // Modo Rango (op.dailyShifts existe)
      if (op.dailyShifts) {
        return Object.values(op.dailyShifts).some(detail => {
          const shift = detail.finalShift;
          const base = detail.baseShift;
          const turnCat = detail.turnCategory || (base === 'N' ? 'NOCHE' : 'DIA');
          const isDayTurn = shift === 'D' || shift === 'ST-D' || ((shift === 'V' || shift === 'DM' || shift === 'ST') && (base === 'D' || turnCat === 'DIA'));
          const isNightTurn = shift === 'N' || shift === 'ST-N' || ((shift === 'V' || shift === 'DM' || shift === 'ST') && (base === 'N' || turnCat === 'NOCHE'));

          if (filter === 'DIA') return isDayTurn;
          if (filter === 'NOCHE') return isNightTurn;
          return true;
        });
      } else if (op.shifts) {
        // Modo Mes (op.shifts y op.baseShifts existen)
        return Object.keys(op.shifts).some(day => {
          const shift = op.shifts[day];
          const base = op.baseShifts ? op.baseShifts[day] : 'L';
          const turnCat = base === 'N' ? 'NOCHE' : 'DIA';
          const isDayTurn = shift === 'D' || shift === 'ST-D' || ((shift === 'V' || shift === 'DM' || shift === 'ST') && (base === 'D' || turnCat === 'DIA'));
          const isNightTurn = shift === 'N' || shift === 'ST-N' || ((shift === 'V' || shift === 'DM' || shift === 'ST') && (base === 'N' || turnCat === 'NOCHE'));

          if (filter === 'DIA') return isDayTurn;
          if (filter === 'NOCHE') return isNightTurn;
          return true;
        });
      }
      return true;
    });
  }

  // Filtro por búsqueda de texto
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(op => {
      const nameMatch = op.name && op.name.toLowerCase().includes(q);
      const codeMatch = op.code && op.code.toLowerCase().includes(q);
      const groupMatch = op.groupName && op.groupName.toLowerCase().includes(q);
      return nameMatch || codeMatch || groupMatch;
    });
  }

  // Ordenar por Guardia (groupId: 1 a 12) y luego por nombre
  return [...list].sort((a, b) => {
    const gA = a.groupId || 999;
    const gB = b.groupId || 999;
    if (gA !== gB) return gA - gB;
    return a.name.localeCompare(b.name);
  });
});

const dailySummary = computed(() => {
  const summary = {};
  calendarDays.value.forEach(d => {
    summary[d.key] = { D: 0, N: 0, L: 0, V: 0, 'ST-D': 0, 'ST-N': 0, DM: 0 };
  });

  (filteredOperators.value || []).forEach(op => {
    calendarDays.value.forEach(d => {
      const shift = (op.shifts && op.shifts[d.key]) ? op.shifts[d.key] : 'L';
      if (shift === 'ST') {
        if (summary[d.key]) summary[d.key]['ST-D']++;
      } else if (summary[d.key] && summary[d.key][shift] !== undefined) {
        summary[d.key][shift]++;
      }
    });
  });
  return summary;
});

const exportToPDF = () => {
  if (filteredOperators.value.length === 0) {
    alert("No hay datos de personal para exportar a PDF.");
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Encabezado
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("ROL DE TURNOS Y PROGRAMACIÓN DE PERSONAL", 10, 10);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  let periodText = "";
  if (dateSelectionMode.value === 'month') {
    periodText = currentMonthName.value;
  } else {
    periodText = `Del ${rangeStartDate.value} al ${rangeEndDate.value}`;
  }

  let groupText = "Todas las Guardias";
  if (selectedGroupIds.value.length > 0) {
    const selectedNames = groups.value
      .filter(g => selectedGroupIds.value.includes(g.id))
      .map(g => g.name);
    groupText = selectedNames.join(", ");
  }

  doc.text(`Período: ${periodText}  |  Guardias: ${groupText}  |  Personal: ${filteredOperators.value.length}  |  Emisión: ${new Date().toLocaleDateString('es-PE')}`, 10, 15);

  // Filas de Cabecera y Totales Diarios para autoTable
  const headDaysRow = [
    '#',
    'CÓD',
    'NOMBRES Y APELLIDOS',
    'GUA',
    ...calendarDays.value.map(d => `${d.dayNum}\n${d.dayName.substring(0, 1)}`)
  ];

  const headD = ['', '', 'TOTAL DÍA (☀️)', '', ...calendarDays.value.map(d => dailySummary.value[d.key]?.D || 0)];
  const headN = ['', '', 'TOTAL NOCHE (🌙)', '', ...calendarDays.value.map(d => dailySummary.value[d.key]?.N || 0)];
  const headSTD = ['', '', 'ST DÍA (☀️⏰)', '', ...calendarDays.value.map(d => dailySummary.value[d.key]?.['ST-D'] || 0)];
  const headSTN = ['', '', 'ST NOCHE (🌙⏰)', '', ...calendarDays.value.map(d => dailySummary.value[d.key]?.['ST-N'] || 0)];
  const headV = ['', '', 'VACACIONES (🌴)', '', ...calendarDays.value.map(d => dailySummary.value[d.key]?.V || 0)];
  const headDM = ['', '', 'DM (🩺)', '', ...calendarDays.value.map(d => dailySummary.value[d.key]?.DM || 0)];
  const headL = ['', '', 'LIBRES (🏖️)', '', ...calendarDays.value.map(d => dailySummary.value[d.key]?.L || 0)];

  const bodyRows = filteredOperators.value.map((op, idx) => {
    const dayValues = calendarDays.value.map(d => {
      return (op.shifts && op.shifts[d.key]) ? op.shifts[d.key] : 'L';
    });
    return [idx + 1, op.code || '-', op.name, op.groupName || '-', ...dayValues];
  });

  autoTable(doc, {
    head: [headDaysRow, headD, headN, headSTD, headSTN, headV, headDM, headL],
    body: bodyRows,
    startY: 18,
    margin: { left: 8, right: 8 },
    theme: 'grid',
    styles: {
      fontSize: 4.8,
      cellPadding: 0.5,
      alignment: 'center',
      valign: 'middle',
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      lineWidth: 0.05
    },
    columnStyles: {
      0: { cellWidth: 5, halign: 'center' },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 32, halign: 'left' },
      3: { cellWidth: 11, halign: 'center' }
    },
    didParseCell: (data) => {
      if (data.section === 'head') {
        if (data.row.index === 1) { // TOTAL DÍA
          data.cell.styles.fillColor = [254, 240, 138];
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row.index === 2) { // TOTAL NOCHE
          data.cell.styles.fillColor = [99, 102, 241];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row.index === 3) { // ST DÍA
          data.cell.styles.fillColor = [2, 132, 199];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row.index === 4) { // ST NOCHE
          data.cell.styles.fillColor = [3, 105, 161];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row.index === 5) { // VACACIONES
          data.cell.styles.fillColor = [46, 204, 113];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row.index === 6) { // DM
          data.cell.styles.fillColor = [225, 29, 72];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row.index === 7) { // LIBRES
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
      if (data.section === 'body' && data.column.index >= 4) {
        const val = data.cell.raw;
        if (val === 'D') {
          data.cell.styles.fillColor = [255, 230, 0];
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'N') {
          data.cell.styles.fillColor = [99, 102, 241];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'V') {
          data.cell.styles.fillColor = [46, 204, 113];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'DM') {
          data.cell.styles.fillColor = [225, 29, 72];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (val && val.startsWith('ST')) {
          data.cell.styles.fillColor = [2, 132, 199];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'L') {
          data.cell.styles.fillColor = [241, 245, 249];
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    }
  });

  doc.save(`Rol_Turnos_${periodText.replace(/ /g, '_')}.pdf`);
};

const getDayOfWeekName = (day) => {
  const date = new Date(2026, currentMonth.value - 1, day);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
};

const isWeekend = (day) => {
  const date = new Date(2026, currentMonth.value - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sábado o Domingo
};

const getShiftClass = (shift) => {
  switch (shift) {
    case 'D': return 'shift-d';
    case 'N': return 'shift-n';
    case 'L': return 'shift-l';
    case 'V': return 'shift-v';
    case 'ST-D':
    case 'ST': return 'shift-st-d';
    case 'ST-N': return 'shift-st-n';
    case 'DM': return 'shift-dm';
    default: return 'shift-l';
  }
};

const getShiftLabel = (shift) => {
  switch (shift) {
    case 'D': return 'Turno Día';
    case 'N': return 'Turno Noche';
    case 'L': return 'Día Libre';
    case 'V': return 'Vacaciones';
    case 'ST-D':
    case 'ST': return 'Sobretiempo Día';
    case 'ST-N': return 'Sobretiempo Noche';
    case 'DM': return 'Descanso Médico';
    default: return 'Libre';
  }
};

const openOverrideModal = (op, day) => {
  const currentShift = op.shifts[day] || 'L';
  const isOverride = op.isOverride && op.isOverride[day];
  const mStr = currentMonth.value < 10 ? '0' + currentMonth.value : currentMonth.value;
  const dStr = day < 10 ? '0' + day : day;

  selectedCell.value = {
    opId: op.operatorId,
    opName: op.name,
    opCode: op.code || 'Sin Código',
    day,
    currentShift,
    isOverride
  };
  overrideShiftType.value = currentShift === 'V' ? 'V' : (currentShift || 'V');
  overrideEndDate.value = `2026-${mStr}-${dStr}`;
  overrideComment.value = op.comments && op.comments[day] ? op.comments[day] : '';
};

const saveOverride = async () => {
  if (!selectedCell.value) return;
  savingOverride.value = true;
  try {
    const mStr = currentMonth.value < 10 ? '0' + currentMonth.value : currentMonth.value;
    const dStr = selectedCell.value.day < 10 ? '0' + selectedCell.value.day : selectedCell.value.day;
    const startDateStr = `2026-${mStr}-${dStr}`;

    await api.post('/api/v1/shifts/override', {
      operatorId: selectedCell.value.opId,
      startDate: startDateStr,
      endDate: overrideEndDate.value || startDateStr,
      shiftType: overrideShiftType.value,
      comment: overrideComment.value
    });

    selectedCell.value = null;
    fetchMatrix();
  } catch (err) {
    alert("Error al guardar excepción de turno.");
  } finally {
    savingOverride.value = false;
  }
};

const removeOverride = async () => {
  if (!selectedCell.value) return;
  try {
    const mStr = currentMonth.value < 10 ? '0' + currentMonth.value : currentMonth.value;
    const dStr = selectedCell.value.day < 10 ? '0' + selectedCell.value.day : selectedCell.value.day;
    const dateStr = `2026-${mStr}-${dStr}`;

    await api.delete(`/api/v1/shifts/override?operatorId=${selectedCell.value.opId}&date=${dateStr}`);
    selectedCell.value = null;
    fetchMatrix();
  } catch (err) {
    alert("Error al eliminar excepción.");
  }
};
</script>

<style scoped>
.shift-calendar-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calendar-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.month-selector {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
}

.month-btn {
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.month-btn.active {
  background: #4f46e5;
  color: white;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
.mode-switch-bar {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  gap: 0.25rem;
}

.mode-tab-btn {
  background: none;
  border: none;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab-btn.active {
  background: #4f46e5;
  color: white;
  box-shadow: 0 3px 8px rgba(79, 70, 229, 0.25);
}

.range-inputs-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.input-date-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.control-date-input {
  padding: 0.4rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: inherit;
}

.btn-fetch-range {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-select-shift {
  background: #f8fafc;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-select-shift:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.btn-fetch-range:hover {
  background: #4338ca;
}

.btn-export-pdf {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.55rem 0.95rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.2);
}

.btn-export-pdf:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.btn-export-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.multi-select-container {
  position: relative;
}

.multi-select-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #cbd5e1;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 210px;
  justify-content: space-between;
}

.multi-select-trigger:hover {
  border-color: #4f46e5;
  background: #f8fafc;
}

.dropdown-arrow {
  font-size: 0.65rem;
  color: #64748b;
}

.multi-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 260px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
  z-index: 100;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dropdown-actions {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.4rem;
}

.btn-select-all, .btn-clear-all {
  background: none;
  border: none;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.btn-select-all { color: #4f46e5; }
.btn-select-all:hover { background: #e0e7ff; }

.btn-clear-all { color: #ef4444; }
.btn-clear-all:hover { background: #fee2e2; }

.dropdown-options-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dropdown-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.4rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: background 0.12s ease;
}

.dropdown-checkbox-label:hover {
  background: #f1f5f9;
}

.dropdown-checkbox-label input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: #4f46e5;
  cursor: pointer;
}

.badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.6rem;
  font-size: 0.85rem;
  color: #94a3b8;
}

.control-input {
  padding: 0.55rem 1.8rem 0.55rem 1.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  width: 200px;
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.btn-config-groups {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}

.shift-legend {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  background: white;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.legend-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.matrix-wrapper {
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: auto;
  max-height: calc(100vh - 270px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.shift-matrix-table {
  width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.82rem;
}

.sticky-col {
  position: sticky;
  background: white;
  z-index: 10;
}

.col-code-hdr, .col-code-cell {
  position: sticky;
  left: 0;
  width: 55px;
  min-width: 55px;
  text-align: center !important;
}

.col-name-hdr, .col-name-cell {
  position: sticky;
  left: 55px;
  width: 200px;
  min-width: 200px;
  max-width: 230px;
  text-align: left !important;
  padding-left: 0.35rem !important;
}

.name-cell-inner {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  overflow: hidden;
}

.sun-icon-inline {
  font-size: 0.8rem;
  flex-shrink: 0;
}

.col-guardia-hdr, .col-guardia-cell {
  position: sticky;
  left: 255px;
  width: 75px;
  min-width: 75px;
  text-align: center !important;
  border-right: 2px solid #cbd5e1;
}

th.sticky-col {
  top: 0;
  z-index: 25;
  background: #f8fafc;
}

.no-code-tag {
  color: #94a3b8;
  font-size: 0.58rem;
}

.shift-matrix-table th {
  position: sticky;
  top: 0;
  z-index: 15;
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 0.15rem 0.02rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: center;
}

.col-day {
  min-width: 25px;
  width: 25px;
}

.weekend-header {
  background: #f1f5f9 !important;
  color: #ef4444 !important;
}

.day-num {
  font-size: 0.65rem;
  font-weight: 800;
}

.day-name {
  font-size: 0.52rem;
  color: #64748b;
  text-transform: uppercase;
}

.op-name {
  font-size: 0.62rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.op-code-tag {
  background: #3b82f6;
  color: white;
  font-size: 0.55rem;
  font-weight: 800;
  padding: 0.02rem 0.22rem;
  border-radius: 2px;
  font-family: monospace;
}

.op-guardia-tag {
  color: white;
  font-size: 0.55rem;
  font-weight: 800;
  padding: 0.02rem 0.3rem;
  border-radius: 2px;
}

.col-shift-cell {
  padding: 0.05rem 0.02rem;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f1f5f9;
  cursor: pointer;
}

.col-shift-cell:hover {
  background: #e0e7ff;
}

.shift-cell-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin: 0 auto;
  border-radius: 3px;
  font-weight: 900;
  font-size: 0.6rem;
  user-select: none;
  transition: all 0.15s ease;
}

.shift-d {
  background: #ffe600;
  color: #0f172a;
}

.shift-n {
  background: #6366f1;
  color: white;
}

.shift-l {
  background: #f1f5f9;
  color: #64748b;
}

.shift-v {
  background: #2ecc71;
  color: white;
}

.shift-st-d {
  background: #0284c7;
  color: white;
}

.shift-st-n {
  background: #0369a1;
  color: white;
}

.shift-dm {
  background: #e11d48;
  color: white;
}

.is-override {
  box-shadow: 0 0 0 1.5px #0f172a;
  position: relative;
}

.summary-row td {
  padding: 0.08rem 0.02rem;
  border-top: 1px solid #e2e8f0;
  font-weight: 800;
  text-align: center;
  font-size: 0.58rem;
}

.summary-label {
  font-size: 0.58rem;
  color: #334155;
  text-align: left !important;
}

.count-d { background: #fffde7; color: #827717; }
.count-n { background: #e0e7ff; color: #4338ca; }
.count-l { background: #f8fafc; color: #64748b; }
.count-v { background: #dcfce7; color: #15803d; }
.count-st-d { background: #e0f2fe; color: #0369a1; }
.count-st-n { background: #bae6fd; color: #075985; }
.count-dm { background: #ffe4e6; color: #be123c; }

.calendar-loading {
  text-align: center;
  padding: 4rem 1rem;
  color: #64748b;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal Excepción */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.override-modal-card {
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
}

.override-modal-card h3 {
  margin-top: 0;
  color: #0f172a;
  font-size: 1.15rem;
}

.modal-op-name {
  color: #4f46e5;
  font-size: 0.95rem;
  margin: 0.25rem 0;
}

.modal-date-info {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.form-group-modal {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.form-group-modal label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.shift-radio-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.btn-shift-radio {
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  background: #f8fafc;
  color: #334155;
  transition: all 0.15s ease;
}

.btn-shift-radio.active.d { background: #ffe600; color: #0f172a; border-color: #e6cf00; }
.btn-shift-radio.active.n { background: #6366f1; color: white; border-color: #6366f1; }
.btn-shift-radio.active.l { background: #64748b; color: white; border-color: #64748b; }
.btn-shift-radio.active.v { background: #2ecc71; color: white; border-color: #27ae60; }
.btn-shift-radio.active.st-d { background: #0284c7; color: white; border-color: #0284c7; }
.btn-shift-radio.active.st-n { background: #0369a1; color: white; border-color: #0369a1; }
.btn-shift-radio.active.dm { background: #e11d48; color: white; border-color: #e11d48; }

.input-modal-date, .input-modal-text {
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

.btn-modal-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.btn-modal-delete {
  background: #fee2e2;
  border: none;
  color: #ef4444;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.btn-modal-save {
  background: #4f46e5;
  border: none;
  color: white;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
</style>
