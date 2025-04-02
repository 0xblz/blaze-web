function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  element.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    e.preventDefault();
    // Bring element to front when dragging
    element.style.zIndex = '1000';
    
    // Get mouse position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mousemove', elementDrag);
    document.addEventListener('mouseup', closeDragElement);
  }

  function elementDrag(e) {
    e.preventDefault();
    // Calculate new position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    // Remove any transform property that might interfere
    element.style.transform = 'none';
    
    // Set element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // Reset z-index
    element.style.zIndex = element.classList.contains('dialog') ? '100' : '50';
    document.removeEventListener('mousemove', elementDrag);
    document.removeEventListener('mouseup', closeDragElement);
  }
}

// Initialize draggable elements when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Make dialog draggable
  const dialog = document.querySelector('.dialog');
  if (dialog) {
    // Set initial position if not already set
    if (!dialog.style.top) {
      dialog.style.top = '50%';
      dialog.style.left = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
    }
    makeDraggable(dialog);
  }

  // Make shortcuts draggable
  const shortcuts = document.querySelectorAll('.shortcut');
  shortcuts.forEach((shortcut, index) => {
    // Force absolute positioning and clear any transforms
    shortcut.style.position = 'absolute';
    
    // Set initial positions in a grid-like layout
    if (!shortcut.style.top) {
      const row = Math.floor(index / 3); // 3 shortcuts per row
      const col = index % 3;
      shortcut.style.top = `${20 + (row * 120)}px`;
      shortcut.style.left = `${20 + (col * 120)}px`;
      shortcut.style.transform = 'none';
    }
    makeDraggable(shortcut);
  });
}); 