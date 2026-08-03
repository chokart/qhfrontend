<template>
  <div class="equipment-list-card">
    <div class="card-header">
      <h2>Estado de Equipos</h2>
      <span class="count-badge">{{ equipment.length }} equipos totales</span>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Última Act.</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="eq in equipment" :key="eq.id" :class="{ 'row-editing': editingId === eq.id }">
            <td class="col-name">
              <div class="name-wrapper">
                <span class="type-dot" :style="{ backgroundColor: getCategoryColor(eq.name) }"></span>
                <b>{{ eq.name }}</b>
              </div>
            </td>
            
            <td>
              <span :class="['area-tag', eq.currentArea ? 'in-area' : 'no-area']">
                {{ eq.currentArea || 'Fuera de zona' }}
              </span>
            </td>

            <td>
              <div v-if="editingId === eq.id">
                <select v-model="editForm.status" class="edit-select">
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="INOPERATIVO">INOPERATIVO</option>
                  <option value="STAND_BY">STAND_BY</option>
                </select>
              </div>
              <span v-else :class="['status-pill', eq.status?.toLowerCase()]">
                {{ eq.status }}
              </span>
            </td>

            <td class="col-user">
              <div class="user-info">
                <span class="username">{{ eq.lastUpdatedBy }}</span>
                <span class="date">{{ formatDate(eq.updatedAt) }}</span>
              </div>
            </td>

            <td class="text-right">
              <div v-if="editingId === eq.id" class="edit-actions">
                <button @click="saveUpdate(eq.id)" class="btn-icon btn-save" title="Guardar">✓</button>
                <button @click="cancelEdit" class="btn-icon btn-cancel" title="Cancelar">×</button>
              </div>
              <div v-else class="action-buttons-group">
                <button @click="startEdit(eq)" class="btn-outline-edit" title="Editar estado">
                  <span>✏️</span> Editar
                </button>
                <button @click="deleteEquipment(eq)" class="btn-outline-delete" title="Eliminar equipo">
                  <span>🗑️</span> Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import api from '../api';

const props = defineProps({
  equipment: { type: Array, required: true }
});

const emit = defineEmits(['update-required']);

const editingId = ref(null);
const loading = ref(false);
const editForm = reactive({
  status: '',
  comment: ''
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString([], { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getCategoryColor = (name) => {
  if (name.startsWith('BATERIA') || name.startsWith('NIDO')) return '#00cec9';
  if (name.startsWith('D8')) return '#ff4757';
  if (name.startsWith('D9')) return '#2ed573';
  if (name.startsWith('D10')) return '#1e90ff';
  if (name.includes('Exc.')) return '#ffa502';
  return '#cbd5e1';
};

const startEdit = (eq) => {
  editingId.value = eq.id;
  editForm.status = eq.status || 'OPERATIVO';
  editForm.comment = eq.comment || '';
};

const cancelEdit = () => { editingId.value = null; };

const saveUpdate = async (id) => {
  loading.value = true;
  try {
    await api.put(`/api/v1/equipment/${id}/status`, editForm);
    editingId.value = null;
    emit('update-required');
  } catch (error) {
    alert("Error al actualizar");
  } finally {
    loading.value = false;
  }
};

const deleteEquipment = async (eq) => {
  if (!confirm(`¿Estás seguro de eliminar el equipo "${eq.name}" del sistema?`)) {
    return;
  }
  loading.value = true;
  try {
    await api.delete(`/api/v1/equipment/${eq.id}`);
    emit('update-required');
  } catch (error) {
    alert("Error al eliminar el equipo");
  } finally {
    loading.value = false;
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
  margin-top: 2rem;
}

.card-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }
.count-badge { font-size: 0.75rem; background: #f1f5f9; color: #64748b; padding: 0.25rem 0.75rem; border-radius: 50px; font-weight: 700; }

.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }

th {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

td { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }

.name-wrapper { display: flex; align-items: center; gap: 10px; }
.type-dot { width: 8px; height: 8px; border-radius: 50%; }

.status-pill {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}
.operativo { background: #dcfce7; color: #166534; }
.inoperativo { background: #fee2e2; color: #991b1b; }
.stand_by { background: #fef3c7; color: #92400e; }

.area-tag { font-size: 0.8rem; font-weight: 600; }
.in-area { color: #6366f1; }
.no-area { color: #94a3b8; font-style: italic; }

.user-info { display: flex; flex-direction: column; line-height: 1.2; }
.username { font-weight: 700; color: #475569; font-size: 0.85rem; }
.date { font-size: 0.75rem; color: #94a3b8; }

.text-right { text-align: right; }

.action-buttons-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-outline-edit {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.btn-outline-edit:hover { background: #f8fafc; border-color: #cbd5e1; }

.btn-outline-delete {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.btn-outline-delete:hover {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}

.btn-icon {
  width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold;
}
.btn-save { background: #10b981; color: white; margin-right: 5px; }
.btn-cancel { background: #ef4444; color: white; }

.edit-select { padding: 0.4rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; }
.row-editing { background: #f0f9ff; }
</style>
