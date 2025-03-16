// Load Three.js and required libraries from CDN
const loadDependencies = async () => {
    // First load Three.js core
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
    
    // Then load dependencies in order
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js');
};

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
};

// Scene configuration options
const SCENE_CONFIG = {
    // Camera settings
    camera: {
        fov: 125, // Default FOV
        boostFov: 160, // FOV when boosting
        fovChangeSpeed: 2, // How quickly FOV changes when boosting/stopping
        near: 0.1,
        far: 10000, // Much larger far plane to see distant stars
        position: { x: 0, y: 24, z: 0 },
        movementSpeed: 0.3,
        waveMagnitude: { x: 0.5, y: 0 }, // Sine wave movement magnitude
        waveSpeed: { x: 0.5, y: 0 },  // Sine wave movement speed
        controls: {
            enabled: true,
            moveSpeed: 1.0,      // Base movement speed
            boostSpeed: 50.0,    // Much higher boost speed to reach 5000 m/s
            turnSpeed: 0.02,     // How fast to turn left/right
            autoMove: true,      // Whether to automatically move forward
            keyMapping: {
                forward: 'ArrowUp',
                backward: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight'
            },
            // Look control parameters
            rotationSpeed: 0.03,
            verticalRotationLimit: Math.PI / 2.5,  // Limit vertical rotation to avoid over-rotation
            acceleration: 0.05,    // Acceleration rate
            deceleration: 10.0   // Increased deceleration rate for faster slowdown
        }
    },
    
    // Scene colors and fog
    colors: {
        background: 0x000000, // Pure black background
        fog: 0x000000,       // Match fog to background
        fogDensity: 0.0,     // No fog
        ambient: {
            color: 0x101020, // Very dark ambient light
            intensity: 0.2   // Even lower intensity
        },
        directional: {
            color: 0x3366aa, // Keep cool light color
            intensity: 0.1   // Lower intensity
        }
    },
    
    // Grid settings
    grid: {
        size: 800,
        divisions: 400,
        mainColor: 0xff00ff,    // Changed to pink
        secondaryColor: 0x00ffff, // Cyan as secondary
        shader: {
            color1: [1.0, 0.2, 0.8], // Pink/magenta
            color2: [0.2, 0.8, 1.0], // Cyan/blue
            gridLines: 2,          // More grid lines
            pulseSpeed: 3.0,        // Faster pulse
            pathWidth: 20,          // Width of the glowing path
            pathIntensity: 2.0,     // Intensity of the path glow
            raceSpeed: 5.0,         // Speed of racing lines
            raceLength: 0.7,        // Length of racing effect
            raceDensity: 3.0        // Density of racing lines
        }
    },
    
    // City generation
    city: {
        size: 600,
        buildingCount: 200,
        neonStructureCount: 50,
        building: {
            maxHeight: 1200,
            minHeight: 50,
            maxWidth: 10,
            minWidth: 5
        }
    },
    
    // Post-processing
    postProcessing: {
        bloom: {
            strength: 1.2,    // Increased base bloom strength
            radius: 0.5,      // Increased base radius
            threshold: 0.3    // Lower threshold to catch more elements
        },
        glitch: {
            amount: 0.01,
            distortion: 1
        }
    },
    
    // Starfield configuration
    starfield: {
        stars: 10000,         // Number of stars
        size: 2000,         // Size of the star field
        starSize: 2.0,       // Much larger stars
        speed: 1.5,          // Faster movement speed for stars
        maxSpeed: 4.0,       // Maximum speed for closest stars
        colors: [
            0xFFFFFF,        // Pure white
            0xFFFFFF,        // More white
            0xFFFFFF,        // Even more white
            0x00FFFF,        // Pure cyan
            0xFF00FF,        // Pure magenta
            0xFFFF00         // Pure yellow
        ]
    },
    
    // Cloud configuration
    clouds: {
        count: 2000,          // Number of cloud particles
        height: 200,          // Average height of clouds
        heightVariation: 100, // Variation in cloud height
        size: 450,            // Size of cloud particles
        sizeVariation: 40,   // Variation in cloud size
        color: 0x9900ff,     // Base color (blue/purple)
        opacity: 0.05,        // Base opacity
        speed: 0.2,          // Movement speed
        area: {              // Area where clouds can appear
            width: 1200,
            depth: 1200
        }
    },
    
    // Warp dimension settings
    warp: {
        transitionDuration: 1.0, // Duration for entering warp
        exitDuration: 2.0,      // Longer duration for exiting warp
        boostThreshold: 3.0,
        effectPersistence: 0.2,  // How much of the effect remains after exiting warp
        normalDimension: {
            colors: {
                stars: [
                    0xFFFFFF, 0xFFFFFF, 0xFFFFFF,
                    0x00FFFF, 0xFF00FF, 0xFFFF00
                ],
                grid: {
                    main: 0xff00ff,
                    secondary: 0x00ffff,
                    shader: {
                        color1: [1.0, 0.2, 0.8],
                        color2: [0.2, 0.8, 1.0]
                    }
                }
            },
            bloom: {
                strength: 0.5,  // Increased normal bloom
                radius: 0.5,    // Increased normal radius
                threshold: 0.5  // Lower threshold for more bloom
            }
        },
        warpDimension: {
            colors: {
                stars: [
                    0xFF0000, 0xFF3300, 0xFF0066,
                    0x9900FF, 0x0033FF, 0x00FF99
                ],
                grid: {
                    main: 0x00ff33,
                    secondary: 0x3300ff,
                    shader: {
                        color1: [0.0, 1.0, 0.2],
                        color2: [0.2, 0.0, 1.0]
                    }
                }
            },
            bloom: {
                strength: 0.1,    // Even stronger bloom in warp
                radius: 0.5,      // Wider bloom radius
                threshold: 0.5     // Even lower threshold
            }
        }
    },
    
    // Marble configuration
    marbles: {
        count: 200,                // Number of marbles
        minRadius: 2.8,           // Minimum marble radius
        maxRadius: 4.0,           // Slightly smaller maximum radius for better grid alignment
        bounceHeight: 0.3,        // Reduced bounce height for smoother grid rolling
        bounceSpeed: 0.8,         // Increased bounce speed for more dynamic movement
        rollSpeed: 2.2,           // Increased roll speed
        gridAlignment: {          // New section for grid alignment settings
            snapThreshold: 0.5,   // How close to snap to grid lines
            lineWidth: 0.2,       // Visual width of grid lines for marbles to follow
            turnChance: 0.005     // Chance per frame to turn at intersections
        },
        spawnArea: {              // Area where marbles can spawn
            width: 400,
            depth: 400
        },
        lifecycle: {              // New section for marble lifecycle
            minLifespan: 15,      // Minimum lifespan in seconds
            maxLifespan: 45,      // Maximum lifespan in seconds
            fadeOutDuration: 2.0, // How long it takes to fade out when dying
            spawnDelay: 0.5,      // Delay between death and respawn
            spawnEffect: {        // Visual effect when spawning
                duration: 0.1,    // Duration of spawn effect
                expandScale: 1.5, // How much to expand during spawn
                glowMultiplier: 3.0 // How much brighter during spawn
            },
            deathEffect: {        // Visual effect when dying
                duration: 0.8,    // Duration of death effect
                pulseFrequency: 15.0, // Frequency of pulse when dying
                finalFlash: 2.0   // Intensity of final flash
            }
        },
        colors: [                 // Marble color palette - matched to grid colors
            0x00ffff,             // Cyan
            0xff00ff,             // Magenta
            0xffff00,             // Yellow
            0x00ff99,             // Mint
            0xff0066,             // Hot pink
            0x9900ff              // Purple
        ],
        physics: {
            gravity: 0.01,        // Reduced gravity for smoother movement
            friction: 0.995,      // Reduced friction for longer rolling
            restitution: 0.5      // Reduced bounciness
        },
        glow: {
            intensity: 1.0,       // Increased base glow intensity
            pulseSpeed: 0.8,      // Faster pulse for more dynamic appearance
            pulseAmount: 0.4      // Increased pulse amount
        },
        collision: {
            threshold: 3.0,       // Distance threshold for collision
            flashDuration: 0.5,   // How long collision flash lasts
            flashIntensity: 3.0,  // Increased intensity of collision flash
            rippleDuration: 1.0,  // How long ripple effect lasts
            rippleSize: 12.0      // Increased maximum size of ripple
        },
        warpEffect: {             // New section for warp dimension effects
            speedMultiplier: 2.0, // How much faster marbles move in warp
            glowMultiplier: 2.5,  // How much brighter marbles glow in warp
            colorShift: true      // Whether to shift colors in warp
        }
    },
    
    // Root structure configuration
    roots: {
        structure: {
            mainSegments: 100,          // Reduced from 225 for better performance
            branchProbability: 0.6,    // Slightly reduced to limit total branches
            maxBranchDepth: 3000,         // Drastically reduced from 300 to prevent exponential growth
            minSegmentLength: 20,      // Slightly shorter segments
            maxSegmentLength: 50,      // Reduced for more frequent regeneration
            pointsPerSegment: 8,       // Reduced from 20 for smoother performance
            startDepth: {              // Adjusted depth range for better visibility
                min: 15,
                max: 400
            },
            thickness: {
                main: 0.2,             // Increased main thickness for better visibility
                branchReduction: 0.6,  // Less aggressive reduction
                min: 0.1              // Slightly smaller minimum
            }
        },
        appearance: {
            colors: {
                primary: 0x000000,    // Base color black
                pulse: 0x000000,      // Pulse color black
                energy: 0x000000      // Energy flow color black
            },
            glow: {
                intensity: 0.5,       // Base glow intensity
                pulseIntensity: 0.8,  // Intensity during pulse
                edgeIntensity: 1.2    // Intensity of edge glow
            },
            animation: {
                pulseSpeed: 2.0,      // Speed of color pulse
                energyFlowSpeed: 3.0,  // Speed of energy flow effect
                movementSpeed: 0.5     // Speed of subtle movement
            },
            opacity: {
                base: 0.8,           // Base opacity
                edge: 0.2            // Additional opacity at edges
            }
        },
        physics: {
            regenerationDistance: 60,   // Reduced from 100 for more frequent regeneration
            verticalMovement: {
                amplitude: 0.02,       // Slightly increased for more visible movement
                frequency: 0.8         // Increased for more dynamic movement
            },
            branchAngles: {
                horizontal: 1.5,       // Reduced for less chaotic branching
                vertical: 0.8         // Reduced for less vertical spread
            }
        }
    },
    
    hud: {
        colors: {
            primary: 0x9900ff,     // Cyan for main elements
            pulse: 0xffffff,       // Magenta for pulse effects
        },
        opacity: {
            base: 0.3,            // Reduced base opacity for better visibility
            active: 0.6,          // Reduced active opacity for better balance
        },
        animation: {
            pulseSpeed: 2.0,      // Optimized pulse speed for smoother animation
            reactionSpeed: 0.3    // Speed of movement reactions
        },
        layout: {
            frameWidth: 0.15,     // Width of frame elements as % of screen
            barThickness: 4,      // Thin bars for sleek look
            curveRadius: 24,      // Radius for curved edges
            margin: 24            // Margin from screen edges in pixels
        },
        bars: {                   // Moved to root of hud config to match code access
            bottom: {
                height: 120,      // Height of bottom bar
                curve: 40         // Curve amount for bottom bar
            },
            side: {
                width: 80,        // Width of side bars
                stretch: 1.2      // Max stretch factor
            }
        }
    },

    // Add to SCENE_CONFIG
    groundFog: {
        particles: {
            count: 5000,
            size: {
                min: 50,
                max: 100
            },
            height: {
                min: -50,
                max: 0
            },
            speed: 1.2,
            area: {
                width: 2000,    // Increased area for better coverage
                depth: 2000     // Increased area for better coverage
            }
        },
        colors: {
            primary: 0x00ffff,    // Cyan base
            secondary: 0xff00ff,   // Magenta accent
            mix: 0.3              // Color mix factor
        },
        opacity: {
            base: 0.15,          // Slightly increased base opacity
            pulse: 0.05          // Reduced pulse for stability
        }
    },
};

class ExplorationAnimation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.clock = new THREE.Clock();
        this.citySize = SCENE_CONFIG.city.size;
        this.buildings = [];
        this.neonLights = [];
        this.rootStructures = []; // Add root structures array
        this.cameraSpeed = SCENE_CONFIG.camera.movementSpeed;
        this.time = 0;
        this.stars = null;
        this.skyGlow = null;
        this.starSpeeds = [];
        this.clouds = null;
        this.marbles = [];
        this.marbleCollisions = [];
        this.floatingArtifacts = [];
        this.groundFog = null;
        this.groundFogUniforms = null;
        this.fogParticles = [];
        
        // Controls state
        this.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            boost: false,
            direction: new THREE.Vector3(0, 0, -1),
            velocity: new THREE.Vector3(),
            // Look controls
            lookUp: false,
            lookDown: false,
            lookLeft: false,
            lookRight: false,
            // Add barrel roll controls
            rollLeft: false,
            rollRight: false,
            rollAngle: 0,
            rollSpeed: Math.PI * 2, // Full rotation speed
            rollDamping: 0.92, // Smooth damping
            // Initialize rotation
            rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
            rotationSpeed: SCENE_CONFIG.camera.controls.rotationSpeed,
            verticalRotationLimit: SCENE_CONFIG.camera.controls.verticalRotationLimit
        };
        
        this.boostTimer = 0;
        this.isWarping = false;
        this.warpTransition = 0; // 0 = normal dimension, 1 = warp dimension
        this.currentDimension = 'normal';
        this.hudElements = {};
        this.lastGlitchTime = 0;
    }

    init() {
        // Get the canvas element
        const canvas = document.getElementById('novaGridCanvas');
        
        // Create mobile controls if on mobile
        this.createMobileControls();
        
        // Create scene
        this.scene = new THREE.Scene();
        // No fog
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            SCENE_CONFIG.camera.fov, 
            window.innerWidth / window.innerHeight, 
            SCENE_CONFIG.camera.near, 
            SCENE_CONFIG.camera.far
        );
        this.camera.position.set(
            SCENE_CONFIG.camera.position.x,
            SCENE_CONFIG.camera.position.y,
            SCENE_CONFIG.camera.position.z
        );
        this.camera.lookAt(0, 0, -100);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(SCENE_CONFIG.colors.background);
        
        canvas.appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(
            SCENE_CONFIG.colors.ambient.color, 
            SCENE_CONFIG.colors.ambient.intensity
        );
        this.scene.add(ambientLight);
        
        const sunLight = new THREE.DirectionalLight(
            SCENE_CONFIG.colors.directional.color, 
            SCENE_CONFIG.colors.directional.intensity
        );
        sunLight.position.set(-10, 20, 10);
        this.scene.add(sunLight);
        
        // Create starfield before the grid
        this.createStarfield();
        
        // Create grid
        this.createGrid();
        
        // Create root structure before the city
        this.createRootStructure();
        
        // Create procedural city
        this.createProceduralCity();
        
        // Create atmospheric clouds
        this.createClouds();
        
        // Create energy marbles
        this.createMarbles();
        
        // Add floating artifacts
        this.createFloatingArtifacts();
        
        // Add post-processing
        this.setupPostProcessing();
        
        // Setup keyboard controls
        if (SCENE_CONFIG.camera.controls.enabled) {
            this.setupControls();
        }
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Create HUD after renderer setup
        this.createHUD();

        this.createGroundFog();  // Add after other scene elements
    }

    createStarfield() {
        // Create a simple star field with bright points
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const sizes = [];
        
        // Create a circular texture for stars
        const starTexture = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            // Create a radial gradient for soft circular stars
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
            
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        })();
        
        // Create stars in a sphere around origin (will be attached to camera)
        for (let i = 0; i < SCENE_CONFIG.starfield.stars; i++) {
            // Position stars in a sphere around the origin
            // Use spherical coordinates for better distribution
            const radius = SCENE_CONFIG.starfield.size * (0.2 + Math.random() * 0.8);
            const theta = Math.random() * Math.PI * 2; // Horizontal angle
            const phi = Math.acos((Math.random() * 2) - 1); // Vertical angle for uniform distribution
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            vertices.push(x, y, z);
            
            // Random color from config
            const color = new THREE.Color(
                SCENE_CONFIG.starfield.colors[
                    Math.floor(Math.random() * SCENE_CONFIG.starfield.colors.length)
                ]
            );
            
            colors.push(color.r, color.g, color.b);
            
            // Random size - some stars much larger than others
            const size = Math.random() < 0.05 ? 
                SCENE_CONFIG.starfield.starSize * (3 + Math.random() * 5) : 
                SCENE_CONFIG.starfield.starSize * (0.5 + Math.random() * 1.5);
            
            sizes.push(size);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // Create a point material for stars with circular texture
        const material = new THREE.PointsMaterial({
            size: SCENE_CONFIG.starfield.starSize,
            vertexColors: true,
            map: starTexture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true,
            depthWrite: false,
            depthTest: true
        });
        
        // Create the star field
        this.stars = new THREE.Points(geometry, material);
        this.stars.renderOrder = -1000; // Ensure it renders first
        
        // Create a container for the stars that will follow the camera
        this.starContainer = new THREE.Object3D();
        this.starContainer.add(this.stars);
        
        // Add the container to the scene
        this.scene.add(this.starContainer);
    }

    createGrid() {
        // Create a grid helper for the ground plane
        const gridSize = SCENE_CONFIG.grid.size;
        const gridDivisions = SCENE_CONFIG.grid.divisions;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, SCENE_CONFIG.grid.mainColor, SCENE_CONFIG.grid.secondaryColor);
        this.scene.add(gridHelper);
        
        // Create a custom shader material for the grid
        const gridMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                cameraPosCustom: { value: new THREE.Vector3() }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                uniform vec3 cameraPosCustom;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Simplex noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
                
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                    vec3 g;
                    g.x = a0.x * x0.x + h.x * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
                
                // Hash function for racing line pattern
                float hash(float n) {
                    return fract(sin(n) * 43758.5453);
                }
                
                void main() {
                    vec2 uv = vUv * 2.0 - 1.0;
                    
                    // Calculate distance from camera path (center line)
                    float pathDistance = abs(vPosition.x - cameraPosCustom.x);
                    
                    // Basic grid effect
                    float gridX = abs(fract(vPosition.x * float(${SCENE_CONFIG.grid.shader.gridLines}) - time * 0.1) - 0.5);
                    float gridZ = abs(fract(vPosition.z * float(${SCENE_CONFIG.grid.shader.gridLines}) - time * 0.5) - 0.5);
                    
                    // Noise distortion
                    float noise = snoise(vec2(vPosition.x * 0.05, vPosition.z * 0.05) + time * 0.2) * 0.1;
                    gridX += noise;
                    gridZ += noise;
                    
                    // Grid lines with z-lines more prominent (direction of travel)
                    float grid = min(gridX, gridZ * 0.5);
                    
                    // Pulse effect
                    float pulse = sin(time * float(${SCENE_CONFIG.grid.shader.pulseSpeed})) * 0.5 + 0.5;
                    
                    // Path effect - glowing path that follows camera x position
                    float pathWidth = float(${SCENE_CONFIG.grid.shader.pathWidth});
                    float pathGlow = smoothstep(pathWidth, 0.0, pathDistance);
                    pathGlow *= float(${SCENE_CONFIG.grid.shader.pathIntensity}); // Increase intensity
                    
                    // Racing lines effect - lines that appear to be generated as you move
                    float raceSpeed = float(${SCENE_CONFIG.grid.shader.raceSpeed});
                    float raceLength = float(${SCENE_CONFIG.grid.shader.raceLength});
                    float raceDensity = float(${SCENE_CONFIG.grid.shader.raceDensity});
                    
                    // Create racing lines along z-axis
                    float racingEffect = 0.0;
                    
                    // Create multiple racing lines
                    for (int i = 0; i < 5; i++) {
                        float lineOffset = float(i) / 5.0;
                        
                        // Create a unique seed for each line
                        float seed = hash(float(i) * 123.456 + vPosition.x * 0.1);
                        
                        // Calculate line position with some randomness
                        float lineX = mix(-pathWidth, pathWidth, seed);
                        
                        // Distance from this racing line
                        float lineDist = abs(vPosition.x - cameraPosCustom.x - lineX);
                        
                        // Racing effect - lines that move forward and fade
                        float z = vPosition.z;
                        float raceZ = mod(z + time * raceSpeed * (0.5 + seed * 0.5), raceDensity);
                        
                        // Create a line segment that fades at the end
                        float raceSegment = smoothstep(0.0, 0.1, raceZ) * smoothstep(raceDensity, raceDensity - raceLength, raceZ);
                        
                        // Only show racing effect if close to the line
                        float lineWidth = mix(0.5, 2.0, seed); // Vary line width
                        float lineStrength = smoothstep(lineWidth, 0.0, lineDist) * raceSegment;
                        
                        // Accumulate racing effect
                        racingEffect = max(racingEffect, lineStrength);
                    }
                    
                    // Flow effect - lines moving in z direction
                    float flowEffect = fract(vPosition.z * 0.05 - time * 2.0);
                    flowEffect = smoothstep(0.0, 0.2, flowEffect) * smoothstep(1.0, 0.8, flowEffect);
                    
                    // Colors
                    vec3 color1 = vec3(${SCENE_CONFIG.grid.shader.color1[0]}, ${SCENE_CONFIG.grid.shader.color1[1]}, ${SCENE_CONFIG.grid.shader.color1[2]});
                    vec3 color2 = vec3(${SCENE_CONFIG.grid.shader.color2[0]}, ${SCENE_CONFIG.grid.shader.color2[1]}, ${SCENE_CONFIG.grid.shader.color2[2]});
                    
                    // Mix colors based on position and time
                    vec3 color = mix(color1, color2, sin(vPosition.z * 0.01 + time) * 0.5 + 0.5);
                    
                    // Apply path effect - make path more pink/magenta
                    color = mix(color, vec3(1.0, 0.2, 0.8), pathGlow * pulse);
                    
                    // Apply racing effect - bright glowing lines
                    color = mix(color, vec3(1.0, 0.0, 1.0), racingEffect * 0.8);
                    
                    // Apply flow effect
                    color += vec3(1.0, 0.3, 0.8) * flowEffect * 0.3;
                    
                    // Apply grid effect
                    float gridIntensity = smoothstep(0.05, 0.0, grid);
                    color = mix(vec3(0.0, 0.0, 0.1), color, gridIntensity * (pulse * 0.3 + 0.7));
                    
                    // Add scanlines
                    float scanline = sin(vPosition.z * 100.0 + time * 10.0) * 0.05 + 0.95;
                    color *= scanline;
                    
                    // Add glow to racing lines
                    color += vec3(1.0, 0.0, 1.0) * racingEffect * 0.5;
                    
                    // Output final color with alpha based on grid and path
                    float alpha = gridIntensity * 0.7 + pathGlow * 0.3 + racingEffect * 0.5;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            depthWrite: false
        });
        
        // Create a plane for the grid shader
        const gridPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(gridSize * 2, gridSize * 2, 1, 1),
            gridMaterial
        );
        gridPlane.rotation.x = -Math.PI / 2;
        gridPlane.position.y = -0.1;
        this.scene.add(gridPlane);
        
        // Store the material for animation updates
        this.gridMaterial = gridMaterial;
    }

    createProceduralCity() {
        // Create building instances
        for (let i = 0; i < SCENE_CONFIG.city.buildingCount; i++) {
            this.createBuilding();
        }
        
        // Create floating neon structures
        for (let i = 0; i < SCENE_CONFIG.city.neonStructureCount; i++) {
            this.createNeonStructure();
        }
    }

    createBuilding() {
        // Use procedural noise to determine building properties
        const x = (Math.random() - 0.5) * this.citySize * 2;
        const z = (Math.random() - 0.5) * this.citySize * 2 - 50; // Bias towards negative z for camera path
        
        // Use simplex-like noise for height
        const seed = Math.sin(x * 0.1) * Math.cos(z * 0.1);
        const height = SCENE_CONFIG.city.building.minHeight + 
            Math.pow(Math.random(), 2) * (SCENE_CONFIG.city.building.maxHeight - SCENE_CONFIG.city.building.minHeight);
        const width = SCENE_CONFIG.city.building.minWidth + 
            Math.random() * (SCENE_CONFIG.city.building.maxWidth - SCENE_CONFIG.city.building.minWidth);
        const depth = SCENE_CONFIG.city.building.minWidth + 
            Math.random() * (SCENE_CONFIG.city.building.maxWidth - SCENE_CONFIG.city.building.minWidth);
        
        // Create geometry
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create custom shader material for the building with enhanced electric effects
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                emissiveColor: { value: new THREE.Color(
                    0.1 + Math.random() * 0.2, 
                    0.1 + Math.random() * 0.3, 
                    0.2 + Math.random() * 0.6
                ) },
                baseColor: { value: new THREE.Color(0x223366) }, // Lighter base color for buildings
                glitchIntensity: { value: 0.1 + Math.random() * 0.3 },
                warpFactor: { value: 0.0 } // New uniform for warp transition
            },
            vertexShader: `
                uniform float time;
                uniform float glitchIntensity;
                uniform float warpFactor;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                // Pseudo-random function
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vNormal = normal;
                    
                    // Apply glitch effect to vertex position
                    vec3 pos = position;
                    
                    // Glitch effect based on time and position
                    float glitch = random(vec2(floor(time * 2.0), floor(position.y * 10.0)));
                    if (glitch > 0.95) {
                        pos.x += sin(time * 20.0) * glitchIntensity;
                    }
                    
                    // Subtle wave motion
                    pos.x += sin(pos.y * 0.2 + time) * 0.05;
                    
                    // Add more distortion during warp
                    if (warpFactor > 0.0) {
                        float warpGlitch = random(vec2(floor(time * 5.0), floor(position.y * 20.0)));
                        if (warpGlitch > 0.8) {
                            pos += normal * sin(time * 30.0) * warpFactor * 0.2;
                        }
                    }
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 emissiveColor;
                uniform vec3 baseColor;
                uniform float glitchIntensity;
                uniform float warpFactor;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                // Pseudo-random function
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Calculate fresnel effect for edge glow
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = pow(1.0 - max(0.0, dot(viewDirection, normalize(vNormal))), 2.0);
                    
                    // Base color
                    vec3 color = baseColor;
                    
                    // Window pattern - more windows for evening
                    float windowX = step(0.85, fract(uv.x * 12.0));
                    float windowY = step(0.85, fract(uv.y * 24.0));
                    float window = windowX * windowY;
                    
                    // Random window lights - more lights on in evening
                    float windowRandom = random(vec2(floor(uv.x * 12.0), floor(uv.y * 24.0)));
                    float windowLight = step(0.4, windowRandom); // Lower threshold = more lights
                    
                    // Flickering effect
                    float flicker = sin(time * 10.0 * windowRandom) * 0.3 + 0.7; // Less flickering
                    
                    // Enhanced edge glow - stronger and more electric
                    float edgeX = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x);
                    float edgeY = smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
                    float edge = max(edgeX, edgeY); // Use max instead of multiplication for stronger edges
                    
                    // Electric pulse on edges
                    float electricPulse = sin(time * 5.0 + vPosition.y * 0.8) * 0.5 + 0.5;
                    
                    // Combine effects - brighter windows
                    color = mix(color, emissiveColor * 2.0, window * windowLight * flicker);
                    
                    // Add stronger edge glow with electric effect
                    vec3 edgeColor = mix(emissiveColor * 1.5, vec3(1.0, 1.0, 1.0), electricPulse * 0.5);
                    color = mix(color, edgeColor, edge * (0.7 + electricPulse * 0.3));
                    
                    // Add fresnel edge glow
                    color = mix(color, edgeColor * 1.5, fresnel * 0.7);
                    
                    // Glitch effect
                    float glitchLine = step(0.98, random(vec2(floor(time * 10.0), floor(uv.y * 50.0))));
                    if (glitchLine > 0.0) {
                        color = mix(color, vec3(1.0), 0.8 * glitchIntensity);
                        
                        // Horizontal displacement
                        uv.x += (random(vec2(time, uv.y)) - 0.5) * 0.1;
                    }
                    
                    // Add electric circuit pattern
                    float circuit = 0.0;
                    // Horizontal lines
                    circuit += step(0.98, sin(uv.y * 50.0 + sin(uv.x * 20.0) * 2.0));
                    // Vertical lines
                    circuit += step(0.98, sin(uv.x * 50.0 + sin(uv.y * 20.0) * 2.0));
                    // Add circuit pattern with electric color
                    color = mix(color, vec3(0.5, 0.8, 1.0), circuit * 0.7 * (0.5 + electricPulse * 0.5));
                    
                    // Enhance during warp
                    if (warpFactor > 0.0) {
                        // More intense colors during warp
                        color = mix(color, vec3(1.0, 0.2, 0.2), warpFactor * 0.5);
                        
                        // Add electric arcs during warp
                        float warpArc = step(0.97, sin(uv.y * 100.0 + time * 10.0) * sin(uv.x * 100.0 + time * 5.0));
                        color = mix(color, vec3(1.0, 0.5, 0.0), warpArc * warpFactor);
                        
                        // Increase overall brightness
                        color *= (1.0 + warpFactor * 0.5);
                    }
                    
                    // Scanlines - reduced for cleaner look
                    float scanline = sin(vPosition.y * 100.0 + time * 5.0) * 0.05 + 0.95;
                    color *= scanline;
                    
                    // Final alpha - make buildings more solid
                    float alpha = 0.5 + edge * 0.05;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, height / 2, z);
        
        // Add some rotation for variety
        building.rotation.y = Math.random() * Math.PI * 2;
        
        // Store reference for animation
        this.buildings.push({
            mesh: building,
            material: material,
            initialX: x,
            initialZ: z,
            speed: 0.01 + Math.random() * 0.05
        });
        
        this.scene.add(building);
    }

    createNeonStructure() {
        // Create a floating neon structure
        const geometryTypes = [
            new THREE.TorusGeometry(1 + Math.random() * 2, 0.2, 16, 100),
            new THREE.TetrahedronGeometry(1 + Math.random()),
            new THREE.OctahedronGeometry(1 + Math.random()),
            new THREE.IcosahedronGeometry(0.5 + Math.random())
        ];
        
        const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
        
        // Create neon material with custom shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(
                    Math.random() > 0.3 ? 0.8 + Math.random() * 0.2 : 0.0,
                    Math.random() > 0.3 ? 0.8 + Math.random() * 0.2 : 0.0,
                    Math.random() > 0.3 ? 0.8 + Math.random() * 0.2 : 0.0
                ) }
            },
            vertexShader: `
                uniform float time;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vNormal = normal;
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    
                    // Apply wave distortion
                    vec3 pos = position;
                    pos += normal * sin(pos.x * 5.0 + time) * 0.1;
                    pos += normal * cos(pos.y * 5.0 + time * 0.7) * 0.1;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Calculate fresnel effect for edge glow
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = dot(viewDirection, vNormal);
                    fresnel = pow(1.0 - fresnel, 3.0);
                    
                    // Pulse effect - more subtle for evening
                    float pulse = sin(time * 2.0) * 0.3 + 0.7;
                    
                    // Final color with edge glow - brighter
                    vec3 finalColor = color * (0.7 + pulse * 0.3);
                    finalColor += vec3(1.0) * fresnel * pulse;
                    
                    gl_FragColor = vec4(finalColor, 0.7 + fresnel * 0.3);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        const neon = new THREE.Mesh(geometry, material);
        
        // Position randomly in the scene
        const x = (Math.random() - 0.5) * SCENE_CONFIG.city.size * 2;
        const y = 5 + Math.random() * 20;
        const z = (Math.random() - 0.5) * SCENE_CONFIG.city.size * 2 - 50; // Bias towards negative z
        
        neon.position.set(x, y, z);
        
        // Store rotation speed for reference during warp transitions
        const rotationSpeed = (Math.random() - 0.5) * 0.02;
        
        // Store for animation
        this.neonLights.push({
            mesh: neon,
            material: material,
            initialY: y,
            initialX: x,
            initialZ: z,
            rotationSpeed: rotationSpeed,
            originalRotationSpeed: rotationSpeed, // Store original for reference
            floatSpeed: 0.2 + Math.random() * 0.5
        });
        
        this.scene.add(neon);
    }

    createClouds() {
        // Create a particle system for clouds
        const cloudGeometry = new THREE.BufferGeometry();
        const cloudCount = SCENE_CONFIG.clouds.count;
        
        // Arrays to store cloud particle data
        const positions = new Float32Array(cloudCount * 3);
        const sizes = new Float32Array(cloudCount);
        const colors = new Float32Array(cloudCount * 3);
        const opacities = new Float32Array(cloudCount);
        const speeds = new Float32Array(cloudCount);
        
        // Base cloud color
        const baseColor = new THREE.Color(SCENE_CONFIG.clouds.color);
        
        // Generate random cloud particles in a sphere around origin (will be attached to camera)
        for (let i = 0; i < cloudCount; i++) {
            // Position clouds in a flattened sphere around the origin
            const radius = SCENE_CONFIG.clouds.area.width * (0.2 + Math.random() * 0.8);
            const theta = Math.random() * Math.PI * 2; // Horizontal angle
            const phi = (Math.random() * 0.5 + 0.25) * Math.PI; // Limited vertical angle for flattened distribution
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            // Keep y position within cloud height range, but relative to origin
            const y = (Math.random() - 0.5) * SCENE_CONFIG.clouds.heightVariation;
            const z = radius * Math.sin(phi) * Math.sin(theta);
            
            // Store position
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            // Random size with variation
            sizes[i] = SCENE_CONFIG.clouds.size + (Math.random() - 0.5) * SCENE_CONFIG.clouds.sizeVariation;
            
            // Color with slight variation
            const colorVariation = 0.2;
            const color = new THREE.Color(
                baseColor.r + (Math.random() - 0.5) * colorVariation,
                baseColor.g + (Math.random() - 0.5) * colorVariation,
                baseColor.b + (Math.random() - 0.5) * colorVariation
            );
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            // Random opacity
            opacities[i] = SCENE_CONFIG.clouds.opacity * (0.5 + Math.random() * 0.5);
            
            // Random speed
            speeds[i] = SCENE_CONFIG.clouds.speed * (0.5 + Math.random());
        }
        
        // Set attributes
        cloudGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        cloudGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        cloudGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        cloudGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        // Create shader material for clouds
        const cloudMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                cloudTexture: { value: this.createCloudTexture() }
            },
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
                uniform sampler2D cloudTexture;
                uniform float time;
                
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    // Sample cloud texture
                    vec2 uv = gl_PointCoord;
                    vec4 texColor = texture2D(cloudTexture, uv);
                    
                    // Pulse effect
                    float pulse = sin(time * 0.5) * 0.1 + 0.9;
                    
                    // Final color
                    vec3 finalColor = vColor * pulse;
                    float finalOpacity = texColor.a * vOpacity;
                    
                    gl_FragColor = vec4(finalColor, finalOpacity);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Create the cloud particle system
        this.clouds = new THREE.Points(cloudGeometry, cloudMaterial);
        
        // Create a container for the clouds that will follow the camera
        this.cloudContainer = new THREE.Object3D();
        this.cloudContainer.add(this.clouds);
        
        // Position the cloud container at the appropriate height
        this.cloudContainer.position.y = SCENE_CONFIG.clouds.height;
        
        // Add the container to the scene
        this.scene.add(this.cloudContainer);
        
        // Store speeds for animation
        this.cloudSpeeds = speeds;
    }
    
    createCloudTexture() {
        // Create a canvas for the cloud texture
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Create a radial gradient for soft cloud appearance
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        
        // Add color stops for soft edges
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        
        // Fill the canvas with the gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create texture from canvas
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }

    setupPostProcessing() {
        // Create composer
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom pass with enhanced settings
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            SCENE_CONFIG.postProcessing.bloom.strength,    // Use config values
            SCENE_CONFIG.postProcessing.bloom.radius,
            SCENE_CONFIG.postProcessing.bloom.threshold
        );
        this.composer.addPass(bloomPass);
        
        // Store the bloom pass for updates
        this.bloomPass = bloomPass;
        
        // Add custom glitch and chromatic aberration shader pass
        const glitchPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                amount: { value: SCENE_CONFIG.postProcessing.glitch.amount },
                seed: { value: 0 },
                distortion: { value: SCENE_CONFIG.postProcessing.glitch.distortion }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float amount;
                uniform float seed;
                uniform float distortion;
                
                varying vec2 vUv;
                
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                // Function to check if a pixel is likely a star
                bool isStar(vec3 color) {
                    // Stars are typically very bright
                    float brightness = (color.r + color.g + color.b) / 3.0;
                    
                    // Check if the pixel is bright enough to be a star
                    // and has relatively balanced RGB values (not heavily tinted)
                    return brightness > 0.7 && 
                           abs(color.r - color.g) < 0.3 && 
                           abs(color.r - color.b) < 0.3 && 
                           abs(color.g - color.b) < 0.3;
                }
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Sample the center pixel first to check if it's a star
                    vec3 centerColor = texture2D(tDiffuse, uv).rgb;
                    bool pixelIsStar = isStar(centerColor);
                    
                    // If it's a star, don't apply chromatic aberration
                    if (pixelIsStar) {
                        gl_FragColor = vec4(centerColor, 1.0);
                        return;
                    }
                    
                    // For non-star pixels, apply chromatic aberration
                    // Chromatic aberration
                    float aberration = distortion * (0.5 + 0.5 * sin(time * 0.1));
                    vec2 dir = uv - vec2(0.5);
                    float dist = length(dir);
                    
                    vec3 color;
                    color.r = texture2D(tDiffuse, uv - dir * aberration * dist).r;
                    color.g = texture2D(tDiffuse, uv).g;
                    color.b = texture2D(tDiffuse, uv + dir * aberration * dist).b;
                    
                    // Random glitch - reduced for evening
                    float glitchSeed = floor(time * 10.0) + seed;
                    float glitchAmount = amount * random(vec2(glitchSeed, 234.0));
                    
                    if (random(vec2(glitchSeed, uv.y * 100.0)) > 0.97) { // Less frequent glitches
                        uv.x += glitchAmount * (random(vec2(glitchSeed, uv.y)) * 2.0 - 1.0);
                        color = texture2D(tDiffuse, uv).rgb;
                    }
                    
                    // Scanlines - reduced for cleaner look
                    float scanline = sin(uv.y * 800.0 + time * 10.0) * 0.01 + 0.99;
                    color *= scanline;
                    
                    // Vignette - lighter for evening
                    float vignette = smoothstep(1.0, 0.6, length(uv - 0.5) * 1.3);
                    color *= vignette;
                    
                    // Overall brightness boost for evening
                    color *= 1.1;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        glitchPass.renderToScreen = true;
        this.composer.addPass(glitchPass);
        
        // Store the glitch pass for animation
        this.glitchPass = glitchPass;
    }

    setupControls() {
        // Setup keyboard event listeners
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    onKeyDown(event) {
        const keyMapping = SCENE_CONFIG.camera.controls.keyMapping;
        
        switch (event.code) {
            // Movement controls
            case 'ArrowUp':
                this.controls.moveForward = true;
                this.controls.boost = true;
                break;
            case 'ArrowDown':
                this.controls.moveBackward = true;
                break;
            // Look controls (arrow keys)
            case 'ArrowLeft':
                this.controls.lookLeft = true;
                break;
            case 'ArrowRight':
                this.controls.lookRight = true;
                break;
            // Barrel roll controls (A/D)
            case 'KeyA':
                this.controls.rollLeft = true;
                break;
            case 'KeyD':
                this.controls.rollRight = true;
                break;
            // Inverted look up/down (W/S)
            case 'KeyW':
                this.controls.lookDown = true;  // Changed from lookUp
                break;
            case 'KeyS':
                this.controls.lookUp = true;    // Changed from lookDown
                break;
        }
    }
    
    onKeyUp(event) {
        const keyMapping = SCENE_CONFIG.camera.controls.keyMapping;
        
        switch (event.code) {
            case 'ArrowUp':
                this.controls.moveForward = false;
                this.controls.boost = false;
                break;
            case 'ArrowDown':
                this.controls.moveBackward = false;
                break;
            // Look controls
            case 'ArrowLeft':
                this.controls.lookLeft = false;
                break;
            case 'ArrowRight':
                this.controls.lookRight = false;
                break;
            // Barrel roll controls
            case 'KeyA':
                this.controls.rollLeft = false;
                break;
            case 'KeyD':
                this.controls.rollRight = false;
                break;
            // Inverted look up/down
            case 'KeyW':
                this.controls.lookDown = false;  // Changed from lookUp
                break;
            case 'KeyS':
                this.controls.lookUp = false;    // Changed from lookDown
                break;
        }
    }
    
    updateControls(delta) {
        // Get current speed based on boost state
        let targetSpeed = this.controls.boost ? 
            SCENE_CONFIG.camera.controls.boostSpeed : 
            SCENE_CONFIG.camera.controls.moveSpeed;
        
        // Initialize current speed if undefined
        if (this.currentSpeed === undefined) this.currentSpeed = SCENE_CONFIG.camera.controls.moveSpeed;
        
        // Calculate acceleration and deceleration with easing
        if (this.controls.boost) {
            // Accelerate with easing for smoother ramp-up
            const accelerationRate = SCENE_CONFIG.camera.controls.acceleration * delta;
            const speedDiff = targetSpeed - this.currentSpeed;
            this.currentSpeed += speedDiff * accelerationRate;
        } else {
            // Decelerate more quickly with easing
            const decelerationRate = SCENE_CONFIG.camera.controls.deceleration * delta;
            const speedDiff = this.currentSpeed - SCENE_CONFIG.camera.controls.moveSpeed;
            this.currentSpeed -= speedDiff * decelerationRate;
        }
        
        // Clamp speed to valid range
        this.currentSpeed = Math.max(
            SCENE_CONFIG.camera.controls.moveSpeed,
            Math.min(SCENE_CONFIG.camera.controls.boostSpeed, this.currentSpeed)
        );
        
        if (this.controls.boost) {
            // Update boost timer and check for warp
            this.boostTimer += delta;
            if (this.boostTimer >= SCENE_CONFIG.warp.boostThreshold && !this.isWarping) {
                this.startWarp();
            }
            
            // Gradually increase FOV when boosting
            this.camera.fov = THREE.MathUtils.lerp(
                this.camera.fov,
                SCENE_CONFIG.camera.boostFov,
                delta * SCENE_CONFIG.camera.fovChangeSpeed
            );
            this.camera.updateProjectionMatrix();
        } else {
            // Reset boost timer when not boosting
            this.boostTimer = 0;
            if (this.isWarping) {
                this.endWarp();
            }
            
            // Gradually return to normal FOV when not boosting
            this.camera.fov = THREE.MathUtils.lerp(
                this.camera.fov,
                SCENE_CONFIG.camera.fov,
                delta * SCENE_CONFIG.camera.fovChangeSpeed
            );
            this.camera.updateProjectionMatrix();
        }

        // Handle camera rotation
        if (this.controls.lookUp) {
            this.controls.rotation.x += this.controls.rotationSpeed;
        }
        if (this.controls.lookDown) {
            this.controls.rotation.x -= this.controls.rotationSpeed;
        }
        if (this.controls.lookLeft) {
            this.controls.rotation.y += this.controls.rotationSpeed;
        }
        if (this.controls.lookRight) {
            this.controls.rotation.y -= this.controls.rotationSpeed;
        }

        // Handle barrel roll with delta time
        if (this.controls.rollLeft) {
            this.controls.rollAngle += this.controls.rollSpeed * delta;
        }
        if (this.controls.rollRight) {
            this.controls.rollAngle -= this.controls.rollSpeed * delta;
        }
        
        // Apply damping to roll
        this.controls.rollAngle *= Math.pow(this.controls.rollDamping, delta * 60);

        // Clamp vertical rotation
        this.controls.rotation.x = Math.max(
            -this.controls.verticalRotationLimit,
            Math.min(this.controls.verticalRotationLimit, this.controls.rotation.x)
        );

        // Create quaternions for look and roll
        const lookQuaternion = new THREE.Quaternion().setFromEuler(this.controls.rotation);
        const rollQuaternion = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            this.controls.rollAngle
        );

        // Apply rotations to camera
        this.camera.quaternion.copy(lookQuaternion).multiply(rollQuaternion);

        // Update movement direction based on camera's look direction
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(lookQuaternion); // Use look quaternion only for movement
        forward.normalize();
        
        // Calculate velocity based on input
        this.controls.velocity.set(0, 0, 0);
        
        // Handle forward/backward movement
        if (this.controls.moveForward || SCENE_CONFIG.camera.controls.autoMove) {
            this.controls.velocity.add(forward.clone().multiplyScalar(this.currentSpeed));
        }
        if (this.controls.moveBackward) {
            this.controls.velocity.add(forward.clone().multiplyScalar(-this.currentSpeed * 0.5));
        }
        
        // Apply velocity to camera position
        this.camera.position.add(this.controls.velocity);
    }

    startWarp() {
        this.isWarping = true;
        this.currentDimension = 'warp';
    }

    endWarp() {
        this.isWarping = false;
        this.currentDimension = 'normal';
    }

    updateWarpEffect(delta) {
        // Calculate transition rate based on whether entering or exiting warp
        const transitionRate = this.isWarping ? 
            delta / SCENE_CONFIG.warp.transitionDuration : 
            delta / SCENE_CONFIG.warp.exitDuration;

        if (this.isWarping && this.warpTransition < 1) {
            this.warpTransition = Math.min(1, this.warpTransition + transitionRate);
        } else if (!this.isWarping && this.warpTransition > SCENE_CONFIG.warp.effectPersistence) {
            // Transition down to effectPersistence value instead of 0
            this.warpTransition = Math.max(
                SCENE_CONFIG.warp.effectPersistence, 
                this.warpTransition - transitionRate
            );
        }

        // Calculate the eased transition value once for use throughout the method
        const transitionEased = this.easeInOutQuad(this.warpTransition);

        // Update visual elements based on warp transition
        if (this.warpTransition > 0 || !this.isWarping) {  // Always update bloom
            // Interpolate bloom settings with persistence and smooth transition
            if (this.bloomPass) {
                const normal = SCENE_CONFIG.warp.normalDimension.bloom;
                const warp = SCENE_CONFIG.warp.warpDimension.bloom;
                const transitionPower = Math.pow(this.warpTransition, 1.5); // More dramatic at peak
                
                // Ensure we maintain at least the normal bloom values
                this.bloomPass.strength = Math.max(
                    normal.strength,
                    THREE.MathUtils.lerp(normal.strength, warp.strength, transitionPower)
                );
                this.bloomPass.radius = Math.max(
                    normal.radius,
                    THREE.MathUtils.lerp(normal.radius, warp.radius, transitionPower)
                );
                this.bloomPass.threshold = Math.min(
                    normal.threshold,
                    THREE.MathUtils.lerp(normal.threshold, warp.threshold, transitionPower)
                );
            }

            // Update grid colors with smoother transition
            const gridHelper = this.scene.children.find(child => child instanceof THREE.GridHelper);
            if (gridHelper) {
                const normalColors = SCENE_CONFIG.warp.normalDimension.colors.grid;
                const warpColors = SCENE_CONFIG.warp.warpDimension.colors.grid;
                
                const mainColor = new THREE.Color(normalColors.main);
                const warpMainColor = new THREE.Color(warpColors.main);
                mainColor.lerp(warpMainColor, transitionEased);
                
                const secondaryColor = new THREE.Color(normalColors.secondary);
                const warpSecondaryColor = new THREE.Color(warpColors.secondary);
                secondaryColor.lerp(warpSecondaryColor, transitionEased);
                
                gridHelper.material.color = mainColor;
            }

            // Update star colors with persistence
            if (this.stars) {
                const colors = this.stars.geometry.attributes.color;
                const normalStarColors = SCENE_CONFIG.warp.normalDimension.colors.stars;
                const warpStarColors = SCENE_CONFIG.warp.warpDimension.colors.stars;
                
                for (let i = 0; i < colors.count; i++) {
                    const normalColor = new THREE.Color(normalStarColors[i % normalStarColors.length]);
                    const warpColor = new THREE.Color(warpStarColors[i % warpStarColors.length]);
                    normalColor.lerp(warpColor, transitionEased);
                    
                    colors.setXYZ(i, normalColor.r, normalColor.g, normalColor.b);
                }
                colors.needsUpdate = true;
            }

            // Add more intense rotation to star container in warp with smooth transition
            if (this.starContainer) {
                const normalRotation = 0.0001;
                const warpRotation = 0.001;
                const rotationTransition = transitionEased; // Use the pre-calculated value
                this.starContainer.rotation.y += THREE.MathUtils.lerp(normalRotation, warpRotation, rotationTransition);
                this.starContainer.rotation.x += THREE.MathUtils.lerp(normalRotation/2, warpRotation/2, rotationTransition);
            }
            
            // Update building and neon structure colors during warp
            // Instead of rebuilding, we'll just change their appearance
            
            // Update building colors
            this.buildings.forEach(building => {
                if (building.material && building.material.uniforms) {
                    // Transition emissive color
                    const normalColor = new THREE.Color(0.1, 0.1, 0.3);
                    const warpColor = new THREE.Color(0.8, 0.1, 0.1);
                    const mixedColor = normalColor.clone().lerp(warpColor, transitionEased);
                    
                    // Update the emissive color uniform if it exists
                    if (building.material.uniforms.emissiveColor) {
                        building.material.uniforms.emissiveColor.value = mixedColor;
                    }
                    
                    // Increase glitch intensity during warp
                    if (building.material.uniforms.glitchIntensity) {
                        const normalGlitch = 0.1;
                        const warpGlitch = 0.4;
                        building.material.uniforms.glitchIntensity.value = 
                            THREE.MathUtils.lerp(normalGlitch, warpGlitch, transitionEased);
                    }
                    
                    // Update warp factor for electric effects
                    if (building.material.uniforms.warpFactor) {
                        building.material.uniforms.warpFactor.value = transitionEased;
                    }
                }
            });
            
            // Update neon structure colors
            this.neonLights.forEach(neon => {
                if (neon.material && neon.material.uniforms && neon.material.uniforms.color) {
                    // Create more intense colors during warp
                    const normalColor = neon.material.uniforms.color.value.clone();
                    const warpColor = new THREE.Color(
                        Math.min(1.0, normalColor.r * 1.5),
                        Math.min(1.0, normalColor.g * 0.5),
                        Math.min(1.0, normalColor.b * 0.5)
                    );
                    
                    neon.material.uniforms.color.value.copy(
                        normalColor.clone().lerp(warpColor, transitionEased)
                    );
                    
                    // Increase rotation speed during warp
                    neon.rotationSpeed = THREE.MathUtils.lerp(
                        neon.originalRotationSpeed || neon.rotationSpeed,
                        (neon.originalRotationSpeed || neon.rotationSpeed) * 2.5,
                        transitionEased
                    );
                }
            });
        }
    }

    // Add easing function for smoother transitions
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        this.time += delta;
        
        // Update controls if enabled
        if (SCENE_CONFIG.camera.controls.enabled) {
            this.updateControls(delta);
        } else {
            // Original camera movement
            // Update camera position - move forward
            this.camera.position.z -= this.cameraSpeed;
            
            // Slightly move camera in a sine wave pattern
            this.camera.position.x = Math.sin(this.time * SCENE_CONFIG.camera.waveSpeed.x) 
                * SCENE_CONFIG.camera.waveMagnitude.x;
            this.camera.position.y = SCENE_CONFIG.camera.position.y 
                + Math.sin(this.time * SCENE_CONFIG.camera.waveSpeed.y) 
                * SCENE_CONFIG.camera.waveMagnitude.y;
        }
        
        // Update warp effect
        this.updateWarpEffect(delta);
        
        // Update star container to follow camera
        if (this.starContainer) {
            // Position the star container at the camera position
            this.starContainer.position.copy(this.camera.position);
            
            // Add a subtle rotation to the star field for visual interest
            this.starContainer.rotation.y += 0.0001;
            this.starContainer.rotation.x += 0.00005;
        }
        
        // Update cloud container to follow camera
        if (this.cloudContainer) {
            // Position the cloud container at the camera position, but maintain its height
            this.cloudContainer.position.x = this.camera.position.x;
            this.cloudContainer.position.z = this.camera.position.z;
            
            // Add a very subtle rotation for visual interest
            this.cloudContainer.rotation.y += 0.00005;
        }
        
        // Update grid position to follow camera
        const gridSegmentSize = SCENE_CONFIG.grid.size / 2;
        const cameraZGrid = Math.floor(this.camera.position.z / gridSegmentSize) * gridSegmentSize;
        
        // Find all grid-related meshes and update their positions
        this.scene.children.forEach(child => {
            if (child instanceof THREE.GridHelper) {
                child.position.z = cameraZGrid;
            }
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
                // This is our shader-based grid plane
                child.position.z = cameraZGrid;
            }
        });
        
        // Update building materials
        this.buildings.forEach(building => {
            building.material.uniforms.time.value = this.time;
            
            // Move buildings that are too far behind back in front
            if (building.mesh.position.z > this.camera.position.z + 10) {
                building.mesh.position.z -= this.citySize * 2;
            }
            
            // Add some subtle movement
            building.mesh.position.y = building.mesh.geometry.parameters.height / 2 + 
                                      Math.sin(this.time * building.speed + building.initialX) * 0.2;
        });
        
        // Update neon structures
        this.neonLights.forEach(neon => {
            neon.material.uniforms.time.value = this.time;
            
            // Rotate
            neon.mesh.rotation.x += neon.rotationSpeed;
            neon.mesh.rotation.y += neon.rotationSpeed * 0.7;
            neon.mesh.rotation.z += neon.rotationSpeed * 0.5;
            
            // Float up and down
            neon.mesh.position.y = neon.initialY + Math.sin(this.time * neon.floatSpeed) * 2;
            
            // Move structures that are too far behind back in front
            if (neon.mesh.position.z > this.camera.position.z + 10) {
                neon.mesh.position.z -= this.citySize * 2;
            }
        });
        
        // Update grid material
        if (this.gridMaterial) {
            this.gridMaterial.uniforms.time.value = this.time;
            this.gridMaterial.uniforms.cameraPosCustom.value.copy(this.camera.position);
        }
        
        // Update post-processing effects
        if (this.glitchPass) {
            this.glitchPass.uniforms.time.value = this.time;
            this.glitchPass.uniforms.seed.value = Math.random() * 100;
            
            // Increase glitch during certain intervals
            if (Math.sin(this.time * 0.1) > 0.8) {
                this.glitchPass.uniforms.amount.value = 0.2;
            } else {
                this.glitchPass.uniforms.amount.value = SCENE_CONFIG.postProcessing.glitch.amount;
            }
        }
        
        // Update clouds
        if (this.clouds) {
            // Update cloud material time uniform
            this.clouds.material.uniforms.time.value = this.time;
            
            // Get cloud positions
            const positions = this.clouds.geometry.attributes.position.array;
            
            // Update each cloud particle with subtle movement
            for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
                // Add slight movement for swirling effect
                positions[i] += Math.sin(this.time * 0.1 + j * 0.1) * 0.02;
                positions[i + 1] += Math.cos(this.time * 0.15 + j * 0.05) * 0.01;
                positions[i + 2] += Math.sin(this.time * 0.12 + j * 0.15) * 0.02;
            }
            
            // Update the geometry
            this.clouds.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update marbles
        if (this.marbles && this.marbles.length > 0) {
            this.updateMarbles(delta);
        }
        
        // Update floating artifacts
        if (this.floatingArtifacts && this.floatingArtifacts.length > 0) {
            this.updateFloatingArtifacts(delta);
        }
        
        // Create a container for roots if it doesn't exist
        if (!this.rootContainer) {
            this.rootContainer = new THREE.Object3D();
            this.scene.add(this.rootContainer);
            
            // Move existing roots to the container
            this.rootStructures.forEach(root => {
                this.scene.remove(root.mesh);
                this.rootContainer.add(root.mesh);
            });
        }
        
        // Always keep root container with camera
        this.rootContainer.position.copy(this.camera.position);
        
        // Update individual root structures
        this.rootStructures.forEach(root => {
            // Update shader time
            root.material.uniforms.time.value = this.time;
            
            // Calculate root's position relative to camera
            const relativePos = root.mesh.position.clone().add(this.rootContainer.position);
            const distanceFromCamera = relativePos.distanceTo(this.camera.position);
            
            // Check if root needs regeneration (either too far or behind camera)
            const isTooFar = distanceFromCamera > this.citySize;
            const isBehindCamera = root.mesh.position.z > 0; // Since container is at camera position
            
            if (isTooFar || isBehindCamera) {
                // Calculate new position in front of camera
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.citySize * 0.8;
                
                // Position relative to container (which is at camera position)
                root.mesh.position.x = Math.cos(angle) * radius;
                root.mesh.position.z = -Math.random() * this.citySize; // Always in front
                root.mesh.position.y = -SCENE_CONFIG.roots.structure.startDepth.min - 
                    Math.random() * (SCENE_CONFIG.roots.structure.startDepth.max - SCENE_CONFIG.roots.structure.startDepth.min);
                
                root.initialZ = root.mesh.position.z;
            }
            
            // Update visual effects based on boost/warp state
            const boostIntensity = this.controls.boost ? 2.0 : 1.0;
            
            if (root.material.uniforms.glowIntensity) {
                root.material.uniforms.glowIntensity.value = 
                    SCENE_CONFIG.roots.appearance.glow.intensity * boostIntensity;
            }
            
            if (root.material.uniforms.energyFlowSpeed) {
                root.material.uniforms.energyFlowSpeed.value = 
                    SCENE_CONFIG.roots.appearance.animation.energyFlowSpeed * boostIntensity;
            }
            
            // Add subtle movement
            root.mesh.position.y += Math.sin(
                this.time * SCENE_CONFIG.roots.physics.verticalMovement.frequency + root.initialZ
            ) * SCENE_CONFIG.roots.physics.verticalMovement.amplitude;
        });
        
        // Render scene with post-processing
        this.composer.render();
        
        // Update HUD
        this.updateHUD();

        this.updateGroundFog(delta);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    createMobileControls() {
        const mobileControls = document.createElement('div');
        mobileControls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: none;
            z-index: 1000;
            width: 240px;
            height: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        // Show on mobile devices or small screens
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768) {
            mobileControls.style.display = 'flex';
        }

        const createButton = (direction, symbol) => {
            const button = document.createElement('button');
            button.innerHTML = symbol;
            button.style.cssText = `
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.2)};
                color: ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.8)};
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                outline: none;
                margin: 0 5px;
                padding: 0;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                user-select: none;
                -webkit-user-select: none;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                box-shadow: 0 0 10px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.3)};
                transition: transform 0.1s ease, background-color 0.1s ease;
            `;

            const startControl = (e) => {
                e.preventDefault();
                this.onKeyDown({ code: `Arrow${direction}` });
                button.style.background = this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.4);
                button.style.transform = 'scale(0.95)';
            };

            const endControl = (e) => {
                e.preventDefault();
                this.onKeyUp({ code: `Arrow${direction}` });
                button.style.background = this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.2);
                button.style.transform = 'scale(1)';
            };

            // Touch events for mobile devices
            button.addEventListener('touchstart', startControl, { passive: false });
            button.addEventListener('touchend', endControl);
            button.addEventListener('touchcancel', endControl);

            // Mouse events for mobile web
            button.addEventListener('mousedown', startControl);
            button.addEventListener('mouseup', endControl);
            button.addEventListener('mouseleave', endControl);

            // Prevent context menu on long press
            button.addEventListener('contextmenu', (e) => e.preventDefault());

            // Prevent default touch behavior
            button.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

            return button;
        };

        // Create directional buttons with arrow symbols in a row
        const leftButton = createButton('Left', '←');
        const downButton = createButton('Down', '↓');
        const upButton = createButton('Up', '↑');
        const rightButton = createButton('Right', '→');

        mobileControls.appendChild(leftButton);
        mobileControls.appendChild(downButton);
        mobileControls.appendChild(upButton);
        mobileControls.appendChild(rightButton);

        document.body.appendChild(mobileControls);

        // Update visibility on resize
        window.addEventListener('resize', () => {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768) {
                mobileControls.style.display = 'flex';
            } else {
                mobileControls.style.display = 'none';
            }
        });
    }

    createMarbles() {
        // Create refractive material for marbles
        const refractiveShader = {
            uniforms: {
                time: { value: 0 },
                baseColor: { value: new THREE.Color(0xffffff) },
                envMap: { value: null },
                refractionRatio: { value: 0.98 },
                glowIntensity: { value: 0.0 },
                glowColor: { value: new THREE.Color(0xffffff) },
                distortionAmount: { value: 0.1 },
                rippleCenter: { value: new THREE.Vector3(0, 0, 0) },
                rippleRadius: { value: 0.0 },
                rippleWidth: { value: 2.0 },
                rippleIntensity: { value: 0.0 }
            },
            vertexShader: `
                uniform float time;
                uniform float distortionAmount;
                uniform vec3 rippleCenter;
                uniform float rippleRadius;
                uniform float rippleWidth;
                uniform float rippleIntensity;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                varying vec3 vViewDirection;
                
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    
                    // Calculate world position
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    
                    // Calculate view direction
                    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
                    
                    // Apply ripple distortion if active
                    vec3 pos = position;
                    if (rippleRadius > 0.0) {
                        // Calculate distance from ripple center in object space
                        vec3 rippleCenterObj = (inverse(modelMatrix) * vec4(rippleCenter, 1.0)).xyz;
                        float dist = distance(position, rippleCenterObj);
                        
                        // Create ripple wave effect
                        float rippleEffect = smoothstep(rippleRadius - rippleWidth, rippleRadius, dist) * 
                                            smoothstep(rippleRadius + rippleWidth, rippleRadius, dist);
                        
                        // Apply distortion along normal
                        pos += normal * rippleEffect * rippleIntensity;
                    }
                    
                    // Apply subtle pulsing distortion
                    float pulse = sin(time * 2.0 + position.x * position.z) * 0.5 + 0.5;
                    pos += normal * pulse * distortionAmount;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 baseColor;
                uniform samplerCube envMap;
                uniform float refractionRatio;
                uniform float glowIntensity;
                uniform vec3 glowColor;
                
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vWorldPosition;
                varying vec3 vViewDirection;
                
                void main() {
                    // Calculate refraction
                    vec3 refractedDirection = refract(-vViewDirection, normalize(vNormal), refractionRatio);
                    vec4 envColor = textureCube(envMap, refractedDirection);
                    
                    // Add chromatic aberration effect
                    float aberration = 0.02;
                    vec3 refractedRed = refract(-vViewDirection, normalize(vNormal), refractionRatio - aberration);
                    vec3 refractedBlue = refract(-vViewDirection, normalize(vNormal), refractionRatio + aberration);
                    
                    vec4 envColorR = textureCube(envMap, refractedRed);
                    vec4 envColorB = textureCube(envMap, refractedBlue);
                    
                    // Combine for chromatic effect
                    vec3 refractedColor = vec3(envColorR.r, envColor.g, envColorB.b);
                    
                    // Calculate fresnel effect for edge glow
                    float fresnel = pow(1.0 - max(0.0, dot(vViewDirection, normalize(vNormal))), 3.0);
                    
                    // Pulse the glow
                    float glowPulse = sin(time * 1.5 + vPosition.x * 2.0) * 0.5 + 0.5;
                    
                    // Combine base color, refraction, and glow
                    vec3 finalColor = refractedColor * baseColor;
                    
                    // Add edge glow
                    finalColor += glowColor * fresnel * 0.5;
                    
                    // Add inner glow
                    finalColor += glowColor * glowIntensity * glowPulse;
                    
                    // Add subtle sparkles
                    float sparkle = pow(sin(vPosition.x * 100.0 + time * 5.0) * 
                                       sin(vPosition.y * 100.0 + time * 3.0) * 
                                       sin(vPosition.z * 100.0 + time * 7.0), 16.0);
                    finalColor += vec3(1.0) * sparkle * fresnel * 0.5;
                    
                    gl_FragColor = vec4(finalColor, 0.7 + fresnel * 0.3);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        };
        
        // Create a simple environment map for refraction
        const envMapSize = 128;
        const envMapRenderTarget = new THREE.WebGLCubeRenderTarget(envMapSize);
        const envMapCamera = new THREE.CubeCamera(0.1, 1000, envMapRenderTarget);
        this.scene.add(envMapCamera);
        
        // Create marbles
        for (let i = 0; i < SCENE_CONFIG.marbles.count; i++) {
            // Random radius
            const radius = SCENE_CONFIG.marbles.minRadius + 
                Math.random() * (SCENE_CONFIG.marbles.maxRadius - SCENE_CONFIG.marbles.minRadius);
            
            // Create geometry
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            
            // Create material with unique color
            const marbleColor = new THREE.Color(
                SCENE_CONFIG.marbles.colors[Math.floor(Math.random() * SCENE_CONFIG.marbles.colors.length)]
            );
            
            // Create shader material
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    baseColor: { value: marbleColor },
                    envMap: { value: envMapRenderTarget.texture },
                    refractionRatio: { value: 0.95 + Math.random() * 0.04 },
                    glowIntensity: { value: Math.random() * SCENE_CONFIG.marbles.glow.intensity },
                    glowColor: { value: marbleColor.clone() },
                    distortionAmount: { value: 0.05 + Math.random() * 0.1 },
                    rippleCenter: { value: new THREE.Vector3(0, 0, 0) },
                    rippleRadius: { value: 0.0 },
                    rippleWidth: { value: 2.0 },
                    rippleIntensity: { value: 0.0 }
                },
                vertexShader: refractiveShader.vertexShader,
                fragmentShader: refractiveShader.fragmentShader,
                transparent: true,
                side: THREE.DoubleSide
            });
            
            // Create mesh
            const marble = new THREE.Mesh(geometry, material);
            
            // Random position within spawn area
            const x = (Math.random() - 0.5) * SCENE_CONFIG.marbles.spawnArea.width;
            const y = radius + Math.random() * SCENE_CONFIG.marbles.bounceHeight;
            const z = (Math.random() - 0.5) * SCENE_CONFIG.marbles.spawnArea.depth;
            
            marble.position.set(x, y, z);
            
            // Physics properties
            const physics = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * SCENE_CONFIG.marbles.rollSpeed,
                    0,
                    (Math.random() - 0.5) * SCENE_CONFIG.marbles.rollSpeed
                ),
                acceleration: new THREE.Vector3(0, -SCENE_CONFIG.marbles.physics.gravity, 0),
                angularVelocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ),
                bouncePhase: Math.random() * Math.PI * 2,
                bounceFrequency: 0.5 + Math.random() * SCENE_CONFIG.marbles.bounceSpeed,
                radius: radius,
                onGround: false,
                lastCollisionTime: 0
            };
            
            // Lifecycle properties
            const lifecycle = {
                age: 0,
                lifespan: SCENE_CONFIG.marbles.lifecycle.minLifespan + 
                          Math.random() * (SCENE_CONFIG.marbles.lifecycle.maxLifespan - 
                                          SCENE_CONFIG.marbles.lifecycle.minLifespan),
                state: 'spawning', // spawning, active, dying, dead
                stateTime: 0,      // Time in current state
                opacity: 0         // Start at 0 opacity when spawning
            };
            
            // Store marble
            this.marbles.push({
                mesh: marble,
                material: material,
                physics: physics,
                lifecycle: lifecycle,
                initialColor: marbleColor.clone(),
                initialGlow: material.uniforms.glowIntensity.value
            });
            
            this.scene.add(marble);
        }
        
        // Store environment map camera for updates
        this.envMapCamera = envMapCamera;
    }

    updateMarbles(delta) {
        // Update environment map for refraction
        if (this.envMapCamera) {
            this.envMapCamera.position.copy(this.camera.position);
            this.envMapCamera.update(this.renderer, this.scene);
        }
        
        // Process any active collisions
        for (let i = this.marbleCollisions.length - 1; i >= 0; i--) {
            const collision = this.marbleCollisions[i];
            collision.time += delta;
            
            // Update ripple effect
            const rippleProgress = collision.time / SCENE_CONFIG.marbles.collision.rippleDuration;
            if (rippleProgress < 1.0) {
                // Expand ripple
                const rippleSize = rippleProgress * SCENE_CONFIG.marbles.collision.rippleSize;
                const rippleIntensity = (1.0 - rippleProgress) * 0.3;
                
                collision.marbleA.material.uniforms.rippleRadius.value = rippleSize;
                collision.marbleA.material.uniforms.rippleIntensity.value = rippleIntensity;
                
                collision.marbleB.material.uniforms.rippleRadius.value = rippleSize;
                collision.marbleB.material.uniforms.rippleIntensity.value = rippleIntensity;
            } else {
                // Reset ripple when done
                collision.marbleA.material.uniforms.rippleRadius.value = 0;
                collision.marbleA.material.uniforms.rippleIntensity.value = 0;
                
                collision.marbleB.material.uniforms.rippleRadius.value = 0;
                collision.marbleB.material.uniforms.rippleIntensity.value = 0;
                
                // Remove collision
                this.marbleCollisions.splice(i, 1);
            }
        }
        
        // Get grid size and divisions for snapping marbles to grid lines
        const gridSize = SCENE_CONFIG.grid.size;
        const gridDivisions = SCENE_CONFIG.grid.divisions;
        const gridSpacing = gridSize / gridDivisions;
        
        // Update each marble
        for (let i = 0; i < this.marbles.length; i++) {
            const marble = this.marbles[i];
            const physics = marble.physics;
            const lifecycle = marble.lifecycle;
            
            // Update material time uniform
            marble.material.uniforms.time.value = this.time;
            
            // Update lifecycle
            lifecycle.age += delta;
            lifecycle.stateTime += delta;
            
            // Handle lifecycle states
            switch (lifecycle.state) {
                case 'spawning':
                    // Handle spawn effect
                    const spawnProgress = Math.min(1.0, lifecycle.stateTime / SCENE_CONFIG.marbles.lifecycle.spawnEffect.duration);
                    
                    // Fade in
                    lifecycle.opacity = spawnProgress;
                    
                    // Scale effect - start small and grow
                    const spawnScale = 0.1 + spawnProgress * 0.9;
                    marble.mesh.scale.set(spawnScale, spawnScale, spawnScale);
                    
                    // Glow effect - extra bright when spawning
                    const spawnGlow = marble.initialGlow * 
                                     (1 + (SCENE_CONFIG.marbles.lifecycle.spawnEffect.glowMultiplier - 1) * 
                                     (1 - spawnProgress));
                    marble.material.uniforms.glowIntensity.value = spawnGlow;
                    
                    // Transition to active state when spawn effect is complete
                    if (spawnProgress >= 1.0) {
                        lifecycle.state = 'active';
                        lifecycle.stateTime = 0;
                        lifecycle.opacity = 1.0;
                        marble.mesh.scale.set(1, 1, 1);
                    }
                    break;
                    
                case 'active':
                    // Check if marble should start dying
                    if (lifecycle.age >= lifecycle.lifespan) {
                        lifecycle.state = 'dying';
                        lifecycle.stateTime = 0;
                    }
                    
                    // Normal marble behavior
                    // Determine if marble should follow grid lines
                    if (!physics.gridAligned) {
                        // Assign a grid line to follow if not already assigned
                        physics.gridAligned = true;
                        physics.followsXAxis = Math.random() > 0.5; // Randomly choose x or z axis
                        
                        // Snap to nearest grid line
                        if (physics.followsXAxis) {
                            // Follow x-axis grid line (constant z)
                            const nearestZ = Math.round(marble.mesh.position.z / gridSpacing) * gridSpacing;
                            marble.mesh.position.z = nearestZ;
                            // Set velocity along x-axis
                            physics.velocity.set((Math.random() > 0.5 ? 1 : -1) * SCENE_CONFIG.marbles.rollSpeed, 0, 0);
                        } else {
                            // Follow z-axis grid line (constant x)
                            const nearestX = Math.round(marble.mesh.position.x / gridSpacing) * gridSpacing;
                            marble.mesh.position.x = nearestX;
                            // Set velocity along z-axis
                            physics.velocity.set(0, 0, (Math.random() > 0.5 ? 1 : -1) * SCENE_CONFIG.marbles.rollSpeed);
                        }
                    }
                    
                    // Apply a small bounce effect for visual interest
                    const bounceHeight = physics.radius * 0.2;
                    const bounceSpeed = 2.0 + physics.bounceFrequency;
                    marble.mesh.position.y = physics.radius + Math.abs(Math.sin(this.time * bounceSpeed + physics.bouncePhase)) * bounceHeight;
                    
                    // Update position based on velocity
                    marble.mesh.position.add(physics.velocity.clone().multiplyScalar(delta * 60));
                    
                    // Rotate based on velocity for rolling effect
                    if (physics.followsXAxis) {
                        // Rolling along x-axis
                        marble.mesh.rotateZ(-physics.velocity.x * delta * 60 / physics.radius);
                    } else {
                        // Rolling along z-axis
                        marble.mesh.rotateX(physics.velocity.z * delta * 60 / physics.radius);
                    }
                    
                    // Apply additional angular velocity for spinning effect
                    marble.mesh.rotateY(physics.angularVelocity.y * delta);
                    
                    // Check if marble has gone too far from camera and needs to be repositioned
                    const distanceFromCamera = marble.mesh.position.distanceTo(this.camera.position);
                    const maxDistance = gridSize * 0.8;
                    
                    // Check if marble is behind the camera (for z-axis marbles moving backward)
                    const isBehindCamera = physics.followsXAxis ? false : 
                        (physics.velocity.z > 0 && marble.mesh.position.z > this.camera.position.z + 10);
                    
                    if (distanceFromCamera > maxDistance || isBehindCamera) {
                        // Instead of repositioning, start the death process
                        lifecycle.state = 'dying';
                        lifecycle.stateTime = 0;
                    }
                    
                    // Update glow based on pulse
                    const glowPulse = Math.sin(this.time * SCENE_CONFIG.marbles.glow.pulseSpeed + i) * 
                                    SCENE_CONFIG.marbles.glow.pulseAmount + 1.0;
                    
                    marble.material.uniforms.glowIntensity.value = 
                        marble.initialGlow * glowPulse;
                    break;
                    
                case 'dying':
                    // Handle death effect
                    const deathProgress = Math.min(1.0, lifecycle.stateTime / SCENE_CONFIG.marbles.lifecycle.fadeOutDuration);
                    
                    // Fade out
                    lifecycle.opacity = 1.0 - deathProgress;
                    
                    // Rapid pulsing effect
                    const deathPulse = Math.sin(lifecycle.stateTime * 
                                              SCENE_CONFIG.marbles.lifecycle.deathEffect.pulseFrequency) * 0.5 + 0.5;
                    
                    // Final flash at the end
                    const finalFlash = deathProgress > 0.8 ? 
                                     SCENE_CONFIG.marbles.lifecycle.deathEffect.finalFlash * 
                                     (1.0 - (deathProgress - 0.8) / 0.2) : 0;
                    
                    // Apply visual effects
                    marble.material.uniforms.glowIntensity.value = 
                        marble.initialGlow * (1.0 + deathPulse + finalFlash) * (1.0 - deathProgress * 0.5);
                    
                    // Slow down as it dies
                    physics.velocity.multiplyScalar(0.95);
                    
                    // Transition to dead state when fade out is complete
                    if (deathProgress >= 1.0) {
                        lifecycle.state = 'dead';
                        lifecycle.stateTime = 0;
                        marble.mesh.visible = false;
                    }
                    break;
                    
                case 'dead':
                    // Wait for spawn delay before respawning
                    if (lifecycle.stateTime >= SCENE_CONFIG.marbles.lifecycle.spawnDelay) {
                        // Respawn the marble with new properties
                        this.respawnMarble(marble);
                    }
                    break;
            }
            
            // Apply opacity
            if (marble.material.uniforms.opacity) {
                marble.material.uniforms.opacity.value = lifecycle.opacity;
            } else {
                // If opacity uniform doesn't exist, create it
                marble.material.uniforms.opacity = { value: lifecycle.opacity };
                // Update fragment shader to use opacity
                const fragmentShader = marble.material.fragmentShader;
                if (!fragmentShader.includes('uniform float opacity;')) {
                    const updatedShader = fragmentShader.replace(
                        'void main() {',
                        'uniform float opacity;\n\nvoid main() {'
                    ).replace(
                        'gl_FragColor = vec4(finalColor, 0.7 + fresnel * 0.3);',
                        'gl_FragColor = vec4(finalColor, (0.7 + fresnel * 0.3) * opacity);'
                    );
                    marble.material.fragmentShader = updatedShader;
                    marble.material.needsUpdate = true;
                }
            }
            
            // Only process collisions for active marbles
            if (lifecycle.state === 'active') {
                // Check for collisions with other marbles
                for (let j = i + 1; j < this.marbles.length; j++) {
                    const otherMarble = this.marbles[j];
                    
                    // Skip if other marble is not active
                    if (otherMarble.lifecycle.state !== 'active') continue;
                    
                    // Only check collisions between marbles on the same grid line
                    const sameGridLine = (physics.followsXAxis === otherMarble.physics.followsXAxis) && 
                                        (physics.followsXAxis ? 
                                            Math.abs(marble.mesh.position.z - otherMarble.mesh.position.z) < gridSpacing * 0.5 :
                                            Math.abs(marble.mesh.position.x - otherMarble.mesh.position.x) < gridSpacing * 0.5);
                    
                    if (!sameGridLine) continue;
                    
                    // Calculate distance between marbles
                    const distance = marble.mesh.position.distanceTo(otherMarble.mesh.position);
                    const minDistance = physics.radius + otherMarble.physics.radius;
                    
                    // Check if collision occurred
                    if (distance < minDistance) {
                        // Reverse directions
                        if (physics.followsXAxis) {
                            physics.velocity.x *= -1;
                            otherMarble.physics.velocity.x *= -1;
                        } else {
                            physics.velocity.z *= -1;
                            otherMarble.physics.velocity.z *= -1;
                        }
                        
                        // Move marbles apart to prevent sticking
                        const overlap = minDistance - distance;
                        const moveAmount = overlap * 0.5;
                        
                        // Calculate direction to move
                        const moveDir = new THREE.Vector3().subVectors(
                            marble.mesh.position, 
                            otherMarble.mesh.position
                        ).normalize();
                        
                        marble.mesh.position.add(moveDir.clone().multiplyScalar(moveAmount));
                        otherMarble.mesh.position.sub(moveDir.clone().multiplyScalar(moveAmount));
                        
                        // Only create collision effect if it's been a while since last collision
                        const timeSinceLastCollision = this.time - physics.lastCollisionTime;
                        const otherTimeSinceLastCollision = this.time - otherMarble.physics.lastCollisionTime;
                        
                        if (timeSinceLastCollision > 0.2 && otherTimeSinceLastCollision > 0.2) {
                            // Update last collision time
                            physics.lastCollisionTime = this.time;
                            otherMarble.physics.lastCollisionTime = this.time;
                            
                            // Create collision point
                            const collisionPoint = new THREE.Vector3()
                                .addVectors(
                                    marble.mesh.position,
                                    otherMarble.mesh.position
                                )
                                .multiplyScalar(0.5);
                            
                            // Set ripple center
                            marble.material.uniforms.rippleCenter.value.copy(collisionPoint);
                            otherMarble.material.uniforms.rippleCenter.value.copy(collisionPoint);
                            
                            // Add to active collisions
                            this.marbleCollisions.push({
                                marbleA: marble,
                                marbleB: otherMarble,
                                point: collisionPoint.clone(),
                                time: 0
                            });
                            
                            // Temporarily increase glow intensity for both marbles
                            marble.material.uniforms.glowIntensity.value = 
                                marble.initialGlow * SCENE_CONFIG.marbles.collision.flashIntensity;
                            
                            otherMarble.material.uniforms.glowIntensity.value = 
                                otherMarble.initialGlow * SCENE_CONFIG.marbles.collision.flashIntensity;
                        }
                    }
                }
            }
        }
    }
    
    respawnMarble(marble) {
        // Get grid size and divisions for snapping to grid lines
        const gridSize = SCENE_CONFIG.grid.size;
        const gridDivisions = SCENE_CONFIG.grid.divisions;
        const gridSpacing = gridSize / gridDivisions;
        
        // Reset lifecycle
        marble.lifecycle.age = 0;
        marble.lifecycle.state = 'spawning';
        marble.lifecycle.stateTime = 0;
        marble.lifecycle.opacity = 0;
        marble.lifecycle.lifespan = SCENE_CONFIG.marbles.lifecycle.minLifespan + 
                                  Math.random() * (SCENE_CONFIG.marbles.lifecycle.maxLifespan - 
                                                 SCENE_CONFIG.marbles.lifecycle.minLifespan);
        
        // Make visible again
        marble.mesh.visible = true;
        
        // Reset scale
        marble.mesh.scale.set(0.1, 0.1, 0.1);
        
        // Get camera direction vectors
        const cameraForward = this.controls.direction.clone();
        const cameraRight = new THREE.Vector3().crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Determine spawn strategy - we want to maintain marbles in all directions
        // Force more marbles to spawn on perpendicular grid lines (left/right) as we move forward
        const forceAxis = Math.random() < 0.7; // 70% chance to force axis choice
        const preferXAxis = forceAxis ? true : Math.random() > 0.5; // Prefer X axis (left/right movement)
        
        // Position relative to camera
        let newPos;
        
        if (preferXAxis) {
            // For X-axis marbles (moving left/right), position them ahead and to the sides
            const forwardDistance = -gridSize * (0.3 + Math.random() * 0.5); // Ahead of camera
            const sideDistance = (Math.random() > 0.5 ? 1 : -1) * gridSize * (0.5 + Math.random() * 0.3); // Far to the sides
            
            // Calculate position
            newPos = this.camera.position.clone()
                .add(cameraForward.clone().multiplyScalar(forwardDistance))
                .add(cameraRight.clone().multiplyScalar(sideDistance));
                
            // Snap Z to grid line
            const nearestZ = Math.round(newPos.z / gridSpacing) * gridSpacing;
            newPos.z = nearestZ;
            
            // Set marble to follow X axis
            marble.physics.gridAligned = true;
            marble.physics.followsXAxis = true;
            
            // Set position and velocity
            marble.mesh.position.set(newPos.x, marble.physics.radius, newPos.z);
            
            // Direction based on position - marbles on left move right, marbles on right move left
            const directionX = (newPos.x < this.camera.position.x) ? 1 : -1;
            marble.physics.velocity.set(directionX * SCENE_CONFIG.marbles.rollSpeed, 0, 0);
        } else {
            // For Z-axis marbles (moving forward/backward), position them to the sides
            const forwardDistance = -gridSize * (0.2 + Math.random() * 0.6); // Varied distance ahead
            const sideDistance = (Math.random() > 0.5 ? 1 : -1) * gridSize * (0.2 + Math.random() * 0.4); // Not too far to sides
            
            // Calculate position
            newPos = this.camera.position.clone()
                .add(cameraForward.clone().multiplyScalar(forwardDistance))
                .add(cameraRight.clone().multiplyScalar(sideDistance));
                
            // Snap X to grid line
            const nearestX = Math.round(newPos.x / gridSpacing) * gridSpacing;
            newPos.x = nearestX;
            
            // Set marble to follow Z axis
            marble.physics.gridAligned = true;
            marble.physics.followsXAxis = false;
            
            // Set position and velocity
            marble.mesh.position.set(newPos.x, marble.physics.radius, newPos.z);
            
            // Most Z-axis marbles should move away from camera (forward)
            const directionZ = Math.random() < 0.8 ? -1 : 1; // 80% chance to move forward
            marble.physics.velocity.set(0, 0, directionZ * SCENE_CONFIG.marbles.rollSpeed);
        }
        
        // Reset bounce phase
        marble.physics.bouncePhase = Math.random() * Math.PI * 2;
        
        // Potentially change color
        if (Math.random() > 0.7) {
            const newColor = new THREE.Color(
                SCENE_CONFIG.marbles.colors[Math.floor(Math.random() * SCENE_CONFIG.marbles.colors.length)]
            );
            marble.material.uniforms.baseColor.value = newColor;
            marble.material.uniforms.glowColor.value = newColor;
            marble.initialColor = newColor.clone();
        }
        
        // Reset glow intensity
        marble.initialGlow = Math.random() * SCENE_CONFIG.marbles.glow.intensity;
    }
    
    createFloatingArtifacts() {
        this.floatingArtifacts = [];
        const artifactCount = 30; // Number of artifacts to create
        
        // Define different geometric shapes for variety
        const geometries = [
            new THREE.TetrahedronGeometry(1, 0), // Triangular pyramid
            new THREE.OctahedronGeometry(1, 0),  // Diamond shape
            new THREE.IcosahedronGeometry(1, 0), // Complex polyhedron
            new THREE.TorusGeometry(1, 0.4, 8, 12), // Ring
            new THREE.TorusKnotGeometry(0.8, 0.3, 32, 8, 2, 3), // Complex knot
            new THREE.DodecahedronGeometry(1, 0) // Another complex polyhedron
        ];
        
        // Define artifact colors - using bright neon colors
        const artifactColors = [
            '#00ffff', // Cyan
            '#ff00ff', // Magenta
            '#ffff00', // Yellow
            '#00ff8f', // Neon green
            '#ff2a6d', // Neon pink
            '#01cdfe', // Bright blue
            '#05ffa1', // Bright mint
            '#b967ff'  // Purple
        ];
        
        // Create shader material for the artifacts
        const artifactMaterial = new THREE.ShaderMaterial({
            uniforms: {
                baseColor: { value: new THREE.Color(artifactColors[0]) },
                glowColor: { value: new THREE.Color(artifactColors[0]) },
                glowIntensity: { value: 1.0 },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    // Add subtle vertex displacement for organic movement
                    vec3 pos = position;
                    float displacement = sin(time * 2.0 + position.x * 5.0) * 0.05;
                    pos += normal * displacement;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 baseColor;
                uniform vec3 glowColor;
                uniform float glowIntensity;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Calculate fresnel effect for edge glow
                    vec3 viewDirection = normalize(cameraPosition - vPosition);
                    float fresnel = 1.0 - max(0.0, dot(viewDirection, vNormal));
                    fresnel = pow(fresnel, 3.0) * glowIntensity;
                    
                    // Pulse effect
                    float pulse = sin(time * 3.0) * 0.5 + 0.5;
                    
                    // Final color with glow
                    vec3 finalColor = mix(baseColor, glowColor, fresnel * pulse);
                    
                    gl_FragColor = vec4(finalColor, 0.8); // Slightly transparent
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < artifactCount; i++) {
            // Clone the material so each artifact can have its own color and animation
            const material = artifactMaterial.clone();
            const colorIndex = Math.floor(Math.random() * artifactColors.length);
            const color = new THREE.Color(artifactColors[colorIndex]);
            
            material.uniforms.baseColor.value = color;
            material.uniforms.glowColor.value = color;
            material.uniforms.glowIntensity.value = 0.5 + Math.random() * 1.5;
            
            // Select a random geometry
            const geometryIndex = Math.floor(Math.random() * geometries.length);
            const geometry = geometries[geometryIndex].clone();
            
            // Random scale for variety
            const scale = 0.5 + Math.random() * 2.0;
            geometry.scale(scale, scale, scale);
            
            // Create mesh
            const artifact = new THREE.Mesh(geometry, material);
            
            // Position randomly in the scene
            const posRange = 200;
            artifact.position.set(
                (Math.random() - 0.5) * posRange,
                (Math.random() - 0.5) * posRange / 2 + 50, // Keep most artifacts above the grid
                (Math.random() - 0.5) * posRange - 50 // Mostly in front of the camera
            );
            
            // Add physics properties for movement
            artifact.physics = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 1,
                    (Math.random() - 0.5) * 2
                ),
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 0.01,
                    Math.random() * 0.01,
                    Math.random() * 0.01
                ),
                pulsePhase: Math.random() * Math.PI * 2,
                lifetime: 10 + Math.random() * 20, // Seconds before regenerating
                age: 0
            };
            
            this.scene.add(artifact);
            this.floatingArtifacts.push(artifact);
        }
    }
    
    updateFloatingArtifacts(delta) {
        const time = this.clock.getElapsedTime();
        
        this.floatingArtifacts.forEach(artifact => {
            // Update position based on velocity
            artifact.position.add(artifact.physics.velocity.clone().multiplyScalar(delta));
            
            // Update rotation
            artifact.rotation.x += artifact.physics.rotationSpeed.x;
            artifact.rotation.y += artifact.physics.rotationSpeed.y;
            artifact.rotation.z += artifact.physics.rotationSpeed.z;
            
            // Update shader time uniform for animation effects
            artifact.material.uniforms.time.value = time + artifact.physics.pulsePhase;
            
            // Update age and check if it's time to respawn
            artifact.physics.age += delta;
            if (artifact.physics.age > artifact.physics.lifetime) {
                this.respawnArtifact(artifact);
            }
            
            // Fade out artifacts that are getting too far away
            const distanceToCamera = artifact.position.distanceTo(this.camera.position);
            if (distanceToCamera > 250) {
                // Start fading out
                const opacity = Math.max(0, 1 - (distanceToCamera - 250) / 50);
                artifact.material.opacity = opacity;
                
                // Respawn if completely faded out
                if (opacity < 0.05) {
                    this.respawnArtifact(artifact);
                }
            } else {
                artifact.material.opacity = 0.8; // Reset opacity
            }
        });
    }
    
    respawnArtifact(artifact) {
        // Reset age
        artifact.physics.age = 0;
        
        // New lifetime
        artifact.physics.lifetime = 10 + Math.random() * 20;
        
        // New position - spawn in front of the camera but off-screen
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const perpendicular = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x).normalize();
        
        // Position to the sides and in front of the camera
        const distance = 150 + Math.random() * 100;
        const sideOffset = (Math.random() - 0.5) * 200;
        const heightOffset = (Math.random() - 0.5) * 100 + 50;
        
        artifact.position.copy(this.camera.position)
            .add(cameraDirection.multiplyScalar(distance))
            .add(perpendicular.multiplyScalar(sideOffset))
            .add(new THREE.Vector3(0, heightOffset, 0));
        
        // New velocity - slight movement in random directions
        artifact.physics.velocity.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 2
        );
        
        // New rotation speed
        artifact.physics.rotationSpeed.set(
            Math.random() * 0.01,
            Math.random() * 0.01,
            Math.random() * 0.01
        );
        
        // New pulse phase
        artifact.physics.pulsePhase = Math.random() * Math.PI * 2;
        
        // Potentially change color
        if (Math.random() > 0.7) {
            const artifactColors = [
                '#00ffff', '#ff00ff', '#ffff00', '#00ff8f', 
                '#ff2a6d', '#01cdfe', '#05ffa1', '#b967ff'
            ];
            const newColor = new THREE.Color(
                artifactColors[Math.floor(Math.random() * artifactColors.length)]
            );
            artifact.material.uniforms.baseColor.value = newColor;
            artifact.material.uniforms.glowColor.value = newColor;
        }
        
        // Reset opacity
        artifact.material.opacity = 0.8;
    }

    createRootStructure() {
        const config = SCENE_CONFIG.roots;
        const segmentCount = config.structure.mainSegments;
        const branchProbability = config.structure.branchProbability;
        const maxBranchDepth = config.structure.maxBranchDepth;
        
        const createRootSegment = (startPoint, direction, depth = 0, thickness = config.structure.thickness.main) => {
            if (depth >= maxBranchDepth || thickness < config.structure.thickness.min) return null;
            
            // Create a curved path for this segment
            const points = [];
            const segmentLength = config.structure.minSegmentLength + 
                Math.random() * (config.structure.maxSegmentLength - config.structure.minSegmentLength);
            const pointCount = config.structure.pointsPerSegment;
            
            for (let i = 0; i < pointCount; i++) {
                const t = i / (pointCount - 1);
                const point = startPoint.clone();
                
                // Add some randomness to the path
                const randomOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5
                );
                
                point.add(direction.clone().multiplyScalar(t * segmentLength));
                point.add(randomOffset);
                points.push(point);
            }
            
            // Create the curve
            const curve = new THREE.CatmullRomCurve3(points);
            
            // Create tube geometry
            const tubeGeometry = new THREE.TubeGeometry(
                curve,
                20, // tubular segments
                thickness,
                8, // radial segments
                false // closed
            );
            
            // Create material with glow effect
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    baseColor: { value: new THREE.Color(config.appearance.colors.primary) },
                    pulseColor: { value: new THREE.Color(config.appearance.colors.pulse) },
                    energyColor: { value: new THREE.Color(config.appearance.colors.energy) },
                    glowIntensity: { value: config.appearance.glow.intensity },
                    pulseSpeed: { value: config.appearance.animation.pulseSpeed },
                    energyFlowSpeed: { value: config.appearance.animation.energyFlowSpeed }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        vPosition = position;
                        vNormal = normal;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 baseColor;
                    uniform vec3 pulseColor;
                    uniform vec3 energyColor;
                    uniform float glowIntensity;
                    uniform float pulseSpeed;
                    uniform float energyFlowSpeed;
                    
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        // Create energy pulse effect
                        float pulse = sin(vPosition.z * 0.1 + time * pulseSpeed) * 0.5 + 0.5;
                        
                        // Calculate fresnel effect for edge glow
                        vec3 viewDirection = normalize(cameraPosition - vPosition);
                        float fresnel = pow(1.0 - max(0.0, dot(viewDirection, normalize(vNormal))), 3.0);
                        
                        // Energy flow effect
                        float energy = sin(vPosition.z * 0.05 + time * energyFlowSpeed) * 0.5 + 0.5;
                        
                        // Mix colors based on pulse and energy
                        vec3 finalColor = mix(baseColor, pulseColor, pulse);
                        finalColor = mix(finalColor, energyColor, energy * 0.3);
                        
                        // Add edge glow
                        finalColor += vec3(1.0) * fresnel * glowIntensity;
                        
                        gl_FragColor = vec4(finalColor, ${config.appearance.opacity.base} + fresnel * ${config.appearance.opacity.edge});
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide
            });
            
            // Create mesh
            const tube = new THREE.Mesh(tubeGeometry, material);
            
            // Store the root segment
            this.rootStructures.push({
                mesh: tube,
                material: material,
                initialZ: startPoint.z,
                thickness: thickness
            });
            
            this.scene.add(tube);
            
            // Create branches
            if (depth < maxBranchDepth && Math.random() < branchProbability) {
                const branchCount = 1 + Math.floor(Math.random() * 2);
                for (let i = 0; i < branchCount; i++) {
                    const branchPoint = points[Math.floor(points.length * 0.5)].clone();
                    
                    // Use configured branch angles
                    const branchDirection = direction.clone()
                        .add(new THREE.Vector3(
                            (Math.random() - 0.5) * config.physics.branchAngles.horizontal,
                            (Math.random() - 0.5) * config.physics.branchAngles.vertical,
                            (Math.random() - 0.5) * config.physics.branchAngles.horizontal
                        ))
                        .normalize();
                    
                    createRootSegment(
                        branchPoint,
                        branchDirection,
                        depth + 1,
                        thickness * config.structure.thickness.branchReduction
                    );
                }
            }
        };
        
        // Create initial root segments
        for (let i = 0; i < segmentCount; i++) {
            const startX = (Math.random() - 0.5) * this.citySize;
            const startY = -config.structure.startDepth.min - 
                          Math.random() * (config.structure.startDepth.max - config.structure.startDepth.min);
            const startZ = (Math.random() - 0.5) * this.citySize;
            
            const startPoint = new THREE.Vector3(startX, startY, startZ);
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * config.physics.branchAngles.horizontal,
                (Math.random() - 0.5) * config.physics.branchAngles.vertical,
                (Math.random() - 0.5) * config.physics.branchAngles.horizontal
            ).normalize();
            
            createRootSegment(startPoint, direction);
        }
    }

    createHUD() {
        // Create HUD container
        const hudContainer = document.createElement('div');
        hudContainer.id = 'hudContainer';
        hudContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            perspective: 1000px;
        `;

        // Create speed indicator
        const speedIndicator = document.createElement('div');
        speedIndicator.className = 'speed-indicator';
        speedIndicator.style.cssText = `
            position: absolute;
            bottom: ${SCENE_CONFIG.hud.bars.bottom.height + 20}px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 0 0 10px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.5)};
            background: ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.05)};
            padding: 8px 12px;
            border-radius: 12px;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        `;

        // Create boost meter container
        const boostMeterContainer = document.createElement('div');
        boostMeterContainer.className = 'boost-meter-container';
        boostMeterContainer.style.cssText = `
            position: absolute;
            bottom: ${SCENE_CONFIG.hud.bars.bottom.height + 60}px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 4px;
            background: ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.2)};
            border-radius: 2px;
            overflow: hidden;
        `;

        // Create boost meter fill
        const boostMeterFill = document.createElement('div');
        boostMeterFill.className = 'boost-meter-fill';
        boostMeterFill.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 1)},
                ${this.colorToRGBA(SCENE_CONFIG.hud.colors.pulse, 1)}
            );
            transform-origin: left;
            transition: transform 0.3s ease;
        `;

        // Create boost label
        const boostLabel = document.createElement('div');
        boostLabel.className = 'boost-label';
        boostLabel.textContent = 'BOOST';
        boostLabel.style.cssText = `
            position: absolute;
            bottom: ${SCENE_CONFIG.hud.bars.bottom.height + 70}px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 12px;
        `;

        // Assemble boost meter
        boostMeterContainer.appendChild(boostMeterFill);

        // Create enhanced cockpit frame bars
        const createFrameBars = () => {
            // Create container for bars
            const barsContainer = document.createElement('div');
            barsContainer.className = 'cockpit-bars-container';
            barsContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                overflow: hidden;
                border: 12px solid rgba(0, 0, 0, 0.4);
                border-radius: 80px;
            `;

            // Bottom bar with curve
            const bottomBar = document.createElement('div');
            bottomBar.className = 'cockpit-bar bottom-bar';
            bottomBar.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 70%;
                height: ${SCENE_CONFIG.hud.bars.bottom.height}px;
                background: linear-gradient(
                    to bottom,
                    transparent,
                    ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.1)} 40%,
                    ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.2)} 60%,
                    ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.6)} 80%
                );
                border-top-left-radius: ${SCENE_CONFIG.hud.bars.bottom.curve}px;
                border-top-right-radius: ${SCENE_CONFIG.hud.bars.bottom.curve}px;
                transform-origin: bottom center;
            `;

            // Side bars with stretch effect
            ['left', 'right'].forEach(side => {
                const sideBar = document.createElement('div');
                sideBar.className = `cockpit-bar side-bar ${side}-bar`;
                sideBar.style.cssText = `
                    position: absolute;
                    top: 50%;
                    ${side}: 0;
                    width: ${SCENE_CONFIG.hud.bars.side.width}px;
                    height: 60%;
                    transform: translateY(-50%);
                    background: linear-gradient(
                        ${side === 'left' ? 'to right' : 'to left'},
                        transparent,
                        ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.1)} 40%,
                        ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.2)} 60%,
                        ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.6)} 80%
                    );
                    border-${side === 'left' ? 'right' : 'left'}-radius: ${SCENE_CONFIG.hud.layout.curveRadius}px;
                    transform-origin: ${side} center;
                `;
                barsContainer.appendChild(sideBar);
                this.hudElements[`${side}Bar`] = sideBar;
            });

            // Central directional bar
            const centerBar = document.createElement('div');
            centerBar.className = 'cockpit-bar center-bar';
            centerBar.style.cssText = `
                position: absolute;
                bottom: ${SCENE_CONFIG.hud.bars.bottom.height - 20}px;
                left: 50%;
                transform: translateX(-50%);
                width: 40%;
                height: ${SCENE_CONFIG.hud.layout.barThickness}px;
                background: linear-gradient(
                    to right,
                    transparent,
                    ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.4)},
                    ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 1)},
                    ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.4)},
                    transparent
                );
                border-radius: ${SCENE_CONFIG.hud.layout.barThickness}px;
                box-shadow: 0 0 10px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.3)};
            `;
            
            barsContainer.appendChild(bottomBar);
            barsContainer.appendChild(centerBar);
            hudContainer.appendChild(barsContainer);
            
            this.hudElements.bottomBar = bottomBar;
            this.hudElements.centerBar = centerBar;
        };

        createFrameBars();

        // Add new elements to HUD
        hudContainer.appendChild(speedIndicator);
        hudContainer.appendChild(boostMeterContainer);
        hudContainer.appendChild(boostLabel);

        // Store references to new elements
        this.hudElements.speedIndicator = speedIndicator;
        this.hudElements.boostMeterFill = boostMeterFill;

        document.body.appendChild(hudContainer);
        this.hudContainer = hudContainer;
    }

    updateHUD() {
        // Update cockpit bars based on movement
        if (this.hudElements.leftBar && this.hudElements.rightBar) {
            const rollFactor = this.controls.rollAngle || 0;
            const speedFactor = this.controls.boost ? 1.2 : 1;
            const tiltFactor = Math.abs(this.camera.rotation.x) / Math.PI;

            // Update side bars
            this.hudElements.leftBar.style.transform = `
                translateY(-50%) 
                scaleY(${1 + tiltFactor * 0.2})
                scaleX(${1 + (this.controls.boost ? 0.2 : 0)})
                rotate(${rollFactor * 2}deg)
            `;
            this.hudElements.rightBar.style.transform = `
                translateY(-50%) 
                scaleY(${1 + tiltFactor * 0.2})
                scaleX(${1 + (this.controls.boost ? 0.2 : 0)})
                rotate(${rollFactor * 2}deg)
            `;

            // Update bottom bar
            if (this.hudElements.bottomBar) {
                this.hudElements.bottomBar.style.transform = `
                    translateX(-50%)
                    scaleX(${speedFactor})
                    rotate(${rollFactor}deg)
                `;
            }

            // Update center bar
            if (this.hudElements.centerBar) {
                const turnFactor = (this.controls.lookLeft ? -1 : 0) + (this.controls.lookRight ? 1 : 0);
                this.hudElements.centerBar.style.transform = `
                    translateX(-50%)
                    scaleX(${1 + Math.abs(turnFactor) * 0.1})
                    rotate(${turnFactor * 2}deg)
                `;
            }
        }

        // Update speed indicator
        if (this.hudElements.speedIndicator) {
            // Use the stored speed value and multiply by 100 for dramatic effect
            const speedMS = this.currentSpeed * 100; // This will now reach 5000 m/s
            
            // Format speed with thousands separator
            const formattedSpeed = Math.round(speedMS).toLocaleString();
            this.hudElements.speedIndicator.textContent = `${formattedSpeed} m/s`;

            // Enhanced visual effects based on speed
            const speedFactor = Math.min(1, speedMS / 5000); // Normalize speed for effects
            const glowIntensity = 10 + (speedFactor * 30); // Increased glow effect range
            const pulseEffect = this.controls.boost ? 
                `0 0 ${glowIntensity}px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.pulse, 0.8)}, 0 0 ${glowIntensity * 2}px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.pulse, 0.4)}` :
                `0 0 ${glowIntensity}px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.5)}`;

            // Apply enhanced visual effects
            this.hudElements.speedIndicator.style.cssText = `
                position: absolute;
                bottom: ${SCENE_CONFIG.hud.bars.bottom.height + 20}px;
                left: 50%;
                transform: translateX(-50%) scale(${1 + speedFactor * 0.3});
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 24px;
                font-weight: bold;
                text-shadow: ${pulseEffect};
                background: ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.05 + speedFactor * 0.15)};
                padding: 5px 15px;
                border-radius: 10px;
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                transition: transform 0.2s ease;
                letter-spacing: ${speedFactor * 3}px;
            `;
        }

        // Update boost meter and label
        if (this.hudElements.boostMeterFill) {
            // Calculate boost percentage based on boost timer
            const maxBoostTime = SCENE_CONFIG.warp.boostThreshold;
            const boostPercentage = (this.boostTimer / maxBoostTime) * 100;
            
            // Update boost meter fill
            this.hudElements.boostMeterFill.style.transform = `scaleX(${this.controls.boost ? 1 - (boostPercentage / 100) : 1})`;
            
            // Add pulse effect when close to warp
            if (boostPercentage > 80) {
                this.hudElements.boostMeterFill.style.filter = `brightness(${1 + Math.sin(Date.now() * 0.01) * 0.5})`;
            } else {
                this.hudElements.boostMeterFill.style.filter = 'none';
            }

            // Update boost label with percentage
            const boostLabel = document.querySelector('.boost-label');
            if (boostLabel) {
                const percentage = this.controls.boost ? Math.min(100, Math.round(boostPercentage)) : 100;
                boostLabel.textContent = `BOOST ${percentage}%`;
                
                // Add warning effect when close to warp
                if (boostPercentage > 80) {
                    boostLabel.style.color = this.colorToRGBA(SCENE_CONFIG.hud.colors.pulse, 0.8);
                    boostLabel.style.textShadow = `0 0 10px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.pulse, 0.5)}`;
                } else {
                    boostLabel.style.color = this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.6);
                    boostLabel.style.textShadow = `0 0 5px ${this.colorToRGBA(SCENE_CONFIG.hud.colors.primary, 0.3)}`;
                }
            }
        }
    }

    applyGlitchEffect() {
        const glitchDuration = 100; // milliseconds
        this.hudContainer.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        setTimeout(() => {
            this.hudContainer.style.transform = 'none';
        }, glitchDuration);
    }

    colorToRGBA(hex, alpha) {
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    createGroundFog() {
        const fogGeometry = new THREE.BufferGeometry();
        const fogVertices = [];
        const fogSizes = [];
        const fogColors = [];
        const fogOpacities = [];
        
        const config = SCENE_CONFIG.groundFog;
        const color1 = new THREE.Color(config.colors.primary);
        const color2 = new THREE.Color(config.colors.secondary);

        // Create fog particles
        for (let i = 0; i < config.particles.count; i++) {
            // Random position within area
            const x = (Math.random() - 0.5) * config.particles.area.width;
            const z = (Math.random() - 0.5) * config.particles.area.depth;
            const y = config.particles.height.min + 
                     Math.random() * (config.particles.height.max - config.particles.height.min);

            fogVertices.push(x, y, z);

            // Random size
            const size = config.particles.size.min + 
                Math.random() * (config.particles.size.max - config.particles.size.min);
            fogSizes.push(size);

            // Mix colors
            const mixFactor = Math.random() * config.colors.mix;
            const color = new THREE.Color().lerpColors(color1, color2, mixFactor);
            fogColors.push(color.r, color.g, color.b);

            // Initial opacity
            fogOpacities.push(config.opacity.base + Math.random() * config.opacity.pulse);

            // Store particle data for animation
            this.fogParticles.push({
                baseY: y,
                phase: Math.random() * Math.PI * 2,
                speed: config.particles.speed * (0.8 + Math.random() * 0.4)
            });
        }

        fogGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fogVertices, 3));
        fogGeometry.setAttribute('size', new THREE.Float32BufferAttribute(fogSizes, 1));
        fogGeometry.setAttribute('color', new THREE.Float32BufferAttribute(fogColors, 3));
        fogGeometry.setAttribute('opacity', new THREE.Float32BufferAttribute(fogOpacities, 1));

        // Custom shader material for fog
        this.groundFogUniforms = {
            time: { value: 0 },
            fogTexture: { value: this.createFogTexture() }
        };

        const fogMaterial = new THREE.ShaderMaterial({
            uniforms: this.groundFogUniforms,
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
                uniform sampler2D fogTexture;
                uniform float time;
                
                varying vec3 vColor;
                varying float vOpacity;
                
                void main() {
                    vec2 uv = gl_PointCoord;
                    
                    // Sample fog texture
                    vec4 tex = texture2D(fogTexture, uv);
                    
                    // Apply color and opacity
                    gl_FragColor = vec4(vColor, vOpacity * tex.a);
                    
                    // Add subtle pulse
                    float pulse = sin(time * 2.0 + gl_FragCoord.x * 0.01 + gl_FragCoord.y * 0.01) * 0.1 + 0.9;
                    gl_FragColor.a *= pulse;
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.groundFog = new THREE.Points(fogGeometry, fogMaterial);
        this.scene.add(this.groundFog);
    }

    createFogTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Create radial gradient for fog particle
        const gradient = ctx.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    updateGroundFog(delta) {
        if (!this.groundFog || !this.groundFogUniforms) return;

        const positions = this.groundFog.geometry.attributes.position;
        const opacities = this.groundFog.geometry.attributes.opacity;
        const config = SCENE_CONFIG.groundFog;

        // Update time uniform for shader animation
        this.groundFogUniforms.time.value += delta;

        // Get camera position
        const cameraX = this.camera.position.x;
        const cameraZ = this.camera.position.z;

        // Fixed coverage radius regardless of speed
        const coverageRadius = config.particles.area.width * 0.5;
        
        // Update each particle
        for (let i = 0; i < this.fogParticles.length; i++) {
            const particle = this.fogParticles[i];
            const idx = i * 3;
            
            // Get current particle position
            let x = positions.array[idx];
            let z = positions.array[idx + 2];

            // Calculate distance from camera
            const distanceX = x - cameraX;
            const distanceZ = z - cameraZ;
            const distance = Math.sqrt(distanceX * distanceX + distanceZ * distanceZ);

            // Check if particle needs regeneration
            if (distance > coverageRadius) {
                // Generate new position in a circle around camera
                const angle = Math.random() * Math.PI * 2;
                const radius = coverageRadius * (0.3 + Math.random() * 0.7); // Between 30% and 100% of coverage
                
                x = cameraX + Math.cos(angle) * radius;
                z = cameraZ + Math.sin(angle) * radius;

                // Reset particle properties
                particle.baseY = config.particles.height.min + 
                    Math.random() * (config.particles.height.max - config.particles.height.min);
                particle.phase = Math.random() * Math.PI * 2;
                
                // Update position
                positions.array[idx] = x;
                positions.array[idx + 2] = z;
            }

            // Vertical movement
            const y = particle.baseY + 
                Math.sin(this.groundFogUniforms.time.value * particle.speed + particle.phase) * 2;
            positions.array[idx + 1] = y;

            // Smooth distance-based opacity falloff
            const normalizedDistance = distance / coverageRadius;
            const distanceOpacity = Math.max(0, 1 - Math.pow(normalizedDistance, 1.5));
            
            // Combine with base opacity and subtle pulse
            opacities.array[i] = (config.opacity.base + 
                Math.sin(this.groundFogUniforms.time.value * 0.3 + particle.phase) * 
                config.opacity.pulse) * distanceOpacity;
        }

        positions.needsUpdate = true;
        opacities.needsUpdate = true;
    }
}

// Initialize the exploration animation once dependencies are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if the canvas element exists
    const canvas = document.getElementById('novaGridCanvas');
    if (canvas) {
        loadDependencies().then(() => {
            // Initialize Three.js scene
            const app = new ExplorationAnimation();
            app.init();
            app.animate();
        }).catch(error => {
            console.error('Error initializing animation:', error);
        });
    }
});

