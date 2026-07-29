# Deadstone Roleplay platforma

Společná Node.js aplikace poskytuje:

- REST API pro web,
- Firebase Firestore jako hlavní databázi,
- Discord bota nad stejnými daty,
- audit administrátorských změn,
- bezpečný fallback webu při nedostupném API.

## 1. Konfigurace

Zkopírujte `.env.example` jako `.env` a doplňte hodnoty. Soubor `.env` ani
Firebase service-account JSON nikdy necommitujte a neposílejte do chatu.

Firebase údaje získáte ve Firebase Console v nastavení projektu pod
**Service accounts**. Pro hosting je vhodnější nastavit tři proměnné
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` a `FIREBASE_PRIVATE_KEY`.

Discord údaje získáte v Discord Developer Portal:

- `DISCORD_TOKEN` je token bota,
- `DISCORD_CLIENT_ID` je Application ID,
- `DISCORD_GUILD_ID` je ID serveru,
- `DISCORD_ADMIN_ROLE_ID` je volitelná správcovská role.
- `DISCORD_AUTO_ROLE_ID` je role automaticky přidělená novým členům.

## 2. Firestore

Vytvořte Firestore databázi v Native mode. Bezpečnostní pravidla jsou ve
`firestore.rules`; klientský přístup je výchozím nastavením zakázán a web čte
data přes backend.

Výchozí kolekce:

| Kolekce | Účel |
| --- | --- |
| `settings/public` | Stav serveru, počet hráčů, verze a připojovací URL |
| `news` | Novinky publikované na web |
| `towns` | Města zobrazovaná na webu |
| `whitelistApplications` | Žádosti hráčů |
| `discordUsers` | Budoucí propojení Discord účtů a postav |
| `auditLog` | Historie administrátorských změn |

Po nastavení přihlašovacích údajů vložíte základní data příkazem:

```powershell
npm run seed
```

## 3. Discord příkazy

Příkazy pro konkrétní Discord server zaregistrujete:

```powershell
npm run deploy-commands
```

Připravené příkazy:

- `/server`
- `/pravidla`
- `/status-nastavit`
- `/novinka`

Poslední dva příkazy vyžadují oprávnění **Manage Server** nebo roli nastavenou
v `DISCORD_ADMIN_ROLE_ID`.

## 4. Spuštění

Backend a bot:

```powershell
npm start
```

Web v druhém terminálu:

```powershell
python -m http.server 8000
```

API poběží na `http://localhost:3000`. Web používá adresu z `web-config.js`.
V produkci ji změňte na veřejnou HTTPS adresu backendu a stejnou doménu nastavte
do `PUBLIC_ORIGIN`.

## API

Veřejné endpointy:

- `GET /api/health`
- `GET /api/site`
- `GET /api/news`
- `GET /api/towns`
- `POST /api/whitelist`

Administrátorské endpointy vyžadují hlavičku `x-api-key`:

- `PATCH /api/admin/site`
- `POST /api/admin/news`
- `POST /api/admin/towns`
