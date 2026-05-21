import { doc, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { db } from "../utils/firebase";
import { formatDate } from "../utils/dateHelpers";
import { useFirestoreCollection } from "../hooks/useFirestore";

const AdminUsers = () => {
 const { data: users } = useFirestoreCollection("users", {
  fallbackData: [],
  realtime: true,
});
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const query = search.toLowerCase();
        return (
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone?.toLowerCase().includes(query)
        );
      }),
    [search, users],
  );

  const handleRoleChange = async (userId, role) => {
    try {
      await updateDoc(doc(db, "users", userId), { role });
      toast.success("User role updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update role.");
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-toolbar">
          <input type="search" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
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
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "-"}</td>
                  <td>
                    <select value={user.role || "user"} onChange={(event) => handleRoleChange(user.id, event.target.value)}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{user.bookingCount || 0}</td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan="6">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminUsers;

