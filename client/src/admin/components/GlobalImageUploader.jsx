import React, { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../utils/firebase";

const GlobalImageUploader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'warning' | 'info' }
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    e.target.value = null; // Reset input

    if (files.length + selected.length > 5) {
      showToast("Maximum 5 images allowed.", "warning");
      return;
    }

    const newFiles = [...files];
    let hasDuplicate = false;

    selected.forEach(file => {
      // Duplicate check by name and size to ensure no duplicates in advanced way
      const isDuplicate = newFiles.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        hasDuplicate = true;
      } else {
        newFiles.push(file);
      }
    });

    if (hasDuplicate) {
      showToast("Duplicates removed. Each image must be unique.", "warning");
    }

    setFiles(newFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    showToast(`Uploading ${files.length} image(s)...`, "info");

    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `admin_uploads/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      });

      await Promise.all(uploadPromises);
      showToast("Upload complete! Images successfully stored without duplicates.", "success");
      setFiles([]);
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Failed to upload images. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #c9a84c, #e8d5a3)",
          color: "#1a1a1a", border: "none",
          display: "grid", placeItems: "center",
          boxShadow: "0 8px 24px rgba(201,168,76,0.3)",
          cursor: "pointer", transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Global Asset Manager"
      >
        {isOpen ? <X size={24} /> : <UploadCloud size={24} />}
      </button>

      {/* Advanced Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "6.5rem", right: "2rem", zIndex: 10000,
          background: "#ffffff",
          border: `1px solid ${toast.type === 'success' ? '#2ba150' : toast.type === 'error' ? '#d03636' : toast.type === 'warning' ? '#f59e0b' : 'rgba(201,168,76,0.5)'}`,
          padding: "1rem 1.25rem", borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center", gap: "0.75rem",
          animation: "slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {toast.type === 'success' && <CheckCircle size={20} color="#2ba150" />}
          {toast.type === 'error' && <AlertCircle size={20} color="#d03636" />}
          {toast.type === 'warning' && <AlertCircle size={20} color="#f59e0b" />}
          {toast.type === 'info' && <Loader size={20} color="#c9a84c" className="spin" />}
          <span style={{ fontSize: "0.85rem", color: "#1a1a1a", fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Upload Panel */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "6.5rem", right: "2rem", zIndex: 9998,
          width: 340, background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(201,168,76,0.2)", borderRadius: 24,
          padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
          animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          transformOrigin: "bottom right"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>
            Global Asset Manager
          </h3>
          
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              border: "2px dashed rgba(201,168,76,0.3)", borderRadius: 16,
              padding: "2rem 1rem", textAlign: "center", cursor: isUploading ? "default" : "pointer",
              background: "rgba(201,168,76,0.02)", transition: "all 0.2s"
            }}
            onMouseEnter={e => { if (!isUploading) e.currentTarget.style.background = "rgba(201,168,76,0.05)" }}
            onMouseLeave={e => { if (!isUploading) e.currentTarget.style.background = "rgba(201,168,76,0.02)" }}
          >
            <ImageIcon size={32} color="#c9a84c" style={{ margin: "0 auto 0.5rem" }} />
            <div style={{ fontSize: "0.8rem", color: "#1a1a1a", fontWeight: 500 }}>Click to select images</div>
            <div style={{ fontSize: "0.65rem", color: "#8f8579", marginTop: 4 }}>Up to 5 images (PNG, JPG, WEBP)</div>
            <input 
              type="file" multiple accept="image/*" 
              ref={fileInputRef} onChange={handleFileSelect}
              style={{ display: "none" }} 
              disabled={isUploading}
            />
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: "1.25rem", animation: "slideInUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#8f8579", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Selected ({files.length}/5)
                </div>
                <div style={{ fontSize: "0.65rem", color: "#c9a84c", fontWeight: 500 }}>
                  Duplicates prevented
                </div>
              </div>
              <div style={{ display: "grid", gap: "0.5rem", maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                {files.map((file, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.5rem 0.75rem", background: "#f4f1eb", borderRadius: 10,
                    border: "1px solid rgba(201,168,76,0.1)"
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "#5a5a5a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                      {file.name}
                    </span>
                    <button 
                      onClick={() => removeFile(i)} disabled={isUploading}
                      style={{ background: "none", border: "none", color: "#d03636", cursor: isUploading ? "default" : "pointer", padding: 2 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading}
                style={{
                  width: "100%", marginTop: "1rem", padding: "0.75rem", borderRadius: 12,
                  background: isUploading ? "#8f8579" : "#1a1a1a",
                  color: "#ffffff", border: "none", fontWeight: 600, fontSize: "0.85rem",
                  cursor: isUploading ? "wait" : "pointer", transition: "background 0.2s"
                }}
              >
                {isUploading ? "Uploading Securely..." : "Upload Images"}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default GlobalImageUploader;
