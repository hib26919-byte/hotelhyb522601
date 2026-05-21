const SectionHeading = ({ eyebrow, title, description, centered = false }) => (
  <div className={`section-heading reveal ${centered ? "centered" : ""}`}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h2>{title}</h2>
    {description && <p>{description}</p>}
    <div className="divider-gold" aria-hidden="true" />
  </div>
);

export default SectionHeading;

