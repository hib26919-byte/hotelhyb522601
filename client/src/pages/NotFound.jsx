import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const NotFound = () => (
  <>
    <SEOHead
      title="Page Not Found | Bael Tree Hotels"
      description="The page you requested could not be found."
      path="/404"
    />
    <section className="error-boundary">
      <span className="eyebrow">404</span>
      <h1>The page you're looking for has stepped out of sight.</h1>
      <p>Return to the Bael Tree Hotels home page and continue exploring the stay.</p>
      <Link to="/" className="btn btn-gold">
        Return Home
      </Link>
    </section>
  </>
);

export default NotFound;
