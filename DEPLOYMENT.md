# Deployment

SwapBid ist eine statische Single-Page-App (Vite/React), die direkt mit deinem Supabase-Projekt spricht. Es gibt keinen eigenen Server-Prozess – der Docker-Container liefert nur die gebauten Dateien per nginx aus. Die Supabase-Zugangsdaten werden **nicht** ins Image gebaut, sondern beim Containerstart per `docker-entrypoint.sh` in `env-config.js` geschrieben. Dadurch reicht ein einziges Image für Docker, Docker Compose und das Home Assistant Add-on.

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
3. Store neu laden, dann **SwapBid** unter den lokalen Add-ons öffnen → **Installieren** (baut das Image direkt auf dem HA-Host)
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
