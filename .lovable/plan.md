## Scope

Add only what the spec requires on top of the existing app. Keep DCS, News, Process Flow, Manuals untouched.

## What's already done (skip)

- Equipment catalog, search, filters, detail page, technical specs (shell/tube design + test pressure)
- QR scanner (camera + jsQR + fuzzy manual entry)
- Service worker cache (cache-first assets, network-first Supabase)
- Cloudflare Pages deploy + `_routes.json`
- Hierarchical area context (unit/section already on equipment)

## What I'll add

### 1. Auth (email + Google)
- New `src/contexts/AuthContext.tsx` with `onAuthStateChange` + `getSession`
- `/auth` page: email/password + "Continue with Google"
- `AppHeader` shows user email + sign-out button when logged in
- Equipment browsing stays public (read-only); maintenance writes require login
- `profiles` table (id → auth.users, full_name, role) + trigger on signup

### 2. Maintenance logs
- New table `maintenance_logs` (matches spec exactly)
- New page `/equipment/:tag/log` — form to record test (date, shell/tube pressure, result PASS/FAIL/PENDING, technician, notes, photos)
- Timeline section on `EquipmentDetail` showing past logs with pass/fail badges
- Auto-compute `next_test_due` (PREVENTIVE = +5y, CORRECTIVE = +1y) and update `equipment_test_dates`

### 3. Equipment images (Storage)
- New table `equipment_images` + Storage bucket `equipment-photos` (public read, authed write)
- Upload widget on detail page → compress to WebP client-side (canvas) before upload
- Image gallery grid with lightbox

### 4. Offline-first (Dexie)
- Install `dexie` + `dexie-react-hooks`
- `src/lib/db.ts` — IndexedDB tables: `equipmentCache`, `pendingLogs`, `pendingUploads`
- Wrap maintenance log submit: if offline → store in `pendingLogs`, show toast "Queued"
- `src/lib/sync.ts` — `online` event listener flushes queue to Supabase
- Status pill in header: ● Online / ● Offline (N queued)

### 5. SVG QR (replace edge function)
- Install `qrcode` (generates SVG strings client-side)
- Replace `storageUrls.qr()` usage in `EquipmentDetail` with inline `<svg>` component
- Print button → opens print-friendly route with large QR + tag

### 6. Dashboard widget
- Add "Test schedule" card on `/` showing counts: Overdue / Due in 30d / Due in 60d / Due in 90d
- Each clickable → filtered `/equipment` view

## Migration files to create

```
supabase/migrations/
  20260524_auth_profiles.sql
  20260524_maintenance_logs.sql
  20260524_equipment_images.sql
  20260524_storage_equipment_photos.sql
```

Each includes RLS: public SELECT on equipment-related reads, `auth.uid()` checks for INSERT/UPDATE.

## Files touched

**New:** AuthContext.tsx, pages/Auth.tsx, pages/LogTest.tsx, pages/PrintQr.tsx, components/MaintenanceTimeline.tsx, components/ImageGallery.tsx, components/PhotoUpload.tsx, components/SvgQr.tsx, components/OnlineStatus.tsx, lib/db.ts, lib/sync.ts, lib/imageCompress.ts, 4 migration files

**Edited:** App.tsx (routes + AuthProvider), AppHeader.tsx (auth + online status), EquipmentDetail.tsx (gallery + timeline + log button + SVG QR), Dashboard.tsx (schedule widget), main.tsx (sync init)

## What you do after I'm done

```bash
npx supabase link --project-ref gdkqetzkhgllwbpmqmux   # if not linked
npx supabase db push                                     # applies the 4 migrations
```

Then in the Supabase dashboard → Authentication → Providers → enable Google and add OAuth credentials.

## Open question (non-blocking)

Your `.env` points to `nwcpfsqsdjezkwkhxrqx` but `src/integrations/supabase/client.ts` is hardcoded to `gdkqetzkhgllwbpmqmux`. The hardcoded one wins. I'll target `gdkqetzkhgllwbpmqmux` for all migrations — confirm that's the right project, otherwise tell me which to use.