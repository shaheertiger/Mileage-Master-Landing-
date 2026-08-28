/* ============================================================
   MILEAGE MASTER — ENGINE COMPARISON SEQUENCE
   Pointer Events logic for Before/After Slider | comparison.js
   ============================================================ */

export const initComparisonScene = () => {
  const container = document.getElementById('comp-slider');
  const handle = document.getElementById('comp-handle');
  
  if (!container || !handle) return;

  let isDragging = false;

  const updatePosition = (clientX) => {
    const rect = container.getBoundingClientRect();
    // Calculate x position relative to the container
    let x = clientX - rect.left;
    
    // Clamp between 0 and width (or constrain slightly so it doesn't get stuck)
    x = Math.max(0, Math.min(x, rect.width));
    
    // Convert to percentage
    const percent = (x / rect.width) * 100;
    
    // Update the CSS variable which drives the clip-path and handle position
    container.style.setProperty('--comp-pos', `${percent}%`);
  };

  const onPointerDown = (e) => {
    isDragging = true;
    handle.style.cursor = 'grabbing';
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  const onPointerUp = () => {
    isDragging = false;
    handle.style.cursor = 'ew-resize';
    document.body.style.userSelect = '';
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  // Attach down event to the handle
  // Attach move/up to the window so the drag doesn't break if mouse leaves handle bounds
  handle.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointermove', onPointerMove);
  
  // Allow clicking anywhere on the container to jump the slider instantly
  container.addEventListener('pointerdown', (e) => {
    if (e.target !== handle && !handle.contains(e.target)) {
      updatePosition(e.clientX);
      onPointerDown(e);
    }
  });
};
