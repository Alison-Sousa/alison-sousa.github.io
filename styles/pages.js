document.addEventListener("DOMContentLoaded", function() {
    // Seleciona todos os links de navegação
    const navLinks = document.querySelectorAll('.nav-item .nav-link');
  
    // Função para carregar conteúdo das abas
    const loadContent = (id) => {
      // Constrói o caminho do arquivo baseado no id
      const filePath = id + ".html";
      fetch(filePath)
        .then(response => response.text())
        .then(html => {
          // Seleciona a seção de conteúdo baseada no id e injeta o HTML
          document.getElementById(id + 'Content').innerHTML = html;
          document.getElementById(id + 'Content').style.display = 'block';
        })
        .catch(error => console.error('Error loading content:', error));
    };
  
    // Função para manipular clique na aba
    const handleTabClick = (event) => {
      event.preventDefault(); // Prevenir o comportamento padrão do link
      const clickedTabId = event.target.id;
  
      // Esconde todas as seções de conteúdo e remove a classe 'active'
      document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
      navLinks.forEach(link => link.parentElement.classList.remove('active'));
  
      // Adiciona 'active' ao item clicado da navegação
      event.target.parentElement.classList.add('active');
  
      // Carrega o conteúdo para a aba selecionada
      loadContent(clickedTabId);
    };
  
    // Adiciona evento de clique a cada link da navegação
    navLinks.forEach(link => {
      link.addEventListener('click', handleTabClick);
    });
  });
  