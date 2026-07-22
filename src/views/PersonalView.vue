<template>
  <div class="personal-page">
    <AppNavbar />

    <div class="personal-container">
      <div class="header-section">
        <div class="title-group">
          <h1>👥 Módulo de Personal</h1>
          <p class="subtitle">Directorio de operadores, choferes y personal de guardia en QH Relavera.</p>
        </div>
        <button class="btn-action-primary" @click="showInfoModal = true">
          <span>➕</span> Registrar Personal
        </button>
      </div>

      <!-- Tarjetas de Resumen Dinámicas -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon blue">👷</div>
          <div class="metric-info">
            <span class="metric-label">Operadores Registrados</span>
            <span class="metric-value">{{ operators.length }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon green">🔢</div>
          <div class="metric-info">
            <span class="metric-label">Con Código Asignado</span>
            <span class="metric-value">{{ countWithCode }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon amber">🔍</div>
          <div class="metric-info">
            <span class="metric-label">Filtro de Búsqueda</span>
            <span class="metric-value">{{ filteredOperators.length }}</span>
          </div>
        </div>
      </div>

      <!-- Área Principal de Contenido / Tabla de Personal -->
      <div class="content-card">
        <div class="card-header">
          <div class="header-left">
            <h3>Lista de Personal y Operadores</h3>
            <span class="badge-count">{{ filteredOperators.length }} registros</span>
          </div>
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar por código o nombre..." 
              class="search-input"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">✕</button>
          </div>
        </div>

        <!-- Indicador de carga -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando lista de personal...</p>
        </div>

        <!-- Tabla de datos -->
        <div v-else-if="filteredOperators.length > 0" class="table-responsive">
          <table class="personal-table">
            <thead>
              <tr>
                <th style="width: 70px;">#</th>
                <th style="width: 140px;">CÓDIGO</th>
                <th>NOMBRE COMPLETO</th>
                <th style="width: 120px; text-align: center;">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(op, idx) in filteredOperators" :key="op.id || idx">
                <td class="col-idx">{{ idx + 1 }}</td>
                <td class="col-code">
                  <span v-if="op.code" class="code-badge">{{ op.code }}</span>
                  <span v-else class="no-code">Sin código</span>
                </td>
                <td class="col-name">{{ op.name }}</td>
                <td class="col-status">
                  <span class="status-pill active">Activo</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Estado vacío cuando no hay resultados de búsqueda -->
        <div v-else class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No se encontraron operadores</h3>
          <p>No hay personal que coincida con el término "<b>{{ searchQuery }}</b>".</p>
        </div>
      </div>
    </div>

    <!-- Modal Informativo -->
    <div v-if="showInfoModal" class="modal-backdrop" @click.self="showInfoModal = false">
      <div class="modal-card">
        <h3>Registrar Personal</h3>
        <p>El formulario de alta manual de personal se habilitará en el siguiente módulo de administración.</p>
        <button class="btn-modal-close" @click="showInfoModal = false">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AppNavbar from '../components/AppNavbar.vue';
import api from '../api';

const showInfoModal = ref(false);
const operators = ref([]);
const loading = ref(true);
const searchQuery = ref('');

const fetchOperators = async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/v1/operators');
    operators.value = res.data;
  } catch (err) {
    console.error("Error al cargar personal:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOperators);

const countWithCode = computed(() => {
  return operators.value.filter(op => op.code && op.code.trim() !== '').length;
});

const filteredOperators = computed(() => {
  if (!searchQuery.value.trim()) return operators.value;
  const q = searchQuery.value.toLowerCase().trim();
  return operators.value.filter(op => {
    const nameMatch = op.name && op.name.toLowerCase().includes(q);
    const codeMatch = op.code && op.code.toLowerCase().includes(q);
    return nameMatch || codeMatch;
  });
});
</script>

<style scoped>
.personal-page {
  min-height: 100vh;
  background: #f8fafc;
}

.personal-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 2rem 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-group h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #64748b;
  font-size: 0.92rem;
  margin: 0;
}

.btn-action-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  transition: all 0.2s ease;
}

.btn-action-primary:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.metric-card {
  background: white;
  border-radius: 14px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.metric-icon.blue { background: #e0e7ff; }
.metric-icon.green { background: #dcfce7; }
.metric-icon.amber { background: #fef3c7; }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.content-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.badge-count {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 0.9rem;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.55rem 2.2rem 0.55rem 2.2rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.88rem;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.clear-btn {
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.9rem;
}

.table-responsive {
  overflow-x: auto;
}

.personal-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.personal-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
}

.personal-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  color: #334155;
  vertical-align: middle;
}

.personal-table tr:hover td {
  background: #f8fafc;
}

.col-idx {
  color: #94a3b8;
  font-weight: 600;
}

.code-badge {
  background: #3b82f6;
  color: white;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.03em;
  font-family: monospace;
}

.no-code {
  color: #94a3b8;
  font-size: 0.8rem;
  font-style: italic;
}

.col-name {
  font-weight: 600;
  color: #0f172a;
}

.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.active {
  background: #dcfce7;
  color: #166534;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-state h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.empty-state p {
  color: #64748b;
  font-size: 0.88rem;
}

/* Modal Styling */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: white;
  border-radius: 16px;
  padding: 1.75rem;
  width: 90%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-card h3 {
  margin-top: 0;
  color: #0f172a;
}

.modal-card p {
  color: #64748b;
  font-size: 0.92rem;
  margin-bottom: 1.5rem;
}

.btn-modal-close {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    max-width: 100%;
  }
}
</style>
