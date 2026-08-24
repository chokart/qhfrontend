<template>
  <div class="reporte-view">
    <AppNavbar />

    <div class="page-container">
      <!-- Encabezado de la página -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">📊</div>
          <div>
            <h1>Reporte de Producción de Arenas</h1>
            <p class="subtitle">Programado por Guardia: <b>DP: 17,579 TM</b> (35,158 TM/día) | <b>DL: 4,548 TM</b> (9,096 TM/día) | <b>Total: 44,254 TM/día</b></p>
          </div>
        </div>

        <div class="header-actions">
          <!-- Selector de Mes/Año -->
          <div v-if="availableMonths.length > 0" class="month-selector-wrap">
            <span class="selector-icon">📅</span>
            <select v-model="selectedMonthKey" @change="onMonthChange" class="month-select">
              <option v-for="m in availableMonths" :key="`${m.year}-${m.month}`" :value="`${m.year}-${m.month}`">
                {{ getMonthName(m.month) }} {{ m.year }}
              </option>
            </select>
          </div>

          <!-- Botón Eliminar Mes -->
          <button v-if="selectedMonthKey" class="btn-delete-month" @click="deleteSelectedMonthReport" title="Eliminar reporte del mes seleccionado">
            <span>🗑️ Eliminar Mes</span>
          </button>

          <!-- Botón Pegar Producción -->
          <button class="btn-paste-header" @click="activeTab = 'paste'">
            <span>📋 Pegar Producción</span>
          </button>
        </div>
      </div>

      <!-- Alerta / Estado de carga -->
      <transition name="fade">
        <div v-if="uploadStatus.message" :class="['status-banner', uploadStatus.isSuccess ? 'success' : 'error']">
          <span class="status-icon">{{ uploadStatus.isSuccess ? '✅' : '❌' }}</span>
          <span>{{ uploadStatus.message }}</span>
        </div>
      </transition>

      <!-- Overlay Spinner durante el procesamiento -->
      <div v-if="isUploading" class="uploading-overlay">
        <div class="spinner-card">
          <div class="spinner-large"></div>
          <p>Procesando datos de producción y actualizando la base de datos...</p>
        </div>
      </div>

      <!-- Dashboard de Producción -->
      <div class="dashboard-content">

        <!-- TARJETAS DE KPIS CON PROGRAMADO Y % CUMPLIMIENTO -->
        <div v-if="dashboardData" class="kpi-grid">
          <!-- 1. Dique Principal (DP) -->
          <div class="kpi-card primary">
            <div class="kpi-icon">🏗️</div>
            <div class="kpi-info">
              <div class="kpi-top">
                <span class="kpi-label">Dique Principal (DP)</span>
                <span :class="['badge-pct', getPctClass(percentDpMonth)]">{{ percentDpMonth }}% Cumplido</span>
              </div>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalDpArenas) }} <small>TM Real</small></span>
              <span class="kpi-sub">
                Prog: <b>{{ formatNumber(programmedDpMonth) }}</b> TM | ☀️ A: {{ formatNumber(dashboardData.totalDpArenasA) }} | 🌙 B: {{ formatNumber(dashboardData.totalDpArenasB) }}
              </span>
              <div class="progress-track">
                <div class="progress-fill dp-fill" :style="{ width: Math.min(percentDpMonth, 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 2. Dique Lateral (DL) -->
          <div class="kpi-card info">
            <div class="kpi-icon">📐</div>
            <div class="kpi-info">
              <div class="kpi-top">
                <span class="kpi-label">Dique Lateral (DL)</span>
                <span :class="['badge-pct', getPctClass(percentDlMonth)]">{{ percentDlMonth }}% Cumplido</span>
              </div>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalDlArenas) }} <small>TM Real</small></span>
              <span class="kpi-sub">
                Prog: <b>{{ formatNumber(programmedDlMonth) }}</b> TM | ☀️ A: {{ formatNumber(dashboardData.totalDlArenasA) }} | 🌙 B: {{ formatNumber(dashboardData.totalDlArenasB) }}
              </span>
              <div class="progress-track">
                <div class="progress-fill dl-fill" :style="{ width: Math.min(percentDlMonth, 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 3. Total Turno A (Día) -->
          <div class="kpi-card warning">
            <div class="kpi-icon">☀️</div>
            <div class="kpi-info">
              <div class="kpi-top">
                <span class="kpi-label">Turno A (Guardia Día)</span>
                <span :class="['badge-pct', getPctClass(percentShiftAMonth)]">{{ percentShiftAMonth }}% Cumplido</span>
              </div>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasA) }} <small>TM Real</small></span>
              <span class="kpi-sub">
                Prog: <b>{{ formatNumber(programmedShiftAMonth) }}</b> TM (DP: 17,579 + DL: 4,548)
              </span>
              <div class="progress-track">
                <div class="progress-fill shift-a-fill" :style="{ width: Math.min(percentShiftAMonth, 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 4. Total Turno B (Noche) -->
          <div class="kpi-card night">
            <div class="kpi-icon">🌙</div>
            <div class="kpi-info">
              <div class="kpi-top">
                <span class="kpi-label">Turno B (Guardia Noche)</span>
                <span :class="['badge-pct', getPctClass(percentShiftBMonth)]">{{ percentShiftBMonth }}% Cumplido</span>
              </div>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasB) }} <small>TM Real</small></span>
              <span class="kpi-sub">
                Prog: <b>{{ formatNumber(programmedShiftBMonth) }}</b> TM (DP: 17,579 + DL: 4,548)
              </span>
              <div class="progress-track">
                <div class="progress-fill shift-b-fill" :style="{ width: Math.min(percentShiftBMonth, 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 5. Producción Total Mes (DP + DL) -->
          <div class="kpi-card success-card">
            <div class="kpi-icon">📦</div>
            <div class="kpi-info">
              <div class="kpi-top">
                <span class="kpi-label">Producción Total Mes</span>
                <span :class="['badge-pct', getPctClass(percentTotalMonth)]">{{ percentTotalMonth }}% Cumplido</span>
              </div>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasMes) }} <small>TM Secas</small></span>
              <span class="kpi-sub">
                Programado Mes: <b>{{ formatNumber(programmedTotalMonth) }}</b> TM
              </span>
              <div class="progress-track">
                <div class="progress-fill tot-fill" :style="{ width: Math.min(percentTotalMonth, 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- NAVEGACIÓN ENTRE VISTAS DEL DASHBOARD -->
        <div class="view-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'paste' }]" 
            @click="activeTab = 'paste'"
          >
            📋 Pegar Producción (Copiar de Excel)
          </button>
          <button 
            v-if="dashboardData"
            :class="['tab-btn', { active: activeTab === 'matrix' }]" 
            @click="activeTab = 'matrix'"
          >
            📊 Matriz Mensual (Día 01 - 31)
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'annual' }]" 
            @click="openAnnualTab"
          >
            📅 Resumen Anual (Mes por Mes)
          </button>
        </div>

        <!-- TAB PASTE: PEGAR DATOS DIRECTAMENTE DESDE EXCEL -->
        <div v-if="activeTab === 'paste'" class="tab-pane">
          <div class="card paste-card">
            <div class="card-header-inner">
              <div>
                <h3>📋 Ingresar Producción Pegando de Excel / Google Sheets</h3>
                <p class="table-sub-desc">Copia la tabla directamente desde tu hoja de cálculo e ingrésala en el recuadro de abajo.</p>
              </div>
            </div>

            <div class="paste-body">
              <!-- Formato Guía de Columnas -->
              <div class="paste-instruction-box">
                <div class="instruction-header">
                  <span>💡 <b>Formato de Columnas (Separadas por tabuladores desde Excel):</b></span>
                </div>
                <div class="instruction-format">
                  <code><b>DIA</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>TURNO</b> &nbsp;&nbsp;&nbsp; <b>DP</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>DL</b></code><br>
                  <code>1-Jan-26 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 20,962 &nbsp;&nbsp;&nbsp;&nbsp; 3,550</code><br>
                  <code>1-Jan-26 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; B &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 22,198 &nbsp;&nbsp;&nbsp;&nbsp; 2,989</code><br>
                  <code>2-Jan-26 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 20,961 &nbsp;&nbsp;&nbsp;&nbsp; 1,495</code>
                </div>
              </div>

              <!-- Textarea para Pegar -->
              <div class="textarea-wrap">
                <label class="textarea-label">Pega aquí los datos copiados desde Excel (Ctrl + V):</label>
                <textarea
                  v-model="rawPastedText"
                  @input="parsePastedTextPreview"
                  placeholder="DIA	TURNO	DP	DL&#10;1-Jan-26	A	20,962	3,550&#10;1-Jan-26	B	22,198	2,989..."
                  rows="9"
                  class="paste-textarea"
                ></textarea>
              </div>

              <!-- Sección Vista Previa en Tiempo Real -->
              <div v-if="parsedPreviewRows.length > 0" class="preview-section">
                <div class="preview-header">
                  <div>
                    <h4>🔍 Vista Previa en Tiempo Real</h4>
                    <span class="badge-preview">{{ parsedPreviewRows.length }} registros detectados correctamente</span>
                  </div>
                  <button class="btn-save-paste" @click="submitPastedReport" :disabled="isUploading">
                    <span v-if="!isUploading">🚀 Guardar Producción en el Sistema</span>
                    <span v-else>⏳ Guardando...</span>
                  </button>
                </div>

                <div class="table-wrapper-responsive preview-table-wrap">
                  <table class="preview-table">
                    <thead>
                      <tr>
                        <th>FECHA DETECTADA</th>
                        <th>TURNO</th>
                        <th>DIQUE PRINCIPAL (DP)</th>
                        <th>DIQUE LATERAL (DL)</th>
                        <th>TOTAL DÍA (TM)</th>
                        <th>% CUMP. TARGET DÍA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(r, idx) in parsedPreviewRows" :key="idx" :class="idx % 2 === 0 ? 'even-row' : ''">
                        <td class="cell-date"><b>{{ r.dateStr }}</b></td>
                        <td>
                          <span :class="['turno-badge', r.turno === 'A' ? 'day-badge' : 'night-badge']">
                            {{ r.turno === 'A' ? '☀️ Turno A' : '🌙 Turno B' }}
                          </span>
                        </td>
                        <td class="cell-dp">{{ formatNumber(r.dp) }} TM</td>
                        <td class="cell-dl">{{ formatNumber(r.dl) }} TM</td>
                        <td class="cell-tot"><b>{{ formatNumber(r.dp + r.dl) }} TM</b></td>
                        <td>
                          <span :class="['badge-pct', getPctClass(getDailyShiftPct(r.dp + r.dl))]">
                            {{ getDailyShiftPct(r.dp + r.dl) }}% (Prog: 22,127 TM)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 1: MATRIZ MENSUAL COMPLETA DE PRODUCCIÓN -->
        <div v-if="activeTab === 'matrix' && dashboardData" class="tab-pane">
          <div class="card table-card">
            <div class="card-header-inner">
              <div>
                <h3>📋 Tabla Mensual de Producción vs Programado</h3>
                <p class="table-sub-desc">Metas por Guardia: DP (17,579 TM) | DL (4,548 TM) | Total Día Programado (44,254 TM)</p>
              </div>
              <span class="badge-days-count">{{ dashboardData.dailyReports ? dashboardData.dailyReports.length : 0 }} Días del Mes Registrados</span>
            </div>

            <div class="table-wrapper-responsive">
              <table class="prod-matrix-table">
                <thead>
                  <tr class="header-group-row">
                    <th colspan="2" class="hdr-group date-hdr">FECHA DE OPERACIÓN</th>
                    <th colspan="3" class="hdr-group dp-hdr">DIQUE PRINCIPAL (DP)</th>
                    <th colspan="3" class="hdr-group dl-hdr">DIQUE LATERAL (DL)</th>
                    <th colspan="4" class="hdr-group tot-hdr">TOTAL PRODUCCIÓN ARENAS Y % CUMPLIMIENTO</th>
                    <th class="hdr-group act-hdr">ACCIÓN</th>
                  </tr>
                  <tr class="header-sub-row">
                    <th class="col-num">Nº</th>
                    <th class="col-date">FECHA</th>
                    <th class="col-val dp-col">TURNO A (TM)</th>
                    <th class="col-val dp-col">TURNO B (TM)</th>
                    <th class="col-val dp-tot-col">TOTAL DP (TM)</th>
                    <th class="col-val dl-col">TURNO A (TM)</th>
                    <th class="col-val dl-col">TURNO B (TM)</th>
                    <th class="col-val dl-tot-col">TOTAL DL (TM)</th>
                    <th class="col-val tot-a-col">TOTAL TURNO A</th>
                    <th class="col-val tot-b-col">TOTAL TURNO B</th>
                    <th class="col-val grand-tot-col">TOTAL DÍA (TM)</th>
                    <th class="col-val pct-col">% CUMP. DÍA</th>
                    <th class="col-act">EDITAR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in dashboardData.dailyReports" :key="d.id" :class="['row-daily', { 'row-empty-warning': isRowEmpty(d) }]">
                    <td class="cell-num"><b>{{ d.dayNumber < 10 ? '0' + d.dayNumber : d.dayNumber }}</b></td>
                    <td class="cell-date">
                      {{ d.reportDate }}
                      <span v-if="isRowEmpty(d)" class="empty-badge" title="Día sin datos de producción">⚠️ Sin Registro</span>
                    </td>
                    
                    <!-- DP -->
                    <td class="cell-val dp-a">{{ formatNumber(d.dpArenasGuardiaA) }}</td>
                    <td class="cell-val dp-b">{{ formatNumber(d.dpArenasGuardiaB) }}</td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(d.dpArenasTotalDia) }}</b></td>
                    
                    <!-- DL -->
                    <td class="cell-val dl-a">{{ formatNumber(d.dlArenasGuardiaA) }}</td>
                    <td class="cell-val dl-b">{{ formatNumber(d.dlArenasGuardiaB) }}</td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(d.dlArenasTotalDia) }}</b></td>
                    
                    <!-- Totales Combinados por Turno y Día -->
                    <td class="cell-val tot-a"><b>{{ formatNumber((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0)) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0)) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(d.totalArenasDia) }}</b></td>
                    
                    <!-- % Cumplimiento del Día vs 44,254 TM -->
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(getDailyPct(d.totalArenasDia, PROGRAMMED_TOTAL_DAILY))]">
                        {{ getDailyPct(d.totalArenasDia, PROGRAMMED_TOTAL_DAILY) }}%
                      </span>
                    </td>

                    <!-- Botón Editar -->
                    <td class="cell-act">
                      <button class="btn-edit-row" @click="openEditModal(d)" title="Modificar manualmente valores del día">
                        ✏️
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <!-- 1. Real Acumulado -->
                  <tr class="summary-foot-row total-row">
                    <td colspan="2" class="foot-label"><b>TOTAL REAL ACUMULADO MES</b></td>
                    <td class="cell-val dp-a"><b>{{ formatNumber(dashboardData.totalDpArenasA) }}</b></td>
                    <td class="cell-val dp-b"><b>{{ formatNumber(dashboardData.totalDpArenasB) }}</b></td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(dashboardData.totalDpArenas) }}</b></td>
                    <td class="cell-val dl-a"><b>{{ formatNumber(dashboardData.totalDlArenasA) }}</b></td>
                    <td class="cell-val dl-b"><b>{{ formatNumber(dashboardData.totalDlArenasB) }}</b></td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(dashboardData.totalDlArenas) }}</b></td>
                    <td class="cell-val tot-a"><b>{{ formatNumber(dashboardData.totalArenasA) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber(dashboardData.totalArenasB) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(dashboardData.totalArenasMes) }}</b></td>
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(percentTotalMonth)]">
                        <b>{{ percentTotalMonth }}%</b>
                      </span>
                    </td>
                    <td></td>
                  </tr>

                  <!-- 2. Programado Mes -->
                  <tr class="summary-foot-row prog-row">
                    <td colspan="2" class="foot-label"><b>TOTAL PROGRAMADO MES (META)</b></td>
                    <td class="cell-val dp-a">{{ formatNumber(programmedShiftAMonthDp) }}</td>
                    <td class="cell-val dp-b">{{ formatNumber(programmedShiftBMonthDp) }}</td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(programmedDpMonth) }}</b></td>
                    <td class="cell-val dl-a">{{ formatNumber(programmedShiftAMonthDl) }}</td>
                    <td class="cell-val dl-b">{{ formatNumber(programmedShiftBMonthDl) }}</td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(programmedDlMonth) }}</b></td>
                    <td class="cell-val tot-a"><b>{{ formatNumber(programmedShiftAMonth) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber(programmedShiftBMonth) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(programmedTotalMonth) }}</b></td>
                    <td class="cell-val cell-pct">100%</td>
                    <td></td>
                  </tr>

                  <!-- 3. % Cumplimiento Mes -->
                  <tr class="summary-foot-row pct-summary-row">
                    <td colspan="2" class="foot-label"><b>% CUMPLIMIENTO METAS MES</b></td>
                    <td class="cell-val dp-a">
                      <span :class="['badge-pct', getPctClass(getDailyPct(dashboardData.totalDpArenasA, programmedShiftAMonthDp))]">
                        {{ getDailyPct(dashboardData.totalDpArenasA, programmedShiftAMonthDp) }}%
                      </span>
                    </td>
                    <td class="cell-val dp-b">
                      <span :class="['badge-pct', getPctClass(getDailyPct(dashboardData.totalDpArenasB, programmedShiftBMonthDp))]">
                        {{ getDailyPct(dashboardData.totalDpArenasB, programmedShiftBMonthDp) }}%
                      </span>
                    </td>
                    <td class="cell-val dp-tot">
                      <span :class="['badge-pct', getPctClass(percentDpMonth)]">
                        <b>{{ percentDpMonth }}%</b>
                      </span>
                    </td>
                    <td class="cell-val dl-a">
                      <span :class="['badge-pct', getPctClass(getDailyPct(dashboardData.totalDlArenasA, programmedShiftAMonthDl))]">
                        {{ getDailyPct(dashboardData.totalDlArenasA, programmedShiftAMonthDl) }}%
                      </span>
                    </td>
                    <td class="cell-val dl-b">
                      <span :class="['badge-pct', getPctClass(getDailyPct(dashboardData.totalDlArenasB, programmedShiftBMonthDl))]">
                        {{ getDailyPct(dashboardData.totalDlArenasB, programmedShiftBMonthDl) }}%
                      </span>
                    </td>
                    <td class="cell-val dl-tot">
                      <span :class="['badge-pct', getPctClass(percentDlMonth)]">
                        <b>{{ percentDlMonth }}%</b>
                      </span>
                    </td>
                    <td class="cell-val tot-a">
                      <span :class="['badge-pct', getPctClass(percentShiftAMonth)]">
                        <b>{{ percentShiftAMonth }}%</b>
                      </span>
                    </td>
                    <td class="cell-val tot-b">
                      <span :class="['badge-pct', getPctClass(percentShiftBMonth)]">
                        <b>{{ percentShiftBMonth }}%</b>
                      </span>
                    </td>
                    <td class="cell-val grand-tot">
                      <span :class="['badge-pct', getPctClass(percentTotalMonth)]">
                        <b>{{ percentTotalMonth }}%</b>
                      </span>
                    </td>
                    <td></td>
                    <td></td>
                  </tr>

                  <!-- 4. Promedio Diario -->
                  <tr class="summary-foot-row avg-row">
                    <td colspan="2" class="foot-label"><b>PROMEDIO DIARIO REAL</b></td>
                    <td class="cell-val dp-a">{{ formatAvg(dashboardData.totalDpArenasA) }}</td>
                    <td class="cell-val dp-b">{{ formatAvg(dashboardData.totalDpArenasB) }}</td>
                    <td class="cell-val dp-tot">{{ formatAvg(dashboardData.totalDpArenas) }}</td>
                    <td class="cell-val dl-a">{{ formatAvg(dashboardData.totalDlArenasA) }}</td>
                    <td class="cell-val dl-b">{{ formatAvg(dashboardData.totalDlArenasB) }}</td>
                    <td class="cell-val dl-tot">{{ formatAvg(dashboardData.totalDlArenas) }}</td>
                    <td class="cell-val tot-a">{{ formatAvg(dashboardData.totalArenasA) }}</td>
                    <td class="cell-val tot-b">{{ formatAvg(dashboardData.totalArenasB) }}</td>
                    <td class="cell-val grand-tot">{{ formatAvg(dashboardData.totalArenasMes) }}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: RESUMEN ANUAL (MES POR MES) CON PROGRAMADO Y % -->
        <div v-if="activeTab === 'annual'" class="tab-pane">
          <div class="card table-card">
            <div class="card-header-inner">
              <div>
                <h3>📅 Resumen Anual de Producción (Mes por Mes) vs Meta - Año {{ selectedYear }}</h3>
                <p class="table-sub-desc">Metas Anuales: DP (35,158 TM/día) | DL (9,096 TM/día) | Total Combinado (44,254 TM/día)</p>
              </div>
              <span v-if="loadingAnnual" class="badge-days-count">⏳ Cargando Resumen Anual...</span>
            </div>

            <div v-if="annualData" class="table-wrapper-responsive">
              <table class="prod-matrix-table annual-table">
                <thead>
                  <tr class="header-group-row">
                    <th colspan="2" class="hdr-group date-hdr">PERÍODO</th>
                    <th colspan="3" class="hdr-group dp-hdr">DIQUE PRINCIPAL (DP)</th>
                    <th colspan="3" class="hdr-group dl-hdr">DIQUE LATERAL (DL)</th>
                    <th colspan="4" class="hdr-group tot-hdr">TOTAL PRODUCCIÓN ARENAS Y % CUMPLIMIENTO</th>
                  </tr>
                  <tr class="header-sub-row">
                    <th class="col-num">Nº</th>
                    <th class="col-date">MES</th>
                    <th class="col-val dp-col">REAL (TM)</th>
                    <th class="col-val dp-col">PROG (TM)</th>
                    <th class="col-val dp-tot-col">% DP</th>
                    <th class="col-val dl-col">REAL (TM)</th>
                    <th class="col-val dl-col">PROG (TM)</th>
                    <th class="col-val dl-tot-col">% DL</th>
                    <th class="col-val tot-a-col">REAL TOTAL</th>
                    <th class="col-val tot-b-col">PROG TOTAL</th>
                    <th class="col-val grand-tot-col">DÍAS</th>
                    <th class="col-val pct-col">% CUMP. MES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in annualData.months" :key="m.monthNumber" :class="['row-daily', { 'row-empty-warning': !m.hasData }]">
                    <td class="cell-num"><b>{{ m.monthNumber < 10 ? '0' + m.monthNumber : m.monthNumber }}</b></td>
                    <td class="cell-date">
                      <b>{{ getMonthName(m.monthNumber) }}</b>
                      <span v-if="!m.hasData" class="empty-badge">Sin Datos</span>
                    </td>
                    
                    <!-- DP -->
                    <td class="cell-val dp-tot"><b>{{ formatNumber(m.dpArenasTotal) }}</b></td>
                    <td class="cell-val">{{ formatNumber(getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_DP_DAILY) }}</td>
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(getDailyPct(m.dpArenasTotal, getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_DP_DAILY))]">
                        {{ getDailyPct(m.dpArenasTotal, getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_DP_DAILY) }}%
                      </span>
                    </td>

                    <!-- DL -->
                    <td class="cell-val dl-tot"><b>{{ formatNumber(m.dlArenasTotal) }}</b></td>
                    <td class="cell-val">{{ formatNumber(getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_DL_DAILY) }}</td>
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(getDailyPct(m.dlArenasTotal, getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_DL_DAILY))]">
                        {{ getDailyPct(m.dlArenasTotal, getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_DL_DAILY) }}%
                      </span>
                    </td>

                    <!-- TOTALES COMBINADOS -->
                    <td class="cell-val grand-tot"><b>{{ formatNumber(m.totalArenasMes) }}</b></td>
                    <td class="cell-val"><b>{{ formatNumber(getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_TOTAL_DAILY) }}</b></td>
                    <td class="cell-num">{{ getDaysInMonth(selectedYear, m.monthNumber) }}</td>
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(getDailyPct(m.totalArenasMes, getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_TOTAL_DAILY))]">
                        <b>{{ getDailyPct(m.totalArenasMes, getDaysInMonth(selectedYear, m.monthNumber) * PROGRAMMED_TOTAL_DAILY) }}%</b>
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="summary-foot-row total-row">
                    <td colspan="2" class="foot-label"><b>TOTAL ANUAL ACUMULADO</b></td>
                    
                    <!-- DP -->
                    <td class="cell-val dp-tot"><b>{{ formatNumber(annualData.grandDpTotal) }}</b></td>
                    <td class="cell-val">{{ formatNumber(annualProgrammedDpYear) }}</td>
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(getDailyPct(annualData.grandDpTotal, annualProgrammedDpYear))]">
                        <b>{{ getDailyPct(annualData.grandDpTotal, annualProgrammedDpYear) }}%</b>
                      </span>
                    </td>

                    <!-- DL -->
                    <td class="cell-val dl-tot"><b>{{ formatNumber(annualData.grandDlTotal) }}</b></td>
                    <td class="cell-val">{{ formatNumber(annualProgrammedDlYear) }}</td>
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(getDailyPct(annualData.grandDlTotal, annualProgrammedDlYear))]">
                        <b>{{ getDailyPct(annualData.grandDlTotal, annualProgrammedDlYear) }}%</b>
                      </span>
                    </td>

                    <!-- TOTAL ANUAL -->
                    <td class="cell-val grand-tot"><b>{{ formatNumber(annualData.grandTotalYear) }}</b></td>
                    <td class="cell-val"><b>{{ formatNumber(annualProgrammedTotalYear) }}</b></td>
                    <td class="cell-num">{{ isLeapYear(selectedYear) ? 366 : 365 }}</td>
                    <td class="cell-val cell-pct">
                      <span :class="['badge-pct', getPctClass(getDailyPct(annualData.grandTotalYear, annualProgrammedTotalYear))]">
                        <b>{{ getDailyPct(annualData.grandTotalYear, annualProgrammedTotalYear) }}%</b>
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- MODAL PARA EDITAR PARTE DIARIO MANULAMENTE -->
    <div v-if="showEditModal" class="modal-backdrop" @click.self="showEditModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>✏️ Modificar Producción del Día {{ editForm.dayNumber }} ({{ editForm.reportDate }})</h3>
          <button class="btn-close-modal" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">Ingresa o corrige los valores de producción en TM Secas para cada guardia:</p>

          <!-- Sección DP -->
          <div class="edit-section-box blue">
            <h4>🏗️ Dique Principal (DP) - Target Guardia: 17,579 TM</h4>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">☀️ Turno A (Día) - TM:</label>
                <input type="number" v-model.number="editForm.dpArenasGuardiaA" class="form-input" min="0" step="any" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">🌙 Turno B (Noche) - TM:</label>
                <input type="number" v-model.number="editForm.dpArenasGuardiaB" class="form-input" min="0" step="any" placeholder="0" />
              </div>
            </div>
            <div class="sub-total-row">
              <span>Total DP Día: <b>{{ formatNumber((editForm.dpArenasGuardiaA || 0) + (editForm.dpArenasGuardiaB || 0)) }} TM</b> (Prog: 35,158 TM)</span>
            </div>
          </div>

          <!-- Sección DL -->
          <div class="edit-section-box green">
            <h4>📐 Dique Lateral (DL) - Target Guardia: 4,548 TM</h4>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">☀️ Turno A (Día) - TM:</label>
                <input type="number" v-model.number="editForm.dlArenasGuardiaA" class="form-input" min="0" step="any" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">🌙 Turno B (Noche) - TM:</label>
                <input type="number" v-model.number="editForm.dlArenasGuardiaB" class="form-input" min="0" step="any" placeholder="0" />
              </div>
            </div>
            <div class="sub-total-row">
              <span>Total DL Día: <b>{{ formatNumber((editForm.dlArenasGuardiaA || 0) + (editForm.dlArenasGuardiaB || 0)) }} TM</b> (Prog: 9,096 TM)</span>
            </div>
          </div>

          <!-- Resumen Gran Total -->
          <div class="grand-total-summary-card">
            <div class="gt-title">📦 Gran Total Producción Día (DP + DL)</div>
            <div class="gt-value">{{ formatNumber((editForm.dpArenasGuardiaA || 0) + (editForm.dpArenasGuardiaB || 0) + (editForm.dlArenasGuardiaA || 0) + (editForm.dlArenasGuardiaB || 0)) }} <small>TM Secas</small></div>
            <div class="gt-sub">% Cumplimiento Target Diario: <b>{{ getDailyPct((editForm.dpArenasGuardiaA || 0) + (editForm.dpArenasGuardiaB || 0) + (editForm.dlArenasGuardiaA || 0) + (editForm.dlArenasGuardiaB || 0), PROGRAMMED_TOTAL_DAILY) }}%</b> (Prog: 44,254 TM)</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">Cancelar</button>
          <button class="btn-save-edit" :disabled="savingEdit" @click="saveDailyReportEdit">
            <span v-if="savingEdit">Guardando...</span>
            <span v-else>💾 Guardar Producción</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../api';
import AppNavbar from '../components/AppNavbar.vue';

// --- METAS Y PROGRAMACIÓN POR GUARDIA (TM SECAS) ---
const PROGRAMMED_DP_PER_SHIFT = 17579; // 17,579 TM / turno
const PROGRAMMED_DL_PER_SHIFT = 4548;  // 4,548 TM / turno

const PROGRAMMED_DP_DAILY = PROGRAMMED_DP_PER_SHIFT * 2; // 35,158 TM / día
const PROGRAMMED_DL_DAILY = PROGRAMMED_DL_PER_SHIFT * 2; // 9,096 TM / día
const PROGRAMMED_TOTAL_DAILY = PROGRAMMED_DP_DAILY + PROGRAMMED_DL_DAILY; // 44,254 TM / día

const isUploading = ref(false);
const availableMonths = ref([]);
const selectedMonthKey = ref('');
const dashboardData = ref(null);
const activeTab = ref('paste');

// Variables para datos pegados desde Excel
const rawPastedText = ref('');
const parsedPreviewRows = ref([]);

// Resumen Anual
const annualData = ref(null);
const loadingAnnual = ref(false);
const selectedYear = computed(() => {
  if (selectedMonthKey.value) {
    return parseInt(selectedMonthKey.value.split('-')[0]);
  }
  return new Date().getFullYear();
});

// Modal de edición
const showEditModal = ref(false);
const savingEdit = ref(false);
const editForm = reactive({
  id: null,
  reportDate: '',
  dayNumber: 0,
  dpArenasGuardiaA: 0,
  dpArenasGuardiaB: 0,
  dlArenasGuardiaA: 0,
  dlArenasGuardiaB: 0
});

const uploadStatus = reactive({
  message: '',
  isSuccess: false
});

// --- COMPUTADOS PARA PROGRAMADO Y % CUMPLIMIENTO ---
const totalDaysInMonth = computed(() => {
  if (!dashboardData.value || !dashboardData.value.dailyReports) return 31;
  return dashboardData.value.dailyReports.length;
});

const programmedDpMonth = computed(() => totalDaysInMonth.value * PROGRAMMED_DP_DAILY);
const programmedDlMonth = computed(() => totalDaysInMonth.value * PROGRAMMED_DL_DAILY);
const programmedTotalMonth = computed(() => totalDaysInMonth.value * PROGRAMMED_TOTAL_DAILY);

const programmedShiftAMonthDp = computed(() => totalDaysInMonth.value * PROGRAMMED_DP_PER_SHIFT);
const programmedShiftBMonthDp = computed(() => totalDaysInMonth.value * PROGRAMMED_DP_PER_SHIFT);

const programmedShiftAMonthDl = computed(() => totalDaysInMonth.value * PROGRAMMED_DL_PER_SHIFT);
const programmedShiftBMonthDl = computed(() => totalDaysInMonth.value * PROGRAMMED_DL_PER_SHIFT);

const programmedShiftAMonth = computed(() => totalDaysInMonth.value * (PROGRAMMED_DP_PER_SHIFT + PROGRAMMED_DL_PER_SHIFT));
const programmedShiftBMonth = computed(() => totalDaysInMonth.value * (PROGRAMMED_DP_PER_SHIFT + PROGRAMMED_DL_PER_SHIFT));

const percentDpMonth = computed(() => {
  if (!dashboardData.value || !programmedDpMonth.value) return 0;
  return Math.round((dashboardData.value.totalDpArenas / programmedDpMonth.value) * 100);
});

const percentDlMonth = computed(() => {
  if (!dashboardData.value || !programmedDlMonth.value) return 0;
  return Math.round((dashboardData.value.totalDlArenas / programmedDlMonth.value) * 100);
});

const percentShiftAMonth = computed(() => {
  if (!dashboardData.value || !programmedShiftAMonth.value) return 0;
  return Math.round((dashboardData.value.totalArenasA / programmedShiftAMonth.value) * 100);
});

const percentShiftBMonth = computed(() => {
  if (!dashboardData.value || !programmedShiftBMonth.value) return 0;
  return Math.round((dashboardData.value.totalArenasB / programmedShiftBMonth.value) * 100);
});

const percentTotalMonth = computed(() => {
  if (!dashboardData.value || !programmedTotalMonth.value) return 0;
  return Math.round((dashboardData.value.totalArenasMes / programmedTotalMonth.value) * 100);
});

// Computados Anuales
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const annualProgrammedDpYear = computed(() => {
  const days = isLeapYear(selectedYear.value) ? 366 : 365;
  return days * PROGRAMMED_DP_DAILY;
});

const annualProgrammedDlYear = computed(() => {
  const days = isLeapYear(selectedYear.value) ? 366 : 365;
  return days * PROGRAMMED_DL_DAILY;
});

const annualProgrammedTotalYear = computed(() => {
  const days = isLeapYear(selectedYear.value) ? 366 : 365;
  return days * PROGRAMMED_TOTAL_DAILY;
});

// Helper de Porcentaje
const getDailyPct = (realVal, programmedVal) => {
  if (!programmedVal || programmedVal === 0) return 0;
  return Math.round(((realVal || 0) / programmedVal) * 100);
};

const getDailyShiftPct = (realVal) => {
  const progTarget = PROGRAMMED_DP_PER_SHIFT + PROGRAMMED_DL_PER_SHIFT; // 22,127 TM
  return Math.round(((realVal || 0) / progTarget) * 100);
};

const getPctClass = (pct) => {
  if (pct >= 90) return 'pct-success';
  if (pct >= 75) return 'pct-warning';
  return 'pct-danger';
};

const getMonthName = (m) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[m - 1] || m;
};

const formatNumber = (val) => {
  if (val === null || val === undefined) return '0';
  return Math.round(val).toLocaleString('es-PE');
};

const formatAvg = (totalVal) => {
  if (!dashboardData.value || !dashboardData.value.dailyReports || dashboardData.value.dailyReports.length === 0) return '0';
  const count = dashboardData.value.dailyReports.length;
  return Math.round((totalVal || 0) / count).toLocaleString('es-PE');
};

const isRowEmpty = (d) => {
  if (!d) return true;
  const tot = (d.dpArenasGuardiaA || 0) + (d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaA || 0) + (d.dlArenasGuardiaB || 0);
  return tot === 0;
};

const loadAvailableMonths = async () => {
  try {
    const res = await api.get('/api/v1/reports/months');
    availableMonths.value = res.data;
    if (availableMonths.value.length > 0 && !selectedMonthKey.value) {
      const first = availableMonths.value[0];
      selectedMonthKey.value = `${first.year}-${first.month}`;
      await loadDashboardData(first.year, first.month);
      activeTab.value = 'matrix';
    }
  } catch (err) {
    console.error("Error al cargar meses disponibles:", err);
  }
};

const loadDashboardData = async (year, month) => {
  try {
    const res = await api.get(`/api/v1/reports/dashboard?year=${year}&month=${month}`);
    dashboardData.value = res.data;
  } catch (err) {
    console.error("Error al cargar dashboard data:", err);
  }
};

const openAnnualTab = () => {
  activeTab.value = 'annual';
  loadAnnualSummary(selectedYear.value);
};

const loadAnnualSummary = async (year) => {
  loadingAnnual.value = true;
  try {
    const res = await api.get(`/api/v1/reports/annual?year=${year}`);
    annualData.value = res.data;
  } catch (err) {
    console.error("Error al cargar resumen anual:", err);
  } finally {
    loadingAnnual.value = false;
  }
};

const onMonthChange = () => {
  if (!selectedMonthKey.value) return;
  const [year, month] = selectedMonthKey.value.split('-');
  loadDashboardData(year, month);
  if (activeTab.value === 'annual') {
    loadAnnualSummary(year);
  }
};

const deleteSelectedMonthReport = async () => {
  if (!selectedMonthKey.value) return;
  const [year, month] = selectedMonthKey.value.split('-');
  const monthName = getMonthName(parseInt(month));

  if (!confirm(`¿Estás seguro de eliminar todo el reporte cargado de ${monthName} ${year}?\n\nEsta acción borrará las partes diarias de producción de dicho mes.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/v1/reports?year=${year}&month=${month}`);
    uploadStatus.message = res.data.message || `Reporte de ${monthName} ${year} eliminado.`;
    uploadStatus.isSuccess = true;
    dashboardData.value = null;
    selectedMonthKey.value = '';
    await loadAvailableMonths();
  } catch (err) {
    console.error("Error al eliminar reporte:", err);
    uploadStatus.message = err.response?.data?.message || 'Error al eliminar el reporte del mes.';
    uploadStatus.isSuccess = false;
  }
};

const openEditModal = (d) => {
  editForm.id = d.id;
  editForm.reportDate = d.reportDate;
  editForm.dayNumber = d.dayNumber;
  editForm.dpArenasGuardiaA = d.dpArenasGuardiaA || 0;
  editForm.dpArenasGuardiaB = d.dpArenasGuardiaB || 0;
  editForm.dlArenasGuardiaA = d.dlArenasGuardiaA || 0;
  editForm.dlArenasGuardiaB = d.dlArenasGuardiaB || 0;
  showEditModal.value = true;
};

const saveDailyReportEdit = async () => {
  if (!editForm.id) return;
  savingEdit.value = true;
  try {
    await api.put(`/api/v1/reports/daily/${editForm.id}`, {
      dpArenasGuardiaA: editForm.dpArenasGuardiaA || 0,
      dpArenasGuardiaB: editForm.dpArenasGuardiaB || 0,
      dlArenasGuardiaA: editForm.dlArenasGuardiaA || 0,
      dlArenasGuardiaB: editForm.dlArenasGuardiaB || 0
    });

    uploadStatus.message = `Producción del día ${editForm.dayNumber} (${editForm.reportDate}) actualizada correctamente.`;
    uploadStatus.isSuccess = true;
    showEditModal.value = false;

    if (selectedMonthKey.value) {
      const [year, month] = selectedMonthKey.value.split('-');
      await loadDashboardData(year, month);
      if (activeTab.value === 'annual') {
        await loadAnnualSummary(year);
      }
    }
  } catch (err) {
    console.error("Error al actualizar producción del día:", err);
    uploadStatus.message = err.response?.data?.message || 'Error al guardar cambios de producción.';
    uploadStatus.isSuccess = false;
  } finally {
    savingEdit.value = false;
  }
};

// --- LOGICA DE PROCESAMIENTO DE TEXTO PEGADO DESDE EXCEL ---
const parsePastedTextPreview = () => {
  if (!rawPastedText.value || !rawPastedText.value.trim()) {
    parsedPreviewRows.value = [];
    return;
  }

  const lines = rawPastedText.value.split(/\r?\n/);
  const list = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isHeaderLine(trimmed)) continue;

    const tokens = splitLineTokens(trimmed);
    if (tokens.length < 4) continue;

    const dateStr = tokens[0].trim();
    const turno = tokens[1].trim().toUpperCase();
    const dpVal = parsePastedNumber(tokens[2]);
    const dlVal = parsePastedNumber(tokens[3]);

    if (turno === 'A' || turno === 'B') {
      list.push({
        dateStr,
        turno,
        dp: dpVal,
        dl: dlVal
      });
    }
  }

  parsedPreviewRows.value = list;
};

const isHeaderLine = (line) => {
  const upper = line.toUpperCase();
  return upper.includes('DIA') || upper.includes('FECHA') || upper.includes('TURNO') || upper.includes('DP') || upper.includes('DL');
};

const splitLineTokens = (line) => {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return line.split(';');
  return line.split(/\s{2,}/);
};

const parsePastedNumber = (raw) => {
  if (!raw) return 0;
  try {
    let cleaned = String(raw).trim().replace(/\s+/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/,/g, '');
    }
    return parseFloat(cleaned) || 0;
  } catch (e) {
    return 0;
  }
};

const submitPastedReport = async () => {
  if (!rawPastedText.value || !rawPastedText.value.trim()) {
    uploadStatus.message = "Por favor pega primero los datos de producción en el recuadro.";
    uploadStatus.isSuccess = false;
    return;
  }

  isUploading.value = true;
  uploadStatus.message = "";

  try {
    const res = await api.post('/api/v1/reports/import-pasted', {
      rawText: rawPastedText.value
    });

    uploadStatus.message = res.data.message || "Datos pegados procesados exitosamente.";
    uploadStatus.isSuccess = true;

    rawPastedText.value = '';
    parsedPreviewRows.value = [];

    await loadAvailableMonths();
    if (res.data.year && res.data.month) {
      selectedMonthKey.value = `${res.data.year}-${res.data.month}`;
      await loadDashboardData(res.data.year, res.data.month);
    }
    activeTab.value = 'matrix';
  } catch (err) {
    console.error("Error al procesar datos pegados:", err);
    uploadStatus.message = err.response?.data?.message || "Error al procesar y guardar los datos pegados.";
    uploadStatus.isSuccess = false;
  } finally {
    isUploading.value = false;
  }
};

onMounted(() => {
  loadAvailableMonths();
});
</script>

<style scoped>
/* LIGHT ENTERPRISE THEME (Sin Modo Dark) */
.reporte-view {
  min-height: 100vh;
  background-color: #f8fafc;
  color: #0f172a;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding-bottom: 3rem;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-icon-wrap {
  font-size: 2.2rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.75rem;
  border-radius: 14px;
}

.page-header h1 {
  font-size: 1.65rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.3rem 0;
}

.subtitle {
  color: #475569;
  font-size: 0.88rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.month-selector-wrap {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.4rem 0.8rem;
}

.month-select {
  background: transparent;
  border: none;
  color: #0284c7;
  font-weight: 700;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
}

.btn-paste-header {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-weight: 600;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s ease;
}

.btn-paste-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.btn-delete-month {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  font-weight: 600;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-month:hover {
  background: #fee2e2;
}

/* Status Banner */
.status-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.status-banner.success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
}

.status-banner.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}

/* Loading Overlay */
.uploading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 2.5rem 3rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  color: #0f172a;
}

.spinner-large {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin: 0 auto 1.5rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* KPIs Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}

.kpi-card.primary { border-left: 4px solid #2563eb; }
.kpi-card.info { border-left: 4px solid #10b981; }
.kpi-card.warning { border-left: 4px solid #f59e0b; }
.kpi-card.night { border-left: 4px solid #8b5cf6; }
.kpi-card.success-card { border-left: 4px solid #0284c7; background: linear-gradient(135deg, #f0f9ff, #ffffff); }

.kpi-icon {
  font-size: 2rem;
}

.kpi-info {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.kpi-label {
  font-size: 0.78rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0.2rem 0;
}

.kpi-value small {
  font-size: 0.85rem;
  color: #475569;
}

.kpi-sub {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

/* Badges y Barras de Progreso */
.badge-pct {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 800;
}

.pct-success { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.pct-warning { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.pct-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

.progress-track {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.2rem;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.dp-fill { background: #2563eb; }
.dl-fill { background: #10b981; }
.shift-a-fill { background: #f59e0b; }
.shift-b-fill { background: #8b5cf6; }
.tot-fill { background: #0284c7; }

/* Tabs Navigation */
.view-tabs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
  overflow-x: auto;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

.tab-btn.active {
  color: #0284c7;
  background: #e0f2fe;
  font-weight: 700;
  border-bottom: 2px solid #0284c7;
}

/* Card General */
.card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

.card-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header-inner h3 {
  font-size: 1.25rem;
  margin: 0 0 0.3rem 0;
  color: #0f172a;
  font-weight: 700;
}

.table-sub-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.badge-days-count {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}

/* ESTILOS DE LA PESTAÑA PASTE */
.paste-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.paste-instruction-box {
  background: #f8fafc;
  border: 1px dashed #94a3b8;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.instruction-header {
  color: #0284c7;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.instruction-format {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.85rem;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  line-height: 1.5;
}

.textarea-wrap {
  margin-bottom: 1.5rem;
}

.textarea-label {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.paste-textarea {
  width: 100%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  color: #0f172a;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.9rem;
  padding: 1rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}

.paste-textarea:focus {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.preview-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.25rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.preview-header h4 {
  margin: 0 0 0.2rem 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
}

.badge-preview {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
}

.btn-save-paste {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
}

.btn-save-paste:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.preview-table th {
  background: #e2e8f0;
  color: #334155;
  font-weight: 700;
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #cbd5e1;
}

.preview-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
}

.even-row {
  background: #ffffff;
}

.turno-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
}

.day-badge {
  background: #fef3c7;
  color: #d97706;
}

.night-badge {
  background: #f3e8ff;
  color: #7e22ce;
}

.cell-dp { color: #1d4ed8; font-weight: 700; }
.cell-dl { color: #047857; font-weight: 700; }
.cell-tot { color: #d97706; font-weight: 800; }

/* Tabla Matriz */
.table-wrapper-responsive {
  overflow-x: auto;
}

.prod-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.header-group-row th {
  padding: 0.6rem;
  font-weight: 800;
  text-align: center;
  font-size: 0.78rem;
  letter-spacing: 0.5px;
}

.date-hdr { background: #e2e8f0; color: #0f172a; }
.dp-hdr { background: #dbeafe; color: #1e40af; }
.dl-hdr { background: #d1fae5; color: #065f46; }
.tot-hdr { background: #fef3c7; color: #92400e; }
.act-hdr { background: #f1f5f9; color: #475569; }

.header-sub-row th {
  background: #f8fafc;
  color: #475569;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid #cbd5e1;
  font-size: 0.75rem;
  font-weight: 700;
}

.row-daily {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s;
}

.row-daily:hover {
  background: #f0f9ff;
}

.row-empty-warning {
  background: #fff1f2;
}

.cell-num { text-align: center; color: #64748b; }
.cell-date { white-space: nowrap; font-weight: 600; color: #0f172a; }
.empty-badge {
  font-size: 0.7rem;
  background: #fee2e2;
  color: #dc2626;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  margin-left: 0.4rem;
  font-weight: 700;
}

.cell-val { text-align: right; padding: 0.6rem 0.75rem; }
.cell-pct { text-align: center; }
.dp-a, .dp-b { color: #1e40af; }
.dp-tot { color: #1d4ed8; background: #eff6ff; }
.dl-a, .dl-b { color: #065f46; }
.dl-tot { color: #047857; background: #ecfdf5; }
.tot-a { color: #d97706; }
.tot-b { color: #7e22ce; }
.grand-tot { color: #b45309; background: #fef3c7; font-size: 0.9rem; font-weight: 800; }

.cell-act { text-align: center; }
.btn-edit-row {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #2563eb;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-row:hover {
  background: #dbeafe;
  transform: scale(1.1);
}

.summary-foot-row {
  background: #f1f5f9;
  border-top: 2px solid #cbd5e1;
}

.prog-row { background: #f8fafc; }
.pct-summary-row { background: #ffffff; }

.foot-label { text-align: left; padding: 0.75rem 1rem; color: #0f172a; }

/* Modal Edit */
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

.modal-body { padding: 1.5rem; }
.modal-desc { font-size: 0.85rem; color: #64748b; margin: 0 0 1.25rem 0; }

.edit-section-box {
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.edit-section-box.blue { background: #eff6ff; border: 1px solid #bfdbfe; }
.edit-section-box.green { background: #ecfdf5; border: 1px solid #a7f3d0; }

.edit-section-box h4 { margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #0f172a; font-weight: 700; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-label { font-size: 0.78rem; color: #475569; font-weight: 700; }
.form-input {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0284c7;
  padding: 0.5rem 0.75rem;
  font-weight: 700;
  outline: none;
}
.form-input:focus { border-color: #0284c7; }

.sub-total-row {
  margin-top: 0.6rem;
  text-align: right;
  font-size: 0.8rem;
  color: #64748b;
}

.grand-total-summary-card {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.gt-title { font-size: 0.8rem; color: #b45309; font-weight: 800; text-transform: uppercase; }
.gt-value { font-size: 1.4rem; font-weight: 800; color: #78350f; }
.gt-value small { font-size: 0.8rem; color: #92400e; }
.gt-sub { font-size: 0.8rem; color: #78350f; margin-top: 0.3rem; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-cancel { background: #ffffff; border: 1px solid #cbd5e1; color: #64748b; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-save-edit { background: #2563eb; border: none; color: #ffffff; font-weight: 700; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; }
.btn-save-edit:hover { background: #1d4ed8; }
</style>
