const IMGBB_API_KEY =
  import.meta.env.VITE_IMGBB_API_KEY;

export const uploadToImgBB = async (file) => {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("ImgBB upload failed.");
  }

  const data = await response.json();

  return {
    url: data.data.display_url,
    deleteUrl: data.data.delete_url,
  };
};

export const uploadMultipleToImgBB =
  async (files) => {
    return Promise.all(
      files.map((file) =>
        uploadToImgBB(file)
      )
    );
  };