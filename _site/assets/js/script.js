// Three.js Fabric Lines Visualization
console.log('Script loaded, checking Three.js...');

// Check if Three.js is available
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
} else {

console.log('Three.js loaded successfully:', THREE.REVISION);

// Configuration - Edit these values to customize the appearance
const CONFIG = {
    // Line properties
    lineCount: 200,           // Number of horizontal lines
    lineLength: 60,           // Length of each line
    lineSpacing: 0.25,        // Vertical spacing between lines
    linePoints: 600,         // Number of points per line (higher = smoother curves)
    lineColor: null,     // Will be set dynamically from CSS variable
    lineOpacity: 0.3,        // Line transparency (0.0 = invisible, 1.0 = solid)
    lineWidth: 1,            // Line thickness
    
    // Contour shape (abstract curve the lines follow)
    contourAmplitude1: 0.3,  // Primary wave amplitude
    contourAmplitude2: 0.2,  // Secondary wave amplitude  
    contourAmplitude3: 0.5,  // Tertiary wave amplitude
    contourFrequency1: 0.3,  // Primary wave frequency
    contourFrequency2: 0.1,  // Secondary wave frequency
    contourFrequency3: 0.5,  // Tertiary wave frequency
    
    // Mouse interaction
    mouseInfluenceRange: 4.0,     // Distance mouse affects lines
    oscillationAmplitude: 2.8,    // How much lines wiggle
    dampeningAmplitude: 0.5,      // Secondary movement amplitude
    animationSpeed: 0.005,        // Speed of oscillation
    returnSpeed: 0.05,            // How fast lines return to original position
    returnSpeedNoMouse: 0.03,     // Return speed when mouse not over canvas
    
    // Natural wave animation (subtle movement when no mouse interaction)
    naturalWaveEnabled: true,     // Enable/disable natural wave animation
    naturalWaveAmplitude: 1.2,    // How much natural movement (very subtle)
    naturalWaveSpeed: 0.002,      // Speed of natural wave animation (very slow)
    naturalWaveFrequency: 0.3,    // Frequency of natural waves
    
    // Electrical pulse effect
    pulseEnabled: true,           // Enable/disable pulse effect
    pulseMaxOpacity: 1.0,         // Maximum opacity during pulse
    pulseMinInterval: 800,        // Minimum time between pulses on same line (ms)
    pulseMaxInterval: 4000,       // Maximum time between pulses on same line (ms)
    maxConcurrentPulses: 4,       // Maximum number of pulses visible at once
    
    // Scene rotation (for abstract look)
    rotationX: Math.PI * 0,    // ~15 degrees
    rotationY: Math.PI * 0,    // Slight y rotation
    
    // Camera
    cameraDistance: 10,            // How far camera is from scene
    fov: 105                       // Field of view
};

// Scene setup
let scene, camera, renderer, lines = [];
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
let isMouseOver = false;
let mousePosition = new THREE.Vector3();
let activePulses = []; // Track active electrical pulses

// Initialize the scene
function init() {
    // Get the primary color from CSS variable
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();
    CONFIG.lineColor = primaryColor;
    console.log('Using primary color:', primaryColor);
    
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, CONFIG.cameraDistance);
    
    // Create renderer
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    
    // Create the fabric-like line grid
    createFabricLines();
    
    // Set up mouse interaction
    setupMouseInteraction();
    
    // Rotate the entire scene for abstract look
    scene.rotation.x = CONFIG.rotationX;
    scene.rotation.y = CONFIG.rotationY;
    
    // Start animation loop
    animate();
}

// Create symmetrical lines following an abstract contour
function createFabricLines() {
    for (let i = 0; i < CONFIG.lineCount; i++) {
        const y = (i - CONFIG.lineCount / 2) * CONFIG.lineSpacing;
        
        // Create abstract contour using sine waves for smooth curves
        const points = [];
        for (let j = 0; j <= CONFIG.linePoints; j++) {
            const x = (j / CONFIG.linePoints) * CONFIG.lineLength - CONFIG.lineLength / 2;
            
            // Abstract contour using multiple sine waves for smooth, organic shape
            const contourOffset = Math.sin(i * CONFIG.contourFrequency1) * CONFIG.contourAmplitude1 + 
                                 Math.sin(i * CONFIG.contourFrequency2) * CONFIG.contourAmplitude2 + 
                                 Math.cos(x * CONFIG.contourFrequency3) * CONFIG.contourAmplitude3;
            
            const z = contourOffset;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        // Create geometry from points
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Create simple material for now (debugging)
        const material = new THREE.LineBasicMaterial({ 
            color: CONFIG.lineColor, 
            linewidth: CONFIG.lineWidth,
            transparent: true,
            opacity: CONFIG.lineOpacity
        });
        
        // Create line mesh
        const line = new THREE.Line(geometry, material);
        
        // Store original positions and pulse data for animation
        line.userData = {
            originalPositions: [...points],
            index: i,
            currentOffset: 0,
            lastPulseTime: Date.now() + Math.random() * CONFIG.pulseMaxInterval * 2, // Much longer random initial delay
            nextPulseDelay: CONFIG.pulseMinInterval + Math.random() * (CONFIG.pulseMaxInterval - CONFIG.pulseMinInterval),
            baseInterval: CONFIG.pulseMinInterval + Math.random() * (CONFIG.pulseMaxInterval - CONFIG.pulseMinInterval) // Unique base interval per line
        };
        
        lines.push(line);
        scene.add(line);
    }
}

// Set up mouse interaction
function setupMouseInteraction() {
    const canvas = document.getElementById('canvas');
    
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Convert mouse position to world coordinates more accurately
        // Project the mouse coordinates to the z=0 plane where our lines are
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0);
        vector.unproject(camera);
        
        // Calculate the direction from camera to the unprojected point
        const direction = vector.sub(camera.position).normalize();
        
        // Find intersection with z=0 plane (where our lines roughly are)
        const distance = -camera.position.z / direction.z;
        mousePosition.copy(camera.position).add(direction.multiplyScalar(distance));
        
        isMouseOver = true;
        
        // Debug output (remove this later)
        // console.log('Mouse world position:', mousePosition.x.toFixed(2), mousePosition.y.toFixed(2));
    });
    
    canvas.addEventListener('mouseleave', () => {
        isMouseOver = false;
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Manage electrical pulses
    managePulses();
    
    // Update line positions for fabric effect
    updateFabricEffect();
    
    renderer.render(scene, camera);
}

// Manage electrical pulses
function managePulses() {
    const currentTime = Date.now();
    
    // Remove completed pulses
    activePulses = activePulses.filter(pulse => {
        const progress = (currentTime - pulse.startTime) / pulse.duration;
        return progress < 1.0;
    });
    
    // Check if we can start new pulses - but only start ONE per frame to prevent batching
    if (activePulses.length < CONFIG.maxConcurrentPulses && CONFIG.pulseEnabled) {
        // Find all lines ready to pulse
        const readyLines = lines.filter(line => {
            const userData = line.userData;
            const timeSinceLastPulse = currentTime - userData.lastPulseTime;
            return timeSinceLastPulse >= userData.nextPulseDelay;
        });
        
        // Only start ONE pulse per frame, chosen randomly from ready lines
        if (readyLines.length > 0) {
            const randomLine = readyLines[Math.floor(Math.random() * readyLines.length)];
            const userData = randomLine.userData;
            
            // Start a new pulse on this line - shorter duration
            const pulseDuration = 1500; // Fixed 1.5 second duration
            
            activePulses.push({
                lineIndex: userData.index,
                startTime: currentTime,
                duration: pulseDuration
            });
            
            // console.log('Starting pulse on line', userData.index, 'Duration:', pulseDuration, 'Active pulses:', activePulses.length);
            
            // Update timing for next pulse with much more variation
            userData.lastPulseTime = currentTime;
            // Use the line's unique base interval plus extra randomness
            const extraVariation = (Math.random() - 0.5) * 2000; // +/- 1000ms variation
            const bonusDelay = Math.random() * 2000; // Additional 0-2s random delay
            userData.nextPulseDelay = userData.baseInterval + extraVariation + bonusDelay;
        }
    }
}

// Update fabric effect - make lines wiggle near mouse
function updateFabricEffect() {
    lines.forEach((line, lineIndex) => {
        const positions = line.geometry.attributes.position.array;
        const originalPositions = line.userData.originalPositions;
        
        for (let i = 0; i < originalPositions.length; i++) {
            const originalPoint = originalPositions[i];
            
            // Calculate natural wave animation (subtle baseline movement)
            let naturalOffsetX = 0, naturalOffsetY = 0, naturalOffsetZ = 0;
            if (CONFIG.naturalWaveEnabled) {
                const time = Date.now() * CONFIG.naturalWaveSpeed;
                const pointRatio = i / originalPositions.length;
                
                // Create gentle wave patterns using multiple sine waves
                naturalOffsetX = Math.sin(time + lineIndex * CONFIG.naturalWaveFrequency + pointRatio * Math.PI * 2) * CONFIG.naturalWaveAmplitude;
                naturalOffsetY = Math.sin(time * 0.7 + lineIndex * CONFIG.naturalWaveFrequency * 0.8 + pointRatio * Math.PI * 1.5) * CONFIG.naturalWaveAmplitude * 0.5;
                naturalOffsetZ = Math.cos(time * 0.5 + lineIndex * CONFIG.naturalWaveFrequency * 1.2) * CONFIG.naturalWaveAmplitude * 0.3;
            }
            
            if (isMouseOver) {
                // Calculate distance from mouse to this point
                const distance = mousePosition.distanceTo(originalPoint);
                
                if (distance < CONFIG.mouseInfluenceRange) {
                    // Create ripple effect - closer points move more
                    const influence = Math.pow(1 - (distance / CONFIG.mouseInfluenceRange), 2);
                    const time = Date.now() * CONFIG.animationSpeed;
                    
                    // Guitar string-like oscillation
                    const oscillation = Math.sin(time + lineIndex * 0.5 + i * 0.1) * influence * CONFIG.oscillationAmplitude;
                    const dampening = Math.sin(time * 0.7 + lineIndex * 0.3) * influence * CONFIG.dampeningAmplitude;
                    
                    // Apply the effect (mouse interaction + natural wave)
                    positions[i * 3] = originalPoint.x + oscillation + naturalOffsetX;
                    positions[i * 3 + 1] = originalPoint.y + dampening + naturalOffsetY;
                    positions[i * 3 + 2] = originalPoint.z + oscillation * 0.5 + naturalOffsetZ;
                } else {
                    // Gradually return to original position + natural wave
                    const targetX = originalPoint.x + naturalOffsetX;
                    const targetY = originalPoint.y + naturalOffsetY;
                    const targetZ = originalPoint.z + naturalOffsetZ;
                    
                    positions[i * 3] = positions[i * 3] + (targetX - positions[i * 3]) * CONFIG.returnSpeed;
                    positions[i * 3 + 1] = positions[i * 3 + 1] + (targetY - positions[i * 3 + 1]) * CONFIG.returnSpeed;
                    positions[i * 3 + 2] = positions[i * 3 + 2] + (targetZ - positions[i * 3 + 2]) * CONFIG.returnSpeed;
                }
            } else {
                // Return to natural wave position when mouse is not over
                const targetX = originalPoint.x + naturalOffsetX;
                const targetY = originalPoint.y + naturalOffsetY;
                const targetZ = originalPoint.z + naturalOffsetZ;
                
                positions[i * 3] = positions[i * 3] + (targetX - positions[i * 3]) * CONFIG.returnSpeedNoMouse;
                positions[i * 3 + 1] = positions[i * 3 + 1] + (targetY - positions[i * 3 + 1]) * CONFIG.returnSpeedNoMouse;
                positions[i * 3 + 2] = positions[i * 3 + 2] + (targetZ - positions[i * 3 + 2]) * CONFIG.returnSpeedNoMouse;
            }
        }
        
        // Apply electrical pulse effect (simple version for debugging)
        if (CONFIG.pulseEnabled) {
            const currentTime = Date.now();
            
            // Check if this line has an active pulse
            const activePulse = activePulses.find(pulse => pulse.lineIndex === lineIndex);
            if (activePulse) {
                const progress = (currentTime - activePulse.startTime) / activePulse.duration;
                
                if (progress >= 0 && progress <= 1) {
                    // Create a fade effect - bright at start, fading out over time
                    const fadeOut = 1 - progress; // 1 at start, 0 at end
                    const pulseIntensity = Math.pow(fadeOut, 2); // Smooth fade curve
                    
                    const brightness = CONFIG.lineOpacity + (CONFIG.pulseMaxOpacity - CONFIG.lineOpacity) * pulseIntensity;
                    line.material.opacity = brightness;
                } else {
                    line.material.opacity = CONFIG.lineOpacity;
                }
            } else {
                line.material.opacity = CONFIG.lineOpacity;
            }
        }
        
        line.geometry.attributes.position.needsUpdate = true;
    });
}

// Handle window resize
function onWindowResize() {
    const canvas = document.getElementById('canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

window.addEventListener('resize', onWindowResize);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing three.js scene with pulse system...');
    init();
    console.log('Lines created:', lines.length, 'Pulse enabled:', CONFIG.pulseEnabled);
});

}

