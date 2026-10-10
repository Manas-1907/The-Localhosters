// One-shot site configuration.
//   npm run configure -- --url=https://www.mama.in --ga=G-ABC123XYZ [--api=https://api.mama.in/api]
// Updates the domain in canonical/OG tags, sitemap.xml, robots.txt and the support email,
// and sets the Google Analytics ID / API URL in assets/site.js.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split(/=(.*)/s).slice(0, 2)));
if (!args.url && !args.ga && args.api === undefined) {
  console.log('Usage: npm run configure -- --url=https://your-domain.com --ga=G-XXXXXXXXXX [--api=https://api.your-domain.com/api]');
  process.exit(1);
}

const siteJsPath = path.join(root, 'assets/site.js');
let site = fs.readFileSync(siteJsPath, 'utf8');
const oldUrl = site.match(/siteUrl:\s*'([^']*)'/)[1];
const oldGa = site.match(/gaId:\s*'([^']*)'/)[1];
const host = (u) => new URL(u).hostname.replace(/^www\./, '');

const files = [];
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'scripts'].includes(f.name)) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(html|xml|txt|js)$/.test(f.name)) files.push(p);
  }
};
walk(root);

let newUrl = oldUrl;
if (args.url) {
  newUrl = args.url.replace(/\/+$/, '');
  if (!/^https:\/\//.test(newUrl)) { console.error('--url must start with https://'); process.exit(1); }
}
const oldHost = oldUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
const newHost = host(newUrl);

for (const p of files) {
  let t = fs.readFileSync(p, 'utf8');
  const before = t;
  if (args.url) {
    t = t.split(oldUrl).join(newUrl).split(`support@${oldHost}`).join(`support@${newHost}`);
  }
  if (p === siteJsPath) {
    t = t.replace(/siteUrl:\s*'[^']*'/, `siteUrl: '${newUrl}'`);
    if (args.ga) t = t.replace(/gaId:\s*'[^']*'/, `gaId: '${args.ga}'`);
    if (args.api !== undefined) t = t.replace(/apiUrl:\s*'[^']*'/, `apiUrl: '${args.api}'`);
  }
  if (t !== before) fs.writeFileSync(p, t);
}
console.log(`Site URL: ${newUrl}\nGA ID:    ${args.ga || oldGa}\nAPI URL:  ${args.api ?? '(unchanged)'}`);
