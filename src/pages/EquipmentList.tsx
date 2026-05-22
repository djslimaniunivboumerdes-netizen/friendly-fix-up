import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Fuse from "fuse.js";
import { Search, Download, ArrowRight, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EQUIPMENT, UNITS, STATUSES, type Equipment } from "@/data";
import { exportToCsv } from "@/lib/industrial";
import { useI18n } from "@/contexts/I18nContext";

const PAGE_SIZE = 50;

export default function EquipmentList() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [unit, setUnit] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);

  const fuse = useMemo(
    () => new Fuse(EQUIPMENT, {
      threshold: 0.35,
      keys: ["tag", "name", "technical.serial_no", "unit", "section", "type.name", "notes"],
    }),
    []
  );

  const filtered = useMemo(() => {
    let list: Equipment[] = query.trim() ? fuse.search(query).map((r) => r.item) : EQUIPMENT;
    if (unit !== "all") list = list.filter((e) => e.unit === unit);
    if (status !== "all") list = list.filter((e) => e.testing_status === status);
    return list;
  }, [query, unit, status, fuse]);

  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleExport = () => {
    exportToCsv("gnl1z_equipment.csv", filtered.map((e) => ({
      tag: e.tag, name: e.name, type: e.type.name, unit: e.unit, section: e.section,
      status: e.testing_status, weight_kg: e.technical.weight_kg, pressure_bar: e.technical.pressure_bar,
      volume_m3: e.technical.volume_m3, serial_no: e.technical.serial_no,
      parts_count: e.spare_parts.count, notes: e.notes ?? "",
    })));
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-accent font-mono mb-1">/ {t("equipment")}</div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{t("equipment")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} / {EQUIPMENT.length} equipment items
          </p>
        </div>
        <Button onClick={handleExport} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 self-start">
          <Download className="h-4 w-4" /> {t("exportCsv")}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchEquipment")}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            className="pl-9 h-11"
          />
        </div>
        <Select value={unit} onValueChange={(v) => { setUnit(v); setPage(0); }}>
          <SelectTrigger className="h-11 md:w-44"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="h-11 md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterStatus")}</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table - desktop */}
      <div className="hidden md:block border border-border rounded-lg overflow-hidden bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">{t("tag")}</th>
              <th className="text-left px-4 py-3 font-semibold">{t("name")}</th>
              <th className="text-left px-4 py-3 font-semibold">{t("type")}</th>
              <th className="text-left px-4 py-3 font-semibold">{t("unit")}</th>
              <th className="text-left px-4 py-3 font-semibold">{t("section")}</th>
              <th className="text-left px-4 py-3 font-semibold">{t("status")}</th>
              <th className="text-right px-4 py-3 font-semibold">{t("parts")}</th>
              <th className="px-2"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((e) => (
              <tr key={e.tag} className="border-t border-border hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-accent">{e.tag}</td>
                <td className="px-4 py-3 max-w-[300px] truncate">{e.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.type.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.unit}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{e.section}</td>
                <td className="px-4 py-3"><StatusChip status={e.testing_status} /></td>
                <td className="px-4 py-3 text-right font-mono">{e.spare_parts.count}</td>
                <td className="px-2 py-3">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:text-accent">
                    <Link to={`/equipment/${encodeURIComponent(e.tag)}`}><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">{t("noResults")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards - mobile */}
      <div className="md:hidden space-y-3">
        {pageItems.map((e) => (
          <Link key={e.tag} to={`/equipment/${encodeURIComponent(e.tag)}`}
            className="block border border-border rounded-lg bg-card p-4 shadow-card active:scale-[0.99] transition-transform">
            <div className="flex items-start justify-between gap-2">
              <div className="font-mono text-sm font-semibold text-accent">{e.tag}</div>
              <StatusChip status={e.testing_status} />
            </div>
            <div className="text-sm font-medium mt-1.5 line-clamp-2">{e.name}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 font-mono">
              <span>{e.unit}</span>
              <span>·</span>
              <span>{e.section}</span>
              <span className="ml-auto">{e.spare_parts.count} parts</span>
            </div>
          </Link>
        ))}
        {pageItems.length === 0 && <div className="text-center text-muted-foreground py-12">{t("noResults")}</div>}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-5 text-sm">
          <span className="text-muted-foreground">Page {page + 1} / {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const variant = status === "DEROGATION" ? "bg-destructive/15 text-destructive border-destructive/30"
    : status === "PREVENTIVE" ? "bg-success/15 text-success border-success/30"
    : "bg-warning/15 text-warning-foreground border-warning/30";
  return <Badge variant="outline" className={`font-mono text-[10px] ${variant}`}>{status}</Badge>;
}
