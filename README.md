# 🎯 Realtids Quiz-Server

En komplett realtids quiz-applikation byggd med Vue.js, Node.js, Socket.IO och SQLite.

## 📋 Översikt

Detta projekt innehåller en fullständig quiz-plattform med:
- **Spelar-webbsida**: Användare kan gå med i spel och svara på frågor i realtid
- **Admin-panel**: Hantera spel, frågor och se statistik
- **Realtidskommunikation**: Socket.IO för synkroniserad spelupplevelse
- **Databas**: SQLite för frågor och spelhistorik

## 🏗️ Teknisk stack

### Backend
- **Node.js** + **Express** - Web server
- **Socket.IO** - Realtidskommunikation
- **SQLite** - Databas
- **bcryptjs** - Lösenordskryptering
- **express-session** - Session-hantering

### Frontend  
- **Vue 3** - Frontend framework
- **Vue Router** - Single Page Application routing
- **Socket.IO Client** - Realtidskommunikation
- **Axios** - HTTP-klient för API-anrop

## 📁 Projektstruktur

```
Quizz/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # Databas-modeller
│   │   └── database.js    # SQLite databas-operationer
│   ├── routes/            # Express routes
│   │   ├── auth.js        # Autentisering
│   │   └── questions.js   # Fråge-API
│   ├── server.js          # Huvudserver med Socket.IO
│   ├── setup-database.js  # Databas-initieringsscript
│   └── package.json       # Node.js dependencies
│
├── client/                # Frontend (Vue.js)
│   ├── src/
│   │   ├── components/    # Vue-komponenter
│   │   ├── views/         # Sidor (Player, Admin)
│   │   ├── services/      # API och Socket services
│   │   ├── router/        # Vue Router konfiguration
│   │   └── main.js        # Vue app entry point
│   ├── public/            # Statiska filer
│   ├── vue.config.js      # Vue CLI konfiguration
│   └── package.json       # NPM dependencies
│
└── quiz.db               # SQLite databas (skapas automatiskt)
```

## 🚀 Installation och setup

### 1. Klona projektet
```bash
cd C:\\dev\\temp\\Quizz
```

### 2. Installera backend-dependencies
```bash
cd server
npm install
```

### 3. Installera frontend-dependencies  
```bash
cd ../client
npm install
```

### 4. Initiera databasen
```bash
cd ../server
npm run setup-db
```

Detta skapar SQLite-databasen och lägger till:
- Admin-användare (admin / quiz123)
- 10 exempel-frågor i olika kategorier

## 🎮 Köra applikationen

### Starta backend-servern
```bash
cd server
npm start
# eller för utveckling med auto-restart:
npm run dev
```

Backend körs på: `http://localhost:3001`

### Starta frontend-utvecklingsservern
```bash
cd client  
npm run dev
```

Frontend körs på: `http://localhost:3000`

## 📱 Använda applikationen

### För spelare
1. Gå till `http://localhost:3000`
2. Ange ditt användarnamn
3. Vänta på att admin startar spelet
4. Svara på frågorna så snabbt som möjligt
5. Se dina resultat och final scoreboard

### För admin
1. Gå till `http://localhost:3000/admin`
2. Logga in med:
   - **Användarnamn**: `admin`
   - **Lösenord**: `quiz123`
3. Hantera spelet från admin-panelen:
   - **Spelkontroll**: Starta spel, visa frågor, se anslutna spelare
   - **Frågor**: Skapa, redigera och ta bort frågor
   - **Historik**: Se tidigare spel och statistik

## 🔧 Socket.IO Events

### Spelare → Server
- `player_join(playerName)` - Gå med i spelet
- `submit_answer(answerData)` - Skicka svar på fråga

### Admin → Server  
- `start_game()` - Starta nytt spel
- `show_question(questionData)` - Visa fråga för alla spelare
- `end_question()` - Avsluta aktuell fråga
- `end_game()` - Avsluta hela spelet
- `get_game_state()` - Hämta aktuell spelstatus

### Server → Alla klienter
- `players_updated(playerList)` - Uppdaterad lista med spelare
- `game_started()` - Spelet har startats
- `question_shown(questionData)` - Ny fråga visas
- `timer_update(timeLeft)` - Timer countdown
- `question_results(results)` - Resultat efter fråga
- `scores_updated(playerList)` - Uppdaterade poäng
- `game_ended(finalData)` - Spelet avslutat med slutresultat

## 🗃️ Databas-schema

### questions
- `id` - Primary key
- `question` - Frågetexten
- `option_a/b/c/d` - Svarsalternativ
- `correct_answer` - Rätt svar (A/B/C/D)
- `time_limit` - Tidsgräns i sekunder
- `category` - Kategori
- `difficulty` - Svårighetsgrad (easy/medium/hard)
- `created_at/updated_at` - Tidsstämplar

### admin_users
- `id` - Primary key
- `username` - Användarnamn
- `password_hash` - Krypterat lösenord
- `created_at` - Skapad datum
- `last_login` - Senaste inloggning

### game_sessions (för framtida utökning)
- `id` - Primary key
- `started_at/ended_at` - Start/slut-tider
- `total_players/questions` - Statistik
- `winner_name/score` - Vinnare

## 🏆 Poängsystem

Applikationen använder ett **tidsbaserat poängsystem** som belönar snabba svar:

### Poängfördelning per fråga
- **Maximum poäng**: 1000 poäng (för svar inom 1 sekund)
- **Minimum poäng**: 250 poäng (25% av max, för svar i sista sekunden)
- **Linjär minskning**: Poängen minskar gradvis med tiden

### Så fungerar det
1. **Blixtsnabba svar (≤1s)**: Ger fulla 1000 poäng
2. **Snabba svar (1-5s)**: Ger höga poäng (750-1000)
3. **Normala svar (5-15s)**: Ger medelhöga poäng (400-750)
4. **Långsamma svar (15s+)**: Ger grundpoäng (250-400)

### Beräkning
Poängen beräknas enligt formeln:
```
Om svarstid ≤ 1s: 1000 poäng
Annars: 250 + (750 × (kvarvarande_tid / total_tid))
```

Endast **rätta svar** ger poäng - felaktiga svar ger 0 poäng oavsett hastighet.

## 🛠️ API Endpoints

### Autentisering
- `POST /api/auth/login` - Admin-inloggning
- `POST /api/auth/logout` - Logga ut
- `GET /api/auth/status` - Kontrollera login-status

### Frågor
- `GET /api/questions` - Hämta alla frågor
- `GET /api/questions/:id` - Hämta specifik fråga
- `GET /api/questions/random/:count` - Slumpmässiga frågor
- `POST /api/questions` - Skapa ny fråga
- `PUT /api/questions/:id` - Uppdatera fråga
- `DELETE /api/questions/:id` - Ta bort fråga

## 🔒 Säkerhet

- Admin-lösenord hashas med bcrypt
- Session-baserad autentisering
- CORS-konfiguration för utveckling
- Input-validering på server-sidan

**⚠️ VIKTIGT**: Ändra admin-lösenordet innan produktion!

## 📦 Produktionsbygge

### Bygg frontend för produktion
```bash
cd client
npm run build
```

### Starta produktionsserver
```bash
cd server
NODE_ENV=production npm start
```

Frontend-filer serveras automatiskt från `/client/dist`

## 🎨 Funktioner

### Spelarupplevelse
- ✅ Användarnamn-registrering
- ✅ Realtids vänterum
- ✅ Interaktiva quiz-frågor med timer
- ✅ Omedelbar feedback på svar
- ✅ Live scoreboard
- ✅ Animerad slutpresentation

### Admin-funktioner  
- ✅ Säker inloggning
- ✅ Live spelarhantering
- ✅ Spelkontroll (start/stopp/frågor)
- ✅ CRUD för frågor med kategorier
- ✅ Spelhistorik och statistik
- ✅ Responsive design

### Tekniska detaljer
- ✅ Realtids Socket.IO-kommunikation
- ✅ SQLite databas med migrations
- ✅ Session-hantering
- ✅ Error handling och loading states
- ✅ Mobile-first responsive design

## 🐛 Troubleshooting

### Backend startar inte
- Kontrollera att port 3001 är ledig
- Kör `npm run setup-db` igen
- Kontrollera att SQLite är installerat

### Frontend kan inte ansluta
- Kontrollera att backend körs på port 3001
- Verifiera CORS-konfiguration
- Kontrollera nätverks-tab i Developer Tools

### Socket.IO-problem
- Kontrollera att båda portarna (3000, 3001) är öppna
- Testa med olika browsers
- Kontrollera firewall-inställningar

## 🎯 Utökningar

Möjliga förbättringar:
- 📊 Mer detaljerad statistik och analytics
- 🎵 Ljudeffekter och bakgrundsmusik
- 🏆 Achievement-system
- 📱 PWA-stöd för mobil-app-känsla
- 🌍 Flerspråkstöd
- 🎨 Teman och anpassning
- 📈 Dashboard med grafer
- 💾 Export av speldata

## 📄 Licens

MIT License - Se LICENSE-fil för detaljer.

## 👥 Utvecklad av

Quiz-applikation skapad som exempel på fullstack realtidsapplikation med Vue.js och Socket.IO.

---

🎉 **Lycka till med din quiz!** 🎉