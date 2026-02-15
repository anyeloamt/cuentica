import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { BudgetItem } from '../types';

import { formatAmount } from './format';

export function generatePdf(walletName: string, items: BudgetItem[]): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(walletName, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString();
  doc.text(dateStr, pageWidth - 14, 20, { align: 'right' });

  const validItems = items.filter((item) => item.name.trim() !== '' || item.amount !== 0);

  let totalIncome = 0;
  let totalExpenses = 0;

  const tableRows: [number, string, string, string][] = validItems.map((item, index) => {
    if (item.type === '+') totalIncome += item.amount;
    else totalExpenses += item.amount;

    return [index + 1, item.name, item.type, formatAmount(item.amount)];
  });

  const balance = totalIncome - totalExpenses;

  autoTable(doc, {
    startY: 30,
    head: [['#', 'Name', 'Type', 'Amount']],
    body: tableRows,
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const rowData = data.row.raw as [number, string, string, string];
        const type = rowData[2];
        if (type === '+') {
          data.cell.styles.textColor = [0, 128, 0];
        } else {
          data.cell.styles.textColor = [200, 0, 0];
        }
      }
    },
    foot: [
      ['', '', 'Income', formatAmount(totalIncome)],
      ['', '', 'Expenses', formatAmount(totalExpenses)],
      ['', '', 'Balance', formatAmount(balance)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  return doc.output('blob');
}
