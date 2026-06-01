import { format } from "date-fns";

const LOGO_URL = "/logo.webp";

const safeDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
};

const fmt = (value, pattern = "dd MMM yyyy") => {
  const date = safeDate(value);
  return date && !Number.isNaN(date.getTime()) ? format(date, pattern) : "-";
};

const fmtCurrency = (amount, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const countNights = (checkIn, checkOut) => {
  const start = safeDate(checkIn);
  const end = safeDate(checkOut);
  if (!start || !end) return 1;
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
};

export const generateReceiptHTML = (booking, room, settings = {}) => {
  const nights = booking.nights || countNights(booking.checkIn, booking.checkOut);
  const perNight =
    booking.occupancy === "double"
      ? room?.doublePrice || booking.ratePerNight || 0
      : room?.singlePrice || booking.ratePerNight || 0;
  const subtotal = booking.subtotal || perNight * nights;
  const gstPct = booking.gstPercentage || settings?.hotelInfo?.gstPercentage || 18;
  const gstAmount = booking.gstAmount ?? Math.round((subtotal * gstPct) / 100);
  const total = booking.totalAmount || subtotal + gstAmount;
  const currency = settings?.hotelInfo?.currency || "INR";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice #${booking.id || ""} | Bael Tree Hotels</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #f4f1eb;
      color: #1a1a1a;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    .print-bar {
      width: min(720px, 100%);
      margin: 0 auto 14px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .print-bar button {
      border: 1px solid #c9a84c;
      border-radius: 999px;
      padding: 9px 14px;
      background: #fff;
      cursor: pointer;
      font-weight: 700;
    }
    .print-bar button:last-child {
      background: #c9a84c;
      color: #1a1a1a;
    }
    #invoice-print-area {
      width: min(720px, 100%);
      margin: 0 auto;
      background: #fff;
      border: 1px solid rgba(201, 168, 76, 0.45);
      box-shadow: 0 16px 48px rgba(0,0,0,0.12);
      padding: 24px;
    }
    .invoice-header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 14px;
      align-items: center;
      border-bottom: 2px solid #c9a84c;
      padding-bottom: 14px;
    }
    .invoice-logo {
      width: 54px;
      height: 54px;
      object-fit: contain;
    }
    h1, h2, h3, p { margin: 0; }
    h1 {
      font-family: Georgia, serif;
      font-size: 24px;
      letter-spacing: 0.08em;
      color: #7b1a1a;
    }
    .invoice-title {
      text-align: center;
      padding: 14px 0;
      border-bottom: 1px solid rgba(201,168,76,0.35);
    }
    .invoice-title h2 {
      font-family: Georgia, serif;
      font-size: 18px;
      letter-spacing: 0.12em;
      color: #1a1a1a;
    }
    .grid-two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid rgba(201,168,76,0.35);
    }
    .box {
      border: 1px solid rgba(201,168,76,0.28);
      padding: 12px;
      min-height: 132px;
    }
    .box h3 {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #7b1a1a;
      margin-bottom: 8px;
    }
    .line {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 4px 0;
      border-bottom: 1px dashed rgba(0,0,0,0.08);
    }
    .line span:first-child { color: #6b6055; }
    .payment {
      padding: 14px 0;
      border-bottom: 1px solid rgba(201,168,76,0.35);
    }
    .payment h3 {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #7b1a1a;
      margin-bottom: 8px;
    }
    .total {
      margin-top: 8px;
      padding: 10px 12px;
      background: #1a1a1a;
      color: #e8d5a3;
      font-size: 16px;
      font-weight: 700;
    }
    .invoice-footer {
      padding-top: 14px;
      text-align: center;
      color: #6b6055;
    }
    @media print {
      @page { size: A4; margin: 0; }
      body * { visibility: hidden; }
      #invoice-print-area, #invoice-print-area * { visibility: visible; }
      #invoice-print-area {
        position: fixed;
        top: 0;
        left: 0;
        width: 210mm;
        min-height: auto;
        max-height: 297mm;
        padding: 16mm 18mm;
        box-shadow: none;
        border: 0;
        font-size: 11px;
        page-break-inside: avoid;
      }
      .print-bar { display: none; }
      .box { min-height: 108px; }
      h1 { font-size: 20px; }
      .invoice-title h2 { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button onclick="window.close()">Close</button>
    <button onclick="window.print()">Print Invoice</button>
  </div>

  <main id="invoice-print-area">
    <header class="invoice-header">
      <img class="invoice-logo" src="${LOGO_URL}" alt="Bael Tree Hotels" />
      <div>
        <h1>BAEL TREE HOTELS</h1>
        <p>Madhapur, Hyderabad</p>
        <p>${settings?.hotelInfo?.hotelPhone || "+91-9642325555"}</p>
      </div>
      <div>
        <strong>${fmt(new Date())}</strong>
        <p>Status: ${(booking.status || "confirmed").toUpperCase()}</p>
      </div>
    </header>

    <section class="invoice-title">
      <h2>BOOKING CONFIRMATION</h2>
      <p>Booking ID: #${booking.id || "-"}</p>
    </section>

    <section class="grid-two">
      <div class="box">
        <h3>Guest Details</h3>
        <div class="line"><span>Name</span><strong>${booking.userName || "-"}</strong></div>
        <div class="line"><span>Email</span><strong>${booking.userEmail || "-"}</strong></div>
        <div class="line"><span>Phone</span><strong>${booking.userPhone || "-"}</strong></div>
      </div>
      <div class="box">
        <h3>Stay Details</h3>
        <div class="line"><span>Check-in</span><strong>${fmt(booking.checkIn)}</strong></div>
        <div class="line"><span>Check-out</span><strong>${fmt(booking.checkOut)}</strong></div>
        <div class="line"><span>Nights</span><strong>${nights}</strong></div>
        <div class="line"><span>Room</span><strong>${room?.name || booking.roomName || booking.roomCategory || "-"}</strong></div>
        <div class="line"><span>Occupancy</span><strong>${booking.occupancy || "single"}</strong></div>
        <div class="line"><span>Guests</span><strong>${booking.guests || 1}</strong></div>
      </div>
    </section>

    <section class="payment">
      <h3>Payment Summary</h3>
      <div class="line"><span>Room Rate/night</span><strong>${fmtCurrency(perNight, currency)}</strong></div>
      <div class="line"><span>Number of nights</span><strong>${nights}</strong></div>
      <div class="line"><span>Subtotal</span><strong>${fmtCurrency(subtotal, currency)}</strong></div>
      <div class="line"><span>GST (${gstPct}%)</span><strong>${fmtCurrency(gstAmount, currency)}</strong></div>
      <div class="line total"><span>TOTAL PAID</span><strong>${fmtCurrency(total, currency)}</strong></div>
      <div class="line"><span>Payment ID</span><strong>${booking.paymentId || "-"}</strong></div>
      <div class="line"><span>Order ID</span><strong>${booking.orderId || "-"}</strong></div>
      <div class="line"><span>Payment Date</span><strong>${fmt(booking.createdAt || new Date(), "dd MMM yyyy, hh:mm a")}</strong></div>
    </section>

    <footer class="invoice-footer">
      <strong>Thank you for choosing Bael Tree Hotels</strong>
      <p>www.baeltreehotels.com</p>
    </footer>
  </main>
</body>
</html>`;
};

export const openInvoiceWindow = (booking, room, settings = {}) => {
  if (!booking) return;
  const html = generateReceiptHTML(booking, room, settings);
  const win = window.open("", "_blank", "width=820,height=900,scrollbars=yes");
  if (!win) {
    alert("Please allow pop-ups to view your receipt.");
    return;
  }
  win.document.write(html);
  win.document.close();
};

export default openInvoiceWindow;
