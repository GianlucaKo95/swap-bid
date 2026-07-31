# Deployment

SwapBid ist eine statische Single-Page-App (Vite/React), die direkt mit deinem Supabase-Projekt spricht. Es gibt keinen eigenen Server-Prozess – der Docker-Container liefert nur die gebauten Dateien per nginx aus. Die Supabase-Zugangsdaten werden **nicht** ins Image gebaut, sondern beim Containerstart per `docker-entrypoint.sh` in `env-config.js` geschrieben. Dadurch reicht ein einziges Image für Docker, Docker Compose und das Home Assistant Add-on.

## 0. CI: automatischer Image-Build (`.github/workflows/docker-build-push.yml`)

Bei jedem Push/PR baut GitHub Actions das Docker-Image für `linux/amd64`, `linux/arm64` und `linux/arm/v7` (verifiziert, dass das Dockerfile für alle Zielarchitekturen baut). Bei einem Push auf `main` wird das Multi-Arch-Image zusätzlich nach GitHub Container Registry gepusht, getaggt als `ghcr.io/gianlucako95/swap-bid:latest` und `:<version aus config.yaml>`. Das Home Assistant Add-on (siehe unten) zieht dieses fertige Image, statt es bei jeder Installation auf dem HA-Host selbst zu bauen.

**Einmaliger manueller Schritt nach dem ersten erfolgreichen Workflow-Lauf:** GitHub veröffentlicht neue Packages standardmäßig **privat**, auch in einem öffentlichen Repo. Damit dein HA-Host das Image ohne Login ziehen kann:

1. GitHub → dein Profil → **Packages** → `swap-bid` öffnen
2. **Package settings** → **Change visibility** → **Public**

Ohne diesen Schritt schlägt der Image-Pull auf dem HA-Host mit einem Auth-Fehler fehl.

Wird `version` in `config.yaml` erhöht, muss der Workflow (durch einen Push auf `main`) einmal durchlaufen, bevor die neue Version im Add-on installierbar ist – sonst existiert der entsprechende Image-Tag in der Registry noch nicht.

## 1. Plain Docker

```bash
docker build -t swap-bid .
docker run -d \
  --name swap-bid \
  -p 8080:8080 \
  -e SUPABASE_URL="https://dein-projekt.supabase.co" \
  -e SUPABASE_ANON_KEY="dein-anon-key" \
  swap-bid
```

App danach unter `http://<host>:8080` erreichbar.

Alternativ, ohne lokalen Build, das von CI gebaute Image direkt verwenden: `docker run ... ghcr.io/gianlucako95/swap-bid:latest` (Rest wie oben).

## 2. Docker Compose

```bash
cp .env.example .env   # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY eintragen
docker compose up -d --build
```

`docker-compose.yml` liest dieselbe `.env`-Datei wie die lokale Entwicklung (`npm run dev`) – die Werte müssen nur einmal gepflegt werden.

## 3. Als Home Assistant Add-on

Dieses Repository ist gleichzeitig ein (einzelnes) Home-Assistant-Add-on-Repository (`config.yaml` + `repository.yaml` liegen im Repo-Root). Gedacht für den persönlichen Gebrauch als **lokales Add-on**, nicht für den offiziellen Add-on-Store.

1. In Home Assistant: **Einstellungen → Add-ons → Add-on Store**
2. Oben rechts ⋮ → **Repositories** → URL des Repos einfügen (`https://github.com/GianlucaKo95/swap-bid`) → **Hinzufügen**
3. Store neu laden, dann **SwapBid** unter den lokalen Add-ons öffnen → **Installieren** (lädt das von GitHub Actions gebaute Image von `ghcr.io/gianlucako95/swap-bid` – kein lokaler Build auf dem HA-Host nötig)
4. Im Tab **Konfiguration**: `supabase_url` und `supabase_anon_key` eintragen, **Speichern**
5. Add-on **Starten**. Über den Button **WEBOBERFLÄCHE ÖFFNEN** bzw. `http://<home-assistant-host>:8080` ist SwapBid erreichbar.

Port `8080` kann im Tab **Netzwerk** des Add-ons bei Bedarf auf einen anderen Host-Port gemappt werden (z. B. falls schon belegt).

## 4. Zugriff von außen über dynDNS

1. **DDNS einrichten**: z. B. das offizielle *DuckDNS*-Add-on in Home Assistant, oder einen DDNS-Client auf deinem Router, der eure öffentliche IP unter eurer Wunsch-Domain (`deinname.duckdns.org` o. ä.) aktuell hält.
2. **Portweiterleitung** im Router: externen Port (z. B. 8080, oder frei wählbar) auf die interne IP des HA-Hosts und Port 8080 (bzw. den im Add-on gewählten Port) weiterleiten.
3. **HTTPS nicht vergessen**: SwapBid selbst spricht nur HTTP. Zugangsdaten (Login) unverschlüsselt über das offene Internet zu schicken ist unsicher. Setze einen Reverse Proxy mit TLS davor, z. B.:
   - Das offizielle **Let's Encrypt**-Add-on plus eigener nginx-Konfiguration, oder
   - Community Add-ons wie **NGINX Proxy Manager** / **Caddy**, die euer DDNS-Zertifikat automatisch verwalten und dann intern auf `swap-bid:8080` weiterleiten.
   Nur den TLS-Port (443) extern freigeben, den SwapBid-Port selbst nicht direkt exponieren.
4. Danach ist die App unter `https://deinname.duckdns.org` (oder eurer eigenen Domain) erreichbar.

## Supabase-Setup

Nicht vergessen: Vor dem ersten Start muss `supabase/migrations/0001_init.sql` einmal im SQL-Editor des Supabase-Projekts ausgeführt werden (siehe `README.md`).
