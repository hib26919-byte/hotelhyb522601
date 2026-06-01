import { createContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../utils/firebase";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateProfile = async (user) => {
    const reference = doc(db, "users", user.uid);
    const snapshot = await getDoc(reference);

    if (!snapshot.exists()) {
      const baseProfile = {
        name: user.displayName || user.email?.split("@")[0] || "Guest",
        email: user.email || "",
        phone: user.phoneNumber || "",
        role: "user",
        createdAt: serverTimestamp(),
        bookingCount: 0,
      };
      await setDoc(reference, baseProfile);
      await addDoc(collection(db, "notifications"), {
        type: "new_user",
        message: `New user registered: ${baseProfile.name} (${baseProfile.email})`,
        isRead: false,
        relatedId: user.uid,
        relatedType: "user",
        createdAt: serverTimestamp(),
      }).catch(() => {});
      setProfile({ id: user.uid, ...baseProfile });
      return;
    }

    setProfile({ id: snapshot.id, ...snapshot.data() });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await hydrateProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async ({ name, email, phone, password }) => {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    const userDocument = {
      name,
      email,
      phone,
      role: "user",
      createdAt: serverTimestamp(),
      bookingCount: 0,
    };
    await setDoc(doc(db, "users", credentials.user.uid), userDocument);
    await addDoc(collection(db, "notifications"), {
      type: "new_user",
      message: `New user registered: ${name} (${email})`,
      isRead: false,
      relatedId: credentials.user.uid,
      relatedType: "user",
      createdAt: serverTimestamp(),
    }).catch(() => {});
    setProfile({ id: credentials.user.uid, ...userDocument });
    return credentials.user;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = async () => {
    const credentials = await signInWithPopup(auth, googleProvider);
    await hydrateProfile(credentials.user);
    return credentials.user;
  };

  const logout = () => signOut(auth);

  const sendResetLink = (email) => sendPasswordResetEmail(auth, email);

  const updateProfileDetails = async (values) => {
    if (!currentUser) {
      return;
    }

    await updateDoc(doc(db, "users", currentUser.uid), values);
    setProfile((previous) => ({ ...previous, ...values }));
  };

  const changePassword = async (nextPassword) => {
    if (!auth.currentUser) {
      return;
    }
    await updatePassword(auth.currentUser, nextPassword);
  };

  const value = useMemo(
    () => ({
      currentUser,
      profile,
      userRole: profile?.role || "user",
      isAdmin: profile?.role === "admin",
      loading,
      login,
      signup,
      loginWithGoogle,
      logout,
      sendResetLink,
      updateProfileDetails,
      changePassword,
    }),
    [currentUser, loading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
