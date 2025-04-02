// Load Three.js from CDN
const loadThreeJS = () => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Three.js'));
        document.head.appendChild(script);
    });
};

// Initialize the starfield animation once Three.js is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('etherealCanvas');
    if (canvas) {
        loadThreeJS().then(() => {
            const app = new StarfieldAnimation();
            app.init();
            app.animate();
        }).catch(error => {
            console.error('Error initializing animation:', error);
        });
    }
});

// Add this class before StarfieldAnimation
class GlitchEffect {
    constructor(element) {
        this.element = element;
        this.originalText = element.textContent;
        this.glitchChars = '!<>-_\\/[]{}—=+*^?#________';
        this.interval = null;
        // Get the CSS variables
        this.primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        this.secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
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
        // Convert the CSS variables to rgba with low opacity
        const color = Math.random() < 0.5 ? 'rgba(115, 80, 255, 0.6)' : 'rgba(220, 80, 255, 0.6)';
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

class StarfieldAnimation {
    constructor() {
        this.container = document.getElementById('etherealCanvas');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.particles = [];
        this.windStreaks = [];
        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);
        this.mouseInterpolationSpeed = 0.15;
        this.parallaxStrength = 0.15;
        this.clock = new THREE.Clock();
        
        // Add rotation parameters
        this.rotation = 0;
        this.rotationSpeed = 0.01; // Very slow rotation speed
        this.typingSpeed = 50; // milliseconds between each character
        this.typingDelay = 1000; // delay before starting typing
        this.glitchElements = [];
        this.initIntersectionObserver();
        this.initGlitchEffects();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera with wider field of view and greater depth
        this.camera = new THREE.PerspectiveCamera(
            60, // Reduced FOV for less distortion
            this.width / this.height,
            0.1,
            3000 // Increased far plane for greater depth
        );
        this.camera.position.z = 1500; // Moved camera back for better perspective
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Set up container
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1';
        this.container.style.pointerEvents = 'none';
        this.container.appendChild(this.renderer.domElement);
        
        // Create particles and wind streaks
        this.createParticles();
        this.createWindStreaks();
        
        // Add event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });
        
        // Add typing animation initialization
        this.initTypingAnimation();
    }
    
    createParticles() {
        const particleCount = 800;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        const particleColors = new Float32Array(particleCount * 3);
        const particleOpacities = new Float32Array(particleCount);
        const particleSpeeds = new Float32Array(particleCount);
        
        const spaceWidth = this.width * 4;
        const spaceHeight = this.height * 4;
        const spaceDepth = 2000;
        
        const colors = [
            new THREE.Color('#7350ff'),
            new THREE.Color('#dc50ff'),
            new THREE.Color('#50fff9'),
            new THREE.Color('#ffffff')
        ];
        
        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * spaceWidth - (spaceWidth / 2);
            const y = Math.random() * spaceHeight - (spaceHeight / 2);
            const z = Math.random() * -spaceDepth;
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
            
            const speed = Math.random() * 3 + 4;
            particleSpeeds[i] = speed;
            
            // Increased size range for bigger stars
            const size = Math.random() * 25 + 8;
            particleSizes[i] = size;
            
            const colorIndex = Math.floor(Math.random() * colors.length);
            const color = colors[colorIndex];
            particleColors[i * 3] = color.r;
            particleColors[i * 3 + 1] = color.g;
            particleColors[i * 3 + 2] = color.b;
            
            // Increased opacity range for more visible stars
            const opacity = Math.random() * 0.7 + 0.4;
            particleOpacities[i] = opacity;
            
            this.particles.push({
                index: i,
                speed: speed,
                size: size,
                originalX: x,
                originalY: y,
                opacity: opacity
            });
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(particleOpacities, 1));
        
        const particleMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float opacity;
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    vColor = color;
                    vOpacity = opacity;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    float r = 0.0;
                    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                    r = dot(cxy, cxy);
                    
                    float alpha = 1.0 - smoothstep(0.3, 1.0, r);
                    alpha *= vOpacity;
                    
                    vec3 glow = vColor * (1.0 - r * 0.4);
                    
                    if (r < 0.2) {
                        glow = mix(vec3(1.0), glow, r * 5.0);
                    }
                    
                    gl_FragColor = vec4(glow, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.particleSystem.frustumCulled = false;
        this.scene.add(this.particleSystem);
    }

    createWindStreaks() {
        // Create a group to hold all wind streaks
        this.windStreakGroup = new THREE.Group();
        this.scene.add(this.windStreakGroup);
        
        const numStreaks = 20;
        const colors = [
            new THREE.Color('#ffffff'),
            new THREE.Color('#7350ff'),
            new THREE.Color('#dc50ff'),
            new THREE.Color('#50fff9')
        ];
        
        for (let i = 0; i < numStreaks; i++) {
            const length = Math.random() * 300 + 200;
            const width = Math.random() * 2 + 1;
            
            const geometry = new THREE.PlaneGeometry(width, length, 1, 1);
            geometry.rotateX(Math.PI / 2);
            geometry.rotateY(Math.random() * 0.2 - 0.1);
            geometry.rotateZ(Math.random() * 0.2 - 0.1);
            
            const colorIndex = Math.floor(Math.random() * colors.length);
            const color = colors[colorIndex];
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: Math.random() * 0.3 + 0.1,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            const streak = new THREE.Mesh(geometry, material);
            
            streak.position.x = (Math.random() - 0.5) * this.width * 2;
            streak.position.y = (Math.random() - 0.5) * this.height * 2;
            streak.position.z = Math.random() * -1000 - 500;
            
            streak.userData = {
                speed: Math.random() * 20 + 10,
                originalX: streak.position.x,
                originalY: streak.position.y
            };
            
            this.windStreakGroup.add(streak);
            this.windStreaks.push(streak);
        }
    }
    
    updateWindStreaks() {
        for (const streak of this.windStreaks) {
            streak.position.z += streak.userData.speed;
            
            const parallaxFactor = this.parallaxStrength * 2;
            streak.position.x = streak.userData.originalX + (this.mouse.x * 800 * parallaxFactor);
            streak.position.y = streak.userData.originalY + (this.mouse.y * 800 * parallaxFactor);
            
            if (streak.position.z > 500) {
                streak.position.z = Math.random() * -1000 - 500;
                streak.userData.originalX = (Math.random() - 0.5) * this.width * 2;
                streak.userData.originalY = (Math.random() - 0.5) * this.height * 2;
                streak.position.x = streak.userData.originalX;
                streak.position.y = streak.userData.originalY;
                
                streak.rotation.y = Math.random() * 0.2 - 0.1;
                streak.rotation.z = Math.random() * 0.2 - 0.1;
            }
        }
    }
    
    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
    }
    
    onMouseMove(event) {
        this.targetMouse.x = (event.clientX / this.width) * 2 - 1;
        this.targetMouse.y = -(event.clientY / this.height) * 2 + 1;
    }
    
    updateParticles() {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const opacities = this.particleSystem.geometry.attributes.opacity.array;
        const deltaTime = Math.min(this.clock.getDelta() * 60, 2);
        
        for (let i = 0; i < this.particles.length; i++) {
            const ix = i * 3;
            const particle = this.particles[i];
            
            positions[ix + 2] += particle.speed * deltaTime;
            
            // Calculate opacity based on z position
            // Start fading out at z = 200 and completely fade by z = 500
            const fadeStart = 200;
            const fadeEnd = 500;
            if (positions[ix + 2] > fadeStart) {
                const fadeProgress = (positions[ix + 2] - fadeStart) / (fadeEnd - fadeStart);
                opacities[particle.index] = Math.max(0, particle.opacity * (1 - fadeProgress));
            }
            
            if (positions[ix + 2] > fadeEnd) {
                positions[ix] = particle.originalX;
                positions[ix + 1] = particle.originalY;
                positions[ix + 2] = -2000;
                opacities[particle.index] = particle.opacity; // Reset opacity
            }
            
            const parallaxFactor = this.parallaxStrength * (1 - (Math.abs(positions[ix + 2]) / 2000));
            positions[ix] = particle.originalX + (this.mouse.x * 600 * parallaxFactor);
            positions[ix + 1] = particle.originalY + (this.mouse.y * 600 * parallaxFactor);
        }
        
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * this.mouseInterpolationSpeed;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * this.mouseInterpolationSpeed;
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        this.scene.rotation.z = Math.sin(this.rotation) * 0.1; // Gentle rolling motion
        
        this.updateParticles();
        this.updateWindStreaks();
        this.renderer.render(this.scene, this.camera);
    }
    
    initIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.3 // Trigger when 30% of the element is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('typed-started')) {
                    this.initTypingForElement(entry.target);
                    entry.target.classList.add('typed-started');
                    observer.unobserve(entry.target); // Stop observing once animation starts
                }
            });
        }, options);

        // Observe all typing-text elements except the first one (projects)
        const typingElements = document.querySelectorAll('.typing-text');
        typingElements.forEach((element, index) => {
            if (index > 0) { // Skip the first element since it starts immediately
                observer.observe(element);
            }
        });
    }

    initTypingAnimation() {
        // Only initialize the first typing-text element immediately
        const firstTypingElement = document.querySelector('.typing-text');
        if (firstTypingElement) {
            this.initTypingForElement(firstTypingElement);
            firstTypingElement.classList.add('typed-started');
        }
    }

    initTypingForElement(element) {
        const text = element.dataset.text;
        const parser = new DOMParser();
        const parsedHtml = parser.parseFromString(text, 'text/html');
        const nodes = Array.from(parsedHtml.body.childNodes);
        
        element.innerHTML = '<span class="typed"></span><span class="cursor">|</span>';
        
        this.typeText(element.querySelector('.typed'), nodes, 0);
    }
    
    typeText(element, nodes, nodeIndex) {
        if (nodeIndex >= nodes.length) return;
        
        const currentNode = nodes[nodeIndex];
        
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
            // If it's an HTML element, add it immediately
            element.appendChild(currentNode.cloneNode(true));
            setTimeout(() => {
                this.typeText(element, nodes, nodeIndex + 1);
            }, this.typingSpeed);
        } else if (currentNode.nodeType === Node.TEXT_NODE) {
            // If it's text, type it out character by character
            let text = currentNode.textContent;
            let charIndex = 0;
            
            const typeChar = () => {
                if (charIndex < text.length) {
                    element.appendChild(document.createTextNode(text.charAt(charIndex)));
                    charIndex++;
                    setTimeout(typeChar, this.typingSpeed);
                } else {
                    // Move to next node
                    this.typeText(element, nodes, nodeIndex + 1);
                }
            };
            
            typeChar();
        } else {
            // Skip other node types
            this.typeText(element, nodes, nodeIndex + 1);
        }
    }

    initGlitchEffects() {
        // Initialize glitch effect for all elements with the class
        const glitchElements = document.querySelectorAll('.glitch-effect');
        glitchElements.forEach(element => {
            this.glitchElements.push(new GlitchEffect(element));
        });
    }
}

// Add this CSS to the document head
const style = document.createElement('style');
style.textContent = `
    .typing-text .cursor {
        animation: blink 1s infinite;
    }
    
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }
`;
document.head.appendChild(style);