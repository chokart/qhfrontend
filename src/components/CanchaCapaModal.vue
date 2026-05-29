<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Editar Cancha por Capas {{ cancha.number }}</h2>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-body" @keyup.enter="save">
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Estado</label>
            <select v-model="formData.status" class="form-control">
              <option v-for="status in statusOptions" :key="status" :value="status">
                {{ formatStatus(status) }}
              </option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>Capa Actual</label>
            <input type="number" v-model.number="formData.currentCapa" min="1" max="10" class="form-control" />
          </div>
        </div>

        <div class="form-group">
          <label>Equipo Asignado</label>
          <select v-model="formData.assignedEquipment" class="form-control">
            <option value="">Ninguno</option>
            <option v-for="eq in equipmentOptions" :key="eq.id" :value="eq.name">
              {{ eq.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Operador</label>
          <select v-model="formData.operatorName" class="form-control">
            <option value="">Ninguno</option>
            <option v-for="op in operatorOptions" :key="op.id" :value="op.name">
              {{ op.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Comentarios</label>
          <textarea v-model="formData.comment" placeholder="..." class="form-control textarea" rows="2"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="close" :disabled="loading">Cancelar</button>
        <button class="btn-save" @click="save" :disabled="loading">
          {{ loading ? '...' : 'Guardar Cambios' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import api from '../api';

const props = defineProps({
  show: Boolean,
  cancha: Object
});

const emit = defineEmits(['close', 'updated']);

const loading = ref(false);
const operatorOptions = ref([]);
const equipmentOptions = ref([]);

const formData = reactive({
  status: '',
  currentCapa: 1,
  comment: '',
  assignedEquipment: '',
  operatorName: ''
});

const statusOptions = [
  'CICLONEANDO', 'POR_CICLONEAR', 'POR_COMPACTAR', 'COMPACTADO', 
  'POR_PREPARAR_BERMA', 'DRENANDO', 'STAND_BY', 'OBSERVADA'
];

const fetchOptions = async () => {
  try {
    const [ops, eqs] = await Promise.all([
      api.get('/api/v1/operators'),
      api.get('/api/v1/equipment')
    ]);
    operatorOptions.value = ops.data;
    equipmentOptions.value = eqs.data;
  } catch (e) { console.error(e); }
};

onMounted(fetchOptions);

watch(() => props.cancha, (newVal) => {
  if (newVal) {
    formData.status = newVal.status;
    formData.currentCapa = newVal.currentCapa;
    formData.comment = newVal.comment || '';
    formData.assignedEquipment = newVal.assignedEquipment || '';
    formData.operatorName = newVal.operatorName || '';
  }
}, { immediate: true });

const formatStatus = (status) => status.replace(/_/g, ' ');
const close = () => { if (!loading.value) emit('close'); };

const save = async () => {
  loading.value = true;
  try {
    await api.put(`/api/v1/canchas-capas/${props.cancha.id}`, formData);
    emit('updated');
    emit('close');
  } catch (error) {
    alert("Error al guardar");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px); }
.modal-content { background: white; width: 90%; max-width: 500px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; }
.modal-header { padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #1e293b; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: flex; gap: 1rem; }
.flex-1 { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.form-control { padding: 0.65rem; border: 1px solid #d1d5db; border-radius: 10px; font-size: 0.95rem; font-family: inherit; outline: none; }
.form-control:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1); }
.textarea { resize: vertical; }
.modal-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; }
.btn-cancel { background: white; color: #64748b; border: 1px solid #e2e8f0; padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
.btn-save { background: #f59e0b; color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
</style>

