const fonts = [
  "Bebas Neue", "Oswald", "Inter", "Anton", "Syncopate", 
  "Montserrat", "Roboto Condensed", "Audiowide", "Black Ops One", "Bungee", 
  "Changa", "Exo 2", "Faster One", "Graduate", "Knewave", 
  "Monoton", "Orbitron", "Permanent Marker", "Play", "Press Start 2P", 
  "Quantico", "Racing Sans One", "Righteous", "Russo One", "Saira Stencil One", 
  "Squada One", "Teko", "Wallpoet", "Zilla Slab Highlight", "Alfa Slab One"
];

const loadFonts = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  
  // Format for Google Fonts API: family=Font+Name&family=Another+Font&display=swap
  const families = fonts.map(f => `family=${f.replace(/ /g, '+')}`).join('&');
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  
  document.head.appendChild(link);
};

const initPlayground = () => {
  loadFonts();

  const fontSelect = document.getElementById('font-select');
  const layoutSelect = document.getElementById('layout-select');
  const textContainer = document.getElementById('text-container');
  const themeButtons = document.querySelectorAll('.pg-theme-toggles button');

  // Populate Font Select
  fonts.forEach((font, index) => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = `${index + 1}. ${font}`;
    fontSelect.appendChild(option);
  });

  // Handle Font Change
  fontSelect.addEventListener('change', (e) => {
    textContainer.style.fontFamily = `"${e.target.value}", sans-serif`;
  });

  // Set initial font
  textContainer.style.fontFamily = `"${fonts[0]}", sans-serif`;

  // Handle Layout Change
  layoutSelect.addEventListener('change', (e) => {
    // Remove all style-* classes
    textContainer.className = textContainer.className.replace(/style-\d+/g, '');
    // Add new layout class
    textContainer.classList.add(e.target.value);
  });

  // Handle Theme Change
  themeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active button state
      themeButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      // Update container theme class
      const theme = e.target.getAttribute('data-theme');
      textContainer.classList.remove('red-white', 'all-white', 'all-red');
      textContainer.classList.add(theme);
    });
  });
};

document.addEventListener('DOMContentLoaded', initPlayground);
