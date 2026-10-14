// Vérifie que chaque export de workflow est un JSON valide et ne contient pas d'identifiants.
const fs = require('node:fs');
const path = require('node:path');

// Dossiers d'exports : workflows communs + un dossier par outil ITSM.
const racine = path.join(__dirname, '..');
const dossiers = ['workflows', 'servicenow/workflows', 'jira/workflows']
  .map((d) => path.join(racine, d))
  .filter((d) => fs.existsSync(d));
const motifsInterdits = [
  /"credentials"\s*:\s*\{\s*"[^"]+"\s*:\s*\{\s*"id"\s*:\s*"[^"]+"/,
  /sk-ant-[A-Za-z0-9_-]{10,}/,
  /pat[A-Za-z0-9]{14}\.[A-Za-z0-9]{40,}/,
];

let erreurs = 0;
const fichiers = dossiers.flatMap((d) =>
  fs.readdirSync(d).filter((n) => n.endsWith('.json')).map((n) => path.join(d, n)));
for (const chemin of fichiers) {
  const f = path.relative(racine, chemin);
  const contenu = fs.readFileSync(chemin, 'utf8');
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
