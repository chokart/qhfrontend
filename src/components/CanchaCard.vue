<template>
  <div class="cancha-card" :class="[cancha.status.toLowerCase().replace(/_/g, '-'), { 'observed': cancha.status === 'OBSERVADA' }]">
    <div class="level-indicator">
      <div class="level-fill" :style="{ height: levelPercentage + '%' }"></div>
      <div class="level-overlay">
        <span class="height-text">{{ cancha.currentHeight }}m</span>
      </div>
    </div>
    
    <div class="cancha-label">
      <span class="number">#{{ cancha.number }}</span>
      <span class="status-icon" :title="formatStatus(cancha.status)">
        {{ getStatusIcon(cancha.status) }}
      </span>
    </div>

    <!-- Comentario rápido si existe -->
    <div v-if="cancha.comment" class="comment-dot" :title="cancha.comment">!</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  cancha: { type: Object, required: true }
});

const levelPercentage = computed(() => {
  const min = 1050; 
  const max = 1220;
  const current = props.cancha.currentHeight;
  const pct = ((current - min) / (max - min)) * 100;
  return Math.min(Math.max(pct, 2), 100); 
});

const formatStatus = (status) => status.replace(/_/g, ' ');

const getStatusIcon = (status) => {
  const icons = {
    'CICLONEANDO': '🌀',
    'POR_CICLONEAR': '⏳',
    'POR_COMPACTAR': '🚜',
    'COMPACTADO': '✅',
    'POR_PREPARAR_BERMA': '🚧',
    'DRENANDO': '💧',
    'STAND_BY': '🛑',
    'OBSERVADA': '⚠️'
  };
  return icons[status] || '•';
};
</script>

<style scoped>
.cancha-card {
  width: 45px;
  height: 320px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  min-width: 45px;
  overflow: hidden;
}

.cancha-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #6366f1;
  z-index: 10;
}

/* Colores por estado */
.observed { border-color: #ef4444 !important; border-width: 2px; }
.cicloneando { border-bottom: 4px solid #10b981; }

.level-indicator {
  flex: 1;
  background: #f1f5f9;
  position: relative;
  display: flex;
  flex-direction: column-reverse;
}

.level-fill {
  width: 100%;
  background: linear-gradient(to top, #4f46e5, #818cf8);
  transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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
  font-size: 0.65rem; /* Un poco más grande que el original (0.55) */
  font-weight: 900;
  color: #0f172a;
  transform: rotate(-90deg);
  background: rgba(255, 255, 255, 0.95); /* Más sólido para legibilidad */
  padding: 2px 5px;
  border-radius: 4px;
  white-space: nowrap;
  letter-spacing: 0.12em; /* Espaciado entre letras solicitado */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.cancha-label {
  padding: 0.4rem 0;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border-top: 1px solid #f1f5f9;
}

.number { font-size: 0.75rem; font-weight: 900; color: #475569; }
.status-icon { font-size: 0.9rem; }

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
</style>
