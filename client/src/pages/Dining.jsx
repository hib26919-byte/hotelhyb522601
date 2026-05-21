import { Clock3, Sparkles, UtensilsCrossed } from "lucide-react";
import DiningSection from "../components/DiningSection";
import RestaurantMenu from "../components/RestaurantMenu";
import PageHero from "../components/PageHero";
import SEOHead from "../components/SEOHead";
import SectionHeading from "../components/SectionHeading";
import { DINING_VENUES } from "../utils/siteData";
import { usePageHero } from "../hooks/usePageHero";

const DEFAULT_DINING_IMAGE =
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1800&q=80";

const Dining = () => {
  const { heroImage: fetchedHero } = usePageHero("dining");
  const heroImage = fetchedHero || DEFAULT_DINING_IMAGE;

  return (
    <>
      <SEOHead
        title="Dining | Bael Tree Hotels - Restaurants in Madhapur, Hyderabad"
        description="Discover dining at Bael Tree Hotels with Kadali Patra and The Soul Curry, serving heritage-inspired vegetarian and gourmet non-vegetarian cuisine."
        path="/dining"
      />

      <PageHero
        eyebrow="Dining"
        title="Signature tables for every appetite"
        description="From satvic vegetarian rituals to rich gourmet curry traditions, dining at Bael Tree Hotels is built as a full part of the stay experience."
        image={heroImage}
      />

      <DiningSection compact />

      <RestaurantMenu />

      <section className="section">
        <SectionHeading
          eyebrow="Timings"
          title="Service hours"
          description="Breakfast, lunch, and dinner are served with elegant pacing and in-room options on request."
          centered
        />

        <div className="timings-card reveal">
          <div>
            <Clock3 size={22} />
            <strong>Breakfast</strong>
            <span>{DINING_VENUES[0].timings.breakfast}</span>
          </div>

          <div>
            <UtensilsCrossed size={22} />
            <strong>Lunch</strong>
            <span>{DINING_VENUES[0].timings.lunch}</span>
          </div>

          <div>
            <Sparkles size={22} />
            <strong>Dinner</strong>
            <span>{DINING_VENUES[0].timings.dinner}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="reach-grid">
          {[
            "Culinary Excellence",
            "Elegant Ambience",
            "Tailored Gastronomy",
            "Impeccable Service",
            "Exclusive Retreat",
          ].map((feature) => (
            <article
              key={feature}
              className="reach-card reveal"
            >
              <Sparkles size={22} />
              <strong>{feature}</strong>
              <p>
                Carefully choreographed dining that
                matches the tone of a premium city stay.
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
};

export default Dining;