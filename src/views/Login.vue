<template>
  <div class="auth-container">
    <h2>Iniciar Sesión</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Usuario:</label>
        <input type="text" v-model="username" required />
      </div>
      <div class="form-group">
        <label>Contraseña:</label>
        <input type="password" v-model="password" required />
      </div>
      <button type="submit">Entrar</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  const success = await authStore.login(username.value, password.value);
  if (success) {
    if (authStore.isAdmin) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } else {
    error.value = 'Usuario o contraseña incorrectos';
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 420px;
  margin: 12vh auto;
  padding: 3rem;
  border-radius: 24px;
  background-color: var(--card-light);
  border: 1px solid var(--card-border);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  color: var(--text-main);
}

h2 {
  margin-bottom: 2.5rem;
  font-size: 1.85rem;
  font-weight: 800;
  text-align: center;
  color: var(--text-main);
  letter-spacing: -0.025em;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

input {
  width: 100%;
  padding: 0.9rem;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  color: var(--text-main);
  font-size: 1rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

button {
  width: 100%;
  padding: 1rem;
  margin-top: 1.5rem;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

button:active {
  transform: translateY(0);
}

.error {
  background: #fff1f2;
  color: #991b1b;
  padding: 0.85rem;
  border-radius: 10px;
  margin-top: 2rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  border: 1px solid #fecaca;
}
</style>
