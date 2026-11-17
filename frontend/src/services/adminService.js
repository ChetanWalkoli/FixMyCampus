import api from "./api";

export const getAdminComplaints = async (params = {}) => {
  const response = await api.get("/admin/complaints", { params });
  return response.data;
};

export const getAdminComplaintById = async (id) => {
  const response = await api.get(`/admin/complaints/${id}`);
  return response.data;
};

export const reviewComplaint = async (id, payload) => {
  const response = await api.patch(`/admin/complaints/${id}/review`, payload);
  return response.data;
};

export const assignComplaintStaff = async (id, payload) => {
  const response = await api.patch(`/admin/complaints/${id}/assign`, payload);
  return response.data;
};

export const updateComplaintPriority = async (id, payload) => {
  const response = await api.patch(`/admin/complaints/${id}/priority`, payload);
  return response.data;
};

export const getStaffList = async () => {
  const response = await api.get("/admin/staff");
  return response.data;
};

export const createStaffMember = async (payload) => {
  const response = await api.post("/admin/staff", payload);
  return response.data;
};

export const updateStaffMember = async (id, payload) => {
  const response = await api.patch(`/admin/staff/${id}`, payload);
  return response.data;
};
