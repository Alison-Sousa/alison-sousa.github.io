document.addEventListener("DOMContentLoaded", function() {
    // Selects all navigation links
    const navLinks = document.querySelectorAll('.nav-item .nav-link');
  
    // Function to load tab content
    const loadContent = (id) => {
      // Constructs the file path based on the id
      const filePath = id + ".html";
      fetch(filePath)
        .then(response => response.text())
        .then(html => {
          // Selects the content section based on the id and injects the HTML
          document.getElementById(id + 'Content').innerHTML = html;
          document.getElementById(id + 'Content').style.display = 'block';
        })
        .catch(error => console.error('Error loading content:', error));
    };
  
    // Function to handle tab click
    const handleTabClick = (event) => {
      event.preventDefault(); // Prevents the default behavior of the link
      const clickedTabId = event.target.id;
  
      // Hides all content sections and removes the 'active' class
      document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
      navLinks.forEach(link => link.parentElement.classList.remove('active'));
  
      // Adds 'active' to the clicked navigation item
      event.target.parentElement.classList.add('active');
  
      // Loads content for the selected tab
      loadContent(clickedTabId);
    };
  
    // Adds click event to each navigation link
    navLinks.forEach(link => {
      link.addEventListener('click', handleTabClick);
    });
  });
  
