// WF1 Jira : normalisation des tickets Jira puis regroupement (même nœud que ServiceNow).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const dossier = path.join(__dirname, '..', 'jira', 'workflows');
const WF0 = path.join(dossier, 'jira-wf0-jeu-de-donnees.json');
const WF1 = path.join(dossier, 'jira-wf1-incidents-recurrents.json');
const normaliser = (issues) => executer(chargerCode(WF1, 'Normaliser les incidents'), { input: [{ issues }] });
const regrouper = (incidents) => executer(chargerCode(WF1, 'Regrouper et comparer'),
  { input: incidents, noeuds: { 'Lire les candidats existants': [] } });

// Ce que renverrait l'API Jira pour les 22 incidents créés par WF0.
const ticketsJira = () => executer(chargerCode(WF0, 'Générer 22 incidents')).map((i, n) => ({
  key: `IT-${n + 1}`,
  fields: {
    summary: i.summary,
    labels: [i.category],
    components: i.ci ? [{ name: i.ci }] : [],
    created: '2026-10-14T10:00:00.000+0200',
    issuelinks: [],
  },
}));

test('la normalisation produit le format commun', () => {
  const [i] = normaliser(ticketsJira());
  assert.deepEqual(Object.keys(i), ['sys_id', 'number', 'short_description', 'category', 'cmdb_ci', 'opened_at']);
  assert.equal(i.number, 'IT-1');
  assert.equal(i.cmdb_ci, 'ERP-PROD');
  assert.equal(i.category, 'software');
});

test('un incident déjà lié à un problème est écarté', () => {
  const t = ticketsJira();
  t[0].fields.issuelinks = [{ type: { name: 'Problem/Incident' } }];
  assert.equal(normaliser(t).length, 21);
});

test('un lien d’un autre type ne compte pas', () => {
  const t = ticketsJira();
  t[0].fields.issuelinks = [{ type: { name: 'Relates' } }];
  assert.equal(normaliser(t).length, 22);
});

test('le jeu de données Jira donne trois candidats de 6 incidents', () => {
  const candidats = regrouper(normaliser(ticketsJira()));
  assert.equal(candidats.length, 3);
  assert.deepEqual(candidats.map((c) => c.nb), [6, 6, 6]);
  assert.deepEqual(candidats.map((c) => c.ci).sort(), ['ERP-PROD', 'MAIL-EXCH-01', 'NAS-FICHIERS']);
});

test('Jira WF1 reconnaît un groupe déjà présent dans Airtable (format réel du nœud Search)', () => {
  const existants = [{ id: 'recX', createdTime: '2026-10-15T00:00:00.000Z', fields: { Signature: 'ERP-PROD | software', Statut: 'Validé' } }];
  const r = executer(chargerCode(WF1, 'Regrouper et comparer'),
    { input: normaliser(ticketsJira()), noeuds: { 'Lire les candidats existants': existants } });
  const erp = r.find((g) => g.signature === 'ERP-PROD | software');
  assert.equal(erp.recordId, 'recX');
  assert.equal(erp.statutExistant, 'Validé');
});
