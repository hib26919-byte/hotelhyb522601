import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  CheckCircle2,
  Download,
  Loader2,
  ShieldCheck,
  Sparkles,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useBooking } from "../context/BookingContext";
import useAuth from "../hooks/useAuth";
import PageHero from "../components/PageHero";
import SEOHead from "../components/SEOHead";
import { db } from "../utils/firebase";
import { formatCurrency } from "../utils/dateHelpers";
import { ROOM_CATEGORIES } from "../utils/siteData";
import { releaseBookingInventoryLock } from "../utils/bookingTransactions";

// ─── PayU Callback Handler ────────────────────────────────────────────────────
// PayU POSTs to our Express server (/api/payment/success or /failure),
// which redirects here as a GET with ?status=success&txnid=...&mihpayid=...
//
// On success we:
//   1. Find the booking by txnid (= bookingId we passed to PayU)
//   2. Update booking status to "confirmed" + store paymentId
//   3. Increment user's bookingCount
//   4. Write a notification for the admin
//   5. Show the confirmation card + invoice download

const PayUResult = ({ status, txnid, mihpayid }) => {
  const { currentUser } = useAuth();
  const [booking, setBooking]   = useState(null);
  const [room, setRoom]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const didRun = useRef(false); // prevent double-run in React StrictMode

  const success = status === "success";

  useEffect(() => {
    if (!currentUser || didRun.current) {
      if (!currentUser) setLoading(false);
      return;
    }
    didRun.current = true;

    const confirmBooking = async () => {
      try {
        if (!txnid) {
          setLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, "bookings", txnid));
        const bookingDoc = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        const bookingId = snap.id;

        if (!bookingDoc || !bookingId) {
          setLoading(false);
          return;
        }

        const pendingStatuses = ["pending", "pending_payment", "pending_verification"];

        // 2. Update booking to confirmed (only if still pending to avoid double-write)
        if (success && pendingStatuses.includes(bookingDoc.status)) {
          await updateDoc(doc(db, "bookings", bookingId), {
            status:    "confirmed",
            paymentStatus: "verified",
            paymentId: mihpayid || "",
            orderId:   txnid    || "",
            confirmedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // 3. Increment user bookingCount
          await updateDoc(doc(db, "users", currentUser.uid), {
            bookingCount: increment(1),
          });

          // 4. Admin notification
          try {
            await addDoc(collection(db, "notifications"), {
              type:      "new_booking",
              message:   `Booking confirmed for ${bookingDoc.userName} — ${bookingDoc.roomCategory} — ₹${bookingDoc.totalAmount}`,
              isRead:    false,
              relatedId: bookingId,
              relatedType: "booking",
              userName: bookingDoc.userName,
              roomCategory: bookingDoc.roomCategory,
              amount: bookingDoc.totalAmount,
              createdAt: serverTimestamp(),
            });
          } catch {
            // Notification failure is non-critical
          }
        } else if (!success && pendingStatuses.includes(bookingDoc.status)) {
          await releaseBookingInventoryLock({
            bookingId,
            status: "payment_failed",
            paymentFailureReason: "PayU returned a failed payment status.",
          });
        }

        // 5. Re-fetch the now-confirmed booking
        const refreshed = await getDoc(doc(db, "bookings", bookingId));
        const finalBooking = { id: refreshed.id, ...refreshed.data() };
        setBooking(finalBooking);
        setConfirmed(success && finalBooking.status === "confirmed");

        // Fetch room details for the invoice
        if (finalBooking.roomId) {
          const roomSnap = await getDoc(doc(db, "rooms", finalBooking.roomId));
          if (roomSnap.exists()) {
            setRoom({ id: roomSnap.id, ...roomSnap.data() });
          }
        }
      } catch (err) {
        console.error("PayU confirm error:", err);
      } finally {
        setLoading(false);
      }
    };

    confirmBooking();
  }, [currentUser, success, txnid, mihpayid]);

  const handleDownload = () => {
    if (!booking) return;
    import("../utils/invoice").then((mod) => {
      mod.openInvoiceWindow(booking, room);
    });
  };

  if (loading) {
    return (
      <section className="section">
        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#6b6055" }}>
          <Loader2 size={32} style={{ animation: "spin 1s linear infinite", marginBottom: "1rem", color: "#c9a84c" }} />
          <p>Confirming your booking…</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
          border: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        {/* Status banner */}
        <div
          style={{
            padding: "2.5rem 2rem 2rem",
            textAlign: "center",
            background: success
              ? "linear-gradient(135deg, rgba(31,124,45,0.07), rgba(201,168,76,0.04))"
              : "linear-gradient(135deg, rgba(170,44,44,0.07), rgba(201,168,76,0.04))",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: success ? "#1f7c2d" : "#aa2c2c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
              boxShadow: success
                ? "0 8px 24px rgba(31,124,45,0.25)"
                : "0 8px 24px rgba(170,44,44,0.25)",
            }}
          >
            {success
              ? <CheckCircle2 size={34} color="#fff" />
              : <XCircle size={34} color="#fff" />}
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.9rem",
              color: "#1a1a1a",
              marginBottom: "0.5rem",
            }}
          >
            {success ? "Booking Confirmed!" : "Payment Failed"}
          </h2>
          <p style={{ color: "#5a5a5a", fontSize: "0.95rem" }}>
            {success
              ? "Your reservation at Bael Tree Hotels is complete."
              : "Something went wrong. Your booking has not been confirmed."}
          </p>
        </div>

        {/* Booking details — only on success with booking data */}
        {success && booking && (
          <div style={{ padding: "1.5rem 2rem 2rem", borderTop: "1px dashed rgba(201,168,76,0.3)" }}>

            {/* Room info row */}
            {room && (
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  padding: "1rem",
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: 16,
                  marginBottom: "1.25rem",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                {room.images?.[0] && (
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Cinzel', serif" }}>
                    {booking.roomCategory} Room
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "#1a1a1a", margin: "2px 0 4px" }}>
                    {room.name}
                  </div>
                  <div style={{ fontSize: "0.88rem", color: "#1f7c2d", fontWeight: 700 }}>
                    {formatCurrency(booking.totalAmount)} Paid
                  </div>
                </div>
              </div>
            )}

            {/* Detail grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {[
                {
                  label: "Check-in",
                  value: booking.checkIn?.toDate
                    ? booking.checkIn.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : booking.checkIn?.seconds
                      ? new Date(booking.checkIn.seconds * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—",
                },
                {
                  label: "Check-out",
                  value: booking.checkOut?.toDate
                    ? booking.checkOut.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : booking.checkOut?.seconds
                      ? new Date(booking.checkOut.seconds * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "0.85rem", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "0.68rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1a1a1a", marginTop: 4 }}>{value}</div>
                </div>
              ))}

              {/* Booking ID full width */}
              <div
                style={{
                  gridColumn: "span 2",
                  padding: "0.85rem",
                  background: "rgba(201,168,76,0.05)",
                  borderRadius: 12,
                  border: "1px solid rgba(201,168,76,0.15)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.68rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.08em" }}>Booking ID</div>
                  <div style={{ fontSize: "1rem", fontFamily: "'Lato', monospace", color: "#1a1a1a", marginTop: 4, fontWeight: 700 }}>{booking.id}</div>
                </div>
                <ShieldCheck size={22} color="#c9a84c" />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-gold"
                style={{ flex: 1, padding: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onClick={handleDownload}
              >
                <Download size={17} /> Download Invoice
              </button>
              <a
                href="/profile"
                className="btn btn-outline"
                style={{ flex: 1, padding: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
              >
                View Profile
              </a>
            </div>
          </div>
        )}

        {/* Failure actions */}
        {!success && (
          <div style={{ padding: "1.5rem 2rem 2rem", borderTop: "1px dashed rgba(201,168,76,0.3)" }}>
            <p style={{ color: "#6b6055", fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              No amount has been deducted. Please try booking again or contact us if the issue persists.
            </p>
            <a href="/booking" className="btn btn-gold" style={{ display: "block", textAlign: "center", padding: "0.9rem" }}>
              Try Again
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── Main BookingPage ─────────────────────────────────────────────────────────
const BookingPage = () => {
  const { openBooking }  = useBooking();
  const [searchParams]   = useSearchParams();
  const payuStatus       = searchParams.get("status");  // "success" | "failure" | null
  const txnid            = searchParams.get("txnid");
  const mihpayid         = searchParams.get("mihpayid");

  return (
    <>
      <SEOHead
        title="Book Your Stay | Bael Tree Hotels - Madhapur, Hyderabad"
        description="Reserve a room at Bael Tree Hotels with premium room options, secure payment, and personalized guest support."
        path="/booking"
      />
      <PageHero
        eyebrow="Book Your Stay"
        title="A seamless route from enquiry to arrival"
        description="Choose your preferred room category, confirm your dates, and complete payment securely through our streamlined booking flow."
        image="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1800&q=80"
      />

      {payuStatus ? (
        <PayUResult status={payuStatus} txnid={txnid} mihpayid={mihpayid} />
      ) : (
        <section className="section">
          <div className="reach-grid">
            {[
              { icon: ShieldCheck,  title: "Secure Payments",    text: "PayU integration with SHA-512 verified payment flow." },
              { icon: Sparkles,     title: "Tailored Experience", text: "Each booking captures your stay preferences and room style." },
              { icon: WalletCards,  title: "Transparent Pricing", text: "See occupancy-based pricing clearly before you pay." },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="reach-card reveal">
                <Icon size={22} />
                <strong>{title}</strong>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="cards-grid">
            {ROOM_CATEGORIES.map((room) => (
              <article key={room.id} className="booking-cta-card reveal">
                <span className="eyebrow">{room.tagline}</span>
                <h3>{room.name}</h3>
                <p>
                  Starting from ₹{room.singlePrice.toLocaleString("en-IN")} for single occupancy.
                </p>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => openBooking(room)}
                >
                  Start Booking
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default BookingPage;
