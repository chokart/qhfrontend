<template>
  <div class="user-dashboard">
    <AppNavbar />

    <div class="dashboard-container">
      <div class="sub-header">
        <h1>EQUIPOS</h1>
        <button class="btn-outline" @click="downloadReport">
          <span>📄</span> Exportar PDF
        </button>
      </div>

      <div class="main-content">
        <div class="map-section">
          <EquipmentMap 
            ref="mapRef" 
            @update-list="handleListUpdate" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import AppNavbar from '../components/AppNavbar.vue';
import EquipmentMap from '../components/EquipmentMap.vue';
import { generateEquipmentPDF } from '../utils/reportGenerator';

const authStore = useAuthStore();
const router = useRouter();

const mapRef = ref(null);
const equipmentList = ref([]);

const handleListUpdate = (list) => {
  equipmentList.value = list;
};

const downloadReport = () => {
  generateEquipmentPDF(equipmentList.value);
};
</script>

<style scoped>
.user-dashboard { min-height: 100vh; background: var(--bg-light); padding-bottom: 2rem; }
.dashboard-container { padding: 0 1.5rem; max-width: 1400px; margin: 0 auto; }
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
.header-actions { display: flex; align-items: center; gap: 1.5rem; }
.user-info { display: flex; align-items: center; gap: 1.25rem; background: var(--card-light); padding: 0.5rem 1.25rem; border-radius: 50px; border: 1px solid var(--card-border); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.user-info span { font-size: 0.9rem; font-weight: 500; color: var(--text-muted); }

.main-content { 
  display: flex; 
  flex-direction: column;
  gap: 2.5rem; 
}

@media (min-width: 1024px) {
  .user-dashboard { padding: 2rem; }
}

.map-section { 
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
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