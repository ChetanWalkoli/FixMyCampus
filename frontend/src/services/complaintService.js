import api from "./api";

export const createComplaint = async (formData) => {
  const response = await api.post("/complaints", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getMyComplaints = async (params = {}) => {
  const response = await api.get("/complaints/my", { params });
  return response.data;
};

export const getComplaintById = async (id) => {
  const response = await api.get(`/complaints/${id}`);
  return response.data;
};
