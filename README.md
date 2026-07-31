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

3. Datenbankschema anlegen: Öffne im Supabase-Dashboard den **SQL Editor** und führe **alle Migrationen** der Reihe nach aus:

   - [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) legt folgende Tabellen inkl. Row-Level-Security-Policies an:
     - `profiles` – Anzeigename pro Nutzer:in (wird automatisch bei der Registrierung angelegt)
     - `listings` – Gesuche ("Ich habe 20€ übrig")
     - `offers` – Angebote auf ein Gesuch ("Dafür biete ich dir Objekt XYZ")
   - [`supabase/migrations/0002_offer_images.sql`](./supabase/migrations/0002_offer_images.sql) ergänzt `offers.image_urls` sowie den öffentlichen Storage-Bucket `offer-images`, damit Angebote Fotos des Objekts enthalten können.
   - [`supabase/migrations/0003_location_and_ratings.sql`](./supabase/migrations/0003_location_and_ratings.sql) ergänzt `listings.location`/`lat`/`lng` (Postleitzahl wird beim Erstellen eines Gesuchs über [Zippopotam.us](https://api.zippopotam.us) geokodiert, damit andere Nutzer:innen per Umkreissuche filtern können) sowie die Tabelle `ratings`: Nachdem ein Gesuch vergeben wurde, können sich Anbieter:in und Gesuchsteller:in gegenseitig einmal bewerten (1–5 Sterne + Kommentar).
   - [`supabase/migrations/0004_moderation.sql`](./supabase/migrations/0004_moderation.sql) legt eine `reports`-Tabelle (Melde-Funktion) sowie einen serverseitigen Stichwortfilter an, der Gesuche/Angebote mit offensichtlich verbotenen Inhalten (u. a. sexuelle Dienstleistungen, Menschenhandel, Waffen, Drogen) blockiert. Siehe Abschnitt [Moderation](#moderation) unten.
   - [`supabase/migrations/0005_lock_down_offer_image_uploads.sql`](./supabase/migrations/0005_lock_down_offer_image_uploads.sql) entzieht dem Client die direkte Schreibberechtigung auf den `offer-images`-Bucket. **Erst ausführen, nachdem** die Edge Function `moderate-offer-image` deployt ist (siehe `DEPLOYMENT.md` → Abschnitt 6) – sonst schlägt jeder Foto-Upload fehl.

4. In den Supabase Auth-Einstellungen (Authentication → Providers → Email) kannst du die Pflicht zur E-Mail-Bestätigung nach Bedarf aktivieren/deaktivieren.

5. App starten:

   ```bash
   npm run dev
   ```

## Ablauf in der App

1. Nutzer:in A registriert sich und veröffentlicht ein Gesuch: "Ich habe 20€ übrig – was bekomme ich dafür?"
2. Nutzer:in B sieht das Gesuch auf der Startseite und gibt ein Angebot ab: "Dafür biete ich dir mein gebrauchtes Fahrrad."
3. Nutzer:in A sieht alle eingegangenen Angebote auf der Detailseite des Gesuchs und nimmt eines an. Das Gesuch wechselt auf **Vergeben**, alle anderen Angebote werden automatisch abgelehnt.

## Moderation

SwapBid hat **kein** Admin-Panel – als Betreiber:in moderierst du direkt über das Supabase-Dashboard. Zwei technische Bausteine helfen dabei, sind aber kein Ersatz für aktives Hinsehen:

- **Serverseitiger Stichwortfilter** (`0004_moderation.sql`): Gesuche/Angebote mit offensichtlich verbotenen Begriffen (sexuelle Inhalte, Menschenhandel, Waffen, Drogen, …) werden beim Speichern abgelehnt – unabhängig vom Frontend, auch bei direkten API-Aufrufen. Die Liste liegt in der Tabelle `blocked_terms` und kann jederzeit per SQL erweitert werden, z. B.:
  ```sql
  insert into public.blocked_terms (term) values ('zusätzlicher-begriff');
  ```
  Zusätzlich gibt es eine Emoji-Kombinations-Erkennung (`blocked_emoji`): Tauchen mindestens zwei als eindeutig sexuell konnotiert eingestufte Emoji (🍆 👅 🍑 💦) irgendwo im selben Text auf, wird der Inhalt ebenfalls abgelehnt – bewusst nicht bei einem einzelnen Emoji, da z. B. 🍆 auch harmlos in einem Kochkontext vorkommen kann. Weitere Emoji ergänzen:
  ```sql
  insert into public.blocked_emoji (emoji) values ('🍌');
  ```
  Ein Wortfilter erkennt nur offensichtliche/unverschleierte Verstöße – er ist **kein** verlässlicher Schutz gegen gezielte Umgehung.
- **Bild-Check vor dem Hochladen** (Angebotsfotos), zweistufig:
  1. Clientseitig: Ein TensorFlow.js-Modell ([nsfwjs](https://github.com/infinitered/nsfwjs), MobileNetV2) klassifiziert jedes Foto direkt im Browser und lehnt eindeutig als „Porn“/„Hentai“/„Sexy“ eingestufte Bilder sofort ab, ohne dass erst hochgeladen werden muss. Wird beim ersten Foto-Upload nachgeladen (~2–3 MB, danach vom Browser gecacht). Für sich allein wäre das umgehbar (direkter API-Aufruf statt Browser).
  2. Serverseitig, verbindlich: Uploads laufen ausschließlich über die Edge Function `moderate-offer-image`, die das Foto zusätzlich über [Sightengine](https://sightengine.com) prüft, bevor es überhaupt gespeichert wird. Der `offer-images`-Storage-Bucket erlaubt seit `0005_lock_down_offer_image_uploads.sql` **keinen** direkten Schreibzugriff mehr für Clients – nur die Function selbst (mit Service-Role-Key) darf schreiben. Damit ist Schritt 1 nicht mehr die einzige Hürde, sondern nur noch schnelles Feedback; die eigentliche Durchsetzung passiert serverseitig und ist nicht umgehbar. Einrichtung/Deploy der Function siehe `DEPLOYMENT.md`.
- **Melde-Funktion**: Jedes Gesuch und Angebot hat einen „🚩 Melden“-Button. Gemeldete Inhalte landen in der Tabelle `reports`. Regelmäßig prüfen, z. B. im SQL Editor:
  ```sql
  select * from reports order by created_at desc;
  ```

**Inhalte entfernen**: Direkt im Supabase **Table Editor** oder SQL Editor löschen, z. B. `delete from public.listings where id = '...';` (Angebote/Bewertungen dazu werden automatisch mitgelöscht).

**Nutzer:in sperren/löschen**: Über Authentication → Users im Supabase-Dashboard den Account löschen (löscht via Cascade auch Profil, Gesuche, Angebote, Bewertungen).

**Wichtig**: Bei begründetem Verdacht auf schwere Straftaten (Menschenhandel, sexualisierte Gewalt gegen Minderjährige o. Ä.) reicht Löschen nicht aus – Beweise sichern (Screenshots, Datenbank-Export) und die zuständigen Strafverfolgungsbehörden einschalten, z. B. über die [Zentrale Ansprechstelle Cybercrime](https://www.polizei.de) deines Bundeslandes oder das [BKA](https://www.bka.de).

## Build

```bash
npm run build
```

## Deployment (Docker / Home Assistant Add-on)

Für Docker, Docker Compose, Betrieb als Home Assistant Add-on und Zugriff von außen über dynDNS siehe [`DEPLOYMENT.md`](./DEPLOYMENT.md).
