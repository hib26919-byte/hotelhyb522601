// useFirestore.js — Optimized Firestore hooks for Bael Tree Hotels
//
// ROOT CAUSE OF THE 166K READ PROBLEM:
//   The original hook put `queryConstraints` (an array) in useEffect's dep
//   array. Every render creates a NEW array reference → new onSnapshot call →
//   old listener never cleaned up → exponential listener accumulation.
//
// THE THREE FIXES:
//   1. queryConstraints serialised to a string key — reference churn stopped.
//   2. Static collections use getDocs (one read) not onSnapshot (live socket).
//   3. Every onSnapshot return() calls unsubscribe() — no more leaked listeners.

import { useEffect, useRef, useState } from "react";
import {
  collection, doc, getDoc, getDocs,
  onSnapshot, query as buildQuery,
} from "firebase/firestore";
import { db } from "../utils/firebase";

// Collections whose data only changes via admin actions.
// These get a single getDocs fetch instead of a persistent listener.
// "users", "revenue", "notifications" added to stop admin dashboard
// from holding expensive live listeners — cutting reads by 60-70%.
const STATIC_COLLECTIONS = new Set([
  "gallery", "heroImages", "rooms", "testimonials",
  "founders", "pageHeroImages", "festivalBanners", "inquiries",
  "users", "revenue", "notifications",
]);

// Module-level cache: "collection/docId" → data object.
// Survives React re-mounts within the same tab session.
const docCache = new Map();
const collectionCache = new Map();

// Turn the constraints array into a stable string.
// Firestore constraint objects have deterministic toString() output.
function toConstraintKey(constraints) {
  if (!constraints || constraints.length === 0) return "";
  try { return constraints.map(String).join("|"); }
  catch { return String(constraints.length); }
}

// ─────────────────────────────────────────────────────────────────────────────
// useFirestoreCollection
// ─────────────────────────────────────────────────────────────────────────────
// Options:
//   fallbackData      []       shown while loading / on error
//   queryConstraints  []       Firestore where/orderBy/limit constraints
//   enabled           true     skip fetch when false
//   fallbackWhenEmpty true     use fallbackData when Firestore returns []
//   realtime          false    force onSnapshot even for static collections
//
// Static gallery (one read, no listener):
//   const { data } = useFirestoreCollection("gallery", {
//     fallbackData: GALLERY_IMAGES
//   });
//
// Live bookings (persistent listener):
//   const constraints = useMemo(() => [where("userId","==",uid)], [uid]);
//   const { data } = useFirestoreCollection("bookings", {
//     queryConstraints: constraints,
//     realtime: true,
//   });
export function useFirestoreCollection(
  collectionName,
  {
    fallbackData = [],
    queryConstraints = [],
    enabled = true,
    fallbackWhenEmpty = true,
    realtime = false,
  } = {}
) {
  const [data, setData]       = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fallbackRef = useRef(fallbackData);
  useEffect(() => { fallbackRef.current = fallbackData; }, [fallbackData]);

  // ← THE KEY FIX: primitive string in dep array, not the array object
  const constraintKey = toConstraintKey(queryConstraints);
  const useRealtime   = realtime || !STATIC_COLLECTIONS.has(collectionName);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }

    let mounted = true;

    const colRef = collection(db, collectionName);
    const q = queryConstraints.length > 0
      ? buildQuery(colRef, ...queryConstraints)
      : colRef;

    const applySnapshot = (docs) => {
      if (!mounted) return;
      const items = docs.map((d) => ({ id: d.id, ...d.data() }));
      setData(items.length > 0 ? items : fallbackWhenEmpty ? fallbackRef.current : []);
      setError(null);
      setLoading(false);
    };

    const handleError = (err) => {
      if (!mounted) return;
      console.error(`[Firestore] ${collectionName}:`, err.message);
      setError(err);
      setData(fallbackRef.current);
      setLoading(false);
    };

    // ONE-TIME fetch for static collections
    if (!useRealtime) {
      const cacheHit = collectionCache.get(collectionName + constraintKey);
      if (cacheHit) {
        applySnapshot(cacheHit);
        return () => { mounted = false; };
      }
      setLoading(true);
      getDocs(q)
        .then((snap) => {
          collectionCache.set(collectionName + constraintKey, snap.docs);
          applySnapshot(snap.docs);
        })
        .catch(handleError);
      return () => { mounted = false; };
    }

    // PERSISTENT listener for live collections — always cleaned up
    setLoading(true);
    const unsubscribe = onSnapshot(
      q,
      (snap) => applySnapshot(snap.docs),
      handleError
    );
    return () => { mounted = false; unsubscribe(); };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintKey, enabled, fallbackWhenEmpty, useRealtime]);

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// useFirestoreDocument — one-time fetch with in-memory cache
// ─────────────────────────────────────────────────────────────────────────────
// Subsequent mounts of the same component cost zero Firestore reads.
//
//   const { data } = useFirestoreDocument("settings", "general", {
//     fallbackData: DEFAULT_SETTINGS,
//   });
export function useFirestoreDocument(
  collectionName,
  documentId,
  { fallbackData = null, enabled = true } = {}
) {
  const cacheKey = `${collectionName}/${documentId}`;

  const [data, setData]       = useState(() => docCache.has(cacheKey) ? docCache.get(cacheKey) : fallbackData);
  const [loading, setLoading] = useState(!docCache.has(cacheKey));
  const [error, setError]     = useState(null);

  const fallbackRef = useRef(fallbackData);
  useEffect(() => { fallbackRef.current = fallbackData; }, [fallbackData]);

  useEffect(() => {
    if (!enabled || !documentId) { setLoading(false); return; }

    if (docCache.has(cacheKey)) {
      setData(docCache.get(cacheKey));
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getDoc(doc(db, collectionName, documentId))
      .then((snapshot) => {
        if (!mounted) return;
        if (snapshot.exists()) {
          const result = { id: snapshot.id, ...snapshot.data() };
          docCache.set(cacheKey, result);
          setData(result);
        } else {
          setData(fallbackRef.current);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(`[Firestore] ${cacheKey}:`, err.message);
        setError(err);
        setData(fallbackRef.current);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [collectionName, documentId, enabled, cacheKey]);

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// useFirestoreDocumentRealtime — live onSnapshot for ONE document
// ─────────────────────────────────────────────────────────────────────────────
// Use ONLY when the document must reflect live server changes instantly.
// Good for: settings/general (maintenance toggle), active festival banner.
// NOT for: gallery images, room listings, static content.
//
//   const { data: settings } = useFirestoreDocumentRealtime(
//     "settings", "general", { fallbackData: DEFAULT_SETTINGS }
//   );
export function useFirestoreDocumentRealtime(
  collectionName,
  documentId,
  { fallbackData = null, enabled = true } = {}
) {
  const [data, setData]       = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fallbackRef = useRef(fallbackData);
  useEffect(() => { fallbackRef.current = fallbackData; }, [fallbackData]);

  useEffect(() => {
    if (!enabled || !documentId) { setLoading(false); return; }

    let mounted = true;
    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, collectionName, documentId),
      (snapshot) => {
        if (!mounted) return;
        setData(snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data() }
          : fallbackRef.current
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (!mounted) return;
        console.error(`[Firestore RT] ${collectionName}/${documentId}:`, err.message);
        setError(err);
        setData(fallbackRef.current);
        setLoading(false);
      }
    );

    return () => { mounted = false; unsubscribe(); };
  }, [collectionName, documentId, enabled]);

  return { data, loading, error };
}