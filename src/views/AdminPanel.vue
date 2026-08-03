<template>
  <div class="admin-panel">
    <AppNavbar />

    <div class="panel-container">
      <div class="sub-header">
        <h1>Gestión de Equipos</h1>
        <button class="btn-outline" @click="downloadReport">
          <span>📄</span> Exportar PDF
        </button>
      </div>

      <div class="main-content">
        <div class="map-section">
          <EquipmentMap 
            ref="mapRef" 
            @update-list="handleListUpdate" 
            @update-areas="handleAreaUpdate" 
          />
          <div class="tables-grid">
            <AreaList :areas="areaList" @delete="handleDeleteArea" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import AppNavbar from '../components/AppNavbar.vue';
import EquipmentMap from '../components/EquipmentMap.vue';
import AreaList from '../components/AreaList.vue';
import { generateEquipmentPDF } from '../utils/reportGenerator';
// ... (resto del script igual)

const authStore = useAuthStore();
const router = useRouter();

const mapRef = ref(null);
const equipmentList = ref([]);
const areaList = ref([]);
const selectedCategories = ref([]);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const handleListUpdate = (list) => { equipmentList.value = list; };
const handleAreaUpdate = (areas) => { areaList.value = areas; };

const getCategory = (name) => {
  if (name.startsWith('BATERIA') || name.startsWith('NIDO')) return 'HIDROCICLON';
  if (name.startsWith('D8') || name.startsWith('D9') || name.startsWith('D10')) return 'TRACTOR';
  if (name.includes('Exc.')) return 'EXCAVADORA';
  if (name.includes('Cargador')) return 'CARGADOR';
  if (name.includes('Volquete')) return 'VOLQUETE';
  if (name.includes('Rodillo')) return 'RODILLO';
  return 'OTROS';
};

const filteredEquipmentList = computed(() => {
  if (selectedCategories.value.length === 0) return equipmentList.value;
  return equipmentList.value.filter(eq => selectedCategories.value.includes(getCategory(eq.name)));
});

const handleDeleteArea = async (id) => {
  if (confirm("¿Eliminar zona?")) {
    await api.delete(`/api/v1/areas/${id}`);
    mapRef.value.loadData();
  }
};


const downloadReport = () => {
  generateEquipmentPDF(filteredEquipmentList.value);
};
</script>

<style scoped>
.admin-panel { min-height: 100vh; background: var(--bg-light); padding-bottom: 2rem; }
.panel-container { padding: 0 1.5rem; max-width: 1400px; margin: 0 auto; }
.sub-header { 
  display: flex; 
  flex-wrap: wrap;
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid var(--card-border); 
  padding-bottom: 1rem; 
  margin-bottom: 1.5rem;
  gap: 1rem;
}
.sub-header h1 { 
  font-size: 1.5rem; 
  font-weight: 800;
  margin: 0; 
  color: var(--text-main);
  letter-spacing: -0.025em;
}

.main-content { 
  display: flex; 
  flex-direction: column;
  gap: 2.5rem; 
}

@media (min-width: 1024px) {
  .main-content { flex-direction: row; align-items: flex-start; }
}

.map-section { 
  width: 100%;
}

.tables-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 2rem; 
  margin-top: 2.5rem;
}

@media (min-width: 1200px) {
  .tables-grid { grid-template-columns: 1fr; }
}

.btn-outline {
  background: white;
  color: var(--primary);
  border: 1px solid var(--primary);
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-outline:hover { background: var(--primary); color: white; }

.btn-module {
  background: var(--primary);
  color: white;
  text-decoration: none;
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}
.btn-module:hover { background: var(--primary-hover); transform: translateY(-1px); }

.logout-btn { 
  background-color: #fee2e2; 
  padding: 0.5rem 1.25rem; 
  border: 1px solid #fecaca; 
  color: #ef4444; 
  cursor: pointer; 
  border-radius: 50px; 
  font-weight: 700;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.logout-btn:hover { background-color: #ef4444; color: white; border-color: #ef4444; }
</style>
