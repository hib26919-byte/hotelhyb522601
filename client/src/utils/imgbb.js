const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export const MAX_UPLOAD_SIZE_BYTES = 500 * 1024;

const IMAGE_PRESETS = {
  default: {
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    maxWidth: 1800,
    maxHeight: 1400,
    qualityStart: 0.94,
    minQuality: 0.82,
    mimeType: "image/jpeg",
  },
  hero: {
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    maxWidth: 2400,
    maxHeight: 1400,
    qualityStart: 0.95,
    minQuality: 0.84,
    mimeType: "image/jpeg",
  },
  banner: {
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    maxWidth: 2200,
    maxHeight: 1200,
    qualityStart: 0.95,
    minQuality: 0.84,
    mimeType: "image/jpeg",
  },
  room: {
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    maxWidth: 1800,
    maxHeight: 1200,
    qualityStart: 0.94,
    minQuality: 0.82,
    mimeType: "image/jpeg",
  },
  gallery: {
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    maxWidth: 1800,
    maxHeight: 1400,
    qualityStart: 0.94,
    minQuality: 0.82,
    mimeType: "image/jpeg",
  },
};

const bytesToKb = (bytes) => Math.max(1, Math.round(bytes / 1024));

export const formatImageSize = (bytes) => `${bytesToKb(bytes)} KB`;

const getPreset = (preset = "default", overrides = {}) => ({
  ...IMAGE_PRESETS.default,
  ...(IMAGE_PRESETS[preset] || {}),
  ...overrides,
});

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image."));
    };

    image.src = objectUrl;
  });

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not compress the image."));
      },
      mimeType,
      quality,
    );
  });

const calculateSize = (width, height, maxWidth, maxHeight, scale = 1) => {
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(1, widthRatio, heightRatio) * scale;

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const drawImage = (image, dimensions) => {
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas;
};

const fileFromBlob = (blob, originalFile) => {
  const baseName = originalFile.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, {
    type: blob.type || "image/jpeg",
    lastModified: Date.now(),
  });
};

export const compressImageFile = async (file, options = {}) => {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const preset = getPreset(options.preset, options);
  const originalSize = file.size;

  if (originalSize <= preset.maxSizeBytes && !options.forceCompress) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      skipped: true,
      sizeLabel: formatImageSize(originalSize),
    };
  }

  const image = await loadImageFromFile(file);
  let scale = 1;
  let bestBlob = null;

  while (scale >= 0.38) {
    const dimensions = calculateSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      preset.maxWidth,
      preset.maxHeight,
      scale,
    );
    const canvas = drawImage(image, dimensions);

    for (
      let quality = preset.qualityStart;
      quality >= preset.minQuality;
      quality -= 0.04
    ) {
      const blob = await canvasToBlob(canvas, preset.mimeType, quality);
      bestBlob = blob;

      if (blob.size <= preset.maxSizeBytes) {
        const compressedFile = fileFromBlob(blob, file);
        return {
          file: compressedFile,
          originalSize,
          compressedSize: compressedFile.size,
          skipped: false,
          sizeLabel: `${formatImageSize(originalSize)} -> ${formatImageSize(compressedFile.size)}`,
        };
      }
    }

    scale -= 0.08;
  }

  const fallbackFile = fileFromBlob(bestBlob, file);

  return {
    file: fallbackFile,
    originalSize,
    compressedSize: fallbackFile.size,
    skipped: false,
    sizeLabel: `${formatImageSize(originalSize)} -> ${formatImageSize(fallbackFile.size)}`,
  };
};

export const uploadToImgBB = async (file, options = {}) => {
  if (!IMGBB_API_KEY) {
    throw new Error("ImgBB API key is missing. Add VITE_IMGBB_API_KEY to the client environment.");
  }

  const compressed = await compressImageFile(file, options);
  const formData = new FormData();
  formData.append("image", compressed.file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("ImgBB upload failed.");
  }

  const data = await response.json();

  return {
    url: data.data.display_url,
    deleteUrl: data.data.delete_url,
    compression: compressed,
  };
};

export const uploadMultipleToImgBB = async (files, options = {}) => {
  const results = [];

  for (const [index, file] of files.entries()) {
    options.onProgress?.({
      current: index + 1,
      total: files.length,
      fileName: file.name,
      stage: "compressing",
    });

    const upload = await uploadToImgBB(file, options);
    results.push(upload);

    options.onProgress?.({
      current: index + 1,
      total: files.length,
      fileName: file.name,
      stage: "uploaded",
      compression: upload.compression,
    });
  }

  return results;
};
