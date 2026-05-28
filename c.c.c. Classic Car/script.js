const baseImage = document.querySelector('[data-base-image]');

if (baseImage) {
  baseImage.addEventListener('error', () => {
    baseImage.classList.add('is-missing');
  });
}
