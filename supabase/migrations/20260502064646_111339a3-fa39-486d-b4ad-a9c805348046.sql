
CREATE TABLE public.equipment_test_dates (
  tag TEXT PRIMARY KEY,
  last_tested DATE,
  next_test_due DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_test_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read test dates"
  ON public.equipment_test_dates FOR SELECT
  USING (true);

CREATE POLICY "Public insert test dates"
  ON public.equipment_test_dates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update test dates"
  ON public.equipment_test_dates FOR UPDATE
  USING (true) WITH CHECK (true);
