import api from "@/lib/api";

export const uploadService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};
