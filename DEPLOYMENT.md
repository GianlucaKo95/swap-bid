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
  -p 3045:3045 \
  -e SUPABASE_URL="https://dein-projekt.supabase.co" \
  -e SUPABASE_ANON_KEY="dein-anon-key" \
  swap-bid
```

App danach unter `http://<host>:3045` erreichbar.

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
5. Add-on **Starten**. Über den Button **WEBOBERFLÄCHE ÖFFNEN** bzw. `http://<home-assistant-host>:3045` ist SwapBid erreichbar.

Port `3045` kann im Tab **Netzwerk** des Add-ons bei Bedarf auf einen anderen Host-Port gemappt werden (z. B. falls schon belegt).

## 4. Zugriff von außen über dynDNS

1. **DDNS einrichten**: z. B. das offizielle *DuckDNS*-Add-on in Home Assistant, oder einen DDNS-Client auf deinem Router, der eure öffentliche IP unter eurer Wunsch-Domain (`deinname.duckdns.org` o. ä.) aktuell hält.
2. **Portweiterleitung** im Router: externen Port (z. B. 3045, oder frei wählbar) auf die interne IP des HA-Hosts und Port 3045 (bzw. den im Add-on gewählten Port) weiterleiten.
3. **HTTPS nicht vergessen**: SwapBid selbst spricht nur HTTP. Zugangsdaten (Login) unverschlüsselt über das offene Internet zu schicken ist unsicher. Setze einen Reverse Proxy mit TLS davor, z. B. **NGINX Proxy Manager** (siehe Schritt 5 unten) oder das offizielle **Let's Encrypt**-Add-on mit eigener nginx-Konfiguration. Nur den TLS-Port (443) extern freigeben, den SwapBid-Port selbst nicht direkt exponieren.
4. Danach ist die App unter `https://deinname.duckdns.org` (oder eurer eigenen Domain) erreichbar.

## 5. NGINX Proxy Manager vor SwapBid einrichten

NGINX Proxy Manager (NPM) übernimmt TLS-Terminierung + Let's-Encrypt-Zertifikate über eine Web-Oberfläche – keine nginx-Konfigurationsdatei nötig. NPM ist kein offizielles HA-Add-on, läuft aber problemlos als eigener Docker-Container auf demselben Host wie SwapBid.

**1. NPM starten** (eigene `docker-compose.yml`, z. B. `~/npm/docker-compose.yml`):

```yaml
services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    restart: unless-stopped
    ports:
      - "80:80"     # HTTP + Let's-Encrypt-Validierung
      - "443:443"   # HTTPS
      - "81:81"     # Admin-Oberfläche
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
```

```bash
docker compose up -d
```

**2. Admin-Oberfläche öffnen**: `http://<host>:81` — Erstlogin `admin@example.com` / `changeme`, danach sofort E-Mail und Passwort ändern.

**3. Proxy Host anlegen**: **Hosts → Proxy Hosts → Add Proxy Host**

| Feld | Wert |
|---|---|
| Domain Names | `deinname.duckdns.org` |
| Scheme | `http` |
| Forward Hostname / IP | interne IP des SwapBid-Hosts (z. B. `192.168.x.x`); läuft NPM im selben Docker-Netzwerk wie `swap-bid`, reicht auch der Containername `swap-bid` |
| Forward Port | `3045` |
| Websockets Support | an |

Tab **SSL**: **Request a new SSL Certificate** (Let's Encrypt) → **Force SSL** + **HTTP/2 Support** aktivieren → E-Mail eintragen, AGB akzeptieren → **Save**.

**4. FRITZ!Box-Freigabe anpassen**: Jetzt nur noch **Port 80 und 443 (TCP)** auf den NPM-Host weiterleiten (80 wird für die Let's-Encrypt-Zertifikatsprüfung und -erneuerung gebraucht). Die bisherige Freigabe auf Port 3045 kann entfernt werden — der Port bleibt intern, SwapBid ist nur noch über NPM erreichbar.

**5. Testen**: `https://deinname.duckdns.org` sollte SwapBid mit gültigem Zertifikat anzeigen (Schloss-Symbol im Browser, keine Warnung).

## Supabase-Setup

Nicht vergessen: Vor dem ersten Start muss `supabase/migrations/0001_init.sql` einmal im SQL-Editor des Supabase-Projekts ausgeführt werden (siehe `README.md`).
