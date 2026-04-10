<template>
  <div class="user-dashboard">
    <div class="header">
      <h1>Panel de Seguimiento y Registro</h1>
      <div class="header-actions">
        <button class="btn-outline" @click="downloadReport">
          <span>📄</span> Exportar PDF
        </button>
        <div class="user-info">
          <span>Usuario: <b>{{ authStore.username }}</b></span>
          <button class="logout-btn" @click="handleLogout">Cerrar Sesión</button>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="map-section">
        <EquipmentMap ref="mapRef" @update-list="handleListUpdate" />
        <EquipmentList :equipment="equipmentList" @update-required="mapRef.loadData()" />
        <EquipmentSummary :equipment="equipmentList" style="margin-top: 20px;" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import EquipmentMap from '../components/EquipmentMap.vue';
import EquipmentList from '../components/EquipmentList.vue';
import EquipmentSummary from '../components/EquipmentSummary.vue';
import { generateEquipmentPDF } from '../utils/reportGenerator';

const authStore = useAuthStore();
const router = useRouter();

const mapRef = ref(null);
const equipmentList = ref([]);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const handleListUpdate = (list) => {
  equipmentList.value = list;
};

const downloadReport = () => {
  generateEquipmentPDF(equipmentList.value);
};
</script>

<style scoped>
.user-dashboard { padding: 1.5rem; color: var(--text-main); text-align: left; min-height: 100vh; background: var(--bg-light); }
.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  gap: 1rem;
}
.header h1 { 
  font-size: 1.85rem; 
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
