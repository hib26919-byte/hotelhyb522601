import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { db } from "../utils/firebase";
import { downloadCsv } from "../utils/dashboard";
import { formatCurrency, formatDate, normalizeDate } from "../utils/dateHelpers";
import { useFirestoreCollection } from "../hooks/useFirestore";

const PAGE_SIZE = 20;

const AdminUsers = () => {
  const { currentUser } = useAuth();
  const { data: usersList, loading } = useFirestoreCollection("users", {
    fallbackData: [],
    realtime: true,
  });
  const { data: bookings } = useFirestoreCollection("bookings", {
    fallbackData: [],
    realtime: true,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortKey, setSortKey] = useState("joined");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const bookingMap = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!booking.userId) return acc;
      if (!acc[booking.userId]) acc[booking.userId] = [];
      acc[booking.userId].push(booking);
      return acc;
    }, {});
  }, [bookings]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const admins = usersList.filter((user) => user.role === "admin").length;
    const newThisMonth = usersList.filter(
      (user) => normalizeDate(user.createdAt) >= monthStart,
    ).length;
    const activeBookers = usersList.filter((user) => (bookingMap[user.id] || []).length > 0).length;

    return {
      total: usersList.length,
      admins,
      newThisMonth,
      activeBookers,
    };
  }, [bookingMap, usersList]);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase();
    return usersList
      .filter((user) => {
        const matchesSearch =
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone?.toLowerCase().includes(query);
        const matchesRole =
          roleFilter === "all" ||
          (roleFilter === "admins" && user.role === "admin") ||
          (roleFilter === "users" && (user.role || "user") === "user");
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortKey === "name") return (a.name || "").localeCompare(b.name || "");
        if (sortKey === "bookings") return (bookingMap[b.id]?.length || 0) - (bookingMap[a.id]?.length || 0);
        return normalizeDate(b.createdAt) - normalizeDate(a.createdAt);
      });
  }, [bookingMap, roleFilter, search, sortKey, usersList]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRoleChange = async (user, role) => {
    if (user.id === currentUser?.uid) {
      toast.error("You cannot change your own role.");
      return;
    }
    if (!window.confirm(`Change ${user.name || user.email} to ${role}?`)) return;

    try {
      await updateDoc(doc(db, "users", user.id), { role });
      toast.success("User role updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update role.");
    }
  };

  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(
        "This removes the user's profile data. Their authentication account remains. Continue?",
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "users", user.id));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      toast.success("User profile deleted.");
    } catch (error) {
      toast.error(error.message || "Unable to delete user profile.");
    }
  };

  const handleExport = () => {
    downloadCsv(
      "bael-tree-users.csv",
      filteredUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || "user",
        joined: formatDate(user.createdAt),
        bookingCount: bookingMap[user.id]?.length || user.bookingCount || 0,
      })),
    );
  };

  return (
    <div className="admin-stack admin-users-page">
      <section className="dashboard-kpi-grid">
        {[
          { label: "Total Users", value: stats.total, icon: Users },
          { label: "Total Admins", value: stats.admins, icon: ShieldCheck },
          { label: "New This Month", value: stats.newThisMonth, icon: UserRound },
          { label: "Active Bookers", value: stats.activeBookers, icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <article className="admin-card admin-user-stat" key={label}>
            <Icon size={18} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>Users</h3>
            <span>Manage roles, profiles, and booking history in real time.</span>
          </div>
          <button type="button" className="btn btn-outline" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
        </div>

        <div className="admin-toolbar">
          <div className="admin-search-field">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search by name, email, or phone"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}>
            <option value="all">All roles</option>
            <option value="users">Users</option>
            <option value="admins">Admins</option>
          </select>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            <option value="joined">Sort by join date</option>
            <option value="name">Sort by name</option>
            <option value="bookings">Sort by booking count</option>
          </select>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Bookings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan="7"><div className="table-row-skeleton skeleton" /></td>
                  </tr>
                ))
              )}

              {!loading && pagedUsers.map((user) => {
                const userBookings = bookingMap[user.id] || [];
                const isSelf = user.id === currentUser?.uid;
                return (
                  <tr key={user.id} onClick={() => setSelectedUser(user)} className="admin-user-row">
                    <td>
                      <strong>{user.name || "Guest"}</strong>
                      <small>{user.id}</small>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <select
                        value={user.role || "user"}
                        disabled={isSelf}
                        title={isSelf ? "Cannot change your own role" : "Change role"}
                        onChange={(event) => handleRoleChange(user, event.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{userBookings.length || user.bookingCount || 0}</td>
                    <td className="table-actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="btn btn-ghost" onClick={() => handleDeleteUser(user)}>
                        <Trash2 size={14} /> Remove User
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && !filteredUsers.length && (
                <tr>
                  <td colSpan="7">No users found for the current search or filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {selectedUser && (
        <aside className="admin-side-panel">
          <button type="button" className="admin-side-panel__close" onClick={() => setSelectedUser(null)}>
            <X size={16} />
          </button>
          <div>
            <span className="eyebrow">Booking History</span>
            <h3>{selectedUser.name || selectedUser.email}</h3>
            <p>{selectedUser.email}</p>
          </div>
          <div className="activity-feed">
            {(bookingMap[selectedUser.id] || []).map((booking) => (
              <article key={booking.id} className="notification-card">
                <div>
                  <strong>{booking.roomName || booking.roomCategory}</strong>
                  <small>
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)} · {formatCurrency(booking.totalAmount)}
                  </small>
                </div>
                <span className={`status-badge ${booking.status || "pending"}`}>{booking.status || "pending"}</span>
              </article>
            ))}
            {!(bookingMap[selectedUser.id] || []).length && (
              <p>No bookings for this user yet.</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default AdminUsers;
