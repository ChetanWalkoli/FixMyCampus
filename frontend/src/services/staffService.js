import api from "./api";

export const getStaffComplaints = async (params = {}) => {
  const response = await api.get("/staff/complaints", { params });
  return response.data;
};

export const getStaffComplaintById = async (id) => {
  const response = await api.get(`/staff/complaints/${id}`);
  return response.data;
};

export const updateStaffTaskStatus = async (id, payload) => {
  const response = await api.patch(`/staff/complaints/${id}/status`, payload);
  return response.data;
};

export const uploadResolutionProof = async (id, formData) => {
  const response = await api.post(`/staff/complaints/${id}/proof`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getStaffWorkHistory = async () => {
  const response = await api.get("/staff/history");
  return response.data;
};
