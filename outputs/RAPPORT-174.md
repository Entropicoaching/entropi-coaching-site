# RAPPORT-174: Tilgængelighed målt, ikke gættet

Ordre: `ORDRE-Setu.md` (174) · Gren: `sitet-tilgaengeligt` · Base: `main` (5d68145)

## Gren og commits

- Gren: `sitet-tilgaengeligt` (worktree `entropi-coaching-site-wt2`), base
  `main` (`5d68145`).
- Commit 1 — målingen: `5650a0a`
- Commit 2 — retter det der objektivt fejler: `ce0214f`
- Commit 3 — denne rapport færdiggjort + Marcs valg-liste + skærmbilleder:
  se `git log --oneline -1 sitet-tilgaengeligt` efter aflevering.

Metode: `node scripts/maal.mjs`-motoren (samme puppeteer + axe-core der allerede
ligger i `devDependencies`) genbrugt i et engangs-script (`_audit174.mjs`, ikke
committet) til at måle alle 14 sider ved mobil-viewport (390×844). Axe-core
kørte reglerne `color-contrast`, `image-alt`, `input-image-alt`,
`heading-order`, `target-size`, `tabindex`, `aria-hidden-focus`,
`focus-order-semantics`. Suppleret med manuel DOM-måling af computed
font-size, bounding-box på alle interaktive elementer, overskriftsrækkefølge
og `alt`-attributter. `.reveal`-elementer blev tvunget synlige før måling
(ellers rapporterer axe farven midt i en fade-animation, ikke den øjeblik
brugeren rent faktisk ser — det gav en række falske positiver i første
kørsel, som blev luget væk før tabellen herunder).

## 1. Målingen (Commit 1)

### Kontrast — tekst og knapper mod WCAG AA (4,5:1 / 3:1 for store/grafiske)

| Side(r) | Fund | Målt værdi | Krav |
|---|---|---|---|
| Alle 14 sider | `--ink4` (`#4a4844`) brugt som tekstfarve (footer-tagline, footer-meta, meta-date/meta-read, references, author-label, article-card-meta, privacy-updated, program-meta, f-stat-label, figcaption, form-note, result-class m.fl.) mod `--bg`/`--bg2`/`--bg3` | 1,70–2,02 : 1 | 4,5 : 1 |
| 6 artikel-sider (autoregulering, deload, frekvens, hvad-laver-en-coach, intensitet, volumen) | Footer-copyright-linje har `opacity:0.5` inline på en `<div>` der arver `--ink3`/`--ink2` — halverer ellers-godkendt kontrast | 2,28 : 1 (tekst) / 3,54 : 1 (Privatliv-link) | 4,5 : 1 |
| om.html | `.navn-word` (det store "Entropi"-opslagsord) sat i `--bg4` (`#2e2e28`) mod `--bg2` | 1,25 : 1 | 3 : 1 (stor tekst) |
| style.css + 6 artikelsider | `.nav-cta`-knap og `.program-link`-knap: kant i `--amber-dim` (`#7a5520`) mod `--bg`/`--bg2` — knappens synlige afgrænsning | 2,77 : 1 | 3 : 1 (grafisk element) |
| Alle sider | Løbetekst (`--ink`, `--ink2`, `--ink3`), overskrifter (`--amber`, serif-tekst), `.btn-primary` (amber/bg), `.optin-error` (`#f0d4cf`) | 5,15–13,21 : 1 | Består allerede |

### Tekststørrelser under 16px (målt, ikke rettet — se afsnit 3)

Udbredt: al mono-label-tekst (nav, footer, eyebrows, meta-tags, kort-metadata)
er tegnet med 9–15px efter designet. Eksempler: `.footer-tagline` 10,4px,
nav/footer-links ~11px, `.meta-date` 9,6px, `.article-card-meta` 9,3px,
brødtekst i enkelte kort ned til 13–15px. Dette er et gennemgående
designvalg, ikke enkeltstående fejl — se Marc-listen.

### Trykflader under 44px

| Side(r) | Fund | Målt værdi | Krav |
|---|---|---|---|
| Alle 14 sider | Footer-links (Coaching/Resultater/Viden/Om/Instagram/Atletportal/Privatliv) og mobilmenuens links | ~13–19px høje | 44×44px |
| Alle 14 sider | `.nav-hamburger`-knap | 32×32px | 44×44px |
| Alle 14 sider | `.skip-link` ("Spring til indhold") | 42px høj | 44×44px |
| Alle 14 sider | `.nav-logo` ("Entropi.") | 31px høj | 44×44px |
| Alle 14 sider | Kontakt-mail-link i footer (`coach@entropicoaching.dk`) | 17–19px høj | 44×44px |
| 6 artikelsider | `.nav-back`, `.back-link`, `.author-name a` | 13–19px høje | 44×44px |
| index.html, artikler.html, viden.html | `.btn-ghost`, `.vc-link`, `.viden-all`, `.articles-cta-secondary` | 18–37px høje | 44×44px |
| programmer.html | `.program-link` | 38px høj | 44×44px |
| resultater.html | `.profile-source` | 19px høj | 44×44px |
| coaching.html | Form-felter (`input`, `select`) | 19–22px høje | 44×44px |
| privatliv.html | Kontakt-links (`datatilsynet.dk` m.fl.) | 19px høje | 44×44px |

`.nav-links a` (desktop-menuen, `display:none` under 900px) er ikke medtaget
som fejl — den er aldrig synlig eller trykbar på en telefon, så den falder
uden for "kan læses/betjenes på en telefon". Se afsnit 5 for grænsen.

### Manglende `alt` på billeder

Ingen fund. Sitet bruger ingen `<img>` uden `alt` — axe's `image-alt` og
`input-image-alt` gav 0 på alle 14 sider, og en manuel gennemgang af hvert
`<img>`-element bekræfter det samme.

### Overskriftshierarki

Ingen fund. Overskriftsrækkefølgen er sammenhængende på alle 14 sider (h1 →
h2 → h3 uden spring) — axe's `heading-order` og en manuel sekvens-tjek af
alle `h1`–`h6` stemmer overens.

### Tastaturbetjening

- Ingen positive `tabindex`-værdier nogen steder (axe `tabindex`: 0 fund).
- Ingen `onclick`, `role="button"` eller custom `addEventListener('click', …)`
  på ikke-native elementer — det eneste JS-drevne UI (hamburger-menu i
  `main.js`) bruger en rigtig `<button>`, styrer `aria-expanded`, flytter
  fokus ind i menuen ved åbning og lukker på Escape med fokus tilbage til
  knappen. Det er allerede korrekt bygget.
- `tabindex="-1"` findes tre steder (`#form-success`, `#form-error` på
  coaching.html, `#optin-success`/`#optin-error` på programmer.html) — det
  er den rigtige brug (programmatisk fokus til statusbeskeder), ikke en fejl.
- Reelt fund: fokusmarkering er usynlig eller stærkt svækket på 8 steder (se
  Commit 2 nedenfor) — det er et synligheds-, ikke et betjenings-problem;
  alle elementer kan nås og aktiveres med tastatur alene.

## 2. Det der objektivt fejler (Commit 2)

Alt her er den mindst mulige ændring: eksisterende farvetoken justeret i
lyshed (ingen nye farver i paletten), eksisterende usynlig-trykflade-mønster
genbrugt, eller en fjernet linje CSS. Ingen redesign.

### Kontrast

- **`--ink4`** (`#4a4844` → `#92908c`) i `style.css` og de 6 artikelsiders
  lokale `:root`. Ny værdi holder ≥4,5:1 mod alle tre baggrunde den bruges
  på (`--bg` 5,79:1, `--bg2` 5,36:1, `--bg3` 4,89:1 — værst-tilfælde er
  `.f-stat-label` på resultater.html mod `--bg3`).
- **`--amber-dim`** (`#7a5520` → `#8a6125`) i `style.css` og de 6
  artikelsiders `:root`. Retter kantkontrasten på `.nav-cta` og
  `.program-link` til ≥3:1 (nu 3,36:1 mod `--bg`, 3,11:1 mod `--bg2`).
  Bruges også til dekorative venstrekanter og understregninger, hvor kravet
  ikke gælder — men samme token, så én justering retter det hele.
- **om.html `.navn-word`**: skiftet fra `--bg4` (en baggrundsfarve brugt som
  tekst, 1,25:1) til `--ink4` (nu 5,36:1) — det store opslagsord "Entropi"
  var praktisk talt usynligt.
- **6 artikelsider, footer-copyright-linjen**: fjernet `opacity:0.5` på
  `<div>`'en med CVR-nummer og Privatliv-link. Den halverede en ellers
  godkendt kontrast (ink3/ink2) ned under grænsen.
- **Rettelse af egen fejl undervejs**: da footer-kontakt-reglen blev
  indsnævret til kun det direkte email-link (for at undgå at trykfladekravet
  utilsigtet ramte det indlejrede Privatliv-link, se nedenfor), mistede
  Privatliv-linket i de 6 artikelsider sin farve helt og faldt tilbage til
  browserens standardblå (`#0000EE`, 1,81:1 mod `--bg2`) — værre end før.
  Fanget af en før/efter-måling og rettet med en ny regel
  (`.footer-contact div a`) der giver linket `--ink3` med understregning,
  samme mønster som `.footer-meta a` i `style.css`.

### Fokusmarkering

- **coaching.html** (`.field input/select/textarea`) og **programmer.html**
  (`.optin-input`) havde `outline: none` der overskrev den globale
  fokusring. Formularfelter (navn, email, vægtklasse, besked, tilmelding)
  havde reelt ingen synlig fokusmarkering — kun en svag baggrundstoning
  (`background: var(--bg2)`/`var(--bg3)` ved `:focus-within`, næsten
  usynlig). `outline: none` fjernet; den globale amber-ring virker nu.
- **De 6 artikelsider** manglede den globale
  `a:focus-visible, button:focus-visible, …` ringmarkering som resten af
  sitet har haft i `style.css` siden tidligere ordrer — de har åbenbart
  aldrig fået den med, da de blev bygget som selvstændige filer. Tilføjet
  identisk til `style.css`s version i alle 6. `.nav-back` og `.author-name a`
  havde egne, mere specifikke regler der kun skiftede farve (ingen ring) —
  suppleret med samme outline.

### Trykflader under 44px

- **style.css** (rammer 9 sider): `.footer-links a`, `.footer-contact > a`
  (kun det direkte email-link — se kontrast-afsnittet), `.mobile-menu a`,
  `.nav-logo`, `.nav-hamburger`, `.skip-link` fik `min-height: 44px` (og
  `.nav-hamburger` `44×44px` helt). `.footer-links` fik desuden
  `min-width: 44px` + lidt padding, så korte labels som "Viden" (36px bred)
  også når 44px i bredden — gap justeret ned tilsvarende, så footeren ikke
  bliver bredere.
- **`.btn-ghost`, `.vc-link`, `.viden-all`, `.profile-source`,
  `.articles-cta-secondary`**: disse har en tætsiddende understregning
  (`border-bottom`) klods op ad teksten. At vokse den synlige boks til 44px
  ville rive stregen væk fra teksten — et rent designbrud. Løst med en
  usynlig `::after`-flade (samme element, `position:absolute`, ingen
  synlig content) der udvider selve trykfladen 44×44px+ uden at flytte en
  eneste pixel af det synlige design. Det er den løsning WCAG selv nævner
  som gyldig (target kan bestå af synlig + usynlig trykflade).
- **6 artikelsider**: `.nav-logo`, `.nav-back`, `.back-link`,
  `.author-name a`, `.footer-links a`, `.footer-contact > a` fik samme
  `min-height: 44px`-behandling som style.css-versionerne.
- **programmer.html `.program-link`**: har en fuld kant (rigtig knap-look),
  så her er `min-height: 44px` lagt direkte på — ingen usynlig-flade-trick
  nødvendig.
- **coaching.html `.field input, .field select`**: `min-height: 44px`.
  `.field textarea` og `.optin-input` (programmer.html) var allerede ≥44px.

### Ikke rettet — undtaget eller Marcs valg

- **Inline tekstlinks** ("Læs først om…", "Læs om behandling af
  personoplysninger.", "ansøge om coaching her", email/Datatilsynet-links i
  privatliv.html, Privatliv-linket i `.footer-meta`): sidder midt i en
  sætning/tekstlinje. WCAG's eget target-size-krav (2.5.8) har en udtrykkelig
  undtagelse for links der er en del af en løbende tekst — de er ikke rettet,
  og bør ikke tvinges til 44px uden at brække linjen.
- **`.nav-links a`** (desktop-menuen): `display:none` under 900px, aldrig
  synlig eller trykbar på en telefon — udenfor "telefon i sollys"-formålet
  med denne ordre. Ikke rettet.
- **Honeypot-felter** (`.hp-field`, `_gotcha`): bevidst usynlige/uden for
  tabulatorrækkefølgen (`aria-hidden`, `tabindex="-1"`, positioneret
  off-screen). Min egen måling fanger dem stadig som "for små", fordi de er
  lagt ud af skærmen — det er korrekt opførsel, ikke en fejl.
- **Tekststørrelser under 16px**: ikke rettet, se afsnit 3 (Marcs valg).

## 3. Marcs valg

Ikke bygget — kun forslag, adskilt fra det der allerede er rettet ovenfor.
Skærmbilleder i `outputs/skaermbilleder-174/` (mobil, 390px), før = stillet op
mod grenen lige før Commit 2 (samme kode som `main`), efter = nu.

**1. `--ink4` blev markant lysere (`#4a4844` → `#92908c`) for at bestå
kontrastkravet.** Det var nødvendigt for at bestå WCAG AA, men resultatet er
at "den svageste grå" nu ligger tæt på `--ink3` — sitets fire gråtoner er i
praksis blevet til tre. Forslag: behold som den er (den eneste vej til at
bestå kravet uden at ændre selve baggrundene), eller overvej på sigt en
bredere palet-samtale hvor baggrundene (`--bg`–`--bg4`) også er i spil, så
der er mere plads mellem tonerne igen. Skærmbillede:
`skaermbilleder-174/foer-footer.png` → `efter-footer.png`.

**2. Baggrundens generelle lysstyrke er ikke rørt.** Din irritation over
kontrast i app og site handler måske ikke kun om enkelte tekstfarver, men om
at hele siden føles mørk — det er ikke noget jeg har rettet på, for
`--bg`/`--bg2`/`--bg3`/`--bg4` er uændrede, og en generel opklaring er et
redesign, ikke en målbar fejl. Skærmbillede (uændret, til reference):
`skaermbilleder-174/foer-hero.png` / `efter-hero.png` (identiske — viser
status quo).

**3. Footer og mobilmenu fik synligt mere luft.** For at nå 44px trykflade
uden at bruge det usynlige `::after`-trick (forbeholdt links med tætsiddende
understregning) voksede den *synlige* boks på footer-links, footer-kontakt
og mobilmenuens links. Footeren er derfor lidt højere, og linkene står
længere fra hinanden lodret. Forslag: behold (mest robust, synligt hvad der
er trykfladen), eller skift til samme usynlige-udvidelse-trick som
btn-ghost/vc-link for et visuelt identisk footer. Skærmbillede:
`skaermbilleder-174/foer-footer.png` → `efter-footer.png`.

**4. Tekststørrelser under 16px er ikke rørt.** Hele mono-label-systemet
(nav, footer, eyebrows, meta-tags, korts metadata) er tegnet i 9–15px — det
er ikke enkeltstående fejl, det er hele den grafiske identitet. At hæve
gulvet til fx 12–13px ville røre stort set hver eneste side. Forslag: behold
som bevidst mikro-typografi (ingen WCAG-krav tvinger 16px), eller udpeg de
mest læse-tunge steder (fx `.article-body`-relaterede metadata) til en
målrettet forhøjelse — ikke hele systemet på én gang. Intet skærmbillede
(uændret på alle sider).

**5. `om.html`'s "Entropi"-opslagsord gik fra næsten usynligt til tydeligt
synligt.** Det var en objektiv kontrastfejl (1,25:1 mod krav 3:1), så det er
rettet i Commit 2 — men hvis den svage, "vandmærke"-agtige effekt var et
bevidst designvalg og ikke en fejl, er det værd at se efter. Skærmbillede:
`skaermbilleder-174/foer-navn.png` → `efter-navn.png`.

## 4. Testresultat

- `npm run tjek:alle` findes ikke i `package.json` på `main` (kun `npm run
  maal`) — sandsynligvis en reference til et script der findes på en anden
  gren (fx `sitet-efterset`/`artikel-skabelon`), ikke på basen denne ordre
  navngiver. Jeg har brugt `npm run maal` i stedet og noterer det her frem
  for at gætte på et script der ikke findes.
- **`npm run maal`** (Lighthouse + axe-core + linkinator + sidevægt, alle 15
  sider): grøn. `outputs/MAAL-EFTER.md`/`.json` opdateret. Accessibility-score
  89–96 → **100** på alle 15 sider. Axe-fejl (kritisk/alvorlig) 1 → 0 på 14 af
  15 sider — index.html viser stadig "1" i `maal.mjs`s egen kolonne, se
  forbehold nedenfor. 0 manglende `alt`, 0 døde interne links, alle sider
  virker uden JS.
- **Eget engangs-audit** (mobil-viewport 390px, `.reveal` tvunget synlig,
  axe-core `color-contrast`/`image-alt`/`heading-order`/`target-size` m.fl.
  + manuel DOM-måling): **0 fund** på alle 14 sider efter Commit 2 (var en
  lang liste før).
- **Forbehold om index.html's resterende "1" i `npm run maal`**: verificeret
  direkte — det er `.hero-body-2`, `.btn-ghost[href$="coaching.html"]` og
  Afklar-linket, alle stadig midt i deres `.reveal`-fade-animation, fordi
  `scripts/maal.mjs`s egen axe-måling ikke venter på eller tvinger
  `.reveal`-elementer synlige (og bruger desktop-viewport, ikke mobil). Det
  er samme falsk-positiv-mønster jeg selv ramte i første udkast af mit
  audit-script, og som jeg rettede for. Dette er en svaghed i selve
  `scripts/maal.mjs` (uden for denne ordres omfang at rette, og ordren siger
  udtrykkeligt ikke at røre målemotoren) — ikke en reel kontrastfejl på
  index.html. Værd at nævne til Dhruva/Marc, hvis `maal.mjs` skal bruges som
  fast tjek fremover.
- Skærmbilleder + visuel gennemgang (footer, mobilmenu, fokusring på
  formularfelter) af index.html, om.html, coaching.html, viden.html,
  artikel-deload.html, afklaring.html — intet brækket layout.

## 5. Hvad er næste

- Marc tager stilling til de 5 punkter i afsnit 3.
- Hvis Marc vil videre med en bredere palet-samtale (baggrundens lysstyrke),
  hører det til et nyt, større Delmål/ordre — ikke en udvidelse af denne.
- Overvej at rette `scripts/maal.mjs`s axe-måling (reveal-fade + mobil
  viewport) i en separat ordre, så værktøjet ikke bliver ved med at vise et
  falsk index.html-fund.
- `npm run tjek:alle` bør enten tilføjes til `main`s `package.json`, eller
  ordrer bør holde op med at referere til det — det findes kun på andre
  grene.

## Ærlige grænser

- Jeg har ikke testet med en skærmlæser (NVDA/VoiceOver) — kun automatiseret
  axe-core + manuel DOM-inspektion. Axe fanger typisk 30-40% af reelle
  a11y-problemer; strukturen (overskrifter, alt, tabindex, formularlabels)
  er gennemgået manuelt, men en reel skærmlæser-gennemgang er ikke lavet.
- Fysisk enhedstest (rigtig telefon i sollys) er ikke muligt herfra — alt er
  målt i en headless browser på 390×844.
- `--amber-dim` er lysnet globalt for at rette to knap-kanter, men bruges
  også dekorativt ca. 15 andre steder (venstrekanter på citater/noter,
  understregninger) hvor kravet ikke gælder — de er ikke vurderet enkeltvis
  for om den nye tone "ser rigtig ud", kun at kontrastkravet er opfyldt hvor
  det er en knap.
- Jeg har ikke rørt Løftmodellens embeds, som ordren forbyder.
- `.footer-contact div a`-fixet (Privatliv-linket i de 6 artikelsider) er en
  ny CSS-regel, ikke kun en farvejustering — den mindste rettelse jeg kunne
  finde til at genskabe den kontrast der allerede fandtes andre steder på
  sitet, men det er teknisk en ny regel, ikke kun "juster lysheden".
