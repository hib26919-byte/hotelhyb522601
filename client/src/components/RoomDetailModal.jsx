import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, ChevronLeft, ChevronRight, Play, Pause,
  BedDouble, Users, Check, Star, Calendar,
  Wifi, Coffee, Tv, Shield, Car, Phone,
  ZoomIn, Share2, Heart
} from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { formatCurrency } from "../utils/dateHelpers";

/* ─── icon map for amenity pills ─── */
const AMENITY_ICONS = {
  "Complimentary Wi-Fi": Wifi,
  "Smart TV with OTT": Tv,
  "Mini bar": Coffee,
  "Premium toiletries": Star,
  "Airport transfer": Car,
  "In-room safe": Shield,
  "Work desk": Calendar,
  "Travel desk assistance": Phone,
};

/* ─── Auto-scroll progress ring ─── */
const ProgressRing = ({ progress, size = 36, stroke = 3 }) => {
  const radius = (size - stroke * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={stroke}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke="#c9a84c"
        strokeWidth={stroke}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.1s linear" }}
      />
    </svg>
  );
};

/* ─── Floating close button ─── */
const CloseBtn = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Close room details"
    style={{
      position: "absolute",
      top: "1rem",
      right: "1rem",
      zIndex: 10,
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "rgba(26,26,26,0.85)",
      color: "#faf8f5",
      display: "grid",
      placeItems: "center",
      border: "1px solid rgba(201,168,76,0.3)",
      cursor: "pointer",
      backdropFilter: "blur(8px)",
      transition: "all 0.3s ease",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(123,26,26,0.9)"}
    onMouseLeave={e => e.currentTarget.style.background = "rgba(26,26,26,0.85)"}
  >
    <X size={18} />
  </button>
);

/* ─── Image / Video Gallery with Auto-Scroll ─── */
const AUTO_SCROLL_DURATION = 2000; // 2 seconds per slide

const MediaGallery = ({ images = [], videoUrl }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isWished, setIsWished] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedProgressRef = useRef(0);

  const allMedia = [...images];
  const totalSlides = allMedia.length;

  // ── Auto-scroll engine ──
  const startAutoScroll = useCallback(() => {
    if (totalSlides <= 1) return;
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
    startTimeRef.current = Date.now() - pausedProgressRef.current * AUTO_SCROLL_DURATION / 100;

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / AUTO_SCROLL_DURATION) * 100, 100);
      setProgress(pct);
    }, 50);

    intervalRef.current = setTimeout(() => {
      pausedProgressRef.current = 0;
      setActiveIndex(i => (i + 1) % totalSlides);
      setProgress(0);
    }, AUTO_SCROLL_DURATION - pausedProgressRef.current * AUTO_SCROLL_DURATION / 100);
  }, [totalSlides, allMedia]);

  const stopAutoScroll = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
    pausedProgressRef.current = progress;
  }, [progress]);

  const resumeAutoScroll = useCallback(() => {
    startAutoScroll();
  }, [startAutoScroll]);

  useEffect(() => {
    if (!autoScrollPaused) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(progressRef.current);
    };
  }, [activeIndex, autoScrollPaused]);

  const handleUserNav = (newIndex) => {
    pausedProgressRef.current = 0;
    setProgress(0);
    setActiveIndex(newIndex);
    // Pause briefly then resume
    setAutoScrollPaused(true);
    setTimeout(() => setAutoScrollPaused(false), 1500);
  };

  const goPrev = () => handleUserNav((activeIndex - 1 + totalSlides) % totalSlides);
  const goNext = () => handleUserNav((activeIndex + 1) % totalSlides);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };

  const handleMouseMove = (e) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const togglePause = () => {
    if (autoScrollPaused) {
      pausedProgressRef.current = progress;
      setAutoScrollPaused(false);
    } else {
      setAutoScrollPaused(true);
    }
  };

  return (
  <div
    style={{
      position: "relative",
      borderRadius: 24,
      overflow: "hidden",
      background: "#111",
      aspectRatio: "16/9",
    }}
  >

  

      {/* Images */}
      {images.map((src, i) => (
        <div
          key={i}
          style={{
            position: "absolute", inset: 0,
            opacity: activeIndex === i ? 1 : 0,
            transition: "opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: zoomed ? "zoom-out" : "zoom-in",
            overflow: "hidden",
          }}
          onClick={() => setZoomed(z => !z)}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setAutoScrollPaused(true)}
          onMouseLeave={() => {
            if (!zoomed) setAutoScrollPaused(false);
          }}
        >
          <img
            src={src}
            alt={`Room view ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transformOrigin: zoomed && activeIndex === i ? `${zoomPos.x}% ${zoomPos.y}%` : "center",
              transform: zoomed && activeIndex === i ? "scale(2)" : "scale(1)",
              transition: zoomed ? "transform 0.1s ease" : "transform 0.5s ease",
              userSelect: "none",
            }}
            draggable={false}
          />
        </div>
      ))}

      {/* Floating Video Reel */}
{videoUrl && (
  <div
    style={{
      position: "absolute",
      right: 18,
      bottom: 18,
      width: 165,
      height: 300,
      borderRadius: "28px",
      overflow: "hidden",
      background: "#000",
      zIndex: 25,
      boxShadow:
        "0 30px 80px rgba(0,0,0,0.55)",
      border:
        "2px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(20px)",
      transform: "translateZ(0)",
    }}
  >
    {/* Instagram-style top bar */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg,#c9a84c,#7b1a1a)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: "0.7rem",
            fontWeight: 700,
          }}
        >
          BT
        </div>

        <div>
          <div
            style={{
              color: "#fff",
              fontSize: "0.72rem",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            Bael Tree
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.6rem",
              marginTop: 2,
            }}
          >
            Luxury Stay
          </div>
        </div>
      </div>

      <div
        style={{
          color: "#fff",
          fontSize: "1rem",
          fontWeight: 700,
        }}
      >
        ⋮
      </div>
    </div>

    {/* VIDEO */}
    <video
      ref={videoRef}
      src={videoUrl}
      autoPlay
      muted
      loop
      playsInline
      controls
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />

    {/* Bottom overlay */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "14px",
        background:
          "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
        zIndex: 5,
      }}
    >
      <div
        style={{
          color: "#fff",
          fontSize: "0.72rem",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Luxury Room
      </div>

      <div
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: "0.62rem",
          lineHeight: 1.4,
        }}
      >
        Experience luxury hospitality at
        Bael Tree Hotels.
      </div>
    </div>
  </div>
)}

 
      {/* Gradient overlays */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(90deg, rgba(0,0,0,0.2) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.2) 100%)",
      }} />

      {/* Top-right action buttons */}
      <div style={{
        position: "absolute", top: 12, right: 12, zIndex: 5,
        display: "flex", gap: "0.5rem",
      }}>
        <button
          type="button"
          onClick={() => setIsWished(w => !w)}
          aria-label="Wishlist"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(26,26,26,0.7)",
            color: isWished ? "#e84c4c" : "#faf8f5",
            border: "none", cursor: "pointer",
            display: "grid", placeItems: "center",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease",
          }}
        >
          <Heart size={15} fill={isWished ? "#e84c4c" : "none"} />
        </button>
        <button
          type="button"
          onClick={() => setZoomed(z => !z)}
          aria-label="Zoom"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(26,26,26,0.7)",
            color: "#faf8f5", border: "none", cursor: "pointer",
            display: "grid", placeItems: "center",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s ease",
          }}
        >
          <ZoomIn size={15} />
        </button>
      </div>

      {/* Navigation arrows */}
      {totalSlides > 1 && !zoomed && (
        <>
          <button type="button" onClick={goPrev} aria-label="Previous" style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
            display: "grid", placeItems: "center",
            transition: "all 0.25s ease", zIndex: 5,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.85)"; e.currentTarget.style.color = "#1a1a1a"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
          >
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={goNext} aria-label="Next" style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
            display: "grid", placeItems: "center",
            transition: "all 0.25s ease", zIndex: 5,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.85)"; e.currentTarget.style.color = "#1a1a1a"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Bottom controls bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 5,
        padding: "1rem 1rem 0.75rem",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        background: "linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)",
      }}>
        {/* Thumbnail strip */}
        <div style={{
          display: "flex", gap: 6,
          overflowX: "auto", scrollbarWidth: "none",
          maxWidth: "calc(100% - 120px)",
        }}>
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleUserNav(i)}
              style={{
                flexShrink: 0, width: 48, height: 36,
                borderRadius: 8, overflow: "hidden",
                border: activeIndex === i ? "2px solid #c9a84c" : "2px solid rgba(255,255,255,0.25)",
                cursor: "pointer", padding: 0,
                transition: "all 0.25s ease",
                opacity: activeIndex === i ? 1 : 0.65,
              }}
            >
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}

        </div>

        {/* Auto-scroll control */}
        {totalSlides > 1 && (
          <button
            type="button"
            onClick={togglePause}
            aria-label={autoScrollPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
            style={{
              position: "relative", width: 36, height: 36,
              borderRadius: "50%", border: "none", cursor: "pointer",
              background: "rgba(26,26,26,0.6)", backdropFilter: "blur(8px)",
              display: "grid", placeItems: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ position: "absolute", inset: 0 }}>
              <ProgressRing progress={autoScrollPaused ? pausedProgressRef.current : progress} size={36} stroke={3} />
            </div>
            {autoScrollPaused
              ? <Play size={12} color="#c9a84c" style={{ marginLeft: 2 }} />
              : <Pause size={12} color="#c9a84c" />}
          </button>
        )}
      </div>

      {/* Slide counter */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 5,
        padding: "0.3rem 0.7rem", borderRadius: 999,
        background: "rgba(26,26,26,0.65)", backdropFilter: "blur(8px)",
        color: "#faf8f5", fontSize: "0.75rem", fontWeight: 600,
        letterSpacing: "0.06em",
      }}>
        {activeIndex + 1} / {totalSlides}
      </div>

      {/* Zoom hint */}
      {zoomed && (
        <div style={{
          position: "absolute", bottom: "3.5rem", left: "50%", transform: "translateX(-50%)",
          padding: "0.35rem 0.85rem", borderRadius: 999,
          background: "rgba(201,168,76,0.9)", color: "#1a1a1a",
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em",
          zIndex: 6, pointerEvents: "none",
        }}>
          Click to exit zoom
        </div>
      )}
    </div>
  );
};

/* ─── Main Room Detail Modal ─── */
const RoomDetailModal = ({ room, onClose }) => {
  const { openBooking } = useBooking();
  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!room) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${room.name} details`}
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        display: "grid", placeItems: "center",
        padding: "1rem",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(8,8,8,0.82)",
          backdropFilter: "blur(16px)",
        }}
      />

      {/* Modal card */}
      <div
        ref={modalRef}
        style={{
          position: "relative", zIndex: 1,
          width: "min(1100px, calc(100vw - 1rem))",
          maxHeight: "94vh",
          overflowY: "auto",
          borderRadius: 32,
          background: "linear-gradient(180deg, #fffdf9 0%, #faf8f5 100%)",
          border: "1px solid rgba(201,168,76,0.3)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,168,76,0.1)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(201,168,76,0.3) transparent",
          animation: "modalEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <CloseBtn onClick={onClose} />

        {/* Top: full-width media */}
        <div style={{ borderRadius: "32px 32px 0 0", overflow: "hidden" }}>
<MediaGallery
  images={room.images || []}
  videoUrl={room.videoUrl}
/>

        </div>

        


        {/* Content grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "2rem",
            padding: "2rem",
          }}
          className="room-modal-grid"
        >
          {/* LEFT column */}
          <div style={{ display: "grid", gap: "1.75rem" }}>

            {/* Title block */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.6rem" }}>
                <span style={{ width: 32, height: 1, background: "linear-gradient(90deg, #c9a84c, transparent)" }} />
                <span style={{
                  color: "#7b1a1a", fontFamily: "'Cinzel', serif",
                  fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase",
                }}>
                  {room.tagline}
                </span>
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.9rem, 3.5vw, 2.9rem)",
                lineHeight: 1.1, margin: "0 0 0.6rem",
                color: "#1a1a1a",
              }}>{room.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={14} fill="#c9a84c" color="#c9a84c" />
                ))}
                <span style={{ fontSize: "0.82rem", color: "#8f8579", marginLeft: 4 }}>
                  Premium Luxury · {room.totalRooms} Rooms Available
                </span>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.15rem", lineHeight: 1.85,
              color: "rgba(26,26,26,0.78)",
              borderLeft: "3px solid rgba(201,168,76,0.4)",
              paddingLeft: "1rem",
            }}>{room.description}</p>

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div>
                <h4 style={{
                  fontFamily: "'Cinzel', serif", fontSize: "0.78rem",
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "#7b1a1a", marginBottom: "0.9rem",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ width: 20, height: 1, background: "#c9a84c", display: "inline-block" }} />
                  Room Amenities
                </h4>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
                  gap: "0.6rem",
                }}>
                  {room.amenities.map(amenity => {
                    const Icon = AMENITY_ICONS[amenity] || Check;
                    return (
                      <div key={amenity} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "0.7rem 1rem", borderRadius: 14,
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(201,168,76,0.18)",
                        fontSize: "0.85rem", color: "#2c2c2c",
                        transition: "all 0.25s ease",
                        cursor: "default",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.85)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.18)"; }}
                      >
                        <Icon size={15} color="#c9a84c" />
                        <span>{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Room facts */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.85rem",
            }}>
              {[
                { label: "Total Rooms", value: room.totalRooms, icon: "🏨" },
                { label: "Max Guests", value: room.category === "suite" ? "4" : room.category === "premium" ? "3" : "2", icon: "👥" },
                { label: "Status", value: room.isAvailable ? "Available" : "Unavailable", icon: room.isAvailable ? "✓" : "✗", color: room.isAvailable ? "#73d98f" : "#ff8f8f" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{
                  padding: "1.1rem", borderRadius: 20, textAlign: "center",
                  background: "linear-gradient(145deg, rgba(26,26,26,0.94), rgba(123,26,26,0.88))",
                  color: "#faf8f5",
                  border: "1px solid rgba(201,168,76,0.15)",
                }}>
                  <div style={{ fontSize: "1.1rem", marginBottom: 4 }}>{icon}</div>
                  <div style={{
                    fontFamily: "'Playfair Display', serif", fontSize: "1.5rem",
                    color: color || "#c9a84c",
                  }}>{value}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(250,248,245,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Policies */}
            <div style={{
              padding: "1.25rem", borderRadius: 20,
              background: "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(201,168,76,0.02))",
              border: "1px solid rgba(201,168,76,0.18)",
            }}>
              <h4 style={{
                fontFamily: "'Cinzel', serif", fontSize: "0.75rem",
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "#7b1a1a", marginBottom: "0.75rem",
              }}>Stay Policies</h4>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {[
                  "Check-in from 2:00 PM · Check-out by 11:00 AM",
                  "Free cancellation within 24 hours of booking",
                  "Complimentary breakfast for Premium & Suite rooms",
                  "Airport transfer available on request",
                ].map(item => (
                  <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.86rem", color: "#5a5a5a" }}>
                    <Check size={14} color="#73d98f" style={{ flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT column — sticky pricing */}
          <div>
            <div style={{
              position: "sticky", top: "1rem",
              borderRadius: 26,
              background: "linear-gradient(180deg, #fff 0%, #fffdf9 100%)",
              border: "1px solid rgba(201,168,76,0.35)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              padding: "1.5rem",
              display: "grid", gap: "1rem",
            }}>

              {/* Availability badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "0.5rem 0.85rem", borderRadius: 999,
                background: room.isAvailable ? "rgba(115,217,143,0.1)" : "rgba(255,143,143,0.1)",
                border: `1px solid ${room.isAvailable ? "rgba(115,217,143,0.35)" : "rgba(255,143,143,0.35)"}`,
                width: "fit-content",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: room.isAvailable ? "#73d98f" : "#ff8f8f",
                  boxShadow: `0 0 8px ${room.isAvailable ? "rgba(115,217,143,0.6)" : "rgba(255,143,143,0.6)"}`,
                  animation: "statusPulse 2s ease-in-out infinite",
                }} />
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: room.isAvailable ? "#1f7c2d" : "#aa2c2c" }}>
                  {room.isAvailable ? "Available to Book" : "Currently Unavailable"}
                </span>
              </div>

              {/* Single occupancy */}
              <div style={{
                padding: "1rem 1.1rem", borderRadius: 18,
                background: "rgba(201,168,76,0.07)",
                border: "1px solid rgba(201,168,76,0.22)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2c2c2c", marginBottom: 6 }}>
                  <BedDouble size={15} color="#c9a84c" />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Single Occupancy
                  </span>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#1a1a1a", lineHeight: 1 }}>
                  {formatCurrency(room.singlePrice)}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#8f8579", marginTop: 4 }}>per night · taxes extra</div>
              </div>

              {/* Double occupancy */}
              <div style={{
                padding: "1rem 1.1rem", borderRadius: 18,
                background: "rgba(123,26,26,0.05)",
                border: "1px solid rgba(123,26,26,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2c2c2c", marginBottom: 6 }}>
                  <Users size={15} color="#7b1a1a" />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Double Occupancy
                  </span>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#1a1a1a", lineHeight: 1 }}>
                  {formatCurrency(room.doublePrice)}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#8f8579", marginTop: 4 }}>per night · taxes extra</div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => { onClose(); openBooking(room); }}
                disabled={!room.isAvailable}
                style={{
                  width: "100%", padding: "1.1rem",
                  borderRadius: 999, border: "none",
                  background: room.isAvailable
                    ? "linear-gradient(135deg, #e8d5a3, #c9a84c)"
                    : "rgba(200,200,200,0.4)",
                  color: room.isAvailable ? "#1a1a1a" : "#888",
                  fontWeight: 700, fontSize: "0.95rem", cursor: room.isAvailable ? "pointer" : "not-allowed",
                  boxShadow: room.isAvailable ? "0 12px 28px rgba(201,168,76,0.3)" : "none",
                  transition: "all 0.3s ease",
                  letterSpacing: "0.04em",
                  fontFamily: "'Cinzel', serif",
                }}
                onMouseEnter={e => { if (room.isAvailable) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(201,168,76,0.45)"; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = room.isAvailable ? "0 12px 28px rgba(201,168,76,0.3)" : "none"; }}
              >
                Reserve This Room
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "100%", padding: "0.8rem",
                  borderRadius: 999,
                  border: "1px solid rgba(201,168,76,0.3)",
                  background: "transparent",
                  color: "#5a5a5a", fontSize: "0.85rem", cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                Continue Browsing
              </button>

              {/* Trust indicators */}
              <div style={{
                display: "grid", gap: "0.45rem",
                padding: "0.9rem",
                borderRadius: 16,
                background: "rgba(26,26,26,0.03)",
                border: "1px solid rgba(201,168,76,0.1)",
              }}>
                {[
                  "Free cancellation within 24 hours",
                  "Complimentary Wi-Fi throughout",
                  "Check-in 2PM · Check-out 11AM",
                  "Secure Razorpay payments",
                ].map(item => (
                  <div key={item} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.78rem", color: "#5a5a5a" }}>
                    <Check size={12} color="#73d98f" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalEntrance {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .room-modal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RoomDetailModal;