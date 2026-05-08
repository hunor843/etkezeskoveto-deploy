# Macro Tracker — Specifikáció

## Projekt leírás

A **Macro Tracker** egy étkezés- és edzéskövető webalkalmazás, amely segít a felhasználóknak a napi kalóriabevitelük és -felhasználásuk tudatos követésében. A célközönség egészségtudatos felhasználók, akik szeretnék
- nyomon követni, hogy mit, mikor és mennyit ettek,
- látni az elfogyasztott és a még rendelkezésre álló kalóriakeretüket,
- egyszerűen rögzíteni a sporttevékenységeiket és a napi vízbevitelüket,
- közösségi fórumon tapasztalatot cserélni más felhasználókkal.

Az alkalmazás letisztult, könnyen kezelhető, mobile-first felülettel rendelkezik, korlátozott, tudatosan megválasztott színpalettával (fehér, fekete, kék, sárga, piros, zöld).

## Funkcionális követelmények

A funkciókat modulonként / funkciócsoportonként csoportosítva:

### 1. Napi áttekintő (főoldal / dashboard)
- A főoldalon megjelenik a napi összkalória-bevitel.
- Megjelenik, hogy mennyi kalóriát fogyasztott a felhasználó az adott napon, és mennyi maradt a célkalóriából.
- Listázza a nap során elfogyasztott ételeket (mit, mikor, mennyit, hány kalória), valamint a fő makrókat (fehérje, szénhidrát, zsír) étkezésenként.
- Megjeleníti a sporttevékenységek által „levont” kalóriát.
- Összesíti a napi vízbevitelt (egy „pohár” ikon segítségével rögzíthető mennyiségek).
 - A napi nézetben összesítve is megjelennek a bevitt makrók (össz-fehérje, -szénhidrát, -zsír).
 - A felhasználó a főoldal tetején a napok között tud váltani (pl. előző / következő nap nézet).

### 2. Étkezéskezelés
- Új étkezés/étel rögzítése az alábbi adatokkal: név, időpont, mennyiség, becsült kalória (és opcionálisan makrók: fehérje, szénhidrát, zsír).
- Meglévő étkezés módosítása (adatok frissítése).
- Étkezés törlése megerősítés után.
- A napi étkezések listázása, szűrhetően/kereshetően (pl. név vagy időszak szerint) — későbbi mérföldkövekben részletesebb CRUD.
- Regisztrált felhasználó saját ételeket is felvehet a kereshető listába (saját étellista bővítése a beépített elemek mellett).

### 3. Edzéskezelés
- Sporttevékenységek rögzítése: típus (pl. futás, séta, edzőterem), időtartam, becsült elégetett kalória.
- Az edzések kalóriái levonódnak a napi nettó kalóriamérlegből.
- Edzés módosítása és törlése későbbi mérföldkőben teljes CRUD-ként.
- Regisztrált felhasználó saját mozgásformákat / edzéstípusokat is létrehozhat, amelyeket a kereshető, szűrhető listából választhat ki.

### 4. Vízbevitel-követés
- Egyszerű vízbevitel-naplózás „poharak” hozzáadásával.
- A főoldalon vizuális indikátor mutatja a napi elfogyasztott vízmennyiséget.
- Cél napi vízmennyiség beállítható (pl. beállításoknál), és a rendszer mutatja, mennyi hiányzik még.
- Beállítható az egy pohár víz mennyisége (ml-ben), és a főoldali poharak száma ehhez igazodik.

### 5. Felhasználói fiók, bejelentkezés és fórum elérés
- Regisztráció e-mail és jelszó megadásával (alapvalidációval a későbbi mérföldkőben).
- Bejelentkezés meglévő felhasználóként.
- Kijelentkezés.
- Bejelentkezett felhasználó:
  - hozzáfér a fórumhoz írási joggal (új topic létrehozása, válasz írása),
  - személyre szabott napi célokat lát (testsúly, magasság, kor, cél alapján számolt kalóriakeret).
- Nem bejelentkezett felhasználó:
  - csak olvasni tudja a fórumot,
  - az alap funkciók egy része (pl. demo mód) elérhető lehet, de az adatok nem perzisztens módon tárolódnak.

### 6. Fórum modul
- Fórum topic-ok listázása (cím, létrehozó, utolsó aktivitás).
- Új topic létrehozása (csak regisztrált felhasználóknak).
- Topic részletek nézete: hozzászólások listája, új hozzászólás írása (csak regisztrált felhasználóknak).
- Fórum olvasása vendég módban (csak olvasás, nincs írási jog).

### 7. Beállítások modul
- Sötét mód ki-/bekapcsolása.
- Cél kalóriában megadása.
- Testsúly, magasság, kor és cél (fogyni / hízni / szintentartani) megadása, ezek alapján a rendszer kiszámolja az ajánlott napi kalóriakeretet.
- Kontrasztnövelés mód beállítása (akadálymentességi opció).
- Animációk csökkentése / mozgások visszafogása (reduce motion, pl. érzékeny felhasználók számára).
- Napi vízcél (ml) és pohárméret (ml) beállítása.

### 8. Hírek és elérhetőségek
- A főoldal alján a fejlesztők által közzétett hírek listája (rövid üzenetek).
- Elérhetőségek megjelenítése (pl. email, GitHub repo link, stb.).

## Nem-funkcionális követelmények

### Technológiai döntések
- **Frontend keretrendszer:** Angular (modern, komponens-alapú, TypeScript alapú keretrendszer).
- **Nyelv:** TypeScript a frontend logikához, HTML/CSS a megjelenítéshez.
- **Build eszközök:** az Angular CLI által nyújtott tooling (Vite/Webpack háttérrel a választott verziótól függően).
- **Backend:** a 2. mérföldkőben kerül megvalósításra; tervezett megoldás: Firebase (Authentication, Firestore, Hosting) vagy egy saját REST API + adatbázis.
- **Adattárolás:** perzisztens tárolás backendben (pl. Firestore), kliens oldali cache és állapotkezelés szolgáltatásokkal. (Milestone 1-ben demo perzisztencia: UI beállítások és felhasználói mód `localStorage`-ban.)

### Teljesítmény és UX elvárások
- Reszponzív, mobile-first kialakítás, legalább három breakpointtal (mobil, tablet, desktop).
- Gyors betöltés és gördülékeny navigáció (lazy-loaded route-ok, ahol indokolt).
- Egyszerű, átlátható információs architektúra: a legfontosabb információk (napi bevitel, maradék kalória, víz, sport) a főoldalon azonnal láthatók.
- Konzisztens design token rendszer (színek, spacing, tipográfia, lekerekítések, árnyékok) használata.
- Rövid, nem tolakodó visszajelzés a fontos műveletek után (pl. toast üzenetek).

### Akadálymentesség és hozzáférhetőség
- Szemantikus HTML elemek (nav, main, header, footer, section, article, button, stb.).
- Megfelelő heading-hierarchia (h1–h6).
- ARIA attribútumok használata, ahol szükséges (pl. ikon gombok, navigációs elemek, állapot-visszajelzések).
- Billentyűzetes navigáció támogatása (Tab, Enter, Escape).
- Látható fókuszjelölés (:focus vagy :focus-visible).
- Kontrasztarányok betartása (legalább 4.5:1 a szöveg és háttér között).

## Felhasználói szerepkörök

Legalább két szerepkör / interakciós mód:

1. **Vendég (nem regisztrált felhasználó)**
   - Megtekintheti a főoldalt és az alap információkat (pl. minta étkezéslista, demó adatok).
   - Olvashatja a fórumot (topic-ok és hozzászólások).
   - Nem tud fórumhozzászólást írni, topic-ot létrehozni, személyes adatokat menteni.
   - A vendégként rögzített étkezés- és edzésadatok csak ideiglenesen, a munkamenet idejére élnek; amint kilép vagy bezárja az oldalt, ezek az adatok elvesznek (nem kerülnek tartósan az adatbázisba).

2. **Regisztrált felhasználó**
   - Személyes profil adatok megadása (testsúly, magasság, kor, cél), ez alapján egyéni napi kalóriacél számítása.
   - Személyes étkezés-, edzés- és víznapló vezetése (CRUD műveletek legalább két entitáson teljes körűen a későbbi mérföldkőben).
   - Fórum topic-ok létrehozása, hozzászólások írása.
   - Beállítások (sötét mód, kontraszt, animációk csökkentése) mentése.
   - Saját étel- és mozgásforma-lista építése (nem csak az előre betáplált elemek használata).
   - Az általa rögzített étkezés-, edzés- és vízbevitelek, valamint saját étel- és edzéssablonjai tartósan az adatbázisban tárolódnak, és bejelentkezéskor bármikor visszatölthetők.

3. **(Opcionális, később bővíthető) Adminisztrátor**
   - Fórum moderálása (topic/hozzászólás törlése, zárolása).
   - Alkalmazás híreinek közzététele.

A minimális követelményeket a Vendég + Regisztrált szerepkör már teljesíti.

## Képernyő-lista / sitemap

Az alkalmazás várható oldalai és navigációja:

1. **Főoldal / Dashboard (/ vagy /home)**
   - Fejléc: "Macro tracker" felirat és alma ikon.
   - Jobb felső sarok: bejelentkezés / profil ikon.
   - Bal felső sarok: beállítások ikon (sötét mód, cél, kontraszt, animációk csökkentése).
   - Tartalom: napi összefoglaló (bevitt kalória, maradék kalória, víz, sport), étkezések listája, víz- és edzéskártyák.
   - Alsó rész: hírek, elérhetőségek.

2. **Bejelentkezés / Regisztráció oldal (/login, /register)**
   - Bejelentkezési űrlap (email, jelszó).
   - Regisztrációs űrlap (email, jelszó, alapadatok) — akár egy oldalon váltva vagy külön route-on.
   - Hibaüzenetek rossz adatok esetén.

3. **Fórum főoldal (/forum)**
   - Fórum topic-ok listája.
   - Új topic létrehozása gomb (csak bejelentkezett felhasználóknak).

4. **Fórum topic részletek (/forum/:topicId)**
   - Kiválasztott topic címe és leírása.
   - Hozzászólások listája.
   - Új hozzászólás form (csak bejelentkezett felhasználóknak).

5. **Beállítások oldal (/settings)**
   - Sötét mód, kontraszt mód kapcsolók.
   - Animációk csökkentése / mozgások visszafogása.
   - Testsúly, magasság, kor, cél megadása és a célkalória kiszámítása.
   - Napi vízcél (ml) és pohárméret (ml) beállítása.

6. **Profil / Saját adatok oldal (/profile) — opcionális**
   - Felhasználói adatok áttekintése, módosítása.

7. **Nem található oldal (/404)**
   - Egyedi 404 / Not Found oldal ismeretlen URL esetére.

A navigáció kliens-oldali routinggal valósul meg: a fejlécben vagy egy alsó navigációs sávban elérhető fő menüpontokkal (Főoldal, Fórum, Beállítások, Profil).