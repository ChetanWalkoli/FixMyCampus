export const COMPLAINT_CATEGORIES = [
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "furniture", label: "Furniture" },
  { value: "cleaning", label: "Cleaning" },
  { value: "network", label: "Network / Wi-Fi" },
  { value: "equipment", label: "Lab / Classroom Equipment" },
  { value: "other", label: "Other" },
];

export const COMPLAINT_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const CAMPUS_BLOCKS = [
  "Main Academic Block",
  "Computer & IT Block",
  "Engineering Workshop",
  "Central Library",
  "Hostel A",
  "Hostel B",
  "Cafeteria & Common Area",
  "Sports Complex",
];

export const STATUS_META = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  assigned: {
    label: "Assigned",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  reopened: {
    label: "Reopened",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

export const PRIORITY_META = {
  low: {
    label: "Low",
    className: "bg-slate-100 text-slate-700",
  },
  medium: {
    label: "Medium",
    className: "bg-sky-50 text-sky-700",
  },
  high: {
    label: "High",
    className: "bg-amber-50 text-amber-700",
  },
  urgent: {
    label: "Urgent",
    className: "bg-rose-50 text-rose-700",
  },
};
