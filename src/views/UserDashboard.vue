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
.user-dashboard { padding: 10px; color: #eee; text-align: left; min-height: 100vh; }
.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #28a745;
  padding-bottom: 10px;
  margin-bottom: 15px;
  gap: 10px;
}
.header h1 { font-size: 1.5rem; margin: 0; }
.user-info { display: flex; align-items: center; gap: 15px; }

.main-content { 
  display: flex; 
  flex-direction: column;
  gap: 20px; 
}

@media (min-width: 1024px) {
  .user-dashboard { padding: 20px; }
}

.map-section { 
  width: 100%;
}

.logout-btn { background-color: #ff4757; padding: 5px 10px; border: none; color: white; cursor: pointer; border-radius: 4px; font-weight: bold; }
</style>
