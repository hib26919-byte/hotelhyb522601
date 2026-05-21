import SectionHeading from "./SectionHeading";
import { DINING_VENUES } from "../utils/siteData";
import RoomSlider from "./RoomSlider";

const DiningSection = ({ compact = false }) => (
  <section className="section" style={{ padding: compact ? "4rem 0" : "8rem 0" }}>
    {!compact && (
      <SectionHeading
        eyebrow="Dining"
        title="Two restaurant narratives, one elegant address"
        description="From satvic vegetarian rituals to rich gourmet legacies, Bael Tree offers dining that complements both leisure and business travel."
        centered
      />
    )}
    
    <div style={{ display: "grid", gap: "6rem", marginTop: compact ? "0" : "4rem" }}>
      {DINING_VENUES.map((venue, index) => {
        const isEven = index % 2 === 0;
        return (
          <article 
            key={venue.id} 
            className="dining-venue reveal"
            style={{ 
              display: "flex", 
              flexDirection: isEven ? "row" : "row-reverse",
              gap: "4rem",
              alignItems: "center"
            }}
          >
            {/* Image Side */}
            <div style={{ flex: 1, borderRadius: "24px", overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
               <RoomSlider images={venue.images} title={venue.name} />
            </div>

            {/* Content Side */}
            <div style={{ flex: 1, padding: "2rem" }}>
              <div style={{ 
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 64, height: 64, borderRadius: "50%", 
                border: `1px solid ${venue.accent}`, color: venue.accent,
                marginBottom: "1.5rem"
              }}>
                {venue.logoMark}
              </div>
              <span style={{ 
                display: "block", fontFamily: "'Cinzel', serif", 
                color: venue.accent, letterSpacing: "0.2em", textTransform: "uppercase", 
                fontSize: "0.8rem", marginBottom: "1rem" 
              }}>
                {venue.title}
              </span>
              <h3 style={{ 
                fontFamily: "'Playfair Display', serif", fontSize: "3rem", 
                lineHeight: 1.1, marginBottom: "1.5rem", color: "#1a1a1a"
              }}>
                {venue.name}
              </h3>
              <p style={{ 
                fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem", 
                lineHeight: 1.8, color: "#5a5a5a", marginBottom: "2rem"
              }}>
                {venue.description}
              </p>
              
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
                {venue.highlights.map((highlight) => (
                  <li key={highlight} style={{ 
                    display: "flex", alignItems: "center", gap: "1rem", 
                    fontSize: "0.95rem", color: "#2c2c2c" 
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: venue.accent }} />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        );
      })}
    </div>

    <style>{`
      @media (max-width: 968px) {
        .dining-venue {
          flex-direction: column !important;
          gap: 2rem !important;
        }
        .dining-venue > div {
          width: 100%;
          padding: 0 !important;
        }
      }
    `}</style>
  </section>
);

export default DiningSection;

