<template>
  <div class="canchas-view">
    <div class="header">
      <div class="title-section">
        <router-link to="/" class="btn-back">← Volver</router-link>
        <h1>Control de Canchas (Niveles)</h1>
      </div>
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Promedio Altura:</span>
          <span class="stat-value">{{ avgHeight.toFixed(2) }}m</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Canchas Observadas:</span>
          <span class="stat-value error">{{ observedCount }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Cargando información de canchas...
    </div>

    <div v-else class="parallel-container">
      <div class="canchas-parallel">
        <CanchaCard 
          v-for="cancha in canchas" 
          :key="cancha.id" 
          :cancha="cancha" 
          @click="openModal(cancha)"
        />
      </div>
    </div>

    <!-- Modal de Edición -->
    <CanchaModal 
      :show="showModal" 
      :cancha="selectedCancha" 
      @close="showModal = false" 
      @updated="fetchCanchas"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api';
import CanchaCard from '../components/CanchaCard.vue';
import CanchaModal from '../components/CanchaModal.vue';

const canchas = ref([]);
const loading = ref(true);
const showModal = ref(false);
const selectedCancha = ref(null);

const fetchCanchas = async () => {
  try {
    const response = await api.get('/api/v1/canchas');
    canchas.value = response.data;
  } catch (error) {
    console.error("Error fetching canchas:", error);
  } finally {
    loading.value = false;
  }
};

const openModal = (cancha) => {
  selectedCancha.value = cancha;
  showModal.value = true;
};

const avgHeight = computed(() => {
  if (canchas.value.length === 0) return 0;
  const sum = canchas.value.reduce((acc, c) => acc + c.currentHeight, 0);
  return sum / canchas.value.length;
});

const observedCount = computed(() => {
  return canchas.value.filter(c => c.status === 'OBSERVADA').length;
});

onMounted(fetchCanchas);
</script>

<style scoped>
.canchas-view { 
  padding: 2rem; 
  background: #f1f5f9; 
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.title-section { display: flex; align-items: center; gap: 1.5rem; }
.btn-back { 
  text-decoration: none; 
  color: #64748b; 
  font-weight: 700; 
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }

.stats-bar { display: flex; gap: 2.5rem; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; }
.stat-label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value { font-size: 1.5rem; font-weight: 900; color: #6366f1; }
.stat-value.error { color: #ef4444; }

.parallel-container {
  flex: 1;
  background: white;
  border-radius: 20px;
  padding: 1.5rem 1rem;
  overflow-x: auto; /* Scroll si la pantalla es muy pequeña */
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center; /* Centrar si sobran espacios */
}

.canchas-parallel {
  display: flex;
  flex-direction: row-reverse; /* La 1 empieza a la derecha */
  gap: 6px; /* Espacio más estrecho para que entren más */
  padding-bottom: 0.5rem;
  width: 100%;
  justify-content: center;
}

.loading-state {
  text-align: center;
  padding: 5rem;
  color: #64748b;
  font-weight: 600;
}

/* Scrollbar personalizado */
.parallel-container::-webkit-scrollbar {
  height: 10px;
}
.parallel-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}
.parallel-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.parallel-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@media (max-width: 768px) {
  .header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .stats-bar { width: 100%; justify-content: space-between; }
}
</style>
