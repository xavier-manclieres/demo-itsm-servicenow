// Vérifie que chaque export de workflow est un JSON valide et ne contient pas d'identifiants.
const fs = require('node:fs');
const path = require('node:path');

const dossier = path.join(__dirname, '..', 'workflows');
const motifsInterdits = [
  /"credentials"\s*:\s*\{\s*"[^"]+"\s*:\s*\{\s*"id"\s*:\s*"[^"]+"/,
  /sk-ant-[A-Za-z0-9_-]{10,}/,
  /pat[A-Za-z0-9]{14}\.[A-Za-z0-9]{40,}/,
];

let erreurs = 0;
for (const f of fs.readdirSync(dossier).filter((n) => n.endsWith('.json'))) {
  const contenu = fs.readFileSync(path.join(dossier, f), 'utf8');
  try {
    JSON.parse(contenu);
  } catch (e) {
    console.error(`JSON invalide : ${f} (${e.message})`);
    erreurs++;
    continue;
  }
  for (const m of motifsInterdits) {
    if (m.test(contenu)) {
      console.error(`Identifiant probable dans ${f} (motif ${m})`);
      erreurs++;
    }
  }
}
if (erreurs) process.exit(1);
console.log('Exports de workflows : OK');
