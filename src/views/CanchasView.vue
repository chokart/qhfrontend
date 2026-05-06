<template>
  <div class="canchas-view">
    <div class="header">
      <div class="title-section">
        <router-link to="/" class="btn-back">← Volver</router-link>
        <h1>Control de Canchas (Niveles)</h1>
      </div>
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Total Canchas:</span>
          <span class="stat-value">{{ canchas.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Promedio Altura:</span>
          <span class="stat-value">{{ avgHeight.toFixed(2) }}m</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      Cargando información de canchas...
    </div>

    <div v-else class="canchas-grid">
      <CanchaCard 
        v-for="cancha in canchas" 
        :key="cancha.id" 
        :cancha="cancha" 
        @updated="fetchCanchas"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../api';
import CanchaCard from '../components/CanchaCard.vue';

const canchas = ref([]);
const loading = ref(true);

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

const avgHeight = computed(() => {
  if (canchas.value.length === 0) return 0;
  const sum = canchas.value.reduce((acc, c) => acc + c.currentHeight, 0);
  return sum / canchas.value.length;
});

onMounted(fetchCanchas);
</script>

<style scoped>
.canchas-view { padding: 2rem; background: #f8fafc; min-height: 100vh; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.title-section { display: flex; align-items: center; gap: 1.5rem; }
.btn-back { 
  text-decoration: none; 
  color: #64748b; 
  font-weight: 700; 
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: white;
  border: 1px solid #e2e8f0;
}
.btn-back:hover { background: #f1f5f9; color: #1e293b; }

h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }

.stats-bar { display: flex; gap: 2rem; }
.stat-item { display: flex; flex-direction: column; align-items: flex-end; }
.stat-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.stat-value { font-size: 1.25rem; font-weight: 800; color: #6366f1; }

.canchas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.loading-state {
  text-align: center;
  padding: 5rem;
  color: #64748b;
  font-weight: 600;
}

@media (max-width: 768px) {
  .header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .stats-bar { width: 100%; justify-content: space-between; }
  .canchas-grid { grid-template-columns: 1fr; }
}
</style>
