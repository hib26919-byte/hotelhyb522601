import { useMemo, useState } from "react";
import { useFirestoreCollection, useFirestoreDocument } from "../hooks/useFirestore";
import { downloadCsv } from "../utils/dashboard";
import { formatCurrency, formatDate, normalizeDate } from "../utils/dateHelpers";
import { DEFAULT_SETTINGS } from "../utils/siteData";

const AdminRevenue = () => {
  const { data: bookings } = useFirestoreCollection("bookings", {
  fallbackData: [],
  realtime: true,
});
  const { data: settings } = useFirestoreDocument("settings", "general", { fallbackData: DEFAULT_SETTINGS });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const createdAt = normalizeDate(booking.createdAt || Date.now());
        const matchesFrom = !fromDate || createdAt >= new Date(fromDate);
        const matchesTo = !toDate || createdAt <= new Date(`${toDate}T23:59:59`);
        return matchesFrom && matchesTo;
      }),
    [bookings, fromDate, toDate],
  );

  const groupedRows = useMemo(() => {
    const grouped = new Map();
    filteredBookings.forEach((booking) => {
      const key = formatDate(normalizeDate(booking.createdAt), "yyyy-MM-dd");
      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          bookings: 0,
          standard: 0,
          executive: 0,
          premium: 0,
          suite: 0,
          total: 0,
        });
      }

      const row = grouped.get(key);
      row.bookings += 1;
      row[booking.roomCategory || "standard"] += Number(booking.totalAmount || 0);
      row.total += Number(booking.totalAmount || 0);
    });
    return [...grouped.values()];
  }, [filteredBookings]);

  const totalRevenue = groupedRows.reduce((sum, row) => sum + row.total, 0);
  const gstPercentage = settings?.hotelInfo?.gstPercentage || 12;
  const gstAmount = (totalRevenue * gstPercentage) / 100;

  const handleExport = () => {
    downloadCsv("bael-tree-revenue.csv", groupedRows);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head><title>Revenue Report</title></head>
        <body style="font-family: Georgia, serif; padding: 24px;">
          <h1>Bael Tree Hotels Revenue Report</h1>
          <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
          <p>GST (${gstPercentage}%): ${formatCurrency(gstAmount)}</p>
          <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse;">
            <thead>
              <tr><th>Date</th><th>Bookings</th><th>Standard</th><th>Executive</th><th>Premium</th><th>Suite</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${groupedRows
                .map(
                  (row) => `<tr><td>${row.date}</td><td>${row.bookings}</td><td>${row.standard}</td><td>${row.executive}</td><td>${row.premium}</td><td>${row.suite}</td><td>${row.total}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="admin-stack">
      <section className="dashboard-kpi-grid">
        <article className="admin-card">
          <span className="eyebrow">Revenue</span>
          <h3>{formatCurrency(totalRevenue)}</h3>
        </article>
        <article className="admin-card">
          <span className="eyebrow">Bookings</span>
          <h3>{filteredBookings.length}</h3>
        </article>
        <article className="admin-card">
          <span className="eyebrow">GST ({gstPercentage}%)</span>
          <h3>{formatCurrency(gstAmount)}</h3>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-toolbar">
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <button type="button" className="btn btn-outline" onClick={handleExport}>
            Download CSV
          </button>
          <button type="button" className="btn btn-gold" onClick={handlePrint}>
            Print / Save PDF
          </button>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bookings</th>
                <th>Standard</th>
                <th>Executive</th>
                <th>Premium</th>
                <th>Suite</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{row.bookings}</td>
                  <td>{formatCurrency(row.standard)}</td>
                  <td>{formatCurrency(row.executive)}</td>
                  <td>{formatCurrency(row.premium)}</td>
                  <td>{formatCurrency(row.suite)}</td>
                  <td>{formatCurrency(row.total)}</td>
                </tr>
              ))}
              {!groupedRows.length && (
                <tr>
                  <td colSpan="7">No revenue data available for the selected range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminRevenue;
