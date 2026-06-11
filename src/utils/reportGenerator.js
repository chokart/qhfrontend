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
  const tableColumn = ["ID", "Nombre del Equipo", "Área Actual", "Estado", "Última Actualización", "Comentarios"];
  const tableRows = [];

  equipmentList.forEach(eq => {
    const rowData = [
      eq.id,
      eq.name,
      eq.currentArea || 'Fuera de zona',
      eq.status,
      eq.lastUpdatedBy ? `${eq.lastUpdatedBy}` : 'N/A',
      eq.comment || '-'
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
      fontSize: 9,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10 }, // ID
      1: { cellWidth: 35 }, // Nombre
      2: { cellWidth: 30 }, // Área
      3: { cellWidth: 25 }, // Estado
      4: { cellWidth: 30 }, // Actualizado por
      5: { cellWidth: 'auto' } // Comentarios (ocupa el resto)
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw;
        if (status === 'INOPERATIVO') {
          data.cell.styles.textColor = [239, 68, 68]; // Rojo suave
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'OPERATIVO') {
          data.cell.styles.textColor = [5, 150, 105]; // Verde
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'STAND_BY') {
          data.cell.styles.textColor = [217, 119, 6]; // Ambar/Naranja
          data.cell.styles.fontStyle = 'bold';
        }
      }
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

export const generateCanchasPDF = (canchasNiveles, canchasCapas) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleString();

  // Encabezado
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Reporte de Control de Canchas', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Sistema de Gestión QH Relavera`, 14, 30);
  doc.text(`Fecha de emisión: ${date}`, 14, 35);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, 196, 40);

  // --- TABLA 1: DIQUE PRINCIPAL (NIVELES) ---
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.setFont(undefined, 'bold');
  doc.text('Canchas Dique Principal (Niveles)', 14, 48);

  const colNiveles = ["Cancha", "Altura (m)", "Estado", "Equipo", "Operador", "Comentarios"];
  const rowsNiveles = canchasNiveles.map(c => [
    `#${c.number}`,
    c.currentHeight?.toFixed(2) || '0.00',
    c.status,
    c.assignedEquipment || '-',
    c.operatorName || '-',
    c.comment || '-'
  ]);

  autoTable(doc, {
    startY: 52,
    head: [colNiveles],
    body: rowsNiveles,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], fontSize: 9, halign: 'center' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'OBSERVADA') data.cell.styles.textColor = [239, 68, 68];
        if (data.cell.raw === 'OPERATIVA') data.cell.styles.textColor = [5, 150, 105];
      }
    }
  });

  // --- TABLA 2: DIQUE LATERAL (CAPAS) ---
  let finalY = doc.lastAutoTable.finalY + 15;
  
  // Verificar si cabe en la página actual
  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.setFont(undefined, 'bold');
  doc.text('Canchas Dique Lateral (Capas)', 14, finalY);

  const colCapas = ["Cancha", "Capa", "Estado", "Equipo", "Operador", "Comentarios"];
  const rowsCapas = canchasCapas.map(c => [
    `#${c.number}`,
    `Capa ${c.currentCapa || 0}`,
    c.status,
    c.assignedEquipment || '-',
    c.operatorName || '-',
    c.comment || '-'
  ]);

  autoTable(doc, {
    startY: finalY + 4,
    head: [colCapas],
    body: rowsCapas,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], fontSize: 9, halign: 'center' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'OBSERVADA') data.cell.styles.textColor = [239, 68, 68];
        if (data.cell.raw === 'OPERATIVA') data.cell.styles.textColor = [5, 150, 105];
      }
    }
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(`Reporte_Canchas_${new Date().getTime()}.pdf`);
};

