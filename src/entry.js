import './style.css';

const dialog = document.getElementById('qualityDialog');
const status = document.getElementById('qualityStatus');
const options = [...dialog.querySelectorAll('[data-quality]')];

dialog.addEventListener('cancel', event => event.preventDefault());
dialog.showModal();

for (const option of options) {
  option.addEventListener('click', async () => {
    const quality = option.dataset.quality;
    options.forEach(button => { button.disabled = true; });
    status.textContent = 'Preparando la visita…';
    document.body.setAttribute('aria-busy', 'true');
    window.graphicsQuality = quality;
    try {
      await import('./main.js');
      dialog.close();
      document.body.removeAttribute('aria-busy');
    } catch (error) {
      console.error('No se pudo iniciar la visita 3D.', error);
      status.textContent = 'No se pudo cargar la visita. Recarga la página para intentarlo de nuevo.';
      options.forEach(button => { button.disabled = false; });
      document.body.removeAttribute('aria-busy');
    }
  });
}
