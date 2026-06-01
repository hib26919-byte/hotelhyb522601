import { useMemo, useState } from "react";
import { where } from "firebase/firestore";
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
import { useFirestoreCollection } from "../hooks/useFirestore";
import {
  calculateAvailabilityFromLocks,
  getAvailabilityLabel,
  getRoomTotal,
} from "../utils/availability";
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

const RoomCard = ({ room }) => {
  const { openBooking } = useBooking();
  const [showDetail, setShowDetail] = useState(false);
  const [occupancy, setOccupancy] = useState("single");

  const lockConstraints = useMemo(
    () => (room?.category ? [where("category", "==", room.category.toLowerCase())] : []),
    [room?.category],
  );
  const { data: availabilityLocks } = useFirestoreCollection("availabilityLocks", {
    fallbackData: [],
    queryConstraints: lockConstraints,
    enabled: Boolean(room?.category),
    realtime: true,
  });

  const tonightAvailability = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return calculateAvailabilityFromLocks({
      locks: availabilityLocks,
      category: room.category,
      checkIn: today,
      checkOut: tomorrow,
      totalRooms: getRoomTotal(room),
    });
  }, [availabilityLocks, room]);

  const price = occupancy === "double" ? room.doublePrice : room.singlePrice;
  const availabilityClass =
    tonightAvailability.available <= 0
      ? "is-full"
      : tonightAvailability.available <= 3
        ? "is-limited"
        : "is-open";

  return (
    <>
      <article className="room-card room-card--editorial reveal">
        <div className="room-card__media">
          <RoomSlider
            images={room.images}
            title={room.name}
            onClick={() => setShowDetail(true)}
            showGalleryOverlay
          />
          <span className="room-card__category">
            {(room.category || "room").toUpperCase()}
          </span>
        </div>

        <div className="room-card__content">
          <div className="room-card__ornament" />
          <h3>{room.name}</h3>
          <p className="room-card__tagline">{room.tagline}</p>

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
            {(room.amenities || []).slice(0, 4).map((amenity) => {
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
            <span>{getAvailabilityLabel(tonightAvailability)}</span>
          </div>

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
              onClick={() => openBooking({ ...room, preferredOccupancy: occupancy })}
              disabled={tonightAvailability.available <= 0}
            >
              Book Now
            </button>
          </div>
        </div>
      </article>

      {showDetail && (
        <RoomDetailModal
          room={room}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
};

export default RoomCard;
