import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateEquipmentPDF = (equipmentList) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleString();

  // ... (encabezado igual)
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Reporte de Estado de Equipos', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Sistema de Ubicación de Equipos - QH Relavera`, 14, 30);
  doc.text(`Fecha de emisión: ${date}`, 14, 35);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, 196, 40);

  // Generación de la Tabla
  const tableColumn = ["ID", "Nombre del Equipo", "Área Actual", "Estado", "Última Actualización"];
  const tableRows = [];

  equipmentList.forEach(eq => {
    const rowData = [
      eq.id,
      eq.name,
      eq.currentArea || 'Fuera de zona',
      eq.status,
      eq.lastUpdatedBy ? `${eq.lastUpdatedBy}` : 'N/A'
    ];
    tableRows.push(rowData);
  });

  // USAR LA FUNCIÓN autoTable DIRECTAMENTE
  autoTable(doc, {
    startY: 45,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      fontSize: 10,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 45 },
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(`Reporte_Equipos_${new Date().getTime()}.pdf`);
};
