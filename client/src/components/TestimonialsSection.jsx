import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { TESTIMONIALS } from "../utils/siteData";
import SectionHeading from "./SectionHeading";

const TestimonialsSection = () => {
  const { data: testimonials } = useFirestoreCollection("testimonials", {
    fallbackData: TESTIMONIALS,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="section testimonials-section">
      <SectionHeading
        eyebrow="Guest Stories"
        title="What guests remember most"
        description="A few reflections from travellers who came for convenience and stayed for the atmosphere."
        centered
      />
      <div className="testimonials-carousel reveal">
        {testimonials.map((testimonial, index) => (
          <article
            key={testimonial.id || testimonial.name}
            className={`testimonial-card ${activeIndex === index ? "active" : ""}`}
          >
            <div className="testimonial-card__avatar">{testimonial.name.slice(0, 1)}</div>
            <div className="testimonial-card__stars">
              {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                <Star key={starIndex} size={16} fill="#C9A84C" color="#C9A84C" />
              ))}
            </div>
            <p>"{testimonial.text}"</p>
            <strong>{testimonial.name}</strong>
            <span>{testimonial.location}</span>
          </article>
        ))}
      </div>
      <div className="hero-slider__dots">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.id || testimonial.name}
            type="button"
            className={`hero-slider__dot ${activeIndex === index ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`View testimonial ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;

