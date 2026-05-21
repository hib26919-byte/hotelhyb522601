import { useMemo } from "react";
import {
  collection,
  doc,
  limit,
  orderBy,
  query,
  updateDoc,
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
    await Promise.all(
      data
        .filter((notification) => !notification.isRead)
        .map((notification) =>
          updateDoc(doc(db, "notifications", notification.id), {
            isRead: true,
          }),
        ),
    );
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

