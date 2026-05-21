import GalleryGrid from "../components/GalleryGrid";
import PageHero from "../components/PageHero";
import SEOHead from "../components/SEOHead";
import { usePageHero } from "../hooks/usePageHero";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=80";

const Gallery = () => {
const { heroImage: fetchedHero } = usePageHero("gallery");
const heroImage = fetchedHero || DEFAULT_IMAGE;

  return (
    <>
      <SEOHead
        title="Gallery | Bael Tree Hotels - Luxury Hotel in Madhapur, Hyderabad"
        description="Browse the Bael Tree Hotels gallery featuring rooms, dining, hospitality moments, and the premium atmosphere of the property."
        path="/gallery"
      />

      <PageHero
        eyebrow="Gallery"
        title="The hotel, captured in light and texture"
        description="Explore rooms, dining spaces, guest-facing details, and the people who bring the Bael Tree experience to life."
        image={heroImage}
      />

      <GalleryGrid />
    </>
  );
};

export default Gallery;