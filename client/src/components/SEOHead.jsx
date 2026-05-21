import { Helmet } from "react-helmet-async";
import { HOTEL_INFO } from "../utils/siteData";

const SEOHead = ({
  title,
  description,
  path = "",
  image = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  keywords = "luxury hotel hyderabad, madhapur hotel, bael tree hotels, hotel near hitec city, premium stay hyderabad",
}) => {
  const canonicalUrl = `${HOTEL_INFO.website}${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          name: HOTEL_INFO.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Ground Floor, Plot No.529, 100 Feet Road",
            addressLocality: "Madhapur",
            addressRegion: "Telangana",
            postalCode: "500081",
            addressCountry: "IN",
          },
          telephone: HOTEL_INFO.phone,
          url: HOTEL_INFO.website,
          priceRange: "₹₹₹",
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;

