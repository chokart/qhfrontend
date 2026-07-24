<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Editar Cancha {{ cancha.number }}</h2>
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
            <label>Altura Actual (m)</label>
            <input type="number" v-model.number="formData.currentHeight" step="0.1" min="1050" max="1220" class="form-control" />
          </div>
        </div>

        <!-- Asignación de Tractores (Máximo 2) -->
        <div class="form-group">
          <label>Tractores Asignados (Máx. 2)</label>
          <div class="form-row">
            <select v-model="formData.tractor1" class="form-control flex-1">
              <option value="">Tractor 1: Ninguno</option>
              <option v-for="eq in tractorOptions" :key="eq.id" :value="eq.name">
                {{ eq.name }}
              </option>
            </select>
            <select v-model="formData.tractor2" class="form-control flex-1">
              <option value="">Tractor 2: Ninguno</option>
              <option v-for="eq in tractorOptions" :key="eq.id" :value="eq.name">
                {{ eq.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Asignación de Operadores (Máximo 2) -->
        <div class="form-group">
          <label>Operadores Asignados (Máx. 2)</label>
          <div class="form-row">
            <select v-model="formData.operator1" class="form-control flex-1">
              <option value="">Operador 1: Ninguno</option>
              <option v-for="op in operatorOptions" :key="op.id" :value="op.name">
                {{ op.code ? op.code + ' - ' + op.name : op.name }}
              </option>
            </select>
            <select v-model="formData.operator2" class="form-control flex-1">
              <option value="">Operador 2: Ninguno</option>
              <option v-for="op in operatorOptions" :key="op.id" :value="op.name">
                {{ op.code ? op.code + ' - ' + op.name : op.name }}
              </option>
            </select>
          </div>
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
import { ref, reactive, computed, watch, onMounted } from 'vue';
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
  currentHeight: 0,
  comment: '',
  tractor1: '',
  tractor2: '',
  operator1: '',
  operator2: ''
});

const statusOptions = [
  'CICLONEANDO', 'POR_CICLONEAR', 'POR_COMPACTAR', 'COMPACTADO', 
  'POR_PREPARAR_BERMA', 'DRENANDO', 'STAND_BY', 'OBSERVADA'
];

const getCategory = (name) => {
  if (!name) return '';
  if (name.startsWith('D8') || name.startsWith('D9') || name.startsWith('D10') || name.startsWith('D-') || name.toLowerCase().includes('tractor')) return 'TRACTOR';
  return '';
};

// Filtrar únicamente Tractores
const tractorOptions = computed(() => {
  return equipmentOptions.value.filter(eq => getCategory(eq.name) === 'TRACTOR');
});

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
    formData.currentHeight = newVal.currentHeight;
    formData.comment = newVal.comment || '';
    
    // Descomponer tractores asignados
    const tractors = (newVal.assignedEquipment || '').split(',').map(s => s.trim()).filter(Boolean);
    formData.tractor1 = tractors[0] || '';
    formData.tractor2 = tractors[1] || '';
    
    // Descomponer operadores asignados
    const operators = (newVal.operatorName || '').split(',').map(s => s.trim()).filter(Boolean);
    formData.operator1 = operators[0] || '';
    formData.operator2 = operators[1] || '';
  }
}, { immediate: true });

const formatStatus = (status) => status.replace(/_/g, ' ');
const close = () => { if (!loading.value) emit('close'); };

const save = async () => {
  loading.value = true;
  try {
    const assignedEquipmentCombined = [formData.tractor1, formData.tractor2].filter(Boolean).join(', ');
    const operatorNameCombined = [formData.operator1, formData.operator2].filter(Boolean).join(', ');

    const payload = {
      status: formData.status,
      currentHeight: formData.currentHeight,
      comment: formData.comment,
      assignedEquipment: assignedEquipmentCombined,
      operatorName: operatorNameCombined
    };

    await api.put(`/api/v1/canchas/${props.cancha.id}`, payload);
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
.modal-content { background: white; width: 92%; max-width: 520px; max-height: 90vh; display: flex; flex-direction: column; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; }
.modal-header { padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #1e293b; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }
.modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; flex: 1; }
.form-row { display: flex; gap: 0.75rem; }
.flex-1 { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.form-control { padding: 0.65rem; border: 1px solid #d1d5db; border-radius: 10px; font-size: 0.88rem; font-family: inherit; outline: none; }
.form-control:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
.textarea { resize: vertical; }
.modal-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; }
.btn-cancel { background: white; color: #64748b; border: 1px solid #e2e8f0; padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
.btn-save { background: #6366f1; color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 700; cursor: pointer; }

@media (max-width: 576px) {
  .modal-content { width: 95%; border-radius: 16px; }
  .modal-body { padding: 1.25rem 1rem; }
  .form-row { flex-direction: column; gap: 0.75rem; }
}
</style>
