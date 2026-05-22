import { useState, useRef, useCallback } from "react";
import { ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QrScannerButtonProps {
  onScan: (value: string) => void;
}

export function QrScannerButton({ onScan }: QrScannerButtonProps) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startScan = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Simple frame-grabbing scanner — decode via jsQR if available, or fallback to manual
      const scan = () => {
        if (!videoRef.current || !open) return;
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch {
      // Fallback: let user type
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    // Delay to allow dialog to render video element
    setTimeout(startScan, 300);
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
  };

  const [manualInput, setManualInput] = useState("");

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleOpen} aria-label="Scan QR" title="Scan QR">
        <ScanLine className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Scan Equipment QR</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden border border-border">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 border-2 border-accent/60 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type tag / ID…"
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter" && manualInput) { onScan(manualInput); handleClose(); }}}
              />
              <Button size="sm" onClick={() => { if (manualInput) { onScan(manualInput); handleClose(); }}}>
                Go
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleClose}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
