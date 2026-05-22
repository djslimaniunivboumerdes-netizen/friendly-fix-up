CREATE TABLE public.dcs_detected_instruments (
  panel_id text PRIMARY KEY,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  detected_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dcs_detected_instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read dcs detections" ON public.dcs_detected_instruments FOR SELECT USING (true);
CREATE POLICY "Public insert dcs detections" ON public.dcs_detected_instruments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update dcs detections" ON public.dcs_detected_instruments FOR UPDATE USING (true) WITH CHECK (true);