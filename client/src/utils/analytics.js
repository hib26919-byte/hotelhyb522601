import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const VISITOR_KEY = "bael-tree-visitor-id";
const RECENT_VIEW_PREFIX = "bael-tree-view:";
const VIEW_THROTTLE_MS = 30 * 1000;

const getVisitorId = () => {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return "anonymous";
  }
};

const getPageLabel = (path) => {
  if (path === "/") return "Home";
  return path
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ") || "Home";
};

const recentlyTracked = (path) => {
  try {
    const key = `${RECENT_VIEW_PREFIX}${path}`;
    const lastSeen = Number(sessionStorage.getItem(key) || 0);
    const now = Date.now();
    sessionStorage.setItem(key, String(now));
    return now - lastSeen < VIEW_THROTTLE_MS;
  } catch {
    return false;
  }
};

export const recordPageView = async (path) => {
  if (!path || path.startsWith("/admin") || recentlyTracked(path)) return;

  try {
    await addDoc(collection(db, "pageViews"), {
      path,
      page: getPageLabel(path),
      visitorId: getVisitorId(),
      referrer: document.referrer || "",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent.slice(0, 180),
      dateKey: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("[Analytics] Page view not recorded:", error.message);
  }
};
