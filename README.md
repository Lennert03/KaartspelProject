# ScoreBridge 🃏🌉

Een premium, mobiel-first scorebord-applicatie voor het populaire kaartspel **"Chinees poepen" (ook bekend als Boerenbridge)**.

ScoreBridge is gebouwd met een moderne **.NET 9/10 ASP.NET Core Web API** op de backend en een **Angular 19 Standalone** applicatie op de frontend. Het project is ontworpen om perfect en soepel te functioneren op mobiele apparaten (gsm's) en is klaar om (bijna) gratis gehost te worden.

---

## Projectstructuur

Het project is opgebouwd volgens de gevraagde structuur:
- `ScoreBridge.sln` - De .NET solution die het backend project linkt.
- `backend/ScoreBridge.Api` - De ASP.NET Core Web API met Entity Framework Core.
- `frontend/scorebridge-app` - De modern Angular SPA (Single Page Application).
- `docs/` - Uitgebreide documentatie en deploy handleidingen.
- `README.md` - Dit bestand met de installatie- en startinstructies.

---

## Systeemvereisten

Zorg ervoor dat de volgende software op uw machine is geïnstalleerd:
1. **.NET SDK 9.0** of **.NET SDK 10.0** (het project is compatibel met beide; momenteel geconfigureerd op `net9.0` om direct op uw machine te kunnen bouwen).
2. **Node.js LTS** (v20 of nieuwer).
3. **Angular CLI** (optioneel, maar aanbevolen. Wordt automatisch gedownload via `npx`).
4. **SQLite** (automatisch meegeleverd en lokaal geconfigureerd) of **PostgreSQL** (voor productie).

---

## 🚀 Snel Starten (Lokaal)

### 1. Database & Backend Starten

De backend is zo geconfigureerd dat deze **SQLite** gebruikt voor lokale ontwikkeling. Dit betekent dat u **geen database hoeft te installeren of te configureren**; de database wordt automatisch aangemaakt en gevuld met tabellen bij de eerste start!

#### In Visual Studio:
1. Open Visual Studio.
2. Kies **Open Project or Solution** en selecteer `ScoreBridge.sln` in de root-folder.
3. Zorg dat het project `ScoreBridge.Api` is ingesteld als startproject.
4. Klik op **Start** (of druk op `F5`).
5. Uw browser zal automatisch openen op de Swagger UI-pagina op **http://localhost:5094/swagger/index.html**, waar u alle endpoints kunt testen.

#### Via de Terminal:
```bash
cd backend/ScoreBridge.Api
dotnet run
```

---

### 2. Frontend Starten

De Angular frontend is mobiel-first en bevat een geïntegreerde proxy-configuratie die lokale API-verzoeken automatisch doorstuurt naar `http://localhost:5094`.

#### In WebStorm:
1. Open WebStorm en open de map `frontend/scorebridge-app`.
2. Open de ingebouwde terminal en voer `npm install` uit (als dat nog niet gebeurd is).
3. WebStorm detecteert de scripts in `package.json`. U kunt het script `start` direct uitvoeren via de **NPM Tool Window** of de terminal.
4. Open de app in uw browser op **http://localhost:4200**.

#### Via de Terminal:
```bash
cd frontend/scorebridge-app
npm install
npm run start
```

---

## 📱 Lokaal Testen op uw GSM

Wilt u de app direct op uw gsm testen terwijl deze op uw computer draait? Dit is heel eenvoudig!

1. Zorg dat uw computer en uw gsm verbonden zijn met **hetzelfde Wi-Fi-netwerk**.
2. Zoek het lokale IP-adres van uw computer op (bijvoorbeeld `192.168.1.50`):
   - Op Windows: open cmd en typ `ipconfig` (zoek naar IPv4 Address onder uw Wi-Fi adapter).
3. Start de Angular app op met de host-flag:
   ```bash
   cd frontend/scorebridge-app
   npx ng serve --host 0.0.0.0
   ```
4. Open op uw gsm de browser en navigeer naar `http://192.168.1.50:4200` (vervang dit door uw IP-adres).
5. De backend staat standaard al geconfigureerd om CORS-aanvragen vanaf uw lokale IP-adressen te accepteren!

---

## 💾 Database Migraties (EF Core)

Als u wijzigingen aanbrengt in de C#-modellen, moet u de database-schema's updaten met EF Core migrations.

1. Installeer de EF Core CLI tools globaal (als u dit nog niet heeft gedaan):
   ```bash
   dotnet tool install --global dotnet-ef
   ```
2. Maak een nieuwe migratie aan na een modelwijziging:
   ```bash
   cd backend/ScoreBridge.Api
   dotnet ef migrations add <NaamVanMigratie>
   ```
3. Pas de migraties handmatig toe op de lokale database (hoewel dit ook automatisch gebeurt bij het opstarten van de API):
   ```bash
   dotnet ef database update
   ```

---

## 🌐 Gratis Hostingsvoorstel (Cloud & Database)

Dit project is zo ontworpen dat het **volledig gratis of nagenoeg gratis** gehost kan worden. Hier is het aanbevolen hosting-architectuurplan:

### 1. Frontend: Cloudflare Pages (100% Gratis)
- **Waarom**: Cloudflare Pages biedt gratis hosting voor statische SPA's met onbeperkte bandbreedte, automatische SSL en wereldwijde CDN-snelheid.
- **Hoe**: Connecteer uw GitHub-repository, kies het framework 'Angular' en bouw het project met build-commando: `npm run build` en publicatie-directory: `dist/scorebridge-app/browser`.

### 2. Backend: Render (Gratis Web Service) of Fly.io / MonsterASP.NET
- **Waarom**: Render biedt een gratis tier voor web services die draaien in Docker-containers. MonsterASP.NET biedt gratis Windows/ASP.NET hosting.
- **Hoe**: Gebruik de meegeleverde Dockerfile in `backend/ScoreBridge.Api/Dockerfile`.
- **Environment variables**:
  - `ASPNETCORE_ENVIRONMENT`: `Production`
  - `DatabaseProvider`: `PostgreSQL`
  - `ConnectionStrings__DefaultConnection`: *Voer hier uw PostgreSQL connection string in*
  - `AllowedOrigins`: `https://scorebridge-app.pages.dev` (uw Cloudflare URL)

### 3. Database: Supabase PostgreSQL (Gratis Tier)
- **Waarom**: Supabase levert een gratis, volwaardige PostgreSQL-database in de cloud (tot 500MB, wat meer dan genoeg is voor duizenden kaartspellen).
- **Hoe**: Maak een gratis project aan op Supabase, kopieer de Connection String en plak deze in de `ConnectionStrings__DefaultConnection` omgevingsvariabele van uw backend.

---

## 🔒 CORS & Beveiliging Uitleg

CORS (Cross-Origin Resource Sharing) is een beveiligingsmechanisme in browsers dat voorkomt dat scripts van de ene website gegevens opvragen bij een andere API, tenzij die API daar expliciet toestemming voor geeft.

In ScoreBridge is dit als volgt opgelost:
- **Lokaal**: In `appsettings.Development.json` staat `AllowedOrigins` ingesteld op `http://localhost:4200` en mobiele test-origins.
- **Productie**: In de cloud configureert u de omgevingsvariabele `AllowedOrigins` met uw exacte frontend URL (bijv. `https://scorebridge-app.pages.dev`). De backend weigert dan automatisch alle aanvragen van niet-geautoriseerde domeinen.

---

## 🐳 Dockerfile voor Backend

In `backend/ScoreBridge.Api/Dockerfile` vindt u een geoptimaliseerde multi-stage Docker-configuratie. Render of Fly.io bouwt en start hiermee automatisch uw .NET web-service op.

Veel succes en plezier met kaarten! 🃏🏆
# KaartspelProject
