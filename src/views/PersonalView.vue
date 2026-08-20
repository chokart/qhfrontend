<template>
  <div class="personal-page">
    <AppNavbar />

    <div class="personal-container">
      <!-- Encabezado del Módulo -->
      <div class="header-section">
        <div class="title-group">
          <h1>👥 Módulo de Personal y Turnos</h1>
          <p class="subtitle">Directorio de los 127 operadores y programación de turnos 2026.</p>
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
            📅 Calendario de Turnos (2026)
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
              <span class="metric-label">Guardias Registradas</span>
              <span class="metric-value">{{ groups.length }}</span>
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
            <div class="header-right-actions">
              <button class="btn-create-operator" @click="openCreateOperatorModal" title="Registrar un nuevo trabajador en el sistema">
                ➕ Registrar Personal
              </button>
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
                  <th style="width: 50px;">#</th>
                  <th style="width: 100px;">CÓDIGO</th>
                  <th>NOMBRE COMPLETO</th>
                  <th style="width: 160px;">ROL / CARGO</th>
                  <th style="width: 150px;">GUARDIA / GRUPO</th>
                  <th style="width: 90px; text-align: center;">ESTADO</th>
                  <th style="width: 320px; text-align: center;">ACCIONES</th>
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
                  <td class="col-role">
                    <span class="role-pill" @click="openRoleModal(op)" title="Clic para editar rol">
                      🏷️ {{ op.role || 'OPERADOR' }}
                    </span>
                  </td>
                  <td class="col-guardia">
                    <div class="guardia-cell-wrapper">
                      <span 
                        v-if="op.group" 
                        class="guardia-badge"
                        :style="{ backgroundColor: op.group.color || '#4f46e5' }"
                      >
                        {{ op.group.name }}
                      </span>
                      <span v-else class="no-guardia">Sin Guardia</span>
                      <span 
                        v-if="op.onlyDayShift" 
                        class="only-day-badge"
                        title="Este operador solo trabaja turno de Día (convierte Noche 'N' a Día 'D')"
                      >
                        ☀️ Solo Día
                      </span>
                    </div>
                  </td>
                  <td class="col-status" style="text-align: center;">
                    <span class="status-pill active">Activo</span>
                  </td>
                  <td class="col-actions" style="text-align: center;">
                    <div class="actions-group">
                      <button 
                        :class="['action-btn-sun', { active: op.onlyDayShift }]"
                        @click="toggleOnlyDayShift(op)"
                        :title="op.onlyDayShift ? 'Modalidad Solo Día activa (Clic para volver a rotación normal N/D)' : 'Clic para activar modalidad Solo Día (Convierte Noche N a Día D)'"
                      >
                        ☀️ {{ op.onlyDayShift ? 'Solo Día' : 'Normal' }}
                      </button>
                      <button 
                        class="action-btn-role"
                        @click="openRoleModal(op)"
                        title="Cambiar Rol / Cargo de este trabajador"
                      >
                        🏷️ Rol
                      </button>
                      <button 
                        class="action-btn-guard"
                        @click="openChangeGuardModal(op)"
                        title="Cambiar Guardia de este operador"
                      >
                        ✏️ Guardia
                      </button>
                      <button 
                        class="action-btn-vacation"
                        @click="openVacationModal(op, 'V')"
                        title="Programar Vacaciones, Descanso Médico o Sobretiempo"
                      >
                        📝 Excepción
                      </button>
                      <button 
                        class="action-btn-delete"
                        @click="confirmDeleteOperator(op)"
                        title="Eliminar operador del sistema"
                      >
                        🗑️
                      </button>
                    </div>
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

    <!-- Modal Cambiar Guardia de Operador -->
    <div v-if="showChangeGuardModal" class="modal-backdrop" @click.self="closeChangeGuardModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>🛡️ Cambiar Guardia de Operador</h3>
          <button class="btn-close" @click="closeChangeGuardModal">✕</button>
        </div>
        <div class="modal-body" v-if="selectedOperator">
          <div class="op-card-summary">
            <span v-if="selectedOperator.code" class="code-badge">{{ selectedOperator.code }}</span>
            <span class="op-name-bold">{{ selectedOperator.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Seleccionar Guardia / Grupo de Trabajo:</label>
            <select v-model="selectedGroupId" class="form-select">
              <option :value="null">-- Sin Guardia Asignada --</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">
                {{ g.name }} ({{ g.programType || 'Rotación' }})
              </option>
            </select>
          </div>

          <div v-if="selectedGroupPreview" class="group-preview-box">
            <span class="preview-label">Vista previa del distintivo:</span>
            <span 
              class="guardia-badge"
              :style="{ backgroundColor: selectedGroupPreview.color || '#4f46e5' }"
            >
              {{ selectedGroupPreview.name }}
            </span>
          </div>
          <div v-else class="group-preview-box empty">
            <span class="preview-label">El operador quedará sin guardia asignada.</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeChangeGuardModal">Cancelar</button>
          <button class="btn-save" :disabled="savingGuard" @click="saveOperatorGuard">
            <span v-if="savingGuard">Guardando...</span>
            <span v-else>💾 Guardar Cambio</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Registrar Excepción de Operador (Vacaciones / Descanso Médico / Sobretiempo) -->
    <div v-if="showVacationModal" class="modal-backdrop" @click.self="closeVacationModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>📝 Registrar Excepción / Licencia de Operador</h3>
          <button class="btn-close" @click="closeVacationModal">✕</button>
        </div>
        <div class="modal-body" v-if="selectedVacationOperator">
          <div class="op-card-summary">
            <span v-if="selectedVacationOperator.code" class="code-badge">{{ selectedVacationOperator.code }}</span>
            <span class="op-name-bold">{{ selectedVacationOperator.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de Excepción / Estado:</label>
            <select v-model="vacationShiftType" class="form-select">
              <option value="V">🌴 Vacaciones (V)</option>
              <option value="ST-D">☀️⏰ Sobretiempo Día (ST-D)</option>
              <option value="ST-N">🌙⏰ Sobretiempo Noche (ST-N)</option>
              <option value="DM">🩺 Descanso Médico (DM)</option>
            </select>
          </div>

          <div class="form-row-dates">
            <div class="form-group">
              <label class="form-label">Fecha de Inicio:</label>
              <input type="date" v-model="vacationStartDate" class="form-input-date" />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha de Fin:</label>
              <input type="date" v-model="vacationEndDate" class="form-input-date" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Observación / Motivo (Opcional):</label>
            <input 
              type="text" 
              v-model="vacationComment" 
              placeholder="Ej. Vacaciones anuales / Descanso médico autorizadas" 
              class="form-input-text" 
            />
          </div>

          <div class="vacation-summary-box">
            <div class="summary-icon">{{ vacationShiftType === 'V' ? '🌴' : (vacationShiftType.startsWith('ST') ? '⏰' : '🩺') }}</div>
            <div class="summary-text">
              <span>El operador estará registrado en estado <b>{{ vacationShiftType === 'V' ? 'Vacaciones (V)' : (vacationShiftType === 'ST-D' ? 'Sobretiempo Día (ST-D)' : (vacationShiftType === 'ST-N' ? 'Sobretiempo Noche (ST-N)' : 'Descanso Médico (DM)')) }}</b> durante el rango de fechas seleccionado.</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeVacationModal">Cancelar</button>
          <button class="btn-save-vacation" :disabled="savingVacation" @click="saveOperatorVacation">
            <span v-if="savingVacation">Guardando...</span>
            <span v-else>💾 Confirmar Registro</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Cambiar Rol / Cargo de Operador -->
    <div v-if="showRoleModal" class="modal-backdrop" @click.self="closeRoleModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>🏷️ Cambiar Rol / Cargo de Personal</h3>
          <button class="btn-close" @click="closeRoleModal">✕</button>
        </div>
        <div class="modal-body" v-if="selectedRoleOperator">
          <div class="op-card-summary">
            <span v-if="selectedRoleOperator.code" class="code-badge">{{ selectedRoleOperator.code }}</span>
            <span class="op-name-bold">{{ selectedRoleOperator.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Seleccionar Rol / Cargo:</label>
            <select v-model="selectedRole" class="form-select">
              <option v-for="r in rolePresetOptions" :key="r" :value="r">
                {{ r }}
              </option>
            </select>
          </div>

          <div v-if="selectedRole === 'OTRO'" class="form-group">
            <label class="form-label">Especificar Cargo / Rol Personalizado:</label>
            <input 
              type="text" 
              v-model="customRole" 
              placeholder="Ej. Técnico Mecánico, Rigger, etc." 
              class="form-input-text" 
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeRoleModal">Cancelar</button>
          <button class="btn-save" :disabled="savingRole" @click="saveOperatorRole">
            <span v-if="savingRole">Guardando...</span>
            <span v-else>💾 Guardar Rol</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Registrar Nuevo Personal -->
    <div v-if="showCreateOperatorModal" class="modal-backdrop" @click.self="showCreateOperatorModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>➕ Registrar Nuevo Personal</h3>
          <button class="btn-close" @click="showCreateOperatorModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Código / ID de Ficha (Opcional):</label>
            <input type="text" v-model="createOpForm.code" placeholder="Ej. 104031" class="form-input-text" />
          </div>

          <div class="form-group">
            <label class="form-label">Nombre Completo (* Requerido):</label>
            <input type="text" v-model="createOpForm.name" placeholder="Ej. PÉREZ MORALES, JUAN CARLOS" class="form-input-text" />
          </div>

          <div class="form-group">
            <label class="form-label">Rol / Cargo Inicial:</label>
            <select v-model="createOpForm.role" class="form-select">
              <option v-for="r in rolePresetOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <div v-if="createOpForm.role === 'OTRO'" class="form-group">
            <label class="form-label">Especificar Cargo Personalizado:</label>
            <input type="text" v-model="createOpForm.customRole" placeholder="Ej. Técnico Mecánico" class="form-input-text" />
          </div>

          <div class="form-group">
            <label class="form-label">Guardia / Grupo de Trabajo:</label>
            <select v-model="createOpForm.groupId" class="form-select">
              <option :value="null">-- Sin Guardia Asignada --</option>
              <option v-for="g in groups" :key="g.id" :value="g.id">
                {{ g.name }} ({{ g.programType || 'Rotación' }})
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showCreateOperatorModal = false">Cancelar</button>
          <button class="btn-save" :disabled="savingCreateOperator" @click="saveNewOperator">
            <span v-if="savingCreateOperator">Guardando...</span>
            <span v-else>💾 Registrar Personal</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Eliminación de Personal -->
    <div v-if="showDeleteOperatorModal" class="modal-backdrop" @click.self="showDeleteOperatorModal = false">
      <div class="modal-dialog">
        <div class="modal-header danger-header">
          <h3>🗑️ Confirmar Eliminación de Personal</h3>
          <button class="btn-close" @click="showDeleteOperatorModal = false">✕</button>
        </div>
        <div class="modal-body" v-if="operatorToDelete">
          <p class="delete-warning-text">¿Estás seguro de que deseas eliminar permanentemente a este trabajador?</p>
          <div class="op-card-summary danger-summary">
            <span v-if="operatorToDelete.code" class="code-badge">{{ operatorToDelete.code }}</span>
            <span class="op-name-bold">{{ operatorToDelete.name }}</span>
            <span v-if="operatorToDelete.group" class="guardia-badge" :style="{ backgroundColor: operatorToDelete.group.color }">
              {{ operatorToDelete.group.name }}
            </span>
          </div>
          <p class="delete-sub-warning">⚠️ Esta acción eliminará al operador del directorio y todas sus excepciones asignadas.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showDeleteOperatorModal = false">Cancelar</button>
          <button class="btn-danger-confirm" :disabled="deletingOperator" @click="deleteOperatorConfirmed">
            <span v-if="deletingOperator">Eliminando...</span>
            <span v-else>🗑️ Sí, Eliminar Personal</span>
          </button>
        </div>
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
import { ref, reactive, computed, onMounted } from 'vue';
import AppNavbar from '../components/AppNavbar.vue';
import ShiftCalendar from '../components/ShiftCalendar.vue';
import GroupManagerModal from '../components/GroupManagerModal.vue';
import DailyRosterView from '../components/DailyRosterView.vue';
import api from '../api';

const activeTab = ref('calendar'); // Pestaña predeterminada al entrar
const showGroupManagerModal = ref(false);
const operators = ref([]);
const groups = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const shiftCalendarRef = ref(null);

// Estados para Modal de Cambio de Guardia
const showChangeGuardModal = ref(false);
const selectedOperator = ref(null);
const selectedGroupId = ref(null);
const savingGuard = ref(false);

// Estados para Modal de Cambio de Rol
const showRoleModal = ref(false);
const selectedRoleOperator = ref(null);
const selectedRole = ref('OPERADOR');
const customRole = ref('');
const savingRole = ref(false);

const rolePresetOptions = [
  'PAT',
  '2101',
  'QH6',
  'CICLONEROL',
  'CICLONEROP',
  'ESPESADOR',
  'SUPERVISOR',
  'SALA',
  'OPERADOR TRACTOR',
  'OPERADOR EXCAVADORA',
  'OPERADOR RODILLO',
  'FILTRERO',
  'OTRO'
];

// Estados para Modal de Vacaciones / Descanso Médico / Sobretiempo
const showVacationModal = ref(false);
const selectedVacationOperator = ref(null);
const vacationShiftType = ref('V');
const vacationStartDate = ref('');
const vacationEndDate = ref('');
const vacationComment = ref('');
const savingVacation = ref(false);

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

const fetchGroups = async () => {
  try {
    const res = await api.get('/api/v1/groups');
    groups.value = res.data;
  } catch (err) {
    console.error("Error al cargar guardias:", err);
  }
};

onMounted(() => {
  fetchOperators();
  fetchGroups();
});

const toggleOnlyDayShift = async (op) => {
  const newValue = !op.onlyDayShift;
  try {
    const res = await api.put(`/api/v1/operators/${op.id}/only-day`, {
      onlyDayShift: newValue
    });
    op.onlyDayShift = res.data.onlyDayShift;
    refreshAllData();
  } catch (err) {
    console.error("Error al actualizar modalidad Solo Día:", err);
    alert("Ocurrió un error al intentar cambiar la modalidad del operador.");
  }
};

const refreshAllData = () => {
  fetchOperators();
  fetchGroups();
  if (shiftCalendarRef.value && shiftCalendarRef.value.fetchMatrix) {
    shiftCalendarRef.value.fetchMatrix();
  }
};

const openRoleModal = (op) => {
  selectedRoleOperator.value = op;
  const current = op.role || 'OPERADOR';
  if (rolePresetOptions.includes(current)) {
    selectedRole.value = current;
    customRole.value = '';
  } else {
    selectedRole.value = 'OTRO';
    customRole.value = current;
  }
  showRoleModal.value = true;
};

const closeRoleModal = () => {
  showRoleModal.value = false;
  selectedRoleOperator.value = null;
};

const saveOperatorRole = async () => {
  if (!selectedRoleOperator.value) return;

  const roleToSave = selectedRole.value === 'OTRO' ? customRole.value.trim() : selectedRole.value;
  if (!roleToSave) return;

  savingRole.value = true;
  try {
    await api.put(`/api/v1/operators/${selectedRoleOperator.value.id}/role`, {
      role: roleToSave
    });
    closeRoleModal();
    refreshAllData();
  } catch (err) {
    console.error("Error al actualizar rol de operador:", err);
  } finally {
    savingRole.value = false;
  }
};

const openChangeGuardModal = (op) => {
  selectedOperator.value = op;
  selectedGroupId.value = op.group ? op.group.id : null;
  showChangeGuardModal.value = true;
};

const closeChangeGuardModal = () => {
  showChangeGuardModal.value = false;
  selectedOperator.value = null;
  selectedGroupId.value = null;
  savingGuard.value = false;
};

const openVacationModal = (op, defaultType = 'V') => {
  selectedVacationOperator.value = op;
  vacationShiftType.value = defaultType;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  vacationStartDate.value = `${yyyy}-${mm}-${dd}`;
  
  // +7 días por defecto
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);
  const endYyyy = endDate.getFullYear();
  const endMm = String(endDate.getMonth() + 1).padStart(2, '0');
  const endDd = String(endDate.getDate()).padStart(2, '0');
  vacationEndDate.value = `${endYyyy}-${endMm}-${endDd}`;

  vacationComment.value = '';
  showVacationModal.value = true;
};

const closeVacationModal = () => {
  showVacationModal.value = false;
  selectedVacationOperator.value = null;
  vacationShiftType.value = 'V';
  vacationStartDate.value = '';
  vacationEndDate.value = '';
  vacationComment.value = '';
  savingVacation.value = false;
};

const saveOperatorVacation = async () => {
  if (!selectedVacationOperator.value) return;
  if (!vacationStartDate.value || !vacationEndDate.value) {
    alert("Por favor ingrese tanto la Fecha de Inicio como la Fecha de Fin.");
    return;
  }
  if (vacationStartDate.value > vacationEndDate.value) {
    alert("La Fecha de Inicio no puede ser posterior a la Fecha de Fin.");
    return;
  }

  savingVacation.value = true;
  try {
    const labelMap = { 
      'V': 'Vacaciones autorizadas', 
      'DM': 'Descanso médico autorizado', 
      'ST-D': 'Sobretiempo día registrado', 
      'ST-N': 'Sobretiempo noche registrado', 
      'ST': 'Sobretiempo registrado' 
    };
    await api.post('/api/v1/shifts/override', {
      operatorId: selectedVacationOperator.value.id,
      startDate: vacationStartDate.value,
      endDate: vacationEndDate.value,
      shiftType: vacationShiftType.value,
      comment: vacationComment.value || labelMap[vacationShiftType.value]
    });

    if (shiftCalendarRef.value && shiftCalendarRef.value.fetchMatrix) {
      shiftCalendarRef.value.fetchMatrix();
    }

    closeVacationModal();
  } catch (err) {
    console.error("Error al registrar excepción de turno:", err);
    alert("Hubo un error al intentar registrar la excepción del operador.");
  } finally {
    savingVacation.value = false;
  }
};

const selectedGroupPreview = computed(() => {
  if (!selectedGroupId.value) return null;
  return groups.value.find(g => g.id === selectedGroupId.value) || null;
});

const saveOperatorGuard = async () => {
  if (!selectedOperator.value) return;
  savingGuard.value = true;
  try {
    const res = await api.put(`/api/v1/operators/${selectedOperator.value.id}/group`, {
      groupId: selectedGroupId.value
    });
    
    // Actualizar operador localmente
    const updatedOp = res.data;
    const idx = operators.value.findIndex(o => o.id === updatedOp.id);
    if (idx !== -1) {
      operators.value[idx] = updatedOp;
    }

    // Refrescar matriz de turnos si está activa
    if (shiftCalendarRef.value && shiftCalendarRef.value.fetchMatrix) {
      shiftCalendarRef.value.fetchMatrix();
    }

    closeChangeGuardModal();
  } catch (err) {
    console.error("Error al guardar guardia:", err);
    alert("Hubo un error al intentar actualizar la guardia del operador.");
  } finally {
    savingGuard.value = false;
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

// Estados para Modal de Crear Nuevo Trabajador
const showCreateOperatorModal = ref(false);
const savingCreateOperator = ref(false);
const createOpForm = reactive({
  code: '',
  name: '',
  role: 'PAT',
  customRole: '',
  groupId: null
});

const openCreateOperatorModal = () => {
  createOpForm.code = '';
  createOpForm.name = '';
  createOpForm.role = 'PAT';
  createOpForm.customRole = '';
  createOpForm.groupId = null;
  showCreateOperatorModal.value = true;
};

const saveNewOperator = async () => {
  if (!createOpForm.name.trim()) {
    alert("Por favor ingrese el nombre completo del trabajador.");
    return;
  }

  savingCreateOperator.value = true;
  try {
    const finalRole = createOpForm.role === 'OTRO' ? createOpForm.customRole.trim() : createOpForm.role;
    await api.post('/api/v1/operators', {
      code: createOpForm.code.trim(),
      name: createOpForm.name.trim(),
      role: finalRole || 'OPERADOR',
      groupId: createOpForm.groupId
    });

    showCreateOperatorModal.value = false;
    refreshAllData();
  } catch (err) {
    console.error("Error al registrar trabajador:", err);
    alert("Ocurrió un error al registrar el nuevo trabajador.");
  } finally {
    savingCreateOperator.value = false;
  }
};

// Estados para Modal de Eliminar Trabajador
const showDeleteOperatorModal = ref(false);
const operatorToDelete = ref(null);
const deletingOperator = ref(false);

const confirmDeleteOperator = (op) => {
  operatorToDelete.value = op;
  showDeleteOperatorModal.value = true;
};

const deleteOperatorConfirmed = async () => {
  if (!operatorToDelete.value) return;
  deletingOperator.value = true;
  try {
    await api.delete(`/api/v1/operators/${operatorToDelete.value.id}`);
    showDeleteOperatorModal.value = false;
    operatorToDelete.value = null;
    refreshAllData();
  } catch (err) {
    console.error("Error al eliminar operador:", err);
    alert("Ocurrió un error al intentar eliminar el operador.");
  } finally {
    deletingOperator.value = false;
  }
};
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

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-create-operator {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
  white-space: nowrap;
}

.btn-create-operator:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.3);
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
  display: inline-block;
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

.actions-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.role-pill {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  font-weight: 700;
  font-size: 0.76rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  display: inline-block;
  cursor: pointer;
  transition: all 0.15s ease;
}
.role-pill:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.guardia-cell-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.only-day-badge {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.action-btn-sun {
  background: #fef9c3;
  color: #854d0e;
  border: 1px solid #fef08a;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn-sun.active {
  background: #f59e0b;
  color: white;
  border-color: #d97706;
}

.action-btn-sun:hover {
  filter: brightness(0.95);
}

.action-btn-role {
  background: #e0e7ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn-role:hover {
  background: #4338ca;
  color: white;
  border-color: #4338ca;
  box-shadow: 0 2px 6px rgba(67, 56, 202, 0.25);
}

.action-btn-guard {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn-guard:hover {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

.action-btn-vacation {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn-vacation:hover {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.action-btn-delete {
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #fca5a5;
  padding: 0.35rem 0.55rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn-delete:hover {
  background: #ef4444;
  color: white;
  border-color: #dc2626;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.danger-header {
  border-bottom: 2px solid #fca5a5 !important;
}

.danger-header h3 {
  color: #b91c1c !important;
}

.danger-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff5f5;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #fecdd3;
  margin: 0.75rem 0;
}

.op-name-bold {
  font-weight: 800;
  color: #0f172a;
}

.delete-warning-text {
  color: #334155;
  font-weight: 600;
  font-size: 0.95rem;
  margin-top: 0;
}

.delete-sub-warning {
  color: #ef4444;
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 0;
}

.btn-danger-confirm {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger-confirm:hover {
  background: #b91c1c;
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
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

/* Modal Estilos */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-dialog {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #94a3b8;
  cursor: pointer;
}

.btn-close:hover {
  color: #334155;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.op-card-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f1f5f9;
  padding: 0.75rem 1rem;
  border-radius: 10px;
}

.op-name-bold {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.form-row-dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
}

.form-select, .form-input-date, .form-input-text {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 0.88rem;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-select:focus, .form-input-date:focus, .form-input-text:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.group-preview-box {
  background: #faf5ff;
  border: 1px dashed #d8b4fe;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-preview-box.empty {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.vacation-summary-box {
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.summary-icon {
  font-size: 1.5rem;
}

.summary-text {
  font-size: 0.82rem;
  color: #92400e;
  line-height: 1.3;
}

.preview-label {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-save {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
  transition: all 0.2s ease;
}

.btn-save:hover:not(:disabled) {
  background: #4338ca;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-save-vacation {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
  transition: all 0.2s ease;
}

.btn-save-vacation:hover:not(:disabled) {
  background: #d97706;
}

.btn-save-vacation:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .personal-view-container { padding: 0 0.85rem; }
  .metrics-grid { grid-template-columns: 1fr; }
  .header-section { flex-direction: column; align-items: stretch; gap: 0.75rem; }
  .search-box { max-width: 100%; }
  .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .form-row-dates { grid-template-columns: 1fr; }
}
</style>
