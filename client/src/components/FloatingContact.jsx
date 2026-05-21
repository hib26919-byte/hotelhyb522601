import { useState, useEffect } from "react";
import { Phone, X } from "lucide-react";

const PHONE_NUMBER = "919642325555";
const PHONE_DISPLAY = "+91-9642325555";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hello! I'm interested in booking a room at Bael Tree Hotels. Could you please help me?"
);

/* WhatsApp SVG icon */
const WhatsAppIcon = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FloatingContact = () => {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const showTimer = setTimeout(() => setVisible(true), 2000);
    return () => {
      clearTimeout(showTimer);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (!visible) return null;

  /* ════════════════════════════════════════════
     MOBILE LAYOUT
     Two side-by-side pill buttons at the
     bottom-right corner, above the mobile nav.
     No toggle — always visible.
  ════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <>
        <div style={{
          position: "fixed",
          right: "0.75rem",
          /* sits just above the mobile nav bar (≈ 72px) + FAB (≈ 62px) */
          bottom: "calc(72px + env(safe-area-inset-bottom) + 0.75rem)",
          zIndex: 45,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          alignItems: "flex-end",
        }}>
          {/* WhatsApp pill */}
          <a
            href={`https://wa.me/${PHONE_NUMBER}?text=${WHATSAPP_MESSAGE}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "0.55rem 0.9rem 0.55rem 0.65rem",
              borderRadius: 999,
              background: "linear-gradient(135deg, #25D366, #1aad52)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 6px 18px rgba(37,211,102,0.4)",
              fontSize: "0.78rem", fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <WhatsAppIcon size={18} />
            WhatsApp
          </a>

          {/* Call pill */}
          <a
            href={`tel:${PHONE_DISPLAY}`}
            aria-label="Call Bael Tree Hotels"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "0.55rem 0.9rem 0.55rem 0.65rem",
              borderRadius: 999,
              background: "linear-gradient(135deg, #7b1a1a, #a52020)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 6px 18px rgba(123,26,26,0.4)",
              fontSize: "0.78rem", fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            <Phone size={15} />
            Call Us
          </a>
        </div>

        <style>{`
          @keyframes mobileContactPulse {
            0%, 100% { box-shadow: 0 6px 18px rgba(37,211,102,0.4); }
            50% { box-shadow: 0 6px 18px rgba(37,211,102,0.4), 0 0 0 8px rgba(37,211,102,0); }
          }
        `}</style>
      </>
    );
  }

  /* ════════════════════════════════════════════
     DESKTOP LAYOUT
     Expandable button stack on the bottom-right.
  ════════════════════════════════════════════ */
  return (
    <>
      <div style={{
        position: "fixed",
        right: "1.25rem",
        bottom: "1.5rem",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.65rem",
      }}>
        {/* Expanded action buttons */}
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "flex-end", gap: "0.6rem",
          opacity: expanded ? 1 : 0,
          transform: expanded ? "translateY(0) scale(1)" : "translateY(16px) scale(0.9)",
          pointerEvents: expanded ? "auto" : "none",
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          {/* WhatsApp */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{
              padding: "0.45rem 0.85rem", borderRadius: 999,
              background: "rgba(255,255,255,0.96)", color: "#1a1a1a",
              fontSize: "0.82rem", fontWeight: 600,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              whiteSpace: "nowrap",
              border: "1px solid rgba(37,211,102,0.25)",
            }}>Chat on WhatsApp</span>
            <a
              href={`https://wa.me/${PHONE_NUMBER}?text=${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat on WhatsApp"
              style={{
                width: 50, height: 50, borderRadius: "50%",
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "#fff", display: "grid", placeItems: "center",
                boxShadow: "0 8px 22px rgba(37,211,102,0.45)",
                textDecoration: "none", flexShrink: 0,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <WhatsAppIcon size={22} />
            </a>
          </div>

          {/* Call */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{
              padding: "0.45rem 0.85rem", borderRadius: 999,
              background: "rgba(255,255,255,0.96)", color: "#1a1a1a",
              fontSize: "0.82rem", fontWeight: 600,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              whiteSpace: "nowrap",
              border: "1px solid rgba(123,26,26,0.2)",
            }}>{PHONE_DISPLAY}</span>
            <a
              href={`tel:${PHONE_DISPLAY}`}
              aria-label="Call Bael Tree Hotels"
              style={{
                width: 50, height: 50, borderRadius: "50%",
                background: "linear-gradient(135deg, #7b1a1a, #a52020)",
                color: "#fff", display: "grid", placeItems: "center",
                boxShadow: "0 8px 22px rgba(123,26,26,0.45)",
                textDecoration: "none", flexShrink: 0,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Phone size={20} />
            </a>
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          aria-label={expanded ? "Close contact options" : "Open contact options"}
          style={{
            width: 58, height: 58, borderRadius: "50%",
            background: expanded
              ? "linear-gradient(135deg, #2c2c2c, #1a1a1a)"
              : "linear-gradient(135deg, #c9a84c, #e8d5a3)",
            color: expanded ? "#faf8f5" : "#1a1a1a",
            border: "none", cursor: "pointer",
            display: "grid", placeItems: "center",
            boxShadow: expanded
              ? "0 8px 22px rgba(0,0,0,0.28)"
              : "0 10px 28px rgba(201,168,76,0.45)",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          {expanded ? <X size={22} /> : <Phone size={22} />}
        </button>
      </div>
    </>
  );
};

export default FloatingContact;