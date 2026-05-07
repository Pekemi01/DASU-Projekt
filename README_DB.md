---

# Datenbank Setup — Windows

## Schritt 1 — PostgreSQL installieren
1. Gehe auf https://www.postgresql.org/download/windows/
2. Installer herunterladen und ausführen
3. Bei der Installation ein Passwort für `postgres` setzen — **merken!**
4. Port `5432` so lassen wie es ist

## Schritt 2 — Datenbank erstellen
Öffne **SQL Shell (psql)** (wird mit PostgreSQL installiert):
```sql
CREATE DATABASE dasu_db;
\q
```

## Schritt 3 — schema.sql einlesen
Öffne **CMD** oder **PowerShell** im Projektordner:
```powershell
psql -U postgres -d dasu_db -f db/schema.sql
```
Passwort eingeben wenn gefragt.

## Schritt 4 — .env Datei erstellen
Erstelle eine Datei `.env` im Hauptordner:
DATABASE_URL=postgresql://postgres:deinPasswort@localhost:5432/dasu_db
PORT=3000
⚠️ Die .env Datei wird nicht ins Git gepusht — jeder muss sie selbst erstellen!

## Schritt 5 — Pakete installieren
```powershell
npm install
```

## Schritt 6 — Verbindung testen
```powershell
node db/pool.js
```
Erwartete Ausgabe: ✅ PostgreSQL verbunden!
