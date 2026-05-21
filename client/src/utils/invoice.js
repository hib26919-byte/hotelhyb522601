import { format } from "date-fns";

/* ── Logo — served from public/logo.webp ── */
const LOGO_URL = "/logo.webp";

/* ── Date helpers ── */
const safeDate = (val) => {
  if (!val) return null;
  if (val?.toDate) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

const fmt = (val, pattern = "dd MMM yyyy") => {
  const d = safeDate(val);
  return d && !isNaN(d) ? format(d, pattern) : "—";
};

const fmtCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const countNights = (checkIn, checkOut) => {
  const a = safeDate(checkIn);
  const b = safeDate(checkOut);
  if (!a || !b) return 1;
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
};

/* ── Generate receipt HTML ── */
export const generateReceiptHTML = (booking, room, settings = {}) => {
  const nights = countNights(booking.checkIn, booking.checkOut);
  const perNight =
    booking.occupancy === "double"
      ? room?.doublePrice || 0
      : room?.singlePrice || 0;
  const subtotal = perNight * nights;
  const gstPct = settings?.hotelInfo?.gstPercentage || 12;
  const gstAmount = Math.round((subtotal * gstPct) / 100);
  const grandTotal = subtotal + gstAmount;
  const receiptDate = fmt(new Date(), "dd MMM yyyy, hh:mm a");
  const checkInTime = settings?.hotelInfo?.checkInTime || "2:00 PM";
  const checkOutTime = settings?.hotelInfo?.checkOutTime || "11:00 AM";

  const statusColor = {
    confirmed: "#1f7c2d",
    pending: "#7e6200",
    cancelled: "#aa2c2c",
    completed: "#214ba2",
  }[booking.status] || "#1a1a1a";

  const statusBg = {
    confirmed: "#e8f5e9",
    pending: "#fff8e1",
    cancelled: "#ffebee",
    completed: "#e3f2fd",
  }[booking.status] || "#f5f5f5";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt #${booking.id?.slice(0, 8).toUpperCase()} · Bael Tree Hotels</title>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --gold: #c9a84c;
      --crimson: #7b1a1a;
      --primary: #1a1a1a;
      --warm: #faf8f5;
      --muted: #6b6055;
    }

    body {
      font-family: 'Lato', sans-serif;
      background: #f4f1eb;
      color: var(--primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }

    .receipt {
      width: 100%;
      max-width: 680px;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 80px rgba(0,0,0,0.16);
      border: 1px solid rgba(201,168,76,0.2);
    }

    /* ── Header ── */
    .receipt__header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2c0a0a 60%, #1a1a1a 100%);
      padding: 2.5rem 2.5rem 2rem;
      position: relative;
      overflow: hidden;
    }

    .receipt__header::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 80% 20%, rgba(201,168,76,0.12), transparent 50%);
    }

    .receipt__header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      position: relative;
    }

    .receipt__logo-block {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .receipt__logo-img {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      object-fit: contain;
      background: rgba(255,255,255,0.06);
    }

    .receipt__hotel-name {
      font-family: 'Cinzel', serif;
      font-size: 1.35rem;
      color: #e8d5a3;
      letter-spacing: 0.04em;
    }

    .receipt__hotel-tagline {
      font-family: 'Cormorant Garamond', serif;
      font-size: 0.9rem;
      color: rgba(232,213,163,0.65);
      margin-top: 3px;
      letter-spacing: 0.06em;
    }

    .receipt__badge {
      text-align: right;
    }

    .receipt__invoice-label {
      font-family: 'Cinzel', serif;
      font-size: 0.68rem;
      color: rgba(201,168,76,0.7);
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }

    .receipt__invoice-num {
      font-family: 'Cinzel', serif;
      font-size: 1.3rem;
      color: #c9a84c;
      letter-spacing: 0.06em;
      margin-top: 3px;
    }

    .receipt__divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent);
      margin: 1.5rem 0;
      position: relative;
    }

    .receipt__meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }

    .receipt__meta-date {
      font-size: 0.78rem;
      color: rgba(232,213,163,0.55);
    }

    .receipt__status {
      display: inline-block;
      padding: 0.3rem 0.9rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: ${statusBg};
      color: ${statusColor};
    }

    /* ── Guest section ── */
    .receipt__guest {
      padding: 1.75rem 2.5rem;
      background: linear-gradient(135deg, #fffdf9, #faf8f5);
      border-bottom: 1px solid rgba(201,168,76,0.15);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .receipt__info-group label {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
      font-family: 'Cinzel', serif;
      display: block;
      margin-bottom: 4px;
    }

    .receipt__info-group strong {
      font-size: 0.95rem;
      color: var(--primary);
      font-weight: 700;
    }

    .receipt__info-group p {
      font-size: 0.85rem;
      color: #5a5a5a;
      margin-top: 2px;
    }

    /* ── Stay dates ── */
    .receipt__dates {
      padding: 1.75rem 2.5rem;
      border-bottom: 1px solid rgba(201,168,76,0.15);
    }

    .receipt__section-title {
      font-family: 'Cinzel', serif;
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--crimson);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .receipt__section-title::before {
      content: '';
      width: 24px;
      height: 1px;
      background: var(--gold);
    }

    .receipt__dates-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1rem;
      align-items: center;
    }

    .receipt__date-card {
      padding: 1rem 1.25rem;
      border-radius: 16px;
      border: 1px solid rgba(201,168,76,0.2);
      background: #fff;
    }

    .receipt__date-card label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      font-family: 'Cinzel', serif;
      display: block;
    }

    .receipt__date-card strong {
      display: block;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.2rem;
      color: var(--primary);
      margin-top: 4px;
    }

    .receipt__date-card small {
      display: block;
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 2px;
    }

    .receipt__nights-badge {
      text-align: center;
    }

    .receipt__nights-badge span {
      display: block;
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      color: var(--gold);
      font-weight: 700;
    }

    .receipt__nights-badge small {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
    }

    /* ── Room details ── */
    .receipt__room {
      padding: 1.75rem 2.5rem;
      border-bottom: 1px solid rgba(201,168,76,0.15);
    }

    .receipt__room-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(26,26,26,0.96), rgba(123,26,26,0.9));
      color: #faf8f5;
    }

    .receipt__room-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      background: rgba(201,168,76,0.15);
      border: 1px solid rgba(201,168,76,0.25);
      object-fit: cover;
      flex-shrink: 0;
    }

    .receipt__room-name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.3rem;
      color: #e8d5a3;
    }

    .receipt__room-meta {
      font-size: 0.8rem;
      color: rgba(250,248,245,0.65);
      margin-top: 4px;
    }

    .receipt__room-id {
      margin-left: auto;
      text-align: right;
    }

    .receipt__room-id label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(201,168,76,0.65);
      font-family: 'Cinzel', serif;
    }

    .receipt__room-id code {
      display: block;
      font-family: 'Lato', monospace;
      font-size: 0.75rem;
      color: #c9a84c;
      margin-top: 3px;
    }

    /* ── Pricing ── */
    .receipt__pricing {
      padding: 1.75rem 2.5rem;
      border-bottom: 1px solid rgba(201,168,76,0.15);
    }

    .receipt__price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.55rem 0;
      border-bottom: 1px dashed rgba(201,168,76,0.12);
    }

    .receipt__price-row:last-child { border-bottom: none; }

    .receipt__price-row span {
      font-size: 0.88rem;
      color: #5a5a5a;
    }

    .receipt__price-row strong {
      font-size: 0.92rem;
      color: var(--primary);
    }

    .receipt__price-row.receipt__price-row--total {
      margin-top: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(26,26,26,0.95), rgba(123,26,26,0.88));
      border: none;
    }

    .receipt__price-row--total span {
      font-family: 'Cinzel', serif;
      font-size: 0.8rem;
      letter-spacing: 0.1em;
      color: rgba(232,213,163,0.8);
      text-transform: uppercase;
    }

    .receipt__price-row--total strong {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.75rem;
      color: #e8d5a3;
    }

    /* ── Payment info ── */
    .receipt__payment {
      padding: 1.25rem 2.5rem;
      border-bottom: 1px solid rgba(201,168,76,0.15);
      background: rgba(201,168,76,0.03);
    }

    .receipt__payment-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .receipt__payment-item {
      padding: 0.7rem 0.9rem;
      border-radius: 12px;
      background: #fff;
      border: 1px solid rgba(201,168,76,0.15);
    }

    .receipt__payment-item label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      display: block;
    }

    .receipt__payment-item code {
      display: block;
      font-size: 0.78rem;
      color: var(--primary);
      margin-top: 3px;
      font-family: 'Lato', monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Policy ── */
    .receipt__policy {
      padding: 1.25rem 2.5rem;
      border-bottom: 1px solid rgba(201,168,76,0.15);
    }

    .receipt__policy ul {
      list-style: none;
      display: grid;
      gap: 0.45rem;
      margin-top: 0.75rem;
    }

    .receipt__policy li {
      font-size: 0.82rem;
      color: #6b6055;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .receipt__policy li::before {
      content: '✓';
      color: var(--gold);
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    /* ── Footer ── */
    .receipt__footer {
      padding: 1.5rem 2.5rem;
      background: linear-gradient(135deg, #1a1a1a, #2c0a0a);
      text-align: center;
      color: rgba(232,213,163,0.7);
    }

    .receipt__footer-logo {
      font-family: 'Cinzel', serif;
      font-size: 1rem;
      color: #c9a84c;
      letter-spacing: 0.08em;
      margin-bottom: 0.4rem;
    }

    .receipt__footer p {
      font-size: 0.75rem;
      line-height: 1.7;
    }

    .receipt__footer a {
      color: #c9a84c;
      text-decoration: none;
    }

    /* ── Print button ── */
    .print-bar {
      width: 100%;
      max-width: 680px;
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
      justify-content: flex-end;
    }

    .print-btn {
      padding: 0.75rem 1.4rem;
      border-radius: 999px;
      font-family: 'Cinzel', serif;
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s ease;
    }

    .print-btn--gold {
      background: linear-gradient(135deg, #e8d5a3, #c9a84c);
      color: #1a1a1a;
      border: none;
      box-shadow: 0 8px 24px rgba(201,168,76,0.3);
    }

    .print-btn--outline {
      background: transparent;
      color: #5a5a5a;
      border: 1px solid rgba(201,168,76,0.3);
    }

    @media print {
      body { background: #fff; padding: 0; }
      .print-bar { display: none; }
      .receipt { box-shadow: none; border: none; border-radius: 0; }
    }
  </style>
</head>
<body>

<div class="print-bar">
  <button class="print-btn print-btn--outline" onclick="window.close()">✕ Close</button>
  <button class="print-btn print-btn--gold" onclick="window.print()">⬇ Download / Print</button>
</div>

<div class="receipt">

  <!-- Header -->
  <div class="receipt__header">
    <div class="receipt__header-top">
      <div class="receipt__logo-block">
        <img src="${LOGO_URL}" alt="Bael Tree Hotels" class="receipt__logo-img" />
        <div>
          <div class="receipt__hotel-name">Bael Tree Hotels</div>
          <div class="receipt__hotel-tagline">Luxury · Heritage · Madhapur</div>
        </div>
      </div>
      <div class="receipt__badge">
        <div class="receipt__invoice-label">Receipt No.</div>
        <div class="receipt__invoice-num">#${(booking.id || "").slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
    <div class="receipt__divider"></div>
    <div class="receipt__meta">
      <span class="receipt__meta-date">Generated on ${receiptDate}</span>
      <span class="receipt__status">${booking.status || "confirmed"}</span>
    </div>
  </div>

  <!-- Guest Info -->
  <div class="receipt__guest">
    <div class="receipt__info-group">
      <label>Guest Name</label>
      <strong>${booking.userName || "—"}</strong>
      <p>${booking.userEmail || ""}</p>
      <p>${booking.userPhone || ""}</p>
    </div>
    <div class="receipt__info-group">
      <label>Booking Reference</label>
      <strong>${booking.id || "—"}</strong>
      <p>Occupancy: ${(booking.occupancy || "single").charAt(0).toUpperCase() + (booking.occupancy || "single").slice(1)}</p>
      <p>Guests: ${booking.guests || 1}</p>
    </div>
  </div>

  <!-- Stay Dates -->
  <div class="receipt__dates">
    <div class="receipt__section-title">Stay Details</div>
    <div class="receipt__dates-grid">
      <div class="receipt__date-card">
        <label>Check-in</label>
        <strong>${fmt(booking.checkIn)}</strong>
        <small>From ${checkInTime}</small>
      </div>
      <div class="receipt__nights-badge">
        <span>${nights}</span>
        <small>${nights === 1 ? "Night" : "Nights"}</small>
      </div>
      <div class="receipt__date-card">
        <label>Check-out</label>
        <strong>${fmt(booking.checkOut)}</strong>
        <small>By ${checkOutTime}</small>
      </div>
    </div>
  </div>

  <!-- Room -->
  <div class="receipt__room">
    <div class="receipt__section-title">Room Details</div>
    <div class="receipt__room-card">
      <img src="${room?.images?.[0] || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"}" alt="Room" class="receipt__room-icon" />
      <div>
        <div class="receipt__room-name">${room?.name || booking.roomCategory || "—"}</div>
        <div class="receipt__room-meta">
          ${room?.tagline || ""} · ${(booking.occupancy || "single").charAt(0).toUpperCase() + (booking.occupancy || "single").slice(1)} Occupancy
        </div>
      </div>
      <div class="receipt__room-id">
        <label>Room ID</label>
        <code>${booking.roomId || "—"}</code>
      </div>
    </div>
  </div>

  <!-- Pricing -->
  <div class="receipt__pricing">
    <div class="receipt__section-title">Pricing Breakdown</div>
    <div class="receipt__price-row">
      <span>${fmtCurrency(perNight)} × ${nights} night${nights !== 1 ? "s" : ""}</span>
      <strong>${fmtCurrency(subtotal)}</strong>
    </div>
    <div class="receipt__price-row">
      <span>GST (${gstPct}%)</span>
      <strong>${fmtCurrency(gstAmount)}</strong>
    </div>
    <div class="receipt__price-row receipt__price-row--total">
      <span>Total Charged</span>
      <strong>${fmtCurrency(grandTotal)}</strong>
    </div>
  </div>

  <!-- Payment Info -->
  ${(booking.paymentId || booking.orderId) ? `
  <div class="receipt__payment">
    <div class="receipt__section-title">Payment Information</div>
    <div class="receipt__payment-grid">
      ${booking.paymentId ? `<div class="receipt__payment-item"><label>Payment ID</label><code>${booking.paymentId}</code></div>` : ""}
      ${booking.orderId ? `<div class="receipt__payment-item"><label>Transaction ID</label><code>${booking.orderId}</code></div>` : ""}
      <div class="receipt__payment-item"><label>Method</label><code>PayU · Secure</code></div>
      <div class="receipt__payment-item"><label>Currency</label><code>${settings?.hotelInfo?.currency || "INR"}</code></div>
    </div>
  </div>
  ` : ""}

  <!-- Policy -->
  <div class="receipt__policy">
    <div class="receipt__section-title">Stay Policies</div>
    <ul>
      <li>Check-in from ${checkInTime} · Please carry a valid photo ID.</li>
      <li>Check-out by ${checkOutTime} · Late check-out subject to availability.</li>
      <li>Free cancellation within 24 hours of booking.</li>
      <li>Complimentary Wi-Fi throughout the property.</li>
      <li>Contact us for airport transfer or special arrangements.</li>
    </ul>
  </div>

  <!-- Footer -->
  <div class="receipt__footer">
    <div class="receipt__footer-logo">Bael Tree Hotels</div>
    <p>
      Ground Floor, Plot No.529, 100 Feet Road, Madhapur, Hyderabad – 500081<br/>
      📞 ${settings?.hotelInfo?.hotelPhone || "+91-9642325555"} &nbsp;·&nbsp;
      ✉ <a href="mailto:${settings?.hotelInfo?.hotelEmail || "stay@baeltreehotels.com"}">${settings?.hotelInfo?.hotelEmail || "stay@baeltreehotels.com"}</a>
    </p>
    <p style="margin-top: 0.75rem; font-size: 0.7rem; color: rgba(201,168,76,0.5);">
      Thank you for choosing Bael Tree Hotels. We look forward to welcoming you.
    </p>
  </div>

</div>

</body>
</html>`;
};

/* ── Open receipt in new window ── */
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

/* ── Legacy export (keeps existing call sites working) ── */
export default openInvoiceWindow;