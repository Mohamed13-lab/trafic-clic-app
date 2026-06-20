const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('🚀 Trafic Clic - Serveur fonctionne !');
});

app.listen(port, () => {
  console.log('✅ Serveur démarré sur le port ' + port);
});
