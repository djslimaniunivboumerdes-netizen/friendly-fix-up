import { idb } from "./db";
import { supabase } from "@/integrations/supabase/client";

let running = false;

export async function flushQueue(): Promise<{ logs: number; uploads: number; errors: number }> {
  if (running || !navigator.onLine) return { logs: 0, uploads: 0, errors: 0 };
  running = true;
  let logs = 0, uploads = 0, errors = 0;
  try {
    // Logs
    const pendingLogs = await idb.pendingLogs.toArray();
    for (const log of pendingLogs) {
      const { id, ...payload } = log;
      const { error } = await supabase.from("maintenance_logs" as never).insert(payload as never);
      if (error) { errors++; continue; }
      if (id) await idb.pendingLogs.delete(id);
      logs++;
    }
    // Uploads
    const pendingUploads = await idb.pendingUploads.toArray();
    for (const up of pendingUploads) {
      const path = `${up.tag}/${Date.now()}-${up.file_name}`;
      const { error: upErr } = await supabase.storage.from("equipment-photos").upload(path, up.blob, {
        contentType: up.mime_type,
        upsert: false,
      });
      if (upErr) { errors++; continue; }
      const { error: insErr } = await supabase.from("equipment_images" as never).insert({
        tag: up.tag,
        file_path: path,
        file_name: up.file_name,
        mime_type: up.mime_type,
        size_bytes: up.blob.size,
        uploaded_by: up.uploaded_by,
      } as never);
      if (insErr) { errors++; continue; }
      if (up.id) await idb.pendingUploads.delete(up.id);
      uploads++;
    }
  } finally {
    running = false;
  }
  return { logs, uploads, errors };
}

export function initSync() {
  window.addEventListener("online", () => { void flushQueue(); });
  // Periodic retry every 60s
  setInterval(() => { void flushQueue(); }, 60_000);
  // Initial attempt
  setTimeout(() => { void flushQueue(); }, 2000);
}
