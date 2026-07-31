# Changelog

## 0.2.1

- `supabase_url`-Option validiert jetzt als URL (erfordert `http(s)://`-Schema) statt als freier Text, damit eine versehentlich ohne Schema eingetragene URL nicht mehr gespeichert werden kann.
- App normalisiert eine fehlende `https://`-Angabe zur Laufzeit trotzdem defensiv.
- Fehlende/ungültige Supabase-Konfiguration zeigt jetzt eine sichtbare Fehlermeldung statt einer leeren weißen Seite.

## 0.2.0

- Port von 8080 auf 3045 geändert (nginx, Dockerfile, docker-compose.yml, config.yaml, Doku).

## 0.1.0

- Erste Version: SwapBid als Docker-Image und Home Assistant Add-on.
