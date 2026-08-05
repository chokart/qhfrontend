<template>
  <div class="shift-calendar-container">
    <!-- Header de Control de Turnos -->
    <div class="calendar-controls">
      <!-- Selector de Meses (Julio - Diciembre 2026) -->
      <div class="month-selector">
        <button 
          v-for="m in monthOptions" 
          :key="m.value"
          :class="['month-btn', { active: currentMonth === m.value }]"
          @click="currentMonth = m.value"
        >
          {{ m.label }}
        </button>
      </div>

      <div class="filter-controls">
        <!-- Selector de Guardia -->
        <select v-model="selectedGroupFilter" class="control-select">
          <option :value="null">Todas las Guardias (12)</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">
            {{ g.name }} ({{ g.programType }})
          </option>
        </select>

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

        <button @click="$emit('openGroupManager')" class="btn-config-groups">
          ⚙️ Configurar Guardias
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
      <p>Calculando matriz de turnos para {{ currentMonthName }} 2026...</p>
    </div>

    <!-- Matriz Cuadrícula de Turnos -->
    <div v-else class="matrix-wrapper">
      <table class="shift-matrix-table">
        <thead>
          <tr>
            <th class="sticky-col col-operator">OPERADOR / GUARDIA</th>
            <th 
              v-for="d in daysInMonth" 
              :key="d" 
              :class="['col-day', { 'weekend-header': isWeekend(d) }]"
            >
              <div class="day-num">{{ d }}</div>
              <div class="day-name">{{ getDayOfWeekName(d) }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="op in filteredOperators" :key="op.operatorId">
            <!-- Columna fija de Operador -->
            <td class="sticky-col col-operator">
              <div class="op-cell-info">
                <span class="op-name" :title="op.name">{{ op.name }}</span>
                <div class="op-sub-info">
                  <span v-if="op.code" class="op-code-tag">{{ op.code }}</span>
                  <span 
                    class="op-guardia-tag" 
                    :style="{ backgroundColor: op.groupColor || '#94a3b8' }"
                  >
                    {{ op.groupName }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Celdas de Turnos para cada día -->
            <td 
              v-for="d in daysInMonth" 
              :key="d" 
              class="col-shift-cell"
              @click="openOverrideModal(op, d)"
            >
              <div 
                :class="[
                  'shift-cell-badge',
                  getShiftClass(op.shifts[d]),
                  { 'is-override': op.isOverride && op.isOverride[d] }
                ]"
                :title="op.comments && op.comments[d] ? op.comments[d] : `Día ${d}: ${getShiftLabel(op.shifts[d])}`"
              >
                {{ op.shifts[d] || 'L' }}
              </div>
            </td>
          </tr>
        </tbody>
        <!-- Fila de Resumen Diario de Cobertura -->
        <tfoot>
          <tr class="summary-row">
            <td class="sticky-col col-operator summary-label">
              <b>TOTAL DÍA (☀️)</b>
            </td>
            <td v-for="d in daysInMonth" :key="d" class="col-summary count-d">
              {{ dailySummary[d]?.D || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td class="sticky-col col-operator summary-label">
              <b>TOTAL NOCHE (🌙)</b>
            </td>
            <td v-for="d in daysInMonth" :key="d" class="col-summary count-n">
              {{ dailySummary[d]?.N || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td class="sticky-col col-operator summary-label">
              <b>TOTAL LIBRES (🏖️)</b>
            </td>
            <td v-for="d in daysInMonth" :key="d" class="col-summary count-l">
              {{ dailySummary[d]?.L || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td class="sticky-col col-operator summary-label">
              <b>VACACIONES (🌴)</b>
            </td>
            <td v-for="d in daysInMonth" :key="d" class="col-summary count-v">
              {{ dailySummary[d]?.V || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td class="sticky-col col-operator summary-label">
              <b>SOBRETIEMPO DÍA (☀️⏰)</b>
            </td>
            <td v-for="d in daysInMonth" :key="d" class="col-summary count-st-d">
              {{ dailySummary[d]?.['ST-D'] || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td class="sticky-col col-operator summary-label">
              <b>SOBRETIEMPO NOCHE (🌙⏰)</b>
            </td>
            <td v-for="d in daysInMonth" :key="d" class="col-summary count-st-n">
              {{ dailySummary[d]?.['ST-N'] || 0 }}
            </td>
          </tr>
          <tr class="summary-row">
            <td class="sticky-col col-operator summary-label">
              <b>DESCANSO MÉDICO (🩺)</b>
            </td>
            <td v-for="d in daysInMonth" :key="d" class="col-summary count-dm">
              {{ dailySummary[d]?.DM || 0 }}
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
import { ref, computed, watch, onMounted } from 'vue';
import api from '../api';

const emit = defineEmits(['openGroupManager']);

const now = new Date();
const currentRealMonth = now.getMonth() + 1;
const currentMonth = ref(currentRealMonth >= 1 && currentRealMonth <= 12 ? currentRealMonth : 8);
const selectedGroupFilter = ref(null);
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
    let url = `/api/v1/shifts/matrix?year=2026&month=${currentMonth.value}`;
    if (selectedGroupFilter.value) {
      url += `&groupId=${selectedGroupFilter.value}`;
    }
    const res = await api.get(url);
    matrixData.value = res.data;
  } catch (err) {
    console.error("Error al cargar matriz de turnos:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGroups();
  fetchMatrix();
});

watch([currentMonth, selectedGroupFilter], () => {
  fetchMatrix();
});

const currentMonthName = computed(() => {
  const m = monthOptions.find(opt => opt.value === currentMonth.value);
  return m ? m.label : 'Mes';
});

const daysInMonth = computed(() => matrixData.value.daysInMonth || 31);

const filteredOperators = computed(() => {
  let list = matrixData.value.operators || [];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(op => {
      const nameMatch = op.name && op.name.toLowerCase().includes(q);
      const codeMatch = op.code && op.code.toLowerCase().includes(q);
      const groupMatch = op.groupName && op.groupName.toLowerCase().includes(q);
      return nameMatch || codeMatch || groupMatch;
    });
  }

  // Ordenar de forma garantizada por Guardia (groupId: 1 a 12) y luego por nombre
  return [...list].sort((a, b) => {
    const gA = a.groupId || 999;
    const gB = b.groupId || 999;
    if (gA !== gB) return gA - gB;
    return a.name.localeCompare(b.name);
  });
});

const dailySummary = computed(() => {
  const summary = {};
  for (let d = 1; d <= daysInMonth.value; d++) {
    summary[d] = { D: 0, N: 0, L: 0, V: 0, 'ST-D': 0, 'ST-N': 0, DM: 0 };
  }
  (matrixData.value.operators || []).forEach(op => {
    for (let d = 1; d <= daysInMonth.value; d++) {
      const shift = op.shifts[d] || 'L';
      if (shift === 'ST') {
        summary[d]['ST-D']++;
      } else if (summary[d][shift] !== undefined) {
        summary[d][shift]++;
      }
    }
  });
  return summary;
});

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
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.control-select {
  padding: 0.55rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  font-family: inherit;
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
  overflow-x: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.shift-matrix-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.82rem;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 10;
  border-right: 2px solid #e2e8f0;
}

.col-operator {
  min-width: 170px;
  max-width: 180px;
  padding: 0.35rem 0.5rem;
  text-align: left;
}

.shift-matrix-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 0.3rem 0.05rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: center;
}

.col-day {
  min-width: 27px;
  width: 27px;
}

.weekend-header {
  background: #f1f5f9 !important;
  color: #ef4444 !important;
}

.day-num {
  font-size: 0.76rem;
  font-weight: 800;
}

.day-name {
  font-size: 0.6rem;
  color: #64748b;
  text-transform: uppercase;
}

.op-cell-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.op-name {
  font-size: 0.76rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-sub-info {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.op-code-tag {
  background: #3b82f6;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
  font-family: monospace;
}

.op-guardia-tag {
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
}

.col-shift-cell {
  padding: 0.15rem 0.05rem;
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
  width: 24px;
  height: 24px;
  margin: 0 auto;
  border-radius: 4px;
  font-weight: 900;
  font-size: 0.72rem;
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
  box-shadow: 0 0 0 2px #0f172a;
  position: relative;
}

.summary-row td {
  padding: 0.25rem 0.05rem;
  border-top: 1px solid #e2e8f0;
  font-weight: 800;
  text-align: center;
  font-size: 0.72rem;
}

.summary-label {
  font-size: 0.72rem;
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
