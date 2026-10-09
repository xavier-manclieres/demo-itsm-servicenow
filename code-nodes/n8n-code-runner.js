// Exécute le code d'un nœud Code n8n en dehors de n8n, pour le tester.
// Le code est lu directement dans l'export JSON du workflow : on teste ce qui
// tourne réellement dans n8n, sans copie à maintenir en parallèle.
const fs = require('node:fs');

function chargerCode(fichierWorkflow, nomNoeud) {
  const wf = JSON.parse(fs.readFileSync(fichierWorkflow, 'utf8'));
  const noeud = wf.nodes.find((n) => n.name === nomNoeud);
  if (!noeud) throw new Error(`Nœud « ${nomNoeud} » absent de ${fichierWorkflow}`);
  if (noeud.type !== 'n8n-nodes-base.code') throw new Error(`« ${nomNoeud} » n'est pas un nœud Code`);
  return noeud.parameters.jsCode;
}

// input : objets JSON reçus par le nœud ; noeuds : sorties d'autres nœuds lues via $('Nom').
function executer(jsCode, { input = [], noeuds = {} } = {}) {
  const enItems = (liste) => liste.map((json) => ({ json }));
  const $input = { all: () => enItems(input), first: () => enItems(input)[0] };
  const $ = (nom) => {
    if (!(nom in noeuds)) throw new Error(`Nœud « ${nom} » non fourni au test`);
    const items = enItems(noeuds[nom]);
    return { all: () => items, first: () => items[0], item: items[0], itemMatching: (i) => items[i] };
  };
  const fn = new Function('$input', '$', `"use strict";\n${jsCode}`);
  return fn($input, $).map((i) => i.json);
}

module.exports = { chargerCode, executer };
