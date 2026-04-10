<template>
  <div class="user-dashboard">
    <div class="header">
      <h1>Panel de Seguimiento y Registro</h1>
      <div class="user-info">
        <span>Usuario: <b>{{ authStore.username }}</b></span>
        <button class="logout-btn" @click="handleLogout">Cerrar Sesión</button>
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
</script>

<style scoped>
.user-dashboard { padding: 1.5rem; color: var(--text-main); text-align: left; min-height: 100vh; background: var(--bg-dark); }
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
  font-size: 1.75rem; 
  font-weight: 700;
  margin: 0; 
  background: linear-gradient(to right, var(--success), #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.user-info { display: flex; align-items: center; gap: 1.5rem; background: var(--card-dark); padding: 0.5rem 1rem; border-radius: 50px; border: 1px solid var(--card-border); }
.user-info span { font-size: 0.9rem; color: var(--text-muted); }

.main-content { 
  display: flex; 
  flex-direction: column;
  gap: 2rem; 
}

@media (min-width: 1024px) {
  .user-dashboard { padding: 2rem; }
}

.map-section { 
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.logout-btn { 
  background-color: var(--danger); 
  padding: 0.5rem 1rem; 
  border: none; 
  color: white; 
  cursor: pointer; 
  border-radius: 50px; 
  font-weight: 600;
  font-size: 0.85rem;
}
.logout-btn:hover { opacity: 0.9; }
</style>
