import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useFirestoreCollection, useFirestoreDocument } from "../hooks/useFirestore";
import { DEFAULT_SETTINGS } from "../utils/siteData";

const DISMISS_KEY = "bael-tree-festival-dismissed";

const FestivalBanner = () => {
  const { data: settings } = useFirestoreDocument("settings", "general", {
  fallbackData: DEFAULT_SETTINGS,
});
const { data: banners } = useFirestoreCollection("festivalBanners", {
  fallbackData: [],
  // festivalBanners is already in STATIC_COLLECTIONS so this is a one-time fetch
  // no change needed here — just confirming it is NOT realtime
});
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "true");

  useEffect(() => {
    if (dismissed) {
      sessionStorage.setItem(DISMISS_KEY, "true");
    }
  }, [dismissed]);

  const activeBanner = useMemo(() => {
    const now = new Date();
    return banners.find((banner) => {
      const startDate = banner.startDate?.toDate ? banner.startDate.toDate() : new Date(banner.startDate);
      const endDate = banner.endDate?.toDate ? banner.endDate.toDate() : new Date(banner.endDate);
      const matchesSettings = settings?.activeBannerId
        ? banner.id === settings.activeBannerId
        : banner.isActive;

      return (
        matchesSettings &&
        banner.isActive &&
        !Number.isNaN(startDate?.getTime?.()) &&
        !Number.isNaN(endDate?.getTime?.()) &&
        now >= startDate &&
        now <= endDate
      );
    });
  }, [banners, settings?.activeBannerId]);

  if (dismissed || !activeBanner) {
    return null;
  }

  return (
    <div className="festival-banner" role="dialog" aria-modal="true" aria-label="Festival banner">
      <div className="festival-banner__backdrop" />
      <div className="festival-banner__content">
        <button
          type="button"
          className="festival-banner__close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss festival banner"
        >
          <X size={18} />
        </button>
        <img src={activeBanner.imageUrl} alt={activeBanner.title || "Festival banner"} />
        {activeBanner.title && <p>{activeBanner.title}</p>}
      </div>
    </div>
  );
};

export default FestivalBanner;

