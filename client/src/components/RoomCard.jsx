import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Car,
  Coffee,
  Circle,
  ShieldCheck,
  Sparkles,
  Tv,
  Wifi,
  Wind,
} from "lucide-react";
import { useBooking } from "../context/BookingContext";
import {
  calculateAvailability,
  getTotalRooms,
  withRoomConfig,
} from "../utils/roomConfig";
import { formatCurrency } from "../utils/dateHelpers";
import RoomSlider from "./RoomSlider";
import RoomDetailModal from "./RoomDetailModal";

const amenityIcons = [
  { match: "wi-fi", icon: Wifi },
  { match: "wifi", icon: Wifi },
  { match: "tv", icon: Tv },
  { match: "coffee", icon: Coffee },
  { match: "bar", icon: Coffee },
  { match: "safe", icon: ShieldCheck },
  { match: "desk", icon: Briefcase },
  { match: "service", icon: Bell },
  { match: "transfer", icon: Car },
  { match: "air", icon: Wind },
  { match: "toiletries", icon: Sparkles },
  { match: "bedding", icon: Sparkles },
];

const getAmenityIcon = (amenity = "") => {
  const match = amenityIcons.find((item) => amenity.toLowerCase().includes(item.match));
  return match?.icon || Circle;
};

const RoomCard = ({ room, availabilityToday }) => {
  const { openBooking } = useBooking();
  const [showDetail, setShowDetail] = useState(false);
  const [occupancy, setOccupancy] = useState("single");
  const configuredRoom = withRoomConfig(room);
  const tonightAvailability = availabilityToday || {
    ...calculateAvailability(configuredRoom.category, 0),
    loading: true,
    error: null,
  };
  const isLoading = tonightAvailability.loading;
  const hasAvailabilityError = Boolean(tonightAvailability.error);
  const isFull = !isLoading && !hasAvailabilityError && tonightAvailability.isFull;
  const price = occupancy === "double" ? configuredRoom.doublePrice : configuredRoom.singlePrice;
  const availabilityClass =
    isLoading
      ? "is-loading"
      : hasAvailabilityError
      ? "is-loading"
      : isFull
      ? "is-full"
      : tonightAvailability.isLimited
        ? "is-limited"
        : "is-open";
  const availabilityLabel = isLoading
    ? "Checking today's availability..."
    : hasAvailabilityError
      ? "Availability unavailable"
    : isFull
      ? "Fully Booked Today"
      : tonightAvailability.isLimited
        ? `Only ${tonightAvailability.available} left today`
        : `${tonightAvailability.available} rooms available today`;

  return (
    <>
      <article className={`room-card room-card--editorial reveal ${isFull ? "room-card--full" : ""}`}>
        <div className="room-card__media">
          <RoomSlider
            images={configuredRoom.images}
            title={configuredRoom.name}
            onClick={() => setShowDetail(true)}
            showGalleryOverlay
          />
          <span className="room-card__category">
            {(configuredRoom.category || "room").toUpperCase()}
          </span>
        </div>

        <div className="room-card__content">
          <div className="room-card__ornament" />
          <h3>{configuredRoom.name}</h3>
          <p className="room-card__tagline">{configuredRoom.tagline}</p>

          <div className="room-card__price-row">
            <div>
              <span>from</span>
              <strong>{formatCurrency(price)}</strong>
              <small>/night</small>
            </div>
            <div className="room-card__toggle" aria-label="Occupancy pricing">
              {["single", "double"].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={occupancy === type ? "active" : ""}
                  onClick={() => setOccupancy(type)}
                >
                  {type === "single" ? "Single" : "Double"}
                </button>
              ))}
            </div>
          </div>

          <div className="room-card__amenities">
            {(configuredRoom.amenities || []).slice(0, 4).map((amenity) => {
              const Icon = getAmenityIcon(amenity);
              return (
                <span key={amenity}>
                  <Icon size={13} />
                  {amenity}
                </span>
              );
            })}
          </div>

          <div className={`room-card__availability ${availabilityClass}`}>
            <i />
            <span>{availabilityLabel}</span>
          </div>

          {isFull && (
            <p className="room-card__fully-booked-note">
              All {getTotalRooms(configuredRoom.category)} rooms are occupied today. Open details to check future dates.
            </p>
          )}

          <div className="room-card__actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowDetail(true)}
            >
              View Details
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => openBooking({ ...configuredRoom, preferredOccupancy: occupancy })}
              disabled={isLoading || hasAvailabilityError || isFull}
            >
              {isLoading ? "Checking..." : hasAvailabilityError ? "Unavailable" : isFull ? "Fully Booked Today" : "Book Now"}
            </button>
          </div>
        </div>
      </article>

      {showDetail && (
        <RoomDetailModal
          room={configuredRoom}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
};

export default RoomCard;
