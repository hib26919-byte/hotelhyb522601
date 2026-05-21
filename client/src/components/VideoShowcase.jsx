import React, { useEffect, useRef } from "react";
import SectionHeading from "./SectionHeading";

const videos = [
  { id: 1, src: "/1.mp4", title: "Luxury Stays", subtitle: "Experience ultimate comfort" },
  { id: 2, src: "/2.mp4", title: "Fine Dining", subtitle: "Signature culinary moments" },
  { id: 3, src: "/3.mp4", title: "Premium Spaces", subtitle: "Aesthetically pleasing designs" },
  { id: 4, src: "/4.mp4", title: "Modern Amenities", subtitle: "Curated for the modern traveler" },
];

const VideoReel = ({ src, title, subtitle }) => {
  const videoRef = useRef(null);

  // Play/pause logic based on intersection observer for mobile snap scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.log("Autoplay blocked", e));
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.6 } // Play when 60% visible
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, []);

  return (
    <div className="video-reel">
      <video
        ref={videoRef}
        src={src}
        className="video-reel__media"
        muted
        loop
        playsInline
        autoPlay
      />
      <div className="video-reel__overlay">
        <div className="video-reel__content">
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

const VideoShowcase = () => {
  return (
    <section className="section video-showcase-section">
      <SectionHeading
        eyebrow="The Experience"
        title="Moments at Bael Tree"
        description="Swipe to experience the ambiance, dining, and luxury that await you."
        centered
      />
      
      <div className="video-showcase-container">
        {videos.map((vid) => (
          <VideoReel key={vid.id} src={vid.src} title={vid.title} subtitle={vid.subtitle} />
        ))}
      </div>
    </section>
  );
};

export default VideoShowcase;
