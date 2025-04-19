document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const moonIcon = document.querySelector('.theme-toggle-icon');
    const startupSound = new Audio('/assets/audio/startup.mp3');
    startupSound.volume = 0.05;
    
    // Check for saved theme preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    themeToggle.checked = darkMode;
    if (darkMode) {
        body.classList.add('dark-mode');
        moonIcon.style.display = 'inline-block';
    } else {
        moonIcon.style.display = 'none';
    }
    
    themeToggle.addEventListener('change', function() {
        startupSound.currentTime = 0; // Reset audio to start
        startupSound.play();
        
        body.style.transition = 'opacity 0.5s ease-in-out';
        body.style.opacity = '0';
        
        setTimeout(() => {
            if (this.checked) {
                body.classList.add('dark-mode');
                moonIcon.style.display = 'inline-block';
                localStorage.setItem('darkMode', 'true');
            } else {
                body.classList.remove('dark-mode');
                moonIcon.style.display = 'none';
                localStorage.setItem('darkMode', 'false');
            }
            
            body.style.opacity = '1';
            
            // Clean up transition after it's done
            setTimeout(() => {
                body.style.transition = '';
            }, 300);
        }, 300);
    });
}); 