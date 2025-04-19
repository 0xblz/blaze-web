document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const moonIcon = document.querySelector('.theme-toggle-icon');
    
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
        if (this.checked) {
            body.classList.add('dark-mode');
            moonIcon.style.display = 'inline-block';
            localStorage.setItem('darkMode', 'true');
        } else {
            body.classList.remove('dark-mode');
            moonIcon.style.display = 'none';
            localStorage.setItem('darkMode', 'false');
        }
    });
}); 