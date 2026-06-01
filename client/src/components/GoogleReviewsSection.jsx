import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Star } from "lucide-react";

const GOOGLE_REVIEWS_URL =
  "https://www.google.com/travel/search?q=bael%20tree%20hotel&g2lb=4965990%2C72471280%2C72560029%2C72573224%2C72647020%2C72686036%2C72803964%2C72882230%2C73064764&hl=en-IN&gl=in&cs=1&ssta=1&ts=CAEaRwopEicyJTB4M2JjYjkxMDA1MTVkMjY4OToweDEyMzg3ODAxMWM0OWQzMzESGhIUCgcI6g8QBhgHEgcI6g8QBhgIGAEyAhAA&qs=CAEyE0Nnb0lzYWFuNHBHQW5wd1NFQUU4AkIJCTHTSRwBeDgSQgkJMdNJHAF4OBI&ap=ugEHcmV2aWV3cw&ictx=111&ved=0CAAQ5JsGahcKEwjo7NrsguWUAxUAAAAAHQAAAAAQBg";

const REVIEWS = [
  { name: "Arjun Mehta", location: "Mumbai", rating: 5, date: "November 2024", text: "An absolutely magnificent stay. The Executive Room exceeded every expectation - impeccable cleanliness, warm staff, and a location that's unbeatable for business travel to Hitec City.", avatar: "AM" },
  { name: "Priya Nair", location: "Bangalore", rating: 5, date: "December 2024", text: "Bael Tree Hotels redefines luxury in Hyderabad. The Suite Room is breathtaking. Kadali Patra restaurant served the most divine vegetarian cuisine I've had in years.", avatar: "PN" },
  { name: "Rahul Sharma", location: "Delhi", rating: 5, date: "October 2024", text: "Stayed for a week for a conference at Hitex. The Premium Room was spotless, the breakfast spread was extraordinary, and the staff remembered my name every single day.", avatar: "RS" },
  { name: "Fatima Khan", location: "Chennai", rating: 5, date: "January 2025", text: "Perfect urban retreat. The Heritage Suite blends modern comforts with old-world charm. In-room dining at midnight was a lifesaver. Will always choose Bael Tree.", avatar: "FK" },
  { name: "Vikram Reddy", location: "Hyderabad", rating: 5, date: "February 2025", text: "As a local, I recommend this hotel to every out-of-town guest. The Soul Curry restaurant is worth visiting even if you're not staying. Phenomenal service throughout.", avatar: "VR" },
  { name: "Sneha Iyer", location: "Pune", rating: 4, date: "March 2025", text: "Fantastic value for the price. The Executive Room had everything I needed - fast WiFi, great TV, comfortable bed. The airport transfer service was prompt and professional.", avatar: "SI" },
  { name: "Mohammed Salim", location: "Dubai", rating: 5, date: "September 2024", text: "On a business visit to Hyderabad, Bael Tree was recommended by a colleague. I'm now a loyal guest. The Premium Room's amenities rival five-star properties at a fraction of the cost.", avatar: "MS" },
  { name: "Ananya Gupta", location: "Kolkata", rating: 5, date: "April 2025", text: "Celebrated our anniversary in the Suite Room. The staff arranged a beautiful surprise setup - candles, flowers, and a personalised welcome note. Truly memorable.", avatar: "AG" },
  { name: "Suresh Patel", location: "Ahmedabad", rating: 5, date: "August 2024", text: "Clean, elegant, and centrally located. The housekeeping team is exceptional - our room was refreshed twice daily. Highly recommend the Standard rooms for budget-conscious travellers.", avatar: "SP" },
  { name: "Divya Krishnan", location: "Kochi", rating: 5, date: "May 2025", text: "The best hotel experience I've had in Hyderabad. Warm hospitality, stunning interiors, and cuisine that genuinely surprised me. Bael Tree Hotels has set the gold standard.", avatar: "DK" },
];

const getVisibleCount = () => {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
};

const openReviews = () => {
  window.open(GOOGLE_REVIEWS_URL, "_blank", "noopener,noreferrer");
};

const GoogleBadge = () => (
  <span className="google-reviews__badge">
    <span className="google-mark">G</span>
    <strong>4.8</strong>
    <Star size={14} fill="#c9a84c" color="#c9a84c" />
    <span>on Google</span>
  </span>
);

const ReviewCard = ({ review }) => (
  <article className="google-review-card">
    <div className="google-review-card__top">
      <div className="google-review-card__avatar">{review.avatar}</div>
      <div>
        <h3>{review.name}</h3>
        <p>{review.location}</p>
      </div>
    </div>
    <div className="google-review-card__rating">
      <span>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            size={15}
            fill={index < review.rating ? "#c9a84c" : "transparent"}
            color="#c9a84c"
          />
        ))}
      </span>
      <small>{review.date}</small>
    </div>
    <p className="google-review-card__text">"{review.text}"</p>
    <div className="google-review-card__source">
      <span className="google-mark">G</span>
      via Google
    </div>
  </article>
);

const GoogleReviewsSection = () => {
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);
  const [trackIndex, setTrackIndex] = useState(visibleCount);
  const [paused, setPaused] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const pressTimer = useRef(null);

  const slides = useMemo(() => {
    const leading = REVIEWS.slice(-visibleCount);
    const trailing = REVIEWS.slice(0, visibleCount);
    return [...leading, ...REVIEWS, ...trailing];
  }, [visibleCount]);

  const activeIndex =
    ((trackIndex - visibleCount) % REVIEWS.length + REVIEWS.length) % REVIEWS.length;

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setTransitionEnabled(false);
    setTrackIndex(visibleCount);
    const frame = requestAnimationFrame(() => setTransitionEnabled(true));
    return () => cancelAnimationFrame(frame);
  }, [visibleCount]);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => {
      setTrackIndex((index) => index + 1);
    }, 3500);
    return () => clearInterval(timer);
  }, [paused]);

  const handleTransitionEnd = () => {
    if (trackIndex >= REVIEWS.length + visibleCount) {
      setTransitionEnabled(false);
      setTrackIndex(visibleCount);
      requestAnimationFrame(() => setTransitionEnabled(true));
    }
    if (trackIndex < visibleCount) {
      setTransitionEnabled(false);
      setTrackIndex(REVIEWS.length + visibleCount - 1);
      requestAnimationFrame(() => setTransitionEnabled(true));
    }
  };

  const handlePointerDown = () => {
    setPaused(true);
    pressTimer.current = window.setTimeout(openReviews, 300);
  };

  const releasePointer = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
    setPaused(false);
  };

  return (
    <section className="google-reviews-section">
      <div className="google-reviews__inner">
        <div className="google-reviews__heading reveal">
          <div className="divider-gold" />
          <span className="google-reviews__eyebrow">Guest Experiences</span>
          <div className="google-reviews__title-row">
            <h2>What Our Guests Say</h2>
            <GoogleBadge />
          </div>
          <p>Trusted by travellers from across India and beyond</p>
        </div>

        <div
          className="google-reviews__viewport"
          onPointerDown={handlePointerDown}
          onPointerUp={releasePointer}
          onPointerCancel={releasePointer}
          onPointerLeave={releasePointer}
        >
          <div
            className="google-reviews__track"
            style={{
              "--review-visible": visibleCount,
              transform: `translateX(-${(trackIndex * 100) / visibleCount}%)`,
              transition: transitionEnabled ? "transform 600ms ease-in-out" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {slides.map((review, index) => (
              <div className="google-reviews__slide" key={`${review.name}-${index}`}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        <button type="button" className="google-reviews__link" onClick={openReviews}>
          View All Reviews on Google <ExternalLink size={14} />
        </button>

        <div className="google-reviews__dots" aria-label="Google review indicators">
          {REVIEWS.map((review, index) => (
            <button
              key={review.name}
              type="button"
              className={activeIndex === index ? "active" : ""}
              onClick={() => setTrackIndex(index + visibleCount)}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsSection;
