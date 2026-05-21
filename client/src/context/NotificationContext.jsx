import { createContext, useContext, useMemo } from "react";
import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAdmin } = useAuth();
  const notificationState = useNotifications(isAdmin);

  const value = useMemo(() => notificationState, [notificationState]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);

export default NotificationContext;

