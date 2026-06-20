module.exports = function(app, db) {
  app.post('/api/clients', (req, res) => {
    const { nom, telephone } = req.body;
    if (!nom || !telephone) {
      return res.status(400).json({ error: 'Nom et téléphone requis' });
    }
    db.run('INSERT INTO clients (nom, telephone) VALUES (?, ?)', [nom, telephone], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Ce numéro existe déjà' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, nom, telephone });
    });
  });
};
