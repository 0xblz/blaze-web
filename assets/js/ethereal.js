class GlitchEffect {
    constructor(element) {
        this.element = element;
        this.originalText = element.textContent;
        this.glitchChars = '!<>-_\\/[]{}—=+*^?#________';
        this.interval = null;
        // Get the CSS variables
        this.primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        this.secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--quaternary-color').trim();
        this.init();
    }

    init() {
        // Store original text
        this.element.dataset.text = this.originalText;
        
        // Start glitch loop
        this.interval = setInterval(() => this.glitch(), 200);

        // Add color shift
        this.colorShift();
    }

    glitch() {
        if (Math.random() < 0.1) {
            let glitchedText = '';
            const numGlitchChars = Math.floor(Math.random() * 3) + 1;
            const position = Math.floor(Math.random() * this.originalText.length);
            
            for (let i = 0; i < this.originalText.length; i++) {
                if (i >= position && i < position + numGlitchChars) {
                    glitchedText += this.glitchChars[Math.floor(Math.random() * this.glitchChars.length)];
                } else {
                    glitchedText += this.originalText[i];
                }
            }
            
            this.element.textContent = glitchedText;
            
            setTimeout(() => {
                this.element.textContent = this.originalText;
            }, 50);
        }
    }

    colorShift() {
        // Get RGB values from the CSS variables
        const primaryRGB = this.primaryColor.match(/\d+/g);
        const secondaryRGB = this.secondaryColor.match(/\d+/g);
        
        // Convert to rgba with opacity
        const color = Math.random() < 0.5 
            ? `rgba(${primaryRGB[0]}, ${primaryRGB[1]}, ${primaryRGB[2]}, 0.6)`
            : `rgba(${secondaryRGB[0]}, ${secondaryRGB[1]}, ${secondaryRGB[2]}, 0.6)`;
            
        this.element.style.textShadow = `0 0 0.5rem ${color}`;
        requestAnimationFrame(() => this.colorShift());
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.element.style.textShadow = '';
        this.element.textContent = this.originalText;
    }
}

// Initialize glitch effects when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize glitch effect for all elements with the class
    const glitchElements = document.querySelectorAll('.glitch-effect');
    glitchElements.forEach(element => {
        new GlitchEffect(element);
    });
});