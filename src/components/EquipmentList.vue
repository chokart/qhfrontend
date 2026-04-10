<template>
  <div class="equipment-list-card">
    <h2>Estado de Equipos</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Área Actual</th>
            <th>Estado</th>
            <th>Comentario</th>
            <th>Actualizado por</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="eq in equipment" :key="eq.id">
            <td>
              {{ eq.name }}
            </td>
            <td>
              <span :class="['area-badge', eq.currentArea ? 'in-area' : 'no-area']">
                {{ eq.currentArea || 'Fuera' }}
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
              <span v-else :class="['status-badge', eq.status?.toLowerCase()]">
                {{ eq.status }}
              </span>
            </td>
            <td>
              <div v-if="editingId === eq.id">
                <textarea v-model="editForm.comment" class="edit-textarea" rows="1"></textarea>
              </div>
              <span v-else class="comment-text" :title="eq.comment">{{ eq.comment || '-' }}</span>
            </td>
            <td class="user-info">
              <b>{{ eq.lastUpdatedBy }}</b>
              <span class="time">{{ formatDateTime(eq.updatedAt) }}</span>
            </td>
            <td>
              <div v-if="editingId === eq.id" class="edit-actions">
                <button @click="saveUpdate(eq.id)" class="btn-save" :disabled="loading">✓</button>
                <button @click="cancelEdit" class="btn-cancel" :disabled="loading">×</button>
              </div>
              <button v-else @click="startEdit(eq)" class="btn-edit-small">Editar</button>
            </td>
          </tr>
          <tr v-if="equipment.length === 0">
            <td colspan="6" class="empty">No hay equipos registrados</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const props = defineProps({
  equipment: { type: Array, required: true }
});

const emit = defineEmits(['update-required']);
const authStore = useAuthStore();

const editingId = ref(null);
const loading = ref(false);
const editForm = reactive({
  status: '',
  comment: ''
});

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString([], { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const startEdit = (eq) => {
  editingId.value = eq.id;
  editForm.status = eq.status || 'OPERATIVO';
  editForm.comment = eq.comment || '';
};

const cancelEdit = () => {
  editingId.value = null;
};

const saveUpdate = async (id) => {
  loading.value = true;
  try {
    await api.put(`/api/v1/equipment/${id}/status`, editForm);
    editingId.value = null;
    emit('update-required'); // Avisamos al padre para que recargue los datos
  } catch (error) {
    alert("Error al actualizar equipo");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.equipment-list-card { 
  background: var(--card-light); 
  padding: 1.5rem; 
  border-radius: 20px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
  color: var(--text-main); 
  border: 1px solid var(--card-border);
}
h2 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
.table-container { overflow-x: auto; max-height: 500px; border-radius: 12px; border: 1px solid var(--card-border); }
table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
th { 
  padding: 1rem; 
  background: #f8fafc;
  border-bottom: 1px solid var(--card-border); 
  color: var(--text-muted); 
  text-transform: uppercase; 
  font-size: 0.7rem; 
  letter-spacing: 0.05em;
  font-weight: 700;
}
td { padding: 1rem; border-bottom: 1px solid var(--card-border); font-size: 0.9rem; color: #334155; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f1f5f9; }

.area-badge { padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.7rem; font-weight: 700; border: 1px solid transparent; }
.in-area { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
.no-area { background: #fff1f2; color: #991b1b; border-color: #fecaca; }

.status-badge { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.025em; }
.operativo { background: #dcfce7; color: #166534; }
.inoperativo { background: #fee2e2; color: #991b1b; }
.stand_by { background: #fef3c7; color: #92400e; }

.comment-text { display: block; max-width: 200px; color: var(--text-muted); font-size: 0.8rem; line-height: 1.4; }

.edit-select, .edit-textarea { 
  width: 100%; 
  background: #fff; 
  color: var(--text-main); 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  padding: 0.5rem; 
  font-size: 0.85rem; 
}

.btn-edit-small { 
  background: #f1f5f9; 
  color: #475569; 
  border: 1px solid #cbd5e1; 
  padding: 0.4rem 0.8rem; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 0.75rem; 
  font-weight: 700;
  transition: all 0.2s;
}
.btn-edit-small:hover { background: #e2e8f0; color: var(--text-main); border-color: #94a3b8; }

.user-info { display: flex; flex-direction: column; gap: 0.15rem; }
.time { font-size: 0.7rem; color: var(--text-muted); font-weight: 500; }
.empty { text-align: center; padding: 4rem; color: var(--text-muted); font-style: italic; }
</style>
