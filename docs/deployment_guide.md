# ScoreBridge Deployment Handleiding 🚀

Deze handleiding legt stap-stap uit hoe u de ScoreBridge applicatie gratis of nagenoeg gratis kunt deployen in de cloud.

---

## 🏛️ Architectuuroverzicht

De cloud-architectuur bestaat uit drie losse, gratis componenten:
```
  [ Mobiele Gebruiker ]
           │
           ▼
┌──────────────────────┐
│  Cloudflare Pages   │  ◄─── Frontend (Angular SPA) - 100% gratis, snelle CDN
└──────────┬───────────┘
           │ (HTTPS API verzoeken)
           ▼
┌──────────────────────┐
│  Render Web Service  │  ◄─── Backend (ASP.NET Core API in Docker) - Gratis tier
└──────────┬───────────┘
           │ (SQL connectie via Npgsql)
           ▼
┌──────────────────────┐
│ Supabase PostgreSQL  │  ◄─── Database (PostgreSQL) - Gratis tier (500MB)
└──────────────────────┘
```

---

## Stap 1: De Database aanmaken op Supabase 🐘

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis account aan.
2. Klik op **New Project** en voer de projectdetails in:
   - **Name**: `ScoreBridgeDatabase`
   - **Database Password**: *Kies een sterk wachtwoord en bewaar dit goed!*
   - **Region**: Kies een regio dicht bij uw gebruikers (bijv. `Frankfurt` of `Ireland`).
   - **Pricing Plan**: Selecteer de **Free** tier.
3. Wacht een paar minuten tot de database is geïnitialiseerd.
4. Ga in het linkermenu naar **Project Settings** > **Database**.
5. Scroll naar **Connection string** > **URI** en kopieer deze string. 
   - De string ziet er ongeveer zo uit: `postgresql://postgres.[ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - Vervang `[PASSWORD]` door uw daadwerkelijke database-wachtwoord. Sla deze connectiestring goed op!

---

## Stap 2: De Backend deployen op Render 🐳

Render kan rechtstreeks een Docker-container bouwen en hosten op hun gratis tier.

1. Ga naar [render.com](https://render.com) en log in (bijv. via GitHub).
2. Klik op **New +** en kies **Web Service**.
3. Verbind uw GitHub-repository (als u deze heeft gepusht) of voer de publieke Git-URL in.
4. Voer de volgende configuratie-instellingen in:
   - **Name**: `scorebridge-api`
   - **Region**: Kies dezelfde regio als uw Supabase database (bijv. `Frankfurt` of `Oregon`).
   - **Language**: Kies **Docker** (Render detecteert automatisch de `Dockerfile` in uw project).
   - **Branch**: `main` (of uw actieve branch).
   - **Instance Type**: Kies **Free** ($0/month).
5. Klik op **Advanced** en voeg de volgende **Environment Variables** toe:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `DatabaseProvider`: `PostgreSQL`
   - `ConnectionStrings__DefaultConnection`: *De PostgreSQL URI die u in Stap 1 heeft gekopieerd*
   - `AllowedOrigins`: *Laat deze nog even leeg, of vul uw toekomstige Cloudflare Pages URL in (bijv. `https://scorebridge.pages.dev`)*
6. Klik op **Create Web Service**.
7. Render gaat nu de Docker-container bouwen. Dit duurt ongeveer 5-10 minuten. Zodra het klaar is, ziet u de status **Live** en krijgt u een URL (bijv. `https://scorebridge-api.onrender.com`). Sla deze URL op!

---

## Stap 3: De Frontend deployen op Cloudflare Pages ⚡

Cloudflare Pages host statische frontend bestanden direct vanaf uw GitHub repository.

1. Ga naar [dash.cloudflare.com](https://dash.cloudflare.com) en maak een account aan.
2. Ga in het menu naar **Workers & Pages** > **Pages** > **Connect to Git**.
3. Selecteer uw GitHub-account en kies de repository van `ScoreBridge`.
4. Configureer de build-instellingen:
   - **Project Name**: `scorebridge`
   - **Framework Preset**: Kies **Angular** (of laat op None staan en vul de commando's handmatig in).
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist/scorebridge-app/browser`
   - **Root Directory**: `frontend/scorebridge-app` (zeer belangrijk! Dit vertelt Cloudflare dat de Angular app in de submap staat).
5. Voeg een **Environment Variable** toe (in de Cloudflare console) om de API URL in te stellen:
   - `NG_APP_API_URL`: `https://scorebridge-api.onrender.com` (de URL van uw Render backend van Stap 2).
6. Klik op **Save and Deploy**.
7. Cloudflare bouwt nu uw Angular app. Dit duurt ongeveer 2-3 minuten. Na afronding krijgt u een URL (bijv. `https://scorebridge.pages.dev`).

---

## Stap 4: CORS configureren op de Backend 🔒

Nu uw frontend URL bekend is (bijv. `https://scorebridge.pages.dev`), moet de backend toestemming krijgen om verzoeken van deze URL te accepteren.

1. Ga terug naar uw Render dashboard van de `scorebridge-api`.
2. Klik op **Environment**.
3. Bewerk de variabele `AllowedOrigins` en voeg uw Cloudflare Pages URL toe:
   - **Key**: `AllowedOrigins`
   - **Value**: `https://scorebridge.pages.dev`
4. Sla de wijzigingen op. Render zal de backend automatisch herstarten met de nieuwe instellingen.

Gefeliciteerd! Uw ScoreBridge webapp is nu live en volledig gratis operationeel! 🎉
