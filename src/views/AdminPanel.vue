<template>
  <div class="admin-panel">
    <div class="header">
      <h1>Sistema de Ubicación de Equipos</h1>
      <div class="header-actions">
        <button class="btn-outline" @click="downloadReport">
          <span>📄</span> Exportar PDF
        </button>
        <div class="user-info">
          <span>Hola, {{ authStore.username }}</span>
          <button class="logout-btn" @click="handleLogout">Cerrar Sesión</button>
        </div>
      </div>
    </div>
    
    <div class="main-content">
      <div class="map-section">
        <EquipmentMap 
          ref="mapRef" 
          @update-list="handleListUpdate" 
          @update-areas="handleAreaUpdate" 
        />
        <div class="tables-grid">
          <EquipmentList 
            :equipment="equipmentList" 
            @update-required="mapRef.loadData()" 
          />
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
import { ref, reactive, computed } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import EquipmentMap from '../components/EquipmentMap.vue';
import EquipmentList from '../components/EquipmentList.vue';
import AreaList from '../components/AreaList.vue';
import EquipmentSummary from '../components/EquipmentSummary.vue';
import EquipmentFilter from '../components/EquipmentFilter.vue';
import { generateEquipmentPDF } from '../utils/reportGenerator';

const authStore = useAuthStore();
const router = useRouter();

const mapRef = ref(null);
const equipmentList = ref([]);
const areaList = ref([]);
const selectedCategories = ref([]);

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

const downloadReport = () => {
  generateEquipmentPDF(filteredEquipmentList.value);
};
</script>

<style scoped>
.admin-panel { padding: 1.5rem; color: var(--text-main); text-align: left; min-height: 100vh; background: var(--bg-light); }
.header { 
  display: flex; 
  flex-wrap: wrap;
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid var(--card-border); 
  padding-bottom: 1.5rem; 
  margin-bottom: 2.5rem;
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
  margin-top: 2.5rem;
}

@media (min-width: 1200px) {
  .tables-grid { grid-template-columns: 1.3fr 0.7fr; }
}

.forms-section { 
  flex: 1; 
  width: 100%;
  display: flex; 
  flex-direction: column; 
  gap: 2.5rem; 
}

.card { 
  background: var(--card-light); 
  padding: 1.75rem; 
  border-radius: 20px; 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid var(--card-border);
}

h2 { font-size: 1.25rem; margin-top: 0; margin-bottom: 1.5rem; color: var(--primary); font-weight: 700; }
form { display: flex; flex-direction: column; gap: 1.25rem; }

input, select, textarea { 
  padding: 0.8rem; 
  background: #fff; 
  border: 1px solid #d1d5db; 
  color: var(--text-main); 
  border-radius: 10px; 
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--primary); ring: 2px solid rgba(99, 102, 241, 0.1); }

.color-picker { display: flex; align-items: center; gap: 1.25rem; font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }
.color-picker input { width: 36px; height: 36px; padding: 2px; border: 1px solid #d1d5db; border-radius: 6px; background: none; cursor: pointer; }

.btn { 
  padding: 0.85rem; 
  color: white; 
  border: none; 
  border-radius: 10px; 
  cursor: pointer; 
  font-weight: 700; 
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-primary { background-color: var(--primary); box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2); }
.btn-primary:hover { background-color: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); }

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

.btn-success { background-color: var(--success); }
.btn-success:hover { opacity: 0.9; transform: translateY(-1px); }

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

.success { color: #065f46; margin-top: 1rem; font-size: 0.85rem; font-weight: 600; padding: 0.75rem; background: #ecfdf5; border-radius: 8px; text-align: center; border: 1px solid #a7f3d0; }
.error { color: #991b1b; margin-top: 1rem; font-size: 0.85rem; font-weight: 600; padding: 0.75rem; background: #fef2f2; border-radius: 8px; text-align: center; border: 1px solid #fecaca; }
</style>
