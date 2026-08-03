export const STATUS_COLORS = {
  'CICLONEANDO': '#3b82f6',       // Azul
  'POR_CICLONEAR': '#10b981',     // Verde
  'POR_COMPACTAR': '#f89b43',     // Naranja suave (menor intensidad)
  'COMPACTADO': '#f89b43',        // Naranja suave
  'POR_PREPARAR_BERMA': '#f89b43',// Naranja suave
  'DRENANDO': '#f89b43',          // Naranja suave
  'STAND_BY': '#f89b43',          // Naranja suave
  'OBSERVADA': '#ef4444'          // Rojo
};

export const STATUS_SHORT_CODES = {
  'CICLONEANDO': 'CIC',
  'POR_CICLONEAR': 'P.CIC',
  'POR_COMPACTAR': 'P.COM',
  'COMPACTADO': 'COMP',
  'POR_PREPARAR_BERMA': 'BERM',
  'DRENANDO': 'DREN',
  'STAND_BY': 'STBY',
  'OBSERVADA': 'OBS'
};

export const getStatusColor = (status) => {
  if (!status) return '#f89b43';
  return STATUS_COLORS[status] || '#f89b43';
};

export const formatStatusText = (status) => {
  if (!status) return '';
  return status.replace(/_/g, ' ');
};

export const getStatusShortText = (status) => {
  if (!status) return 'S/E';
  return STATUS_SHORT_CODES[status] || status.replace(/_/g, ' ').slice(0, 4).toUpperCase();
};


