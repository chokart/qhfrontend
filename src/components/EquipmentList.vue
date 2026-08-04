<template>
  <div class="equipment-list-card">
    <div class="card-header">
      <div class="header-left">
        <h2>📋 Directorio y Estado de Equipos</h2>
        <span class="count-badge">{{ equipment.length }} equipos registrados</span>
      </div>
      <button class="btn-create-equipment" @click="$emit('open-create-modal')">
        <span>➕</span> Crear Nuevo Equipo
      </button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th @click="sortBy('id')" class="sortable-th" style="width: 55px;" title="Ordenar por número">
              # <span class="sort-icon">{{ getSortIcon('id') }}</span>
            </th>
            <th @click="sortBy('name')" class="sortable-th" title="Ordenar por nombre">
              NOMBRE / CÓDIGO <span class="sort-icon">{{ getSortIcon('name') }}</span>
            </th>
            <th @click="sortBy('shortCode')" class="sortable-th" style="width: 110px;" title="Ordenar por resumen">
              RESUMEN <span class="sort-icon">{{ getSortIcon('shortCode') }}</span>
            </th>
            <th @click="sortBy('equipmentType')" class="sortable-th" style="width: 140px;" title="Ordenar por tipo de equipo">
              TIPO DE EQUIPO <span class="sort-icon">{{ getSortIcon('equipmentType') }}</span>
            </th>
            <th @click="sortBy('plate')" class="sortable-th" style="width: 110px;" title="Ordenar por placa">
              PLACA <span class="sort-icon">{{ getSortIcon('plate') }}</span>
            </th>
            <th @click="sortBy('spccCode')" class="sortable-th" style="width: 120px;" title="Ordenar por código SPCC">
              CÓDIGO SPCC <span class="sort-icon">{{ getSortIcon('spccCode') }}</span>
            </th>
            <th @click="sortBy('description')" class="sortable-th" title="Ordenar por descripción">
              DESCRIPCIÓN <span class="sort-icon">{{ getSortIcon('description') }}</span>
            </th>
            <th @click="sortBy('status')" class="sortable-th" style="width: 120px;" title="Ordenar por estado">
              ESTADO <span class="sort-icon">{{ getSortIcon('status') }}</span>
            </th>
            <th @click="sortBy('currentArea')" class="sortable-th" style="width: 140px;" title="Ordenar por ubicación">
              UBICACIÓN <span class="sort-icon">{{ getSortIcon('currentArea') }}</span>
            </th>
            <th style="width: 160px;" class="text-center">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(eq, idx) in sortedEquipment" :key="eq.id">
            <td class="col-idx">{{ idx + 1 }}</td>

            <td class="col-name">
              <div class="name-wrapper">
                <span class="type-dot" :style="{ backgroundColor: getCategoryColor(eq) }"></span>
                <b>{{ eq.name }}</b>
              </div>
            </td>

            <td class="col-short">
              <span class="short-badge">{{ eq.shortCode || getFallbackShortCode(eq.name) }}</span>
            </td>

            <td class="col-type">
              <span class="type-badge" :style="{ backgroundColor: getCategoryColor(eq) + '20', color: getCategoryColor(eq), borderColor: getCategoryColor(eq) + '60' }">
                {{ formatTypeLabel(eq.equipmentType || getCategoryType(eq.name)) }}
              </span>
            </td>

            <td class="col-plate">
              <span v-if="eq.plate" class="plate-pill">🚘 {{ eq.plate }}</span>
              <span v-else class="text-muted">-</span>
            </td>

            <td class="col-spcc">
              <span v-if="eq.spccCode" class="spcc-pill">🏷️ {{ eq.spccCode }}</span>
              <span v-else class="text-muted">-</span>
            </td>

            <td class="col-desc">
              <span v-if="eq.description" class="desc-text" :title="eq.description">{{ eq.description }}</span>
              <span v-else class="text-muted">-</span>
            </td>

            <td>
              <span :class="['status-pill', eq.status?.toLowerCase()]">
                {{ eq.status }}
              </span>
            </td>

            <td>
              <span :class="['area-tag', eq.currentArea ? 'in-area' : 'no-area']">
                📍 {{ eq.currentArea || 'Fuera de zona' }}
              </span>
            </td>

            <td class="text-center">
              <div class="action-buttons-group">
                <button @click="openEditModal(eq)" class="btn-outline-edit" title="Editar información completa del equipo">
                  <span>✏️</span> Editar
                </button>
                <button v-if="authStore.isAdmin" @click="deleteEquipment(eq)" class="btn-outline-delete" title="Eliminar equipo">
                  <span>🗑️</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Editar Equipo -->
    <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>✏️ Editar Equipo: {{ editForm.name }}</h3>
          <button class="btn-close" @click="closeEditModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nombre / Código Equipo *:</label>
              <input type="text" v-model="editForm.name" class="form-input-text" placeholder="Ej. Cisterna #01, D85-1" />
            </div>

            <div class="form-group">
              <label class="form-label">Resumen / Iniciales:</label>
              <input type="text" v-model="editForm.shortCode" class="form-input-text" placeholder="Ej. CIS-01, D8-01" />
            </div>

            <div class="form-group">
              <label class="form-label">Tipo de Equipo:</label>
              <select v-model="editForm.equipmentType" class="form-select">
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
              <input type="text" v-model="editForm.plate" class="form-input-text" placeholder="Ej. ABC-123" />
            </div>

            <div class="form-group">
              <label class="form-label">Código SPCC:</label>
              <input type="text" v-model="editForm.spccCode" class="form-input-text" placeholder="Ej. SPCC-9012" />
            </div>

            <div class="form-group">
              <label class="form-label">Estado Operativo:</label>
              <select v-model="editForm.status" class="form-select">
                <option value="OPERATIVO">🟢 OPERATIVO</option>
                <option value="STAND_BY">🟡 STAND_BY</option>
                <option value="INOPERATIVO">🔴 INOPERATIVO</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width" style="margin-top: 1rem;">
            <label class="form-label">Descripción Detallada:</label>
            <input type="text" v-model="editForm.description" class="form-input-text" placeholder="Ej. Camión Cisterna 5000 GAL para regado de acceso en dique" />
          </div>

          <div class="form-group full-width" style="margin-top: 0.75rem;">
            <label class="form-label">Observaciones / Comentarios:</label>
            <input type="text" v-model="editForm.comment" class="form-input-text" placeholder="Comentarios operacionales o mto..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel-modal" @click="closeEditModal">Cancelar</button>
          <button class="btn-save-modal" :disabled="saving" @click="saveEdit">
            <span v-if="saving">Guardando...</span>
            <span v-else>💾 Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const props = defineProps({
  equipment: { type: Array, required: true }
});

const emit = defineEmits(['update-required', 'open-create-modal']);

// Estado de Ordenamiento
const sortKey = ref('name');
const sortOrder = ref('asc');

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const getSortIcon = (key) => {
  if (sortKey.value !== key) return '↕';
  return sortOrder.value === 'asc' ? '▲' : '▼';
};

const sortedEquipment = computed(() => {
  const list = [...props.equipment];
  if (!sortKey.value) return list;

  return list.sort((a, b) => {
    if (sortKey.value === 'id') {
      const valA = a.id || 0;
      const valB = b.id || 0;
      return sortOrder.value === 'asc' ? valA - valB : valB - valA;
    }

    let valA = '';
    let valB = '';

    if (sortKey.value === 'name') {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
    } else if (sortKey.value === 'shortCode') {
      valA = (a.shortCode || getFallbackShortCode(a.name) || '').toLowerCase();
      valB = (b.shortCode || getFallbackShortCode(b.name) || '').toLowerCase();
    } else if (sortKey.value === 'equipmentType') {
      valA = (formatTypeLabel(a.equipmentType || getCategoryType(a.name)) || '').toLowerCase();
      valB = (formatTypeLabel(b.equipmentType || getCategoryType(b.name)) || '').toLowerCase();
    } else if (sortKey.value === 'plate') {
      valA = (a.plate || '').toLowerCase();
      valB = (b.plate || '').toLowerCase();
    } else if (sortKey.value === 'spccCode') {
      valA = (a.spccCode || '').toLowerCase();
      valB = (b.spccCode || '').toLowerCase();
    } else if (sortKey.value === 'description') {
      valA = (a.description || '').toLowerCase();
      valB = (b.description || '').toLowerCase();
    } else if (sortKey.value === 'status') {
      valA = (a.status || '').toLowerCase();
      valB = (b.status || '').toLowerCase();
    } else if (sortKey.value === 'currentArea') {
      valA = (a.currentArea || 'ZZZ').toLowerCase();
      valB = (b.currentArea || 'ZZZ').toLowerCase();
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const showEditModal = ref(false);
const editingId = ref(null);
const saving = ref(false);

const editForm = reactive({
  name: '',
  shortCode: '',
  description: '',
  plate: '',
  spccCode: '',
  equipmentType: 'TRACTOR',
  status: 'OPERATIVO',
  comment: ''
});

const formatTypeLabel = (typeKey) => {
  const map = {
    'TRACTOR': 'Tractor',
    'EXCAVADORA': 'Excavadora',
    'CISTERNA': 'Cisterna',
    'TRACTO': 'Tracto',
    'CAMION_GRUA': 'Camión Grúa',
    'CAMABAJA': 'Camabaja',
    'MOTONIVELADORA': 'Motoniveladora',
    'VOLQUETE': 'Volquete',
    'RODILLO': 'Rodillo',
    'CARGADOR': 'Cargador',
    'HIDROCICLON': 'Hidrociclón',
    'OTROS': 'Otros'
  };
  return map[typeKey] || typeKey || 'Otros';
};

const getCategoryType = (name) => {
  if (!name) return 'OTROS';
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

const getCategoryColor = (eq) => {
  const type = eq.equipmentType || getCategoryType(eq.name);
  const colors = {
    'TRACTOR': '#ff4757',
    'EXCAVADORA': '#ffa502',
    'CISTERNA': '#0984e3',
    'TRACTO': '#d63031',
    'CAMION_GRUA': '#e17055',
    'CAMABAJA': '#27ae60',
    'MOTONIVELADORA': '#fdcb6e',
    'VOLQUETE': '#1e272e',
    'RODILLO': '#747d8c',
    'CARGADOR': '#e17055',
    'HIDROCICLON': '#00cec9',
    'OTROS': '#6c5ce7'
  };
  return colors[type] || '#6c5ce7';
};

const getFallbackShortCode = (name) => {
  if (!name) return '-';
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

const openEditModal = (eq) => {
  editingId.value = eq.id;
  editForm.name = eq.name || '';
  editForm.shortCode = eq.shortCode || getFallbackShortCode(eq.name);
  editForm.description = eq.description || '';
  editForm.plate = eq.plate || '';
  editForm.spccCode = eq.spccCode || '';
  editForm.equipmentType = eq.equipmentType || getCategoryType(eq.name);
  editForm.status = eq.status || 'OPERATIVO';
  editForm.comment = eq.comment || '';
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingId.value = null;
};

const saveEdit = async () => {
  if (!editingId.value || !editForm.name.trim()) return;

  saving.value = true;
  try {
    await api.put(`/api/v1/equipment/${editingId.value}`, editForm);
    closeEditModal();
    emit('update-required');
  } catch (error) {
    console.error("Error al actualizar equipo:", error);
    alert("Error al actualizar información del equipo.");
  } finally {
    saving.value = false;
  }
};

const deleteEquipment = async (eq) => {
  if (!confirm(`¿Estás seguro de eliminar el equipo "${eq.name}" del sistema?`)) {
    return;
  }
  try {
    await api.delete(`/api/v1/equipment/${eq.id}`);
    emit('update-required');
  } catch (error) {
    alert("Error al eliminar el equipo");
  }
};
</script>

<style scoped>
.equipment-list-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  overflow: hidden;
  margin-top: 1.5rem;
}

.card-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-header h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }
.count-badge { font-size: 0.75rem; background: #f1f5f9; color: #64748b; padding: 0.25rem 0.75rem; border-radius: 50px; font-weight: 700; }

.btn-create-equipment {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}
.btn-create-equipment:hover {
  background: #4338ca;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }

th {
  padding: 1rem 1.2rem;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
  border-bottom: 2px solid #e2e8f0;
}

th.sortable-th {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}
th.sortable-th:hover {
  background: #eef2ff;
  color: #4f46e5;
}
.sort-icon {
  font-size: 0.7rem;
  margin-left: 3px;
  color: #6366f1;
  display: inline-block;
}

td { padding: 0.85rem 1.2rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; color: #334155; vertical-align: middle; }

.col-idx { color: #94a3b8; font-weight: 600; }
.name-wrapper { display: flex; align-items: center; gap: 10px; }
.type-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

.short-badge {
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-family: monospace;
}

.type-badge {
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  border: 1px solid;
  display: inline-block;
}

.plate-pill, .spcc-pill {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-weight: 700;
  font-size: 0.76rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}

.desc-text {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  color: #475569;
  font-size: 0.82rem;
}

.status-pill {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}
.operativo { background: #dcfce7; color: #166534; }
.inoperativo { background: #fee2e2; color: #991b1b; }
.stand_by { background: #fef3c7; color: #92400e; }

.area-tag { font-size: 0.8rem; font-weight: 600; }
.in-area { color: #4338ca; font-weight: 700; }
.no-area { color: #94a3b8; font-style: italic; }

.text-muted { color: #cbd5e1; font-style: italic; }
.text-center { text-align: center; }

.action-buttons-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-outline-edit {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.btn-outline-edit:hover { background: #4f46e5; color: white; border-color: #4f46e5; }

.btn-outline-delete {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline-delete:hover { background: #dc2626; color: white; }

/* MODAL STYLES */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-dialog {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 650px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: modalIn 0.2s ease-out;
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

.modal-body { padding: 1.5rem; }

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
</style>
