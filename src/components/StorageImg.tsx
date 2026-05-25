import { useState, useEffect, type ImgHTMLAttributes } from "react";
import { Cpu } from "lucide-react";

interface StorageImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> {
  storagePath: string;
  alt: string;
  fallbackClassName?: string;
}

/**
 * Resilient Supabase Storage image.
 * Public URL: https://gdkqetzkhgllwbpmqmux.supabase.co/storage/v1/object/public/equipment-images/[path]
 */
export function StorageImg({ storagePath, alt, fallbackClassName, className, ...rest }: StorageImgProps) {
  const SUPABASE_URL = "https://gdkqetzkhgllwbpmqmux.supabase.co";
  const BUCKET_NAME = "equipment-images";

  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { 
    setFailed(false); 
    setLoaded(false); 
  }, [storagePath]);

  if (failed) {
    return (
      <div className={fallbackClassName ?? "flex flex-col items-center justify-center gap-2 text-white/30 w-full h-full"}>
        <Cpu className="h-8 w-8" />
        <span className="text-[10px] font-mono uppercase tracking-widest">DCS Screen</span>
        <span className="text-[10px] text-white/20">Image unavailable</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className="h-6 w-6 text-white/20 animate-pulse" />
        </div>
      )}
      <img
        key={url}
        src={url}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={className}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        {...rest}
      />
    </>
  );
}
