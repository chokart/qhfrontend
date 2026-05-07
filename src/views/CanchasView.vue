<template>
  <div class="canchas-view">
    <div class="header">
      <div class="title-section">
        <router-link to="/" class="btn-back">← Volver</router-link>
        <h1>Control de Canchas</h1>
      </div>
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Canchas Observadas:</span>
          <span class="stat-value error">{{ observedCount }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Cargando información de canchas...
    </div>

    <div v-else class="content-wrapper">
      <!-- Sección de Niveles -->
      <div class="section-title">
        <h2>Canchas Dique Principal</h2>
        <span class="stat-badge">Promedio Altura: {{ avgHeight.toFixed(2) }}m</span>
      </div>
      <div class="parallel-container">
        <div class="canchas-parallel">
          <CanchaCard 
            v-for="cancha in canchasNiveles" 
            :key="'n_'+cancha.id" 
            :cancha="cancha" 
            @click="openModalNivel(cancha)"
          />
        </div>
      </div>

      <!-- Sección de Capas -->
      <div class="section-title" style="margin-top: 2rem;">
        <h2>Canchas Dique Lateral</h2>
      </div>
      <div class="parallel-container">
        <div class="canchas-parallel canchas-capas-parallel">
          <CanchaCapaCard 
            v-for="cancha in canchasCapas" 
            :key="'c_'+cancha.id" 
            :cancha="cancha" 
            @click="openModalCapa(cancha)"
          />
        </div>
      </div>
    </div>

    <!-- Modales de Edición -->
    <CanchaModal 
      :show="showModalNivel" 
      :cancha="selectedCanchaNivel" 
      @close="showModalNivel = false" 
      @updated="fetchData"
    />
    <CanchaCapaModal 
      :show="showModalCapa" 
      :cancha="selectedCanchaCapa" 
      @close="showModalCapa = false" 
      @updated="fetchData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api';
import CanchaCard from '../components/CanchaCard.vue';
import CanchaCapaCard from '../components/CanchaCapaCard.vue';
import CanchaModal from '../components/CanchaModal.vue';
import CanchaCapaModal from '../components/CanchaCapaModal.vue';

const canchasNiveles = ref([]);
const canchasCapas = ref([]);
const loading = ref(true);

const showModalNivel = ref(false);
const selectedCanchaNivel = ref(null);

const showModalCapa = ref(false);
const selectedCanchaCapa = ref(null);

const fetchData = async () => {
  try {
    const [resNiveles, resCapas] = await Promise.all([
      api.get('/api/v1/canchas'),
      api.get('/api/v1/canchas-capas')
    ]);
    canchasNiveles.value = resNiveles.data;
    canchasCapas.value = resCapas.data;
  } catch (error) {
    console.error("Error fetching canchas:", error);
  } finally {
    loading.value = false;
  }
};

const openModalNivel = (cancha) => {
  selectedCanchaNivel.value = cancha;
  showModalNivel.value = true;
};

const openModalCapa = (cancha) => {
  selectedCanchaCapa.value = cancha;
  showModalCapa.value = true;
};

const avgHeight = computed(() => {
  if (canchasNiveles.value.length === 0) return 0;
  const sum = canchasNiveles.value.reduce((acc, c) => acc + c.currentHeight, 0);
  return sum / canchasNiveles.value.length;
});

const observedCount = computed(() => {
  const countNiveles = canchasNiveles.value.filter(c => c.status === 'OBSERVADA').length;
  const countCapas = canchasCapas.value.filter(c => c.status === 'OBSERVADA').length;
  return countNiveles + countCapas;
});

onMounted(fetchData);
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
  margin-bottom: 2rem;
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

.content-wrapper { display: flex; flex-direction: column; gap: 1rem; }

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.section-title h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #334155; }
.stat-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 800; }

.parallel-container {
  background: white;
  border-radius: 20px;
  padding: 1.5rem 1rem;
  overflow-x: auto;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.canchas-parallel {
  display: flex;
  flex-direction: row-reverse;
  gap: 6px;
  padding-bottom: 0.5rem;
  width: 100%;
  justify-content: center;
}

.canchas-capas-parallel {
  flex-direction: row;
}

.loading-state {
  text-align: center;
  padding: 5rem;
  color: #64748b;
  font-weight: 600;
}

.parallel-container::-webkit-scrollbar { height: 10px; }
.parallel-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
.parallel-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.parallel-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

@media (max-width: 768px) {
  .header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .stats-bar { width: 100%; justify-content: space-between; }
}
</style>
