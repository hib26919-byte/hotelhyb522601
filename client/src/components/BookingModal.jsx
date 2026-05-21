import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { CalendarDays, CheckCircle2, ShieldCheck, Users, X, Download } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import usePayU from "../hooks/usePayU";
import { useBooking } from "../context/BookingContext";
import { db } from "../utils/firebase";
import {
  buildFullyBookedDates,
  formatCurrency,
  getNightsBetween,
} from "../utils/dateHelpers";
import { useFirestoreCollection } from "../hooks/useFirestore";

const BookingModal = () => {
  const { selectedRoom, isOpen, closeBooking } = useBooking();
  const { currentUser, profile } = useAuth();
  const { pay, processing } = usePayU();
  const [step, setStep] = useState(1);
  const [confirmationId, setConfirmationId] = useState("");
  const [formValues, setFormValues] = useState({
    checkIn: null,
    checkOut: null,
    guests: 1,
    occupancy: "single",
    userName: "",
    userEmail: "",
    userPhone: "",
  });

  const roomConstraints = useMemo(
    () => (selectedRoom ? [where("roomId", "==", selectedRoom.id)] : []),
    [selectedRoom],
  );
  const { data: roomBookings } = useFirestoreCollection("bookings", {
    fallbackData: [],
    queryConstraints: roomConstraints,
    enabled: Boolean(selectedRoom && isOpen),
    realtime: false,
  });

  useEffect(() => {
    if (profile) {
      setFormValues((previous) => ({
        ...previous,
        userName: profile.name || "",
        userEmail: profile.email || "",
        userPhone: profile.phone || "",
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setConfirmationId("");
      setFormValues((previous) => ({
        ...previous,
        checkIn: null,
        checkOut: null,
        guests: 1,
        occupancy: "single",
      }));
    }
  }, [isOpen]);

  const soldOutDates = useMemo(
    () => buildFullyBookedDates(roomBookings, selectedRoom?.totalRooms),
    [roomBookings, selectedRoom?.totalRooms],
  );
  const nights = getNightsBetween(formValues.checkIn, formValues.checkOut);
  const perNightPrice =
    formValues.occupancy === "double"
      ? selectedRoom?.doublePrice
      : selectedRoom?.singlePrice;
  const totalAmount = (perNightPrice || 0) * Math.max(nights, 1);

  const handleStep = () => {
    if (step === 1 && (!formValues.checkIn || !formValues.checkOut)) {
      toast.error("Please select both check-in and check-out dates.");
      return;
    }
    if (
      step === 2 &&
      (!formValues.userName || !formValues.userEmail || !formValues.userPhone)
    ) {
      toast.error("Please complete your guest details.");
      return;
    }
    setStep((previous) => previous + 1);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Please sign in before making a booking.");
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { mode: "signin" } }),
      );
      return;
    }

    if (!selectedRoom) {
      return;
    }

    try {
      const bookingReference = await addDoc(collection(db, "bookings"), {
        userId: currentUser.uid,
        userName: formValues.userName,
        userEmail: formValues.userEmail,
        userPhone: formValues.userPhone,
        roomId: selectedRoom.id,
        roomCategory: selectedRoom.category,
        checkIn: formValues.checkIn,
        checkOut: formValues.checkOut,
        guests: Number(formValues.guests),
        occupancy: formValues.occupancy,
        totalAmount,
        paymentId: "",
        orderId: "",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await pay({
        amount: totalAmount,
        bookingId: bookingReference.id,
        userName: formValues.userName,
        userEmail: formValues.userEmail,
        userPhone: formValues.userPhone,
        onSuccess: async (response) => {
          // PayU returns mihpayid (their transaction ID) and txnid (your bookingId)
          await updateDoc(doc(db, "bookings", bookingReference.id), {
            paymentId: response.mihpayid,
            orderId: response.txnid,
            status: "confirmed",
          });
          await updateDoc(doc(db, "users", currentUser.uid), {
            bookingCount: increment(1),
          });

          try {
            await addDoc(collection(db, "notifications"), {
              type: "new_booking",
              message: `New booking by ${formValues.userName} for ${selectedRoom.name} - ${formatCurrency(totalAmount)}`,
              isRead: false,
              relatedId: bookingReference.id,
              createdAt: serverTimestamp(),
            });
          } catch {
            // In production this is often handled by Cloud Functions or admin-only rules.
          }

          setConfirmationId(bookingReference.id);
          setStep(5);
          toast.success("Booking confirmed successfully.");
        },
        onFailure: () => {
          toast.error("Payment was dismissed before completion.");
        },
      });
    } catch (error) {
      toast.error(error.message || "Unable to complete the booking.");
    }
  };

  if (!isOpen || !selectedRoom) {
    return null;
  }

  return (
    <div
      className="modal-shell"
      role="dialog"
      aria-modal="true"
      aria-label="Booking modal"
    >
      <div
        className="modal-shell__backdrop"
        onClick={closeBooking}
        aria-hidden="true"
      />
      <div className="modal-card booking-modal">
        <button
          type="button"
          className="modal-close"
          onClick={closeBooking}
          aria-label="Close booking modal"
        >
          <X size={18} />
        </button>
        <div className="booking-modal__header">
          <span className="eyebrow">Reserve your stay</span>
          <h3>{selectedRoom.name}</h3>
          <p>{selectedRoom.tagline}</p>
        </div>
        <div className="booking-modal__steps">
          {[1, 2, 3, 4, 5].map((item) => (
            <span key={item} className={step >= item ? "active" : ""}>
              {item}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="booking-step">
            <div className="field-grid">
              <label>
                Check-in
                <DatePicker
                  selected={formValues.checkIn}
                  onChange={(date) =>
                    setFormValues((previous) => ({ ...previous, checkIn: date }))
                  }
                  minDate={new Date()}
                  excludeDates={soldOutDates}
                  placeholderText="Select check-in"
                />
              </label>
              <label>
                Check-out
                <DatePicker
                  selected={formValues.checkOut}
                  onChange={(date) =>
                    setFormValues((previous) => ({ ...previous, checkOut: date }))
                  }
                  minDate={formValues.checkIn || new Date()}
                  excludeDates={soldOutDates}
                  placeholderText="Select check-out"
                />
              </label>
            </div>
            <p className="booking-hint">
              Dates shown as unavailable are already fully occupied for this room
              category.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="booking-step">
            <div className="field-grid">
              <label>
                Full Name
                <input
                  type="text"
                  value={formValues.userName}
                  onChange={(event) =>
                    setFormValues((previous) => ({
                      ...previous,
                      userName: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={formValues.userEmail}
                  onChange={(event) =>
                    setFormValues((previous) => ({
                      ...previous,
                      userEmail: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={formValues.userPhone}
                  onChange={(event) =>
                    setFormValues((previous) => ({
                      ...previous,
                      userPhone: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Guests
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={formValues.guests}
                  onChange={(event) =>
                    setFormValues((previous) => ({
                      ...previous,
                      guests: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="booking-step booking-step--choice">
            {[
              {
                value: "single",
                label: "Single Occupancy",
                amount: selectedRoom.singlePrice,
                icon: ShieldCheck,
              },
              {
                value: "double",
                label: "Double Occupancy",
                amount: selectedRoom.doublePrice,
                icon: Users,
              },
            ].map(({ value, label, amount, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={`choice-card ${formValues.occupancy === value ? "active" : ""}`}
                onClick={() =>
                  setFormValues((previous) => ({ ...previous, occupancy: value }))
                }
              >
                <Icon size={22} />
                <strong>{label}</strong>
                <span>{formatCurrency(amount)} / night</span>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="booking-step">
            <div className="summary-card">
              <h4>Payment Summary</h4>
              <div>
                <span>Room Category</span>
                <strong>{selectedRoom.name}</strong>
              </div>
              <div>
                <span>Stay</span>
                <strong>{nights} night(s)</strong>
              </div>
              <div>
                <span>Price per night</span>
                <strong>{formatCurrency(perNightPrice)}</strong>
              </div>
              <div>
                <span>Total Payable</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="booking-step" style={{ padding: 0, overflow: "hidden", borderRadius: 20 }}>
            <div style={{ padding: "2.5rem 1.5rem 2rem", textAlign: "center", background: "linear-gradient(135deg, rgba(51,160,67,0.08), rgba(201,168,76,0.05))" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1f7c2d", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", boxShadow: "0 8px 24px rgba(31,124,45,0.25)" }}>
                <CheckCircle2 size={32} color="#fff" />
              </div>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#1a1a1a", marginBottom: "0.5rem" }}>
                Booking Confirmed
              </h4>
              <p style={{ color: "#5a5a5a", fontSize: "0.95rem" }}>
                Thank you, {formValues.userName}. Your reservation is complete.
              </p>
            </div>

            <div style={{ padding: "1.5rem", background: "linear-gradient(to bottom, #fff, #faf8f5)", borderTop: "1px dashed rgba(201,168,76,0.3)" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1rem", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 16, marginBottom: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
                <img src={selectedRoom.images?.[0]} alt={selectedRoom.name} style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Cinzel', serif" }}>{selectedRoom.category} Room</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", color: "#1a1a1a", margin: "2px 0 4px" }}>{selectedRoom.name}</div>
                  <div style={{ fontSize: "0.9rem", color: "#1f7c2d", fontWeight: 700 }}>{formatCurrency(totalAmount)} Paid</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ padding: "0.85rem", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.08em" }}>Check-in</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1a1a1a", marginTop: 4 }}>
                    {formValues.checkIn ? formValues.checkIn.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </div>
                </div>
                <div style={{ padding: "0.85rem", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "0.7rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.08em" }}>Check-out</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1a1a1a", marginTop: 4 }}>
                    {formValues.checkOut ? formValues.checkOut.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </div>
                </div>
                <div style={{ padding: "0.85rem", background: "#fff", borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)", gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.08em" }}>Guests & Occupancy</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1a1a1a", marginTop: 4, textTransform: "capitalize" }}>
                      {formValues.guests} Guest{formValues.guests > 1 ? "s" : ""} • {formValues.occupancy}
                    </div>
                  </div>
                  <Users size={20} color="#8f8579" />
                </div>
                <div style={{ padding: "0.85rem", background: "rgba(201,168,76,0.05)", borderRadius: 12, border: "1px solid rgba(201,168,76,0.15)", gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.08em" }}>Booking ID</div>
                    <div style={{ fontSize: "1.05rem", fontFamily: "'Lato', monospace", color: "#1a1a1a", marginTop: 4, fontWeight: 700 }}>{confirmationId}</div>
                  </div>
                  <ShieldCheck size={24} color="#c9a84c" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#fff" }}
                  onClick={() => {
                    const mockBooking = {
                      id: confirmationId,
                      userName: formValues.userName,
                      userEmail: formValues.userEmail,
                      userPhone: formValues.userPhone,
                      roomId: selectedRoom.id,
                      roomCategory: selectedRoom.category,
                      checkIn: formValues.checkIn,
                      checkOut: formValues.checkOut,
                      guests: Number(formValues.guests),
                      occupancy: formValues.occupancy,
                      totalAmount,
                      status: "confirmed",
                      createdAt: new Date(),
                    };
                    import("../utils/invoice").then((mod) => {
                      mod.openInvoiceWindow(mockBooking, selectedRoom);
                    });
                  }}
                >
                  <Download size={16} /> Download Invoice
                </button>
                <button
                  type="button"
                  className="btn btn-gold"
                  style={{ flex: 1, padding: "0.85rem" }}
                  onClick={closeBooking}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {step < 5 && (
          <div className="modal-actions">
            {step > 1 ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep((previous) => previous - 1)}
              >
                Back
              </button>
            ) : (
              <span className="booking-meta">
                <CalendarDays size={16} />
                Luxury check-in begins here
              </span>
            )}
            {step < 4 ? (
              <button type="button" className="btn btn-gold" onClick={handleStep}>
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-gold"
                onClick={handleSubmit}
                disabled={processing}
              >
                {processing ? "Processing..." : "Pay & Confirm"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;