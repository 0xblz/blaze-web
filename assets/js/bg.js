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

function createStarAnimation(x, y) {
    // Create star element
    const star = document.createElement('div');
    star.innerHTML = '<i class="fa-solid fa-fill-drip"></i>';
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
    
    // Add click event listener to the entire document
    document.addEventListener('click', handleClick);
    
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
