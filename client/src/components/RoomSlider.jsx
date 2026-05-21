import { useEffect, useState } from "react";

const RoomSlider = ({
  images = [],
  title = "Room",
  onClick,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [images]);

  return (
    <div
      className="room-slider"
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        height: "320px",
        cursor: "pointer",
        background: "#111",
      }}
    >
      {/* IMAGE SLIDES */}
      {images.map((image, index) => (
        <img
          key={`${title}-${index}`}
          src={image}
          alt={`${title}-${index}`}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "opacity 0.8s ease",
            opacity: index === activeIndex ? 1 : 0,
          }}
        />
      ))}

      {/* DARK OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0.1))",
          zIndex: 2,
        }}
      />

      {/* DOTS */}
      <div
        style={{
          position: "absolute",
          bottom: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          zIndex: 5,
        }}
      >
        {images.map((_, index) => (
          <span
            key={index}
            style={{
              width: activeIndex === index ? "24px" : "8px",
              height: "8px",
              borderRadius: "999px",
              background:
                activeIndex === index
                  ? "#d4af37"
                  : "rgba(255,255,255,0.5)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default RoomSlider;