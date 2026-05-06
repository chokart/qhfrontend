<template>
  <div class="cancha-card" :class="{ 'observed': cancha.status === 'OBSERVADA' }">
    <div class="cancha-header">
      <span class="cancha-number">Cancha {{ cancha.number }}</span>
      <span class="cancha-status-badge" :class="cancha.status.toLowerCase().replace(/_/g, '-')">
        {{ formatStatus(cancha.status) }}
      </span>
    </div>
    
    <div class="cancha-body">
      <div class="level-container">
        <div class="level-fill" :style="{ height: levelPercentage + '%' }">
          <span class="level-text">{{ cancha.currentHeight }}m</span>
        </div>
        <div class="level-marks">
          <span>1220</span>
          <span>1215</span>
          <span>1210</span>
        </div>
      </div>
      
      <div class="cancha-info">
        <div class="info-item">
          <label>Estado:</label>
          <select v-model="localStatus" @change="updateCancha" class="mini-select">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ formatStatus(status) }}
            </option>
          </select>
        </div>
        <div class="info-item">
          <label>Altura:</label>
          <input 
            type="number" 
            v-model.number="localHeight" 
            @change="updateCancha" 
            step="0.1" 
            max="1220" 
            class="mini-input"
          />
        </div>
      </div>
    </div>
    
    <div class="cancha-footer">
      <div class="comment-section">
        <input 
          type="text" 
          v-model="localComment" 
          @change="updateCancha" 
          placeholder="Añadir comentario..." 
          class="comment-input"
        />
      </div>
      <div class="update-info">
        Por: {{ cancha.lastUpdatedBy }} - {{ formatDate(cancha.updatedAt) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '../api';

const props = defineProps({
  cancha: { type: Object, required: true }
});

const emit = defineEmits(['updated']);

const localStatus = ref(props.cancha.status);
const localHeight = ref(props.cancha.currentHeight);
const localComment = ref(props.cancha.comment || '');

const statusOptions = [
  'CICLONEANDO', 'POR_CICLONEAR', 'POR_COMPACTAR', 'COMPACTADO', 
  'POR_PREPARAR_BERMA', 'DRENANDO', 'STAND_BY', 'OBSERVADA'
];

const levelPercentage = computed(() => {
  const min = 1200; // Base visual
  const max = 1220;
  const current = props.cancha.currentHeight;
  const pct = ((current - min) / (max - min)) * 100;
  return Math.min(Math.max(pct, 5), 100); // Entre 5% y 100% para visibilidad
});

const formatStatus = (status) => {
  return status.replace(/_/g, ' ');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const updateCancha = async () => {
  try {
    await api.put(`/api/v1/canchas/${props.cancha.id}`, {
      status: localStatus.value,
      currentHeight: localHeight.value,
      comment: localComment.value
    });
    emit('updated');
  } catch (error) {
    console.error("Error updating cancha:", error);
  }
};

watch(() => props.cancha, (newVal) => {
  localStatus.value = newVal.status;
  localHeight.value = newVal.currentHeight;
  localComment.value = newVal.comment || '';
}, { deep: true });
</script>

<style scoped>
.cancha-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.cancha-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.cancha-card.observed { border-left: 4px solid #ef4444; }

.cancha-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cancha-number { font-weight: 800; font-size: 0.9rem; color: #1e293b; }

.cancha-status-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}
.cicloneando { background: #dcfce7; color: #166534; }
.por-ciclonear { background: #fef3c7; color: #92400e; }
.por-compactar { background: #f3f4f6; color: #374151; }
.compactado { background: #d1fae5; color: #065f46; }
.stand-by { background: #f1f5f9; color: #475569; }
.observada { background: #fee2e2; color: #991b1b; }
.drenando { background: #e0f2fe; color: #0369a1; }

.cancha-body {
  display: flex;
  gap: 1rem;
  height: 120px;
}

.level-container {
  width: 50px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
}
.level-fill {
  width: 100%;
  background: linear-gradient(to top, #6366f1, #818cf8);
  transition: height 0.5s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
}
.level-text {
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  transform: rotate(-90deg);
  white-space: nowrap;
}
.level-marks {
  position: absolute;
  right: 2px;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.55rem;
  color: #94a3b8;
  pointer-events: none;
}

.cancha-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}
.info-item { display: flex; flex-direction: column; gap: 2px; }
.info-item label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

.mini-select, .mini-input {
  width: 100%;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  font-size: 0.75rem;
  font-weight: 600;
}

.cancha-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.comment-input {
  width: 100%;
  border: none;
  font-size: 0.75rem;
  color: #64748b;
  outline: none;
  background: transparent;
}
.update-info {
  font-size: 0.6rem;
  color: #94a3b8;
  font-style: italic;
}
</style>
