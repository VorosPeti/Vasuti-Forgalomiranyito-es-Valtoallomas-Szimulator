# Vasúti Forgalomirányító Szimulátor — WEBPROG Beadandó

## Hallgatói Adatok
* **Név:** <Vörös Péter>
* **Neptun kód:** <CEMFH2>
* **Szak / Képzés:** Programtervező informatikus BSc (ELTE IK)
* **Bemutató videó linkje (OneDrive):** [Videó megtekintése](https://...)
* **A futtatható program linkje (Vercel, Netlify, Firebase, stb.): https://vorospeti.github.io/Vasuti-Forgalomiranyito-es-Valtoallomas-Szimulator/ **
---

## Hallgatói Nyilatkozat és AI Használat
Kijelentem, hogy ez a megoldás a saját szellemi munkám. Nem másoltam és nem vettem át harmadik féltől származó kész kódrészleteket jogosulatlanul. Tudomásul veszem az ELTE HKR 377/A. § szerinti szabályzatot: a nem megengedett segítség igénybevétele vagy a másolat készítése fegyelmi eljárást és a tárgy automatikus elutasítását vonja maga után.

### AI Eszközök Használata (Jelöld a megfelelőt):
* [ ] A feladatot teljesen önállóan, AI segítség nélkül készítettem el.
* [ x ] Használtam mesterséges intelligenciát (pl. ChatGPT, GitHub Copilot) tanácsadóként.
  * *Részletezés: Az AI-t konkrétan a JavaScript-kód fejlesztésének támogatására használtam. Segített a három pálya felépítésének kialakításában, a vasúti hálózatok csomópontjainak és vágánykapcsolatainak megtervezésében, valamint a váltók, jelzők és vonatok útvonalainak ellenőrzésében. Emellett segítséget kértem a mentési és visszatöltési funkciók kialakításához, illetve a programhibák javításához és játék kinézetének mintához hasonló kialakításához.* <Írd le 2-3 mondatban, mire használtad az AI-t (pl. ötletelés, szintaxiskeresés, hibakeresés).>

Tudomásul veszem, hogy a személyes szóbeli kódvédésen a kód minden egyes sorát önállóan, segédeszköz nélkül meg kell tudnom magyarázni.

---

## Önellenőrző Lista (Checklist)

### Kezdőképernyő & Általános Funkciók
- [ x ] Játékosnév bekérése és validálása
- [ x ] 3 különböző nehézségi szintű pálya kiválasztása
- [ x ] Játékszabályzat és irányítás megtekintése
- [ x ] Pályánkénti dicsőséglista (helyi ranglista) localStorage-ban
- [ x ] Korábbi játékállás visszatöltése a főmenüből

### Játékmenet & Felület (Canvas)
- [ x ] Folyamatosan frissülő játékidő (stopper) kijelzése
- [ x ] Célba ért vonatok és hiba/késésszámláló dinamikus HUD-ja
- [ x ] Topológiai vágányhálózat és állomások kirajzolása Canvas 2D-ben
- [ x ] Váltók állítása bal egérgombbal (vizuális irányjelzéssel)
- [ x ] Vasúti fényjelzők (kétoptikás) szabad/tilos állítása bal kattintással
- [ x ] Szerelvények vészfékezése / feloldása jobb egérgombbal
- [ x ] Jobb egérgombos böngészőmenü letiltva a játéktéren

### Szimuláció, Logika & Hibakezelés
- [ x ] Menetrend szerinti automatikus vonatindítás eltérő sebességekkel
- [ x ] Vörös jelzőnél kötelező és automatikus megállás
- [ x ] Közelgő ütközés valós idejű vizuális figyelmeztetése (sárga/piros aura)
- [ x ] Vonatütközések azonnali detektálása és Game Over kezelése
- [ x ] Kisiklás kezelése helytelen váltóállás vagy nyitott vágányvég esetén
- [ x ] Helytelen célperonra futás büntetése
- [ x ] Játék végi győzelmi / vereségi értesítés egyedi modális ablakban (alert nélkül)

### Kódminőség & Architektúra
- [ ] Szigorú "1 HTML + 1 CSS + 3 JS" moduláris struktúra (state, render, app)
- [ ] Nincs var kulcsszó a teljes forráskódban
- [ ] Nincsenek getElementById, DOMContentLoaded, alert() hívások
- [ ] Tiszta Vanilla JS (nincs külső könyvtár vagy framework)
- [ ] Játékállás mentése és visszatöltése localStorage segítségével
- [ ] A 3-5 perces narrált bemutató videó feltöltve és megosztható OneDrive linken
- [ ] Online deployment, a program elérhető valamilyen online platformon, ennek elérhetőségét feltüntettem itt a README.md file elején

