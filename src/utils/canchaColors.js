export const STATUS_COLORS = {
  'CICLONEANDO': '#3b82f6',       // Azul
  'POR_CICLONEAR': '#10b981',     // Verde
  'POR_COMPACTAR': '#f97316',     // Naranja
  'COMPACTADO': '#f97316',        // Naranja
  'POR_PREPARAR_BERMA': '#f97316',// Naranja
  'DRENANDO': '#f97316',          // Naranja
  'STAND_BY': '#f97316',          // Naranja
  'OBSERVADA': '#f97316'          // Naranja
};

export const getStatusColor = (status) => {
  if (!status) return '#f97316';
  return STATUS_COLORS[status] || '#f97316';
};

export const formatStatusText = (status) => {
  if (!status) return '';
  return status.replace(/_/g, ' ');
};

