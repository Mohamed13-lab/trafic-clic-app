const jwt = require('jsonwebtoken');
const SECRET = 'secret_trafic_clic';

function authenticateChauffeur(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès refusé' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide' });
  }
}

module.exports = { authenticateChauffeur };
