function generateTriadicColors() {
    // Generate a random base hue (0-360)
    const baseHue = Math.floor(Math.random() * 360);
    
    // Calculate triadic colors (120° apart)
    const hue1 = baseHue;
    const hue2 = (baseHue + 120) % 360;
    const hue3 = (baseHue + 240) % 360;

    // Convert to HSL with fixed saturation and lightness
    const saturation = 85;
    const lightness = 85;
    
    // Create darker version of primary color for text
    const darkLightness = 20; // Much darker for text contrast
    
    // Convert HSL to hex
    const color1 = hslToHex(hue1, saturation, lightness);
    const color2 = hslToHex(hue2, saturation, lightness);
    const color3 = hslToHex(hue3, saturation, lightness);
    const color4 = hslToHex(hue1, saturation, darkLightness); // Quaternary color (dark primary)

    // Generate random positions for the pseudo-elements
    const beforeTop = Math.random() * 20 - 10; // -10% to 10%
    const beforeLeft = Math.random() * 50 - 50; // -50% to 0%
    const afterBottom = Math.random() * 20 - 10; // -10% to 10%
    const afterRight = Math.random() * 50 - 50; // -50% to 0%

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
    // Create vertical line
    const verticalLine = document.createElement('div');
    verticalLine.id = 'vertical-line';
    verticalLine.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 1px;
        height: 100vh;
        background: rgba(255, 255, 255, 0.3);
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
        background: rgba(255, 255, 255, 0.3);
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
        verticalLine.style.left = `${x}px`;
        horizontalLine.style.top = `${y}px`;
        centerDot.style.left = `${x}px`;
        centerDot.style.top = `${y}px`;
    }
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
    generateTriadicColors();
    
    // Create star animation at click position
    createStarAnimation(event.clientX, event.clientY);
}

function handleMouseMove(event) {
    updateCrossSectionGrid(event.clientX, event.clientY);
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
    generateTriadicColors();
    
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
    `;
    document.head.appendChild(style);
});
