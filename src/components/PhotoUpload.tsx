import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { compressToWebP } from "@/lib/imageCompress";
import { idb } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

export function PhotoUpload({ tag, onUploaded }: { tag: string; onUploaded?: () => void }) {
  const { user } = useAuth();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressToWebP(file);
      const fileName = file.name.replace(/\.[^.]+$/, "") + ".webp";

      if (!navigator.onLine || !user) {
        await idb.pendingUploads.add({
          tag, file_name: fileName, mime_type: "image/webp",
          blob, uploaded_by: user?.id ?? null, created_at: new Date().toISOString(),
        });
        toast({ title: "Queued offline", description: "Photo will upload when online." });
      } else {
        const path = `${tag}/${Date.now()}-${fileName}`;
        const { error: upErr } = await supabase.storage.from("equipment-photos").upload(path, blob, {
          contentType: "image/webp",
        });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("equipment_images" as never).insert({
          tag, file_path: path, file_name: fileName,
          mime_type: "image/webp", size_bytes: blob.size, uploaded_by: user.id,
        } as never);
        if (insErr) throw insErr;
        toast({ title: "Photo uploaded" });
        onUploaded?.();
      }
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handle}
        className="hidden"
      />
      <Button size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()} className="gap-1.5">
        {busy ? <Upload className="h-3.5 w-3.5 animate-pulse" /> : <Camera className="h-3.5 w-3.5" />}
        {busy ? "Uploading…" : "Add photo"}
      </Button>
    </>
  );
}
