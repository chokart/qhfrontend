<template>
  <div v-if="show" class="modal-backdrop" @click.self="close">
    <div class="group-manager-card">
      <div class="modal-header">
        <h2>⚙️ Configuración de Guardias y Regímenes</h2>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <p class="section-desc">
          Edita el programa de turnos (Programa 1 de 28 días o Programa 2 de 49 días) y la fecha de anclaje de cada Guardia.
        </p>

        <div class="groups-list">
          <div v-for="g in groups" :key="g.id" class="group-item-card">
            <div class="group-header">
              <div class="group-title-row">
                <span class="color-indicator" :style="{ backgroundColor: g.color }"></span>
                <span class="group-name"><b>{{ g.name }}</b></span>
              </div>
              <button 
                class="btn-edit-group"
                @click="editGroup(g)"
              >
                ✏️ Editar
              </button>
            </div>

            <div class="group-details">
              <span class="detail-badge program">
                {{ g.programType === 'PROGRAMA_1' ? '🔄 Programa 1 (28 días)' : '🔄 Programa 2 (49 días)' }}
              </span>
              <span class="detail-badge date">
                📅 Inicio: {{ g.startDate }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="btn-close-modal">Cerrar</button>
      </div>
    </div>

    <!-- Sub-modal de Edición -->
    <div v-if="editingGroup" class="modal-backdrop sub-backdrop" @click.self="editingGroup = null">
      <div class="edit-sub-card">
        <h3>Editar {{ editingGroup.name }}</h3>

        <div class="form-field">
          <label>Programa Rotativo:</label>
          <select v-model="editForm.programType" class="field-input">
            <option value="PROGRAMA_1">Programa 1 (5D - 3L - 3N - 1L - 4D - 2L - 4N - 6L = 28 días)</option>
            <option value="PROGRAMA_2">Programa 2 (5N - 3L - 5D - 3L - 5N - 3L - 5D - 4L - 4N - 4L - 4D - 4L = 49 días)</option>
          </select>
        </div>

        <div class="form-field">
          <label>Fecha de Anclaje / Inicio de Ciclo:</label>
          <input type="date" v-model="editForm.startDate" class="field-input" />
        </div>

        <div class="form-field">
          <label>Color Identificador:</label>
          <input type="color" v-model="editForm.color" class="field-color" />
        </div>

        <div class="sub-actions">
          <button @click="editingGroup = null" class="btn-cancel">Cancelar</button>
          <button @click="saveGroup" :disabled="saving" class="btn-save">
            {{ saving ? 'Guardando...' : 'Guardar Guardia' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import api from '../api';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'updated']);

const groups = ref([]);
const editingGroup = ref(null);
const saving = ref(false);

const editForm = reactive({
  programType: 'PROGRAMA_1',
  startDate: '',
  color: '#4f46e5'
});

const p1Json = '["D","D","D","D","D","L","L","L","N","N","N","L","D","D","D","D","L","L","N","N","N","N","L","L","L","L","L","L"]';
const p2Json = '["N","N","N","N","N","L","L","L","D","D","D","D","D","L","L","L","N","N","N","N","N","L","L","L","D","D","D","D","D","L","L","L","L","N","N","N","N","L","L","L","L","D","D","D","D","L","L","L","L"]';

const fetchGroups = async () => {
  try {
    const res = await api.get('/api/v1/groups');
    groups.value = res.data;
  } catch (err) {
    console.error(err);
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) fetchGroups();
});

const editGroup = (g) => {
  editingGroup.value = g;
  editForm.programType = g.programType || 'PROGRAMA_1';
  editForm.startDate = g.startDate || '2026-07-01';
  editForm.color = g.color || '#4f46e5';
};

const saveGroup = async () => {
  if (!editingGroup.value) return;
  saving.value = true;
  try {
    const patternJson = editForm.programType === 'PROGRAMA_1' ? p1Json : p2Json;
    await api.put(`/api/v1/groups/${editingGroup.value.id}`, {
      name: editingGroup.value.name,
      color: editForm.color,
      programType: editForm.programType,
      startDate: editForm.startDate,
      patternJson
    });
    editingGroup.value = null;
    await fetchGroups();
    emit('updated');
  } catch (err) {
    alert("Error al actualizar la guardia.");
  } finally {
    saving.value = false;
  }
};

const close = () => emit('close');
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.sub-backdrop {
  z-index: 2100;
}

.group-manager-card {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.section-desc {
  color: #64748b;
  font-size: 0.88rem;
  margin-top: 0;
  margin-bottom: 1.25rem;
}

.groups-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.group-item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.group-name {
  font-size: 0.95rem;
  color: #0f172a;
}

.btn-edit-group {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.group-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.detail-badge {
  font-size: 0.78rem;
  color: #475569;
  font-weight: 600;
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.btn-close-modal {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

/* Edit Sub Card */
.edit-sub-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 460px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.edit-sub-card h3 {
  margin-top: 0;
  color: #0f172a;
  margin-bottom: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.form-field label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
}

.field-input {
  padding: 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  font-family: inherit;
}

.field-color {
  width: 60px;
  height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
}

.sub-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn-cancel {
  background: white;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

.btn-save {
  background: #4f46e5;
  border: none;
  color: white;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 640px) {
  .groups-list {
    grid-template-columns: 1fr;
  }
}
</style>
