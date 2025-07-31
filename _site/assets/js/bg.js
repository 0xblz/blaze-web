function generateSplitComplementaryColors() {
    // Generate a random base hue (0-360)
    const baseHue = Math.floor(Math.random() * 360);
    
    // Convert to HSL with saturation and lightness adjusted for dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saturation = prefersDarkMode ? 20 : 25;
    const lightness = prefersDarkMode ? 20 : 45;
    
    // Filter effects to mimic CSS filter
    const hueRotate = prefersDarkMode ? 0 : 0;         // hue-rotate(90deg)
    const brightness = prefersDarkMode ? 1 : 1.3;    // brightness(1.2)
    const contrast = prefersDarkMode ? 0.5 : 0.8;      // contrast(0.8)
    const shouldInvert = prefersDarkMode ? false : true; // invert(1)

    // Calculate split-complementary colors (base + complement ± 30°)
    const hue1 = (baseHue + hueRotate) % 360;                    // Primary color
    const hue2 = (baseHue + 45 + hueRotate) % 360;             // Complementary color
    const hue3 = (baseHue + 90 + hueRotate) % 360;             // Split-complementary (-30° from complement)
    
    // Apply brightness and contrast to lightness
    let adjustedLightness = lightness * brightness;
    adjustedLightness = 50 + (adjustedLightness - 50) * contrast; // Apply contrast around midpoint
    adjustedLightness = Math.min(100, Math.max(0, adjustedLightness)); // Clamp to 0-100
    
    // Apply invert
    const finalLightness = shouldInvert ? 100 - adjustedLightness : adjustedLightness;
    
    // Convert HSL to hex - create 3 split-complementary colors + 1 dark
    const color1 = hslToHex(hue1, saturation, finalLightness);                    // Primary color
    const color2 = hslToHex(hue2, saturation, finalLightness);                    // Complementary color
    const color3 = hslToHex(hue3, saturation, finalLightness);                    // Split-complementary color
    const color4 = hslToHex(hue1, saturation, Math.max(10, finalLightness * 0.4)); // Dark version of primary

    // Generate random positions for the pseudo-elements with moderate movement
    const beforeTop = Math.random() * 50 - 25; // -25% to 25%
    const beforeLeft = Math.random() * 80 - 40; // -40% to 40%
    const afterBottom = Math.random() * 50 - 25; // -25% to 25%
    const afterRight = Math.random() * 80 - 40; // -40% to 40%
    
    // Generate random rotation angles
    const beforeRotation = Math.random() * 360; // 0-360 degrees
    const afterRotation = Math.random() * 360; // 0-360 degrees

    // Update CSS variables
    document.documentElement.style.setProperty('--primary-color', color1);
    document.documentElement.style.setProperty('--secondary-color', color2);
    document.documentElement.style.setProperty('--tertiary-color', color3);
    document.documentElement.style.setProperty('--quaternary-color', color4);
    
    // Update position variables
    document.documentElement.style.setProperty('--before-top', `${beforeTop}%`);
    document.documentElement.style.setProperty('--before-left', `${beforeLeft}%`);
    document.documentElement.style.setProperty('--after-bottom', `${afterBottom}%`);
    document.documentElement.style.setProperty('--after-right', `${afterRight}%`);
    
    // Update rotation variables
    document.documentElement.style.setProperty('--before-rotation', `${beforeRotation}deg`);
    document.documentElement.style.setProperty('--after-rotation', `${afterRotation}deg`);
}





// Ripple distortion system
class RippleDistortion {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.ripples = [];
        this.animationId = null;
        this.setupCanvas();
    }

    setupCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'ripple-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 1001;
            mix-blend-mode: difference;
            opacity: 0.8;
        `;
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Start animation loop
        this.animate();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    addRipple(x, y) {
        const ripple = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 400,
            speed: 2.5,
            opacity: 1,
            life: 0,
            maxLife: 280,
            frequency: 0.02,
            amplitude: 20
        };
        
        this.ripples.push(ripple);
    }

    updateRipples() {
        this.ripples = this.ripples.filter(ripple => {
            ripple.life += 1;
            ripple.radius += ripple.speed;
            
            // Smooth single-curve fade out
            const progress = ripple.life / ripple.maxLife;
            
            // Single smooth exponential decay curve
            ripple.opacity = Math.pow(1 - progress, 2.5);
            
            ripple.opacity = Math.max(0, ripple.opacity);
            
            // Only remove when opacity is truly near zero
            return ripple.opacity > 0.001;
        });
    }

    drawRipples() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ripples.forEach(ripple => {
            this.ctx.save();
            
            // Create smoother gradient for the ripple
            const gradient = this.ctx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius
            );
            
            const baseOpacity = ripple.opacity;
            
            // Much smoother gradient stops
            gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${baseOpacity * 0.1})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${baseOpacity * 0.3})`);
            gradient.addColorStop(0.7, `rgba(255, 255, 255, ${baseOpacity * 0.5})`);
            gradient.addColorStop(0.85, `rgba(255, 255, 255, ${baseOpacity * 0.3})`);
            gradient.addColorStop(0.95, `rgba(255, 255, 255, ${baseOpacity * 0.1})`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
            
            // Draw main ripple with smoother distortion effect
            this.ctx.beginPath();
            this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Draw fewer, more consistent concentric circles
            for (let i = 0; i < 2; i++) {
                const waveRadius = ripple.radius + (i * 20);
                const waveOpacity = baseOpacity * (0.4 - i * 0.2);
                
                if (waveOpacity > 0.01) {
                    this.ctx.beginPath();
                    this.ctx.arc(ripple.x, ripple.y, waveRadius, 0, Math.PI * 2);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${waveOpacity})`;
                    this.ctx.lineWidth = 1.5 - i * 0.3;
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        });
    }

    animate() {
        this.updateRipples();
        this.drawRipples();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Global ripple distortion instance
let rippleDistortion = null;

function createRippleEffect(x, y) {
    // Add ripple to the distortion system
    if (rippleDistortion) {
        rippleDistortion.addRipple(x, y);
    }
    
    // Keep the original simple ripple as a backup/enhancement
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border: 2px solid rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        z-index: 998;
        transform: translate(-50%, -50%);
        animation: rippleExpand 3s ease-out forwards;
        mix-blend-mode: difference;
    `;
    
    document.body.appendChild(ripple);
    
    // Remove ripple when animation actually completes
    ripple.addEventListener('animationend', () => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    });
    
    // Fallback timeout in case animation event doesn't fire
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 3500);
}

function createStarAnimation(x, y) {
    // Create star element
    const star = document.createElement('div');
    star.innerHTML = '<i class="fa-regular fa-circle"></i>';
    star.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: 1rem;
        color: white;
        pointer-events: none;
        z-index: 1000;
        transform: translate(-50%, -50%);
        animation: starFloat 0.5s ease-out forwards;
    `;
    
    document.body.appendChild(star);
    
    // Remove star after animation
    setTimeout(() => {
        if (star.parentNode) {
            star.parentNode.removeChild(star);
        }
    }, 1500);
}

function handleClick(event) {
    // Regenerate colors and positions
    generateSplitComplementaryColors();

    // Use viewport coordinates for fixed-positioned elements
    const x = event.clientX;
    const y = event.clientY;

    // Create ripple effect at cursor position
    createRippleEffect(x, y);

    // Create star animation at click position
    createStarAnimation(x, y);
}



function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate colors when the page loads
document.addEventListener('DOMContentLoaded', () => {
    generateSplitComplementaryColors();
    
    // Initialize ripple distortion system
    rippleDistortion = new RippleDistortion();

    // Add event listeners
    document.addEventListener('click', handleClick);

    // Add CSS animation for star and enhanced ripple
    const style = document.createElement('style');
    style.textContent = `
        @keyframes starFloat {
            0% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(0.5);
            }
            50% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.2);
            }
            90% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0);
            }
        }
        
        @keyframes rippleExpand {
            0% {
                width: 0;
                height: 0;
                opacity: 1;
                border-width: 2px;
            }
            30% {
                opacity: 0.8;
                border-width: 1.5px;
            }
            60% {
                opacity: 0.5;
                border-width: 1px;
            }
            80% {
                opacity: 0.2;
                border-width: 0.7px;
            }
            95% {
                opacity: 0.05;
                border-width: 0.5px;
            }
            100% {
                width: 400px;
                height: 400px;
                opacity: 0;
                border-width: 0.3px;
            }
        }
    `;
    document.head.appendChild(style);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (rippleDistortion) {
        rippleDistortion.destroy();
    }
});
