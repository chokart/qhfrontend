<template>
  <div 
    class="cancha-card" 
    :class="{ 'observed': cancha.status === 'OBSERVADA' }"
    :style="{ borderColor: statusColor }"
  >
    <button class="btn-hide-card" @click.stop="$emit('hide')" title="Ocultar esta cancha">🙈</button>
    <div class="level-indicator">
      <div 
        class="level-fill" 
        :style="{ height: levelPercentage + '%', backgroundColor: statusColor }"
      ></div>
      <div class="level-overlay">
        <span class="height-text">{{ cancha.currentHeight }}m</span>
      </div>
    </div>
    
    <div class="cancha-label" :style="{ borderTopColor: statusColor }">
      <span class="number">#{{ cancha.number }}</span>

      <!-- Resumen de Estado de Cancha -->
      <div 
        class="short-badge status-badge" 
        :style="{ backgroundColor: statusColor, color: '#ffffff' }"
        :title="'Estado: ' + formatStatusText(cancha.status)"
      >
        {{ getStatusShortText(cancha.status) }}
      </div>

      <!-- Primeras 3 letras de Tractores y Operadores -->
      <div v-if="cancha.assignedEquipment" class="short-badge eq-badge" :title="'Tractores: ' + cancha.assignedEquipment">
        {{ formatShort3(cancha.assignedEquipment) }}
      </div>
      <div v-if="cancha.operatorName" class="short-badge op-badge" :title="'Operadores: ' + cancha.operatorName">
        {{ formatShort3(cancha.operatorName) }}
      </div>
    </div>

    <!-- Comentario rápido si existe -->
    <div v-if="cancha.comment" class="comment-dot" :title="cancha.comment">!</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getStatusColor, formatStatusText, getStatusShortText } from '../utils/canchaColors';

const props = defineProps({
  cancha: { type: Object, required: true }
});

defineEmits(['hide']);

const statusColor = computed(() => getStatusColor(props.cancha.status));

const levelPercentage = computed(() => {
  const min = 1110; 
  const max = 1220;
  const current = props.cancha.currentHeight;
  const pct = ((current - min) / (max - min)) * 100;
  return Math.min(Math.max(pct, 2), 100); 
});

// Función para extraer las 3 primeras letras de los ítems separados por coma
const formatShort3 = (text) => {
  if (!text) return '';
  return text
    .split(',')
    .map(item => item.trim().slice(0, 3).toUpperCase())
    .filter(Boolean)
    .join(', ');
};
</script>

<style scoped>
.cancha-card {
  width: 48px;
  min-height: 330px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  min-width: 48px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .cancha-card {
    min-height: 250px;
    width: 42px;
    min-width: 42px;
  }
}

.cancha-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.observed { 
  border-color: #ef4444 !important; 
  border-width: 2.5px;
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.level-indicator {
  flex: 1;
  background: #f1f5f9;
  position: relative;
  display: flex;
  flex-direction: column-reverse;
}

.level-fill {
  width: 100%;
  transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
}

.level-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.height-text {
  font-size: 0.65rem;
  font-weight: 900;
  color: #0f172a;
  transform: rotate(-90deg);
  white-space: nowrap;
  letter-spacing: 0.12em;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.cancha-label {
  padding: 0.35rem 2px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border-top: 2px solid #f1f5f9;
}

.number { font-size: 0.75rem; font-weight: 900; color: #334155; }

.short-badge {
  font-size: 0.58rem;
  font-weight: 900;
  padding: 1px 3px;
  border-radius: 4px;
  line-height: 1;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.eq-badge {
  background: #f1f5f9;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}

.op-badge {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.status-badge {
  font-size: 0.55rem;
  font-weight: 900;
  padding: 1px 3px;
  border-radius: 4px;
  line-height: 1;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.comment-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 14px;
  height: 14px;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-hide-card {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 12;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 0;
}

.cancha-card:hover .btn-hide-card {
  opacity: 1;
}
</style>
