document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.querySelector('.fa-circle-half-stroke').parentElement;
    const body = document.body;
    
    // Check if there's a saved preference
    const isSimpleMode = localStorage.getItem('simpleMode') === 'true';
    if (isSimpleMode) {
        body.classList.add('simple-mode');
    }

    themeToggle.addEventListener('click', () => {
        // Fade out
        body.style.opacity = '0';
        
        setTimeout(() => {
            body.classList.toggle('simple-mode');
            // Save preference
            localStorage.setItem('simpleMode', body.classList.contains('simple-mode'));
            
            // Fade back in
            body.style.opacity = '1';
        }, 300);
    });
}); 