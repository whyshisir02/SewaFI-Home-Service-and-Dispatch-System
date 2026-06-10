const PDF_PAGE_WIDTH = 595;
const PDF_PAGE_HEIGHT = 842;

const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ');

const buildTextLine = ({ x, y, size = 12, text }) =>
  `BT /F1 ${size} Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`;

const formatMoney = (value, currency = 'NPR') => {
  const amount = Number(value ?? 0);
  return `${currency} ${amount.toFixed(2)}`;
};

const buildReceiptPdf = (receipt, options = {}) => {
  const audience = String(options?.audience || 'customer').toLowerCase();
  const isAdmin = audience === 'admin';
  const lines = [
    { x: 50, y: 790, size: 22, text: 'SewaFi Payment Receipt' },
    { x: 50, y: 765, size: 11, text: `Receipt No: ${receipt.receiptNumber}` },
    {
      x: 50,
      y: 748,
      size: 11,
      text: `Generated: ${new Date(receipt.createdAt).toLocaleString('en-US', { hour12: true })}`,
    },
    { x: 50, y: 715, size: 13, text: 'Booking Snapshot' },
    { x: 50, y: 695, text: `Booking Code: ${receipt.bookingCode || 'N/A'}` },
    { x: 50, y: 678, text: `Service: ${receipt.serviceName || 'Service'}` },
    { x: 50, y: 661, text: `Customer: ${receipt.customer?.name || 'N/A'}` },
    { x: 50, y: 644, text: `Provider: ${receipt.provider?.name || 'Not assigned'}` },
    {
      x: 50,
      y: 627,
      text: `Completed Payment At: ${receipt.paymentCompletedAt ? new Date(receipt.paymentCompletedAt).toLocaleString('en-US', { hour12: true }) : 'N/A'}`,
    },
    { x: 50, y: 594, size: 13, text: 'Amount Breakdown' },
    { x: 50, y: 574, text: `Service Amount: ${formatMoney(receipt.grossAmount, receipt.currency)}` },
    { x: 50, y: 557, text: `Total Paid: ${formatMoney(receipt.finalAmount, receipt.currency)}` },
    ...(isAdmin
      ? [
          { x: 50, y: 540, text: `Platform Commission: ${formatMoney(receipt.platformFeeAmount, receipt.currency)}` },
          { x: 50, y: 523, text: `Provider Earning: ${formatMoney(receipt.providerEarningAmount, receipt.currency)}` },
        ]
      : []),
    { x: 50, y: isAdmin ? 506 : 540, text: `Payment Method: ${receipt.paymentMethod || 'CASH'}` },
    { x: 50, y: isAdmin ? 489 : 523, text: `Payment Status: ${receipt.paymentStatus || 'PAID'}` },
    { x: 50, y: isAdmin ? 472 : 506, text: `Currency: ${receipt.currency || 'NPR'}` },
    {
      x: 50,
      y: isAdmin ? 438 : 455,
      size: 11,
      text: 'This receipt confirms a completed manual payment recorded inside SewaFi.',
    },
    {
      x: 50,
      y: isAdmin ? 421 : 438,
      size: 11,
      text: 'Keep this receipt for your service history and support reference.',
    },
  ];

  const stream = lines.map(buildTextLine).join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj`,
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

module.exports = {
  buildReceiptPdf,
};
