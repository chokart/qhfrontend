export const STATUS_COLORS = {
  'CICLONEANDO': '#10b981',       // Verde Esmeralda
  'POR_CICLONEAR': '#06b6d4',     // Turquesa / Cian
  'POR_COMPACTAR': '#8b5cf6',     // Violeta / Púrpura
  'COMPACTADO': '#3b82f6',        // Azul
  'POR_PREPARAR_BERMA': '#f97316',// Naranja
  'DRENANDO': '#0284c7',          // Azul Océano
  'STAND_BY': '#eab308',          // Amarillo / Ámbar Dorado
  'OBSERVADA': '#ef4444'          // Rojo Alerta
};

export const getStatusColor = (status) => {
  if (!status) return '#94a3b8';
  return STATUS_COLORS[status] || '#94a3b8';
};

export const formatStatusText = (status) => {
  if (!status) return '';
  return status.replace(/_/g, ' ');
};
