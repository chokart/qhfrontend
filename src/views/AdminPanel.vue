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
import api from '../api';
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
    await api.delete(`/api/v1/areas/${id}`);
    mapRef.value.loadData();
  }
};

const registerEquipment = async () => {
  try {
    await api.post('/api/v1/equipment', 
      { ...newEq, latitude: -17.458993, longitude: -70.785376 }
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
    await api.post('/api/v1/auth/register', newUser);
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
.admin-panel { padding: 1.5rem; color: var(--text-main); text-align: left; min-height: 100vh; background: var(--bg-dark); }
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
  background: linear-gradient(to right, var(--primary), #a78bfa);
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
  .main-content { flex-direction: row; align-items: flex-start; }
}

.map-section { 
  flex: 3; 
  width: 100%;
}

.tables-grid { 
  display: grid; 
  grid-template-columns: 1fr; 
  gap: 2rem; 
  margin-top: 2rem;
}

@media (min-width: 1200px) {
  .tables-grid { grid-template-columns: 1.2fr 0.8fr; }
}

.forms-section { 
  flex: 1; 
  width: 100%;
  display: flex; 
  flex-direction: column; 
  gap: 2rem; 
}

.card { 
  background: var(--card-dark); 
  padding: 1.5rem; 
  border-radius: 16px; 
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--card-border);
  transition: transform 0.2s;
}

h2 { font-size: 1.25rem; margin-top: 0; margin-bottom: 1.25rem; color: var(--primary); font-weight: 600; }
form { display: flex; flex-direction: column; gap: 1rem; }

input, select, textarea { 
  padding: 0.75rem; 
  background: #0f172a; 
  border: 1px solid var(--card-border); 
  color: var(--text-main); 
  border-radius: 8px; 
  font-family: inherit;
  transition: border-color 0.2s;
}
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--primary); }

.color-picker { display: flex; align-items: center; gap: 1rem; font-size: 0.9rem; color: var(--text-muted); }
.color-picker input { width: 40px; height: 40px; padding: 2px; border: none; background: none; cursor: pointer; }

.btn { 
  padding: 0.75rem; 
  color: white; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 600; 
  font-size: 0.95rem;
  transition: all 0.2s;
}
.btn-primary { background-color: var(--primary); }
.btn-primary:hover { background-color: var(--primary-hover); transform: translateY(-1px); }
.btn-success { background-color: var(--success); }
.btn-success:hover { opacity: 0.9; transform: translateY(-1px); }

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

.success { color: var(--success); margin-top: 1rem; font-size: 0.85rem; padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 4px; text-align: center; }
.error { color: var(--danger); margin-top: 1rem; font-size: 0.85rem; padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 4px; text-align: center; }
</style>
