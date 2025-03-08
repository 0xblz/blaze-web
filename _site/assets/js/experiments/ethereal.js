// Load Three.js from CDN
const loadThreeJS = () => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => {
            // After Three.js is loaded, load the post-processing library
            const ppScript = document.createElement('script');
            ppScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js';
            ppScript.onload = () => {
                // Load additional post-processing modules
                const renderPassScript = document.createElement('script');
                renderPassScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js';
                renderPassScript.onload = () => {
                    const shaderPassScript = document.createElement('script');
                    shaderPassScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js';
                    shaderPassScript.onload = () => {
                        const digitalGlitchScript = document.createElement('script');
                        digitalGlitchScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/DigitalGlitch.js';
                        digitalGlitchScript.onload = () => {
                            const glitchPassScript = document.createElement('script');
                            glitchPassScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/GlitchPass.js';
                            glitchPassScript.onload = () => resolve();
                            glitchPassScript.onerror = () => reject(new Error('Failed to load GlitchPass'));
                            document.head.appendChild(glitchPassScript);
                        };
                        digitalGlitchScript.onerror = () => reject(new Error('Failed to load DigitalGlitch'));
                        document.head.appendChild(digitalGlitchScript);
                    };
                    shaderPassScript.onerror = () => reject(new Error('Failed to load ShaderPass'));
                    document.head.appendChild(shaderPassScript);
                };
                renderPassScript.onerror = () => reject(new Error('Failed to load RenderPass'));
                document.head.appendChild(renderPassScript);
            };
            ppScript.onerror = () => reject(new Error('Failed to load EffectComposer'));
            document.head.appendChild(ppScript);
        };
        script.onerror = () => reject(new Error('Failed to load Three.js'));
        document.head.appendChild(script);
    });
};

// Initialize the ethereal animation once Three.js is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if the canvas element exists
    const canvas = document.getElementById('etherealCanvas');
    if (canvas) {
        loadThreeJS().then(() => {
            // Initialize Three.js scene
            const app = new EtherealAnimation();
            app.init();
            app.animate();
        }).catch(error => {
            console.error('Error initializing animation:', error);
        });
    }
});

class EtherealAnimation {
    constructor() {
        this.container = document.getElementById('etherealCanvas');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.particles = [];
        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);
        this.mouseRadius = 150;
        this.clock = new THREE.Clock();
        this.isMouseOverCanvas = false;
        this.parallaxStrength = 0.15; // Increased from 0.08 to 0.15 for more pronounced movement
        this.mouseInterpolationSpeed = 0.15;
        
        // Add mode property
        this.mode = 'NORMAL'; // Possible values: 'NORMAL', 'BOOST', 'ULTRA BOOST'
        
        // Add scroll direction tracking
        this.scrollDirection = 0; // 0 = no scroll, 1 = down, -1 = up
        this.scrollMomentum = 0; // Momentum of scrolling
        this.scrollMomentumDecay = 0.95; // How quickly scroll momentum decays
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check if we're on the home page
        this.isHomePage = !window.location.pathname.includes('/experiments/');
        
        // Speed boost parameters - adjusted for more noticeable acceleration
        this.isMouseDown = false;
        this.speedBoost = 1.0; // Normal speed multiplier
        this.maxSpeedBoost = 10.0; // Initial maximum speed boost
        this.ultraBoostMaxSpeed = 20.0; // Ultra boost speed after 5 seconds
        this.speedBoostIncrement = 0.15; // Faster acceleration
        this.speedBoostDecrement = 0.08; // Slightly faster deceleration
        this.boostStartTime = 0; // When the current boost started
        this.ultraBoostThreshold = 3.0; // Time in seconds before ultra boost (reduced from 5.0)
        this.isUltraBoost = false; // Whether ultra boost is active
        
        // FOV adjustment parameters - same for both pages now
        this.baseFOV = 75; // Default FOV
        this.maxFOV = 100; // Maximum FOV for regular boost
        this.ultraBoostFOV = 120; // Wider FOV for ultra boost
        this.currentFOV = this.baseFOV; // Current FOV value
        this.fovInterpolationSpeed = 0.05; // How quickly FOV changes
        
        // Rotation parameters - same for both pages now
        this.rotation = 0; // Current rotation angle
        this.rotationSpeed = 0; // Current rotation speed
        this.maxRotationSpeed = 0.005; // Same maximum rotation speed for both pages
        this.rotationAcceleration = 0.00005; // Increased acceleration
        this.rotationDeceleration = 0.00008; // Increased deceleration
        this.rotationAmplitude = 0.12; // Same rotation amplitude for both pages
        
        // Glitch effect parameters - same for both pages now
        this.glitchIntensity = 0.0; // Current glitch intensity
        this.maxGlitchIntensity = 0.4; // Same maximum glitch intensity for both pages
        this.glitchIncrement = 0.03; // Slower glitch build-up
        this.glitchDecrement = 0.05; // Faster glitch fade-out
        this.lastGlitchTime = 0; // Last time a glitch was triggered
        this.glitchInterval = 0.4; // Less frequent glitches
        this.glitchDuration = 0.07; // Shorter glitch duration
        this.isGlitching = false; // Whether a glitch is currently active
        
        // Normal colors (used at regular speed)
        this.colors = [
            new THREE.Color('#7350ff'), // Primary color
            new THREE.Color('#dc50ff'), // Secondary color
            new THREE.Color('#50fff9'), // Quaternary color (cyan)
            new THREE.Color('#ffffff')  // White
        ];
        
        // Speed colors (used during boost)
        this.speedColors = [
            new THREE.Color('#ff5050'), // Red
            new THREE.Color('#ff8000'), // Orange
            new THREE.Color('#ffff00'), // Yellow
            new THREE.Color('#ffffff')  // White
        ];
        
        // Wind streaks parameters
        this.windStreaks = [];
        this.maxWindStreaks = 20; // Maximum number of wind streaks
        this.windStreakColors = [
            new THREE.Color('#ffffff'), // White
            new THREE.Color('#7350ff'), // Primary color
            new THREE.Color('#dc50ff'), // Secondary color
            new THREE.Color('#50fff9')  // Quaternary color
        ];
        
        // Vignette effect parameters
        this.vignetteElement = null;
        this.vignetteIntensity = 0;
        this.maxVignetteIntensity = 0.8;
        this.vignetteColor = '#7350ff'; // Primary color for vignette
        this.vignetteUltraBoostColor = '#dc50ff'; // Secondary color for ultra boost vignette
        
        // Shake effect parameters
        this.shakeIntensity = 0;
        this.maxShakeIntensity = 3; // Maximum shake in pixels
        this.shakeDecay = 0.9; // How quickly shake decays
        this.shakeThreshold = 1.5; // Speed boost threshold to start shaking
        this.lastShakeTime = 0;
        this.shakeInterval = 0.05; // How often to apply shake (in seconds)
        
        // Mobile touch handling properties
        this.touchStartTime = 0;
        this.touchStartPosition = { x: 0, y: 0 };
        this.touchBoostDelay = 500; // 1 second delay before activating boost
        this.touchBoostTimer = null;
        this.touchScrollThreshold = 20; // pixels of movement to consider a scroll
        this.isBoostActivated = false; // Flag to track if boost is activated
        
        // Add keyboard control properties
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        this.isKeyboardBoosting = false;
        
        // Camera rotation properties
        this.cameraRotation = {
            x: 0, // Pitch (up/down)
            y: 0  // Yaw (left/right)
        };
        this.targetCameraRotation = {
            x: 0,
            y: 0
        };
        this.maxCameraRotation = {
            x: Math.PI / 4, // 45 degrees up/down (increased from 30 degrees)
            y: Math.PI / 3  // 60 degrees left/right (increased from 45 degrees)
        };
        this.cameraRotationSpeed = 0.15; // How quickly camera rotates (increased from 0.1)
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera with base FOV
        this.camera = new THREE.PerspectiveCamera(this.baseFOV, this.width / this.height, 0.1, 2000);
        this.camera.position.z = 1000;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Set up the container for proper scrolling
        // Make the container fixed position with a lower z-index
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '1'; // Lower than content
        this.container.style.pointerEvents = 'none'; // Allow clicks to pass through to content
        
        // But the renderer should receive pointer events
        this.renderer.domElement.style.pointerEvents = 'auto';
        
        // Set touch-action to allow scrolling
        this.renderer.domElement.style.touchAction = 'pan-x pan-y';
        
        this.container.appendChild(this.renderer.domElement);
        
        // Create vignette effect
        this.createVignetteEffect();
        
        // Set up post-processing
        this.setupPostProcessing();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add point lights for glow effect
        this.addLights();
        
        // Create particles
        this.createParticles();
        
        // Create mode indicator
        this.createSpeedBoostIndicator();
        
        // Add event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Use passive event listeners to improve performance and not block the main thread
        document.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });
        document.addEventListener('mousedown', this.onMouseDown.bind(this), { passive: true });
        document.addEventListener('mouseup', this.onMouseUp.bind(this), { passive: true });
        document.addEventListener('mouseleave', this.onMouseUp.bind(this), { passive: true });
        document.addEventListener('click', this.onMouseClick.bind(this), { passive: true });
        
        // Add wheel event listener for scroll direction
        window.addEventListener('wheel', this.onScroll.bind(this), { passive: true });
        
        // Add keyboard event listeners - use passive: false to allow preventDefault()
        document.addEventListener('keydown', this.onKeyDown.bind(this), { passive: false });
        document.addEventListener('keyup', this.onKeyUp.bind(this), { passive: false });
        
        // Set up touch events - ALWAYS use passive listeners for document-level events
        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
        document.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: true });
        
        // Add canvas-specific touch handlers for boost functionality
        // Use passive: true to allow natural scrolling
        this.renderer.domElement.addEventListener('touchstart', this.onCanvasTouchStart.bind(this), { passive: true });
        this.renderer.domElement.addEventListener('touchmove', this.onCanvasTouchMove.bind(this), { passive: true });
        this.renderer.domElement.addEventListener('touchend', this.onCanvasTouchEnd.bind(this), { passive: true });
        
        // Prevent text selection on mobile devices
        this.preventTextSelection();
        
        // Fix iOS scrolling issues
        this.fixIOSScrolling();
    }
    
    setupPostProcessing() {
        try {
            // Create effect composer
            this.composer = new THREE.EffectComposer(this.renderer);
            
            // Add render pass
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Add glitch pass with more subtle settings
            this.glitchPass = new THREE.GlitchPass();
            this.glitchPass.goWild = false; // More controlled glitches
            this.glitchPass.enabled = false; // Start with glitch disabled
            
            // Customize glitch pass for more subtle effect
            if (this.glitchPass.uniforms) {
                // Reduce the amount of RGB shift
                if (this.glitchPass.uniforms.amount) {
                    this.glitchPass.uniforms.amount.value = 0.2; // Default is higher
                }
                
                // Reduce the column shift intensity
                if (this.glitchPass.uniforms.col_s) {
                    this.glitchPass.uniforms.col_s.value = 0.05; // Default is higher
                }
            }
            
            this.composer.addPass(this.glitchPass);
        } catch (error) {
            console.warn('Post-processing setup failed, falling back to standard renderer:', error);
            this.composer = null;
            this.glitchPass = null;
        }
    }
    
    addLights() {
        // Add multiple point lights with different colors
        const light1 = new THREE.PointLight(0x8A9FD1, 1, 1000);
        light1.position.set(0, 200, 400);
        this.scene.add(light1);
        
        const light2 = new THREE.PointLight(0xC4A1FF, 1, 1000);
        light2.position.set(500, 100, 200);
        this.scene.add(light2);
        
        const light3 = new THREE.PointLight(0xFFB7D5, 1, 1000);
        light3.position.set(-500, -100, 200);
        this.scene.add(light3);
    }
    
    createParticles() {
        // Create different types of particles
        this.createGlowingParticles();
        
        // Create wind streaks (initially hidden)
        this.createWindStreaks();
    }
    
    createGlowingParticles() {
        // Create glowing particles
        // Reduce particle count on mobile devices
        const particleCount = this.isMobile ? 300 : 800;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        const particleColors = new Float32Array(particleCount * 3);
        const particleOpacities = new Float32Array(particleCount);
        const particleSpeeds = new Float32Array(particleCount);
        // Add streak length attribute for speed effect
        const particleStreaks = new Float32Array(particleCount);
        
        // Define the space boundaries for particles
        const spaceWidth = this.width * 4;
        const spaceHeight = this.height * 4;
        const spaceDepth = 2000; // How far back the particles go
        
        // Define speed categories - adjusted for clear forward motion
        const speedCategories = [
            { probability: 0.7, multiplier: 1.0 },    // 70% normal speed
            { probability: 0.2, multiplier: 1.5 },    // 20% faster
            { probability: 0.1, multiplier: 2.5 }     // 10% very fast
        ];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position in 3D space
            // X and Y are spread across the view
            // Z is distributed from far away (negative) to close (positive)
            const x = Math.random() * spaceWidth - (spaceWidth / 2);
            const y = Math.random() * spaceHeight - (spaceHeight / 2);
            const z = Math.random() * -spaceDepth; // Start all particles behind the camera
            
            particlePositions[i * 3] = x;
            particlePositions[i * 3 + 1] = y;
            particlePositions[i * 3 + 2] = z;
            
            // Determine speed category based on probabilities
            let speedMultiplier = 1;
            const speedRandom = Math.random();
            let cumulativeProbability = 0;
            
            for (const category of speedCategories) {
                cumulativeProbability += category.probability;
                if (speedRandom <= cumulativeProbability) {
                    speedMultiplier = category.multiplier;
                    break;
                }
            }
            
            // Speed is now in the Z direction (towards viewer)
            // Increased base speed to ensure clear forward motion
            const baseSpeed = (Math.random() * 3 + 4) * speedMultiplier;
            particleSpeeds[i] = baseSpeed;
            
            // Size based on z-position (closer = larger)
            // Will be dynamically updated during animation
            const size = Math.random() * 15 + 4;
            particleSizes[i] = size;
            
            // Initialize streak length to 0 (no streak at normal speed)
            particleStreaks[i] = 0.0;
            
            // Random color from our palette
            const colorIndex = Math.floor(Math.random() * this.colors.length);
            const color = this.colors[colorIndex];
            particleColors[i * 3] = color.r;
            particleColors[i * 3 + 1] = color.g;
            particleColors[i * 3 + 2] = color.b;
            
            // Random base opacity
            const baseOpacity = Math.random() * 0.5 + 0.3;
            particleOpacities[i] = baseOpacity;
            
            // Create a particle object for animation
            this.particles.push({
                index: i,
                speed: particleSpeeds[i],
                originalSpeed: particleSpeeds[i],
                size: size,
                originalSize: size,
                opacity: baseOpacity,
                originalOpacity: baseOpacity,
                color: color,
                originalX: x,
                originalY: y,
                originalZ: z,
                speedCategory: speedMultiplier,
                streak: 0.0 // Initialize streak length
            });
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
        particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(particleOpacities, 1));
        // Add streak attribute
        particleGeometry.setAttribute('streak', new THREE.BufferAttribute(particleStreaks, 1));
        
        // Create shader material for glowing particles
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                speedBoost: { value: 1.0 }, // Add uniform for speed boost
                speedColor1: { value: new THREE.Vector3(this.speedColors[0].r, this.speedColors[0].g, this.speedColors[0].b) },
                speedColor2: { value: new THREE.Vector3(this.speedColors[1].r, this.speedColors[1].g, this.speedColors[1].b) },
                speedColor3: { value: new THREE.Vector3(this.speedColors[2].r, this.speedColors[2].g, this.speedColors[2].b) },
                speedColor4: { value: new THREE.Vector3(this.speedColors[3].r, this.speedColors[3].g, this.speedColors[3].b) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute float opacity;
                attribute float streak;
                varying vec3 vColor;
                varying float vOpacity;
                varying float vStreak;
                uniform float speedBoost;
                
                void main() {
                    vColor = color;
                    vOpacity = opacity;
                    vStreak = streak;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vOpacity;
                varying float vStreak;
                uniform float speedBoost;
                uniform vec3 speedColor1; // Red
                uniform vec3 speedColor2; // Orange
                uniform vec3 speedColor3; // Yellow
                uniform vec3 speedColor4; // White
                
                // Function to get color based on speed factor using speedColors
                vec3 getSpeedColor(vec3 baseColor, float speedFactor) {
                    if (speedFactor <= 0.0) {
                        return baseColor; // Use original color at normal speed
                    }
                    
                    // Use the speedColors based on the speed factor
                    if (speedFactor < 0.33) {
                        // Mix between original color and first speed color (red)
                        return mix(baseColor, speedColor1, speedFactor * 3.0);
                    } else if (speedFactor < 0.66) {
                        // Mix between first and second speed colors (red to orange)
                        return mix(speedColor1, speedColor2, (speedFactor - 0.33) * 3.0);
                    } else if (speedFactor < 0.9) {
                        // Mix between second and third speed colors (orange to yellow)
                        return mix(speedColor2, speedColor3, (speedFactor - 0.66) * 4.0);
                    } else {
                        // Mix between third and fourth speed colors (yellow to white)
                        return mix(speedColor3, speedColor4, (speedFactor - 0.9) * 10.0);
                    }
                }
                
                void main() {
                    // Calculate distance from center of point
                    float r = 0.0;
                    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                    r = dot(cxy, cxy);
                    
                    // Enhanced soft circle shape with stronger glow
                    float alpha = 1.0 - smoothstep(0.3, 1.0, r);
                    alpha *= vOpacity;
                    
                    // Calculate speed factor for color shifting (0 to 1)
                    float speedFactor = clamp((speedBoost - 1.0) / 9.0, 0.0, 1.0);
                    
                    // Get color based on speed using the speedColors
                    vec3 baseColor = getSpeedColor(vColor, speedFactor);
                    vec3 glow = baseColor * (1.0 - r * 0.4);
                    
                    // Boost brightness in the center
                    if (r < 0.2) {
                        glow = mix(vec3(1.0), glow, r * 5.0);
                    }
                    
                    // Add motion streaks when boosting
                    if (vStreak > 0.0) {
                        // Only create streaks in the horizontal direction (along X axis)
                        if (cxy.x > 0.0 && abs(cxy.y) < 0.3) {
                            // Calculate streak intensity based on distance from center and streak length
                            float streakIntensity = (1.0 - cxy.x) * vStreak * (1.0 - abs(cxy.y) * 3.0);
                            
                            // Create a more intense color for the streak
                            vec3 streakColor = mix(baseColor, speedColor4, speedFactor * 0.8);
                            
                            // Add streak to the glow
                            glow += streakColor * streakIntensity * 0.8;
                            
                            // Extend alpha for the streak
                            alpha = max(alpha, streakIntensity * vOpacity);
                        }
                    }
                    
                    gl_FragColor = vec4(glow, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create the particle system
        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.particleSystem.frustumCulled = false; // Prevent particles from disappearing at screen edges
        this.scene.add(this.particleSystem);
        
        // Store a reference to the particle material for later updates
        this.particleMaterial = particleMaterial;
    }
    
    createWindStreaks() {
        // Create a group to hold all wind streaks
        this.windStreakGroup = new THREE.Group();
        this.scene.add(this.windStreakGroup);
        
        // Create wind streak geometries
        for (let i = 0; i < this.maxWindStreaks; i++) {
            // Create a streak geometry (elongated in Z direction)
            const length = Math.random() * 300 + 200; // Random length between 200-500
            const width = Math.random() * 2 + 1; // Random width between 1-3
            
            const geometry = new THREE.PlaneGeometry(width, length, 1, 1);
            
            // Rotate to face the camera and tilt slightly
            geometry.rotateX(Math.PI / 2); // Face the camera
            geometry.rotateY(Math.random() * 0.2 - 0.1); // Random slight Y rotation
            geometry.rotateZ(Math.random() * 0.2 - 0.1); // Random slight Z rotation
            
            // Random color from wind streak colors
            const colorIndex = Math.floor(Math.random() * this.windStreakColors.length);
            const color = this.windStreakColors[colorIndex];
            
            // Create material with transparency and glow
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0, // Start invisible
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            // Create mesh
            const streak = new THREE.Mesh(geometry, material);
            
            // Random position (will be updated during animation)
            streak.position.x = (Math.random() - 0.5) * this.width * 2;
            streak.position.y = (Math.random() - 0.5) * this.height * 2;
            streak.position.z = Math.random() * -1000 - 500;
            
            // Store additional properties
            streak.userData = {
                speed: Math.random() * 20 + 10,
                opacity: 0,
                targetOpacity: 0,
                originalX: streak.position.x,
                originalY: streak.position.y
            };
            
            // Add to group and array
            this.windStreakGroup.add(streak);
            this.windStreaks.push(streak);
        }
    }
    
    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
        
        // Update composer size
        if (this.composer) {
            this.composer.setSize(this.width, this.height);
        }
    }
    
    onMouseMove(event) {
        // Only update target mouse position if not boosting and no keyboard direction keys are pressed
        if (!this.isMouseDown && !this.keys.left && !this.keys.right && !this.keys.down) {
            // Update target mouse position for smooth movement
            this.targetMouse.x = (event.clientX / this.width) * 2 - 1;
            this.targetMouse.y = -(event.clientY / this.height) * 2 + 1;
        }
        
        // Check if mouse is over the canvas area
        const rect = this.container.getBoundingClientRect();
        this.isMouseOverCanvas = (
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        );
    }
    
    onMouseDown(event) {
        // Left click for speed boost
        if (event.button === 0) {
            // Record boost start time if not already boosting
            if (!this.isMouseDown) {
                this.boostStartTime = this.clock.getElapsedTime();
                this.isUltraBoost = false;
            }
            
            this.isMouseDown = true;
            
            // Create a visual indicator for speed boost
            this.createSpeedBoostIndicator();
        }
        // Right click for orbit
        else if (event.button === 2) {
            this.startOrbiting(event);
        }
    }
    
    onMouseUp(event) {
        // Handle speed boost release
        if (this.isMouseDown) {
            this.isMouseDown = false;
            this.isUltraBoost = false;
            
            // Remove the speed boost indicator
            this.removeSpeedBoostIndicator();
        }
        
        // Handle orbit release
        if (this.isOrbiting) {
            this.isOrbiting = false;
        }
    }
    
    createSpeedBoostIndicator() {
        // Show indicator on both homepage and ethereal page
        
        // Remove existing indicator if any
        this.removeSpeedBoostIndicator();
        
        // Create a DOM element to show the mode
        const indicator = document.createElement('div');
        indicator.className = 'speed-boost-indicator';
        indicator.style.position = 'fixed';
        
        // Always position at the bottom right
        indicator.style.bottom = '24px';
        indicator.style.right = '24px';
        
        indicator.style.padding = '8px 12px';
        indicator.style.background = 'rgba(0, 0, 0, 0.5)';
        indicator.style.color = '#fff';
        indicator.style.borderRadius = '999px';
        indicator.style.fontFamily = 'sans-serif';
        indicator.style.fontSize = '12px';
        indicator.style.fontWeight = 'bold';
        indicator.style.zIndex = '1000';
        indicator.style.transition = 'opacity 0.3s ease';
        
        // Initialize with empty text and hidden (will be updated by updateSpeedBoostIndicator)
        indicator.textContent = '';
        indicator.style.opacity = '0';
        
        document.body.appendChild(indicator);
        this.speedBoostIndicator = indicator;
        
        // Create mobile-specific boost indicator if on mobile
        if (this.isMobile) {
            // We no longer need a mobile boost indicator
        }
    }
    
    removeSpeedBoostIndicator() {
        if (this.speedBoostIndicator) {
            document.body.removeChild(this.speedBoostIndicator);
            this.speedBoostIndicator = null;
        }
    }
    
    updateSpeedBoostIndicator() {
        if (this.speedBoostIndicator) {
            // Update mode based on current state
            if (this.isUltraBoost) {
                this.mode = '⚡️ HYPERDIMENSIONAL';
            } else if (this.speedBoost > 1.0) {
                this.mode = '🚀 BOOST...';
            } else {
                this.mode = 'NORMAL';
            }
            
            // Hide indicator in normal mode, show in other modes
            if (this.mode === 'NORMAL') {
                this.speedBoostIndicator.style.opacity = '0';
            } else {
                // Update text with current mode (without "MODE:" label)
                this.speedBoostIndicator.textContent = this.mode;
                this.speedBoostIndicator.style.opacity = '1';
                
                // Change color based on mode
                let hue;
                if (this.mode === 'ULTRA BOOST') {
                    // Purple to red for ultra boost
                    hue = 280 - ((this.speedBoost - this.maxSpeedBoost) / (this.ultraBoostMaxSpeed - this.maxSpeedBoost)) * 280;
                } else if (this.mode === 'BOOST') {
                    // Blue to purple for normal boost
                    hue = 240 - (this.speedBoost / this.maxSpeedBoost) * 60;
                }
                
                this.speedBoostIndicator.style.color = `hsl(${hue}, 100%, 70%)`;
            }
        }
    }
    
    onMouseClick(event) {
        // Only respond to clicks if mouse is over the canvas
        if (!this.isMouseOverCanvas) return;
        
        // Create a burst of particles on click
        const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        vector.unproject(this.camera);
        
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        // Add a light flash at click position
        const flashLight = new THREE.PointLight(0xffffff, 2, 200);
        flashLight.position.copy(pos);
        this.scene.add(flashLight);
        
        // Animate the flash
        const startTime = this.clock.getElapsedTime();
        const flashAnimation = () => {
            const elapsed = this.clock.getElapsedTime() - startTime;
            if (elapsed < 1) {
                flashLight.intensity = 2 * (1 - elapsed);
                requestAnimationFrame(flashAnimation);
            } else {
                this.scene.remove(flashLight);
            }
        };
        
        flashAnimation();
    }
    
    updateParticles() {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        const opacities = this.particleSystem.geometry.attributes.opacity.array;
        const streaks = this.particleSystem.geometry.attributes.streak.array;
        
        // Get current time
        const currentTime = this.clock.getElapsedTime();
        
        // Check for ultra boost activation from mouse
        if ((this.isMouseDown || this.isKeyboardBoosting) && !this.isUltraBoost) {
            const boostDuration = currentTime - this.boostStartTime;
            
            // If boosting for more than the threshold, activate ultra boost
            if (boostDuration >= this.ultraBoostThreshold) {
                this.activateUltraBoost();
            }
        }
        
        // Update speed boost based on mouse down or keyboard up key state
        if (this.isMouseDown || this.isKeyboardBoosting) {
            // Determine max speed based on ultra boost state
            const maxSpeed = this.isUltraBoost ? this.ultraBoostMaxSpeed : this.maxSpeedBoost;
            
            // Increase speed boost when boosting
            this.speedBoost = Math.min(this.speedBoost + this.speedBoostIncrement, maxSpeed);
            
            // Only increase glitch intensity when in ultra boost mode
            if (this.isUltraBoost) {
                this.glitchIntensity = Math.min(this.glitchIntensity + this.glitchIncrement, this.maxGlitchIntensity);
            } else {
                // Keep glitch intensity at 0 during regular boost
                this.glitchIntensity = 0;
            }
        } else {
            // Gradually decrease speed boost when not boosting
            this.speedBoost = Math.max(this.speedBoost - this.speedBoostDecrement, 1.0);
            
            // Decrease glitch intensity when not boosting
            this.glitchIntensity = Math.max(this.glitchIntensity - this.glitchDecrement, 0.0);
        }
        
        // Update the speed boost indicator
        this.updateSpeedBoostIndicator();
        
        // Calculate streak factor based on speed boost
        // Only add streaks when speed is above normal
        const streakFactor = Math.max(0, (this.speedBoost - 1.0) / (this.ultraBoostMaxSpeed - 1.0));
        
        // Smoothly interpolate mouse position for more natural movement
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * this.mouseInterpolationSpeed;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * this.mouseInterpolationSpeed;
        
        // Convert mouse coordinates to world space
        const mouseVector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        mouseVector.unproject(this.camera);
        const dir = mouseVector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.z / dir.z;
        const mousePos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        // Define the space boundaries for resetting particles
        const spaceWidth = this.width * 4;
        const spaceHeight = this.height * 4;
        const spaceDepth = 2000;
        
        // Get elapsed time for smooth animation - but don't slow down too much
        const deltaTime = this.clock.getDelta();
        // Ensure minimum movement even at low frame rates
        const timeScale = Math.max(Math.min(deltaTime * 60, 2), 0.5);
        
        // Gradually decay scroll momentum
        this.scrollMomentum *= this.scrollMomentumDecay;
        if (Math.abs(this.scrollMomentum) < 0.001) {
            this.scrollMomentum = 0;
            this.scrollDirection = 0;
        }
        
        // Update particle positions
        for (let i = 0; i < this.particles.length; i++) {
            const ix = i * 3;
            const particle = this.particles[i];
            
            // Move particle towards the viewer (positive Z) with time scaling and speed boost
            // Adjust direction based on scroll direction
            const boostedSpeed = particle.speed * this.speedBoost;
            
            // Apply scroll direction to particle movement
            // When scrolling down, particles move away (negative Z)
            // When scrolling up, particles move towards viewer (positive Z)
            // When not scrolling, particles move towards viewer at normal speed
            let movementDirection = 1; // Default direction (towards viewer)
            
            if (this.scrollDirection !== 0) {
                // Apply scroll momentum to movement direction
                // This creates a smooth transition between scroll directions
                movementDirection = -this.scrollDirection;
            }
            
            // Apply the movement with direction
            positions[ix + 2] += Math.max(boostedSpeed * timeScale, boostedSpeed * 0.5) * movementDirection;
            
            // Calculate dynamic size based on Z position
            // Particles get larger as they get closer
            const distanceFromCamera = Math.abs(positions[ix + 2]);
            const maxDistance = spaceDepth;
            // Adjusted size scaling for better visibility
            const sizeScale = 1 + (1 - (distanceFromCamera / maxDistance)) * 2.5;
            sizes[particle.index] = particle.originalSize * sizeScale;
            
            // Set streak length based on speed boost and particle's own speed
            // Faster particles get longer streaks
            const particleSpeedFactor = particle.speed / 10; // Normalize speed to 0-1 range
            streaks[particle.index] = streakFactor * (1.0 + particleSpeedFactor);
            
            // Calculate dynamic opacity based on Z position with smoother transitions
            // Particles fade in as they approach and fade out as they pass
            let opacityScale = 1;
            if (positions[ix + 2] < -1500) {
                // Fade in as they approach from far away (smoother transition)
                opacityScale = 1 - Math.min(1, (Math.abs(positions[ix + 2]) - 1500) / 500);
            } else if (positions[ix + 2] > 300) {
                // Fade out as they get too close and pass by (adjusted for better visibility)
                opacityScale = 1 - Math.min(1, (positions[ix + 2] - 300) / 300);
            }
            opacities[particle.index] = particle.originalOpacity * opacityScale;
            
            // Reset particle if it goes too far in either direction
            if (positions[ix + 2] > 600) {
                // Reset to a new random position far away (behind camera)
                positions[ix] = particle.originalX;
                positions[ix + 1] = particle.originalY;
                positions[ix + 2] = -spaceDepth; // Far behind the camera
            } else if (positions[ix + 2] < -spaceDepth) {
                // Reset to a position in front of the camera if it goes too far back
                positions[ix] = particle.originalX;
                positions[ix + 1] = particle.originalY;
                positions[ix + 2] = 500; // In front of the camera
            }
            
            // Apply parallax effect based on mouse position
            // Particles closer to the camera (higher Z) move more with the mouse
            const parallaxFactor = this.parallaxStrength * (1 - (Math.abs(positions[ix + 2]) / spaceDepth));
            positions[ix] = particle.originalX + (this.mouse.x * 600 * parallaxFactor);
            positions[ix + 1] = particle.originalY + (this.mouse.y * 600 * parallaxFactor);
            
            // Check distance to mouse for interaction
            const particlePos = new THREE.Vector3(positions[ix], positions[ix + 1], positions[ix + 2]);
            const distanceToMouse = particlePos.distanceTo(mousePos);
            
            if (distanceToMouse < this.mouseRadius) {
                // Calculate influence (1 at center, 0 at radius)
                const influence = 1 - (distanceToMouse / this.mouseRadius);
                
                // Move away from mouse in X and Y directions
                const direction = new THREE.Vector3().subVectors(particlePos, mousePos).normalize();
                positions[ix] += direction.x * influence * 4;
                positions[ix + 1] += direction.y * influence * 4;
                
                // Slightly slow down particles when near mouse
                particle.speed = particle.originalSpeed * (1 - influence * 0.2);
            } else {
                // Reset to original speed
                particle.speed = particle.originalSpeed;
            }
        }
        
        // Update geometry attributes
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
        this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
        this.particleSystem.geometry.attributes.streak.needsUpdate = true;
    }
    
    animate() {
        // Request next animation frame
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        // Get current time
        const currentTime = Date.now();
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update camera FOV based on speed boost
        this.updateFOV();
        
        // Update camera rotation
        this.updateRotation();
        
        // Update camera rotation from keyboard controls
        this.updateCameraRotation();
        
        // Update particles
        this.updateParticles();
        
        // Update the speedBoost uniform in the particle shader
        if (this.particleMaterial && this.particleMaterial.uniforms) {
            this.particleMaterial.uniforms.speedBoost.value = this.speedBoost;
        }
        
        // Update wind streaks
        this.updateWindStreaks();
        
        // Update foggy clouds if they exist
        if (this.foggyClouds) {
            this.updateFoggyClouds(currentTime);
        }
        
        // Smoothly interpolate mouse position for camera movement
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * this.mouseInterpolationSpeed;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * this.mouseInterpolationSpeed;
        
        // Apply mouse position to camera for parallax effect only if not using keyboard controls
        const keyboardActive = this.keys.left || this.keys.right || this.keys.down;
        if (!keyboardActive) {
            // Scale effect based on speed boost for more dramatic movement at high speeds
            const parallaxMultiplier = 1.0 + (this.speedBoost - 1.0) * 0.5;
            this.camera.position.x = -this.mouse.x * this.parallaxStrength * parallaxMultiplier;
            this.camera.position.y = -this.mouse.y * this.parallaxStrength * parallaxMultiplier;
        }
        
        // Update vignette effect
        this.updateVignetteEffect();
        
        // Update glitch effect
        this.updateGlitchEffect(currentTime);
        
        // Update shake effect
        this.updateShakeEffect(currentTime);
        
        // Apply shake to camera
        this.applyShake();
        
        // Update mode indicator
        this.updateSpeedBoostIndicator();
        
        // Render the scene
        this.composer.render();
    }

    updateGlitchEffect(currentTime) {
        // Only process glitch if we have the glitch pass
        if (!this.glitchPass) return;
        
        // If we're boosting (glitch intensity > 0)
        if (this.glitchIntensity > 0.01) {
            // Enable the glitch pass
            this.glitchPass.enabled = true;
            
            // Check if it's time for a new glitch
            if (currentTime - this.lastGlitchTime > this.glitchInterval) {
                // Trigger a glitch
                this.isGlitching = true;
                this.lastGlitchTime = currentTime;
                
                // Set glitch intensity based on speed boost, but with a more subtle approach
                // This makes the glitch effect less jarring but still noticeable
                const normalizedIntensity = this.glitchIntensity / this.maxGlitchIntensity;
                
                // Apply glitch parameters
                if (this.glitchPass.uniforms) {
                    // Scale the amount of RGB shift based on intensity
                    this.glitchPass.uniforms.amount.value = 0.005 + normalizedIntensity * 0.02;
                    
                    // Adjust other glitch parameters for a more controlled effect
                    this.glitchPass.uniforms.seed.value = Math.random() * normalizedIntensity;
                    this.glitchPass.uniforms.distortion_x.value = 0.1 + normalizedIntensity * 0.4;
                    this.glitchPass.uniforms.distortion_y.value = 0.1 + normalizedIntensity * 0.4;
                    this.glitchPass.uniforms.col_s.value = 0.1 + normalizedIntensity * 0.2;
                }
                
                // Add a small chance to skip the next glitch opportunity
                // This creates more natural, less predictable glitching
                if (Math.random() < 0.3) {
                    this.lastGlitchTime += this.glitchInterval * 0.5;
                }
            }
        } else {
            // Disable glitch pass when not boosting
            this.glitchPass.enabled = false;
        }
    }

    updateFOV() {
        // Calculate target FOV based on speed boost and ultra boost state
        let targetFOV;
        
        if (this.isUltraBoost) {
            // Use wider FOV for ultra boost
            const ultraBoostFactor = (this.speedBoost - this.maxSpeedBoost) / (this.ultraBoostMaxSpeed - this.maxSpeedBoost);
            const ultraBoostFOVRange = this.ultraBoostFOV - this.maxFOV;
            targetFOV = this.maxFOV + ultraBoostFOVRange * Math.min(1, Math.max(0, ultraBoostFactor));
        } else {
            // Regular FOV calculation for normal boost
            const speedFactor = Math.min(1, Math.max(0, (this.speedBoost - 1.0) / (this.maxSpeedBoost - 1.0)));
            targetFOV = this.baseFOV + (this.maxFOV - this.baseFOV) * speedFactor;
        }
        
        // Smoothly interpolate current FOV towards target
        // Use faster interpolation for ultra boost for more dramatic effect
        const interpolationSpeed = this.isUltraBoost ? this.fovInterpolationSpeed * 1.5 : this.fovInterpolationSpeed;
        this.currentFOV += (targetFOV - this.currentFOV) * interpolationSpeed;
        
        // Apply the new FOV to the camera
        this.camera.fov = this.currentFOV;
        this.camera.updateProjectionMatrix();
    }

    updateRotation() {
        // Update rotation speed based on boost state
        if (this.speedBoost > 1.1) { // Only start spinning after a slight boost
            // Gradually increase rotation speed, proportional to boost level
            const boostFactor = (this.speedBoost - 1.1) / (this.maxSpeedBoost - 1.1);
            this.rotationSpeed = Math.min(
                this.rotationSpeed + this.rotationAcceleration * boostFactor,
                this.maxRotationSpeed * boostFactor
            );
        } else {
            // Gradually decrease rotation speed
            this.rotationSpeed = Math.max(this.rotationSpeed - this.rotationDeceleration, 0);
        }
        
        // Update rotation angle
        this.rotation += this.rotationSpeed;
        
        // Apply rotation to scene for a more noticeable effect
        // Use both Z and X rotation for a more dynamic effect
        const zRotation = Math.sin(this.rotation) * this.rotationAmplitude;
        const xRotation = Math.cos(this.rotation * 0.7) * (this.rotationAmplitude * 0.4); // Smaller X rotation
        
        // Apply rotations
        this.scene.rotation.z = zRotation;
        this.scene.rotation.x = xRotation;
        
        // Add a slight Y rotation for more dynamism
        if (this.rotationSpeed > 0) {
            // Gradually increase Y rotation based on speed
            const yRotationTarget = this.rotationSpeed * 20; // Amplify the effect
            
            // Apply Y rotation more directly during boost for more consistent effect
            if (this.isMouseDown) {
                this.scene.rotation.y += yRotationTarget * 0.01;
            } else {
                this.scene.rotation.y += (yRotationTarget - this.scene.rotation.y) * 0.01;
            }
        } else {
            // Gradually reset Y rotation
            this.scene.rotation.y *= 0.98;
        }
        
        // Apply additional rotation based on scroll direction
        if (this.scrollDirection !== 0) {
            // Add a slight tilt in the direction of scrolling
            // When scrolling down, tilt forward (negative X rotation)
            // When scrolling up, tilt backward (positive X rotation)
            const scrollTilt = this.scrollDirection * 0.002;
            this.scene.rotation.x += scrollTilt;
        }
    }

    updateWindStreaks() {
        // Calculate wind streak visibility based on speed boost
        const streakVisibility = Math.max(0, (this.speedBoost - 1.5) / (this.maxSpeedBoost - 1.5));
        
        // Update each wind streak
        for (let i = 0; i < this.windStreaks.length; i++) {
            const streak = this.windStreaks[i];
            
            // Move streak forward (towards camera)
            streak.position.z += streak.userData.speed * (1 + streakVisibility * 2);
            
            // Apply parallax effect based on mouse position
            const parallaxFactor = this.parallaxStrength * 2; // Stronger parallax for streaks
            streak.position.x = streak.userData.originalX + (this.mouse.x * 800 * parallaxFactor);
            streak.position.y = streak.userData.originalY + (this.mouse.y * 800 * parallaxFactor);
            
            // Set target opacity based on speed boost
            streak.userData.targetOpacity = streakVisibility * (0.3 + Math.random() * 0.2);
            
            // Smoothly interpolate opacity
            streak.userData.opacity += (streak.userData.targetOpacity - streak.userData.opacity) * 0.1;
            streak.material.opacity = streak.userData.opacity;
            
            // Reset streak if it passes the camera
            if (streak.position.z > 500) {
                streak.position.z = Math.random() * -1000 - 500;
                streak.userData.originalX = (Math.random() - 0.5) * this.width * 2;
                streak.userData.originalY = (Math.random() - 0.5) * this.height * 2;
                streak.position.x = streak.userData.originalX;
                streak.position.y = streak.userData.originalY;
                
                // Randomize rotation slightly
                streak.rotation.y = Math.random() * 0.2 - 0.1;
                streak.rotation.z = Math.random() * 0.2 - 0.1;
            }
        }
    }

    createVignetteEffect() {
        // Create a div for the vignette effect
        const vignette = document.createElement('div');
        vignette.className = 'vignette-effect';
        vignette.style.position = 'fixed';
        vignette.style.top = '0';
        vignette.style.left = '0';
        vignette.style.width = '100vw';
        vignette.style.height = '100vh';
        vignette.style.pointerEvents = 'none';
        vignette.style.zIndex = '2'; // Above canvas but below UI
        
        // Extract RGB components from the primary color hex
        const r = parseInt(this.vignetteColor.slice(1, 3), 16);
        const g = parseInt(this.vignetteColor.slice(3, 5), 16);
        const b = parseInt(this.vignetteColor.slice(5, 7), 16);
        
        vignette.style.boxShadow = `inset 0 0 150px rgba(${r}, ${g}, ${b}, 0)`; // Start transparent with primary color
        vignette.style.transition = 'box-shadow 0.3s ease';
        
        // Add to DOM
        document.body.appendChild(vignette);
        this.vignetteElement = vignette;
    }

    updateVignetteEffect() {
        if (!this.vignetteElement) return;
        
        // Calculate target vignette intensity based on speed boost
        const targetIntensity = Math.max(0, (this.speedBoost - 1.0) / (this.maxSpeedBoost - 1.0)) * this.maxVignetteIntensity;
        
        // Smoothly interpolate current intensity
        this.vignetteIntensity += (targetIntensity - this.vignetteIntensity) * 0.1;
        
        // Determine which color to use based on ultra boost state
        const currentColor = this.isUltraBoost ? this.vignetteUltraBoostColor : this.vignetteColor;
        
        // Apply vignette effect with the appropriate color
        const alpha = this.vignetteIntensity.toFixed(2);
        
        // Extract RGB components from the color hex
        const r = parseInt(currentColor.slice(1, 3), 16);
        const g = parseInt(currentColor.slice(3, 5), 16);
        const b = parseInt(currentColor.slice(5, 7), 16);
        
        this.vignetteElement.style.boxShadow = `inset 0 0 150px rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    updateShakeEffect(currentTime) {
        // Calculate shake intensity based on speed boost
        const speedFactor = Math.max(0, (this.speedBoost - this.shakeThreshold) / (this.maxSpeedBoost - this.shakeThreshold));
        
        // Apply shake at intervals
        if (speedFactor > 0 && currentTime - this.lastShakeTime > this.shakeInterval) {
            // Set new shake intensity
            this.shakeIntensity = this.maxShakeIntensity * speedFactor * (0.5 + Math.random() * 0.5);
            this.lastShakeTime = currentTime;
            
            // Apply shake to main content
            this.applyShake();
        } else {
            // Decay shake intensity
            this.shakeIntensity *= this.shakeDecay;
            
            // If shake is very small, reset it
            if (this.shakeIntensity < 0.1) {
                this.shakeIntensity = 0;
                
                // Reset content position if needed
                // Get all elements that might have been shaken
                const shakeableElements = document.querySelectorAll('header, h1, h2, .row-link > *');
                
                // Reset transform on all elements
                shakeableElements.forEach(element => {
                    // Skip the canvas container and its parents
                    if (element.contains(this.container)) return;
                    
                    // Reset transform
                    element.style.transform = '';
                });
            } else {
                // Apply decayed shake
                this.applyShake();
            }
        }
    }

    applyShake() {
        // Only apply shake if intensity is non-zero
        if (this.shakeIntensity <= 0) return;
        
        // Calculate random shake offset
        const shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
        const shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
        
        // Get all major content elements that should shake
        const shakeableElements = document.querySelectorAll('header, h1, h2, .row-link > *');
        
        // Apply shake to each element
        shakeableElements.forEach(element => {
            // Skip the canvas container and its parents to avoid affecting the animation
            if (element.contains(this.container)) return;
            
            // Apply shake to the element
            element.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        });
    }

    createUltraBoostEffect() {
        // Create a dramatic light flash effect to simulate passing the speed of light
        
        // 1. Create a blinding white flash that covers the entire screen
        const whiteFlash = document.createElement('div');
        whiteFlash.className = 'ultra-boost-white-flash';
        whiteFlash.style.position = 'fixed';
        whiteFlash.style.top = '0';
        whiteFlash.style.left = '0';
        whiteFlash.style.width = '100vw';
        whiteFlash.style.height = '100vh';
        whiteFlash.style.backgroundColor = 'rgba(21, 18, 30, 0)';
        whiteFlash.style.pointerEvents = 'none';
        whiteFlash.style.zIndex = '9999'; // Above everything
        whiteFlash.style.transition = 'background-color 0.05s ease-in, background-color 0.3s ease-out';
        
        // 2. Create a chromatic aberration effect (color separation)
        const chromaticAberration = document.createElement('div');
        chromaticAberration.className = 'ultra-boost-chromatic';
        chromaticAberration.style.position = 'fixed';
        chromaticAberration.style.top = '0';
        chromaticAberration.style.left = '0';
        chromaticAberration.style.width = '100vw';
        chromaticAberration.style.height = '100vh';
        chromaticAberration.style.pointerEvents = 'none';
        chromaticAberration.style.zIndex = '9998'; // Just below the white flash
        chromaticAberration.style.opacity = '0';
        chromaticAberration.style.transition = 'opacity 0.1s ease-in, opacity 0.5s ease-out';
        chromaticAberration.style.background = 'linear-gradient(90deg, rgba(255,80,255,0.3) -10%, transparent 30%, transparent 70%, rgba(0,0,255,0.3) 110%)';
        chromaticAberration.style.mixBlendMode = 'screen';
        
        // 3. Create a radial light burst from the center
        const lightBurst = document.createElement('div');
        lightBurst.className = 'ultra-boost-light-burst';
        lightBurst.style.position = 'fixed';
        lightBurst.style.top = '50%';
        lightBurst.style.left = '50%';
        lightBurst.style.transform = 'translate(-50%, -50%) scale(0)';
        lightBurst.style.width = '600px';
        lightBurst.style.height = '600px';
        lightBurst.style.borderRadius = '50%';
        lightBurst.style.boxShadow = '0 0 400px 400px rgba(220, 80, 255, 0.2)'; // Secondary color
        lightBurst.style.pointerEvents = 'none';
        lightBurst.style.zIndex = '9997'; // Below chromatic aberration
        lightBurst.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease-out';
        lightBurst.style.opacity = '0';
        lightBurst.style.filter = 'blur(8px)';
        
        // 4. Create a colored flash for the aftermath
        const coloredFlash = document.createElement('div');
        coloredFlash.className = 'ultra-boost-colored-flash';
        coloredFlash.style.position = 'fixed';
        coloredFlash.style.top = '0';
        coloredFlash.style.left = '0';
        coloredFlash.style.width = '100vw';
        coloredFlash.style.height = '100vh';
        coloredFlash.style.backgroundColor = 'rgba(21, 18, 30, 0)'; // Secondary color
        coloredFlash.style.pointerEvents = 'none';
        coloredFlash.style.zIndex = '9996'; // Below light burst
        coloredFlash.style.transition = 'background-color 0.2s ease-in, background-color 0.5s ease-out';
        
        // Add to DOM
        document.body.appendChild(whiteFlash);
        document.body.appendChild(chromaticAberration);
        document.body.appendChild(lightBurst);
        document.body.appendChild(coloredFlash);
        
        // Add a strong light to the scene
        const lightFlash = new THREE.PointLight(0xdc50ff, 0, 2000); // Secondary color light
        lightFlash.position.set(0, 0, 500);
        this.scene.add(lightFlash);
        
        // Sequence the animation for a dramatic effect
        
        // Step 1: Initial light burst from center
        setTimeout(() => {
            lightBurst.style.opacity = '1';
            lightBurst.style.transform = 'translate(-50%, -50%) scale(1)';
            lightFlash.intensity = 3;
            
            // Play a sound if available
            if (window.AudioContext || window.webkitAudioContext) {
                this.playUltraBoostSound();
            }
            
            // Add haptic feedback for mobile devices if supported
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 150]); // Vibration pattern
            }
        }, 0);
        
        // Step 2: Blinding white flash
        setTimeout(() => {
            whiteFlash.style.backgroundColor = 'rgba(220, 80, 255, 0.1)';
            chromaticAberration.style.opacity = '1';
            lightFlash.intensity = 5;
        }, 100);
        
        // Step 3: Transition to colored flash
        setTimeout(() => {
            whiteFlash.style.backgroundColor = 'rgba(115, 80, 255, 0)';
            coloredFlash.style.backgroundColor = 'rgba(21, 18, 30, 0.3)';
            lightBurst.style.opacity = '0';
            lightBurst.style.transform = 'translate(-50%, -50%) scale(2)';
            lightFlash.intensity = 2;
        }, 250);
        
        // Step 4: Fade everything out
        setTimeout(() => {
            chromaticAberration.style.opacity = '0';
            coloredFlash.style.backgroundColor = 'rgba(21, 18, 30, 0)';
            
            // Gradually reduce the light intensity
            const fadeLight = () => {
                lightFlash.intensity *= 0.9;
                if (lightFlash.intensity > 0.1) {
                    requestAnimationFrame(fadeLight);
                } else {
                    this.scene.remove(lightFlash);
                }
            };
            fadeLight();
            
            // Remove elements after animation
            setTimeout(() => {
                document.body.removeChild(whiteFlash);
                document.body.removeChild(chromaticAberration);
                document.body.removeChild(lightBurst);
                document.body.removeChild(coloredFlash);
            }, 500);
        }, 600);
        
        // Add more particles for ultra boost
        this.addUltraBoostParticles();
        
        // Add foggy clouds for ultra boost
        this.createFoggyClouds();
    }

    playUltraBoostSound() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            
            // Create oscillator for sound effect
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Configure oscillator
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // Start at A3
            oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // Ramp to A5
            
            // Configure gain (volume)
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Play sound
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported');
        }
    }

    addUltraBoostParticles() {
        // Add more wind streaks for ultra boost
        if (this.windStreaks && this.windStreaks.length > 0) {
            // Increase opacity of existing wind streaks
            for (let i = 0; i < this.windStreaks.length; i++) {
                const streak = this.windStreaks[i];
                streak.userData.targetOpacity *= 1.5;
            }
        }
    }
    
    // Create foggy clouds that fly by during ultra boost
    createFoggyClouds() {
        // Initialize foggy clouds array if it doesn't exist
        if (!this.foggyClouds) {
            this.foggyClouds = [];
        }
        
        // Number of clouds to create
        const numClouds = 8; // Reduced from 15 for a less dense effect
        
        // Use primary and secondary colors for the clouds
        const cloudColors = [
            new THREE.Color('#7350ff'), // Primary color (purple)
            new THREE.Color('#dc50ff'), // Secondary color (pink)
            new THREE.Color('#ffffff'), // White for contrast
            new THREE.Color('#7350ff').lerp(new THREE.Color('#ffffff'), 0.5), // Light primary
            new THREE.Color('#dc50ff').lerp(new THREE.Color('#ffffff'), 0.5)  // Light secondary
        ];
        
        // Create cloud geometries
        for (let i = 0; i < numClouds; i++) {
            // Create a cloud geometry (sphere with noise)
            // Increased size range for more dramatic effect
            const size = Math.random() * 300 + 200; // Random size between 200-500 (larger than before)
            
            // Create a sphere as the base for our cloud
            const geometry = new THREE.SphereGeometry(size, 8, 8);
            
            // Apply some random displacement to vertices to make it look more cloud-like
            const vertices = geometry.attributes.position;
            for (let j = 0; j < vertices.count; j++) {
                const x = vertices.getX(j);
                const y = vertices.getY(j);
                const z = vertices.getZ(j);
                
                // Apply noise to the vertex - increased for more fluffy clouds
                const noise = (Math.random() - 0.5) * size * 0.4;
                vertices.setX(j, x + noise);
                vertices.setY(j, y + noise);
                vertices.setZ(j, z + noise);
            }
            
            // Random color from cloud colors
            const colorIndex = Math.floor(Math.random() * cloudColors.length);
            const color = cloudColors[colorIndex];
            
            // Create material with transparency and glow
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0, // Start invisible
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            
            // Create mesh
            const cloud = new THREE.Mesh(geometry, material);
            
            // Random position (will be updated during animation)
            // Position clouds around the camera view
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1200 + 600; // Increased radius for more spread
            cloud.position.x = Math.cos(angle) * radius;
            cloud.position.y = Math.sin(angle) * radius;
            cloud.position.z = Math.random() * -2500 - 1500; // Start farther away
            
            // Store additional properties
            cloud.userData = {
                speed: Math.random() * 40 + 30, // Faster than before for more dramatic effect
                opacity: 0,
                targetOpacity: Math.random() * 0.4 + 0.15, // Slightly higher opacity
                rotationSpeed: (Math.random() - 0.5) * 0.015, // Slightly faster rotation
                creationTime: Date.now(),
                lifespan: Math.random() * 5000 + 3000 // Random lifespan between 3-8 seconds
            };
            
            // Add to scene and array
            this.scene.add(cloud);
            this.foggyClouds.push(cloud);
        }
    }
    
    // Update foggy clouds in the animation loop
    updateFoggyClouds(currentTime) {
        if (!this.foggyClouds || this.foggyClouds.length === 0) {
            return;
        }
        
        // Update each foggy cloud
        for (let i = this.foggyClouds.length - 1; i >= 0; i--) {
            const cloud = this.foggyClouds[i];
            
            // Move cloud forward (towards camera)
            cloud.position.z += cloud.userData.speed;
            
            // Rotate cloud slightly for more dynamic effect
            cloud.rotation.x += cloud.userData.rotationSpeed;
            cloud.rotation.y += cloud.userData.rotationSpeed * 0.7;
            
            // Smoothly interpolate opacity
            cloud.userData.opacity += (cloud.userData.targetOpacity - cloud.userData.opacity) * 0.05;
            cloud.material.opacity = cloud.userData.opacity;
            
            // Check if cloud has exceeded its lifespan
            const age = currentTime - cloud.userData.creationTime;
            if (age > cloud.userData.lifespan) {
                // Start fading out
                cloud.userData.targetOpacity = 0;
                
                // Remove cloud if it's almost invisible
                if (cloud.userData.opacity < 0.01) {
                    this.scene.remove(cloud);
                    this.foggyClouds.splice(i, 1);
                }
            }
            
            // Remove cloud if it passes the camera
            if (cloud.position.z > 1000) {
                this.scene.remove(cloud);
                this.foggyClouds.splice(i, 1);
            }
        }
        
        // If in ultra boost mode and clouds are running low, add more
        if (this.isUltraBoost && this.foggyClouds.length < 3) {
            this.createFoggyClouds();
        }
    }

    onScroll(event) {
        // Implement scroll direction detection
        if (event.deltaY > 0) {
            this.scrollDirection = 1; // Scroll down
        } else if (event.deltaY < 0) {
            this.scrollDirection = -1; // Scroll up
        }
        
        // Update scroll momentum
        this.scrollMomentum = (this.scrollDirection * 0.1) + (this.scrollMomentum * this.scrollMomentumDecay);
    }
    
    // Touch event handlers for mobile devices - document level (passive)
    onTouchStart(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            
            // Update mouse position for camera movement
            this.targetMouse.x = (touch.clientX / this.width) * 2 - 1;
            this.targetMouse.y = -(touch.clientY / this.height) * 2 + 1;
        }
    }
    
    onTouchMove(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            
            // Only update target mouse position if not boosting
            if (!this.isMouseDown) {
                this.targetMouse.x = (touch.clientX / this.width) * 2 - 1;
                this.targetMouse.y = -(touch.clientY / this.height) * 2 + 1;
            }
        }
    }
    
    onTouchEnd(event) {
        // This is handled by the canvas-specific handler
    }
    
    // Canvas-specific touch handlers (now passive)
    onCanvasTouchStart(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            
            // Store touch start time and position
            this.touchStartTime = this.clock.getElapsedTime() * 1000; // Convert to ms
            this.touchStartPosition = { 
                x: touch.clientX, 
                y: touch.clientY 
            };
            
            // Clear any existing timer
            if (this.touchBoostTimer) {
                clearTimeout(this.touchBoostTimer);
            }
            
            // Reset boost activation flag
            this.isBoostActivated = false;
            
            // Set a timer to activate boost after delay
            this.touchBoostTimer = setTimeout(() => {
                // Only activate if touch is still held and hasn't moved much
                if (event.touches.length > 0) {
                    const currentTouch = event.touches[0];
                    const distX = Math.abs(currentTouch.clientX - this.touchStartPosition.x);
                    const distY = Math.abs(currentTouch.clientY - this.touchStartPosition.y);
                    
                    // Only activate if the finger hasn't moved much (not scrolling)
                    if (distX < this.touchScrollThreshold && distY < this.touchScrollThreshold) {
                        // Record boost start time
                        this.boostStartTime = this.clock.getElapsedTime();
                        this.isMouseDown = true;
                        this.isUltraBoost = false;
                        this.isBoostActivated = true;
                        
                        // Temporarily disable scrolling on the canvas to prevent conflicts
                        this.renderer.domElement.style.touchAction = 'none';
                    }
                }
            }, this.touchBoostDelay);
            
            // Update mouse position for camera movement
            this.targetMouse.x = (touch.clientX / this.width) * 2 - 1;
            this.targetMouse.y = -(touch.clientY / this.height) * 2 + 1;
            
            // Set flag that we're over the canvas
            this.isMouseOverCanvas = true;
        }
    }
    
    onCanvasTouchMove(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            
            // Calculate distance moved
            const distX = Math.abs(touch.clientX - this.touchStartPosition.x);
            const distY = Math.abs(touch.clientY - this.touchStartPosition.y);
            
            // If significant movement detected before boost activates, cancel the boost
            if (!this.isBoostActivated && (distX > this.touchScrollThreshold || distY > this.touchScrollThreshold)) {
                // Clear the boost timer
                if (this.touchBoostTimer) {
                    clearTimeout(this.touchBoostTimer);
                    this.touchBoostTimer = null;
                }
                
                // Ensure boost is deactivated
                this.isMouseDown = false;
            }
            
            // Only update target mouse position if not boosting
            if (!this.isMouseDown) {
                this.targetMouse.x = (touch.clientX / this.width) * 2 - 1;
                this.targetMouse.y = -(touch.clientY / this.height) * 2 + 1;
            }
        }
    }
    
    onCanvasTouchEnd(event) {
        // Clear the boost timer
        if (this.touchBoostTimer) {
            clearTimeout(this.touchBoostTimer);
            this.touchBoostTimer = null;
        }
        
        // End boost on touch end
        if (this.isMouseDown) {
            this.isMouseDown = false;
            this.isUltraBoost = false;
        }
        
        // Reset boost activation flag
        this.isBoostActivated = false;
        
        // Re-enable scrolling on the canvas
        this.renderer.domElement.style.touchAction = 'pan-x pan-y';
        
        // Reset canvas hover state
        this.isMouseOverCanvas = false;
    }

    // Helper method to activate ultra boost
    activateUltraBoost() {
        this.isUltraBoost = true;
        
        // Immediately set glitch intensity to a noticeable level when ultra boost activates
        this.glitchIntensity = this.maxGlitchIntensity * 0.5;
        
        // Create a visual effect for ultra boost activation
        this.createUltraBoostEffect();
        
        // Update the speed boost indicator
        this.updateSpeedBoostIndicator();
        
        // Add haptic feedback for mobile devices if supported
        if (navigator.vibrate) {
            navigator.vibrate(200); // Vibrate for 200ms
        }
    }

    // Helper method to prevent text selection on mobile devices
    preventTextSelection() {
        if (this.isMobile) {
            // Create a style element for more targeted coverage
            const style = document.createElement('style');
            style.textContent = `
                /* Only prevent selection on the canvas */
                #etherealCanvas {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    -webkit-touch-callout: none;
                }
                
                /* Make sure the renderer doesn't interfere with scrolling */
                #etherealCanvas canvas {
                    touch-action: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                    -webkit-touch-callout: none;
                }
                
                /* Explicitly enable scrolling on the body */
                body {
                    touch-action: auto !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
            `;
            document.head.appendChild(style);
            
            // Add specific handling for iOS
            if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                // Add meta viewport tag to ensure proper scaling
                let viewportMeta = document.querySelector('meta[name="viewport"]');
                if (!viewportMeta) {
                    viewportMeta = document.createElement('meta');
                    viewportMeta.name = 'viewport';
                    document.head.appendChild(viewportMeta);
                }
                viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
                
                // Add a small delay to ensure styles are applied
                setTimeout(() => {
                    // Force body to be scrollable
                    document.body.style.overflow = 'auto';
                    document.body.style.webkitOverflowScrolling = 'touch';
                    
                    // Ensure the canvas doesn't interfere with scrolling
                    this.container.style.pointerEvents = 'none';
                    this.renderer.domElement.style.pointerEvents = 'auto';
                }, 100);
            }
        }
    }

    // Helper method to fix iOS scrolling issues
    fixIOSScrolling() {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
            // Create a dummy scrollable element to force iOS to allow scrolling
            const scrollFix = document.createElement('div');
            scrollFix.style.width = '100%';
            scrollFix.style.height = '101%'; // Slightly taller to ensure scrolling is possible
            scrollFix.style.position = 'absolute';
            scrollFix.style.top = '0';
            scrollFix.style.left = '0';
            scrollFix.style.pointerEvents = 'none';
            scrollFix.style.zIndex = '0';
            document.body.appendChild(scrollFix);
            
            // Force body to be scrollable
            document.body.style.height = 'auto';
            document.body.style.overflow = 'auto';
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // Add a small amount of content at the bottom to ensure scrolling works
            const spacer = document.createElement('div');
            spacer.style.height = '1px';
            spacer.style.width = '100%';
            spacer.style.clear = 'both';
            document.body.appendChild(spacer);
            
            // Periodically check and re-enable scrolling if needed
            setInterval(() => {
                document.body.style.overflow = 'auto';
                document.body.style.webkitOverflowScrolling = 'touch';
            }, 1000);
        }
    }

    // Add the missing startOrbiting method
    startOrbiting(event) {
        // Set orbiting flag
        this.isOrbiting = true;
        
        // Store initial mouse position for orbit calculations
        this.orbitStartX = event.clientX;
        this.orbitStartY = event.clientY;
        
        // Store current camera orbit angles
        this.cameraOrbitX = Math.atan2(
            this.camera.position.x,
            this.camera.position.z
        );
        
        this.cameraOrbitY = Math.atan2(
            this.camera.position.y,
            Math.sqrt(this.camera.position.x * this.camera.position.x + this.camera.position.z * this.camera.position.z)
        );
        
        // Store current camera distance
        this.cameraDistance = this.camera.position.length();
        
        // Store camera target (what we're orbiting around)
        this.cameraTargetX = this.scene.position.x;
        this.cameraTargetY = this.scene.position.y;
        this.cameraTargetZ = this.scene.position.z;
        
        // Prevent context menu from appearing on right click
        document.addEventListener('contextmenu', this.preventContextMenu);
    }
    
    // Helper method to prevent context menu
    preventContextMenu(event) {
        event.preventDefault();
        document.removeEventListener('contextmenu', this.preventContextMenu);
        return false;
    }

    // Handle keyboard key press
    onKeyDown(event) {
        // Prevent default behavior for arrow keys to avoid page scrolling
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
            event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
        }
        
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.keys.up = true;
                // Start boosting if not already
                if (!this.isKeyboardBoosting) {
                    this.isKeyboardBoosting = true;
                    this.boostStartTime = this.clock.getElapsedTime();
                    this.isUltraBoost = false;
                    this.createSpeedBoostIndicator();
                }
                break;
            case 'ArrowDown':
            case 's':
                this.keys.down = true;
                // Set target rotation for looking down (negative X rotation)
                this.targetCameraRotation.x = -this.maxCameraRotation.x;
                break;
            case 'ArrowLeft':
            case 'a':
                this.keys.left = true;
                // Set target rotation for looking left (positive Y rotation)
                this.targetCameraRotation.y = this.maxCameraRotation.y;
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = true;
                // Set target rotation for looking right (negative Y rotation)
                this.targetCameraRotation.y = -this.maxCameraRotation.y;
                break;
        }
    }
    
    // Handle keyboard key release
    onKeyUp(event) {
        // Prevent default behavior for arrow keys to avoid page scrolling
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
            event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
        }
        
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.keys.up = false;
                // Stop boosting if this was the key causing the boost
                if (this.isKeyboardBoosting) {
                    this.isKeyboardBoosting = false;
                    this.isUltraBoost = false;
                    this.removeSpeedBoostIndicator();
                }
                break;
            case 'ArrowDown':
            case 's':
                this.keys.down = false;
                if (!this.keys.up && !this.keys.left && !this.keys.right) {
                    // Reset vertical rotation when no direction keys are pressed
                    this.targetCameraRotation.x = 0;
                }
                break;
            case 'ArrowLeft':
            case 'a':
                this.keys.left = false;
                if (!this.keys.up && !this.keys.down && !this.keys.right) {
                    // Reset horizontal rotation when no direction keys are pressed
                    this.targetCameraRotation.y = 0;
                }
                break;
            case 'ArrowRight':
            case 'd':
                this.keys.right = false;
                if (!this.keys.up && !this.keys.down && !this.keys.left) {
                    // Reset horizontal rotation when no direction keys are pressed
                    this.targetCameraRotation.y = 0;
                }
                break;
        }
        
        // Adjust rotation if multiple keys are pressed
        if (this.keys.left && !this.keys.right) {
            this.targetCameraRotation.y = this.maxCameraRotation.y;
        } else if (this.keys.right && !this.keys.left) {
            this.targetCameraRotation.y = -this.maxCameraRotation.y;
        }
        
        if (this.keys.down && !this.keys.up) {
            this.targetCameraRotation.x = -this.maxCameraRotation.x;
        }
    }

    // Add a new method to update camera rotation
    updateCameraRotation() {
        // Smoothly interpolate current rotation towards target rotation
        this.cameraRotation.x += (this.targetCameraRotation.x - this.cameraRotation.x) * this.cameraRotationSpeed;
        this.cameraRotation.y += (this.targetCameraRotation.y - this.cameraRotation.y) * this.cameraRotationSpeed;
        
        // Apply rotation to camera
        // Reset camera rotation first
        this.camera.rotation.set(0, 0, 0);
        
        // Apply rotations in the correct order
        this.camera.rotateX(this.cameraRotation.x);
        this.camera.rotateY(this.cameraRotation.y);
    }
} 