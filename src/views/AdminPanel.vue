<template>
  <div class="admin-panel">
    <div class="header">
      <h1>Sistema de Ubicación de Equipos</h1>
      <div class="user-info">
        <span>Hola, {{ authStore.username }}</span>
        <button class="logout-btn" @click="handleLogout">Cerrar Sesión</button>
      </div>
    </div>
    
    <div class="main-content">
      <div class="map-section">
        <EquipmentMap ref="mapRef" @update-list="handleListUpdate" @update-areas="handleAreaUpdate" />
        <div class="tables-grid">
          <EquipmentList :equipment="equipmentList" @update-required="mapRef.loadData()" />
          <AreaList :areas="areaList" @delete="handleDeleteArea" />
          <EquipmentSummary :equipment="equipmentList" />
        </div>
      </div>

      <div class="forms-section">
        <div class="card">
          <h2>Registrar Equipo</h2>
          <form @submit.prevent="registerEquipment">
            <input type="text" v-model="newEq.name" placeholder="Nombre del Equipo" required />
            <div class="color-picker">
              <label>Color en mapa:</label>
              <input type="color" v-model="newEq.color" />
            </div>
            <select v-model="newEq.status">
              <option value="OPERATIVO">Operativo</option>
              <option value="INOPERATIVO">Inoperativo</option>
              <option value="STAND_BY">Stand By</option>
            </select>
            <textarea v-model="newEq.comment" placeholder="Comentarios / Observaciones" rows="2"></textarea>
            <button class="btn btn-primary" type="submit">Registrar</button>
          </form>
        </div>

        <div class="card">
          <h2>Crear Usuario</h2>
          <form @submit.prevent="createUser">
            <input type="text" v-model="newUser.username" placeholder="Usuario" required />
            <input type="password" v-model="newUser.password" placeholder="Contraseña" required />
            <select v-model="newUser.role">
              <option value="USER">Usuario Común</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <button class="btn btn-success" type="submit">Crear</button>
          </form>
          <p v-if="message" :class="{ success: isSuccess, error: !isSuccess }">{{ message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import EquipmentMap from '../components/EquipmentMap.vue';
import EquipmentList from '../components/EquipmentList.vue';
import AreaList from '../components/AreaList.vue';
import EquipmentSummary from '../components/EquipmentSummary.vue';

const authStore = useAuthStore();
const router = useRouter();

const mapRef = ref(null);
const equipmentList = ref([]);
const areaList = ref([]);
const newUser = reactive({ username: '', password: '', role: 'USER' });
const newEq = reactive({ 
  name: '', 
  color: '#3388ff',
  status: 'OPERATIVO',
  comment: ''
});

const message = ref('');
const isSuccess = ref(false);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const handleListUpdate = (list) => { equipmentList.value = list; };
const handleAreaUpdate = (areas) => { areaList.value = areas; };

const handleDeleteArea = async (id) => {
  if (confirm("¿Eliminar zona?")) {
    await axios.delete(`http://localhost:8080/api/v1/areas/${id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    mapRef.value.loadData();
  }
};

const registerEquipment = async () => {
  try {
    await axios.post('http://localhost:8080/api/v1/equipment', 
      { ...newEq, latitude: -17.458993, longitude: -70.785376 },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    mapRef.value.loadData();
    Object.assign(newEq, { name: '', color: '#3388ff', status: 'OPERATIVO', comment: '' });
  } catch (error) {
    message.value = 'Error al registrar equipo';
    isSuccess.value = false;
  }
};

const createUser = async () => {
  try {
    await axios.post('http://localhost:8080/api/v1/auth/register', newUser, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    message.value = `Usuario "${newUser.username}" creado`;
    isSuccess.value = true;
    Object.assign(newUser, { username: '', password: '', role: 'USER' });
  } catch (error) {
    message.value = 'Error al crear usuario';
    isSuccess.value = false;
  }
};
</script>

<style scoped>
.admin-panel { padding: 10px; color: #eee; text-align: left; min-height: 100vh; }
.header { 
  display: flex; 
  flex-wrap: wrap;
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 2px solid #aa3bff; 
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
  .admin-panel { padding: 20px; }
  .main-content { flex-direction: row; align-items: flex-start; }
}

.map-section { 
  flex: 3; 
  width: 100%;
}

.tables-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 20px; 
  margin-top: 20px;
}

@media (min-width: 768px) {
  .tables-grid { grid-template-columns: 1fr 1fr; }
}

.forms-section { 
  flex: 1; 
  width: 100%;
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
}

.card { background: #2f2f2f; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
form { display: flex; flex-direction: column; gap: 10px; }
input, select, textarea { padding: 8px; background: #444; border: 1px solid #666; color: white; border-radius: 4px; font-family: inherit; }
.color-picker { display: flex; align-items: center; gap: 10px; }
.btn { padding: 10px; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-primary { background-color: #aa3bff; }
.btn-success { background-color: #28a745; }
.logout-btn { background-color: #ff4757; padding: 5px 10px; border: none; color: white; cursor: pointer; border-radius: 4px; }
.success { color: #2ed573; margin-top: 10px; font-size: 14px; }
.error { color: #ff4757; margin-top: 10px; font-size: 14px; }
</style>
