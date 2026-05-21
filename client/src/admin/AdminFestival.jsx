import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { db } from "../utils/firebase";
import { uploadToImgBB } from "../utils/imgbb";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { formatDate } from "../utils/dateHelpers";

const EMPTY_FORM = {
  title: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AdminFestival = () => {
  const { data: banners } = useFirestoreCollection("festivalBanners", {
    fallbackData: [],
    realtime: true,
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [editingId, setEditingId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [formValues, setFormValues] = useState(EMPTY_FORM);

  const resetForm = () => {
    setBannerFile(null);
    setEditingId("");
    setFormValues(EMPTY_FORM);
  };

  const startEdit = (banner) => {
    setEditingId(banner.id);
    setBannerFile(null);
    setFormValues({
      title: banner.title || "",
      startDate: toInputDate(banner.startDate),
      endDate: toInputDate(banner.endDate),
      isActive: Boolean(banner.isActive),
    });
  };

  const handleSave = async () => {
    try {
      const existingBanner = banners.find((banner) => banner.id === editingId);

      if (!bannerFile && !existingBanner?.imageUrl) {
        toast.error("Please choose a banner image first.");
        return;
      }

      setUploading(Boolean(bannerFile));
      let imageUrl = existingBanner?.imageUrl || "";

      if (bannerFile) {
        setUploadStatus("Compressing festival banner...");
        const upload = await uploadToImgBB(bannerFile, { preset: "banner" });
        imageUrl = upload.url;
        setUploadStatus(upload.compression?.sizeLabel || "Upload complete");
      }

      const payload = {
        imageUrl,
        title: formValues.title,
        startDate: formValues.startDate ? new Date(`${formValues.startDate}T00:00:00`) : null,
        endDate: formValues.endDate ? new Date(`${formValues.endDate}T23:59:59`) : null,
        isActive: formValues.isActive,
        updatedAt: serverTimestamp(),
      };

      let bannerId = editingId;
      if (editingId) {
        await setDoc(doc(db, "festivalBanners", editingId), payload, { merge: true });
      } else {
        const bannerReference = await addDoc(collection(db, "festivalBanners"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        bannerId = bannerReference.id;
      }

      if (formValues.isActive) {
        await setDoc(doc(db, "settings", "general"), {
          festivalMode: true,
          activeBannerId: bannerId,
        }, { merge: true });
      }

      toast.success(editingId ? "Festival banner updated." : "Festival banner saved.");
      resetForm();
    } catch (error) {
      toast.error(error.message || "Unable to save festival banner.");
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  const toggleActive = async (banner) => {
    const nextActive = !banner.isActive;

    try {
      await setDoc(doc(db, "festivalBanners", banner.id), {
        isActive: nextActive,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, "settings", "general"), {
        festivalMode: nextActive,
        activeBannerId: nextActive ? banner.id : "",
      }, { merge: true });

      toast.success("Festival banner updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update festival banner.");
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm("Delete this festival banner?")) return;

    try {
      await deleteDoc(doc(db, "festivalBanners", banner.id));
      if (banner.isActive) {
        await setDoc(doc(db, "settings", "general"), {
          festivalMode: false,
          activeBannerId: "",
        }, { merge: true });
      }
      if (editingId === banner.id) resetForm();
      toast.success("Festival banner deleted.");
    } catch (error) {
      toast.error(error.message || "Unable to delete banner.");
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>{editingId ? "Edit Festival Banner" : "Add Festival Banner"}</h3>
            <span>Upload a clear banner, set its dates, and choose whether it is active.</span>
          </div>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>
        <div className="field-grid">
          <label className="field-grid__full">
            Banner Image
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(event) => setBannerFile(event.target.files?.[0] || null)}
            />
            <small>
              {bannerFile
                ? `${bannerFile.name} selected. It will be compressed near 500 KB before upload.`
                : editingId
                  ? "Leave empty to keep the current image."
                  : "Recommended: wide banner image, JPG/PNG/WEBP."}
            </small>
            {uploading && (
              <div className="admin-upload-state">
                <span className="admin-spinner" />
                {uploadStatus || "Uploading compressed banner..."}
              </div>
            )}
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
          <div className="field-grid__full table-actions">
            <button type="button" className="btn btn-gold" onClick={handleSave} disabled={uploading}>
              <Save size={16} /> {editingId ? "Update Festival Banner" : "Save Festival Banner"}
            </button>
          </div>
        </div>
      </section>

      <section className="gallery-admin-grid">
        {banners.map((banner) => (
          <article key={banner.id} className={`admin-card admin-card--gallery ${banner.isActive ? "selected" : ""}`}>
            <img src={banner.imageUrl} alt={banner.title || "Festival banner"} loading="lazy" />
            <div>
              <strong>{banner.title || "Festival Banner"}</strong>
              <small>
                {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
              </small>
            </div>
            <div className="table-actions">
              <button type="button" className="btn btn-outline" onClick={() => startEdit(banner)}>
                <Pencil size={14} /> Edit
              </button>
              <button type="button" className="btn btn-outline" onClick={() => toggleActive(banner)}>
                {banner.isActive ? "Deactivate" : "Activate"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => handleDelete(banner)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default AdminFestival;
