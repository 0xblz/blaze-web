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
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 2000);
        this.camera.position.z = 1000;
        
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
        
        this.updateParticles();
        this.updateWindStreaks();
        this.renderer.render(this.scene, this.camera);
    }
}