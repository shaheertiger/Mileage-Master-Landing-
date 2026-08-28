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
  const families = fonts.map(f => `family=${f.replace(/ /g, '+')}`).join('&');
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
};

export const initTweakner = () => {
  // Load fonts globally
  loadFonts();

  // Create UI Panel
  const panel = document.createElement('div');
  panel.id = 'tweakner-panel';
  panel.innerHTML = `
    <div class="header">
      <h3>Design Tweakner</h3>
      <p>Drag me around! Adjust text styles live.</p>
    </div>
    <div class="tweakner-group">
      <label for="tw-font-select">Typography (30 Fonts)</label>
      <select id="tw-font-select"></select>
    </div>
    <div class="tweakner-group">
      <label for="tw-layout-select">Layout Style (20 Styles)</label>
      <select id="tw-layout-select">
        <option value="style-1">1. Cinematic Wide</option>
        <option value="style-2">2. The Grid Split</option>
        <option value="style-3">3. Staggered Step</option>
        <option value="style-4">4. Brutalist Block</option>
        <option value="style-5">5. The Overlap Outline</option>
        <option value="style-6">6. Horizontal Interlock</option>
        <option value="style-7">7. Symmetrical Stack</option>
        <option value="style-8">8. Floating Mesh</option>
        <option value="style-9">9. Diagonal Shift</option>
        <option value="style-10">10. Compressed Cinematic</option>
        <option value="style-11">11. Mega Hero Stack</option>
        <option value="style-12">12. Split Justified</option>
        <option value="style-13">13. Frame Boxed</option>
        <option value="style-14">14. Echo Overlay</option>
        <option value="style-15">15. Tight Column</option>
        <option value="style-16">16. Magazine Editorial</option>
        <option value="style-17">17. Circle Arc</option>
        <option value="style-18">18. Glitch Shift</option>
        <option value="style-19">19. Perspective</option>
        <option value="style-20">20. Minimalist Inline</option>
      </select>
    </div>
    <div class="tweakner-group">
      <label>Color Theme</label>
      <div class="tweakner-theme-toggles">
        <button data-theme="red-white" class="active">Red & White</button>
        <button data-theme="all-white">All White</button>
        <button data-theme="all-red">All Red</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const fontSelect = document.getElementById('tw-font-select');
  const layoutSelect = document.getElementById('tw-layout-select');
  const textContainer = document.querySelector('.tweakner-target');
  const themeButtons = document.querySelectorAll('.tweakner-theme-toggles button');

  // Populate Fonts
  fonts.forEach((font, index) => {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = `${index + 1}. ${font}`;
    fontSelect.appendChild(option);
  });

  // Handle Logic
  fontSelect.addEventListener('change', (e) => {
    textContainer.style.fontFamily = `"${e.target.value}", sans-serif`;
  });
  textContainer.style.fontFamily = `"${fonts[0]}", sans-serif`; // default

  layoutSelect.addEventListener('change', (e) => {
    textContainer.className = textContainer.className.replace(/style-\d+/g, '');
    textContainer.classList.add(e.target.value);
  });
  textContainer.classList.add('style-1'); // default layout

  themeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      themeButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const theme = e.target.getAttribute('data-theme');
      textContainer.classList.remove('red-white', 'all-white', 'all-red');
      textContainer.classList.add(theme);
    });
  });

  // Drag Logic
  const header = panel.querySelector('.header');
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.left = `${initialLeft}px`;
    panel.style.top = `${initialTop}px`;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    panel.style.left = `${initialLeft + dx}px`;
    panel.style.top = `${initialTop + dy}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
};
