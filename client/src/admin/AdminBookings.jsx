import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "../utils/firebase";
import { downloadCsv } from "../utils/dashboard";
import { formatCurrency, formatDate } from "../utils/dateHelpers";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { ROOM_CATEGORIES } from "../utils/siteData";

const initialManualBooking = {
  userName: "",
  userEmail: "",
  userPhone: "",
  roomCategory: "standard",
  totalAmount: 0,
  checkIn: "",
  checkOut: "",
  guests: 1,
  occupancy: "single",
};

const AdminBookings = () => {
  const { data: bookings } = useFirestoreCollection("bookings", {
  fallbackData: [],
  realtime: true,
});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [manualBooking, setManualBooking] = useState(initialManualBooking);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const matchesSearch =
          booking.userName?.toLowerCase().includes(search.toLowerCase()) ||
          booking.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
          booking.id?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || booking.roomCategory === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [bookings, categoryFilter, search, statusFilter],
  );

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status });
      toast.success("Booking status updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update booking status.");
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await Promise.all(selectedIds.map((id) => updateDoc(doc(db, "bookings", id), { status })));
      setSelectedIds([]);
      toast.success("Bulk status update complete.");
    } catch (error) {
      toast.error(error.message || "Unable to update selected bookings.");
    }
  };

  const handleExport = () => {
    downloadCsv(
      "bael-tree-bookings.csv",
      filteredBookings.map((booking) => ({
        bookingId: booking.id,
        guest: booking.userName,
        email: booking.userEmail,
        room: booking.roomCategory,
        checkIn: formatDate(booking.checkIn),
        checkOut: formatDate(booking.checkOut),
        amount: booking.totalAmount,
        status: booking.status,
      })),
    );
  };

  const handleManualBooking = async (event) => {
    event.preventDefault();
    try {
      const room = ROOM_CATEGORIES.find((item) => item.category === manualBooking.roomCategory);
      await addDoc(collection(db, "bookings"), {
        ...manualBooking,
        roomId: room?.id || manualBooking.roomCategory,
        totalAmount: Number(manualBooking.totalAmount),
        guests: Number(manualBooking.guests),
        status: "confirmed",
        userId: "manual-entry",
        createdAt: serverTimestamp(),
      });
      setManualBooking(initialManualBooking);
      toast.success("Manual booking created.");
    } catch (error) {
      toast.error(error.message || "Unable to create manual booking.");
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-toolbar">
          <input
            type="search"
            placeholder="Search guest, email, or booking ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            <option value="standard">Standard</option>
            <option value="executive">Executive</option>
            <option value="premium">Premium</option>
            <option value="suite">Suite</option>
          </select>
          <button type="button" className="btn btn-outline" onClick={handleExport}>
            Export CSV
          </button>
          <button type="button" className="btn btn-outline" onClick={() => handleBulkStatus("confirmed")} disabled={!selectedIds.length}>
            Confirm Selected
          </button>
          <button type="button" className="btn btn-gold" onClick={() => handleBulkStatus("cancelled")} disabled={!selectedIds.length}>
            Cancel Selected
          </button>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th />
                <th>Guest</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(booking.id)}
                      onChange={(event) =>
                        setSelectedIds((previous) =>
                          event.target.checked
                            ? [...previous, booking.id]
                            : previous.filter((item) => item !== booking.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>{booking.userName}</strong>
                    <small>{booking.userEmail}</small>
                  </td>
                  <td>{booking.roomCategory}</td>
                  <td>
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </td>
                  <td>{formatCurrency(booking.totalAmount)}</td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                  </td>
                  <td className="table-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => handleStatusUpdate(booking.id, "confirmed")}>
                      Confirm
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => handleStatusUpdate(booking.id, "completed")}>
                      Complete
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => handleStatusUpdate(booking.id, "cancelled")}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredBookings.length && (
                <tr>
                  <td colSpan="7">No bookings match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card__header">
          <h3>Manual Booking Entry</h3>
          <span>Use this for phone or walk-in reservations.</span>
        </div>
        <form className="field-grid" onSubmit={handleManualBooking}>
          <label>
            Guest Name
            <input value={manualBooking.userName} onChange={(event) => setManualBooking((previous) => ({ ...previous, userName: event.target.value }))} required />
          </label>
          <label>
            Email
            <input value={manualBooking.userEmail} onChange={(event) => setManualBooking((previous) => ({ ...previous, userEmail: event.target.value }))} />
          </label>
          <label>
            Phone
            <input value={manualBooking.userPhone} onChange={(event) => setManualBooking((previous) => ({ ...previous, userPhone: event.target.value }))} />
          </label>
          <label>
            Room Category
            <select value={manualBooking.roomCategory} onChange={(event) => setManualBooking((previous) => ({ ...previous, roomCategory: event.target.value }))}>
              {ROOM_CATEGORIES.map((room) => (
                <option key={room.category} value={room.category}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Check-in
            <input type="date" value={manualBooking.checkIn} onChange={(event) => setManualBooking((previous) => ({ ...previous, checkIn: event.target.value }))} />
          </label>
          <label>
            Check-out
            <input type="date" value={manualBooking.checkOut} onChange={(event) => setManualBooking((previous) => ({ ...previous, checkOut: event.target.value }))} />
          </label>
          <label>
            Guests
            <input type="number" min="1" value={manualBooking.guests} onChange={(event) => setManualBooking((previous) => ({ ...previous, guests: event.target.value }))} />
          </label>
          <label>
            Occupancy
            <select value={manualBooking.occupancy} onChange={(event) => setManualBooking((previous) => ({ ...previous, occupancy: event.target.value }))}>
              <option value="single">Single</option>
              <option value="double">Double</option>
            </select>
          </label>
          <label>
            Amount
            <input type="number" min="0" value={manualBooking.totalAmount} onChange={(event) => setManualBooking((previous) => ({ ...previous, totalAmount: event.target.value }))} />
          </label>
          <div className="field-grid__full">
            <button type="submit" className="btn btn-gold">
              Save Manual Booking
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminBookings;

