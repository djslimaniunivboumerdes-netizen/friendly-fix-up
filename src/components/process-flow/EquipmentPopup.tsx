import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProcessNode } from "@/data/process_nodes";

interface Props {
  node?: ProcessNode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenPid: () => void;
}

export default function EquipmentPopup({
  node,
  open,
  onOpenChange,
  onOpenPid,
}: Props) {
  const navigate = useNavigate();

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-md">
        <div className="space-y-5">
          <div>
            <div className="text-cyan-400 text-sm font-bold">
              {node.tag}
            </div>
            <h2 className="text-2xl font-bold mt-1">{node.title}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <div className="text-xs text-slate-400">Temperature</div>
              <div className="font-bold mt-1">{node.temperature}</div>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <div className="text-xs text-slate-400">Pressure</div>
              <div className="font-bold mt-1">{node.pressure}</div>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <div className="text-xs text-slate-400">Fluid</div>
              <div className="font-bold mt-1">{node.fluid}</div>
            </div>
          </div>

          <div className="flex gap-3">
            {node.equipmentPage && (
              <Button
                className="flex-1"
                onClick={() => navigate(node.equipmentPage!)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Equipment Info
              </Button>
            )}

            {node.pidPdf && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={onOpenPid}
              >
                <FileText className="mr-2 h-4 w-4" />
                Open P&ID
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
