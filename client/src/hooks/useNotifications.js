import { useMemo } from "react";
import {
  doc,
  limit,
  orderBy,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { useFirestoreCollection } from "./useFirestore";

const useNotifications = (enabled = false) => {
  const constraints = useMemo(
    () => [orderBy("createdAt", "desc"), limit(50)],
    [],
  );
const { data, loading, error } = useFirestoreCollection("notifications", {
  fallbackData: [],
  queryConstraints: constraints,
  enabled,
  realtime: true,
});

  const unreadCount = data.filter((notification) => !notification.isRead).length;

  const markAsRead = async (notificationId) => {
    await updateDoc(doc(db, "notifications", notificationId), {
      isRead: true,
    });
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    data
      .filter((notification) => !notification.isRead)
      .forEach((notification) => {
        batch.update(doc(db, "notifications", notification.id), {
          isRead: true,
        });
      });
    await batch.commit();
  };

  return {
    notifications: data,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotifications;
