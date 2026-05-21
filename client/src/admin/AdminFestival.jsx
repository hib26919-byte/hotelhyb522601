import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import toast from "react-hot-toast";
import { db } from "../utils/firebase";
import { uploadToImgBB } from "../utils/imgbb";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { formatDate } from "../utils/dateHelpers";

const AdminFestival = () => {
  const { data: banners } = useFirestoreCollection("festivalBanners", { fallbackData: [] });
  const [bannerFile, setBannerFile] = useState(null);
  const [formValues, setFormValues] = useState({
    title: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const handleSave = async () => {
    try {
      if (!bannerFile) {
        toast.error("Please choose a banner image first.");
        return;
      }
      const upload = await uploadToImgBB(bannerFile);
      const bannerReference = await addDoc(collection(db, "festivalBanners"), {
        imageUrl: upload.url,
        title: formValues.title,
        startDate: new Date(formValues.startDate),
        endDate: new Date(formValues.endDate),
        isActive: formValues.isActive,
        createdAt: serverTimestamp(),
      });
      if (formValues.isActive) {
        await setDoc(doc(db, "settings", "general"), {
          festivalMode: true,
          activeBannerId: bannerReference.id,
        }, { merge: true });
      }
      toast.success("Festival banner saved.");
      setBannerFile(null);
      setFormValues({ title: "", startDate: "", endDate: "", isActive: true });
    } catch (error) {
      toast.error(error.message || "Unable to save festival banner.");
    }
  };

  const toggleActive = async (banner) => {
    try {
      await setDoc(doc(db, "festivalBanners", banner.id), { isActive: !banner.isActive }, { merge: true });
      if (!banner.isActive) {
        await setDoc(doc(db, "settings", "general"), { festivalMode: true, activeBannerId: banner.id }, { merge: true });
      }
      toast.success("Festival banner updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update festival banner.");
    }
  };

  const handleDelete = async (bannerId) => {
    try {
      await deleteDoc(doc(db, "festivalBanners", bannerId));
      toast.success("Festival banner deleted.");
    } catch (error) {
      toast.error(error.message || "Unable to delete banner.");
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="field-grid">
          <label className="field-grid__full">
            Banner Image
            <input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0] || null)} />
          </label>
          <label>
            Title
            <input value={formValues.title} onChange={(event) => setFormValues((previous) => ({ ...previous, title: event.target.value }))} />
          </label>
          <label>
            Start Date
            <input type="date" value={formValues.startDate} onChange={(event) => setFormValues((previous) => ({ ...previous, startDate: event.target.value }))} />
          </label>
          <label>
            End Date
            <input type="date" value={formValues.endDate} onChange={(event) => setFormValues((previous) => ({ ...previous, endDate: event.target.value }))} />
          </label>
          <label className="switch-row">
            <input type="checkbox" checked={formValues.isActive} onChange={(event) => setFormValues((previous) => ({ ...previous, isActive: event.target.checked }))} />
            Set as active banner
          </label>
          <div className="field-grid__full">
            <button type="button" className="btn btn-gold" onClick={handleSave}>
              Save Festival Banner
            </button>
          </div>
        </div>
      </section>

      <section className="gallery-admin-grid">
        {banners.map((banner) => (
          <article key={banner.id} className={`admin-card admin-card--gallery ${banner.isActive ? "selected" : ""}`}>
            <img src={banner.imageUrl} alt={banner.title} loading="lazy" />
            <div>
              <strong>{banner.title || "Festival Banner"}</strong>
              <small>
                {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
              </small>
            </div>
            <div className="table-actions">
              <button type="button" className="btn btn-outline" onClick={() => toggleActive(banner)}>
                {banner.isActive ? "Deactivate" : "Activate"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => handleDelete(banner.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default AdminFestival;
