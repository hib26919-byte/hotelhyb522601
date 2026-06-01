const PageHero = ({
  eyebrow,
  title,
  description,
  image,
}) => {
  return (
    <section className="page-hero">
      <img
        key={image}
        src={`${image}${image.includes("?") ? "&" : "?"}t=${Date.now()}`}
        alt={title}
        className="page-hero__image"
        loading="eager"
      />

      <div className="page-hero__overlay" />

      <div className="page-hero__content reveal">
        <span className="eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </section>
  );
};

export default PageHero;
