const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'trafic.db'));

db.run('PRAGMA foreign_keys = ON');

const init = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS chauffeurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifiant TEXT UNIQUE,
      mot_de_passe TEXT,
      telephone TEXT,
      carte_grise TEXT,
      assurance TEXT,
      permis TEXT,
      photo_chauffeur TEXT,
      photos_vehicule TEXT,
      statut TEXT DEFAULT 'en_attente',
      date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
      plaintes INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS vehicules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chauffeur_id INTEGER REFERENCES chauffeurs(id),
      marque_modele TEXT,
      places INTEGER,
      immatriculation TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT,
      telephone TEXT UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trajets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chauffeur_id INTEGER REFERENCES chauffeurs(id),
      depart TEXT,
      arrivee TEXT,
      date_depart DATETIME,
      tarif_par_place INTEGER,
      places_total INTEGER,
      places_restantes INTEGER,
      caution INTEGER,
      statut TEXT DEFAULT 'actif',
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id),
      trajet_id INTEGER REFERENCES trajets(id),
      nb_places INTEGER,
      montant_total INTEGER,
      statut TEXT DEFAULT 'confirmee',
      date_reservation DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS attente (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id),
      depart TEXT,
      arrivee TEXT,
      type_vehicule TEXT,
      heure_debut TEXT,
      heure_fin TEXT,
      date_souhaitee DATE,
      actif BOOLEAN DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS paiements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER REFERENCES reservations(id),
      montant INTEGER,
      moyen TEXT,
      reference TEXT,
      date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
};

init();
module.exports = db;
