import {
  addDoc, collection, deleteDoc, doc,
  serverTimestamp, setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Trash2, Upload, Save, Plus, Image, Video, Eye, EyeOff } from "lucide-react";
import { db, storage } from "../utils/firebase";
import { uploadMultipleToImgBB } from "../utils/imgbb";
import { useFirestoreCollection } from "../hooks/useFirestore";
import { ROOM_CATEGORIES } from "../utils/siteData";

const AMENITIES_LIST = [
  "Complimentary Wi-Fi",
  "Smart TV with OTT",
  "Mini bar",
  "Travel desk assistance",
  "Premium toiletries",
  "Airport transfer",
  "In-room safe",
  "Work desk",
];

const EMPTY_ROOM = {
  category: "standard",
  name: "",
  tagline: "",
  description: "",
  singlePrice: 2500,
  doublePrice: 3000,
  totalRooms: 1,
  amenities: [],
  images: [],
  isAvailable: true,
};

const AdminRooms = () => {
  const { data: rooms } = useFirestoreCollection("rooms", { fallbackData: ROOM_CATEGORIES });
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(EMPTY_ROOM);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRoom = useMemo(
    () => rooms.find(r => r.id === selectedId) || null,
    [rooms, selectedId],
  );

  useEffect(() => {
    if (selectedRoom) {
      setForm({ ...EMPTY_ROOM, ...selectedRoom, amenities: selectedRoom.amenities || [], images: selectedRoom.images || [] });
      setImageFiles([]);
      setImagePreviews([]);
    } else {
      setForm(EMPTY_ROOM);
    }
  }, [selectedRoom]);

  // Create local previews when files drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 10,
    onDrop: acceptedFiles => {
      setImageFiles(prev => [...prev, ...acceptedFiles]);
      setImagePreviews(prev => [...prev, ...acceptedFiles.map(f => URL.createObjectURL(f))]);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      let uploadedImages = form.images || [];

      // Upload new images via ImgBB
      if (imageFiles.length) {
        setUploading(true);
        const results = await uploadMultipleToImgBB(imageFiles);
        uploadedImages = [...uploadedImages, ...results.map(r => r.url)];
        setUploading(false);
      }

      const payload = {
        ...form,
        images: uploadedImages,
        singlePrice: Number(form.singlePrice),
        doublePrice: Number(form.doublePrice),
        totalRooms: Number(form.totalRooms),
        updatedAt: serverTimestamp(),
        createdAt: selectedId ? (form.createdAt || serverTimestamp()) : serverTimestamp(),
      };

      if (selectedId) {
        await setDoc(doc(db, "rooms", selectedId), payload, { merge: true });
        toast.success("Room updated successfully.");
      } else {
        const ref = await addDoc(collection(db, "rooms"), payload);
        setSelectedId(ref.id);
        toast.success("Room created successfully.");
      }

      setImageFiles([]);
      setImagePreviews([]);
    } catch (err) {
      toast.error(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !window.confirm("Delete this room permanently?")) return;
    try {
      await deleteDoc(doc(db, "rooms", selectedId));
      setSelectedId("");
      setForm(EMPTY_ROOM);
      toast.success("Room deleted.");
    } catch (err) {
      toast.error(err.message || "Delete failed.");
    }
  };

  const removeExistingImage = idx => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const removeNewImage = idx => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSeedRooms = async () => {
    if (!window.confirm("This will instantly auto-generate all 4 premium rooms with perfectly written descriptions and prices. Continue?")) return;
    setSaving(true);
    try {
      const promises = ROOM_CATEGORIES.map(room => {
        const payload = { ...room, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        return setDoc(doc(db, "rooms", room.id), payload);
      });
      await Promise.all(promises);
      toast.success("Premium rooms auto-generated successfully!");
      setSelectedId(ROOM_CATEGORIES[0].id);
    } catch (err) {
      toast.error("Failed to generate rooms: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-stack">
      {/* ── Header / Actions ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", margin: 0, color: "#1a1a1a" }}>Room Management</h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#8f8579" }}>Manage your hotel's inventory, pricing, and descriptions.</p>
        </div>
        <button onClick={handleSeedRooms} className="btn btn-gold" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", padding: "0.6rem 1rem" }}>
          ✨ Auto-Generate Rooms
        </button>
      </div>

      {/* ── Room selector cards ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        <button
          type="button"
          onClick={() => { setSelectedId(""); setForm(EMPTY_ROOM); }}
          style={{
            padding: "1.2rem", borderRadius: 22,
            border: !selectedId ? "2px solid rgba(115,217,143,0.6)" : "1px solid rgba(201,168,76,0.2)",
            background: !selectedId ? "rgba(115,217,143,0.08)" : "rgba(255,255,255,0.03)",
            color: "#faf8f5", cursor: "pointer", textAlign: "left",
            display: "flex", flexDirection: "column", gap: 6,
          }}
        >
          <Plus size={18} color="#73d98f" />
          <strong>New Room</strong>
          <small style={{ color: "rgba(250,248,245,0.5)", fontSize: "0.75rem" }}>Create from scratch</small>
        </button>
        {rooms.map(room => (
          <button
            key={room.id}
            type="button"
            onClick={() => setSelectedId(room.id)}
            style={{
              padding: "1.2rem", borderRadius: 22,
              border: selectedId === room.id ? "2px solid rgba(201,168,76,0.6)" : "1px solid rgba(201,168,76,0.2)",
              background: selectedId === room.id ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)",
              color: "#faf8f5", cursor: "pointer", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 6,
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.7rem", color: "#c9a84c", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {room.category}
              </span>
              {room.isAvailable
                ? <Eye size={14} color="#73d98f" />
                : <EyeOff size={14} color="#ff8f8f" />}
            </div>
            <strong style={{ fontFamily: "'Playfair Display', serif" }}>{room.name || room.category}</strong>
            <small style={{ color: "rgba(250,248,245,0.5)", fontSize: "0.75rem" }}>
              {room.totalRooms} rooms · ₹{room.singlePrice?.toLocaleString("en-IN")}
            </small>
            {room.images?.length > 0 && (
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {room.images.slice(0, 3).map((img, i) => (
                  <img key={i} src={img} alt="" style={{ width: 32, height: 24, borderRadius: 6, objectFit: "cover" }} />
                ))}
                {room.images.length > 3 && (
                  <span style={{ fontSize: "0.7rem", color: "#c9a84c", alignSelf: "center" }}>+{room.images.length - 3}</span>
                )}
              </div>
            )}
          </button>
        ))}
      </section>

      {/* ── Main form ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem" }} className="admin-room-form-grid">
        {/* LEFT — form fields */}
        <div className="admin-card" style={{ display: "grid", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif" }}>
              {selectedId ? "Edit Room" : "Create New Room"}
            </h3>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {selectedId && (
                <button type="button" onClick={handleDelete} className="btn btn-outline" style={{ color: "#ff8f8f", borderColor: "rgba(255,143,143,0.3)" }}>
                  <Trash2 size={15} /> Delete
                </button>
              )}
              <button type="button" onClick={handleSave} className="btn btn-gold" disabled={saving}>
                <Save size={15} /> {saving ? "Saving..." : "Save Room"}
              </button>
            </div>
          </div>

          {/* Basic info */}
          <div className="field-grid">
            <label>
              Category
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                <option value="standard">Standard Room</option>
                <option value="executive">Executive Room</option>
                <option value="premium">Premium Room</option>
                <option value="suite">Suite Room</option>
              </select>
            </label>
            <label>
              Display Name
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Executive Retreat" />
            </label>
            <label className="field-grid__full">
              Tagline
              <input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))} placeholder="e.g. Sophistication Redefined" />
            </label>
            <label className="field-grid__full">
              Description
              <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the room experience..." />
              <small>{form.description?.length || 0} characters</small>
            </label>
            <label>
              Single Price (₹)
              <input type="number" value={form.singlePrice} onChange={e => setForm(p => ({ ...p, singlePrice: e.target.value }))} />
            </label>
            <label>
              Double Price (₹)
              <input type="number" value={form.doublePrice} onChange={e => setForm(p => ({ ...p, doublePrice: e.target.value }))} />
            </label>
            <label>
              Total Rooms
              <input type="number" min="1" value={form.totalRooms} onChange={e => setForm(p => ({ ...p, totalRooms: e.target.value }))} />
            </label>
            <label className="switch-row">
              <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} />
              Visible & bookable on website
            </label>
          </div>

          {/* Amenities */}
          <div>
            <strong style={{ fontSize: "0.85rem", color: "rgba(250,248,245,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.75rem" }}>
              Amenities
            </strong>
            <div className="checkbox-grid">
              {AMENITIES_LIST.map(amenity => (
                <label key={amenity} className="checkbox-pill">
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(amenity)}
                    onChange={e => setForm(p => ({
                      ...p,
                      amenities: e.target.checked
                        ? [...p.amenities, amenity]
                        : p.amenities.filter(a => a !== amenity),
                    }))}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — media upload */}
        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
          {/* Image upload zone */}
          <div className="admin-card">
            <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", fontFamily: "'Playfair Display', serif" }}>
              <Image size={18} color="#c9a84c" /> Room Images
            </h4>

            {/* Drop zone */}
            <div
              {...getRootProps()}
              style={{
                border: `2px dashed ${isDragActive ? "#c9a84c" : "rgba(201,168,76,0.3)"}`,
                borderRadius: 18, padding: "1.5rem",
                textAlign: "center", cursor: "pointer",
                background: isDragActive ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                transition: "all 0.3s ease",
                marginBottom: "1rem",
              }}
            >
              <input {...getInputProps()} />
              <Upload size={28} color="#c9a84c" style={{ margin: "0 auto 0.5rem" }} />
              <strong style={{ display: "block", marginBottom: 4 }}>
                {isDragActive ? "Drop images here!" : "Drag & drop images"}
              </strong>
              <small style={{ color: "rgba(250,248,245,0.5)" }}>
                or click to browse · up to 10 images · JPG, PNG, WEBP
              </small>
              {uploading && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#c9a84c" }}>
                  ⏳ Uploading to ImgBB...
                </div>
              )}
            </div>

            {/* New image previews */}
            {imagePreviews.length > 0 && (
              <div>
                <small style={{ color: "#73d98f", marginBottom: "0.5rem", display: "block" }}>
                  ✓ {imagePreviews.length} new image(s) ready to upload
                </small>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                      <img src={src} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        style={{
                          position: "absolute", top: 4, right: 4,
                          width: 22, height: 22, borderRadius: "50%",
                          background: "rgba(208,54,54,0.88)", color: "#fff",
                          border: "none", cursor: "pointer", display: "grid", placeItems: "center",
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing images */}
            {form.images?.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <small style={{ color: "rgba(250,248,245,0.55)", display: "block", marginBottom: "0.5rem" }}>
                  Current images ({form.images.length})
                </small>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {form.images.map((src, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                      <img src={src} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i)}
                        style={{
                          position: "absolute", top: 4, right: 4,
                          width: 22, height: 22, borderRadius: "50%",
                          background: "rgba(208,54,54,0.88)", color: "#fff",
                          border: "none", cursor: "pointer", display: "grid", placeItems: "center",
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* End media upload */}

          {/* Save button (mobile sticky) */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-gold"
            style={{ width: "100%", padding: "1.1rem" }}
          >
            <Save size={16} />
            {saving ? "Saving changes..." : "Save Room"}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-room-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminRooms;