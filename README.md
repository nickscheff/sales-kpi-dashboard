# Sales-KPI-Dashboard

Rechnet die monatliche Zielplanung rückwärts durch: Vom Monatsziel über Provision/Brutto,
Zielerreichung, Quartals-/Jahres-Tracking und Rekord-Vergleich bis zum vollständigen
Trichter (Deals → Termine → Entscheider-Gespräche, je Monat/Woche/Arbeitstag) – inklusive
Stretch-Goal-Szenarien für 125/150/200 %.

Frontend: React + TypeScript + Vite. Persistiert wird in einem **Cloudflare Worker + KV**
(`worker/`), geschützt durch einen Shared-Secret-Header – kein Login/Auth.

## Lokale Entwicklung

Zwei Terminals parallel:

```bash
# Terminal 1: API-Worker (Port 8787, lokale KV-Simulation)
cd worker
npm install
cp .dev.vars.example .dev.vars   # API_SECRET lokal setzen
npm run dev
```

```bash
# Terminal 2: Vite-Dev-Server (Port 5173, proxyt /api → Worker)
cp .env.example .env             # VITE_API_SECRET, muss zu worker/.dev.vars passen
npm install
npm run dev
```

Dashboard dann unter `http://localhost:5173` öffnen.

## Build & Deploy (ein Worker liefert SPA + API aus)

```bash
# Einmalig: KV-Namespace anlegen und die ID in worker/wrangler.jsonc eintragen
cd worker
npx wrangler kv namespace create DASHBOARD_KV

# Secret für Produktion setzen (interaktiver Prompt)
npx wrangler secret put API_SECRET

# Bauen (erzeugt dist/) und deployen
cd ..
npm run worker:deploy
```

Vor dem Produktions-Build muss `.env` (`VITE_API_SECRET`) auf denselben Wert gesetzt sein,
der als Worker-Secret hinterlegt wurde – sonst schlägt jeder API-Request mit 401 fehl.

## Projektstruktur

```
src/                    React-Frontend
  lib/calculations.ts   Alle KPI-/Trichter-Formeln (reine Funktionen)
  lib/api.ts             GET/PUT gegen /api/data
  state/useDashboardData.ts  Lädt beim Start, speichert debounced bei Änderungen
  components/            UI-Panels (Settings, Deals, KPIs, Quartal/Jahr, Historie, Stretch, Trichter)
worker/                  Cloudflare Worker (API + Static Assets)
  src/index.ts            GET/PUT /api/data, Shared-Secret-Schutz
  wrangler.jsonc          KV-Binding + Static-Assets-Binding auf ../dist
```

## Wichtige Annahmen

- **Pro Woche** in der Trichter-Rückwärtsrechnung = Arbeitstage ÷ 5 (5-Tage-Woche).
- Alle Raten (Provisionssatz, Closing-Rate, No-Show-Rate, Terminierungsquote) werden als
  Prozentzahlen eingegeben (z. B. `8` für 8 %).
- Quartal/Jahr werden aus dem Feld „Monat" (`YYYY-MM`) abgeleitet (Kalenderquartale).
