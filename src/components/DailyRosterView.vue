<template>
  <div class="daily-roster-container">

    <!-- Selector de Fecha -->
    <div class="date-selector-card">
      <div class="date-selector-left">
        <span class="calendar-emoji">📅</span>
        <div class="date-label-group">
          <span class="date-label">Consultar personal activo para el día:</span>
          <input
            type="date"
            v-model="selectedDate"
            min="2026-07-01"
            max="2026-12-31"
            class="date-input"
            @change="fetchRoster"
          />
        </div>
        <div class="pdf-buttons-group" v-if="!loading && rosterReady">
          <button
            class="btn-export-pdf btn-pdf-day"
            @click="exportDayRosterPDF"
            title="Descargar reporte PDF exclusivo de Turno Día"
          >
            ☀️ PDF Día
          </button>
          <button
            class="btn-export-pdf btn-pdf-night"
            @click="exportNightRosterPDF"
            title="Descargar reporte PDF exclusivo de Turno Noche"
          >
            🌙 PDF Noche
          </button>
        </div>
      </div>

      <div class="date-summary-pills" v-if="!loading && rosterReady">
        <div class="pill pill-day">
          <span>☀️</span>
          <span><b>{{ dayOperators.length }}</b> Turno Día</span>
        </div>
        <div class="pill pill-night">
          <span>🌙</span>
          <span><b>{{ nightOperators.length }}</b> Turno Noche</span>
        </div>
        <div class="pill pill-absent-day">
          <span>☀️🌴🩺</span>
          <span><b>{{ absentDayOperators.length }}</b> Ausentes Día</span>
        </div>
        <div class="pill pill-absent-night">
          <span>🌙🌴🩺</span>
          <span><b>{{ absentNightOperators.length }}</b> Ausentes Noche</span>
        </div>
        <div class="pill pill-st">
          <span>⏰</span>
          <span><b>{{ stDayOperators.length + stNightOperators.length }}</b> Sobretiempo</span>
        </div>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Consultando personal para el <b>{{ formattedDate }}</b>...</p>
    </div>

    <!-- Resultado -->
    <div v-else-if="rosterReady" class="roster-grid">

      <!-- COLUMNA 1: TODO EL PERSONAL TURNO DÍA -->
      <div class="roster-col">
        <div class="col-header day-header">
          <span class="header-icon">☀️</span>
          <span class="header-title">Personal Turno Día</span>
          <span class="header-count">{{ dayOperators.length + stDayOperators.length + absentDayOperators.length }} total</span>
          <button class="btn-col-pdf btn-col-pdf-day" @click="exportDayRosterPDF" title="Descargar PDF exclusivo del Turno Día">📄 PDF Día</button>
        </div>

        <!-- 1. Activos en Guardia -->
        <div class="sub-header active-day-sub-header">
          <span class="sub-title">🟢 Activos / En Guardia</span>
          <span class="sub-count">{{ dayOperators.length }}</span>
        </div>
        <div v-if="dayOperators.length === 0" class="empty-col">
          <p>Sin personal activo en turno día.</p>
        </div>
        <div v-else class="operator-list">
          <div
            v-for="(op, idx) in dayOperators"
            :key="op.operatorId"
            class="operator-card day-card"
          >
            <span class="op-idx">{{ idx + 1 }}</span>
            <div class="op-info">
              <span class="op-name">{{ op.name }}</span>
              <div class="op-meta">
                <span v-if="op.code" class="op-code">{{ op.code }}</span>
                <span class="op-role-tag" @click.stop="openRoleEditModal(op)" title="Clic para editar Rol / Cargo">
                  🏷️ {{ op.role || 'OPERADOR' }}
                </span>
                <span class="op-guardia" :style="{ backgroundColor: op.groupColor || '#4f46e5' }">
                  {{ op.groupName }}
                </span>
              </div>
            </div>
            <span class="shift-badge shift-d">D</span>
          </div>
        </div>

        <!-- 2. Sobretiempo Día -->
        <div class="sub-header st-sub-header mt-section">
          <span class="sub-title">⏰ Sobretiempo (Día Libre Trabajado)</span>
          <span class="sub-count">{{ stDayOperators.length }}</span>
        </div>
        <div v-if="stDayOperators.length === 0" class="empty-col-compact">Sin sobretiempo de día</div>
        <div v-else class="operator-list compact-list">
          <div
            v-for="op in stDayOperators"
            :key="op.operatorId"
            class="operator-card compact-card st-card"
          >
            <div class="op-info">
              <span class="op-name compact-name">{{ op.name }}</span>
              <div class="op-meta">
                <span v-if="op.code" class="op-code">{{ op.code }}</span>
                <span class="op-role-tag" @click.stop="openRoleEditModal(op)" title="Clic para editar Rol / Cargo">
                  🏷️ {{ op.role || 'OPERADOR' }}
                </span>
                <span class="op-guardia" :style="{ backgroundColor: op.groupColor || '#4f46e5' }">
                  {{ op.groupName }}
                </span>
              </div>
            </div>
            <span class="shift-badge shift-st-d">ST-D</span>
          </div>
        </div>

        <!-- 3. Ausentes Turno Día (Vacaciones / Descanso Médico) -->
        <div class="sub-header absent-day-sub-header mt-section">
          <span class="sub-title">🏖️🩺 Ausentes (Vacaciones / DM)</span>
          <span class="sub-count">{{ absentDayOperators.length }}</span>
        </div>
        <div v-if="absentDayOperators.length === 0" class="empty-col-compact">Sin ausencias en turno día</div>
        <div v-else class="operator-list compact-list">
          <div
            v-for="op in absentDayOperators"
            :key="op.operatorId"
            :class="['operator-card', 'compact-card', op.absentBadge.startsWith('V') ? 'vacation-card' : 'dm-card']"
          >
            <div class="op-info">
              <span class="op-name compact-name">{{ op.name }}</span>
              <div class="op-meta">
                <span v-if="op.code" class="op-code">{{ op.code }}</span>
                <span class="op-role-tag" @click.stop="openRoleEditModal(op)" title="Clic para editar Rol / Cargo">
                  🏷️ {{ op.role || 'OPERADOR' }}
                </span>
                <span class="op-guardia" :style="{ backgroundColor: op.groupColor || '#4f46e5' }">
                  {{ op.groupName }}
                </span>
              </div>
            </div>
            <span :class="['shift-badge', op.absentClass]">{{ op.absentBadge }}</span>
          </div>
        </div>
      </div>

      <!-- COLUMNA 2: TODO EL PERSONAL TURNO NOCHE -->
      <div class="roster-col">
        <div class="col-header night-header">
          <span class="header-icon">🌙</span>
          <span class="header-title">Personal Turno Noche</span>
          <span class="header-count">{{ nightOperators.length + stNightOperators.length + absentNightOperators.length }} total</span>
          <button class="btn-col-pdf btn-col-pdf-night" @click="exportNightRosterPDF" title="Descargar PDF exclusivo del Turno Noche">📄 PDF Noche</button>
        </div>

        <!-- 1. Activos en Guardia -->
        <div class="sub-header active-night-sub-header">
          <span class="sub-title">🔵 Activos / En Guardia</span>
          <span class="sub-count">{{ nightOperators.length }}</span>
        </div>
        <div v-if="nightOperators.length === 0" class="empty-col">
          <p>Sin personal activo en turno noche.</p>
        </div>
        <div v-else class="operator-list">
          <div
            v-for="(op, idx) in nightOperators"
            :key="op.operatorId"
            class="operator-card night-card"
          >
            <span class="op-idx">{{ idx + 1 }}</span>
            <div class="op-info">
              <span class="op-name">{{ op.name }}</span>
              <div class="op-meta">
                <span v-if="op.code" class="op-code">{{ op.code }}</span>
                <span class="op-role-tag" @click.stop="openRoleEditModal(op)" title="Clic para editar Rol / Cargo">
                  🏷️ {{ op.role || 'OPERADOR' }}
                </span>
                <span class="op-guardia" :style="{ backgroundColor: op.groupColor || '#4f46e5' }">
                  {{ op.groupName }}
                </span>
              </div>
            </div>
            <span class="shift-badge shift-n">N</span>
          </div>
        </div>

        <!-- 2. Sobretiempo Noche -->
        <div class="sub-header st-sub-header mt-section">
          <span class="sub-title">⏰ Sobretiempo (Día Libre Trabajado)</span>
          <span class="sub-count">{{ stNightOperators.length }}</span>
        </div>
        <div v-if="stNightOperators.length === 0" class="empty-col-compact">Sin sobretiempo de noche</div>
        <div v-else class="operator-list compact-list">
          <div
            v-for="op in stNightOperators"
            :key="op.operatorId"
            class="operator-card compact-card st-card"
          >
            <div class="op-info">
              <span class="op-name compact-name">{{ op.name }}</span>
              <div class="op-meta">
                <span v-if="op.code" class="op-code">{{ op.code }}</span>
                <span class="op-role-tag" @click.stop="openRoleEditModal(op)" title="Clic para editar Rol / Cargo">
                  🏷️ {{ op.role || 'OPERADOR' }}
                </span>
                <span class="op-guardia" :style="{ backgroundColor: op.groupColor || '#4f46e5' }">
                  {{ op.groupName }}
                </span>
              </div>
            </div>
            <span class="shift-badge shift-st-n">ST-N</span>
          </div>
        </div>

        <!-- 3. Ausentes Turno Noche (Vacaciones / Descanso Médico) -->
        <div class="sub-header absent-night-sub-header mt-section">
          <span class="sub-title">🏖️🩺 Ausentes (Vacaciones / DM)</span>
          <span class="sub-count">{{ absentNightOperators.length }}</span>
        </div>
        <div v-if="absentNightOperators.length === 0" class="empty-col-compact">Sin ausencias en turno noche</div>
        <div v-else class="operator-list compact-list">
          <div
            v-for="op in absentNightOperators"
            :key="op.operatorId"
            :class="['operator-card', 'compact-card', op.absentBadge.startsWith('V') ? 'vacation-card' : 'dm-card']"
          >
            <div class="op-info">
              <span class="op-name compact-name">{{ op.name }}</span>
              <div class="op-meta">
                <span v-if="op.code" class="op-code">{{ op.code }}</span>
                <span class="op-role-tag" @click.stop="openRoleEditModal(op)" title="Clic para editar Rol / Cargo">
                  🏷️ {{ op.role || 'OPERADOR' }}
                </span>
                <span class="op-guardia" :style="{ backgroundColor: op.groupColor || '#4f46e5' }">
                  {{ op.groupName }}
                </span>
              </div>
            </div>
            <span :class="['shift-badge', op.absentClass]">{{ op.absentBadge }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Estado inicial -->
    <div v-else class="initial-state">
      <div class="initial-icon">📋</div>
      <h3>Selecciona una fecha</h3>
      <p>Consulta quién está en turno día, turno noche, de vacaciones o libre para cualquier día de Julio a Diciembre 2026.</p>
    </div>

    <!-- Modal Cambiar Rol en Guardia del Día -->
    <div v-if="showRoleModal" class="modal-backdrop" @click.self="showRoleModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>🏷️ Editar Rol / Cargo del Trabajador</h3>
          <button class="btn-close" @click="showRoleModal = false">✕</button>
        </div>
        <div class="modal-body" v-if="selectedOpForRole">
          <div class="op-card-summary">
            <span v-if="selectedOpForRole.code" class="code-badge">{{ selectedOpForRole.code }}</span>
            <span class="op-name-bold">{{ selectedOpForRole.name }}</span>
          </div>

          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Seleccionar Rol / Cargo:</label>
            <select v-model="selectedRolePreset" class="form-select">
              <option v-for="r in rolePresetOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <div v-if="selectedRolePreset === 'OTRO'" class="form-group" style="margin-top: 0.75rem;">
            <label class="form-label">Especificar Cargo / Rol Personalizado:</label>
            <input type="text" v-model="customRoleInput" placeholder="Ej. Técnico Mecánico, Rigger..." class="form-input-text" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showRoleModal = false">Cancelar</button>
          <button class="btn-save" :disabled="savingRole" @click="saveRoleInDailyRoster">
            <span v-if="savingRole">Guardando...</span>
            <span v-else>💾 Guardar Rol</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

const selectedDate = ref('');
const loading = ref(false);
const matrixOperators = ref([]);
const rosterReady = ref(false);

onMounted(() => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  selectedDate.value = `${yyyy}-${mm}-${dd}`;
  fetchRoster();
});

// Estados para Cambio de Rol desde Guardia del Día
const showRoleModal = ref(false);
const selectedOpForRole = ref(null);
const selectedRolePreset = ref('OPERADOR');
const customRoleInput = ref('');
const savingRole = ref(false);

const rolePresetOptions = [
  'OPERADOR',
  'OPERADOR TRACTOR',
  'OPERADOR EXCAVADORA',
  'OPERADOR CARGADOR',
  'OPERADOR RODILLO',
  'OPERADOR MOTONIVELADORA',
  'SUPERVISOR',
  'CAPATAZ',
  'CHOFER / CONDUCTOR',
  'OTRO'
];

const openRoleEditModal = (op) => {
  selectedOpForRole.value = op;
  const current = op.role || 'OPERADOR';
  if (rolePresetOptions.includes(current)) {
    selectedRolePreset.value = current;
    customRoleInput.value = '';
  } else {
    selectedRolePreset.value = 'OTRO';
    customRoleInput.value = current;
  }
  showRoleModal.value = true;
};

const saveRoleInDailyRoster = async () => {
  if (!selectedOpForRole.value) return;

  const newRole = selectedRolePreset.value === 'OTRO' ? customRoleInput.value.trim() : selectedRolePreset.value;
  if (!newRole) return;

  savingRole.value = true;
  try {
    await api.put(`/api/v1/operators/${selectedOpForRole.value.operatorId}/role`, {
      role: newRole
    });

    const target = matrixOperators.value.find(o => o.operatorId === selectedOpForRole.value.operatorId);
    if (target) {
      target.role = newRole;
    }
    selectedOpForRole.value.role = newRole;

    showRoleModal.value = false;
  } catch (err) {
    console.error("Error al actualizar rol de operador desde Guardia del Día:", err);
  } finally {
    savingRole.value = false;
  }
};

const formattedDate = computed(() => {
  if (!selectedDate.value) return '';
  const [year, month, day] = selectedDate.value.split('-');
  const months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${parseInt(day)} de ${months[parseInt(month)]} de ${year}`;
});

const fetchRoster = async () => {
  if (!selectedDate.value) return;

  const [year, month, day] = selectedDate.value.split('-').map(Number);
  loading.value = true;
  rosterReady.value = false;

  try {
    const res = await api.get(`/api/v1/shifts/matrix?year=${year}&month=${month}`);
    // Extraer el turno del día específico para cada operador
    matrixOperators.value = res.data.operators.map(op => ({
      ...op,
      todayShift: op.shifts[day] || 'L',
      todayBaseShift: (op.baseShifts && op.baseShifts[day]) ? op.baseShifts[day] : (op.shifts[day] || 'L')
    }));
    rosterReady.value = true;
  } catch (err) {
    console.error("Error al consultar el roster del día:", err);
  } finally {
    loading.value = false;
  }
};

// Exportar PDF Turno Día
const exportDayRosterPDF = () => {
  if (!rosterReady.value || !selectedDate.value) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateStr = formattedDate.value;
  const timestamp = new Date().toLocaleString('es-PE');
  const totalDay = dayOperators.value.length + stDayOperators.value.length + absentDayOperators.value.length;

  // Banner Encabezado Verde Día
  doc.setFillColor(5, 150, 105); // Emerald Green
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('QH - REPORTE DE GUARDIA DEL DIA (TURNO DIA)', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${dateStr}`, 14, 20);
  doc.text(`Emitido: ${timestamp}`, 135, 20);

  let currentY = 32;

  // Cuadro de Resumen
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, currentY, 182, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text(`TOTAL PERSONAL DIA: ${totalDay}`, 18, currentY + 9);
  doc.text(`Activos: ${dayOperators.value.length}`, 75, currentY + 9);
  doc.text(`Sobretiempo: ${stDayOperators.value.length}`, 115, currentY + 9);
  doc.text(`Ausentes: ${absentDayOperators.value.length}`, 155, currentY + 9);

  currentY += 18;

  const dayRows = [
    ...dayOperators.value.map((op, idx) => [idx + 1, op.code || '-', op.name, op.role || 'OPERADOR', op.groupName || 'Sin Guardia', 'Activo (D)']),
    ...stDayOperators.value.map((op, idx) => [dayOperators.value.length + idx + 1, op.code || '-', op.name, op.role || 'OPERADOR', op.groupName || 'Sin Guardia', 'Sobretiempo (ST-D)']),
    ...absentDayOperators.value.map((op, idx) => [
      dayOperators.value.length + stDayOperators.value.length + idx + 1,
      op.code || '-',
      op.name,
      op.role || 'OPERADOR',
      op.groupName || 'Sin Guardia',
      op.absentBadge === 'V-D' ? 'Vacaciones (V-D)' : 'Descanso Medico (DM-D)'
    ])
  ];

  autoTable(doc, {
    startY: currentY,
    head: [[{ content: `DETALLE DE PERSONAL TURNO DIA (${totalDay} OPERADORES)`, colSpan: 6, styles: { halign: 'left', fontSize: 9 } }], ['#', 'Código', 'Nombre del Operador', 'Rol / Cargo', 'Guardia / Grupo', 'Estado']],
    body: dayRows.length > 0 ? dayRows : [[{ content: 'Sin personal registrado en Turno Día', colSpan: 6, styles: { halign: 'center' } }]],
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 38 },
      4: { cellWidth: 32 },
      5: { cellWidth: 38, halign: 'center' }
    }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount} - QH Relavera Turno Día`, 105, 290, { align: 'center' });
  }

  doc.save(`Guardia_del_Dia_Turno_Dia_${selectedDate.value}.pdf`);
};

// Exportar PDF Turno Noche
const exportNightRosterPDF = () => {
  if (!rosterReady.value || !selectedDate.value) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateStr = formattedDate.value;
  const timestamp = new Date().toLocaleString('es-PE');
  const totalNight = nightOperators.value.length + stNightOperators.value.length + absentNightOperators.value.length;

  // Banner Encabezado Índigo Noche
  doc.setFillColor(67, 56, 202); // Indigo
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('QH - REPORTE DE GUARDIA DEL DIA (TURNO NOCHE)', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Fecha: ${dateStr}`, 14, 20);
  doc.text(`Emitido: ${timestamp}`, 135, 20);

  let currentY = 32;

  // Cuadro de Resumen
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, currentY, 182, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 48, 163);
  doc.text(`TOTAL PERSONAL NOCHE: ${totalNight}`, 18, currentY + 9);
  doc.text(`Activos: ${nightOperators.value.length}`, 75, currentY + 9);
  doc.text(`Sobretiempo: ${stNightOperators.value.length}`, 115, currentY + 9);
  doc.text(`Ausentes: ${absentNightOperators.value.length}`, 155, currentY + 9);

  currentY += 18;

  const nightRows = [
    ...nightOperators.value.map((op, idx) => [idx + 1, op.code || '-', op.name, op.role || 'OPERADOR', op.groupName || 'Sin Guardia', 'Activo (N)']),
    ...stNightOperators.value.map((op, idx) => [nightOperators.value.length + idx + 1, op.code || '-', op.name, op.role || 'OPERADOR', op.groupName || 'Sin Guardia', 'Sobretiempo (ST-N)']),
    ...absentNightOperators.value.map((op, idx) => [
      nightOperators.value.length + stNightOperators.value.length + idx + 1,
      op.code || '-',
      op.name,
      op.role || 'OPERADOR',
      op.groupName || 'Sin Guardia',
      op.absentBadge === 'V-N' ? 'Vacaciones (V-N)' : 'Descanso Medico (DM-N)'
    ])
  ];

  autoTable(doc, {
    startY: currentY,
    head: [[{ content: `DETALLE DE PERSONAL TURNO NOCHE (${totalNight} OPERADORES)`, colSpan: 6, styles: { halign: 'left', fontSize: 9 } }], ['#', 'Código', 'Nombre del Operador', 'Rol / Cargo', 'Guardia / Grupo', 'Estado']],
    body: nightRows.length > 0 ? nightRows : [[{ content: 'Sin personal registrado en Turno Noche', colSpan: 6, styles: { halign: 'center' } }]],
    headStyles: { fillColor: [67, 56, 202], textColor: [255, 255, 255], fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 38 },
      4: { cellWidth: 32 },
      5: { cellWidth: 38, halign: 'center' }
    }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount} - QH Relavera Turno Noche`, 105, 290, { align: 'center' });
  }

  doc.save(`Guardia_del_Dia_Turno_Noche_${selectedDate.value}.pdf`);
};

// Filtrar por turno del día seleccionado
const dayOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'D')
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

const nightOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'N')
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

const stDayOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'ST-D' || (op.todayShift === 'ST' && op.todayBaseShift !== 'N'))
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

const stNightOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'ST-N')
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

const vacationDayOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'V' && op.todayBaseShift === 'D')
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

const vacationNightOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'V' && op.todayBaseShift === 'N')
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

const dmDayOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'DM' && op.todayBaseShift === 'D')
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

const dmNightOperators = computed(() =>
  matrixOperators.value
    .filter(op => op.todayShift === 'DM' && op.todayBaseShift === 'N')
    .sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name))
);

// Ausentes Unificados (Vacaciones + Descanso Médico) por Turno
const absentDayOperators = computed(() => {
  const v = vacationDayOperators.value.map(op => ({ ...op, absentBadge: 'V-D', absentClass: 'shift-v-d' }));
  const dm = dmDayOperators.value.map(op => ({ ...op, absentBadge: 'DM-D', absentClass: 'shift-dm-d' }));
  return [...v, ...dm].sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name));
});

const absentNightOperators = computed(() => {
  const v = vacationNightOperators.value.map(op => ({ ...op, absentBadge: 'V-N', absentClass: 'shift-v-n' }));
  const dm = dmNightOperators.value.map(op => ({ ...op, absentBadge: 'DM-N', absentClass: 'shift-dm-n' }));
  return [...v, ...dm].sort((a, b) => (a.groupId || 999) - (b.groupId || 999) || a.name.localeCompare(b.name));
});
</script>

<style scoped>
.daily-roster-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* === Selector de Fecha === */
.date-selector-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.date-selector-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.calendar-emoji {
  font-size: 2rem;
}

.date-label-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.date-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.date-input {
  padding: 0.6rem 1rem;
  border: 2px solid #4f46e5;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  outline: none;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.date-input:focus {
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.pdf-buttons-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.btn-export-pdf {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.12);
}

.btn-pdf-day {
  background: #059669;
}
.btn-pdf-day:hover {
  background: #047857;
  transform: translateY(-1px);
}

.btn-pdf-night {
  background: #4338ca;
}
.btn-pdf-night:hover {
  background: #3730a3;
  transform: translateY(-1px);
}

.btn-col-pdf {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  margin-left: auto;
}

.btn-col-pdf-day {
  background: #059669;
}
.btn-col-pdf-day:hover {
  background: #047857;
}

.btn-col-pdf-night {
  background: #4338ca;
}
.btn-col-pdf-night:hover {
  background: #3730a3;
}

.date-summary-pills {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.pill-day          { background: #dcfce7; color: #166534; }
.pill-night        { background: #e0e7ff; color: #3730a3; }
.pill-free         { background: #f1f5f9; color: #475569; }
.pill-vacation     { background: #fef3c7; color: #92400e; }
.pill-vacation-day { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
.pill-vacation-night{ background: #fae8ff; color: #86198f; border: 1px solid #f0abfc; }
.pill-absent-day   { background: #fef3c7; color: #92400e; border: 1px solid #fde047; }
.pill-absent-night { background: #fae8ff; color: #86198f; border: 1px solid #f0abfc; }
.pill-st           { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
.pill-dm           { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }

/* === Grilla de resultados === */
.roster-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.roster-col {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.roster-col-compact {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.col-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 2px solid #e2e8f0;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  font-size: 0.82rem;
  font-weight: 800;
  border-bottom: 1px solid #e2e8f0;
}

.active-day-sub-header   { background: #f0fdf4; color: #166534; }
.active-night-sub-header { background: #eef2ff; color: #3730a3; }
.st-sub-header           { background: #e0f2fe; color: #0369a1; }
.absent-day-sub-header   { background: #fffbe8; color: #92400e; }
.absent-night-sub-header { background: #fdf4ff; color: #86198f; }

.sub-title { font-weight: 800; }
.sub-count {
  background: rgba(0, 0, 0, 0.08);
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  font-size: 0.78rem;
}

.day-header            { background: #f0fdf4; border-bottom-color: #86efac; }
.night-header          { background: #eef2ff; border-bottom-color: #a5b4fc; }
.absent-day-header     { background: #fffbe8; border-bottom-color: #fde047; }
.absent-night-header   { background: #fdf4ff; border-bottom-color: #f0abfc; }
.vacation-header       { background: #fef9c3; border-bottom-color: #fde047; }
.vacation-day-header   { background: #fef9c3; border-bottom-color: #fde047; }
.vacation-night-header { background: #fae8ff; border-bottom-color: #f0abfc; }
.st-header             { background: #e0f2fe; border-bottom-color: #7dd3fc; }
.dm-header             { background: #ffe4e6; border-bottom-color: #fecdd3; }
.free-header           { background: #f8fafc; border-bottom-color: #cbd5e1; }

.mt-section {
  margin-top: 0;
  border-top: 2px solid #e2e8f0;
}

.header-icon  { font-size: 1.2rem; }
.header-title { font-size: 1rem; font-weight: 800; color: #1e293b; flex: 1; }
.header-count {
  background: rgba(0,0,0,0.08);
  padding: 0.15rem 0.55rem;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 800;
  color: #334155;
}

/* === Lista de Operadores === */
.operator-list {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 600px;
  overflow-y: auto;
}

.compact-list {
  max-height: 240px;
}

.operator-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.operator-card:hover { transform: translateX(3px); }

.day-card      { background: #f0fdf4; border-color: #bbf7d0; }
.night-card    { background: #eef2ff; border-color: #c7d2fe; }
.compact-card  { border: 1px solid #f1f5f9; }
.vacation-card { background: #fefce8; border-color: #fde68a; }
.st-card       { background: #f0f9ff; border-color: #bae6fd; }
.dm-card       { background: #fff1f2; border-color: #fecdd3; }
.free-card     { background: #f8fafc; border-color: #e2e8f0; }

.op-idx {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  min-width: 20px;
  text-align: right;
}

.op-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.op-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #0f172a;
  line-height: 1.2;
}

.compact-name {
  font-size: 0.82rem;
}

.op-meta {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.op-code {
  background: #3b82f6;
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

.op-role-tag {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.op-role-tag:hover {
  background: #e2e8f0;
  color: #0f172a;
  border-color: #94a3b8;
}

.op-guardia {
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.shift-badge {
  width: 38px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 900;
  font-size: 0.82rem;
  flex-shrink: 0;
}

.shift-d { background: #10b981; color: white; }
.shift-n { background: #6366f1; color: white; }
.shift-l { background: #e2e8f0; color: #64748b; }
.shift-v { background: #f59e0b; color: white; }
.shift-v-d { background: #eab308; color: white; }
.shift-v-n { background: #a855f7; color: white; }
.shift-st-d { background: #0284c7; color: white; }
.shift-st-n { background: #0369a1; color: white; }
.shift-dm { background: #e11d48; color: white; }
.shift-dm-d { background: #f43f5e; color: white; }
.shift-dm-n { background: #be123c; color: white; }

/* === Estados === */
.loading-state {
  text-align: center;
  padding: 3.5rem 1rem;
  color: #64748b;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
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

@keyframes spin { to { transform: rotate(360deg); } }

.initial-state {
  text-align: center;
  padding: 4rem 1.5rem;
  background: white;
  border-radius: 16px;
  border: 2px dashed #cbd5e1;
  color: #64748b;
}

.initial-icon { font-size: 3rem; margin-bottom: 0.75rem; }
.initial-state h3 { font-size: 1.2rem; color: #0f172a; margin: 0 0 0.5rem 0; }
.initial-state p { font-size: 0.9rem; max-width: 400px; margin: 0 auto; line-height: 1.5; }

.empty-col { padding: 1rem 1.25rem; color: #94a3b8; font-size: 0.85rem; font-style: italic; }
.empty-col-compact { padding: 0.6rem 0.9rem; color: #94a3b8; font-size: 0.78rem; font-style: italic; }

@media (max-width: 1024px) {
  .roster-grid {
    grid-template-columns: 1fr 1fr;
  }
  .roster-col-compact {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .mt-section { margin-top: 0; }
}

@media (max-width: 640px) {
  .roster-grid {
    grid-template-columns: 1fr;
  }
  .roster-col-compact {
    grid-column: 1;
    display: flex;
    flex-direction: column;
  }
  .date-selector-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
