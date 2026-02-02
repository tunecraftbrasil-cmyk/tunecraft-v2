// ==========================================
// MOBILE MENU TOGGLE
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');

  // Toggle menu quando clica no hamburger
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      mobileMenuToggle.textContent = sidebar.classList.contains('open') ? '✕' : '☰';
    });
  }

  // Fechar menu quando clica num item do menu
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', function() {
      // Se em mobile, fecha o menu após clicar
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        if (mobileMenuToggle) {
          mobileMenuToggle.textContent = '☰';
        }
      }
    });
  });

  // Fechar menu ao redimensionar para desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('open');
      if (mobileMenuToggle) {
        mobileMenuToggle.textContent = '☰';
      }
    }
  });

  // Fechar menu ao clicar fora (mobile)
  if (window.innerWidth <= 768) {
    document.addEventListener('click', function(event) {
      const isClickInsideSidebar = sidebar.contains(event.target);
      const isClickInsideToggle = mobileMenuToggle && mobileMenuToggle.contains(event.target);

      if (!isClickInsideSidebar && !isClickInsideToggle && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (mobileMenuToggle) {
          mobileMenuToggle.textContent = '☰';
        }
      }
    });
  }
});
