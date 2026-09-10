#!/usr/bin/env node
// Måler alle HTML-sider i roden af siden: Lighthouse (mobil-profil,
// performance/accessibility/best-practices/SEO), samlet sidevægt, største
// billede, døde interne links (linkinator), tilgængelighedsfejl (axe-core),
// manglende alt, manglende <title>/metabeskrivelse, og om siden virker uden
// JS. Ingen afhængigheder ud over det der allerede står i package.json
// (lighthouse, chrome-launcher, puppeteer, axe-core, linkinator).
//
//   npm run maal
//
// Første kørsel skriver outputs/MAAL-FOER.md + .json (baseline). Findes
// MAAL-FOER.md allerede, skriver den næste kørsel outputs/MAAL-EFTER.md +
// .json i stedet, og lægger automatisk en før→efter-diff-linje ind pr. side
// nederst i MAAL-EFTER.md (læst fra MAAL-FOER.json).
//
// Kører alt lokalt mod en simpel statisk server (ingen build, ingen
// deploy) — samme MIME-tankegang som scripts/check-artikel.mjs.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { LinkChecker } from 'linkinator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const outputsDir = path.join(repoRoot, 'outputs');
const axeCorePath = path.join(repoRoot, 'node_modules', 'axe-core', 'axe.min.js');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain',
  '.json': 'application/json', '.ico': 'image/x-icon',
};

// --- statisk server -------------------------------------------------------

function startServer() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(repoRoot, urlPath === '/' ? '/index.html' : urlPath);
    if (!filePath.startsWith(repoRoot)) { res.writeHead(403); res.end(); return; }
    try {
      const data = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

// --- sider ------------------------------------------------------------------

function listHtmlPages() {
  return readdirSync(repoRoot)
    .filter((f) => f.endsWith('.html'))
    .sort();
}

// --- pr.-side måling via puppeteer ------------------------------------------

async function measurePageWeightAndAssets(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  const responses = [];
  page.on('response', async (resp) => {
    try {
      const req = resp.request();
      const headers = resp.headers();
      let size = Number(headers['content-length'] || 0);
      if (!size) {
        try { const buf = await resp.buffer(); size = buf.length; } catch { size = 0; }
      }
      responses.push({ url: resp.url(), resourceType: req.resourceType(), size, ok: resp.ok() });
    } catch {
      // navigation kan afbryde et par sene svar; ignorér dem, de tæller ikke reelt med i sidevægten.
    }
  });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  // loading="lazy"-billeder henter først når de ruller i syne. Rul hele
  // siden igennem, så "samlet sidevægt" er den fulde side, ikke kun det
  // der er synligt uden at scrolle.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    let y = 0;
    const max = document.body.scrollHeight;
    while (y < max) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
      y += step;
    }
    window.scrollTo(0, max);
  });
  await new Promise((r) => setTimeout(r, 400));

  const totalBytes = responses.reduce((sum, r) => sum + r.size, 0);
  const images = responses.filter((r) => r.resourceType === 'image' && r.size > 0);
  images.sort((a, b) => b.size - a.size);
  const largest = images[0]
    ? { fil: images[0].url.replace(url.split('/').slice(0, 3).join('/') + '/', ''), kb: Math.round(images[0].size / 1024) }
    : null;

  const meta = await page.evaluate(() => {
    const title = document.title || '';
    const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const missingAlt = Array.from(document.images)
      .filter((img) => !img.hasAttribute('alt') || img.getAttribute('alt').trim() === '')
      .map((img) => img.getAttribute('src'));
    return { title: title.trim(), desc: desc.trim(), missingAlt };
  });

  await page.close();
  return {
    totalKb: Math.round(totalBytes / 1024),
    largest,
    title: meta.title,
    desc: meta.desc,
    missingAlt: meta.missingAlt,
  };
}

async function measureNoJs(browser, url) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ok = await page.evaluate(() => {
    const hasNav = !!document.querySelector('nav a[href]');
    const textLen = (document.body.innerText || '').trim().length;
    return hasNav && textLen > 200;
  });
  await page.close();
  return ok;
}

async function measureAxe(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.addScriptTag({ path: axeCorePath });
  const results = await page.evaluate(async () => {
    // Vi kigger kun på "kritiske"/"alvorlige" tekniske fejl (kontrast, labels,
    // overskriftsrækkefølge m.m.) — ikke "moderate"/"mindre" stil-anbefalinger.
    const r = await window.axe.run(document, { resultTypes: ['violations'] });
    return r.violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }));
  });
  await page.close();
  return results;
}

// --- lighthouse ---------------------------------------------------------

async function measureLighthouse(url, port) {
  const result = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  const cats = result.lhr.categories;
  const score = (c) => (c ? Math.round(c.score * 100) : null);
  return {
    performance: score(cats.performance),
    accessibility: score(cats.accessibility),
    bestPractices: score(cats['best-practices']),
    seo: score(cats.seo),
  };
}

// --- døde interne links --------------------------------------------------

async function measureDeadLinks(baseUrl) {
  const checker = new LinkChecker();
  // path skal være roden ("/"), ikke "/index.html" — linkinator afgør om
  // et fundet link skal krybes videre ved at tjekke om det starter med
  // "rootPath" (startsWith), og næsten intet starter med ".../index.html"
  // ud over index.html selv. Med "/" som rod matcher alle interne URL'er,
  // og krybningen går reelt i dybden gennem hele sitet.
  const result = await checker.check({
    path: baseUrl + '/',
    recurse: true,
    linksToSkip: (link) => !link.startsWith(baseUrl),
  });
  const broken = result.links.filter((l) => l.state === 'BROKEN');
  const byPage = new Map();
  for (const b of broken) {
    const parent = (b.parent || baseUrl + '/index.html').replace(baseUrl + '/', '') || 'index.html';
    if (!byPage.has(parent)) byPage.set(parent, []);
    byPage.get(parent).push(b.url.replace(baseUrl + '/', ''));
  }
  return byPage;
}

// --- markdown-tabel --------------------------------------------------------

function mdEscape(s) {
  return String(s ?? '').replace(/\|/g, '\\|');
}

function buildTable(rows) {
  const header = [
    'Side', 'Perf', 'A11y', 'Best P.', 'SEO', 'Axe-fejl', 'Sidevægt (KB)',
    'Største billede', 'Døde interne links', 'Manglende alt', 'Title/meta', 'Uden JS',
  ];
  const lines = [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
  ];
  for (const r of rows) {
    lines.push(
      `| ${r.page} | ${r.lh.performance} | ${r.lh.accessibility} | ${r.lh.bestPractices} | ${r.lh.seo} | ` +
      `${r.axe.length} | ${r.weight.totalKb} | ` +
      `${r.weight.largest ? mdEscape(r.weight.largest.fil) + ' (' + r.weight.largest.kb + ' KB)' : '—'} | ` +
      `${r.deadLinks.length ? r.deadLinks.length + ': ' + mdEscape(r.deadLinks.join(', ')) : '0'} | ` +
      `${r.weight.missingAlt.length} | ` +
      `${(!r.weight.title ? 'title mangler; ' : '') + (!r.weight.desc ? 'metabeskrivelse mangler' : '')}${r.weight.title && r.weight.desc ? 'OK' : ''} | ` +
      `${r.noJs ? 'OK' : 'FEJL'} |`
    );
  }
  return lines.join('\n');
}

function buildDiff(before, after) {
  const lines = ['', '## Før → efter', ''];
  const beforeByPage = new Map(before.map((r) => [r.page, r]));
  for (const a of after) {
    const b = beforeByPage.get(a.page);
    if (!b) { lines.push(`- **${a.page}**: ny side, ingen "før"-måling.`); continue; }
    const d = (x, y) => (x === y ? `${x}` : `${x} → ${y}`);
    lines.push(
      `- **${a.page}**: perf ${d(b.lh.performance, a.lh.performance)}, ` +
      `a11y ${d(b.lh.accessibility, a.lh.accessibility)}, ` +
      `sidevægt ${d(b.weight.totalKb, a.weight.totalKb)} KB, ` +
      `axe-fejl ${d(b.axe.length, a.axe.length)}, ` +
      `manglende alt ${d(b.weight.missingAlt.length, a.weight.missingAlt.length)}, ` +
      `døde links ${d(b.deadLinks.length, a.deadLinks.length)}`
    );
  }
  return lines.join('\n');
}

// --- main --------------------------------------------------------------

async function main() {
  mkdirSync(outputsDir, { recursive: true });
  const foerMdPath = path.join(outputsDir, 'MAAL-FOER.md');
  const foerJsonPath = path.join(outputsDir, 'MAAL-FOER.json');
  const isEfter = existsSync(foerMdPath);
  const mdPath = isEfter ? path.join(outputsDir, 'MAAL-EFTER.md') : foerMdPath;
  const jsonPath = isEfter ? path.join(outputsDir, 'MAAL-EFTER.json') : foerJsonPath;

  const pages = listHtmlPages();
  console.log(`Måler ${pages.length} sider (${isEfter ? 'EFTER' : 'FØR'}-kørsel)...\n`);

  const { server, port: serverPort } = await startServer();
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  const browser = await puppeteer.launch({ headless: true });
  // Lighthouse kan tale direkte med den debugger-port puppeteer allerede
  // åbnede — ingen grund til at starte endnu en Chrome-instans ved siden af.
  const chromePort = new URL(browser.wsEndpoint()).port;

  const deadLinksByPage = await measureDeadLinks(baseUrl);

  const rows = [];
  for (const page of pages) {
    const url = `${baseUrl}/${page}`;
    process.stdout.write(`  ${page} ... `);
    // Sekventielt, ikke parallelt: lighthouse og puppeteer deler samme
    // Chrome-instans via CDP-porten, og det er mere robust end at lade dem
    // navigere samtidig.
    const weight = await measurePageWeightAndAssets(browser, url);
    const noJs = await measureNoJs(browser, url);
    const axe = await measureAxe(browser, url);
    const lh = await measureLighthouse(url, chromePort);
    const deadLinks = deadLinksByPage.get(page) || [];
    rows.push({ page, weight, noJs, axe, lh, deadLinks });
    console.log('OK');
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  const md = [
    `# ${isEfter ? 'Måling efter' : 'Måling før'} (Ordre 111)`,
    '',
    `Målt ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC, ${pages.length} sider, mobil-profil (Lighthouse).`,
    '',
    buildTable(rows),
  ];

  if (isEfter && existsSync(foerJsonPath)) {
    const before = JSON.parse(readFileSync(foerJsonPath, 'utf8'));
    md.push(buildDiff(before, rows));
  }

  writeFileSync(mdPath, md.join('\n') + '\n', 'utf8');
  writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`\nSkrevet: ${path.relative(repoRoot, mdPath)} og ${path.relative(repoRoot, jsonPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
