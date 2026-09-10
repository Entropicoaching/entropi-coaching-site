# Rapport — Ordre 111: hjemmesiden målt og gjort let

## Gren

`site-let-og-maalt`, oven på `main` (`05aa2d5`). Ingen push.

- `513befa` — Mål siden: `scripts/maal.mjs` og baseline (commit 1)
- `ed6e08c` — Billige gevinster: lette billeder, main-landmarks (commit 2)
- (denne rapport + `MAAL-EFTER.*`/`FORSLAG-TIL-MARC.md`/skærmbilleder committes som commit 3)

Rent træ. Artikelgrenene (`artikel-squat/doedloeft/baenk/spoergsmaal`) er ikke rørt.

## Hvad ændret

**Værktøjer brugt** (alle som dev-only devDependencies i `package.json`,
`node_modules` i `.gitignore`, deployes ikke til GitHub Pages): Lighthouse
(performance/accessibility/best-practices/SEO, mobil-profil, via
programmatisk API genbrugt over puppeteers egen Chromium-debugport —
ingen dobbelt Chrome-download), puppeteer (statisk server + sidevægt +
uden-JS-tjek + skærmbilleder), axe-core (tilgængelighed, injiceret direkte
i siden), linkinator (døde interne links, hele sitet krydset rekursivt
fra `/`), sharp (billedoptimering). Læste `flowforfrank/performance-
checklist` og Stronger by Science/Jacob Tomlinsons Lighthouse CI-artikler
for at se hvad en almindelig statisk-side-tjekliste dækker, før jeg
byggede `scripts/maal.mjs`.

**`scripts/maal.mjs`** (`npm run maal`): måler alle 15 HTML-sider —
Lighthouse-score, samlet sidevægt i KB (ruller siden igennem for at
fange `loading="lazy"`-billeder, ellers undertælles vægten), største
billede, døde interne links, axe-fejl (kun kritisk/alvorlig), manglende
alt, manglende title/metabeskrivelse, uden-JS-tjek. Skriver
`MAAL-FOER.md` første gang, `MAAL-EFTER.md` (med automatisk før→efter-
diff pr. side) anden gang.

**Billeder** (`scripts/optimer-billede.mjs`): skaleret til den bredde de
faktisk vises i, målt direkte i browseren ved 390/1440/1920 px viewport
og ganget med 2 for retina. Kun to billeder var reelt for store i pixel-
mål: `regitze-em-2026-medalje.jpg` (3024 px bred, vist ved ~240 px) og
`entropi-app-anonymiseret.png` (1091 px, vist ved ~500 px); resten fik
kun ny komprimering (mozjpeg/palette-PNG), ikke nedskalering. Alle seks
viste billeder fik en `.webp`-søskende, `<picture>`-ombrydning med
JPG/PNG-fallback, `width`/`height` og bevaret `loading="lazy"`.
Originalerne ligger urørt i `assets/originaler/`. `regitze-em-2026-
guld.jpg` (kun brugt som `og:image`, aldrig vist på siden) fik samme
behandling for delingshastighedens skyld.

**Fundet undervejs, ikke i opgavebeskrivelsen:** et `<img>` hvis CSS
sætter `width:100%` og `aspect-ratio` men ikke selv `height`, får
Chromium til at bruge `height`-attributtens rå pixelværdi i stedet for
aspect-ratio — en kendt CSS-fælde. Ville have ødelagt layoutet på fire
sider hvis jeg ikke havde testet det. Rettet med `height: auto` på
`.competition-img`, `.about-img`, `.historie-img`, `.platform-visual img`
og `.featured-media img`. Verificeret med `git stash` at sidehøjden er
byte-for-byte identisk før/efter på alle fire sider.

**Tilgængelighed:** `landmark-one-main`/`region` (moderate, axe) manglede
på 8 sider (intet `<main>`) — rettet ved at ombryde sideindholdet i
`<main>` (samme mønster som allerede brugt på `artikel-deload.html`) og
give den faste `mobile-cta-bar` `role="region"`. Eneste tilbageværende
fund er `color-contrast` (serious) på alle 15 sider — ikke rettet, kræver
en anden farve end `--ink4`, se `FORSLAG-TIL-MARC.md`.

**Uændret, fordi det allerede var i orden:** 0 døde interne links, 0
manglende `alt`, 0 manglende `<title>`/metabeskrivelse — verificeret i
commit 1's baseline, ikke rørt i commit 2. Sitemap og robots.txt
gennemgået mod alle 14 kanoniske URL'er (hver sides `<link rel="canonical">`)
— komplette. `artikler.html` er bevidst udeladt af sitemap: dens
canonical peger på `viden.html`, så den skal ikke indekseres separat.

**Ikke ændret:** tekst, farver, layout, ny skrifttype, nye sider,
artikelgrenene.

## Testresultat

`npm run maal` grøn begge gange (exit 0), alle 15 sider åbnet i
Chromium uden konsolfejl (tjekket eksplicit efter tilgængeligheds-
rettelserne). Samlet sidevægt på tværs af alle 15 sider: **5682 KB →
2898 KB (−49 %)**. De tre tungeste sider:

| Side | Sidevægt før → efter | Perf før → efter | A11y før → efter |
|---|---|---|---|
| resultater.html | 1669 → 211 KB | 89 → 90 | 93 → 96 |
| coaching.html | 1135 → 211 KB | 88 → 88 | 96 → 96 |
| index.html | 624 → 362 KB | 86 → 88 | 96 → 96 |
| om.html | 410 → 269 KB | 87 → 88 | 93 → 96 |

Fuld tabel og alle 15 sider: `outputs/MAAL-FOER.md` / `MAAL-EFTER.md`
(inkl. automatisk diff-sektion nederst i EFTER-filen). Perf-scoren
flyttede sig mindre end sidevægten skulle tilsige — de fleste af disse
sider var allerede Lighthouse-optimerede (font-preconnect, lazy-loading
var der i forvejen); den store gevinst er reel download-vægt på mobilt
net, ikke Lighthouse-scoren i sig selv. A11y-scoren steg tydeligt på de
8 sider der manglede `<main>`.

Skærmbilleder af forsiden, mobilbredde (390 px), før og efter:
`outputs/forside-foer-mobil.png` / `outputs/forside-efter-mobil.png` —
identisk sidehøjde (9136 px) og udseende, verificeret ved siden af
hinanden.

## Hvad er næste

Ingenting kræver Marc lige nu — commit 2 er rettelser, ikke spørgsmål.
Fire punkter der kræver hans dom står i `outputs/FORSLAG-TIL-MARC.md`
(farvekontrast, ubrugte billedfiler, et muligt uoverensstemmende
`og:image` på resultater.html, hero-billedets opløsningsloft). Når/hvis
Marc lægger nye fotos op, kan `node scripts/optimer-billede.mjs <fil>
<maks-bredde-px>` genbruges direkte — den flytter selv originalen til
`assets/originaler/` og laver webp+fallback.

## Ærlige grænser

- Lighthouse-scoren er målt på denne maskine, ikke på GitHub Pages' egen
  CDN — reelle tal efter deploy kan afvige en smule (typisk til det
  bedre, da Pages har sin egen komprimering/CDN).
- `scripts/optimer-billede.mjs` er kørt manuelt pr. billede med en
  bredde jeg selv har målt og valgt — det er ikke en automatisk pipeline
  der kører ved hver commit. Nye billeder skal stadig køres igennem i
  hånden.
- Axe-core er kun kørt for kritisk/alvorlig-niveau i selve målingen;
  moderate/mindre fund (ud over landmark/region, som jeg fangede og
  rettede manuelt) er ikke systematisk gennemgået.
- Jeg har ikke testet siden i en rigtig browser på en rigtig telefon,
  kun headless Chromium via puppeteer ved 390 px viewport.
- `assets/originaler/` gemmer kun de billeder jeg selv har optimeret i
  denne ordre — ikke en generel backup af alle billeder i repoet.
