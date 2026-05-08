# Macro Tracker — Adatmodell

## Entitások

Az alkalmazás legalább 5 egymáshoz kapcsolódó entitást használ. Az alábbi adatmodell a tervezett backend (pl. Firestore vagy relációs adatbázis) szempontjából is értelmezhető.

Megjegyzés (Milestone 1):
- A jelenlegi implementáció több beállítást és „felhasználói módot” demo jelleggel kliens oldalon (`localStorage`) kezel; a tartós, backend alapú perzisztencia a későbbi mérföldkő része.

### 1. User (Felhasználó)

A rendszer felhasználóit írja le.

Mezők:
- `id`: string — egyedi azonosító (UUID vagy backend által generált ID)
- `email`: string — egyedi email cím
- `passwordHash`: string — jelszó hash (backend oldalon tárolva)
- `displayName`: string — megjelenítendő név
- `role`: "guest" | "user" | "admin" — felhasználói szerepkör
- `weightKg`: number | null — testsúly kg-ban
- `heightCm`: number | null — magasság cm-ben
- `age`: number | null — életkor
- `goalType`: "lose" | "gain" | "maintain" | null — cél: fogyni / hízni / szintentartani
- `dailyCalorieTarget`: number | null — kiszámolt napi kalóriacél
- `waterDailyTargetMl`: number | null — napi vízcél (ml)
- `waterGlassSizeMl`: number | null — egy pohár víz mérete ml-ben (a poharak számának kiszámításához a főoldalon)
- `createdAt`: Date — regisztráció időpontja
- `updatedAt`: Date — utolsó módosítás időpontja

### 2. MealEntry (Étkezés bejegyzés)

Egy konkrét, felhasználó által rögzített étkezést reprezentál.

Mezők:
- `id`: string — egyedi azonosító
- `userId`: string — hivatkozás a User.id-re
- `timestamp`: Date — az étkezés időpontja
- `title`: string — étel/étkezés neve (pl. "csirke rizzsel")
- `amount`: number — mennyiség (pl. gramm vagy adag)
- `amountUnit`: string — mennyiség mértékegysége (pl. "g", "adag")
- `calories`: number — becsült kalória (kcal)
- `proteinGrams`: number | null — fehérje mennyisége grammban
- `carbGrams`: number | null — szénhidrát mennyisége grammban
- `fatGrams`: number | null — zsír mennyisége grammban
- `note`: string | null — opcionális megjegyzés
- `createdAt`: Date — rögzítés időpontja
- `updatedAt`: Date — utolsó módosítás időpontja

### 3. ExerciseEntry (Edzés bejegyzés)

Egy rögzített sporttevékenységet tárol.

Mezők:
- `id`: string — egyedi azonosító
- `userId`: string — hivatkozás a User.id-re
- `timestamp`: Date — az edzés időpontja
- `type`: string — edzés típusa (pl. "futás", "séta", "súlyzós edzés")
- `durationMinutes`: number — időtartam percben
- `caloriesBurned`: number — becsült elégetett kalória (kcal)
- `intensity`: "low" | "medium" | "high" | null — opcionális intenzitás szint
- `note`: string | null — opcionális megjegyzés
- `createdAt`: Date
- `updatedAt`: Date

### 4. WaterIntakeEntry (Vízbevitel bejegyzés)

A napi vízbevitelt követő bejegyzés, a pohár ikonhoz kapcsolódóan.

Mezők:
- `id`: string — egyedi azonosító
- `userId`: string — hivatkozás a User.id-re
- `timestamp`: Date — a vízivás időpontja
- `amountMl`: number — elfogyasztott víz mennyisége milliliterben
- `source`: string | null — forrás (pl. "pohár", "kulacs")
- `createdAt`: Date

### 5. ForumTopic (Fórum topic)

A fórumon létrehozott témákat írja le.

Mezők:
- `id`: string — egyedi azonosító
- `title`: string — topic címe
- `description`: string | null — rövid leírás
- `authorUserId`: string — hivatkozás a User.id-re (létrehozó)
- `createdAt`: Date — létrehozás időpontja
- `updatedAt`: Date — utolsó módosítás időpontja
- `isLocked`: boolean — zárolt-e a topic (pl. admin/moderátor által)

### 6. ForumPost (Fórum hozzászólás)

Egy-egy hozzászólás egy adott topicban.

Mezők:
- `id`: string — egyedi azonosító
- `topicId`: string — hivatkozás a ForumTopic.id-re
- `authorUserId`: string — hivatkozás a User.id-re
- `content`: string — hozzászólás szövege
- `createdAt`: Date — létrehozás időpontja
- `updatedAt`: Date — utolsó módosítás időpontja
- `isEdited`: boolean — módosítva lett-e

### 7. FoodPreset (Felhasználói étel sablon)

Előre megadott vagy felhasználó által létrehozott étel „sablonokat” tartalmaz, amelyeket az étkezés rögzítésekor gyorsan ki lehet választani.

Mezők:
- `id`: string — egyedi azonosító
- `userId`: string | null — ha null, akkor globális (mindenki által látható) étel; különben a felhasználó saját sablonja (User.id-re hivatkozik)
- `name`: string — étel neve (pl. "csirke rizzsel")
- `defaultAmount`: number | null — tipikus mennyiség
- `defaultAmountUnit`: string | null — mértékegység (pl. "g", "adag")
- `calories`: number — becsült kalória (kcal)
- `proteinGrams`: number | null
- `carbGrams`: number | null
- `fatGrams`: number | null
- `ingredients`: string[] — az étel összetevőinek listája (pl. ["csirke", "rizs", "saláta"])
- `imageUrl`: string | null — opcionális kép (a felhasználó által megadható, de nem kötelező)
- `createdAt`: Date
- `updatedAt`: Date

### 8. ExercisePreset (Felhasználói edzés sablon)

Előre megadott vagy felhasználó által létrehozott edzéstípus-sablonok a gyorsabb naplózáshoz.

Mezők:
- `id`: string — egyedi azonosító
- `userId`: string | null — ha null, akkor globális (mindenki által látható) edzéstípus; különben a felhasználó saját sablonja (User.id-re hivatkozik)
- `name`: string — edzés neve (pl. "futás", "séta")
- `intensity`: "low" | "medium" | "high" — jellemző intenzitási szint
- `caloriesPerHour`: number — becsült kalória / óra
- `createdAt`: Date
- `updatedAt`: Date

(A fenti modell 8 entitást tartalmaz, meghaladva a minimum 5 entitást.)

## Kapcsolatok

Az entitások közötti relációk szövegesen:

1. **User – MealEntry**
   - Kapcsolat típusa: 1:N
   - Leírás: egy felhasználónak több étkezés bejegyzése lehet, de egy étkezés pontosan egy felhasználóhoz tartozik.
   - Implementáció: MealEntry.userId hivatkozik a User.id-re.

2. **User – ExerciseEntry**
   - Kapcsolat típusa: 1:N
   - Leírás: egy felhasználónak több edzés bejegyzése lehet, de egy edzés bejegyzés egy konkrét felhasználóhoz tartozik.
   - Implementáció: ExerciseEntry.userId hivatkozik a User.id-re.

3. **User – WaterIntakeEntry**
   - Kapcsolat típusa: 1:N
   - Leírás: egy felhasználó napközben több vízbevitel-bejegyzést is rögzíthet; ezek mind egy felhasználóhoz tartoznak.
   - Implementáció: WaterIntakeEntry.userId hivatkozik a User.id-re.

4. **User – ForumTopic**
   - Kapcsolat típusa: 1:N
   - Leírás: egy felhasználó több forum topic-ot is létrehozhat; minden topicnak pontosan egy létrehozója van.
   - Implementáció: ForumTopic.authorUserId hivatkozik a User.id-re.

5. **User – ForumPost**
   - Kapcsolat típusa: 1:N
   - Leírás: egy felhasználó több hozzászólást is írhat; minden hozzászólás egy szerzőhöz kötődik.
   - Implementáció: ForumPost.authorUserId hivatkozik a User.id-re.

6. **ForumTopic – ForumPost**
   - Kapcsolat típusa: 1:N
   - Leírás: egy fórum topic több hozzászólást tartalmazhat; minden hozzászólás pontosan egy topic-hoz tartozik.
   - Implementáció: ForumPost.topicId hivatkozik a ForumTopic.id-re.

7. **User – (napi összesítő nézet)**
   - Logikai kapcsolat: a napi kalóriamérleg és statisztikák a MealEntry, ExerciseEntry és WaterIntakeEntry entitások aggregált adataiból számolódnak felhasználónként és naponként.

Összefoglalva:
- A User entitás áll a modell középpontjában, hozzá kapcsolódnak az étkezés-, edzés-, víz- és fórum entitások.
- A relációk többsége 1:N (egy user több bejegyzés vagy topic/post tulajdonosa).
- Az adatmodell logikailag illeszkedik az étkezés- és edzéskövető alkalmazás céljához, és a későbbi backend / CRUD követelmények megvalósításához is megfelelő alapot ad.