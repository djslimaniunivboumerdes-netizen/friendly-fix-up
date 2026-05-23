import { useState, useEffect, type ImgHTMLAttributes } from "react";
import { Cpu } from "lucide-react";
import { driveImageFallbacks } from "@/data/dcs_panels";

interface DriveImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> {
  driveId: string;
  alt: string;
  fallbackClassName?: string;
}

/**
 * Resilient Google-Drive image. Tries a chain of URLs (lh3 → thumbnail w1600 → w800 → uc?export=view)
 * before showing a neutral placeholder. Prevents "crushed" / broken-img DCS thumbnails when Google
 * rate-limits the thumbnail endpoint.
 */
export function DriveImg({ driveId, alt, fallbackClassName, className, ...rest }: DriveImgProps) {
  const urls = driveImageFallbacks(driveId);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => { setIdx(0); setFailed(false); }, [driveId]);

  if (failed) {
    return (
      <div className={fallbackClassName ?? "flex flex-col items-center justify-center gap-2 text-white/30 w-full h-full"}>
        <Cpu className="h-8 w-8" />
        <span className="text-[10px] font-mono uppercase tracking-widest">DCS Screen</span>
      </div>
    );
  }

  return (
    <img
      key={urls[idx]}
      src={urls[idx]}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        if (idx + 1 < urls.length) setIdx(idx + 1);
        else setFailed(true);
      }}
      {...rest}
    />
  );
}
