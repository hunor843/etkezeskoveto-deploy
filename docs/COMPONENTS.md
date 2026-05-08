# Macro Tracker — Komponens-terv

## Komponensfa (fő komponensek)

Az alkalmazás Angular alapú, komponens-alapú architektúrával készült. Fontos: a Milestone 1-ben több funkció még **oldal-komponenseken belüli szekcióként** van megvalósítva (nem külön gyerekkomponensekben), hogy a feladat fókusza (UI, reszponzivitás, a11y, routing) teljesüljön.

### Jelenlegi implementáció (Milestone 1)

- `App` (root)
  - `HeaderComponent` (fejléc)
    - logo/brand (alma animációval)
    - beállítások + bejelentkezés/kijelentkezés ikon
    - navigációs linkek (Főoldal, Fórum) — mobilon is látható
  - `RouterOutlet`
  - `FooterComponent` (hírek + elérhetőségek)
  - Toast UI (globális visszajelzés) — `ToastService` alapján

Oldal-komponensek (route-okhoz kötve):

- `HomePageComponent` — napi áttekintés: kalóriák, makrók, víz (poharak), mozgás, kereshető étel/mozgás hozzáadás
- `LoginPageComponent` — bejelentkezés/regisztráció UI (demo), visszajelzésekkel
- `SettingsPageComponent` — téma/kontraszt, animációk csökkentése, vízcél + pohárméret
- `ForumPageComponent` — fórum téma lista (demo)
- `ForumTopicDetailPageComponent` — téma részletek (demo)
- `ProfilePageComponent` — profil (placeholder)
- `NotFoundPageComponent` — 404 oldal

### Tervezett (későbbi mérföldkövek)

- A Home oldali blokkok (napi összegzés, étel lista, víz tracker, mozgás tracker) külön komponensekre bonthatók (pl. `DailySummaryComponent`, `WaterTrackerComponent`, stb.), amikor a CRUD és a backend integráció bővül.
- A fórum és profil funkciók (űrlapok, listák) szintén külön UI komponensekre bonthatók.

## Modulok / oldalak és komponensek összerendelése

Az alkalmazás fő oldala(i) és a hozzájuk tartozó komponensek:

### Főoldal / Dashboard (`/` vagy `/home`)

Fő oldal-komponens:
- `HomePageComponent`

Megjegyzés:
- A Milestone 1-ben ezek a funkciók a `HomePageComponent`-en belüli szekciók; később bonthatók külön komponensekre.

Layout és keret:
- `HeaderComponent`
- `FooterComponent`
- `RouterOutlet` (AppComponent-ben)

### Bejelentkezés / Regisztráció (`/login`, opcionálisan `/register`)

Fő oldal-komponens:
- `LoginPageComponent`

Megjegyzés:
- A Milestone 1-ben a bejelentkezés/regisztráció egy oldalon, feltételes UI-val van megoldva.

### Fórum főoldal (`/forum`)

Fő oldal-komponens:
- `ForumPageComponent`

Megjegyzés:
- A Milestone 1-ben a téma lista demo tartalommal jelenik meg.

### Fórum topic részletei (`/forum/:topicId`)

Fő oldal-komponens:
- `ForumTopicDetailPageComponent`

Megjegyzés:
- A Milestone 1-ben demo/placeholder tartalom.

### Beállítások oldal (`/settings`)

Fő oldal-komponens:
- `SettingsPageComponent`

Megjegyzés:
- A Milestone 1-ben a beállítások egy oldalkomponensben vannak, külön szekciókkal.

### Profil oldal (`/profile`) — opcionális

Fő oldal-komponens:
- `ProfilePageComponent`

### Nem található oldal (`/404` vagy catch-all route)

Fő oldal-komponens:
- `NotFoundPageComponent`

---

A fenti komponensfa bemutatja az alkalmazás fő szerkezetét, egyértelmű szülő–gyerek viszonyokkal. A gyökér `AppComponent` tartalmazza a közös layout elemeket (fejléc, lábléc, router outlet), míg az egyes route-okhoz külön oldal-komponensek és az azokhoz tartozó funkcionális gyerekkomponensek tartoznak.