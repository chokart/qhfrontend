import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateEquipmentPDF = (equipmentList) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleString();

  // Función auxiliar para categorías (consistente con el resto de la app)
  const getCategory = (name) => {
    if (name.startsWith('D8') || name.startsWith('D9') || name.startsWith('D10')) return 'TRACTOR';
    if (name.includes('Exc.')) return 'EXCAVADORA';
    return 'OTROS';
  };

  // Filtrar solo Tractores (excluyendo D10) y Excavadoras
  const filteredList = equipmentList.filter(eq => {
    const cat = getCategory(eq.name);
    const isD10 = eq.name.includes('D10');
    return (cat === 'TRACTOR' || cat === 'EXCAVADORA') && !isD10;
  });

  // Cálculos de resumen (Contando STAND_BY como OPERATIVO para el reporte)
  const isOperational = (status) => status === 'OPERATIVO' || status === 'STAND_BY';

  const totalTractors = filteredList.filter(eq => getCategory(eq.name) === 'TRACTOR').length;
  const opTractors = filteredList.filter(eq => getCategory(eq.name) === 'TRACTOR' && isOperational(eq.status)).length;
  
  const totalExcavators = filteredList.filter(eq => getCategory(eq.name) === 'EXCAVADORA').length;
  const opExcavators = filteredList.filter(eq => getCategory(eq.name) === 'EXCAVADORA' && isOperational(eq.status)).length;

  // Encabezado
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Reporte de Estado de Equipos Críticos', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`QH Relavera - Resumen de Tractores y Excavadoras`, 14, 30);
  doc.text(`Fecha de emisión: ${date}`, 14, 35);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 40, 196, 40);

  // --- SECCIÓN DE TARJETAS DE RESUMEN ---
  // Tarjeta Tractores
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.rect(14, 45, 88, 25); // x, y, width, height
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(99, 102, 241);
  doc.text('TRACTORES', 18, 52);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Total: ${totalTractors}`, 18, 59);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(5, 150, 105); // Verde
  doc.text(`Operativos: ${opTractors}`, 18, 65);

  // Tarjeta Excavadoras
  doc.setDrawColor(245, 158, 11); // Ambar
  doc.rect(108, 45, 88, 25);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('EXCAVADORAS', 112, 52);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Total: ${totalExcavators}`, 112, 59);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`Operativos: ${opExcavators}`, 112, 65);

  // Generación de la Tabla (Ordenar colocalndo INOPERATIVO primero)
  const statusPriority = { 'INOPERATIVO': 1, 'STAND_BY': 2, 'OPERATIVO': 3 };
  const sortedList = [...filteredList].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 4;
    const priorityB = statusPriority[b.status] || 4;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });
  });

  const tableColumn = ["ID", "Equipo", "Categoría", "Área Actual", "Estado", "Comentarios"];
  const tableRows = [];

  sortedList.forEach(eq => {
    const rowData = [
      eq.id,
      eq.name,
      getCategory(eq.name),
      eq.currentArea || 'Fuera de zona',
      eq.status,
      eq.comment || '-'
    ];
    tableRows.push(rowData);
  });

  autoTable(doc, {
    startY: 78,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      fontSize: 9,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 'auto' }
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        const status = data.cell.raw;
        if (status === 'INOPERATIVO') data.cell.styles.textColor = [220, 38, 38];
        else if (status === 'OPERATIVO') data.cell.styles.textColor = [5, 150, 105];
        else if (status === 'STAND_BY') data.cell.styles.textColor = [217, 119, 6];
        data.cell.styles.fontStyle = 'bold';
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
        const status = data.cell.raw;
        if (status === 'CICLONEANDO') {
          data.cell.styles.textColor = [59, 130, 246]; // Azul
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'POR_CICLONEAR') {
          data.cell.styles.textColor = [16, 185, 129]; // Verde
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [249, 115, 22]; // Naranja
          data.cell.styles.fontStyle = 'bold';
        }
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
        const status = data.cell.raw;
        if (status === 'CICLONEANDO') {
          data.cell.styles.textColor = [59, 130, 246]; // Azul
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'POR_CICLONEAR') {
          data.cell.styles.textColor = [16, 185, 129]; // Verde
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [249, 115, 22]; // Naranja
          data.cell.styles.fontStyle = 'bold';
        }
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

