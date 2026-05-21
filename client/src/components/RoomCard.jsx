import { useState } from "react";
import { ArrowRight, BedSingle, Users } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { formatCurrency } from "../utils/dateHelpers";
import RoomSlider from "./RoomSlider";
import RoomDetailModal from "./RoomDetailModal";

const RoomCard = ({ room }) => {
  const { openBooking } = useBooking();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <article className="room-card reveal">
        <RoomSlider
          images={room.images}
          title={room.name}
          onClick={() => setShowDetail(true)}
        />
        <div className="room-card__content">
          <span className="eyebrow">{room.tagline}</span>
          <h3>{room.name}</h3>
          <p>{room.description}</p>
          <div className="room-card__pricing">
            <div>
              <BedSingle size={16} />
              <span>{formatCurrency(room.singlePrice)} single</span>
            </div>
            <div>
              <Users size={16} />
              <span>{formatCurrency(room.doublePrice)} double</span>
            </div>
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
              onClick={() => openBooking(room)}
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