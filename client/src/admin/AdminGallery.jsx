import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { db } from "../utils/firebase";
import { uploadMultipleToImgBB } from "../utils/imgbb";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { GALLERY_IMAGES } from "../utils/siteData";

const GALLERY_CATEGORIES = ["hotel", "rooms", "dining", "workers"];

const AdminGallery = () => {
  const { data: galleryItems } = useFirestoreCollection("gallery", {
    fallbackData: GALLERY_IMAGES,
    fallbackWhenEmpty: false,
    realtime: true,
  });
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("hotel");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editValues, setEditValues] = useState({ caption: "", category: "hotel" });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => setFiles(acceptedFiles),
  });

  const handleUpload = async () => {
    if (!files.length) return;

    setUploading(true);
    setUploadStatus("Compressing gallery images...");
    try {
      const uploads = await uploadMultipleToImgBB(files, {
        preset: "gallery",
        onProgress: ({ current, total, stage, compression }) => {
          setUploadStatus(
            stage === "uploaded"
              ? `Uploaded ${current}/${total}${compression?.sizeLabel ? ` (${compression.sizeLabel})` : ""}`
              : `Compressing ${current}/${total}`,
          );
        },
      });

      await Promise.all(
        uploads.map((upload) =>
          addDoc(collection(db, "gallery"), {
            url: upload.url,
            category: category.toLowerCase(),
            caption,
            uploadedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        ),
      );

      setFiles([]);
      setCaption("");
      toast.success("Gallery images uploaded.");
    } catch (error) {
      toast.error(error.message || "Unable to upload gallery images.");
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValues({
      caption: item.caption || "",
      category: item.category || "hotel",
    });
  };

  const saveEdit = async () => {
    try {
      await setDoc(
        doc(db, "gallery", editingId),
        {
          caption: editValues.caption,
          category: editValues.category.toLowerCase(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setEditingId("");
      toast.success("Gallery item updated.");
    } catch (error) {
      toast.error(error.message || "Unable to update gallery image.");
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm("Delete this gallery image?")) return;

    try {
      await deleteDoc(doc(db, "gallery", imageId));
      toast.success("Gallery image removed.");
    } catch (error) {
      toast.error(error.message || "Unable to delete image.");
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h3>Gallery Media</h3>
            <span>Add, edit, and delete public gallery images.</span>
          </div>
        </div>
        <div className="field-grid">
          <div className={`field-grid__full upload-zone ${isDragActive ? "is-active" : ""}`} {...getRootProps()}>
            <input {...getInputProps()} disabled={uploading} />
            <Upload size={28} color="#c9a84c" style={{ margin: "0 auto 0.5rem" }} />
            <strong>{isDragActive ? "Drop images here" : "Drag and drop gallery images"}</strong>
            <p>{files.length ? `${files.length} file(s) ready to upload` : "Drop multiple images or click to browse."}</p>
            {uploading && (
              <div className="admin-upload-state">
                <span className="admin-spinner" />
                {uploadStatus || "Uploading compressed images..."}
              </div>
            )}
          </div>
          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value.toLowerCase())}
            >
              {GALLERY_CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="field-grid__full">
            Caption
            <input value={caption} onChange={(event) => setCaption(event.target.value)} />
          </label>
          <div className="field-grid__full">
            <button type="button" className="btn btn-gold" onClick={handleUpload} disabled={!files.length || uploading}>
              <Upload size={16} />
              {uploading ? "Uploading..." : "Upload Images"}
            </button>
          </div>
        </div>
      </section>

      <section className="gallery-admin-grid">
        {galleryItems.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <article key={item.id} className="admin-card admin-card--gallery">
              <img src={item.url} alt={item.caption || "Gallery image"} loading="lazy" />
              {isEditing ? (
                <div className="field-grid" style={{ gridTemplateColumns: "1fr", width: "100%" }}>
                  <label>
                    Caption
                    <input
                      value={editValues.caption}
                      onChange={(event) => setEditValues((previous) => ({ ...previous, caption: event.target.value }))}
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={editValues.category}
                      onChange={(event) => setEditValues((previous) => ({ ...previous, category: event.target.value }))}
                    >
                      {GALLERY_CATEGORIES.map((categoryName) => (
                        <option key={categoryName} value={categoryName}>{categoryName}</option>
                      ))}
                    </select>
                  </label>
                  <div className="table-actions">
                    <button type="button" className="btn btn-gold" onClick={saveEdit}>
                      <Save size={14} /> Save
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setEditingId("")}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <strong>{item.caption || "Untitled image"}</strong>
                    <small>{item.category || "hotel"}</small>
                  </div>
                  <div className="table-actions">
                    <button type="button" className="btn btn-outline" onClick={() => startEdit(item)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default AdminGallery;
