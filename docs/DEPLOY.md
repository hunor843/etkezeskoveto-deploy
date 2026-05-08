# Deploy és üzemeltetés (3.5)

Ez a projekt úgy van kialakítva, hogy egyetlen publikus URL-ről is működhessen:

- `server.js` (Node) kiszolgálja:
  - az Angular buildelt statikus fájlokat (`dist/etekezeskoveto_alkalmazas/browser`)
  - az API-t `/api` prefix alatt (json-server + auth/jogosultság middleware)

## Ajánlott: Render (1 URL)

### 1) Render Web Service létrehozása

- New → Web Service → connect GitHub repo
- Build Command:

```bash
npm install
npm run build
```

- Start Command:

```bash
node server.js
```

Megjegyzés: a szerver a Render által adott `PORT` env változót használja.

### 2) Ellenőrzés

- Nyisd meg a publikus URL-t (Render adja)
- Próbáld ki a fő funkciókat:
  - bejelentkezés (`hunor@example.com` / `Hunor1234`)
  - fórum: téma létrehozás / törlés

## Publikus URL beillesztése

Ha kész a deploy, írd be a publikus URL-t a README "Publikus URL" részébe.

## Fontos megjegyzés a perzisztenciáról

A `db.json` fájl json-server adatforrás; sok hostingnál a fájlrendszer nem tartós (új deploy / restart után visszaállhat). Ez a házi feladat jellegű demóhoz tipikusan elfogadható, de “éles” rendszerhez adatbázis szükséges.
