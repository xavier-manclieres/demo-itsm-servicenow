// Business Rule ServiceNow
// Table : incident | Quand : après (asynchrone) | Condition : état = Résolu ET priorité = 1
// Le jeton ci-dessous est un exemple : le renseigner dans l'instance, jamais dans ce dépôt.
(function executeRule(current, previous) {
  var r = new sn_ws.RESTMessageV2();
  r.setEndpoint('https://TON-N8N/webhook/rex-incident');
  r.setHttpMethod('post');
  r.setRequestHeader('Content-Type', 'application/json');
  r.setRequestHeader('X-Demo-Token', 'A-CHANGER');
  r.setRequestBody(JSON.stringify({
    sys_id: current.getUniqueValue(),
    number: current.getValue('number')
  }));
  r.executeAsync();
})(current, previous);
