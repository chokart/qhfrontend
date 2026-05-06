<template>
  <div class="cancha-card" :class="[cancha.status.toLowerCase().replace(/_/g, '-'), { 'observed': cancha.status === 'OBSERVADA' }]">
    <div class="layer-indicator">
      <div 
        v-for="layer in 10" 
        :key="layer" 
        class="layer-block" 
        :class="{ 'filled': layer <= cancha.currentCapa }"
      >
        <span v-if="layer === cancha.currentCapa" class="layer-text">Capa {{ layer }}</span>
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
const props = defineProps({
  cancha: { type: Object, required: true }
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
  flex-shrink: 1;
  min-width: 35px;
  overflow: hidden;
}

.cancha-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #f59e0b;
  z-index: 10;
}

.observed { border-color: #ef4444 !important; border-width: 2px; }
.cicloneando { border-bottom: 4px solid #10b981; }

.layer-indicator {
  flex: 1;
  background: #f1f5f9;
  display: flex;
  flex-direction: column-reverse; /* Capa 1 abajo */
}

.layer-block {
  flex: 1;
  border-top: 1px solid white;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}
.layer-block:first-child { border-top: none; } /* La capa 1 no tiene borde arriba suyo, que ahora es abajo */

.layer-block.filled {
  background: #f59e0b; /* Color naranja distintivo para las capas */
}

.layer-text {
  font-size: 0.55rem;
  font-weight: 800;
  color: white;
  transform: rotate(-90deg);
  white-space: nowrap;
}

.cancha-label {
  padding: 0.35rem 0;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border-top: 1px solid #f1f5f9;
}

.number { font-size: 0.7rem; font-weight: 900; color: #475569; }
.status-icon { font-size: 0.85rem; }

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
