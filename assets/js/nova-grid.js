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
            moveSpeed: 0.2,      // Base movement speed
            boostSpeed: 2.5,     // Speed when holding shift
            turnSpeed: 0.02,     // How fast to turn left/right
            autoMove: true,      // Whether to automatically move forward
            keyMapping: {
                forward: 'ArrowUp',
                backward: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight'
            }
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
        buildingCount: 500,
        neonStructureCount: 100,
        building: {
            maxHeight: 200,
            minHeight: 50,
            maxWidth: 5,
            minWidth: 0.5
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
        stars: 5000,         // Number of stars
        size: 2000,         // Size of the star field
        starSize: 3.0,       // Much larger stars
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
        size: 250,            // Size of cloud particles
        sizeVariation: 40,   // Variation in cloud size
        color: 0x4422ff,     // Base color (blue/purple)
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
                strength: 1.2,  // Increased normal bloom
                radius: 0.5,    // Increased normal radius
                threshold: 0.2  // Lower threshold for more bloom
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
                strength: 1.5,    // Even stronger bloom in warp
                radius: 0.8,      // Wider bloom radius
                threshold: 0.2     // Even lower threshold
            }
        }
    }
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
        this.cameraSpeed = SCENE_CONFIG.camera.movementSpeed;
        this.time = 0;
        this.stars = null;
        this.skyGlow = null;
        this.starSpeeds = [];
        this.clouds = null;
        
        // Controls state
        this.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            boost: false,
            direction: new THREE.Vector3(0, 0, -1), // Forward direction vector
            velocity: new THREE.Vector3()
        };
        
        this.boostTimer = 0;
        this.isWarping = false;
        this.warpTransition = 0; // 0 = normal dimension, 1 = warp dimension
        this.currentDimension = 'normal';
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
        
        // Create procedural city
        this.createProceduralCity();
        
        // Create atmospheric clouds
        this.createClouds();
        
        // Add post-processing
        this.setupPostProcessing();
        
        // Setup keyboard controls
        if (SCENE_CONFIG.camera.controls.enabled) {
            this.setupControls();
        }
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
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
                    float fresnel = pow(1.0 - max(0.0, dot(viewDirection, normalize(vNormal))), 3.0);
                    
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
                    float electricPulse = sin(time * 5.0 + vPosition.y * 0.2) * 0.5 + 0.5;
                    
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
                    float alpha = 0.95 + edge * 0.05;
                    
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
                
                void main() {
                    vec2 uv = vUv;
                    
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
            case keyMapping.forward:
                this.controls.moveForward = true;
                this.controls.boost = true; // Activate boost when moving forward
                break;
            case keyMapping.backward:
                this.controls.moveBackward = true;
                break;
            case keyMapping.left:
                this.controls.moveLeft = true;
                break;
            case keyMapping.right:
                this.controls.moveRight = true;
                break;
        }
    }
    
    onKeyUp(event) {
        const keyMapping = SCENE_CONFIG.camera.controls.keyMapping;
        
        switch (event.code) {
            case keyMapping.forward:
                this.controls.moveForward = false;
                this.controls.boost = false; // Deactivate boost when forward key is released
                break;
            case keyMapping.backward:
                this.controls.moveBackward = false;
                break;
            case keyMapping.left:
                this.controls.moveLeft = false;
                break;
            case keyMapping.right:
                this.controls.moveRight = false;
                break;
        }
    }
    
    updateControls(delta) {
        // Get current speed based on boost state
        let currentSpeed = SCENE_CONFIG.camera.controls.moveSpeed;
        
        if (this.controls.boost) {
            currentSpeed = SCENE_CONFIG.camera.controls.boostSpeed;
            
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
        
        // Calculate movement based on current direction
        const moveSpeed = currentSpeed * delta * 60; // Normalize by framerate
        
        // Update direction vector based on turning
        if (this.controls.moveLeft) {
            // Rotate direction vector around Y axis (left)
            this.controls.direction.applyAxisAngle(
                new THREE.Vector3(0, 1, 0), 
                SCENE_CONFIG.camera.controls.turnSpeed
            );
        }
        if (this.controls.moveRight) {
            // Rotate direction vector around Y axis (right)
            this.controls.direction.applyAxisAngle(
                new THREE.Vector3(0, 1, 0), 
                -SCENE_CONFIG.camera.controls.turnSpeed
            );
        }
        
        // Normalize direction vector
        this.controls.direction.normalize();
        
        // Calculate velocity based on forward/backward movement
        this.controls.velocity.set(0, 0, 0);
        
        if (this.controls.moveForward || SCENE_CONFIG.camera.controls.autoMove) {
            // Move in the direction we're facing
            this.controls.velocity.add(
                this.controls.direction.clone().multiplyScalar(moveSpeed)
            );
        }
        if (this.controls.moveBackward) {
            // Move opposite to the direction we're facing
            this.controls.velocity.add(
                this.controls.direction.clone().multiplyScalar(-moveSpeed)
            );
        }
        
        // Apply velocity to camera position
        this.camera.position.add(this.controls.velocity);
        
        // Update camera look direction
        const lookAtPosition = this.camera.position.clone().add(this.controls.direction);
        this.camera.lookAt(lookAtPosition);
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
        
        // Render scene with post-processing
        this.composer.render();
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
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            display: none;
            z-index: 1000;
            width: 180px;
            height: 180px;
        `;

        // Only show on mobile
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            mobileControls.style.display = 'grid';
            mobileControls.style.gridTemplateAreas = `
                ". up ."
                "left down right"
                ". . ."
            `;
            mobileControls.style.gridTemplateColumns = '60px 60px 60px';
            mobileControls.style.gridTemplateRows = '60px 60px 60px';
        }

        const createButton = (direction, symbol, gridArea) => {
            const button = document.createElement('button');
            button.innerHTML = symbol;
            button.style.cssText = `
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.3);
                color: white;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                outline: none;
                grid-area: ${gridArea};
                margin: auto;
                padding: 0;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
                user-select: none;
                -webkit-user-select: none;
            `;

            // Touch events for mobile
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onKeyDown({ code: `Arrow${direction}` });
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.onKeyUp({ code: `Arrow${direction}` });
                button.style.background = 'rgba(0, 0, 0, 0.3)';
            });

            // Prevent default touch behavior
            button.addEventListener('touchmove', (e) => {
                e.preventDefault();
            });

            return button;
        };

        // Create directional buttons with arrow symbols
        const upButton = createButton('Up', '↑', 'up');
        const downButton = createButton('Down', '↓', 'down');
        const leftButton = createButton('Left', '←', 'left');
        const rightButton = createButton('Right', '→', 'right');

        mobileControls.appendChild(upButton);
        mobileControls.appendChild(leftButton);
        mobileControls.appendChild(downButton);
        mobileControls.appendChild(rightButton);

        document.body.appendChild(mobileControls);
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

