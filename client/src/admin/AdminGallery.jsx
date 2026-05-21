import { addDoc, collection, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { db } from "../utils/firebase";
import { uploadMultipleToImgBB } from "../utils/imgbb";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { GALLERY_IMAGES } from "../utils/siteData";

const AdminGallery = () => {
  const { data: galleryItems } = useFirestoreCollection("gallery", {
    fallbackData: GALLERY_IMAGES,
    fallbackWhenEmpty: false,
  });
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("hotel");

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => setFiles(acceptedFiles),
  });

  const handleUpload = async () => {
    try {
      const uploads = await uploadMultipleToImgBB(files);
      await Promise.all(
        uploads.map((upload) =>
          addDoc(collection(db, "gallery"), {
            url: upload.url,
            category: category.toLowerCase(),
            caption,
            uploadedAt: serverTimestamp(),
          }),
        ),
      );
      setFiles([]);
      setCaption("");
      toast.success("Gallery images uploaded.");
    } catch (error) {
      toast.error(error.message || "Unable to upload gallery images.");
    }
  };

  const handleDelete = async (imageId) => {
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
        <div className="field-grid">
          <div className="field-grid__full upload-zone" {...getRootProps()}>
            <input {...getInputProps()} />
            <strong>Drag & drop gallery images</strong>
            <p>{files.length ? `${files.length} file(s) ready to upload` : "Drop multiple images or click to browse."}</p>
          </div>
          <label>
            Category
            
              <select
  value={category}
  onChange={(event) =>
    setCategory(event.target.value.toLowerCase())
  }
>
  <option value="hotel">Hotel</option>
  <option value="rooms">Rooms</option>
  <option value="dining">Dining</option>
  <option value="workers">Workers</option>
</select>
          </label>
          <label className="field-grid__full">
            Caption
            <input value={caption} onChange={(event) => setCaption(event.target.value)} />
          </label>
          <div className="field-grid__full">
            <button type="button" className="btn btn-gold" onClick={handleUpload} disabled={!files.length}>
              Upload Images
            </button>
          </div>
        </div>
      </section>

      <section className="gallery-admin-grid">
        {galleryItems.map((item) => (
          <article key={item.id} className="admin-card admin-card--gallery">
            <img src={item.url} alt={item.caption} loading="lazy" />
            <div>
              <strong>{item.caption}</strong>
              <small>{item.category}</small>
            </div>
            <button type="button" className="btn btn-outline" onClick={() => handleDelete(item.id)}>
              Delete
            </button>
          </article>
        ))}
      </section>
    </div>
  );
};

export default AdminGallery;
