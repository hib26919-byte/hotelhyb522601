import { useMemo, useState } from "react";
import Masonry from "react-masonry-css";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { GALLERY_IMAGES } from "../utils/siteData";
import SectionHeading from "./SectionHeading";

const breakpointColumnsObj = { default: 4, 1100: 3, 768: 2, 480: 1 };
const categories = ["all", "hotel", "rooms", "dining", "workers"];

const GalleryGrid = ({ compact = false }) => {
  const { data: galleryItems, loading, error } = useFirestoreCollection("gallery", {
    fallbackData: GALLERY_IMAGES,
    fallbackWhenEmpty: false,
    // No realtime:true — gallery is static; getDocs fires once
  });

  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(null);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return galleryItems;
    return galleryItems.filter(
      (item) => item.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory, galleryItems]);

  return (
    <section className="section">
      {!compact && (
        <SectionHeading
          eyebrow="Gallery"
          title="Framed moments from the Bael Tree experience"
          description="A curated mosaic of rooms, dining, hospitality, and atmosphere."
          centered
        />
      )}

      <div className="gallery-filters reveal">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={activeCategory === category ? "active" : ""}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ textAlign: "center", padding: "40px" }}>
          Loading gallery...
        </p>
      )}

      {error && (
        <p style={{ textAlign: "center", color: "red", padding: "40px" }}>
          Failed to load gallery.
        </p>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <p style={{ textAlign: "center", padding: "40px" }}>
          No gallery images found.
        </p>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="gallery-grid"
          columnClassName="gallery-grid__column"
        >
          {filteredItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="gallery-card reveal stagger-item"
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={item.url}
                alt={item.caption}
                loading="lazy"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/600x400?text=Image+Failed";
                }}
              />
              <span>{item.caption}</span>
            </button>
          ))}
        </Masonry>
      )}

      {selectedIndex !== null && filteredItems[selectedIndex] && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <button
            type="button"
            className="modal-close"
            onClick={() => setSelectedIndex(null)}
          >
            <X size={18} />
          </button>
          <button
            type="button"
            className="lightbox__nav"
            onClick={() =>
              setSelectedIndex(
                (selectedIndex - 1 + filteredItems.length) % filteredItems.length
              )
            }
          >
            <ChevronLeft size={22} />
          </button>
          <img
            src={filteredItems[selectedIndex].url}
            alt={filteredItems[selectedIndex].caption}
          />
          <button
            type="button"
            className="lightbox__nav lightbox__nav--right"
            onClick={() =>
              setSelectedIndex((selectedIndex + 1) % filteredItems.length)
            }
          >
            <ChevronRight size={22} />
          </button>
          <p>{filteredItems[selectedIndex].caption}</p>
        </div>
      )}
    </section>
  );
};

export default GalleryGrid;