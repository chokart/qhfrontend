<template>
  <div class="dique-pipes-container">
    <!-- Encabezado y Control de Lienzo a Escala -->
    <div class="canvas-header">
      <div class="header-info">
        <div class="title-badge">📐 Escala 8:1 (4.0 km × 0.5 km)</div>
        <div>
          <h3 class="canvas-title">{{ title }}</h3>
          <p class="canvas-subtitle">Dimensiones Reales: <b>4,000 m de largo × 500 m de alto</b> | Trazo mediante puntos de inflexión y curvas suaves</p>
        </div>
      </div>

      <div class="toolbar-actions">
        <!-- Selector de Herramienta -->
        <div class="tool-btn-group">
          <button 
            :class="['btn-tool', { active: currentTool === 'select' }]" 
            @click="setTool('select')"
            title="Seleccionar o editar nodos de tuberías"
          >
            👆 Seleccionar
          </button>
          <button 
            :class="['btn-tool btn-draw', { active: currentTool === 'draw' }]" 
            @click="setTool('draw')"
            title="Trazar tubería con curvas (Haz clic para agregar puntos)"
          >
            ✏️ Trazar Tubería Curva
          </button>
        </div>

        <button 
          v-if="isDrawing" 
          @click="finishCurrentDrawing" 
          class="btn-finish-draw"
          title="Finalizar el trazo de la tubería actual"
        >
          ✓ Finalizar Trazo ({{ activeDrawingPoints.length }} pts)
        </button>

        <button 
          v-if="selectedPipe" 
          @click="showPipePropsModal = true" 
          class="btn-props-pipe"
          title="Ver o editar propiedades de la tubería seleccionada en ventana emergente"
        >
          ⚙️ Propiedades ({{ selectedPipe.name }})
        </button>

        <div class="v-divider"></div>

        <!-- Filtro por Estado -->
        <select v-model="filterStatus" class="select-pipe-filter">
          <option value="ALL">📋 Todas las Tuberías ({{ pipes.length }})</option>
          <option value="ACTIVA">🟢 Activas</option>
          <option value="MANTENIMIENTO">🟡 En Mantenimiento</option>
          <option value="INACTIVA">🔴 Inactivas</option>
          <option value="PROYECTADA">🔵 Proyectadas</option>
        </select>

        <button @click="showHelpModal = true" class="btn-help-pipes">
          ❓ Ayuda Trazo
        </button>

        <button @click="resetPipes" class="btn-clear-pipes">
          🔄 Reiniciar
        </button>
      </div>
    </div>

    <!-- RECTÁNGULO PRINCIPAL A ESCALA (ALINEADO EN ANCHO CON LAS CANCHAS DE ABAJO) -->
    <div class="scaled-viewport-wrapper">
      <!-- Regla Superior X (0 a 4000 metros / 4 km) -->
      <div class="ruler-x">
        <div v-for="mark in xRulerMarks" :key="'rx_'+mark.m" class="ruler-x-mark" :style="{ left: mark.pct + '%' }">
          <div class="mark-line-x"></div>
          <span class="mark-text-x">{{ mark.label }}</span>
        </div>
      </div>

      <div class="viewport-main-row">
        <!-- Regla Izquierda Y (0 a 500 metros / 0.5 km) -->
        <div class="ruler-y">
          <div v-for="mark in yRulerMarks" :key="'ry_'+mark.m" class="ruler-y-mark" :style="{ top: mark.pct + '%' }">
            <span class="mark-text-y">{{ mark.label }}</span>
            <div class="mark-line-y"></div>
          </div>
        </div>

        <!-- Lienzo SVG Interactivo sin canchas internas -->
        <div 
          ref="svgContainerRef" 
          class="svg-canvas-container"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
          @click="handleCanvasClick"
          @dblclick="handleCanvasDblClick"
        >
          <svg 
            class="pipes-svg"
            viewBox="0 0 4000 500" 
            preserveAspectRatio="none"
          >
            <!-- Fondo Grilla a Escala (bloques de 500m x 100m) -->
            <defs>
              <pattern id="gridPatternCurved" width="500" height="100" patternUnits="userSpaceOnUse">
                <path d="M 500 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4,4"/>
              </pattern>
              <!-- Flecha indicadora de sentido -->
              <marker id="arrowHeadCurved" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
              </marker>
            </defs>

            <rect width="4000" height="500" fill="#f8fafc" />
            <rect width="4000" height="500" fill="url(#gridPatternCurved)" />

            <!-- Renderizado de Tuberías Dibujadas con Curvas Suaves -->
            <g class="pipes-layer">
              <g 
                v-for="pipe in visiblePipes" 
                :key="pipe.id"
                :class="['pipe-group', { selected: selectedPipeId === pipe.id }]"
                @click.stop="selectPipe(pipe)"
              >
                <!-- Trazo Sombra Resaltado de Selección -->
                <path 
                  :d="getSmoothPathD(pipe.points)" 
                  fill="none"
                  stroke="rgba(2, 132, 199, 0.25)" 
                  :stroke-width="getPipeStrokeWidth(pipe.diameter) + 14" 
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  v-if="selectedPipeId === pipe.id"
                />

                <!-- Trazo de la Tubería Curva -->
                <path 
                  :d="getSmoothPathD(pipe.points)" 
                  fill="none"
                  :stroke="getPipeColor(pipe.status)" 
                  :stroke-width="getPipeStrokeWidth(pipe.diameter)" 
                  :stroke-dasharray="pipe.status === 'MANTENIMIENTO' ? '14,8' : (pipe.status === 'PROYECTADA' ? '8,8' : 'none')"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  marker-end="url(#arrowHeadCurved)"
                />

                <!-- Nodos / Puntos Control de la Curva (si está seleccionada) -->
                <g v-if="selectedPipeId === pipe.id" class="control-nodes">
                  <circle 
                    v-for="(pt, pIdx) in pipe.points" 
                    :key="'pt_'+pIdx"
                    :cx="pt.x" :cy="pt.y" r="12" 
                    fill="#ffffff" 
                    :stroke="getPipeColor(pipe.status)" 
                    stroke-width="4"
                    class="node-handle"
                    @mousedown.stop="startDragNode(pipe, pIdx, $event)"
                  />
                </g>

                <!-- Etiqueta con Nombre y Longitud Curva a Escala -->
                <g v-if="pipe.points && pipe.points.length >= 2" :transform="getPipeLabelTransform(pipe.points)">
                  <rect 
                    x="-70" y="-18" width="140" height="28" 
                    fill="#ffffff" 
                    stroke="#cbd5e1" 
                    rx="6" 
                  />
                  <text 
                    x="0" y="1" 
                    text-anchor="middle" 
                    fill="#0f172a" 
                    font-size="14" 
                    font-weight="bold"
                  >
                    {{ pipe.name || 'Tubería' }} ({{ formatDistanceKm(calculatePathDistance(pipe.points)) }})
                  </text>
                </g>
              </g>
            </g>

            <!-- Previsualización del Trazo de la Tubería Curva en Construcción -->
            <g v-if="isDrawing && activeDrawingPoints.length > 0" class="drawing-preview-group">
              <!-- Camino Curvo de los puntos ya colocados + el cursor -->
              <path 
                :d="getSmoothPathD([...activeDrawingPoints, mouseRealCoords])" 
                fill="none"
                stroke="#0284c7" 
                stroke-width="7" 
                stroke-dasharray="8,6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Puntos de inflexión colocados -->
              <circle 
                v-for="(pt, idx) in activeDrawingPoints" 
                :key="'active_pt_'+idx"
                :cx="pt.x" :cy="pt.y" r="10" 
                fill="#0284c7" stroke="#ffffff" stroke-width="3"
              />

              <!-- Punto Flotante del Cursor -->
              <circle :cx="mouseRealCoords.x" :cy="mouseRealCoords.y" r="10" fill="#38bdf8" stroke="#ffffff" stroke-width="3" />

              <!-- Tooltip Flotante de Longitud Total de la Curva -->
              <g :transform="`translate(${mouseRealCoords.x}, ${mouseRealCoords.y - 25})`">
                <rect x="-90" y="-20" width="180" height="30" fill="#0f172a" rx="8" opacity="0.9" />
                <text x="0" y="0" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="bold">
                  Largo Curvo: {{ formatDistanceKm(calculatePathDistance([...activeDrawingPoints, mouseRealCoords])) }}
                </text>
              </g>
            </g>
          </svg>

          <!-- Tooltip de Coordenadas del Cursor a Escala -->
          <div v-if="mouseHovering" class="cursor-tooltip" :style="{ left: mouseClientPos.x + 15 + 'px', top: mouseClientPos.y - 35 + 'px' }">
            <span class="tooltip-coord">📍 <b>X:</b> {{ (mouseRealCoords.x / 1000).toFixed(2) }} km ({{ Math.round(mouseRealCoords.x) }}m) | <b>Y:</b> {{ (mouseRealCoords.y / 1000).toFixed(2) }} km ({{ Math.round(mouseRealCoords.y) }}m)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL POPUP DE PROPIEDADES DE TUBERÍA -->
    <div v-if="showPipePropsModal && selectedPipe" class="modal-backdrop" @click.self="showPipePropsModal = false">
      <div class="modal-card modal-pipe-props">
        <div class="modal-header">
          <div class="header-title-wrap">
            <span class="header-icon">⚙️</span>
            <div>
              <h3>Propiedades de Tubería: {{ selectedPipe.name }}</h3>
              <span class="header-sub">Longitud Curva: <b>{{ formatDistanceKm(calculatePathDistance(selectedPipe.points)) }}</b> ({{ Math.round(calculatePathDistance(selectedPipe.points)) }} m)</span>
            </div>
          </div>
          <button class="btn-close-modal" @click="showPipePropsModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="pipe-form-grid">
            <div class="form-group">
              <label class="form-label">Nombre / Código:</label>
              <input type="text" v-model="selectedPipe.name" class="form-input" placeholder="Ej. Línea Curva Principal Arenas" />
            </div>

            <div class="form-group">
              <label class="form-label">Material / Especificación:</label>
              <select v-model="selectedPipe.material" class="form-select">
                <option value="HDPE PE100">HDPE PE100 High Density</option>
                <option value="Acero Carbono">Acero al Carbono</option>
                <option value="PVC Schedule 80">PVC Schedule 80</option>
                <option value="FIBRA DE VIDRIO">Fibra de Vidrio (GRP)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Diámetro:</label>
              <select v-model="selectedPipe.diameter" class="form-select">
                <option value="8">8 Pulgadas (200 mm)</option>
                <option value="12">12 Pulgadas (300 mm)</option>
                <option value="16">16 Pulgadas (400 mm)</option>
                <option value="20">20 Pulgadas (500 mm)</option>
                <option value="24">24 Pulgadas (600 mm)</option>
                <option value="30">30 Pulgadas (750 mm)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Estado Operativo:</label>
              <select v-model="selectedPipe.status" class="form-select">
                <option value="ACTIVA">🟢 Activa (Operativa)</option>
                <option value="MANTENIMIENTO">🟡 En Mantenimiento</option>
                <option value="INACTIVA">🔴 Inactiva / Fuera de servicio</option>
                <option value="PROYECTADA">🔵 Proyectada / En construcción</option>
              </select>
            </div>
          </div>

          <div class="pipe-info-summary">
            <div class="info-item">
              <span class="info-lbl">Puntos de inflexión:</span>
              <span class="info-val">{{ selectedPipe.points ? selectedPipe.points.length : 0 }} nodos</span>
            </div>
            <div class="info-item">
              <span class="info-lbl">Distancia Total Curva:</span>
              <span class="info-val highlight">{{ formatDistanceKm(calculatePathDistance(selectedPipe.points)) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer modal-footer-actions">
          <button class="btn-delete-pipe" @click="deleteSelectedPipeFromModal">🗑️ Eliminar Tubería</button>
          <div class="footer-right-actions">
            <button class="btn-add-node" @click="addNodeToSelectedPipe" title="Agregar un nuevo punto de curva">➕ Añadir Punto</button>
            <button class="btn-save-edit" @click="showPipePropsModal = false">✓ Guardar y Cerrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE AYUDA Y ESCALA -->
    <div v-if="showHelpModal" class="modal-backdrop" @click.self="showHelpModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>📐 Trazo de Tuberías con Curvas (4.0 km × 0.5 km)</h3>
          <button class="btn-close-modal" @click="showHelpModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Instrucciones para trazar tuberías con curvas a escala:</p>
          <ul class="help-list">
            <li><b>Trazo de Curvas:</b> Haz clic en <b>"✏️ Trazar Tubería Curva"</b>. Haz un primer clic en el punto de origen y continúa haciendo clics en los puntos de curva deseados.</li>
            <li><b>Finalizar Trazo:</b> Presiona el botón verde <b>"✓ Finalizar Trazo"</b> o haz doble clic en el lienzo.</li>
            <li><b>Alineación:</b> El ancho del lienzo coincide horizontalmente con el contenedor de canchas de abajo.</li>
            <li><b>Edición de Curva:</b> Selecciona una tubería existente y arrastra cualquiera de sus nodos (puntos blancos) para modificar la forma de la curva en tiempo real.</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn-save-edit" @click="showHelpModal = false">Entendido</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Lienzo de Tuberías con Curvas - Dique Principal'
  },
  storageKey: {
    type: String,
    default: 'dique_principal_pipes_curved_v2'
  },
  canchasNiveles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['selectCancha']);

const currentTool = ref('select'); // 'select' | 'draw'
const filterStatus = ref('ALL');
const selectedPipeId = ref(null);
const showHelpModal = ref(false);
const showPipePropsModal = ref(false);

const svgContainerRef = ref(null);
const mouseHovering = ref(false);
const mouseClientPos = reactive({ x: 0, y: 0 });
const mouseRealCoords = reactive({ x: 0, y: 0 });

// Puntos del trazo actual en modo dibujo
const isDrawing = ref(false);
const activeDrawingPoints = ref([]);

// Arrastre de nodos de curva
const draggingNodeInfo = ref(null);

// Reglas graduadas
const xRulerMarks = [
  { m: 0, label: '0.0 km (0m)', pct: 0 },
  { m: 500, label: '0.5 km', pct: 12.5 },
  { m: 1000, label: '1.0 km (1000m)', pct: 25 },
  { m: 1500, label: '1.5 km', pct: 37.5 },
  { m: 2000, label: '2.0 km (2000m)', pct: 50 },
  { m: 2500, label: '2.5 km', pct: 62.5 },
  { m: 3000, label: '3.0 km (3000m)', pct: 75 },
  { m: 3500, label: '3.5 km', pct: 87.5 },
  { m: 4000, label: '4.0 km (4000m)', pct: 100 }
];

const yRulerMarks = [
  { m: 0, label: '0 m', pct: 0 },
  { m: 100, label: '100 m', pct: 20 },
  { m: 250, label: '250 m (0.25 km)', pct: 50 },
  { m: 400, label: '400 m', pct: 80 },
  { m: 500, label: '500 m (0.5 km)', pct: 100 }
];

// Tuberías de ejemplo con curvas
const pipes = ref([
  {
    id: 1,
    name: 'Línea de Arenas Principal Curva',
    material: 'HDPE PE100',
    diameter: '16',
    status: 'ACTIVA',
    points: [
      { x: 100, y: 80 },
      { x: 800, y: 220 },
      { x: 1800, y: 120 },
      { x: 2900, y: 340 },
      { x: 3900, y: 260 }
    ]
  },
  {
    id: 2,
    name: 'Alimentación Curva Secundaria',
    material: 'HDPE PE100',
    diameter: '12',
    status: 'MANTENIMIENTO',
    points: [
      { x: 1200, y: 140 },
      { x: 1500, y: 320 },
      { x: 1900, y: 380 }
    ]
  },
  {
    id: 3,
    name: 'Línea de Rebose Curva',
    material: 'Acero Carbono',
    diameter: '24',
    status: 'PROYECTADA',
    points: [
      { x: 2500, y: 420 },
      { x: 3200, y: 180 },
      { x: 3850, y: 150 }
    ]
  }
]);

const loadPipesFromStorage = () => {
  try {
    const saved = localStorage.getItem(props.storageKey) || (props.storageKey === 'dique_principal_pipes_top' ? localStorage.getItem('dique_principal_pipes_curved_v2') : null);
    if (saved) {
      pipes.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error al cargar tuberías curvas:", e);
  }
};

const savePipesToStorage = () => {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(pipes.value));
  } catch (e) {
    console.error("Error al guardar tuberías curvas:", e);
  }
};

watch(pipes, () => {
  savePipesToStorage();
}, { deep: true });

const visiblePipes = computed(() => {
  if (filterStatus.value === 'ALL') return pipes.value;
  return pipes.value.filter(p => p.status === filterStatus.value);
});

const selectedPipe = computed(() => {
  return pipes.value.find(p => p.id === selectedPipeId.value) || null;
});

const setTool = (tool) => {
  currentTool.value = tool;
  if (tool === 'draw') {
    isDrawing.value = true;
    activeDrawingPoints.value = [];
    selectedPipeId.value = null;
  } else {
    finishCurrentDrawing();
  }
};

const handleMouseMove = (e) => {
  if (!svgContainerRef.value) return;
  const rect = svgContainerRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  mouseHovering.value = true;
  mouseClientPos.x = mouseX;
  mouseClientPos.y = mouseY;

  mouseRealCoords.x = Math.max(0, Math.min(4000, (mouseX / rect.width) * 4000));
  mouseRealCoords.y = Math.max(0, Math.min(500, (mouseY / rect.height) * 500));

  // Si se está arrastrando un nodo de la curva seleccionada
  if (draggingNodeInfo.value) {
    const { pipe, pIdx } = draggingNodeInfo.value;
    if (pipe && pipe.points && pipe.points[pIdx]) {
      pipe.points[pIdx].x = Math.round(mouseRealCoords.x);
      pipe.points[pIdx].y = Math.round(mouseRealCoords.y);
    }
  }
};

const handleMouseLeave = () => {
  mouseHovering.value = false;
  draggingNodeInfo.value = null;
};

const handleCanvasClick = (e) => {
  if (currentTool.value === 'draw') {
    activeDrawingPoints.value.push({
      x: Math.round(mouseRealCoords.x),
      y: Math.round(mouseRealCoords.y)
    });
  }
};

const handleCanvasDblClick = () => {
  if (currentTool.value === 'draw') {
    finishCurrentDrawing();
  }
};

const finishCurrentDrawing = () => {
  if (activeDrawingPoints.value.length >= 2) {
    const newPipe = {
      id: Date.now(),
      name: `Tubería Curva #${pipes.value.length + 1}`,
      material: 'HDPE PE100',
      diameter: '16',
      status: 'ACTIVA',
      points: [...activeDrawingPoints.value]
    };
    pipes.value.push(newPipe);
    selectedPipeId.value = newPipe.id;
    showPipePropsModal.value = true;
  }
  isDrawing.value = false;
  activeDrawingPoints.value = [];
  currentTool.value = 'select';
};

const selectPipe = (pipe) => {
  if (currentTool.value === 'select') {
    selectedPipeId.value = pipe.id;
    showPipePropsModal.value = true;
  }
};

const startDragNode = (pipe, pIdx, e) => {
  draggingNodeInfo.value = { pipe, pIdx };
  const onMouseUp = () => {
    draggingNodeInfo.value = null;
    window.removeEventListener('mouseup', onMouseUp);
  };
  window.addEventListener('mouseup', onMouseUp);
};

const addNodeToSelectedPipe = () => {
  if (!selectedPipe.value || !selectedPipe.value.points || selectedPipe.value.points.length < 1) return;
  const pts = selectedPipe.value.points;
  const lastPt = pts[pts.length - 1];
  pts.push({
    x: Math.min(4000, lastPt.x + 150),
    y: Math.min(500, lastPt.y + 50)
  });
};

const deleteSelectedPipe = () => {
  if (!selectedPipeId.value) return;
  pipes.value = pipes.value.filter(p => p.id !== selectedPipeId.value);
  selectedPipeId.value = null;
};

const deleteSelectedPipeFromModal = () => {
  if (confirm("¿Seguro que deseas eliminar esta tubería?")) {
    deleteSelectedPipe();
    showPipePropsModal.value = false;
  }
};

const resetPipes = () => {
  if (confirm("¿Deseas restablecer las tuberías con curvas de ejemplo?")) {
    pipes.value = [
      { id: 1, name: 'Línea de Arenas Principal Curva', material: 'HDPE PE100', diameter: '16', status: 'ACTIVA', points: [{ x: 100, y: 80 }, { x: 800, y: 220 }, { x: 1800, y: 120 }, { x: 2900, y: 340 }, { x: 3900, y: 260 }] },
      { id: 2, name: 'Alimentación Curva Secundaria', material: 'HDPE PE100', diameter: '12', status: 'MANTENIMIENTO', points: [{ x: 1200, y: 140 }, { x: 1500, y: 320 }, { x: 1900, y: 380 }] },
      { id: 3, name: 'Línea de Rebose Curva', material: 'Acero Carbono', diameter: '24', status: 'PROYECTADA', points: [{ x: 2500, y: 420 }, { x: 3200, y: 180 }, { x: 3850, y: 150 }] }
    ];
    selectedPipeId.value = null;
  }
};

// Generación de ruta suave Bézier suavizada
const getSmoothPathD = (points) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
};

// Cálculo de distancia a lo largo del trazo curvo
const calculatePathDistance = (points) => {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
};

const getPipeLabelTransform = (points) => {
  if (!points || points.length === 0) return 'translate(0,0)';
  const midIdx = Math.floor(points.length / 2);
  const pt = points[midIdx];
  return `translate(${pt.x}, ${pt.y - 18})`;
};

const formatDistanceKm = (meters) => {
  if (!meters) return '0 m';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

const getPipeColor = (status) => {
  switch (status) {
    case 'ACTIVA': return '#10b981';
    case 'MANTENIMIENTO': return '#f59e0b';
    case 'INACTIVA': return '#ef4444';
    case 'PROYECTADA': return '#0284c7';
    default: return '#0284c7';
  }
};

const getPipeStrokeWidth = (diameter) => {
  const d = parseInt(diameter) || 16;
  if (d <= 8) return 4;
  if (d <= 12) return 6;
  if (d <= 16) return 8;
  if (d <= 24) return 11;
  return 14;
};

onMounted(() => {
  loadPipesFromStorage();
});
</script>

<style scoped>
.dique-pipes-container {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 1.5rem 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.5rem;
  width: 100%;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0 0.5rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-badge {
  background: #0284c7;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

.canvas-title {
  margin: 0 0 0.2rem 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.canvas-subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tool-btn-group {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  gap: 0.25rem;
}

.btn-tool {
  background: transparent;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-tool.active {
  background: #ffffff;
  color: #0284c7;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.btn-draw.active {
  background: #0284c7;
  color: #ffffff;
}

.btn-finish-draw {
  background: #10b981;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}

.v-divider {
  width: 1px;
  height: 24px;
  background: #cbd5e1;
}

.select-pipe-filter {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  outline: none;
}

.btn-help-pipes, .btn-clear-pipes {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-help-pipes:hover, .btn-clear-pipes:hover {
  background: #e2e8f0;
}

/* VIEWPORT A ESCALA ALINEADO EN ANCHO CON LAS CANCHAS ABAJO */
.scaled-viewport-wrapper {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1rem 0.5rem 1rem 2.2rem;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.ruler-x {
  position: relative;
  height: 24px;
  margin-bottom: 4px;
  width: 100%;
}

.ruler-x-mark {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mark-line-x {
  width: 1px;
  height: 8px;
  background: #94a3b8;
}

.mark-text-x {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
}

.viewport-main-row {
  display: flex;
  position: relative;
  width: 100%;
}

.ruler-y {
  position: absolute;
  left: -28px;
  top: 0;
  height: 100%;
  width: 26px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ruler-y-mark {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
}

.mark-text-y {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.mark-line-y {
  height: 1px;
  width: 6px;
  background: #94a3b8;
}

/* LIENZO SVG PROPORCIÓN 8:1 (SIN CANCHAS INTERNAS) */
.svg-canvas-container {
  width: 100%;
  aspect-ratio: 8 / 1;
  background: #f8fafc;
  border: 2px solid #94a3b8;
  border-radius: 8px;
  position: relative;
  cursor: crosshair;
  overflow: hidden;
}

.pipes-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.pipe-group {
  cursor: pointer;
  transition: opacity 0.2s;
}

.pipe-group:hover path {
  stroke-width: 14px;
}

.node-handle {
  cursor: grab;
  transition: r 0.2s;
}

.node-handle:hover {
  r: 16px;
  cursor: grabbing;
}

.cursor-tooltip {
  position: absolute;
  pointer-events: none;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 50;
  white-space: nowrap;
}

/* FORMULARIO INFERIOR */
.pipe-editor-card {
  margin-top: 1.25rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
}

.editor-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-add-node {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #0284c7;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-delete-pipe {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
}

.pipe-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
}

.form-input, .form-select {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  outline: none;
}

/* Modal Help */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
.btn-close-modal { background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; }

.modal-body { padding: 1.5rem; font-size: 0.9rem; color: #334155; line-height: 1.5; }
.help-list { margin-top: 0.75rem; padding-left: 1.25rem; }
.help-list li { margin-bottom: 0.5rem; }

.modal-footer {
  display: flex; justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-save-edit { background: #0284c7; border: none; color: #ffffff; font-weight: 700; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; }

/* Estilos de Modal Emergente de Propiedades de Tubería */
.modal-pipe-props {
  max-width: 620px;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
}

.header-sub {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 500;
  display: block;
}

.pipe-info-summary {
  display: flex;
  gap: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-top: 1.25rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-lbl {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
}

.info-val {
  font-size: 0.9rem;
  font-weight: 800;
  color: #0f172a;
}

.info-val.highlight {
  color: #0284c7;
}

.modal-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.footer-right-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-props-pipe {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0284c7;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-props-pipe:hover {
  background: #0284c7;
  color: #ffffff;
}
</style>
