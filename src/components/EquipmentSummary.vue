<template>
  <div class="summary-dashboard">
    <div class="stats-grid">
      <div class="stat-card total">
        <span class="stat-icon">🚜</span>
        <div class="stat-info">
          <span class="stat-label">Total Equipos</span>
          <span class="stat-value">{{ totals.total }}</span>
        </div>
      </div>
      <div class="stat-card op">
        <span class="stat-icon">✅</span>
        <div class="stat-info">
          <span class="stat-label">Operativos</span>
          <span class="stat-value">{{ totals.operativo }}</span>
        </div>
      </div>
      <div class="stat-card sb">
        <span class="stat-icon">🛑</span>
        <div class="stat-info">
          <span class="stat-label">Stand By</span>
          <span class="stat-value">{{ totals.standby }}</span>
        </div>
      </div>
      <div class="stat-card in">
        <span class="stat-icon">⚠️</span>
        <div class="stat-info">
          <span class="stat-label">Inoperativos</span>
          <span class="stat-value">{{ totals.inoperativo }}</span>
        </div>
      </div>
    </div>

    <div class="category-summary-card">
      <h3>Resumen por Flota</h3>
      <div class="mini-table">
        <div v-for="cat in categorySummary" :key="cat.name" class="cat-row">
          <span class="cat-name">{{ cat.name }}</span>
          <div class="cat-bar-container">
            <div class="cat-bar op" :style="{ width: (cat.operativo / cat.total * 100) + '%' }"></div>
            <div class="cat-bar sb" :style="{ width: (cat.standby / cat.total * 100) + '%' }"></div>
            <div class="cat-bar in" :style="{ width: (cat.inoperativo / cat.total * 100) + '%' }"></div>
          </div>
          <span class="cat-total">{{ cat.total }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  equipment: { type: Array, required: true }
});

const categorySummary = computed(() => {
  const categories = [
    { name: 'Hidrociclones', check: (n) => n.startsWith('BATERIA') || n.startsWith('NIDO') },
    { name: 'Tractores D8', check: (n) => n.startsWith('D8') },
    { name: 'Tractores D9', check: (n) => n.startsWith('D9') },
    { name: 'Tractores D10', check: (n) => n.startsWith('D10') },
    { name: 'Excavadoras', check: (n) => n.includes('Exc.') },
    { name: 'Cargadores', check: (n) => n.includes('Cargador') },
    { name: 'Rodillos', check: (n) => n.includes('Rodillo') },
    { name: 'Volquetes', check: (n) => n.includes('Volquete') }
  ];

  return categories.map(cat => {
    const matched = props.equipment.filter(eq => cat.check(eq.name));
    return {
      name: cat.name,
      total: matched.length,
      operativo: matched.filter(e => e.status === 'OPERATIVO').length,
      standby: matched.filter(e => e.status === 'STAND_BY').length,
      inoperativo: matched.filter(e => e.status === 'INOPERATIVO').length
    };
  }).filter(c => c.total > 0);
});

const totals = computed(() => {
  return props.equipment.reduce((acc, eq) => {
    acc.total++;
    if (eq.status === 'OPERATIVO') acc.operativo++;
    else if (eq.status === 'STAND_BY') acc.standby++;
    else if (eq.status === 'INOPERATIVO') acc.inoperativo++;
    return acc;
  }, { operativo: 0, standby: 0, inoperativo: 0, total: 0 });
});
</script>

<style scoped>
.summary-dashboard { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
.stat-card { background: white; padding: 1.25rem; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem; }
.stat-icon { font-size: 1.5rem; background: #f8fafc; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
.stat-info { display: flex; flex-direction: column; }
.stat-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.stat-value { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
.op .stat-icon { background: #ecfdf5; }
.sb .stat-icon { background: #fffbeb; }
.in .stat-icon { background: #fef2f2; }
.category-summary-card { background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; }
.category-summary-card h3 { margin: 0 0 1.25rem 0; font-size: 0.9rem; font-weight: 800; color: #475569; text-transform: uppercase; }
.mini-table { display: flex; flex-direction: column; gap: 1rem; }
.cat-row { display: flex; align-items: center; gap: 1rem; }
.cat-name { width: 120px; font-size: 0.85rem; font-weight: 600; color: #334155; }
.cat-bar-container { flex: 1; height: 8px; background: #f1f5f9; border-radius: 10px; display: flex; overflow: hidden; }
.cat-bar { height: 100%; }
.cat-bar.op { background: #10b981; }
.cat-bar.sb { background: #f59e0b; }
.cat-bar.in { background: #ef4444; }
.cat-total { width: 30px; text-align: right; font-size: 0.85rem; font-weight: 800; color: #1e293b; }
</style>
