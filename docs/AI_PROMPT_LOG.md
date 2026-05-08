# AI Prompt Log — Macro Tracker

Ez a fájl dokumentálja az AI-asszisztált fejlesztés során használt fontosabb promptokat, az AI válaszainak rövid összefoglalását, valamint azt, hogy a javaslatokat hogyan fogadtad el, módosítottad vagy utasítottad el.

A végső beadásig legalább:
- 10 jelentős promptot,
- 5 elfogadás/módosítás/elutasítás döntést,
- 2 olyan esetet, ahol az AI tévedett vagy pontatlan volt,
érdemes itt rögzíteni.

Az alábbi struktúrát használhatod minden bejegyzéshez.

---

## Bejegyzés #1 — Dokumentációs fájlok létrehozása

- **Dátum:** 2026-03-27
- **Használt eszköz / modell:** GitHub Copilot Chat (GPT-5.1)
- **Prompt rövid leírása:**
  - Kérted, hogy a projekt PDF követelményei alapján hozzunk létre egy `docs/` mappát, benne a szükséges `.md` fájlokkal (SPECIFICATION.md, DATAMODEL.md, COMPONENTS.md) az étkezés-/edzéskövető "Macro Tracker" alkalmazáshoz.
- **AI válasz rövid összefoglalása:**
  - Az AI létrehozta a `docs/` mappát, és kitöltötte a SPECIFICATION.md, DATAMODEL.md, COMPONENTS.md fájlokat a feladatkiírás szerinti struktúrával, a te alkalmazás-leírásodhoz igazítva.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - VÁRHATÓ: pl. "Elfogadva kisebb módosításokkal" vagy "Módosításra szorul" — ezt te tudod majd pontosítani.
- **Indoklás:**
  - Ide írd le röviden, hogy miért fogadod el vagy hogyan módosítod a javaslatot (pl. egyes entitások átnevezése, más backend választása stb.).

---

## Bejegyzés #2 — Betűstílus és színek nem kívánt módosítása, majd javítása

- **Dátum:** 2026-03-28
- **Használt eszköz / modell:** GitHub Copilot (GPT-4.1)
- **Prompt rövid leírása:**
  - Jelezted, hogy az AI módosította a betűstílust (font-family) és a színeket (globális szövegszín, input színek, vissza a tetejére banner színei) anélkül, hogy ezt kérted volna, ami regressziókat okozott a kinézetben és olvashatóságban.
- **AI válasz rövid összefoglalása:**
  - Az AI átnézte a globális és komponens szintű CSS-t, majd visszaállította a body font-family-t a korábbi rendszerfontokra, megszüntette a felesleges margót, az inputok szövegszínét a témához igazította, és a vissza a tetejére banner színeit is javította, hogy minden téma módban jól olvasható legyen.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva, mert a regressziók megszűntek, a kinézet visszaállt a kívánt állapotra.
- **Indoklás:**
  - Az AI által végzett javítások után a betűtípus, margók, input színek és banner kontrasztja ismét megfelel az eredeti elvárásoknak, így a módosítások elfogadhatók.

---

## Bejegyzés #3 — Beállítások perzisztens mentése, kijelentkezés gomb, animációk és alma ikon

- **Dátum:** 2026-03-28
- **Használt eszköz / modell:** GitHub Copilot Chat (GPT-5.1)
- **Prompt rövid leírása:**
  - Kérted, hogy a regisztrált felhasználók sötét mód / kontraszt / animációk csökkentése beállításai automatikusan elmentődjenek, míg vendégként ezek ne legyenek tartósak; a fejlécben a Bejelentkezés gomb helyén jelenjen meg egy Kijelentkezés gomb bejelentkezett állapotban; a Bejelentkezés és Beállítások oldalak kapjanak jobbra/balra lapozó animációt, amit az „Animációk csökkentése” kapcsoló ki tud kapcsolni; valamint a főoldalon az alma ikon kicsiből nőjön meg, majd mintha kiharaptak volna belőle egy darabot.
- **AI válasz rövid összefoglalása:**
  - Az AI:
    - bevezette a `macroTrackerUserType` és `macroTrackerPrefs` kulcsokat a localStorage-ban,
    - a `SettingsPageComponent` segítségével a téma, kontraszt és animációk csökkentése beállításokat regisztrált felhasználóknál perzisztensen menti, vendégeknél csak munkamenetre,
    - a `HeaderComponent`-ben az ikon jobb oldalon bejelentkezett állapottól függően Bejelentkezés / Kijelentkezés gombot jelenít meg,
    - a Bejelentkezés és Beállítások oldalra irányfüggő slide animációt tett, amelyet a `data-reduce-motion` attribútum és a beállításokban lévő kapcsoló ki tud kapcsolni,
    - a fejléc alma ikonjára bevezetett egy rövid „növekedés” animációt és egy fehér, harapás-szerű formát, amely késleltetve jelenik meg, szintén tiszteletben tartva a csökkentett animáció beállítást.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva, mert a speciális viselkedések (kijelentkezés gomb, perzisztens megjelenési beállítások, animációk csökkentése, alma animáció) megfelelnek a kéréseknek és jól illeszkednek az alkalmazás koncepciójába.
- **Indoklás:**
  - A megoldás egyértelműen szétválasztja a vendég és regisztrált felhasználói élményt, az akadálymentességi beállítás (animációk csökkentése) pedig a kulcsfontosságú mozgó elemekre (oldalváltás, fő tartalom, logó) is kihat.

---

A további bejegyzéseket a fenti sablon másolásával tudod felvenni (Bejegyzés #4, #5, ...).

---

## Bejegyzés #6 — 2.1 adatmodell pontosítása és korábbi túlzó állítás javítása

- **Dátum:** 2026-04-17
- **Használt eszköz / modell:** GitHub Copilot (GPT-5.4 mini)
- **Prompt rövid leírása:**
  - Megkérted, hogy ellenőrizzem a 2. mérföldkő 2.1 pontját, és jeleztem, hogy a korábbi válaszomban túl erősen állítottam a teljes dokumentációs egyezést.
- **AI válasz rövid összefoglalása:**
  - Az AI pontosította, hogy a jelenlegi adatmodell működő és pontozásra alkalmas, de a leadott DATAMODEL.md-hez képest egyszerűsített volt: hiányzott külön `WaterIntakeEntry`, a fórum modell `ForumReply` néven, leegyszerűsített mezőkkel működött, és több dokumentált mező nem szerepelt a típusokban vagy a mintaadatokban.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Módosításra szorul.
- **Indoklás:**
  - A korábbi „teljesen megfelel” állításom pontatlan volt. A modell alapvetően jó, de a dokumentációhoz közelebb kellett hozni a mezőket, a névhasználatot és a hiányzó vízbevitel-entitást.

---

## Bejegyzés #4 — Animációk nem látszódtak (Angular CSS scope), javítás :host-context-tel

- **Dátum:** 2026-03-29
- **Használt eszköz / modell:** GitHub Copilot (GPT-5.2)
- **Prompt (idézet):**
  - „Sajnos továbbra sem látszódnak az animációk.”
- **AI válasz rövid összefoglalása:**
  - Az AI azonosította, hogy a komponens-szintű CSS-ben használt `:root:not([data-reduce-motion='true'])` szelektor Angular (Emulated view encapsulation) mellett nem fog egyezni, ezért az animációs szabályok gyakorlatilag sosem aktiválódnak.
  - Javításként az animációk alapértelmezetten engedélyezve lettek, és csak `:host-context([data-reduce-motion='true'])` esetén tiltódnak le — így az animációk ténylegesen futnak, miközben a „csökkentett animációk” beállítás továbbra is működik.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva.
- **Indoklás:**
  - Ez egy technikai integrációs hiba volt (CSS scope), amit a javítás célzottan oldott meg anélkül, hogy extra UX funkciókat vezetett volna be; az animációk és a csökkentett animáció opció ezután a vártak szerint működnek.

---

## Bejegyzés #5 — Követelmények újraellenőrzése és dokumentáció pontosítása (Milestone 1)

- **Dátum:** 2026-03-29
- **Használt eszköz / modell:** GitHub Copilot (GPT-5.2)
- **Prompt (idézet):**
  - „menj végig a követelményeken még egyszer, és ha kell frissítsd a .md fájlokat!”
- **AI válasz rövid összefoglalása:**
  - Az AI újra átnézte a routingot és a tényleges komponens-/oldal-struktúrát, majd frissítette a dokumentációt, hogy ne állítson nem létező komponenseket és a megvalósított beállításokat (reduce motion, vízcél/pohárméret, demo perzisztencia) pontosan leírja.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva.
- **Indoklás:**
  - A dokumentáció így összhangban van a repó aktuális állapotával (különösen: komponensek, beállítások és a Milestone 1 demo jellegű perzisztencia), ami segít a beadásnál és értékelésnél.

---

## Bejegyzés #7 — Backend betöltési hibák javítása és 2.3 finomítások elfogadása

- **Dátum:** 2026-04-17
- **Használt eszköz / modell:** GitHub Copilot (GPT-5.3-Codex)
- **Prompt rövid leírása:**
  - Kérted a 2.3 backend integrációhoz kapcsolódó finomításokat, valamint annak kivizsgálását, hogy miért nem látszanak a betáplált ételek és edzésformák.
- **AI válasz rövid összefoglalása:**
  - Az AI javította a backend-kommunikáció robusztusságát (környezeti alap URL használat, ID-kezelés harmonizálása), és kompatibilissé tette a katalógus betöltést a különböző gyűjteménynevekkel is, hogy az adatok megbízhatóan megjelenjenek.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva.
- **Indoklás:**
  - Azért fogadtam el a módosításokat, mert így az adatok megfelelően töltődnek be a szerverről, és a finomítások összességében stabilabbá, megbízhatóbbá és jobban használhatóvá teszik az alkalmazást.

---

## Bejegyzés #8 — Milestone 2 perzisztencia (víz + settings) és követelmény audit

- **Dátum:** 2026-04-18
- **Használt eszköz / modell:** GitHub Copilot (GPT-5.2)
- **Prompt rövid leírása:**
  - Kérted, hogy a kódot igazítsuk a dokumentációhoz, csináljuk meg a perzisztenciát (különösen a vízbevitelnél), majd menjünk végig újra a 2. mérföldkő követelményein.
- **AI válasz rövid összefoglalása:**
  - Az AI bevezette a vízbevitel backend perzisztenciát (`waterIntakeEntries`) service + state integrációval, és a "pohár" gomb most már ment a backendbe.
  - A Settings oldalon a vízcél/pohárméret és a profil mezők (testsúly, magasság, kor, cél) regisztrált felhasználónál debounce-olt PATCH-el mentődnek a `users/1` rekordba.
  - A Settings-ben állított vízbeállítások azonnal érvényesülnek a Home oldalon ugyanabban a munkamenetben is (event alapú bekötés).
  - Ezután a 2. mérföldkő rubrika pontjaihoz készült egy ellenőrző lista konkrét kódhelyekkel.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva.
- **Indoklás:**
  - A vízbevitel és a user beállítások perzisztenciája egyértelműen javítja a Milestone 2 megfelelést (2.3), és csökkenti a dokumentáció ↔ kód eltérések miatti kockázatot.

---

## Bejegyzés #9 — Vendég mód: naplózás csak munkamenetben (no backend write)

- **Dátum:** 2026-04-18
- **Használt eszköz / modell:** GitHub Copilot (GPT-5.2)
- **Prompt rövid leírása:**
  - Kérted, hogy ellenőrizzem a SPECIFICATION.md vendég mód elvárását: vendégként a naplózott étkezés/edzés/víz adatok ne legyenek perzisztensek, ne íródjanak backendbe.
- **AI válasz rövid összefoglalása:**
  - Az AI azonosította, hogy a Home oldalon vendégként is backendbe mentődhetett volna a naplózás.
  - Javításként a Home state réteg vendég módban in-memory (session) tárolást használ dátum szerint, és letiltja a backend `Create/Update/Delete` műveleteket a naplózásnál.
  - Regisztrált módban a korábbi backend-perzisztens működés megmaradt.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva.
- **Indoklás:**
  - Így a vendég mód viselkedése megfelel a SPECIFICATION.md-nek (nem perzisztens), miközben a regisztrált felhasználó továbbra is teljes backend perzisztenciát kap.

---

## Bejegyzés #10 — Milestone 3.1 autentikáció: elfogadás és lezárás

- **Dátum:** 2026-05-01
- **Használt eszköz / modell:** GitHub Copilot Chat (GPT-5.2)
- **Prompt rövid leírása:**
  - Kérted, hogy a 3.1 Autentikáció rész legyen „teljes értékű” (pontozható), és a naplóban is legyen rögzítve, hogy elfogadtad az ehhez kapcsolódó módosításokat.
- **AI válasz rövid összefoglalása:**
  - Az AI elkészítette és egységesítette az autentikációt (valódi email+jelszó json-server backenddel), reactive form alapú bejelentkezés/regisztráció UI-val és perzisztens sessionnel.
  - Felvette a seed felhasználóhoz a `passwordHash` mezőt, hogy a login azonnal tesztelhető legyen.
  - Bevezette a route-védelmet (`authGuard`) és bekötötte a védett oldal(ak)hoz, `returnUrl` visszairányítással.
  - Az auth állapotot a releváns oldalak/komponensek már az `AuthService`-ből olvassák, nem szétszórt `localStorage` ellenőrzésekből.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva.
- **Indoklás:**
  - Elfogadtam az előző módosításokat, mert így a 3.1 Autentikáció funkciók (login, register, session, védett route, auth-függő UI) konzisztensen működnek, és a mérföldkő teljes értékűen leadható.

---

## Bejegyzés #11 — Milestone 3.2 jogosultságkezelés: védett route + szerepkörös UI + backend szabályok

- **Dátum:** 2026-05-01
- **Használt eszköz / modell:** GitHub Copilot Chat (GPT-5.2)
- **Prompt rövid leírása:**
  - Kérted, hogy a 3.2 pontozási kritériumok (védett útvonalak, szerepkör/ownership alapú UI, backend-oldali jogosultsági szabályok) legyenek teljes körűen megcsinálva.
- **AI válasz rövid összefoglalása:**
  - Az AI:
    - védte a `profile` és `settings` útvonalakat `authGuard`-dal, `returnUrl` visszairányítással,
    - bevezette a backend-oldali jogosultság ellenőrzést `server.js` middleware-rel (401/403 válaszokkal),
    - role/ownership alapú UI-t tett a fórum törlés műveletekhez (owner/admin), a topic listában és a topic detail nézetben is.
  - Gyors smoke testtel ellenőrizve lett, hogy vendégként 401, idegen erőforrásra 403, jogos műveletre 200 érkezik.
- **Döntés (elfogadás / módosítás / elutasítás):**
  - Elfogadva.
- **Indoklás:**
  - A mérföldkő 3.2 elvárásai (route védelem + UI alapú védelem + backend szabályok) így együtt demonstrálhatók és pontozhatók.
- **AI tévedés / tanulság:**
  - Kezdetben a `json-server@1.x beta` került be, ami nem kompatibilis a klasszikus `require('json-server')` API-val (nincs CJS entrypoint), ezért a backend nem indult.
  - Javításként a függőség `json-server@0.17.x` verzióra lett állítva, így a `server.js` middleware és a backend indítás működik.