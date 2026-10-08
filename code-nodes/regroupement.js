// Logique du nœud Code de WF1 : regroupe les incidents par CI + catégorie
// et garde les groupes d'au moins `seuil` incidents.
// Dans n8n, coller le corps de la fonction ; ici elle est exportée pour être testée.

function regrouper(incidents, seuil = 3) {
  const groupes = {};
  for (const i of incidents) {
    if (!i.cmdb_ci) continue;
    const cle = `${i.cmdb_ci} | ${i.category}`;
    (groupes[cle] ||= []).push(i);
  }
  return Object.entries(groupes)
    .filter(([, l]) => l.length >= seuil)
    .map(([signature, l]) => ({
      signature,
      ci: l[0].cmdb_ci,
      categorie: l[0].category,
      nb: l.length,
      incidents: l.map((i) => i.number).join(', '),
      ids: l.map((i) => i.sys_id).join(','),
      descriptions: l.map((i) => `${i.number} : ${i.short_description}`).join('\n'),
    }));
}

module.exports = { regrouper };
