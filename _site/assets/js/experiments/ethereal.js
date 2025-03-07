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
        this.parallaxStrength = 0.08;
        this.mouseInterpolationSpeed = 0.15;
        
        // Add scroll direction tracking
        this.scrollDirection = 0; // 0 = no scroll, 1 = down, -1 = up
        this.scrollMomentum = 0; // Momentum of scrolling
        this.scrollMomentumDecay = 0.95; // How quickly scroll momentum decays
        
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.mobileBoostIndicator = null;
        
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
        this.ultraBoostThreshold = 5.0; // Time in seconds before ultra boost
        this.isUltraBoost = false; // Whether ultra boost is active
        
        // FOV adjustment parameters - same for both pages now
        this.baseFOV = 75; // Default FOV
        this.maxFOV = 95; // Same maximum FOV for both pages
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
        
        // Shake effect parameters
        this.shakeIntensity = 0;
        this.maxShakeIntensity = 3; // Maximum shake in pixels
        this.shakeDecay = 0.9; // How quickly shake decays
        this.shakeThreshold = 1.5; // Speed boost threshold to start shaking
        this.lastShakeTime = 0;
        this.shakeInterval = 0.05; // How often to apply shake (in seconds)
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
        
        // Allow touch events to pass through on mobile
        // but still capture them for interaction
        this.renderer.domElement.style.pointerEvents = 'auto';
        this.renderer.domElement.style.touchAction = 'none'; // Prevent default touch actions like scrolling
        
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
        
        // Touch events for mobile - use specific touch handlers
        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
        document.addEventListener('touchcancel', this.onTouchEnd.bind(this), { passive: true });
    }
    
    setupPostProcessing() {
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
        const particleCount = 800;
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
                speedBoost: { value: 1.0 } // Add uniform for speed boost
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
                
                // Function to shift color towards red/orange based on speed
                vec3 shiftColor(vec3 color, float speedFactor) {
                    // Increase red component and decrease blue component based on speed
                    vec3 shiftedColor = color;
                    shiftedColor.r = min(1.0, color.r + speedFactor * 0.5);
                    shiftedColor.g = min(1.0, color.g + speedFactor * 0.3);
                    shiftedColor.b = max(0.0, color.b - speedFactor * 0.5);
                    return shiftedColor;
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
                    float speedFactor = clamp((speedBoost - 1.0) / 7.0, 0.0, 1.0);
                    
                    // Add enhanced glow effect with brighter center
                    vec3 baseColor = shiftColor(vColor, speedFactor);
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
                            vec3 streakColor = mix(baseColor, vec3(1.0, 0.8, 0.4), speedFactor * 0.8);
                            
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
        
        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particleSystem);
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
        // Only update target mouse position if not boosting
        if (!this.isMouseDown) {
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
        // Only show indicator on the ethereal page, not on the homepage
        if (this.isHomePage) return;
        
        // Remove existing indicator if any
        this.removeSpeedBoostIndicator();
        
        // Create a DOM element to show the speed boost
        const indicator = document.createElement('div');
        indicator.className = 'speed-boost-indicator';
        indicator.style.position = 'fixed';
        indicator.style.bottom = '20px';
        indicator.style.right = '20px';
        indicator.style.padding = '10px 15px';
        indicator.style.background = 'rgba(0, 0, 0, 0.5)';
        indicator.style.color = '#fff';
        indicator.style.borderRadius = '5px';
        indicator.style.fontFamily = 'sans-serif';
        indicator.style.fontSize = '14px';
        indicator.style.zIndex = '1000';
        indicator.style.transition = 'opacity 0.3s ease';
        indicator.textContent = 'SPEED: 1.0x';
        
        document.body.appendChild(indicator);
        this.speedBoostIndicator = indicator;
        
        // Create mobile-specific boost indicator if on mobile
        if (this.isMobile) {
            this.createMobileBoostIndicator();
        }
    }
    
    createMobileBoostIndicator() {
        // Remove existing mobile indicator if any
        this.removeMobileBoostIndicator();
        
        // Create a visual indicator for mobile users
        const mobileIndicator = document.createElement('div');
        mobileIndicator.className = 'mobile-boost-indicator';
        mobileIndicator.style.position = 'fixed';
        mobileIndicator.style.top = '50%';
        mobileIndicator.style.left = '50%';
        mobileIndicator.style.transform = 'translate(-50%, -50%)';
        mobileIndicator.style.width = '150px';
        mobileIndicator.style.height = '150px';
        mobileIndicator.style.borderRadius = '50%';
        mobileIndicator.style.border = '3px solid rgba(115, 80, 255, 0.7)';
        mobileIndicator.style.boxShadow = '0 0 20px rgba(115, 80, 255, 0.5)';
        mobileIndicator.style.pointerEvents = 'none';
        mobileIndicator.style.zIndex = '999';
        mobileIndicator.style.opacity = '0.7';
        
        // Add inner circle to show boost progress
        const innerCircle = document.createElement('div');
        innerCircle.className = 'mobile-boost-progress';
        innerCircle.style.position = 'absolute';
        innerCircle.style.top = '50%';
        innerCircle.style.left = '50%';
        innerCircle.style.transform = 'translate(-50%, -50%)';
        innerCircle.style.width = '0%';
        innerCircle.style.height = '0%';
        innerCircle.style.borderRadius = '50%';
        innerCircle.style.backgroundColor = 'rgba(115, 80, 255, 0.3)';
        innerCircle.style.transition = 'width 0.1s ease, height 0.1s ease, background-color 0.3s ease';
        
        mobileIndicator.appendChild(innerCircle);
        document.body.appendChild(mobileIndicator);
        
        this.mobileBoostIndicator = mobileIndicator;
        this.mobileBoostProgress = innerCircle;
    }
    
    removeMobileBoostIndicator() {
        if (this.mobileBoostIndicator) {
            document.body.removeChild(this.mobileBoostIndicator);
            this.mobileBoostIndicator = null;
            this.mobileBoostProgress = null;
        }
    }
    
    removeSpeedBoostIndicator() {
        if (this.speedBoostIndicator) {
            document.body.removeChild(this.speedBoostIndicator);
            this.speedBoostIndicator = null;
        }
        
        // Also remove mobile indicator
        this.removeMobileBoostIndicator();
    }
    
    updateSpeedBoostIndicator() {
        if (this.speedBoostIndicator) {
            // Update text with current speed
            const speedText = this.isUltraBoost ? 
                `ULTRA BOOST: ${this.speedBoost.toFixed(1)}x` : 
                `SPEED: ${this.speedBoost.toFixed(1)}x`;
            
            this.speedBoostIndicator.textContent = speedText;
            
            // Change color based on speed
            let hue;
            if (this.isUltraBoost) {
                // Purple to red for ultra boost
                hue = 280 - ((this.speedBoost - this.maxSpeedBoost) / (this.ultraBoostMaxSpeed - this.maxSpeedBoost)) * 280;
            } else {
                // Blue to purple for normal boost
                hue = 240 - (this.speedBoost / this.maxSpeedBoost) * 60;
            }
            
            this.speedBoostIndicator.style.color = `hsl(${hue}, 100%, 70%)`;
        }
        
        // Update mobile boost indicator if available
        if (this.mobileBoostProgress) {
            // Calculate progress percentage (0-100%)
            let progressPercent;
            
            if (this.isUltraBoost) {
                // For ultra boost, show progress from max boost to ultra boost max
                progressPercent = ((this.speedBoost - this.maxSpeedBoost) / (this.ultraBoostMaxSpeed - this.maxSpeedBoost)) * 100;
            } else {
                // For normal boost, show progress from 1 to max boost
                progressPercent = ((this.speedBoost - 1) / (this.maxSpeedBoost - 1)) * 100;
            }
            
            // Update size of inner circle
            this.mobileBoostProgress.style.width = `${Math.min(100, progressPercent)}%`;
            this.mobileBoostProgress.style.height = `${Math.min(100, progressPercent)}%`;
            
            // Change color based on boost level
            if (this.isUltraBoost) {
                this.mobileBoostProgress.style.backgroundColor = 'rgba(255, 50, 50, 0.5)';
                this.mobileBoostIndicator.style.border = '3px solid rgba(255, 50, 50, 0.7)';
                this.mobileBoostIndicator.style.boxShadow = '0 0 30px rgba(255, 50, 50, 0.6)';
            } else {
                this.mobileBoostProgress.style.backgroundColor = 'rgba(115, 80, 255, 0.3)';
                this.mobileBoostIndicator.style.border = '3px solid rgba(115, 80, 255, 0.7)';
                this.mobileBoostIndicator.style.boxShadow = '0 0 20px rgba(115, 80, 255, 0.5)';
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
        
        // Check for ultra boost activation
        if (this.isMouseDown && !this.isUltraBoost) {
            const boostDuration = currentTime - this.boostStartTime;
            
            // If boosting for more than the threshold, activate ultra boost
            if (boostDuration >= this.ultraBoostThreshold) {
                this.activateUltraBoost();
            }
        }
        
        // Update speed boost based on mouse down state
        if (this.isMouseDown) {
            // Determine max speed based on ultra boost state
            const maxSpeed = this.isUltraBoost ? this.ultraBoostMaxSpeed : this.maxSpeedBoost;
            
            // Increase speed boost when mouse is down
            this.speedBoost = Math.min(this.speedBoost + this.speedBoostIncrement, maxSpeed);
            
            // Increase glitch intensity when boosting
            this.glitchIntensity = Math.min(this.glitchIntensity + this.glitchIncrement, this.maxGlitchIntensity);
        } else {
            // Gradually decrease speed boost when mouse is up
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
        
        // Update each particle
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const ix = particle.index * 3;
            
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
        requestAnimationFrame(this.animate.bind(this));
        
        // Get current time
        const currentTime = this.clock.getElapsedTime();
        
        // Update time uniform for shaders
        if (this.particleSystem.material.uniforms) {
            this.particleSystem.material.uniforms.time.value = currentTime;
            // Update speed boost uniform
            this.particleSystem.material.uniforms.speedBoost.value = this.speedBoost;
        }
        
        // Update particles
        this.updateParticles();
        
        // Update FOV for zoom effect
        this.updateFOV();
        
        // Apply camera position based on orbit or mouse movement
        if (this.isOrbiting) {
            // Calculate camera position based on orbit angles
            const x = Math.sin(this.cameraOrbitX) * Math.cos(this.cameraOrbitY) * this.cameraDistance;
            const y = Math.sin(this.cameraOrbitY) * this.cameraDistance;
            const z = Math.cos(this.cameraOrbitX) * Math.cos(this.cameraOrbitY) * this.cameraDistance;
            
            // Apply camera position
            this.camera.position.set(x, y, z);
            
            // Look at the center
            this.camera.lookAt(this.cameraTargetX, this.cameraTargetY, this.cameraTargetZ);
        } else if (!this.isMouseDown) { // Only update camera position when not boosting
            // Apply subtle camera movement based on mouse position for 3D effect
            // Reduced camera movement speed for gentler effect
            this.camera.position.x += (this.mouse.x * 30 - this.camera.position.x) * 0.02;
            this.camera.position.y += (-this.mouse.y * 30 - this.camera.position.y) * 0.02;
            
            // Add a slight camera movement during rotation for enhanced effect
            if (this.rotationSpeed > 0) {
                // Calculate a slight offset based on rotation
                const offsetX = Math.sin(this.rotation * 2) * 5 * this.rotationSpeed / this.maxRotationSpeed;
                const offsetY = Math.cos(this.rotation * 1.5) * 5 * this.rotationSpeed / this.maxRotationSpeed;
                
                // Apply the offset to camera position
                this.camera.position.x += offsetX;
                this.camera.position.y += offsetY;
            }
            
            // Reset Z position when not orbiting
            this.camera.position.z += (1000 - this.camera.position.z) * 0.05;
            
            // Look at the center of the scene
            this.camera.lookAt(this.scene.position);
        } else {
            // When boosting, only look at the center of the scene without changing camera position
            this.camera.lookAt(this.scene.position);
        }
        
        // Handle glitch effect
        this.updateGlitchEffect(currentTime);
        
        // Update rotation based on speed boost
        this.updateRotation();
        
        // Update wind streaks
        this.updateWindStreaks();
        
        // Update vignette effect
        this.updateVignetteEffect();
        
        // Update shake effect
        this.updateShakeEffect(currentTime);
        
        // Render scene with post-processing
        if (this.composer) {
            this.composer.render();
        } else {
            // Fallback to regular rendering if composer isn't available
            this.renderer.render(this.scene, this.camera);
        }
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
                // Use a lower base factor and add randomness
                const randomFactor = Math.random() * 0.3 + 0.2; // Random factor between 0.2 and 0.5
                
                // Apply a curve to make the effect more gradual at lower speeds
                // and only get more intense at very high speeds
                const speedFactor = Math.pow(this.glitchIntensity / this.maxGlitchIntensity, 2);
                
                // Combine factors for final intensity
                this.glitchPass.factor = speedFactor * randomFactor;
                
                // Schedule the end of this glitch
                setTimeout(() => {
                    this.isGlitching = false;
                    this.glitchPass.factor = 0;
                }, this.glitchDuration * 1000);
                
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
        // Calculate target FOV based on speed boost
        const speedFactor = (this.speedBoost - 1.0) / (this.maxSpeedBoost - 1.0);
        const targetFOV = this.baseFOV + (this.maxFOV - this.baseFOV) * speedFactor;
        
        // Smoothly interpolate current FOV towards target
        this.currentFOV += (targetFOV - this.currentFOV) * this.fovInterpolationSpeed;
        
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
        vignette.style.boxShadow = `inset 0 0 150px rgba(115, 80, 255, 0)`; // Start transparent with primary color
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
        
        // Apply vignette effect with primary color
        const alpha = this.vignetteIntensity.toFixed(2);
        
        // Extract RGB components from the primary color hex
        const r = parseInt(this.vignetteColor.slice(1, 3), 16);
        const g = parseInt(this.vignetteColor.slice(3, 5), 16);
        const b = parseInt(this.vignetteColor.slice(5, 7), 16);
        
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
                if (document.body.style.transform !== '') {
                    document.body.style.transform = '';
                }
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
        
        // Find all main content elements except the canvas and its container
        const mainContent = document.querySelector('main');
        if (mainContent) {
            // Apply shake to main content
            mainContent.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        } else {
            // Fallback to body if main not found
            document.body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        }
    }

    createUltraBoostEffect() {
        // Create a flash effect to indicate ultra boost activation
        const flash = document.createElement('div');
        flash.className = 'ultra-boost-flash';
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.backgroundColor = 'rgba(220, 80, 255, 0.3)'; // Secondary color
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '3'; // Above vignette
        flash.style.opacity = '0';
        flash.style.transition = 'opacity 0.1s ease-in, opacity 0.5s ease-out';
        
        // Add to DOM
        document.body.appendChild(flash);
        
        // Trigger flash animation
        setTimeout(() => {
            flash.style.opacity = '1';
            
            // Play a sound if available
            if (window.AudioContext || window.webkitAudioContext) {
                this.playUltraBoostSound();
            }
            
            // Remove flash after animation
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(flash);
                }, 500);
            }, 100);
        }, 0);
        
        // Add more particles for ultra boost
        this.addUltraBoostParticles();
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
    
    // Touch event handlers for mobile devices
    onTouchStart(event) {
        // Prevent default behavior to avoid scrolling
        // event.preventDefault(); // Not needed with passive listeners
        
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            
            // Update mouse position for camera movement
            this.targetMouse.x = (touch.clientX / this.width) * 2 - 1;
            this.targetMouse.y = -(touch.clientY / this.height) * 2 + 1;
            
            // Check if touch is over the canvas area
            const rect = this.container.getBoundingClientRect();
            this.isMouseOverCanvas = (
                touch.clientX >= rect.left &&
                touch.clientX <= rect.right &&
                touch.clientY >= rect.top &&
                touch.clientY <= rect.bottom
            );
            
            // Start boost if touch is over canvas
            if (this.isMouseOverCanvas) {
                // Record boost start time if not already boosting
                if (!this.isMouseDown) {
                    this.boostStartTime = this.clock.getElapsedTime();
                    this.isUltraBoost = false;
                }
                
                this.isMouseDown = true;
                
                // Create a visual indicator for speed boost
                this.createSpeedBoostIndicator();
            }
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
            
            // Check if touch is still over the canvas area
            const rect = this.container.getBoundingClientRect();
            const stillOverCanvas = (
                touch.clientX >= rect.left &&
                touch.clientX <= rect.right &&
                touch.clientY >= rect.top &&
                touch.clientY <= rect.bottom
            );
            
            // If touch moved outside canvas, end boost
            if (this.isMouseDown && !stillOverCanvas) {
                this.isMouseDown = false;
                this.isUltraBoost = false;
                this.removeSpeedBoostIndicator();
            }
            
            this.isMouseOverCanvas = stillOverCanvas;
        }
    }
    
    onTouchEnd(event) {
        // End boost on touch end
        if (this.isMouseDown) {
            this.isMouseDown = false;
            this.isUltraBoost = false;
            
            // Remove the speed boost indicator
            this.removeSpeedBoostIndicator();
        }
    }

    // Helper method to activate ultra boost
    activateUltraBoost() {
        this.isUltraBoost = true;
        
        // Create a visual effect for ultra boost activation
        this.createUltraBoostEffect();
        
        // Update the speed boost indicator
        this.updateSpeedBoostIndicator();
        
        // Add haptic feedback for mobile devices if supported
        if (navigator.vibrate) {
            navigator.vibrate(200); // Vibrate for 200ms
        }
    }
} 