import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mouse } from "lucide-react";
import { Link } from "react-router-dom";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { DEFAULT_HERO_IMAGES } from "../utils/siteData";

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD = 50;

const HeroSlider = () => {
  const { data: slides } = useFirestoreCollection("heroImages", {
    fallbackData: DEFAULT_HERO_IMAGES,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const touchStart = useRef(null);
  const heroRef = useRef(null);

  const goTo = useCallback(
    (nextIndex) => {
      if (!slides.length) return;
      setActiveIndex((nextIndex + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrevious = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (activeIndex > slides.length - 1) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    const firstImage = slides[0]?.image || slides[0]?.url;
    if (!firstImage) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = firstImage;
    document.head.appendChild(link);
    return () => link.remove();
  }, [slides]);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 100);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isVisible || slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isVisible, slides.length]);

  const handleTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) >= SWIPE_THRESHOLD) {
      if (distance < 0) goNext();
      else goPrevious();
    }
    touchStart.current = null;
  };

  return (
    <section
      ref={heroRef}
      className="hero-slider hero-slider--advanced"
      aria-label="Bael Tree Hotels featured visuals"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => {
        const image = slide.image || slide.url;
        return (
          <div
            key={slide.id || image || index}
            className={`hero-slide ${activeIndex === index ? "is-active" : ""}`}
            aria-hidden={activeIndex !== index}
          >
            <img
              src={image}
              alt={slide.alt || "Bael Tree Hotels luxury visual"}
              className="hero-image"
              loading={index === 0 ? "eager" : "lazy"}
              decoding={index === 0 ? "sync" : "async"}
            />
          </div>
        );
      })}

      <div className="hero-copy">
        <div className="hero-copy__label">MADHAPUR · HYDERABAD</div>
        <div className="hero-copy__rule" />
        <h1>
          Where Elegance
          <span>Meets Heritage</span>
        </h1>
        <p>85 Rooms of Refined Luxury in the Heart of Hyderabad</p>
        <div className="hero-copy__actions">
          <Link to="/rooms" className="btn btn-gold hero-btn hero-btn--gold">
            Explore Rooms
          </Link>
          <Link to="/booking" className="btn hero-btn hero-btn--outline">
            Book a Stay
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="hero-slider__controls">
            <button
              type="button"
              className="hero-slider__arrow"
              onClick={goPrevious}
              aria-label="Previous hero image"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="hero-slider__arrow"
              onClick={goNext}
              aria-label="Next hero image"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="hero-slider__lines" aria-label="Hero image indicators">
            {slides.map((slide, index) => (
              <button
                key={slide.id || index}
                type="button"
                className={activeIndex === index ? "active" : ""}
                onClick={() => goTo(index)}
                aria-label={`Go to hero image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <div className={`hero-scroll ${hasScrolled ? "is-hidden" : ""}`} aria-hidden="true">
        <Mouse size={21} />
        <span />
      </div>
    </section>
  );
};

export default HeroSlider;
