<template>
  <div class="area-list-card">
    <h2>Zonas de Trabajo Registradas</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nombre de la Zona</th>
            <th>Tipo</th>
            <th>Puntos de Control</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="area in areas" :key="area.id">
            <td>
              <span class="area-icon">⬚</span>
              <b>{{ area.name }}</b>
            </td>
            <td><span class="badge">Rectángulo</span></td>
            <td class="coords-count">{{ getCoordCount(area.coordinatesJson) }} puntos</td>
            <td>
              <button @click="$emit('delete', area.id)" class="btn-delete-small">Eliminar</button>
            </td>
          </tr>
          <tr v-if="areas.length === 0">
            <td colspan="4" class="empty">No hay zonas dibujadas aún</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  areas: { type: Array, required: true }
});

const getCoordCount = (json) => {
  try {
    return JSON.parse(json).length;
  } catch (e) { return 0; }
};
</script>

<style scoped>
.area-list-card { 
  background: var(--card-dark); 
  padding: 1.5rem; 
  border-radius: 16px; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.2); 
  color: var(--text-main); 
  border: 1px solid var(--card-border);
}
h2 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 600; color: var(--primary); }
.table-container { overflow-x: auto; max-height: 450px; border-radius: 8px; }
table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
th { 
  padding: 1rem; 
  background: rgba(15, 23, 42, 0.5);
  border-bottom: 1px solid var(--card-border); 
  color: var(--text-muted); 
  text-transform: uppercase; 
  font-size: 0.75rem; 
  letter-spacing: 0.05em;
  font-weight: 600;
}
td { padding: 1rem; border-bottom: 1px solid var(--card-border); font-size: 0.9rem; }
tr:hover td { background: rgba(255, 255, 255, 0.02); }

.area-icon { margin-right: 12px; color: var(--primary); font-size: 1.1rem; opacity: 0.8; }
.badge { background: rgba(255,255,255,0.05); color: var(--text-muted); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; border: 1px solid var(--card-border); }
.coords-count { color: var(--text-muted); font-size: 0.8rem; font-style: italic; }

.btn-delete-small { 
  background: transparent; 
  color: var(--danger); 
  border: 1px solid rgba(239, 68, 68, 0.3); 
  padding: 0.4rem 0.8rem; 
  border-radius: 6px; 
  cursor: pointer; 
  font-size: 0.75rem; 
  font-weight: 600;
  transition: all 0.2s;
}
.btn-delete-small:hover { background: var(--danger); color: white; border-color: var(--danger); }
.empty { text-align: center; padding: 3rem; color: var(--text-muted); font-style: italic; }
</style>
