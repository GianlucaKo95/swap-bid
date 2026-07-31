# swap-bid

**SwapBid** ist ein umgekehrter Kleinanzeigenmarkt: Statt ein Objekt zu verkaufen, postest du einen **Geldbetrag, den du übrig hast** ("Gesuch"). Andere Nutzer:innen bieten dir dafür ein passendes Objekt an ("Angebot"). Du wählst das beste Angebot aus und nimmst es an.

## Tech-Stack

- [Vite](https://vitejs.dev/) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres-Datenbank, Auth mit E-Mail/Passwort, Row Level Security)

## Setup

1. Abhängigkeiten installieren:

   ```bash
   npm install
   ```

2. Umgebungsvariablen setzen: Kopiere `.env.example` nach `.env` und trage deine Supabase-Projektdaten ein (Project Settings → API):

   ```bash
   cp .env.example .env
   ```

3. Datenbankschema anlegen: Öffne im Supabase-Dashboard den **SQL Editor** und führe **alle drei** Migrationen der Reihe nach aus:

   - [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) legt folgende Tabellen inkl. Row-Level-Security-Policies an:
     - `profiles` – Anzeigename pro Nutzer:in (wird automatisch bei der Registrierung angelegt)
     - `listings` – Gesuche ("Ich habe 20€ übrig")
     - `offers` – Angebote auf ein Gesuch ("Dafür biete ich dir Objekt XYZ")
   - [`supabase/migrations/0002_offer_images.sql`](./supabase/migrations/0002_offer_images.sql) ergänzt `offers.image_urls` sowie den öffentlichen Storage-Bucket `offer-images`, damit Angebote Fotos des Objekts enthalten können.
   - [`supabase/migrations/0003_location_and_ratings.sql`](./supabase/migrations/0003_location_and_ratings.sql) ergänzt `listings.location`/`lat`/`lng` (Postleitzahl wird beim Erstellen eines Gesuchs über [Zippopotam.us](https://api.zippopotam.us) geokodiert, damit andere Nutzer:innen per Umkreissuche filtern können) sowie die Tabelle `ratings`: Nachdem ein Gesuch vergeben wurde, können sich Anbieter:in und Gesuchsteller:in gegenseitig einmal bewerten (1–5 Sterne + Kommentar).

4. In den Supabase Auth-Einstellungen (Authentication → Providers → Email) kannst du die Pflicht zur E-Mail-Bestätigung nach Bedarf aktivieren/deaktivieren.

5. App starten:

   ```bash
   npm run dev
   ```

## Ablauf in der App

1. Nutzer:in A registriert sich und veröffentlicht ein Gesuch: "Ich habe 20€ übrig – was bekomme ich dafür?"
2. Nutzer:in B sieht das Gesuch auf der Startseite und gibt ein Angebot ab: "Dafür biete ich dir mein gebrauchtes Fahrrad."
3. Nutzer:in A sieht alle eingegangenen Angebote auf der Detailseite des Gesuchs und nimmt eines an. Das Gesuch wechselt auf **Vergeben**, alle anderen Angebote werden automatisch abgelehnt.

## Build

```bash
npm run build
```

## Deployment (Docker / Home Assistant Add-on)

Für Docker, Docker Compose, Betrieb als Home Assistant Add-on und Zugriff von außen über dynDNS siehe [`DEPLOYMENT.md`](./DEPLOYMENT.md).
