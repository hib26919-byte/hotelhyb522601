import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { DEFAULT_HERO_IMAGES } from "../utils/siteData";

const HeroSlider = () => {
  const { data: slides } = useFirestoreCollection("heroImages", {
    fallbackData: DEFAULT_HERO_IMAGES,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    // ── 5 seconds between slides (was 2s — too aggressive) ──
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="hero-slider" aria-label="Featured hotel visuals">
      {slides.map((slide, index) => (
        <div
          key={slide.id || index}
          className={`hero-slide ${activeIndex === index ? "is-active" : ""}`}
        >
          <img
            src={slide.image || slide.url}
            alt={slide.alt || "Luxury hotel visual"}
            className="hero-image"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
      <div className="hero-slider__controls">
        <button
          type="button"
          className="hero-slider__arrow"
          onClick={() =>
            setActiveIndex((activeIndex - 1 + slides.length) % slides.length)
          }
          aria-label="Previous hero image"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="hero-slider__arrow"
          onClick={() => setActiveIndex((activeIndex + 1) % slides.length)}
          aria-label="Next hero image"
        >
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="hero-slider__dots" aria-label="Hero image indicators">
        {slides.map((slide, index) => (
          <button
            key={slide.id || index}
            type="button"
            className={`hero-slider__dot ${activeIndex === index ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to hero image ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;