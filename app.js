const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Connexion à PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ============================================================
// ROUTE CLIENTS
// ============================================================
app.post('/api/clients', async (req, res) => {
  const { nom, telephone } = req.body;
  if (!nom || !telephone) {
    return res.status(400).json({ error: 'Nom et téléphone requis' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO clients (nom, telephone) VALUES ($1, $2) RETURNING id',
      [nom, telephone]
    );
    res.json({ id: result.rows[0].id, nom, telephone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROUTES LISTE D'ATTENTE
// ============================================================
app.get('/api/attente', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attente ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attente', async (req, res) => {
  const { client_id, nom, telephone, depart, arrivee, nb_places, heure_debut, date_souhaitee } = req.body;
  if (!nom || !telephone || !depart || !arrivee || !nb_places || !heure_debut || !date_souhaitee) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO attente (client_id, nom, telephone, depart, arrivee, nb_places, heure_debut, date_souhaitee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [client_id || null, nom, telephone, depart, arrivee, nb_places, heure_debut, date_souhaitee]
    );
    res.json({ id: result.rows[0].id, message: 'Demande ajoutée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/attente/:id', async (req, res) => {
  const { id } = req.params;
  const { nb_places, heure_debut, date_souhaitee } = req.body;
  if (!nb_places || !heure_debut || !date_souhaitee) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  try {
    await pool.query(
      'UPDATE attente SET nb_places = $1, heure_debut = $2, date_souhaitee = $3 WHERE id = $4',
      [nb_places, heure_debut, date_souhaitee, id]
    );
    res.json({ message: 'Demande modifiée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/attente/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM attente WHERE id = $1', [id]);
    res.json({ message: 'Demande supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Nettoyage automatique des annonces expirées (toutes les minutes)
setInterval(async () => {
  const now = new Date().toISOString();
  try {
    const result = await pool.query(
      "DELETE FROM attente WHERE date_souhaitee || ' ' || heure_debut < $1",
      [now]
    );
    if (result.rowCount > 0) console.log(`🗑️ ${result.rowCount} annonces expirées supprimées`);
  } catch (err) {
    console.error('Erreur nettoyage:', err.message);
  }
}, 60000);

// ============================================================
// ROUTES TRAJETS
// ============================================================
app.get('/api/trajets', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trajets WHERE statut = 'actif' AND places_restantes > 0 ORDER BY date_depart ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trajets/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trajets ORDER BY date_depart DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trajets', async (req, res) => {
  const { chauffeur_id, depart, arrivee, date_depart, tarif_par_place, places_total, places_restantes, statut, ramassage, caution } = req.body;
  if (!chauffeur_id || !depart || !arrivee || !date_depart || !tarif_par_place || !places_total) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO trajets (chauffeur_id, depart, arrivee, date_depart, tarif_par_place, places_total, places_restantes, statut, ramassage, caution)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [chauffeur_id, depart, arrivee, date_depart, tarif_par_place, places_total, places_restantes || places_total, statut || 'actif', ramassage || 0, caution || 0]
    );
    res.json({ id: result.rows[0].id, message: 'Trajet créé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trajets/:id/depart', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE trajets SET statut = $1 WHERE id = $2', ['en_cours', id]);
    res.json({ message: 'Trajet démarré' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trajets/:id/arrive', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE trajets SET statut = $1 WHERE id = $2', ['termine', id]);
    res.json({ message: 'Trajet terminé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trajets/:id/decaler', async (req, res) => {
  const { id } = req.params;
  const { date_depart, depart, ramassage } = req.body;
  try {
    let query = 'UPDATE trajets SET date_depart = $1, statut = $2';
    const params = [date_depart, 'reporte'];
    if (depart) { query += ', depart = $' + (params.length + 1); params.push(depart); }
    if (ramassage !== undefined) { query += ', ramassage = $' + (params.length + 1); params.push(ramassage); }
    query += ' WHERE id = $' + (params.length + 1);
    params.push(id);
    await pool.query(query, params);
    res.json({ message: 'Trajet décalé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trajets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE trajets SET statut = $1 WHERE id = $2', ['annule', id]);
    res.json({ message: 'Trajet annulé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROUTES CHAUFFEURS
// ============================================================
app.get('/api/chauffeurs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chauffeurs ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chauffeur/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM chauffeurs WHERE id = $1', [id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/chauffeur/:id/suspendre', async (req, res) => {
  const { id } = req.params;
  const { bloque_until } = req.body;
  try {
    await pool.query(
      'UPDATE chauffeurs SET bloque_until = $1, nb_suspensions = nb_suspensions + 1 WHERE id = $2',
      [bloque_until, id]
    );
    res.json({ message: 'Chauffeur suspendu' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/chauffeur/:id/activer', async (req, res) => {
  const { id } = req.params;
  const { bloque_until, annulations_consecutives } = req.body;
  try {
    await pool.query(
      'UPDATE chauffeurs SET bloque_until = $1, annulations_consecutives = $2 WHERE id = $3',
      [bloque_until || null, annulations_consecutives || 0, id]
    );
    res.json({ message: 'Chauffeur activé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/chauffeur/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM chauffeurs WHERE id = $1', [id]);
    res.json({ message: 'Chauffeur supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROUTES PUBLICITÉS
// ============================================================
app.get('/api/admin/publicites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM publicites ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/publicites', async (req, res) => {
  const { emplacement, image_url, date_debut, date_fin } = req.body;
  if (!emplacement || !image_url) {
    return res.status(400).json({ error: 'Emplacement et image requis' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO publicites (emplacement, image_url, date_debut, date_fin, actif)
       VALUES ($1, $2, $3, $4, 1) RETURNING id`,
      [emplacement, image_url, date_debut || null, date_fin || null]
    );
    res.json({ id: result.rows[0].id, message: 'Publicité ajoutée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/publicites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM publicites WHERE id = $1', [id]);
    res.json({ message: 'Publicité supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/publicites/cleanup', async (req, res) => {
  const now = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      'UPDATE publicites SET actif = 0 WHERE date_fin < $1 AND date_fin IS NOT NULL',
      [now]
    );
    res.json({ cleaned: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROUTES RÈGLES
// ============================================================
app.get('/api/regles', async (req, res) => {
  const { type } = req.query;
  if (!type || (type !== 'client' && type !== 'chauffeur')) {
    return res.status(400).json({ error: 'Type requis (client ou chauffeur)' });
  }
  try {
    const result = await pool.query('SELECT contenu FROM regles WHERE type = $1', [type]);
    if (result.rows.length === 0) {
      const defaut = type === 'client'
        ? '• Recherchez un trajet selon vos besoins.\n• Réservez en quelques clics.\n• Payez en ligne ou en espèces.\n• Annulation gratuite jusqu\'à 24h avant le départ.'
        : '• Publiez vos trajets gratuitement.\n• Gérez vos réservations en temps réel.\n• Recevez vos paiements en toute sécurité.\n• Annulation possible jusqu\'à 7h avant le départ.';
      await pool.query('INSERT INTO regles (type, contenu) VALUES ($1, $2)', [type, defaut]);
      res.json({ contenu: defaut });
    } else {
      res.json({ contenu: result.rows[0].contenu });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/regles', async (req, res) => {
  const { type, contenu } = req.body;
  if (!type || (type !== 'client' && type !== 'chauffeur')) {
    return res.status(400).json({ error: 'Type requis (client ou chauffeur)' });
  }
  if (!contenu || contenu.trim() === '') {
    return res.status(400).json({ error: 'Le contenu ne peut pas être vide' });
  }
  try {
    const result = await pool.query(
      'UPDATE regles SET contenu = $1 WHERE type = $2',
      [contenu, type]
    );
    if (result.rowCount === 0) {
      await pool.query('INSERT INTO regles (type, contenu) VALUES ($1, $2)', [type, contenu]);
    }
    res.json({ message: '✅ Règles mises à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ROUTES PAIEMENTS
// ============================================================
app.get('/api/admin/paiements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM paiements ORDER BY date_creation DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/paiements/:id/annuler', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE paiements SET statut = $1, rembourse = $2 WHERE id = $3',
      ['annule', 1, id]
    );
    res.json({ message: 'Paiement annulé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SERVEUR
// ============================================================
app.listen(port, () => {
  console.log('✅ Serveur démarré sur le port ' + port);
});
