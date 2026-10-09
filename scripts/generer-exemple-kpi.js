// Produit powerbi/exemple-kpi.json en exécutant le nœud « Calculer les indicateurs »
// de WF3 sur les enregistrements Airtable fictifs de powerbi/exemple-airtable.json.
// Le fichier d'exemple a donc exactement la forme de la réponse réelle de WF3.
const fs = require('node:fs');
const path = require('node:path');
const { calculerIndicateurs } = require('../code-nodes/indicateurs');

const dossier = path.join(__dirname, '..', 'powerbi');
const SORTIE = path.join(dossier, 'exemple-kpi.json');

function genererExemple() {
  const entree = JSON.parse(fs.readFileSync(path.join(dossier, 'exemple-airtable.json'), 'utf8'));
  const reponse = calculerIndicateurs(entree.candidats, entree.rex);
  // Date fixe, pour que le fichier ne change pas à chaque génération.
  return { ...reponse, genere_le: entree.genere_le };
}

if (require.main === module) {
  fs.writeFileSync(SORTIE, JSON.stringify(genererExemple(), null, 2) + '\n');
  console.log('powerbi/exemple-kpi.json régénéré');
}

module.exports = { genererExemple, SORTIE };
