import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';

const loadLogoAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
        } else resolve(null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const PLATFORM_NAME = process.env.REACT_APP_PROJECT_NAME || 'URG-X';
const BRAND_COLOR = [243, 187, 43];
const TABLE_HEADER_BG = [55, 65, 81];
const TABLE_ALT_ROW = [248, 249, 250];
const BORDER_COLOR = [220, 223, 230];
const TEXT_MUTED = [107, 114, 128];

const flattenToWalletRows = (transactions) => {
  return (transactions || []).map((t, i) => ({
    srNo: i + 1,
    date: t.createdAt || t.updatedAt,
    transactionType: t.transaction_type || '—',
    currency: t.short_name || '—',
    chain: t.chain || '—',
    amount: t.amount ?? '—',
    txHash: t.transaction_hash || '—',
    status: t.status || '—'
  }));
};

export const generateWalletPDF = async (transactions, fromDate, toDate, userInfo = {}, typeFilter = 'all') => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;

  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 3, 'F');

  let startY = margin + 4;
  const LOGO_MAX_HEIGHT = 12;
  const LOGO_MAX_WIDTH = 36;
  let logoData = await loadLogoAsBase64(`${window.location.origin}/images/favicon_light.svg`);
  if (!logoData) logoData = await loadLogoAsBase64(`${window.location.origin}/logo192.png`);
  if (!logoData) logoData = await loadLogoAsBase64(`${window.location.origin}/images/logo.png`);
  if (logoData) {
    try {
      const { dataUrl, width: imgW, height: imgH } = logoData;
      const aspectRatio = imgH > 0 ? imgW / imgH : 1;
      let logoW = LOGO_MAX_WIDTH;
      let logoH = logoW / aspectRatio;
      if (logoH > LOGO_MAX_HEIGHT) {
        logoH = LOGO_MAX_HEIGHT;
        logoW = logoH * aspectRatio;
      }
      doc.addImage(dataUrl, 'PNG', margin, startY, logoW, logoH);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...BRAND_COLOR);
      doc.text(PLATFORM_NAME.toUpperCase(), margin + logoW + 6, startY + logoH / 2 + 1.5);
      doc.setFont(undefined, 'normal');
    } catch {
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...BRAND_COLOR);
      doc.text(PLATFORM_NAME.toUpperCase(), margin, startY + 7.5);
      doc.setFont(undefined, 'normal');
    }
  } else {
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...BRAND_COLOR);
    doc.text(PLATFORM_NAME.toUpperCase(), margin, startY + 7.5);
    doc.setFont(undefined, 'normal');
  }
  startY += 18;

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Deposit/Withdrawal History Report', margin, startY);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(margin, startY + 2, margin + 100, startY + 2);
  startY += 12;

  const name = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ').toUpperCase() || '—';
  const userId = userInfo.uuid || userInfo.userId || '—';
  const email = userInfo.emailId || '—';
  const period = `${moment(fromDate).format('YYYY-MM-DD')} to ${moment(toDate).format('YYYY-MM-DD')} (UTC+0)`;
  const typeLabel = typeFilter === 'deposit' ? 'Deposit' : typeFilter === 'withdrawal' ? 'Withdrawal' : 'All';

  const infoBoxWidth = pageWidth - margin * 2 - 4;
  const boxHeight = 28;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, startY - 2, infoBoxWidth, boxHeight, 2, 2, 'FD');

  const labelWidth = 22;
  const leftColX = margin + 10;
  const rightColX = margin + 85;
  const rowH = 6.5;
  const contentTop = startY + 6;

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Name:', leftColX, contentTop);
  doc.text('User ID:', leftColX, contentTop + rowH);
  doc.text('Email:', leftColX, contentTop + rowH * 2);
  doc.text('Period:', rightColX, contentTop);
  doc.text('Type:', rightColX, contentTop + rowH);

  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(name, leftColX + labelWidth, contentTop);
  doc.text(userId, leftColX + labelWidth, contentTop + rowH);
  doc.text(email, leftColX + labelWidth, contentTop + rowH * 2);
  doc.text(period, rightColX + labelWidth, contentTop);
  doc.text(typeLabel, rightColX + labelWidth, contentTop + rowH);
  doc.setFont(undefined, 'normal');

  const tableStartY = startY + boxHeight + 8;

  const rows = flattenToWalletRows(transactions);
  const headers = ['Sr No', 'Date (UTC)', 'Transaction Type', 'Currency', 'Chain', 'Amount', 'Tx Hash', 'Status'];
  const body = rows.map((r) => [
    String(r.srNo),
    r.date ? moment(r.date).utc().format('YYYY-MM-DD HH:mm:ss') : '—',
    r.transactionType,
    r.currency,
    r.chain,
    String(r.amount),
    r.txHash,
    r.status
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [headers],
    body: body.length ? body : [['No transaction data for the selected period', '', '', '', '', '', '', '']],
    theme: 'striped',
    headStyles: {
      fillColor: TABLE_HEADER_BG,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 }
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
    },
    alternateRowStyles: { fillColor: TABLE_ALT_ROW },
    margin: { left: margin, right: margin },
    tableLineWidth: 0.2,
    tableLineColor: BORDER_COLOR,
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(`Page ${data.pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      doc.text(`Generated ${moment().format('YYYY-MM-DD HH:mm')}`, margin, pageHeight - 8);
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    }
  });

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Deposit_Withdrawal_History_${moment(fromDate).format('YYYY-MM-DD')}_${moment(toDate).format('YYYY-MM-DD')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const generateWalletExcel = (transactions, fromDate, toDate) => {
  const rows = flattenToWalletRows(transactions);
  const headers = ['Sr No', 'Date (UTC)', 'Transaction Type', 'Currency', 'Chain', 'Amount', 'Tx Hash', 'Status'];
  const data = [
    headers,
    ...rows.map((r) => [
      r.srNo,
      r.date ? moment(r.date).utc().format('YYYY-MM-DD HH:mm:ss') : '—',
      r.transactionType,
      r.currency,
      r.chain,
      r.amount,
      r.txHash,
      r.status
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Deposit Withdrawal');
  XLSX.writeFile(wb, `Deposit_Withdrawal_History_${moment(fromDate).format('YYYY-MM-DD')}_${moment(toDate).format('YYYY-MM-DD')}.xlsx`);
};
