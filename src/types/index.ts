export type LeadStatus = "belum" | "sudah" | "group" | "noaktif";

export interface User {
  id: string;
  email: string;
  business_name?: string;
}

export interface Batch {
  id: string;
  user_id: string;
  name: string;
  file_name: string | null;
  uploaded_at: string;
  total_leads: number;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  batch_id: string;
  name: string;
  phone: string;
  city: string;
  age: string;
  job: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  created_at: string;
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  belum: "Belum di followup",
  sudah: "Sudah di followup",
  group: "Sudah masuk group",
  noaktif: "No tidak aktif",
};

export const AVAILABLE_VARIABLES = [
  { key: "nama", label: "{nama}" },
  { key: "telepon", label: "{telepon}" },
  { key: "kota", label: "{kota}" },
  { key: "usia", label: "{usia}" },
  { key: "pekerjaan", label: "{pekerjaan}" },
];