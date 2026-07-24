<template>
  <div class="user-management-view">
    <AppNavbar />

    <div class="view-container">
      <div class="header-section">
        <div class="header-title">
          <span class="icon">👥</span>
          <div>
            <h1>Gestión de Usuarios</h1>
            <p class="subtitle">Creación y configuración de perfiles de acceso</p>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="form-card">
          <div class="card-header">
            <h2>Crear Nuevo Usuario</h2>
            <p>Define las credenciales y el nivel de acceso del nuevo usuario.</p>
          </div>

          <form @submit.prevent="createUser" class="user-form">
            <div class="form-group">
              <label for="username">Nombre de Usuario</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input 
                  type="text" 
                  id="username" 
                  v-model="newUser.username" 
                  placeholder="ej. luis.perez" 
                  required 
                />
              </div>
            </div>

            <div class="form-group">
              <label for="password">Contraseña</label>
              <div class="input-wrapper">
                <span class="input-icon">🔑</span>
                <input 
                  type="password" 
                  id="password" 
                  v-model="newUser.password" 
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>

            <div class="form-group">
              <label for="role">Rol / Nivel de Acceso</label>
              <div class="input-wrapper">
                <span class="input-icon">🛡️</span>
                <select id="role" v-model="newUser.role" required>
                  <option value="USER">Usuario Común</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>

            <button class="btn-submit" type="submit" :disabled="isLoading">
              <span v-if="isLoading" class="spinner"></span>
              <span v-else>Crear Usuario</span>
            </button>
          </form>

          <transition name="fade">
            <div v-if="message" :class="['alert-message', isSuccess ? 'alert-success' : 'alert-error']">
              <span class="alert-icon">{{ isSuccess ? '✅' : '❌' }}</span>
              <span class="alert-text">{{ message }}</span>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import api from '../api';
import AppNavbar from '../components/AppNavbar.vue';

const newUser = reactive({
  username: '',
  password: '',
  role: 'USER'
});

const isLoading = ref(false);
const message = ref('');
const isSuccess = ref(false);

const createUser = async () => {
  isLoading.value = true;
  message.value = '';
  try {
    await api.post('/api/v1/auth/register', newUser);
    message.value = `El usuario "${newUser.username}" ha sido creado exitosamente.`;
    isSuccess.value = true;
    
    // Reiniciar formulario
    Object.assign(newUser, {
      username: '',
      password: '',
      role: 'USER'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    message.value = error.response?.data?.message || 'Error al intentar registrar al usuario. Inténtalo de nuevo.';
    isSuccess.value = false;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.user-management-view {
  min-height: 100vh;
  background: var(--bg-light);
  padding-bottom: 3rem;
}

.view-container {
  padding: 0 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.header-section {
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 1rem;
  margin-bottom: 2.5rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-title .icon {
  font-size: 2.25rem;
  background: #fff;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--card-border);
}

.header-title h1 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-main);
  letter-spacing: -0.025em;
}

.subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0.25rem 0 0 0;
  font-weight: 500;
}

.content-grid {
  display: flex;
  justify-content: center;
}

.form-card {
  background: var(--card-light);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  border: 1px solid var(--card-border);
  width: 100%;
}

.card-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1.25rem;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 0.5rem 0;
}

.card-header p {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  font-size: 1.1rem;
  pointer-events: none;
  color: var(--text-muted);
}

input, select {
  width: 100%;
  padding: 0.85rem 0.85rem 0.85rem 2.5rem;
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: var(--text-main);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

input:focus, select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.btn-submit {
  padding: 1rem;
  color: white;
  background-color: var(--primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
  margin-top: 1rem;
}

.btn-submit:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner animado */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Alertas */
.alert-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid transparent;
}

.alert-success {
  background-color: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.alert-error {
  background-color: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.alert-icon {
  font-size: 1.2rem;
}

.alert-text {
  line-height: 1.35;
}

/* Transición fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
