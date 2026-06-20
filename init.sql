CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attente (
  id SERIAL PRIMARY KEY,
  client_id INTEGER,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  depart TEXT NOT NULL,
  arrivee TEXT NOT NULL,
  nb_places INTEGER DEFAULT 1,
  heure_debut TEXT NOT NULL,
  date_souhaitee TEXT NOT NULL,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trajets (
  id SERIAL PRIMARY KEY,
  chauffeur_id INTEGER,
  depart TEXT,
  arrivee TEXT,
  date_depart TIMESTAMP,
  tarif_par_place INTEGER,
  places_total INTEGER,
  places_restantes INTEGER,
  statut TEXT,
  ramassage INTEGER DEFAULT 0,
  caution INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS publicites (
  id SERIAL PRIMARY KEY,
  emplacement TEXT NOT NULL,
  image_url TEXT,
  date_debut DATE,
  date_fin DATE,
  actif INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS regles (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  contenu TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS paiements (
  id SERIAL PRIMARY KEY,
  client_id INTEGER,
  trajet_id INTEGER,
  montant_total INTEGER,
  statut TEXT,
  rembourse INTEGER DEFAULT 0,
  caution INTEGER DEFAULT 0,
  caution_bloquee INTEGER DEFAULT 0,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chauffeurs (
  id SERIAL PRIMARY KEY,
  identifiant TEXT,
  telephone TEXT,
  bloque_until TIMESTAMP,
  annulations_consecutives INTEGER DEFAULT 0,
  nb_suspensions INTEGER DEFAULT 0
);
