function generateSplitComplementaryColors() {
    // Generate a random base hue (0-360)
    const baseHue = Math.floor(Math.random() * 360);
    
    // Convert to HSL with saturation and lightness adjusted for dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saturation = prefersDarkMode ? 30 : 25;
    const lightness = prefersDarkMode ? 30 : 40;
    
    // Filter effects to mimic CSS filter
    const hueRotate = prefersDarkMode ? 0 : 0;         // hue-rotate(90deg)
    const brightness = prefersDarkMode ? 1 : 1.2;    // brightness(1.2)
    const contrast = prefersDarkMode ? 0.8 : 0.8;      // contrast(0.8)
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
}

function createCrossSectionGrid() {
    // Get actual document height for Chrome compatibility
    const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
    
    // Create vertical line
    const verticalLine = document.createElement('div');
    verticalLine.id = 'vertical-line';
    verticalLine.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 1px;
        height: ${docHeight}px;
        background: rgba(255, 255, 255, 0.1);
        pointer-events: none;
        z-index: 999;
    `;
    
    // Create horizontal line
    const horizontalLine = document.createElement('div');
    horizontalLine.id = 'horizontal-line';
    horizontalLine.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        pointer-events: none;
        z-index: 999;
    `;
    
    // Create center dot
    const centerDot = document.createElement('div');
    centerDot.id = 'center-dot';
    centerDot.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        transform: translate(-50%, -50%);
    `;
    
    document.body.appendChild(verticalLine);
    document.body.appendChild(horizontalLine);
    document.body.appendChild(centerDot);
    
    return { verticalLine, horizontalLine, centerDot };
}

function updateCrossSectionGrid(x, y) {
    const verticalLine = document.getElementById('vertical-line');
    const horizontalLine = document.getElementById('horizontal-line');
    const centerDot = document.getElementById('center-dot');
    
    if (verticalLine && horizontalLine && centerDot) {
        // Use the same coordinates for everything
        verticalLine.style.left = `${x}px`;
        horizontalLine.style.top = `${y}px`;
        centerDot.style.left = `${x}px`;
        centerDot.style.top = `${y}px`;
        
        // Chrome-specific fix: ensure lines are visible when scrolling
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        if (isChrome) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            
            // Adjust vertical line height dynamically for Chrome
            if (verticalLine.style.height !== '100vh') {
                const newHeight = Math.max(windowHeight, document.documentElement.scrollHeight);
                verticalLine.style.height = `${newHeight}px`;
            }
        }
    }
}

function createRippleEffect(x, y) {
    // Create ripple element
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 998;
        transform: translate(-50%, -50%);
        animation: rippleExpand 1s ease-out forwards;
    `;
    
    document.body.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 1000);
}

function createStarAnimation(x, y) {
    // Create star element
    const star = document.createElement('div');
    star.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i>';
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

    // Use the same coordinate calculation as the cross-section grid
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

    let x, y;
    if (isChrome) {
        // Adjust for Chrome's scroll behavior (same as cross-section grid)
        x = event.clientX + window.scrollX;
        y = event.clientY + window.scrollY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }

    // Create ripple effect at cursor position
    createRippleEffect(x, y);

    // Create star animation at the same position as the cross-section grid
    createStarAnimation(x, y);
}

function handleMouseMove(event) {
    // Use viewport coordinates but adjust for Chrome scroll
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    
    let x, y;
    if (isChrome) {
        // Adjust for Chrome's scroll behavior
        x = event.clientX + window.scrollX;
        y = event.clientY + window.scrollY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }
    
    updateCrossSectionGrid(x, y);
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

    // Create cross-section grid
    createCrossSectionGrid();

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMouseMove);

    // Add CSS animation for star
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
            100% {
                width: 200px;
                height: 200px;
                opacity: 0;
                border-width: 1px;
            }
        }
    `;
    document.head.appendChild(style);
});
