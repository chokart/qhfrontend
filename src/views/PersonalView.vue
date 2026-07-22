<template>
  <div class="personal-page">
    <AppNavbar />

    <div class="personal-container">
      <div class="header-section">
        <div class="title-group">
          <h1>👥 Módulo de Personal</h1>
          <p class="subtitle">Gestión y asignación de operadores, choferes y personal de guardia en QH Relavera.</p>
        </div>
        <button class="btn-action-primary" @click="showInfoModal = true">
          <span>➕</span> Registrar Personal
        </button>
      </div>

      <!-- Tarjetas de Resumen (Placeholder) -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon blue">👷</div>
          <div class="metric-info">
            <span class="metric-label">Operadores Registrados</span>
            <span class="metric-value">121</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon green">✅</div>
          <div class="metric-info">
            <span class="metric-label">En Guardia Activa</span>
            <span class="metric-value">45</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon amber">⏳</div>
          <div class="metric-info">
            <span class="metric-label">Turnos Próximos</span>
            <span class="metric-value">12</span>
          </div>
        </div>
      </div>

      <!-- Área Principal de Contenido / Tabla en Blanco -->
      <div class="content-card">
        <div class="card-header">
          <h3>Lista de Personal y Operadores</h3>
          <span class="badge-status">En desarrollo</span>
        </div>

        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Módulo listo para expansión</h3>
          <p>
            Este espacio contendrá el registro completo de fotochecks, asignación de turnos, capacitaciones y estados de los operadores de equipos pesados.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal Informativo -->
    <div v-if="showInfoModal" class="modal-backdrop" @click.self="showInfoModal = false">
      <div class="modal-card">
        <h3>Registrar Personal</h3>
        <p>El formulario de alta de personal se habilitará en la siguiente fase de desarrollo.</p>
        <button class="btn-modal-close" @click="showInfoModal = false">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppNavbar from '../components/AppNavbar.vue';

const showInfoModal = ref(false);
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1rem));
  grid-auto-columns: 1fr;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
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
  margin-bottom: 1.5rem;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.badge-status {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
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
}
</style>
