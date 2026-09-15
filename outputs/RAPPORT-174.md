# RAPPORT-174: Tilgængelighed målt, ikke gættet

Ordre: `ORDRE-Setu.md` (174) · Gren: `sitet-tilgaengeligt` · Base: `main` (5d68145)

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
- Reelt fund: fokusmarkering er usynlig eller stærkt svækket to steder (se
  Commit 2 nedenfor) — det er et synligheds-, ikke et betjenings-problem;
  alle elementer kan nås og aktiveres med tastatur alene.
