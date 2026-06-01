import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import useNotifications from "../hooks/useNotifications";

const NotificationContext = createContext(null);

const playNotificationSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
};

export const NotificationProvider = ({ children }) => {
  const { isAdmin } = useAuth();
  const notificationState = useNotifications(isAdmin);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("baelNotificationSound") !== "off",
  );
  const hasInteracted = useRef(false);
  const previousFirstId = useRef(null);

  useEffect(() => {
    const markInteraction = () => {
      hasInteracted.current = true;
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", markInteraction, { once: true });
    window.addEventListener("keydown", markInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("baelNotificationSound", soundEnabled ? "on" : "off");
  }, [soundEnabled]);

  useEffect(() => {
    const latest = notificationState.notifications?.[0];
    if (!latest) return;

    if (!previousFirstId.current) {
      previousFirstId.current = latest.id;
      return;
    }

    if (latest.id !== previousFirstId.current) {
      previousFirstId.current = latest.id;
      if (hasInteracted.current && soundEnabled) {
        playNotificationSound();
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Bael Tree Hotels", {
          body: latest.message || "New admin notification",
          tag: latest.id,
        });
      }
    }
  }, [notificationState.notifications, soundEnabled]);

  const value = useMemo(
    () => ({
      ...notificationState,
      soundEnabled,
      setSoundEnabled,
    }),
    [notificationState, soundEnabled],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);

export default NotificationContext;
