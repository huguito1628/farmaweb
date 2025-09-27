// Función para activar la pestaña
function setActive(tabName) {
  // Quitar la clase 'active' de todas las pestañas
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  // Activar la pestaña correspondiente
  const activeTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (activeTab) activeTab.classList.add("active");
}

// Hacer la función accesible globalmente
window.setActive = setActive;

// Activación automática según la página
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page; // lee data-page del body
  if (page) setActive(page);
});

