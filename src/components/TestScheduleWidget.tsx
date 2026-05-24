import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EQUIPMENT } from "@/data";

interface DateRow { tag: string; next_test_due: string | null }

export function TestScheduleWidget() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("equipment_test_dates").select("tag, next_test_due").then(({ data }) => {
      const m: Record<string, string> = {};
      (data as DateRow[] | null)?.forEach((r) => { if (r.next_test_due) m[r.tag] = r.next_test_due; });
      setOverrides(m);
    });
  }, []);

  const buckets = useMemo(() => {
    const today = new Date();
    let overdue = 0, d30 = 0, d60 = 0, d90 = 0;
    for (const eq of EQUIPMENT) {
      const due = overrides[eq.tag] ?? eq.maintenance.next_test_due;
      if (!due) continue;
      let d: Date;
      try { d = parseISO(due); } catch { continue; }
      const diff = differenceInDays(d, today);
      if (diff < 0) overdue++;
      else if (diff <= 30) d30++;
      else if (diff <= 60) d60++;
      else if (diff <= 90) d90++;
    }
    return { overdue, d30, d60, d90 };
  }, [overrides]);

  const cells = [
    { label: "Overdue", value: buckets.overdue, tone: "destructive", icon: AlertTriangle },
    { label: "Due ≤ 30d", value: buckets.d30, tone: "amber" },
    { label: "Due ≤ 60d", value: buckets.d60, tone: "muted" },
    { label: "Due ≤ 90d", value: buckets.d90, tone: "muted" },
  ] as const;

  return (
    <section className="px-4 md:px-10 pb-2 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-accent" />
        <h2 className="text-sm uppercase tracking-widest font-mono text-muted-foreground">Test schedule</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cells.map((c) => (
          <Link
            to="/equipment"
            key={c.label}
            className={`rounded-lg border p-4 transition hover:-translate-y-0.5 ${
              c.tone === "destructive" ? "border-destructive/40 bg-destructive/5" :
              c.tone === "amber" ? "border-amber-500/40 bg-amber-500/5" :
              "border-border bg-card"
            }`}
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{c.label}</div>
            <div className={`mt-1 text-3xl font-display font-bold ${
              c.tone === "destructive" ? "text-destructive" :
              c.tone === "amber" ? "text-amber-600 dark:text-amber-400" :
              "text-foreground"
            }`}>{c.value}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
