<template>
  <div class="filter-container">
    <div class="filter-header">
      <span class="filter-icon">🔍</span>
      <h3>Filtrar por Categoría</h3>
    </div>
    <div class="filter-options">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        :class="['filter-btn', { active: selectedCategories.includes(cat.id) }]"
        @click="toggleCategory(cat.id)"
      >
        <span class="cat-dot" :style="{ backgroundColor: cat.color }"></span>
        {{ cat.label }}
      </button>
      <button class="btn-clear" @click="clearFilters">Mostrar Todos</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue']);

const categories = [
  { id: 'TRACTOR', label: 'Tractores', color: '#ff4757' },
  { id: 'EXCAVADORA', label: 'Excavadoras', color: '#ffa502' },
  { id: 'CARGADOR', label: 'Cargadores', color: '#aa3bff' },
  { id: 'VOLQUETE', label: 'Volquetes', color: '#1e272e' },
  { id: 'RODILLO', label: 'Rodillos', color: '#747d8c' },
  { id: 'HIDROCICLON', label: 'Hidrociclones', color: '#00cec9' },
  { id: 'OTROS', label: 'Otros', color: '#3388ff' }
];

const selectedCategories = ref([...props.modelValue]);

const toggleCategory = (id) => {
  const index = selectedCategories.value.indexOf(id);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(id);
  }
  emit('update:modelValue', selectedCategories.value);
};

const clearFilters = () => {
  selectedCategories.value = [];
  emit('update:modelValue', []);
};

watch(() => props.modelValue, (newVal) => {
  selectedCategories.value = [...newVal];
});
</script>

<style scoped>
.filter-container {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 1.5rem;
  border: 1px solid var(--card-border);
}
.filter-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.filter-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}
.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.filter-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.btn-clear {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: auto;
  padding: 0.5rem;
}
.btn-clear:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .filter-options {
    gap: 0.5rem;
  }
  .filter-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>
