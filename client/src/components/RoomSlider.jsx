import { useEffect, useState } from "react";

const RoomSlider = ({
  images = [],
  title = "Room",
  onClick,
  showGalleryOverlay = false,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="room-slider" onClick={onClick} role="button" tabIndex={0}>
      {images.map((image, index) => (
        <img
          key={`${title}-${image}-${index}`}
          src={image}
          alt={`${title} gallery view ${index + 1}`}
          loading="lazy"
          className={`room-slider__image ${index === activeIndex ? "active" : ""}`}
        />
      ))}

      {showGalleryOverlay && (
        <div className="room-slider__gallery-overlay">
          <span>View Gallery</span>
        </div>
      )}

      {images.length > 1 && (
        <div className="room-slider__dots" aria-hidden="true">
          {images.map((_, index) => (
            <span key={index} className={activeIndex === index ? "active" : ""} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomSlider;
