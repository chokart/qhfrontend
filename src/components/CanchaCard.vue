<template>
  <div class="cancha-card" :class="[cancha.status.toLowerCase().replace(/_/g, '-'), { 'observed': cancha.status === 'OBSERVADA' }]">
    <div class="level-indicator">
      <!-- Marcas de escala para referencia visual -->
      <div class="scale-marks">
        <div v-for="i in 5" :key="i" class="scale-tick"></div>
      </div>
      
      <div class="level-fill" :style="{ height: levelPercentage + '%' }">
        <div class="fill-gloss"></div>
      </div>

      <div class="level-overlay">
        <div class="height-badge">
          <span class="height-text">{{ cancha.currentHeight }}m</span>
        </div>
      </div>
    </div>
    
    <div class="cancha-label">
      <span class="number">#{{ cancha.number }}</span>
      <span class="status-icon" :title="formatStatus(cancha.status)">
        {{ getStatusIcon(cancha.status) }}
      </span>
    </div>

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
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  min-width: 45px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.cancha-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.15);
  border-color: #6366f1;
  z-index: 10;
}

.observed { border: 2px solid #ef4444 !important; }

.level-indicator {
  flex: 1;
  background: #f8fafc;
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  border-bottom: 1px solid #e2e8f0;
}

.scale-marks {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10% 0;
  pointer-events: none;
}

.scale-tick {
  height: 1px;
  width: 100%;
  background: rgba(0,0,0,0.06);
}

.level-fill {
  width: 100%;
  background: linear-gradient(to top, #3730a3, #6366f1, #818cf8);
  transition: height 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  border-top: 2px solid #fff;
}

.fill-gloss {
  position: absolute;
  top: 0; left: 0; width: 40%; height: 100%;
  background: linear-gradient(to right, rgba(255,255,255,0.15), transparent);
}

.level-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.height-badge {
  background: #1e293b;
  padding: 4px 2px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transform: rotate(-90deg);
}

.height-text {
  font-size: 0.75rem;
  font-weight: 900;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 0.05em;
}

.cancha-label {
  padding: 0.5rem 0;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.number { font-size: 0.8rem; font-weight: 900; color: #334155; }
.status-icon { font-size: 1rem; }

.comment-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  background: #f59e0b;
  color: white;
  font-size: 11px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 10;
}
</style>
