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
    await api.put(`/api/v1/equipment/${id}/status`, editForm, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
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
.equipment-list-card { background: #2f2f2f; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); color: #eee; margin-top: 20px; }
h2 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; font-size: 22px; }
.table-container { overflow-x: auto; max-height: 400px; }
table { width: 100%; border-collapse: collapse; text-align: left; font-size: 16px; }
th { padding: 12px; border-bottom: 2px solid #444; color: #aaa; text-transform: uppercase; font-size: 13px; }
td { padding: 10px 12px; border-bottom: 1px solid #333; }
.color-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }
.area-badge { padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: bold; }
.in-area { background: rgba(46, 213, 115, 0.2); color: #2ed573; }
.no-area { background: rgba(255, 71, 87, 0.1); color: #ff4757; }

/* Estilos para Status */
.status-badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
.operativo { background: #2ed573; color: #1a1a1a; }
.inoperativo { background: #ff4757; color: white; }
.stand_by { background: #ffa502; color: #1a1a1a; }

.comment-text { display: block; max-width: 220px; word-wrap: break-word; white-space: normal; font-size: 14px; color: #aaa; line-height: 1.4; }

/* Inputs de edición */
.edit-select, .edit-textarea { width: 100%; background: #444; color: white; border: 1px solid #666; border-radius: 4px; padding: 6px; font-size: 14px; font-family: inherit; }
.edit-textarea { resize: vertical; min-width: 180px; min-height: 40px; }

/* Botones */
.btn-edit-small { background: #555; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.btn-edit-small:hover { background: #777; }
.edit-actions { display: flex; gap: 5px; }
.btn-save { background: #2ed573; color: #1a1a1a; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-weight: bold; }
.btn-cancel { background: #ff4757; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; }

.user-info { display: flex; flex-direction: column; }
.time { font-size: 12px; color: #777; margin-top: 2px; }
.empty { text-align: center; padding: 20px; color: #777; }
</style>
