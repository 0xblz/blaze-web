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
    
    // Convert HSL to hex
    const color1 = hslToHex(hue1, saturation, lightness);
    const color2 = hslToHex(hue2, saturation, lightness);
    const color3 = hslToHex(hue3, saturation, lightness);

    // Update CSS variables
    document.documentElement.style.setProperty('--primary-color', color1);
    document.documentElement.style.setProperty('--secondary-color', color2);
    document.documentElement.style.setProperty('--tertiary-color', color3);
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
document.addEventListener('DOMContentLoaded', generateTriadicColors);
