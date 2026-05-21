import { useEffect, useMemo, useState } from "react";
import { Check, PlayCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { useBooking } from "../context/BookingContext";
import AmenitiesSection from "../components/AmenitiesSection";
import PageHero from "../components/PageHero";
import RoomCard from "../components/RoomCard";
import SEOHead from "../components/SEOHead";
import { formatCurrency } from "../utils/dateHelpers";
import { ROOM_CATEGORIES } from "../utils/siteData";

const Rooms = () => {
  const [searchParams] = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState(null);

  const roomQuery = searchParams.get("room");

  const { openBooking } = useBooking();

  const { data: firebaseRooms } = useFirestoreCollection("rooms", {
    fallbackData: ROOM_CATEGORIES,
  });

  /*
    IMPORTANT FIX:
    Merge Firebase room data with local room videos.
  */
  const rooms = useMemo(() => {
    return firebaseRooms.map((firebaseRoom) => {
      const localRoom = ROOM_CATEGORIES.find(
        (room) => room.category === firebaseRoom.category
      );

      return {
        ...firebaseRoom,
        videoUrl: localRoom?.videoUrl || "",
      };
    });
  }, [firebaseRooms]);

  useEffect(() => {
    if (!rooms.length) return;

    const roomFromQuery = rooms.find(
      (room) => room.category === roomQuery
    );

    setSelectedRoom(roomFromQuery || rooms[0]);
  }, [roomQuery, rooms]);

  const visibleRooms = useMemo(() => rooms, [rooms]);

  return (
    <>
      <SEOHead
        title="Rooms & Suites | Bael Tree Hotels - Luxury Hotel in Madhapur, Hyderabad"
        description="Explore Standard, Executive, Premium, and Suite rooms at Bael Tree Hotels with refined interiors, premium amenities, and luxury hospitality."
        path="/rooms"
      />

      <PageHero
        eyebrow="Rooms & Suites"
        title="Refined stays for every rhythm of travel"
        description="From understated business comfort to indulgent suite living, each room category is designed with quiet texture, layered lighting, and service-led ease."
        image="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1800&q=80"
      />

      <section className="section">
        <div className="cards-grid">
          {visibleRooms.map((room) => (
            <div
              key={room.id}
              onMouseEnter={() => setSelectedRoom(room)}
            >
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      </section>

      {selectedRoom && (
        <section className="section room-detail reveal">
          <div className="room-detail__gallery">
            {selectedRoom.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${selectedRoom.name} gallery view ${index + 1}`}
                loading="lazy"
              />
            ))}
          </div>

          <div className="room-detail__content">
            <span className="eyebrow">
              {selectedRoom.tagline}
            </span>

            <h2>{selectedRoom.name}</h2>

            <p>{selectedRoom.description}</p>

            {selectedRoom.videoUrl ? (
              <video
                controls
                autoPlay
                muted
                loop
                playsInline
                poster={selectedRoom.images[0]}
                className="room-video"
              >
                <source
                  src={selectedRoom.videoUrl}
                  type="video/mp4"
                />
              </video>
            ) : (
              <div className="room-video room-video--placeholder">
                <PlayCircle size={34} />
                <span>No video available.</span>
              </div>
            )}

            <div className="pricing-table">
              <div>
                <span>Single Occupancy</span>
                <strong>
                  {formatCurrency(selectedRoom.singlePrice)}
                </strong>
              </div>

              <div>
                <span>Double Occupancy</span>
                <strong>
                  {formatCurrency(selectedRoom.doublePrice)}
                </strong>
              </div>

              <div>
                <span>Total Rooms</span>
                <strong>{selectedRoom.totalRooms}</strong>
              </div>
            </div>

            <div className="feature-list feature-list--detail">
              {selectedRoom.amenities.map((amenity) => (
                <div key={amenity}>
                  <Check size={16} />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-gold"
              onClick={() => openBooking(selectedRoom)}
            >
              Check Availability & Book
            </button>
          </div>
        </section>
      )}

      <AmenitiesSection />
    </>
  );
};

export default Rooms;