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

const nineDecimalFormat = (data) => {
  if (typeof data === 'number' && !isNaN(data)) {
    return parseFloat(data.toFixed(9));
  }
  return data ?? 0;
};

/**
 * Flatten Orderbook records into trade rows (one row per executed fill)
 */
const flattenToTradeRows = (orders) => {
  const rows = [];
  for (const ord of orders || []) {
    const baseAsset = ord.ask_currency || '—';
    const quoteAsset = ord.pay_currency || '—';
    const pair = ord.side === 'BUY'
      ? `${baseAsset}/${quoteAsset}`
      : `${quoteAsset}/${baseAsset}`;

    if (ord.executed_prices?.length > 0) {
      for (const ex of ord.executed_prices) {
        const price = ex.price ?? ord.avg_execution_price ?? ord.price;
        const qty = ex.quantity ?? 0;
        const total = price * qty;
        const fee = ex.fee ?? 0;
        rows.push({
          date: ord.updatedAt || ord.createdAt,
          pair,
          baseAsset,
          quoteAsset,
          type: ord.side,
        price: nineDecimalFormat(price),
        amount: nineDecimalFormat(qty),
        total: nineDecimalFormat(total),
        fee: nineDecimalFormat(fee),
        feeCoin: baseAsset
      });
      }
    } else if (ord.status === 'FILLED' || ord.status === 'PARTIALLY EXECUTED') {
      const price = ord.avg_execution_price ?? ord.price;
      const qty = ord.filled ?? ord.quantity ?? 0;
      const total = price * qty;
      rows.push({
        date: ord.updatedAt || ord.createdAt,
        pair,
        baseAsset,
        quoteAsset,
        type: ord.side,
        price: nineDecimalFormat(price),
        amount: nineDecimalFormat(qty),
        total: nineDecimalFormat(total),
        fee: nineDecimalFormat(ord.total_fee ?? 0),
        feeCoin: baseAsset
      });
    }
  }
  return rows.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
};

const PLATFORM_NAME = process.env.REACT_APP_PROJECT_NAME || 'URG-X';
const BRAND_COLOR = [243, 187, 43];
const TABLE_HEADER_BG = [55, 65, 81];
const TABLE_ALT_ROW = [248, 249, 250];
const BORDER_COLOR = [220, 223, 230];
const TEXT_MUTED = [107, 114, 128];

export const generatePDF = async (orders, fromDate, toDate, userInfo = {}) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;

  // --- Accent bar (top) ---
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // --- Header: Logo + Brand ---
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

  // --- Report Title with divider ---
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Spot Trade History Report', margin, startY);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(margin, startY + 2, margin + 80, startY + 2);
  startY += 12;

  // --- User Info + Comments (unified block, same height) ---
  const name = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ').toUpperCase() || '—';
  const userId = userInfo.uuid || userInfo.userId || '—';
  const email = userInfo.emailId || '—';
  const period = `${moment(fromDate).format('YYYY-MM-DD')} to ${moment(toDate).format('YYYY-MM-DD')} (UTC+0)`;

  const commentsBoxWidth = 62;
  const infoBoxWidth = pageWidth - margin * 2 - commentsBoxWidth - 4;
  const boxGap = 4;

  // Pre-calculate comments height to determine unified box height
  const comment1 = "¹ A buy order means debiting quote asset from clients' spot wallet and crediting base asset to clients' spot wallet, while a sell order means debiting base asset from clients' spot wallet and crediting quote asset to clients' spot wallet.";
  const split1 = doc.splitTextToSize(comment1, commentsBoxWidth - 12);
  const comment2 = '² Amount of quote asset transacted.';
  const split2 = doc.splitTextToSize(comment2, commentsBoxWidth - 12);
  const commentsContentHeight = 6 + split1.length * 3.2 + 2 + split2.length * 3.2 + 6;
  const userInfoMinHeight = 26;
  const unifiedBoxHeight = Math.max(userInfoMinHeight, commentsContentHeight);

  const boxTop = startY - 2;

  // Draw both boxes with same height - Info box (left)
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, boxTop, infoBoxWidth, unifiedBoxHeight, 2, 2, 'FD');

  // Comments box (right) - same height
  const commentsX = margin + infoBoxWidth + boxGap;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(commentsX, boxTop, commentsBoxWidth, unifiedBoxHeight, 2, 2, 'FD');

  // User info - aligned with fixed label width
  const labelWidth = 22;
  const leftColX = margin + 10;
  const rightColX = margin + 10 + 85;
  const rowH = 6.5;
  const contentTop = boxTop + 8;

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Name:', leftColX, contentTop);
  doc.text('User ID:', leftColX, contentTop + rowH);
  doc.text('Email:', leftColX, contentTop + rowH * 2);
  doc.text('Period:', rightColX, contentTop + rowH);

  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(name, leftColX + labelWidth, contentTop);
  doc.text(userId, leftColX + labelWidth, contentTop + rowH);
  doc.text(email, leftColX + labelWidth, contentTop + rowH * 2);
  doc.text(period, rightColX + labelWidth, contentTop + rowH);
  doc.setFont(undefined, 'normal');

  // Comments content - vertically centered in box
  const commentsTextTop = boxTop + 6;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Comments', commentsX + 4, commentsTextTop);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(split1, commentsX + 4, commentsTextTop + 5);
  doc.text(split2, commentsX + 4, commentsTextTop + 5 + split1.length * 3.2 + 1);

  const tableStartY = boxTop + unifiedBoxHeight + 8;

  // --- Table (professional styling) ---
  const rows = flattenToTradeRows(orders);
  const headers = ['Date (UTC)', 'Pair', 'Base Asset', 'Quote Asset', 'Type ¹', 'Price', 'Amount', 'Total ²', 'Fee', 'Fee Coin'];
  const body = rows.map((r) => [
    r.date ? moment(r.date).utc().format('YYYY-MM-DD HH:mm:ss') : '—',
    r.pair || '—',
    r.baseAsset || '—',
    r.quoteAsset || '—',
    r.type || '—',
    String(r.price ?? '—'),
    String(r.amount ?? '—'),
    String(r.total ?? '—'),
    String(r.fee ?? '—'),
    r.feeCoin || '—'
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [headers],
    body: body.length ? body : [['No trade data for the selected period', '', '', '', '', '', '', '', '', '']],
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
  a.download = `Spot_Trade_History_${moment(fromDate).format('YYYY-MM-DD')}_${moment(toDate).format('YYYY-MM-DD')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const generateExcel = (orders, fromDate, toDate) => {
  const rows = flattenToTradeRows(orders);
  const headers = ['Date(UTC)', 'Pair', 'Base Asset', 'Quote Asset', 'Type', 'Price', 'Amount', 'Total', 'Fee', 'Fee Coin'];
  const data = [
    headers,
    ...rows.map((r) => [
      r.date ? moment(r.date).utc().format('YYYY-MM-DD HH:mm:ss') : '—',
      r.pair || '—',
      r.baseAsset || '—',
      r.quoteAsset || '—',
      r.type || '—',
      r.price ?? '—',
      r.amount ?? '—',
      r.total ?? '—',
      r.fee ?? '—',
      r.feeCoin || '—'
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Trade History');
  XLSX.writeFile(wb, `Spot_Trade_History_${moment(fromDate).format('YYYY-MM-DD')}_${moment(toDate).format('YYYY-MM-DD')}.xlsx`);
};
