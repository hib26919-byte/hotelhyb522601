import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Image, Upload, Trash2, Settings, Users, Star, Globe, Shield, Pencil, Save, X } from "lucide-react";
import { useFirestoreCollection, useFirestoreDocument } from "../hooks/useFirestore";
import { db } from "../utils/firebase";
import { uploadToImgBB } from "../utils/imgbb";
import { DEFAULT_HERO_IMAGES, DEFAULT_SETTINGS, FOUNDERS, TESTIMONIALS } from "../utils/siteData";

const PAGE_HERO_SLOTS = [
  { key: "home",     label: "Home Page",     description: "Main hero slider (background images)", route: "/" },
  { key: "rooms",    label: "Rooms Page",    description: "Header banner for /rooms", route: "/rooms" },
  { key: "dining",   label: "Dining Page",   description: "Header banner for /dining", route: "/dining" },
  { key: "gallery",  label: "Gallery Page",  description: "Header banner for /gallery", route: "/gallery" },
  { key: "about",    label: "About Page",    description: "Header banner for /about", route: "/about" },
  { key: "contact",  label: "Contact Page",  description: "Header banner for /contact", route: "/contact" },
  { key: "booking",  label: "Booking Page",  description: "Header banner for /booking", route: "/booking" },
];

const uploadImage = (file, preset = "default") => uploadToImgBB(file, { preset });

const AdminSettings = () => {
  // ── ALL useState MUST come before any hook that uses their values ──
  const [activeTab, setActiveTab] = useState("general");
  const [uploading, setUploading] = useState({});
  const [heroUrl, setHeroUrl] = useState("");
  const [testimonialForm, setTestimonialForm] = useState({ name: "", location: "", rating: 5, text: "" });
  const [editingTestimonialId, setEditingTestimonialId] = useState("");
  const [founderForm, setFounderForm] = useState({ name: "", role: "", bio: "", image: "", linkedin: "" });
  const [founderImageFile, setFounderImageFile] = useState(null);
  const [editingFounderId, setEditingFounderId] = useState("");
  const [generalForm, setGeneralForm] = useState({
    maintenanceMode: false, festivalMode: false, activeBannerId: "",
    checkInTime: "2:00 PM", checkOutTime: "11:00 AM", gstPercentage: 12,
    hotelName: "Bael Tree Hotels", hotelPhone: "+91-9642325555",
    hotelEmail: "stay@baeltreehotels.com", currency: "INR",
  });

  // ── Firestore hooks AFTER useState so activeTab is defined ──
  const { data: settings } = useFirestoreDocument("settings", "general", {
    fallbackData: DEFAULT_SETTINGS,
  });
  const { data: heroImages } = useFirestoreCollection("heroImages", {
    fallbackData: DEFAULT_HERO_IMAGES,
    fallbackWhenEmpty: false,
    realtime: true,
    enabled: activeTab === "hero" || activeTab === "general",
  });
  const { data: pageHeroes } = useFirestoreCollection("pageHeroImages", {
    fallbackData: [],
    fallbackWhenEmpty: false,
    realtime: true,
    enabled: activeTab === "pages",
  });
  const { data: testimonials } = useFirestoreCollection("testimonials", {
    fallbackData: TESTIMONIALS,
    fallbackWhenEmpty: false,
    realtime: true,
    enabled: activeTab === "content",
  });
  const { data: founders } = useFirestoreCollection("founders", {
    fallbackData: FOUNDERS,
    fallbackWhenEmpty: false,
    realtime: true,
    enabled: activeTab === "founders",
  });

  useEffect(() => {
    if (settings) {
      setGeneralForm({
        maintenanceMode: settings?.maintenanceMode || false,
        festivalMode: settings?.festivalMode || false,
        activeBannerId: settings?.activeBannerId || "",
        checkInTime: settings?.hotelInfo?.checkInTime || "2:00 PM",
        checkOutTime: settings?.hotelInfo?.checkOutTime || "11:00 AM",
        gstPercentage: settings?.hotelInfo?.gstPercentage || 12,
        hotelName: settings?.hotelInfo?.hotelName || "Bael Tree Hotels",
        hotelPhone: settings?.hotelInfo?.hotelPhone || "+91-9642325555",
        hotelEmail: settings?.hotelInfo?.hotelEmail || "stay@baeltreehotels.com",
        currency: settings?.hotelInfo?.currency || "INR",
      });
    }
  }, [settings]);

  const saveGeneralSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), {
        maintenanceMode: generalForm.maintenanceMode,
        festivalMode: generalForm.festivalMode,
        activeBannerId: generalForm.activeBannerId,
        hotelInfo: {
          checkInTime: generalForm.checkInTime,
          checkOutTime: generalForm.checkOutTime,
          gstPercentage: Number(generalForm.gstPercentage),
          hotelName: generalForm.hotelName,
          hotelPhone: generalForm.hotelPhone,
          hotelEmail: generalForm.hotelEmail,
          currency: generalForm.currency,
        },
      }, { merge: true });
      toast.success("Settings saved successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to save settings.");
    }
  };

  const addHeroImage = async () => {
    if (!heroUrl.trim()) { toast.error("Enter a valid image URL."); return; }
    try {
      await addDoc(collection(db, "heroImages"), {
        image: heroUrl,
        alt: "Hotel hero visual",
        order: heroImages.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setHeroUrl("");
      toast.success("Hero image added.");
    } catch (error) {
      toast.error(error.message || "Failed to add image.");
    }
  };

  const uploadHeroFile = async (file) => {
    if (!file) return;
    try {
      setUploading((u) => ({ ...u, homeHero: true }));
      const upload = await uploadImage(file, "hero");
      await addDoc(collection(db, "heroImages"), {
        image: upload.url,
        alt: file.name,
        order: heroImages.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(`Hero image uploaded${upload.compression?.sizeLabel ? ` (${upload.compression.sizeLabel})` : ""}.`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Upload failed.");
    } finally {
      setUploading((u) => ({ ...u, homeHero: false }));
    }
  };

  const removeHeroImage = async (id) => {
    try {
      await deleteDoc(doc(db, "heroImages", id));
      toast.success("Image removed.");
    } catch (error) {
      toast.error(error.message || "Failed to remove image.");
    }
  };

  const getPageHero = (pageKey) => pageHeroes.find(p => p.page === pageKey);

  const uploadPageHero = async (pageKey, file) => {
    if (!file) return;
    const existing = getPageHero(pageKey);
    try {
      setUploading((u) => ({ ...u, [pageKey]: true }));
      const upload = await uploadImage(file, "banner");
      if (existing) {
        await setDoc(doc(db, "pageHeroImages", existing.id), {
          page: pageKey, imageUrl: upload.url, updatedAt: serverTimestamp(),
        }, { merge: true });
      } else {
        await addDoc(collection(db, "pageHeroImages"), {
          page: pageKey, imageUrl: upload.url, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      }
      toast.success(`${pageKey} hero image updated${upload.compression?.sizeLabel ? ` (${upload.compression.sizeLabel})` : ""}.`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Upload failed.");
    } finally {
      setUploading((u) => ({ ...u, [pageKey]: false }));
    }
  };

  const setPageHeroUrl = async (pageKey, url) => {
    const existing = getPageHero(pageKey);
    try {
      if (existing) {
        await setDoc(doc(db, "pageHeroImages", existing.id), { page: pageKey, imageUrl: url, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await addDoc(collection(db, "pageHeroImages"), { page: pageKey, imageUrl: url, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      toast.success(`${pageKey} hero updated.`);
    } catch (error) {
      toast.error(error.message || "Failed.");
    }
  };

  const removePageHero = async (pageKey) => {
    const existing = getPageHero(pageKey);
    if (!existing) return;
    try {
      await deleteDoc(doc(db, "pageHeroImages", existing.id));
      toast.success("Hero image removed.");
    } catch (error) {
      toast.error(error.message || "Failed.");
    }
  };

  const resetTestimonialForm = () => {
    setEditingTestimonialId("");
    setTestimonialForm({ name: "", location: "", rating: 5, text: "" });
  };

  const startTestimonialEdit = (item) => {
    setEditingTestimonialId(item.id);
    setTestimonialForm({
      name: item.name || "",
      location: item.location || "",
      rating: Number(item.rating || 5),
      text: item.text || "",
    });
  };

  const addTestimonial = async () => {
    try {
      const payload = {
        ...testimonialForm,
        rating: Number(testimonialForm.rating),
        updatedAt: serverTimestamp(),
      };

      if (editingTestimonialId) {
        await setDoc(doc(db, "testimonials", editingTestimonialId), payload, { merge: true });
        toast.success("Testimonial updated.");
      } else {
        await addDoc(collection(db, "testimonials"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Testimonial saved.");
      }
      resetTestimonialForm();
    } catch (error) {
      toast.error(error.message || "Failed.");
    }
  };

  const resetFounderForm = () => {
    setEditingFounderId("");
    setFounderImageFile(null);
    setFounderForm({ name: "", role: "", bio: "", image: "", linkedin: "" });
  };

  const startFounderEdit = (founder) => {
    setEditingFounderId(founder.id);
    setFounderImageFile(null);
    setFounderForm({
      name: founder.name || "",
      role: founder.role || "",
      bio: founder.bio || "",
      image: founder.image || "",
      linkedin: founder.linkedin || "",
    });
  };

  const addFounder = async () => {
    try {
      setUploading((u) => ({ ...u, founder: Boolean(founderImageFile) }));
      let image = founderForm.image;

      if (founderImageFile) {
        const upload = await uploadImage(founderImageFile, "default");
        image = upload.url;
      }

      const payload = {
        ...founderForm,
        image,
        updatedAt: serverTimestamp(),
      };

      if (editingFounderId) {
        await setDoc(doc(db, "founders", editingFounderId), payload, { merge: true });
        toast.success("Founder updated.");
      } else {
        await addDoc(collection(db, "founders"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Founder saved.");
      }
      resetFounderForm();
    } catch (error) {
      toast.error(error.message || "Failed.");
    } finally {
      setUploading((u) => ({ ...u, founder: false }));
    }
  };

  const removeItem = async (collectionName, id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success("Removed.");
    } catch (error) {
      toast.error(error.message || "Failed.");
    }
  };

  const TABS = [
    { key: "general",  label: "General",      icon: Settings },
    { key: "hero",     label: "Hero Images",   icon: Image },
    { key: "pages",    label: "Page Banners",  icon: Globe },
    { key: "content",  label: "Content",       icon: Star },
    { key: "founders", label: "Founders",      icon: Users },
  ];

  return (
    <div className="admin-stack">
      {/* ── Tab bar ── */}
      <div style={{
        display: "flex", gap: "0.4rem", flexWrap: "wrap",
        padding: "0.5rem", borderRadius: 20,
        background: "rgba(201,168,76,0.05)",
        border: "1px solid rgba(201,168,76,0.2)",
      }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "0.6rem 1rem", borderRadius: 14,
              background: activeTab === key ? "linear-gradient(135deg, #c9a84c, #e8d5a3)" : "transparent",
              border: activeTab === key ? "1px solid rgba(201,168,76,0.4)" : "1px solid transparent",
              color: activeTab === key ? "#1a1a1a" : "#5a5a5a",
              fontWeight: activeTab === key ? "600" : "400",
              fontSize: "0.82rem", fontFamily: "'Cinzel', serif",
              letterSpacing: "0.06em", cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ════════ GENERAL ════════ */}
      {activeTab === "general" && (
        <section className="admin-card">
          <div className="admin-card__header">
            <h3>General Settings</h3>
            <span>Hotel configuration, modes, and stay policies</span>
          </div>
          <div className="field-grid">
            <label>Hotel Name
              <input value={generalForm.hotelName} onChange={e => setGeneralForm(p => ({ ...p, hotelName: e.target.value }))} />
            </label>
            <label>GST Percentage (%)
              <input type="number" value={generalForm.gstPercentage} onChange={e => setGeneralForm(p => ({ ...p, gstPercentage: e.target.value }))} />
            </label>
            <label>Check-in Time
              <input value={generalForm.checkInTime} onChange={e => setGeneralForm(p => ({ ...p, checkInTime: e.target.value }))} />
            </label>
            <label>Check-out Time
              <input value={generalForm.checkOutTime} onChange={e => setGeneralForm(p => ({ ...p, checkOutTime: e.target.value }))} />
            </label>
            <label>Hotel Phone
              <input value={generalForm.hotelPhone} onChange={e => setGeneralForm(p => ({ ...p, hotelPhone: e.target.value }))} />
            </label>
            <label>Hotel Email
              <input value={generalForm.hotelEmail} onChange={e => setGeneralForm(p => ({ ...p, hotelEmail: e.target.value }))} />
            </label>

            <div className="field-grid__full" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {[
                { key: "maintenanceMode", label: "Maintenance Mode", desc: "Hides the site for non-admins" },
                { key: "festivalMode",    label: "Festival Mode",    desc: "Shows active festival banner" },
              ].map(({ key, label, desc }) => (
                <label key={key} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "1rem 1.25rem", borderRadius: 18,
                  background: generalForm[key] ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.03)",
                  border: `1px solid ${generalForm[key] ? "rgba(201,168,76,0.35)" : "rgba(201,168,76,0.1)"}`,
                  cursor: "pointer", transition: "all 0.25s ease", minWidth: 220,
                }}>
                  <div style={{
                    position: "relative", width: 44, height: 24, borderRadius: 999,
                    background: generalForm[key] ? "#c9a84c" : "rgba(143,133,121,0.2)",
                    transition: "background 0.3s ease", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", top: 3,
                      left: generalForm[key] ? "calc(100% - 21px)" : "3px",
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }} />
                    <input
                      type="checkbox"
                      checked={generalForm[key]}
                      onChange={e => setGeneralForm(p => ({ ...p, [key]: e.target.checked }))}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: "0.75rem", color: "#8f8579", marginTop: 1 }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="field-grid__full">
              <button type="button" className="btn btn-gold" onClick={saveGeneralSettings}>
                Save General Settings
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ════════ HERO IMAGES ════════ */}
      {activeTab === "hero" && (
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h3>Home Hero Slider</h3>
              <span>Images that cycle on the homepage slider</span>
            </div>
            <span style={{
              padding: "0.3rem 0.75rem", borderRadius: 999,
              background: "rgba(201,168,76,0.15)", color: "#c9a84c",
              fontSize: "0.78rem",
            }}>{heroImages.length} images</span>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            <label style={{
              display: "block", padding: "1.5rem",
              border: "2px dashed rgba(201,168,76,0.3)",
              borderRadius: 20, cursor: "pointer",
              background: "rgba(255,255,255,0.02)",
              textAlign: "center", transition: "all 0.25s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"}
            >
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploading.homeHero}
                onChange={e => uploadHeroFile(e.target.files?.[0])}
              />
              <Upload size={28} color="#c9a84c" style={{ margin: "0 auto 0.6rem" }} />
              <strong>{uploading.homeHero ? "Uploading…" : "Click to upload hero image"}</strong>
              <div style={{ fontSize: "0.78rem", color: "#8f8579", marginTop: 4 }}>
                JPG, PNG, WEBP · Recommended 1920×1080
              </div>
              {uploading.homeHero && (
                <div className="admin-upload-state" style={{ marginTop: "0.75rem" }}>
                  <span className="admin-spinner" />
                  Compressing and uploading hero image...
                </div>
              )}
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem" }}>
              <input
                value={heroUrl}
                onChange={e => setHeroUrl(e.target.value)}
                placeholder="Or paste an image URL…"
                style={{
                  background: "#ffffff", color: "#1a1a1a",
                  border: "1px solid rgba(201,168,76,0.18)", borderRadius: 16, padding: "0.85rem 1rem",
                }}
              />
              <button type="button" className="btn btn-outline" onClick={addHeroImage}>Add URL</button>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.85rem",
            marginTop: "1rem",
          }}>
            {heroImages.map((item, idx) => (
              <article key={item.id} style={{
                position: "relative", borderRadius: 18, overflow: "hidden",
                border: "1px solid rgba(201,168,76,0.2)",
                aspectRatio: "16/9", background: "#111",
              }}>
                <img
                  src={item.image || item.url}
                  alt={item.alt || "Hero"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)",
                }} />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "0.6rem 0.75rem",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.82)" }}>
                    Slide {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHeroImage(item.id)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "rgba(208,54,54,0.8)", color: "#fff",
                      border: "none", cursor: "pointer", display: "grid", placeItems: "center",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ════════ PAGE BANNERS ════════ */}
      {activeTab === "pages" && (
        <div className="admin-stack">
          <div style={{
            padding: "1rem 1.25rem", borderRadius: 18,
            background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
            display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem",
          }}>
            <Shield size={16} color="#c9a84c" />
            <span>Upload a hero banner for each page. These replace the default images on the live site.</span>
          </div>

          {PAGE_HERO_SLOTS.map(({ key, label, description, route }) => {
            const existing = getPageHero(key);
            const isLoading = uploading[key];

            return (
              <section key={key} className="admin-card" style={{ overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem" }}>{label}</h3>
                      <span style={{
                        padding: "0.2rem 0.6rem", borderRadius: 999,
                        background: existing ? "rgba(115,217,143,0.12)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${existing ? "rgba(115,217,143,0.35)" : "rgba(255,255,255,0.15)"}`,
                        fontSize: "0.7rem", color: existing ? "#2ba150" : "#8f8579",
                      }}>
                        {existing ? "✓ Custom image set" : "Using default"}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#8f8579" }}>
                      {description} · Route: <code style={{ color: "#c9a84c" }}>{route}</code>
                    </span>
                  </div>

                  {existing && (
                    <button
                      type="button"
                      onClick={() => removePageHero(key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "0.45rem 0.85rem", borderRadius: 12,
                        background: "rgba(208,54,54,0.12)", border: "1px solid rgba(208,54,54,0.25)",
                        color: "#ff8f8f", fontSize: "0.78rem", cursor: "pointer",
                      }}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  )}
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: existing ? "1fr 1fr" : "1fr",
                  gap: "1rem", marginTop: "1rem",
                }}
                  className="page-banner-upload-grid"
                >
                  {existing && (
                    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "16/6" }}>
                      <img
                        src={existing.imageUrl}
                        alt={`${label} hero`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{
                        position: "absolute", bottom: 8, left: 8,
                        padding: "0.25rem 0.6rem", borderRadius: 8,
                        background: "rgba(0,0,0,0.65)", color: "#faf8f5",
                        fontSize: "0.7rem",
                      }}>Current</div>
                    </div>
                  )}

                  <label style={{
                    display: "grid", placeItems: "center",
                    border: "2px dashed rgba(201,168,76,0.3)",
                    borderRadius: 16, cursor: "pointer",
                    background: isLoading ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.02)",
                    minHeight: 120, textAlign: "center", gap: "0.5rem",
                    padding: "1rem", transition: "all 0.25s ease",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={isLoading}
                      onChange={e => uploadPageHero(key, e.target.files?.[0])}
                    />
                    {isLoading ? (
                      <div style={{ color: "#c9a84c", fontSize: "0.85rem" }}>
                        <div style={{
                          width: 36, height: 36, border: "3px solid rgba(201,168,76,0.2)",
                          borderTopColor: "#c9a84c", borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          margin: "0 auto 0.5rem",
                        }} />
                        Uploading…
                      </div>
                    ) : (
                      <>
                        <Upload size={22} color="#c9a84c" />
                        <div style={{ fontSize: "0.82rem" }}>{existing ? "Upload replacement" : "Upload banner"}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8f8579" }}>JPG, PNG, WEBP</div>
                      </>
                    )}
                  </label>
                </div>

                <PageHeroUrlInput pageKey={key} existing={existing} onSave={setPageHeroUrl} />
              </section>
            );
          })}
        </div>
      )}

      {/* ════════ CONTENT ════════ */}
      {activeTab === "content" && (
        <section className="admin-card">
          <div className="admin-card__header">
            <h3>Testimonials</h3>
            <span>Guest reviews shown on the home page</span>
          </div>
          <div className="field-grid">
            <label>Guest Name
              <input value={testimonialForm.name} onChange={e => setTestimonialForm(p => ({ ...p, name: e.target.value }))} />
            </label>
            <label>Location
              <input value={testimonialForm.location} onChange={e => setTestimonialForm(p => ({ ...p, location: e.target.value }))} />
            </label>
            <label>Rating (1–5)
              <input type="number" min="1" max="5" value={testimonialForm.rating} onChange={e => setTestimonialForm(p => ({ ...p, rating: Number(e.target.value) }))} />
            </label>
            <label className="field-grid__full">Testimonial Text
              <textarea rows="4" value={testimonialForm.text} onChange={e => setTestimonialForm(p => ({ ...p, text: e.target.value }))} />
            </label>
            <div className="field-grid__full table-actions">
              <button type="button" className="btn btn-outline" onClick={addTestimonial}>
                <Save size={14} /> {editingTestimonialId ? "Update Testimonial" : "Save Testimonial"}
              </button>
              {editingTestimonialId && (
                <button type="button" className="btn btn-ghost" onClick={resetTestimonialForm}>
                  <X size={14} /> Cancel
                </button>
              )}
            </div>
          </div>

          <div className="activity-feed" style={{ marginTop: "1rem" }}>
            {testimonials.map(item => (
              <article key={item.id} className="notification-card">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} size={12} fill="#c9a84c" color="#c9a84c" />
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <strong>{item.name}</strong>
                  <small>{item.location} · "{item.text?.slice(0, 60)}…"</small>
                </div>
                <div className="table-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => startTestimonialEdit(item)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => removeItem("testimonials", item.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
            {!testimonials.length && (
              <p style={{ color: "#8f8579", fontSize: "0.85rem" }}>No testimonials yet.</p>
            )}
          </div>
        </section>
      )}

      {/* ════════ FOUNDERS ════════ */}
      {activeTab === "founders" && (
        <section className="admin-card">
          <div className="admin-card__header">
            <div>
              <h3>{editingFounderId ? "Edit Founder" : "Founders"}</h3>
              <span>Leadership team shown on the About page</span>
            </div>
            {editingFounderId && (
              <button type="button" className="btn btn-outline" onClick={resetFounderForm}>
                <X size={14} /> Cancel Edit
              </button>
            )}
          </div>
          <div className="field-grid">
            <label>Name
              <input value={founderForm.name} onChange={e => setFounderForm(p => ({ ...p, name: e.target.value }))} />
            </label>
            <label>Role
              <input value={founderForm.role} onChange={e => setFounderForm(p => ({ ...p, role: e.target.value }))} />
            </label>
            <label>Image URL
              <input value={founderForm.image} onChange={e => setFounderForm(p => ({ ...p, image: e.target.value }))} placeholder="https://…" />
            </label>
            <label>Upload Image
              <input type="file" accept="image/*" onChange={e => setFounderImageFile(e.target.files?.[0] || null)} disabled={uploading.founder} />
              <small>{founderImageFile ? `${founderImageFile.name} selected` : "Optional. Uploaded image replaces the URL above."}</small>
              {uploading.founder && (
                <div className="admin-upload-state">
                  <span className="admin-spinner" />
                  Compressing and uploading founder image...
                </div>
              )}
            </label>
            <label>LinkedIn
              <input value={founderForm.linkedin} onChange={e => setFounderForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/…" />
            </label>
            <label className="field-grid__full">Bio
              <textarea rows="4" value={founderForm.bio} onChange={e => setFounderForm(p => ({ ...p, bio: e.target.value }))} />
            </label>
            <div className="field-grid__full">
              <button type="button" className="btn btn-gold" onClick={addFounder} disabled={uploading.founder}>
                <Save size={14} /> {editingFounderId ? "Update Founder" : "Add Founder"}
              </button>
            </div>
          </div>

          <div className="gallery-admin-grid" style={{ marginTop: "1rem" }}>
            {founders.map(founder => (
              <article key={founder.id} className="admin-card admin-card--gallery">
                <img src={founder.image || "https://via.placeholder.com/200"} alt={founder.name} loading="lazy" />
                <div>
                  <strong>{founder.name}</strong>
                  <small>{founder.role}</small>
                </div>
                <div className="table-actions">
                  <button type="button" className="btn btn-outline" onClick={() => startFounderEdit(founder)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => removeItem("founders", founder.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .page-banner-upload-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

const PageHeroUrlInput = ({ pageKey, existing, onSave }) => {
  const [url, setUrl] = useState("");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.65rem", marginTop: "0.75rem" }}>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Or paste an image URL…"
        style={{
          background: "#ffffff", color: "#1a1a1a",
          border: "1px solid rgba(201,168,76,0.18)", borderRadius: 14,
          padding: "0.7rem 1rem", fontSize: "0.85rem",
        }}
      />
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => { if (url.trim()) { onSave(pageKey, url); setUrl(""); } }}
      >
        Set URL
      </button>
    </div>
  );
};

export default AdminSettings;
