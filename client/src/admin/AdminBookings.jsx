import { addDoc, collection, deleteDoc, doc, orderBy, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, Download, Pencil, Save, Trash2, X } from "lucide-react";
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
  status: "confirmed",
  userId: "manual-entry",
};

const toDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AdminBookings = () => {
  const bookingConstraints = useMemo(() => [orderBy("createdAt", "desc")], []);
  const { data: bookings } = useFirestoreCollection("bookings", {
    fallbackData: [],
    queryConstraints: bookingConstraints,
    realtime: true,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingBookingId, setEditingBookingId] = useState("");
  const [manualBooking, setManualBooking] = useState(initialManualBooking);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const query = search.toLowerCase();
        const matchesSearch =
          booking.userName?.toLowerCase().includes(query) ||
          booking.userEmail?.toLowerCase().includes(query) ||
          booking.userPhone?.toLowerCase().includes(query) ||
          booking.id?.toLowerCase().includes(query);
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || booking.roomCategory === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [bookings, categoryFilter, search, statusFilter],
  );

  const allVisibleSelected =
    filteredBookings.length > 0 &&
    filteredBookings.every((booking) => selectedIds.includes(booking.id));

  const resetManualForm = () => {
    setEditingBookingId("");
    setManualBooking(initialManualBooking);
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status,
        updatedAt: serverTimestamp(),
      });
      toast.success("Booking status updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update booking status.");
    }
  };

  const handleBulkStatus = async (status) => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          updateDoc(doc(db, "bookings", id), {
            status,
            updatedAt: serverTimestamp(),
          }),
        ),
      );
      setSelectedIds([]);
      toast.success("Bulk status update complete.");
    } catch (error) {
      toast.error(error.message || "Unable to update selected bookings.");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Delete this booking permanently?")) return;

    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      setSelectedIds((previous) => previous.filter((id) => id !== bookingId));
      if (editingBookingId === bookingId) resetManualForm();
      toast.success("Booking deleted.");
    } catch (error) {
      toast.error(error.message || "Unable to delete booking.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !window.confirm(`Delete ${selectedIds.length} selected booking(s)?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteDoc(doc(db, "bookings", id))));
      setSelectedIds([]);
      toast.success("Selected bookings deleted.");
    } catch (error) {
      toast.error(error.message || "Unable to delete selected bookings.");
    }
  };

  const handleExport = () => {
    downloadCsv(
      "bael-tree-bookings.csv",
      filteredBookings.map((booking) => ({
        bookingId: booking.id,
        guest: booking.userName,
        email: booking.userEmail,
        phone: booking.userPhone,
        room: booking.roomCategory,
        checkIn: formatDate(booking.checkIn),
        checkOut: formatDate(booking.checkOut),
        amount: booking.totalAmount,
        status: booking.status,
      })),
    );
  };

  const startEdit = (booking) => {
    setEditingBookingId(booking.id);
    setManualBooking({
      userName: booking.userName || "",
      userEmail: booking.userEmail || "",
      userPhone: booking.userPhone || "",
      roomCategory: booking.roomCategory || "standard",
      totalAmount: booking.totalAmount || 0,
      checkIn: toDateInput(booking.checkIn),
      checkOut: toDateInput(booking.checkOut),
      guests: booking.guests || 1,
      occupancy: booking.occupancy || "single",
      status: booking.status || "confirmed",
      userId: booking.userId || "manual-entry",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleManualBooking = async (event) => {
    event.preventDefault();
    try {
      const room = ROOM_CATEGORIES.find((item) => item.category === manualBooking.roomCategory);
      const payload = {
        ...manualBooking,
        roomId: room?.id || manualBooking.roomCategory,
        roomName: room?.name || manualBooking.roomCategory,
        totalAmount: Number(manualBooking.totalAmount),
        guests: Number(manualBooking.guests),
        userId: manualBooking.userId || "manual-entry",
        source: manualBooking.userId === "manual-entry" ? "walk-in" : "phone",
        updatedAt: serverTimestamp(),
      };

      if (editingBookingId) {
        await setDoc(doc(db, "bookings", editingBookingId), payload, { merge: true });
        toast.success("Booking updated.");
      } else {
        await addDoc(collection(db, "bookings"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Manual booking created.");
      }

      resetManualForm();
    } catch (error) {
      toast.error(error.message || "Unable to save booking.");
    }
  };

  const toggleSelected = (bookingId, checked) => {
    setSelectedIds((previous) =>
      checked
        ? [...new Set([...previous, bookingId])]
        : previous.filter((item) => item !== bookingId),
    );
  };

  const toggleSelectAllVisible = (checked) => {
    setSelectedIds((previous) => {
      const visibleIds = filteredBookings.map((booking) => booking.id);
      if (checked) return [...new Set([...previous, ...visibleIds])];
      return previous.filter((id) => !visibleIds.includes(id));
    });
  };

  return (
    <div className="admin-stack">
      <section className="admin-card admin-card--manual-entry">
        <div className="admin-card__header">
          <div>
            <h3>{editingBookingId ? "Edit Booking" : "Manual Booking Entry"}</h3>
            <span>Separate block for phone, walk-in, and admin-created reservations.</span>
          </div>
          {editingBookingId && (
            <button type="button" className="btn btn-outline" onClick={resetManualForm}>
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>
        <form className="field-grid" onSubmit={handleManualBooking}>
          <label>
            Guest Name
            <input value={manualBooking.userName} onChange={(event) => setManualBooking((previous) => ({ ...previous, userName: event.target.value }))} required />
          </label>
          <label>
            Email
            <input type="email" value={manualBooking.userEmail} onChange={(event) => setManualBooking((previous) => ({ ...previous, userEmail: event.target.value }))} />
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
            <input type="date" value={manualBooking.checkIn} onChange={(event) => setManualBooking((previous) => ({ ...previous, checkIn: event.target.value }))} required />
          </label>
          <label>
            Check-out
            <input type="date" value={manualBooking.checkOut} onChange={(event) => setManualBooking((previous) => ({ ...previous, checkOut: event.target.value }))} required />
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
            Status
            <select value={manualBooking.status} onChange={(event) => setManualBooking((previous) => ({ ...previous, status: event.target.value }))}>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            Amount
            <input type="number" min="0" value={manualBooking.totalAmount} onChange={(event) => setManualBooking((previous) => ({ ...previous, totalAmount: event.target.value }))} />
          </label>
          <div className="field-grid__full">
            <button type="submit" className="btn btn-gold">
              <Save size={16} /> {editingBookingId ? "Update Booking" : "Save Manual Booking"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>Bookings</h3>
            <span>Search, edit, update status, export, or delete reservations.</span>
          </div>
        </div>
        <div className="admin-toolbar">
          <input
            type="search"
            placeholder="Search guest, email, phone, or booking ID"
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
            <Download size={15} /> Export CSV
          </button>
          <button type="button" className="btn btn-outline" onClick={() => handleBulkStatus("confirmed")} disabled={!selectedIds.length}>
            <CheckCircle size={15} /> Confirm Selected
          </button>
          <button type="button" className="btn btn-outline" onClick={() => handleBulkStatus("cancelled")} disabled={!selectedIds.length}>
            Cancel Selected
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleBulkDelete} disabled={!selectedIds.length}>
            <Trash2 size={15} /> Delete Selected
          </button>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                    aria-label="Select all visible bookings"
                  />
                </th>
                <th>Guest</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Booking ID</th>
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
                      onChange={(event) => toggleSelected(booking.id, event.target.checked)}
                    />
                  </td>
                  <td>
                    <strong>{booking.userName || "Guest"}</strong>
                    <small>{booking.userEmail || booking.userPhone || "-"}</small>
                  </td>
                  <td>{booking.roomCategory}</td>
                  <td>
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </td>
                  <td>{formatCurrency(booking.totalAmount)}</td>
                  <td>
                    <span className={`status-badge ${booking.status || "pending"}`}>{booking.status || "pending"}</span>
                  </td>
                  <td>
                    <small>{booking.id}</small>
                  </td>
                  <td className="table-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => startEdit(booking)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => handleStatusUpdate(booking.id, "confirmed")}>
                      Confirm
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => handleStatusUpdate(booking.id, "completed")}>
                      Complete
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => handleStatusUpdate(booking.id, "cancelled")}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => handleDeleteBooking(booking.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredBookings.length && (
                <tr>
                  <td colSpan="8">No bookings match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminBookings;
