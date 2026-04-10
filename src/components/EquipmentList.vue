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
  background: var(--card-dark); 
  padding: 1.5rem; 
  border-radius: 16px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.2); 
  color: var(--text-main); 
  border: 1px solid var(--card-border);
}
h2 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 600; color: var(--primary); }
.table-container { overflow-x: auto; max-height: 450px; border-radius: 8px; }
table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
th { 
  padding: 1rem; 
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid var(--card-border); 
  color: var(--text-muted); 
  text-transform: uppercase; 
  font-size: 0.75rem; 
  letter-spacing: 0.05em;
  font-weight: 600;
}
td { padding: 1rem; border-bottom: 1px solid var(--card-border); font-size: 0.9rem; }
tr:hover td { background: rgba(255, 255, 255, 0.02); }

.area-badge { padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
.in-area { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
.no-area { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }

.status-badge { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; }
.operativo { background: var(--success); color: #064e3b; }
.inoperativo { background: var(--danger); color: #fef2f2; }
.stand_by { background: var(--warning); color: #451a03; }

.comment-text { display: block; max-width: 200px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; font-style: italic; }

.edit-select, .edit-textarea { 
  width: 100%; 
  background: var(--bg-dark); 
  color: white; 
  border: 1px solid var(--card-border); 
  border-radius: 6px; 
  padding: 0.5rem; 
  font-size: 0.85rem; 
}

.btn-edit-small { 
  background: transparent; 
  color: var(--primary); 
  border: 1px solid var(--primary); 
  padding: 0.4rem 0.8rem; 
  border-radius: 6px; 
  cursor: pointer; 
  font-size: 0.75rem; 
  font-weight: 600;
  transition: all 0.2s;
}
.btn-edit-small:hover { background: var(--primary); color: white; }

.user-info { display: flex; flex-direction: column; gap: 0.2rem; }
.time { font-size: 0.75rem; color: var(--text-muted); }
.empty { text-align: center; padding: 3rem; color: var(--text-muted); font-style: italic; }
</style>
