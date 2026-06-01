import { useEffect, useMemo, useState } from "react";
import {
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import {
  CheckCircle2,
  Download,
  Minus,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import usePayU from "../hooks/usePayU";
import { useBooking } from "../context/BookingContext";
import {
  buildAvailabilityCalendar,
  calculateAvailability,
  getAvailabilityLabel,
  getRoomTotal,
  isRangeSelectable,
} from "../utils/availability";
import {
  formatCurrency,
  formatDate,
  getNightsBetween,
} from "../utils/dateHelpers";
import { useFirestoreCollection, useFirestoreDocumentRealtime } from "../hooks/useFirestore";
import { DEFAULT_GST_SETTINGS, getBookingPricing } from "../utils/gst";
import {
  createBookingWithInventoryLock,
  generateBookingId,
  releaseBookingInventoryLock,
} from "../utils/bookingTransactions";
import BookingCalendar from "./BookingCalendar";

const stepLabels = ["Dates", "Details", "Payment", "Confirmed"];

const BookingModal = () => {
  const { selectedRoom, isOpen, closeBooking } = useBooking();
  const { currentUser, profile } = useAuth();
  const { pay, processing } = usePayU();
  const [step, setStep] = useState(1);
  const [confirmation, setConfirmation] = useState(null);
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
    () => (selectedRoom?.category ? [where("roomCategory", "==", selectedRoom.category)] : []),
    [selectedRoom?.category],
  );
  const { data: roomBookings, loading: availabilityLoading } = useFirestoreCollection("bookings", {
    fallbackData: [],
    queryConstraints: roomConstraints,
    enabled: Boolean(selectedRoom && isOpen),
    realtime: true,
  });
  const { data: gstSettings } = useFirestoreDocumentRealtime("settings", "gst", {
    fallbackData: DEFAULT_GST_SETTINGS,
    enabled: isOpen,
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
      setConfirmation(null);
      setFormValues((previous) => ({
        ...previous,
        checkIn: null,
        checkOut: null,
        guests: 1,
        occupancy: "single",
      }));
    } else if (selectedRoom?.preferredOccupancy) {
      setFormValues((previous) => ({
        ...previous,
        occupancy: selectedRoom.preferredOccupancy,
      }));
    }
  }, [isOpen, selectedRoom?.preferredOccupancy]);

  const totalRooms = getRoomTotal(selectedRoom);
  const availabilityCalendar = useMemo(
    () =>
      buildAvailabilityCalendar({
        bookings: roomBookings,
        category: selectedRoom?.category,
        totalRooms,
        days: 60,
      }),
    [roomBookings, selectedRoom?.category, totalRooms],
  );

  const rangeAvailability = useMemo(
    () =>
      calculateAvailability({
        bookings: roomBookings,
        category: selectedRoom?.category,
        checkIn: formValues.checkIn,
        checkOut: formValues.checkOut,
        totalRooms,
      }),
    [formValues.checkIn, formValues.checkOut, roomBookings, selectedRoom?.category, totalRooms],
  );

  const nights = getNightsBetween(formValues.checkIn, formValues.checkOut);
  const pricing = useMemo(
    () =>
      getBookingPricing({
        room: selectedRoom,
        occupancy: formValues.occupancy,
        nights,
        gstSettings,
      }),
    [formValues.occupancy, gstSettings, nights, selectedRoom],
  );
  const {
    roomRatePerNight: perNightPrice,
    subtotal,
    gstRate,
    gstLabel,
    gstAmount,
    totalAmount,
  } = pricing;
  const isAvailable =
    Boolean(formValues.checkIn && formValues.checkOut) &&
    rangeAvailability.available > 0 &&
    isRangeSelectable({
      checkIn: formValues.checkIn,
      checkOut: formValues.checkOut,
      availabilityCalendar,
    });

  const updateGuests = (direction) => {
    setFormValues((previous) => ({
      ...previous,
      guests: Math.min(4, Math.max(1, Number(previous.guests || 1) + direction)),
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formValues.checkIn || !formValues.checkOut) {
        toast.error("Please select check-in and check-out dates.");
        return;
      }
      if (!isAvailable) {
        toast.error("This room is fully booked for the selected dates.");
        return;
      }
    }

    if (step === 2) {
      if (!formValues.userName.trim() || !formValues.userEmail.trim() || !formValues.userPhone.trim()) {
        toast.error("Please complete your guest details.");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(formValues.userEmail)) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }

    setStep((previous) => Math.min(previous + 1, 4));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error("Please sign in before making a booking.");
      window.dispatchEvent(
        new CustomEvent("open-auth-modal", { detail: { mode: "signin" } }),
      );
      return;
    }

    if (!selectedRoom || !isAvailable || nights <= 0) {
      toast.error("Please choose an available date range first.");
      return;
    }

    try {
      const bookingId = generateBookingId();
      const baseBooking = {
        userId: currentUser.uid,
        userName: formValues.userName.trim(),
        userEmail: formValues.userEmail.trim(),
        userPhone: formValues.userPhone.trim(),
        roomId: selectedRoom.id,
        roomCategory: selectedRoom.category,
        roomName: selectedRoom.name,
        checkIn: Timestamp.fromDate(formValues.checkIn),
        checkOut: Timestamp.fromDate(formValues.checkOut),
        guests: Number(formValues.guests),
        occupancy: formValues.occupancy,
        roomRatePerNight: perNightPrice,
        totalAmount,
        subtotal,
        gstRate,
        gstAmount,
        gstPercentage: gstRate,
        paymentId: "",
        orderId: "",
        status: "pending_payment",
        paymentProvider: "payu",
        paymentStatus: "initiated",
        createdAt: serverTimestamp(),
        nights,
        source: "online",
      };

      const result = await createBookingWithInventoryLock({
        bookingId,
        bookingData: baseBooking,
        room: selectedRoom,
        checkIn: formValues.checkIn,
        checkOut: formValues.checkOut,
      });

      if (!result.success && result.reason === "ROOM_FULLY_BOOKED") {
        toast.error("This room was just booked by another guest. Please choose different dates.");
        setStep(1);
        return;
      }

      await pay({
        amount: totalAmount,
        bookingId,
        userName: formValues.userName,
        userEmail: formValues.userEmail,
        userPhone: formValues.userPhone,
        onFailure: async (error) => {
          await releaseBookingInventoryLock({
            bookingId,
            status: "payment_failed",
            paymentFailureReason: error?.message || "Payment could not be started.",
          });
          toast.error(error?.message || "Payment could not be started.");
        },
      });
    } catch (error) {
      toast.error(error.message || "Unable to complete the booking.");
    }
  };

  if (!isOpen || !selectedRoom) {
    return null;
  }

  const confirmationBooking = confirmation
    ? {
        id: confirmation.id,
        userName: formValues.userName,
        userEmail: formValues.userEmail,
        userPhone: formValues.userPhone,
        roomId: selectedRoom.id,
        roomCategory: selectedRoom.category,
        roomName: selectedRoom.name,
        checkIn: formValues.checkIn,
        checkOut: formValues.checkOut,
        guests: Number(formValues.guests),
        occupancy: formValues.occupancy,
        totalAmount,
        subtotal,
        gstAmount,
        gstRate,
        gstPercentage: gstRate,
        paymentId: confirmation.paymentId,
        orderId: confirmation.orderId,
        status: "confirmed",
        createdAt: new Date(),
        nights,
        source: "online",
      }
    : null;

  return (
    <div
      className="modal-shell booking-shell"
      role="dialog"
      aria-modal="true"
      aria-label="Booking modal"
    >
      <div
        className="modal-shell__backdrop"
        onClick={closeBooking}
        aria-hidden="true"
      />
      <div className="modal-card booking-modal booking-modal--advanced">
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

        <div className="booking-modal__steps booking-modal__steps--labeled">
          {stepLabels.map((label, index) => {
            const number = index + 1;
            return (
              <span key={label} className={step >= number ? "active" : ""}>
                <strong>{number}</strong>
                <small>{label}</small>
              </span>
            );
          })}
        </div>

        {step === 1 && (
          <div className="booking-step">
            <BookingCalendar
              checkIn={formValues.checkIn}
              checkOut={formValues.checkOut}
              availabilityCalendar={availabilityCalendar}
              totalAmount={totalAmount}
              onChange={({ checkIn, checkOut }) =>
                setFormValues((previous) => ({ ...previous, checkIn, checkOut }))
              }
            />
            <div className={`booking-availability ${isAvailable ? "is-open" : "is-full"}`}>
              <span>
                {availabilityLoading
                  ? "Checking live availability..."
                  : formValues.checkIn && formValues.checkOut
                    ? getAvailabilityLabel(rangeAvailability)
                    : "Select dates to check availability"}
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="booking-step booking-details-step">
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
                <div className="phone-input">
                  <span>+91</span>
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
                </div>
              </label>
              <label>
                Guests
                <div className="guest-stepper">
                  <button type="button" onClick={() => updateGuests(-1)} aria-label="Decrease guests">
                    <Minus size={15} />
                  </button>
                  <strong>{formValues.guests}</strong>
                  <button type="button" onClick={() => updateGuests(1)} aria-label="Increase guests">
                    <Plus size={15} />
                  </button>
                </div>
              </label>
            </div>

            <div className="booking-occupancy-cards">
              {[
                {
                  value: "single",
                  label: "Single Occupancy",
                  amount: selectedRoom.singlePrice,
                  icon: UserRound,
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
                  className={formValues.occupancy === value ? "active" : ""}
                  onClick={() =>
                    setFormValues((previous) => ({ ...previous, occupancy: value }))
                  }
                >
                  <Icon size={22} />
                  <span>{label}</span>
                  <strong>{formatCurrency(amount)}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="booking-step">
            <div className="summary-card summary-card--payment">
              <h4>Payment Summary</h4>
              <div>
                <span>Stay</span>
                <strong>
                  {formatDate(formValues.checkIn)} to {formatDate(formValues.checkOut)}
                </strong>
              </div>
              <div>
                <span>{formatCurrency(perNightPrice)} x {nights} night{nights === 1 ? "" : "s"}</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div>
                <span>{gstLabel}</span>
                <strong>{formatCurrency(gstAmount)}</strong>
              </div>
              <div className="summary-card__total">
                <span>Total</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            </div>
          </div>
        )}

        {step === 4 && confirmationBooking && (
          <div className="booking-step booking-step--confirmed">
            <div className="booking-confirmed__icon">
              <CheckCircle2 size={34} />
            </div>
            <h4>Booking Confirmed</h4>
            <p>Thank you, {formValues.userName}. Your reservation is complete.</p>
            <div className="booking-confirmed__details">
              <img src={selectedRoom.images?.[0]} alt={selectedRoom.name} />
              <div>
                <span>{selectedRoom.category} Room</span>
                <strong>{selectedRoom.name}</strong>
                <small>{formatCurrency(totalAmount)} paid</small>
              </div>
            </div>
            <div className="booking-confirmed__grid">
              <div><span>Check-in</span><strong>{formatDate(formValues.checkIn)}</strong></div>
              <div><span>Check-out</span><strong>{formatDate(formValues.checkOut)}</strong></div>
              <div><span>Guests</span><strong>{formValues.guests}</strong></div>
              <div><span>Booking ID</span><strong>{confirmation.id}</strong></div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  import("../utils/invoice").then((mod) => {
                    mod.openInvoiceWindow(confirmationBooking, selectedRoom);
                  });
                }}
              >
                <Download size={16} /> Print Invoice
              </button>
              <button type="button" className="btn btn-gold" onClick={closeBooking}>
                Done
              </button>
            </div>
          </div>
        )}

        {step < 4 && (
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
                <ShieldCheck size={16} />
                Live availability protects every booking
              </span>
            )}
            {step < 3 ? (
              <button
                type="button"
                className="btn btn-gold"
                onClick={handleNext}
                disabled={step === 1 && !isAvailable}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-gold"
                onClick={handleSubmit}
                disabled={processing || !isAvailable}
              >
                {processing ? "Processing..." : "Pay with PayU"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
