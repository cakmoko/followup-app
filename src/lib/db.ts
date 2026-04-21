import { createClient } from "@supabase/supabase-js";
import { Lead, LeadStatus, Batch, Template, UserProfile } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========== AUTH ==========

export async function signUp(email: string, password: string, businessName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        business_name: businessName || "",
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getProfile(): Promise<UserProfile | null> {
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) return null;
  return data;
}

export async function updateProfile(businessName: string) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_profiles")
    .update({ business_name: businessName })
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ========== BATCHES ==========

export async function getBatches(): Promise<Batch[]> {
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBatch(id: string): Promise<Batch | null> {
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createBatch(name: string, fileName?: string): Promise<Batch> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("batches")
    .insert({
      user_id: user.id,
      name,
      file_name: fileName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBatchTotalLeads(batchId: string, total: number) {
  await supabase
    .from("batches")
    .update({ total_leads: total })
    .eq("id", batchId);
}

export async function deleteBatch(batchId: string) {
  // Leads will be deleted automatically via CASCADE
  const { error } = await supabase
    .from("batches")
    .delete()
    .eq("id", batchId);

  if (error) throw error;
}

export async function getBatchStats(batchId: string): Promise<{ total: number; belum: number; sudah: number; group: number; noaktif: number }> {
  const leads = await getLeadsByBatch(batchId);
  return {
    total: leads.length,
    belum: leads.filter(l => l.status === "belum").length,
    sudah: leads.filter(l => l.status === "sudah").length,
    group: leads.filter(l => l.status === "group").length,
    noaktif: leads.filter(l => l.status === "noaktif").length,
  };
}

// ========== LEADS ==========

export async function getLeadsByBatch(batchId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createLeads(batchId: string, leads: Partial<Lead>[]): Promise<void> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const leadsWithUser = leads.map(l => ({
    ...l,
    user_id: user.id,
    batch_id: batchId,
  }));

  const { error } = await supabase
    .from("leads")
    .insert(leadsWithUser);

  if (error) throw error;

  // Update batch total
  await updateBatchTotalLeads(batchId, leads.length);
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteAllLeadsInBatch(batchId: string): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("batch_id", batchId);

  if (error) throw error;

  // Update batch total to 0
  await updateBatchTotalLeads(batchId, 0);
}

export async function getOverallStats(): Promise<{ total: number; belum: number; sudah: number; group: number; noaktif: number }> {
  const leads = await getAllLeads();
  return {
    total: leads.length,
    belum: leads.filter(l => l.status === "belum").length,
    sudah: leads.filter(l => l.status === "sudah").length,
    group: leads.filter(l => l.status === "group").length,
    noaktif: leads.filter(l => l.status === "noaktif").length,
  };
}

// ========== TEMPLATES ==========

export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTemplate(template: Partial<Template>): Promise<Template> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("templates")
    .insert({ ...template, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, template: Partial<Template>): Promise<void> {
  const { error } = await supabase
    .from("templates")
    .update(template)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ========== HELPER FUNCTIONS ==========

export function formatWANumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

export function replaceVariables(template: string, lead: Lead): string {
  let result = template;
  result = result.replace(/\{nama\}/g, lead.name || "");
  result = result.replace(/\{telepon\}/g, lead.phone || "");
  result = result.replace(/\{kota\}/g, lead.city || "");
  result = result.replace(/\{usia\}/g, lead.age || "");
  result = result.replace(/\{pekerjaan\}/g, lead.job || "");
  return result;
}

export function generateWALink(lead: Lead, templateContent: string): string {
  const formattedPhone = formatWANumber(lead.phone);
  const message = replaceVariables(templateContent, lead);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export function findColumns(headers: string[]): { name: number; phone: number; city: number; age: number; job: number } {
  const map = { name: -1, phone: -1, city: -1, age: -1, job: -1 };

  headers.forEach((h, i) => {
    const lower = (h || "").toString().toLowerCase().trim();
    if (lower === "nilai 1") map.name = i;
    if (lower === "nilai 2") map.phone = i;
    if (lower === "nilai 3") map.city = i;
    if (lower === "nilai 4") map.age = i;
    if (lower === "nilai 5") map.job = i;
  });

  headers.forEach((h, i) => {
    const lower = (h || "").toString().toLowerCase().trim();

    if (map.name === -1 && lower.includes("nama") &&
        !lower.includes("nama 2") && !lower.includes("nama 3") &&
        !lower.includes("nama 4") && !lower.includes("nama 5")) {
      map.name = i;
    }

    if (map.phone === -1 && (
      lower.includes("whatsapp") || lower.includes("wa") ||
      lower.includes("telepon") || lower.includes("phone") ||
      lower.includes("hp") || lower.includes("no hp")
    )) {
      map.phone = i;
    }

    if (map.city === -1 && (
      lower.includes("kota") || lower.includes("kecamatan") ||
      lower.includes("alamat") || lower.includes("domisili")
    )) {
      map.city = i;
    }

    if (map.age === -1 && (
      lower.includes("usia") || lower.includes("umur") || lower.includes("age")
    )) {
      map.age = i;
    }

    if (map.job === -1 && (
      lower.includes("pekerjaan") || lower.includes("kegiatan") ||
      lower.includes("profesi") || lower.includes("kerja")
    )) {
      map.job = i;
    }
  });

  if (map.name === -1) map.name = 1;
  if (map.phone === -1) map.phone = 3;
  if (map.city === -1) map.city = 5;
  if (map.age === -1) map.age = 7;
  if (map.job === -1) map.job = 9;

  return map;
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 8;
}