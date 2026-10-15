// Tests des workflows REX côté Jira : WF0b (incident P1 de test), WF2 (brouillon), WF2b (publication).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const dossier = path.join(__dirname, '..', 'jira', 'workflows');
const WF0B = path.join(dossier, 'jira-wf0b-incident-p1.json');
const WF2 = path.join(dossier, 'jira-wf2-brouillon-rex.json');
const WF2B = path.join(dossier, 'jira-wf2b-publication-rex.json');
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const noeud = (wf, nom) => wf.nodes.find((n) => n.name === nom);

// Document ADF minimal, comme Jira Cloud le renvoie pour un commentaire.
const adf = (texte) => ({ type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: texte }] }] });
const commentaire = (minute, texte, accountId = 'acc-1') => ({
  created: `2026-10-15T09:${minute}:00.000+0200`, author: { accountId, displayName: 'Prénom Nom' }, body: adf(texte),
});
const ticket = (key, extra = {}) => ({
  key,
  fields: {
    summary: 'ERP-PROD indisponible',
    description: adf('Panne générale'),
    created: '2026-10-15T09:00:00.000+0200',
    resolutiondate: null,
    statuscategorychangedate: '2026-10-15T09:50:00.000+0200',
    comment: { comments: [
      commentaire('10', 'Pool saturé sur 10.20.4.15'),
      commentaire('25', 'Reconnexion password=Secret123!', 'acc-2'),
      commentaire('02', 'Alerte supervision'),
    ] },
    ...extra,
  },
});
const preparer = (pages, existants = []) => executer(chargerCode(WF2, 'Préparer les REX'), {
  input: pages, noeuds: { 'Lire les REX existants': existants },
});

test('WF2 Jira : un ticket P1 terminé donne un REX à rédiger', () => {
  const [r] = preparer([{ issues: [ticket('IT-87')] }]);
  assert.equal(r.sys_id, 'IT-87');
  assert.equal(r.number, 'IT-87');
  assert.equal(r.description, 'Panne générale');
  assert.equal(r.nbNotes, 3);
});

test('WF2 Jira : la chronologie est triée et le texte ADF converti', () => {
  const [r] = preparer([{ issues: [ticket('IT-87')] }]);
  const lignes = r.chronologie.split('\n');
  assert.match(lignes[0], /Alerte supervision/);
  assert.match(lignes[1], /Pool saturé/);
});

test('WF2 Jira : IP et mot de passe masqués, intervenants pseudonymisés', () => {
  const [r] = preparer([{ issues: [ticket('IT-87')] }]);
  assert.doesNotMatch(r.chronologie, /10\.20\.4\.15|Secret123|Prénom Nom|acc-1/);
  assert.match(r.chronologie, /\[IP\]/);
  assert.match(r.chronologie, /password=\[MASQUÉ\]/);
  assert.match(r.chronologie, /Intervenant 1/);
  assert.match(r.chronologie, /Intervenant 2/);
});

test('WF2 Jira : durée calculée jusqu\'au passage à Terminé si la résolution est vide', () => {
  const [r] = preparer([{ issues: [ticket('IT-87')] }]);
  assert.equal(r.duree, 50);
  const [r2] = preparer([{ issues: [ticket('IT-88', { resolutiondate: '2026-10-15T09:30:00.000+0200' })] }]);
  assert.equal(r2.duree, 30);
});

test('WF2 Jira : un ticket qui a déjà un REX dans Airtable est ignoré', () => {
  const existants = [{ id: 'rec1', createdTime: '2026-10-15T00:00:00.000Z', fields: { Incident: 'IT-87' } }];
  const r = preparer([{ issues: [ticket('IT-87'), ticket('IT-90')] }], existants);
  assert.deepEqual(r.map((x) => x.number), ['IT-90']);
});

test('WF2 Jira : aucun ticket, aucun REX', () => {
  assert.deepEqual(preparer([{ issues: [] }]), []);
});

test('WF2 Jira : ne lit et ne crée que des brouillons Jira, sans incident annulé', () => {
  const wf = lire(WF2);
  assert.equal(noeud(wf, 'Lire les REX existants').parameters.filterByFormula, "{Outil}='Jira'");
  assert.equal(noeud(wf, 'Créer le brouillon').parameters.columns.value.Outil, 'Jira');
  const jql = noeud(wf, 'Incidents P1 résolus').parameters.jsonBody;
  assert.match(jql, /priority = Highest/);
  assert.match(jql, /status != 10003/);
  assert.equal(wf.nodes.filter((n) => /serviceNow/i.test(n.type)).length, 0);
});

test('WF2b Jira : ne publie que les brouillons Jira validés, en commentaire interne', () => {
  const wf = lire(WF2B);
  const declencheur = wf.nodes.find((n) => n.type === 'n8n-nodes-base.airtableTrigger');
  assert.equal(declencheur.parameters.additionalFields.formula, "AND({Statut}='Validé', {Outil}='Jira')");
  assert.match(declencheur.parameters.additionalFields.fields, /Modifié le/);
  const corps = noeud(wf, "Ajouter le REX à l'incident").parameters.jsonBody;
  assert.match(corps, /sd\.public\.comment/);
  assert.match(corps, /internal: true/);
});

test('WF0b Jira : choisit « Terminé » et jamais « Annulé »', () => {
  const choisir = chargerCode(WF0B, 'Choisir la transition');
  const transitions = [
    { id: '51', name: 'En attente', to: { name: 'Pending', statusCategory: { key: 'indeterminate' } } },
    { id: '101', name: 'Annuler', to: { name: 'Annulé', statusCategory: { key: 'done' } } },
    { id: '111', name: 'Traiter', to: { name: 'Terminé', statusCategory: { key: 'done' } } },
  ];
  const [r] = executer(choisir, { input: [{ transitions }], noeuds: { "Créer l'incident P1": [{ key: 'IT-99' }] } });
  assert.equal(r.transitionId, '111');
  assert.equal(r.key, 'IT-99');
  assert.throws(() => executer(choisir, { input: [{ transitions: [transitions[1]] }], noeuds: { "Créer l'incident P1": [{ key: 'IT-99' }] } }), /Annuler → Annulé/);
});
