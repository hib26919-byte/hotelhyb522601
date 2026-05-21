import * as Icons from "lucide-react";
import { AMENITY_GROUPS } from "../utils/siteData";
import SectionHeading from "./SectionHeading";

const AmenityColumn = ({ title, items }) => (
  <div className="amenities-column reveal">
    <h3>{title}</h3>
    <div className="amenities-list">
      {items.map((amenity) => {
        const Icon = Icons[amenity.icon] || Icons.Star;
        return (
          <article key={amenity.name} className="amenity-card">
            <Icon size={22} />
            <div>
              <strong>{amenity.name}</strong>
              <p>{amenity.description}</p>
            </div>
          </article>
        );
      })}
    </div>
  </div>
);

const AmenitiesSection = () => (
  <section className="section amenities-section">
    <SectionHeading
      eyebrow="Amenities"
      title="Comfort arranged with intention"
      description="Every stay category is supported by core conveniences and premium touches tuned for business travel, celebrations, and restorative city escapes."
      centered
    />
    <div className="amenities-grid">
      <AmenityColumn title="Standard Amenities" items={AMENITY_GROUPS.standard} />
      <AmenityColumn title="Premium Amenities" items={AMENITY_GROUPS.premium} />
    </div>
  </section>
);

export default AmenitiesSection;

