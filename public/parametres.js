async function loadParametres() {
  try {
    const res = await fetch('/api/parametres');
    const data = await res.json();
    const logoEmp = document.getElementById('logoEntreprise');
    const logoSite = document.getElementById('logoSite');
    const siege = document.getElementById('siegeSocial');
    const tel = document.getElementById('telephoneSite');

    if (data.logo_entreprise) {
      logoEmp.src = data.logo_entreprise;
      logoEmp.style.display = 'inline-block';
    }
    if (data.logo_site) {
      logoSite.src = data.logo_site;
      logoSite.style.display = 'inline-block';
    }
    siege.textContent = '📍 ' + (data.siege_social || '');
    tel.textContent = '📞 ' + (data.telephone || '');
  } catch (err) {
    console.error('Erreur paramètres:', err);
  }
}
