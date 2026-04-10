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
  margin: 10vh auto;
  padding: 2.5rem;
  border-radius: 20px;
  background-color: var(--card-dark);
  border: 1px solid var(--card-border);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: var(--text-main);
}

h2 {
  margin-bottom: 2rem;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: var(--primary);
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

input {
  width: 100%;
  padding: 0.85rem;
  box-sizing: border-box;
  background: var(--bg-dark);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  color: var(--text-main);
  font-size: 1rem;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

button {
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.2s;
}

button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

button:active {
  transform: translateY(0);
}

.error {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1.5rem;
  font-size: 0.85rem;
  text-align: center;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
</style>
