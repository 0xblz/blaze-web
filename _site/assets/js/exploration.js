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
        fov: 125, // Reduced FOV for better perspective
        near: 0.1,
        far: 10000, // Much larger far plane to see distant stars
        position: { x: 0, y: 1, z: 5 },
        movementSpeed: 0.3,
        waveMagnitude: { x: 0.5, y: 0 }, // Sine wave movement magnitude
        waveSpeed: { x: 0.5, y: 0 },  // Sine wave movement speed
        controls: {
            enabled: true,
            moveSpeed: 0.5,      // Base movement speed
            boostSpeed: 1.5,     // Speed when holding shift
            turnSpeed: 0.02,     // How fast to turn left/right
            autoMove: true,      // Whether to automatically move forward
            keyMapping: {
                forward: 'ArrowUp',
                backward: 'ArrowDown',
                left: 'ArrowLeft',
                right: 'ArrowRight',
                boost: 'ShiftLeft',
                brake: 'Space'
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
        size: 400,
        divisions: 500,
        mainColor: 0xff00ff,    // Changed to pink
        secondaryColor: 0x00ffff, // Cyan as secondary
        shader: {
            color1: [1.0, 0.2, 0.8], // Pink/magenta
            color2: [0.2, 0.8, 1.0], // Cyan/blue
            gridLines: 40,          // More grid lines
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
        size: 400,
        buildingCount: 1500,
        neonStructureCount: 500,
        building: {
            maxHeight: 200,
            minHeight: 4,
            maxWidth: 1,
            minWidth: 0.5
        }
    },
    
    // Post-processing
    postProcessing: {
        bloom: {
            strength: 0.7,    // Lower overall bloom
            radius: 0.3,      // Tighter bloom radius
            threshold: 0.4    // Higher threshold to only catch bright points
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
        starSize: 5.0,       // Much larger stars
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
        
        // Controls state
        this.controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            boost: false,
            brake: false,
            direction: new THREE.Vector3(0, 0, -1), // Forward direction vector
            velocity: new THREE.Vector3()
        };
    }

    init() {
        // Get the canvas element
        const canvas = document.getElementById('explorationCanvas');
        
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
        const speeds = []; // Add speeds for individual stars
        
        for (let i = 0; i < SCENE_CONFIG.starfield.stars; i++) {
            // Position stars in a large sphere around the camera
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = SCENE_CONFIG.starfield.size * (0.2 + Math.random() * 0.8);
            
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = -radius * Math.cos(theta);
            
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
            
            // Random speed - closer stars move faster
            const distanceFactor = 1.0 - (Math.abs(z) / SCENE_CONFIG.starfield.size);
            const speed = SCENE_CONFIG.starfield.speed + 
                         (distanceFactor * SCENE_CONFIG.starfield.maxSpeed * Math.random());
            speeds.push(speed);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // Store speeds for animation
        this.starSpeeds = speeds;
        
        // Create a simple point material for stars
        const material = new THREE.PointsMaterial({
            size: SCENE_CONFIG.starfield.starSize,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true,
            depthWrite: false,
            depthTest: false
        });
        
        // Create the star field
        this.stars = new THREE.Points(geometry, material);
        this.stars.renderOrder = -1000; // Ensure it renders first
        this.scene.add(this.stars);
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
                cameraPosition: { value: new THREE.Vector3() }
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
                uniform vec3 cameraPosition;
                
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
                    float pathDistance = abs(vPosition.x - cameraPosition.x);
                    
                    // Basic grid effect
                    float gridX = abs(fract(vPosition.x * ${SCENE_CONFIG.grid.shader.gridLines} - time * 0.1) - 0.5);
                    float gridZ = abs(fract(vPosition.z * ${SCENE_CONFIG.grid.shader.gridLines} - time * 0.5) - 0.5);
                    
                    // Noise distortion
                    float noise = snoise(vec2(vPosition.x * 0.05, vPosition.z * 0.05) + time * 0.2) * 0.1;
                    gridX += noise;
                    gridZ += noise;
                    
                    // Grid lines with z-lines more prominent (direction of travel)
                    float grid = min(gridX, gridZ * 0.5);
                    
                    // Pulse effect
                    float pulse = sin(time * ${SCENE_CONFIG.grid.shader.pulseSpeed}) * 0.5 + 0.5;
                    
                    // Path effect - glowing path that follows camera x position
                    float pathWidth = ${SCENE_CONFIG.grid.shader.pathWidth};
                    float pathGlow = smoothstep(pathWidth, 0.0, pathDistance);
                    pathGlow *= ${SCENE_CONFIG.grid.shader.pathIntensity}; // Increase intensity
                    
                    // Racing lines effect - lines that appear to be generated as you move
                    float raceSpeed = ${SCENE_CONFIG.grid.shader.raceSpeed};
                    float raceLength = ${SCENE_CONFIG.grid.shader.raceLength};
                    float raceDensity = ${SCENE_CONFIG.grid.shader.raceDensity};
                    
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
                        float lineDist = abs(vPosition.x - cameraPosition.x - lineX);
                        
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
        
        // Use simplex-like noise for height (we'll fake it with Math.random for simplicity)
        const seed = Math.sin(x * 0.1) * Math.cos(z * 0.1);
        const height = 1 + Math.pow(Math.random(), 2) * SCENE_CONFIG.city.building.maxHeight;
        const width = 0.5 + Math.random() * SCENE_CONFIG.city.building.maxWidth;
        const depth = 0.5 + Math.random() * SCENE_CONFIG.city.building.maxWidth;
        
        // Create geometry
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create custom shader material for the building
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                emissiveColor: { value: new THREE.Color(
                    0.1 + Math.random() * 0.2, 
                    0.1 + Math.random() * 0.3, 
                    0.2 + Math.random() * 0.6
                ) },
                baseColor: { value: new THREE.Color(0x223366) }, // Lighter base color for buildings
                glitchIntensity: { value: 0.1 + Math.random() * 0.3 }
            },
            vertexShader: `
                uniform float time;
                uniform float glitchIntensity;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Pseudo-random function
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Apply glitch effect to vertex position
                    vec3 pos = position;
                    
                    // Glitch effect based on time and position
                    float glitch = random(vec2(floor(time * 2.0), floor(position.y * 10.0)));
                    if (glitch > 0.95) {
                        pos.x += sin(time * 20.0) * glitchIntensity;
                    }
                    
                    // Subtle wave motion
                    pos.x += sin(pos.y * 0.2 + time) * 0.05;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 emissiveColor;
                uniform vec3 baseColor;
                uniform float glitchIntensity;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Pseudo-random function
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void main() {
                    vec2 uv = vUv;
                    
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
                    
                    // Edge glow
                    float edgeX = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x);
                    float edgeY = smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
                    float edge = edgeX * edgeY;
                    
                    // Combine effects - brighter windows
                    color = mix(color, emissiveColor * 1.5, window * windowLight * flicker);
                    color = mix(color, emissiveColor * 1.2, edge * 0.7);
                    
                    // Glitch effect
                    float glitchLine = step(0.98, random(vec2(floor(time * 10.0), floor(uv.y * 50.0))));
                    if (glitchLine > 0.0) {
                        color = mix(color, vec3(1.0), 0.8 * glitchIntensity);
                        
                        // Horizontal displacement
                        uv.x += (random(vec2(time, uv.y)) - 0.5) * 0.1;
                    }
                    
                    // Scanlines - reduced for cleaner look
                    float scanline = sin(uv.y * 100.0 + time * 5.0) * 0.3 + 0.7;
                    color *= mix(0.95, 1.0, scanline);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
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
        
        // Create neon material with custom shader - brighter colors for evening
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(
                    Math.random() > 0.3 ? 0.8 + Math.random() * 0.2 : 0.0, // More red
                    Math.random() > 0.3 ? 0.8 + Math.random() * 0.2 : 0.0, // More green
                    Math.random() > 0.3 ? 0.8 + Math.random() * 0.2 : 0.0  // More blue
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
        const x = (Math.random() - 0.5) * this.citySize * 2;
        const y = 5 + Math.random() * 20;
        const z = (Math.random() - 0.5) * this.citySize * 2 - 50; // Bias towards negative z
        
        neon.position.set(x, y, z);
        
        // Store for animation
        this.neonLights.push({
            mesh: neon,
            material: material,
            initialY: y,
            initialX: x,
            initialZ: z,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            floatSpeed: 0.2 + Math.random() * 0.5
        });
        
        this.scene.add(neon);
    }

    setupPostProcessing() {
        // Create composer
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add bloom pass with settings to enhance stars
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1,    // Higher strength for stars
            1,    // Larger radius for bigger glow
            0.1     // Lower threshold to catch more stars
        );
        this.composer.addPass(bloomPass);
        
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
                    float aberration = distortion * (0.5 + 0.5 * sin(time * 0.5));
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
        
        // Add instructions overlay
        this.createControlsOverlay();
    }
    
    createControlsOverlay() {
        // Create an overlay with instructions
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.bottom = '20px';
        overlay.style.left = '20px';
        overlay.style.color = 'white';
        overlay.style.fontFamily = 'Arial, sans-serif';
        overlay.style.fontSize = '14px';
        overlay.style.padding = '10px';
        overlay.style.background = 'rgba(0, 0, 0, 0.5)';
        overlay.style.borderRadius = '5px';
        overlay.style.pointerEvents = 'none'; // Don't block clicks
        overlay.style.zIndex = '1000';
        overlay.style.textShadow = '0 0 3px #ff00ff';
        
        overlay.innerHTML = `
            <div style="margin-bottom: 5px; font-weight: bold;">Controls:</div>
            <div>↑ / ↓ : Move forward / backward</div>
            <div>← / → : Turn left / right</div>
            <div>Shift : Boost speed</div>
            <div>Space : Brake</div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    onKeyDown(event) {
        const keyMapping = SCENE_CONFIG.camera.controls.keyMapping;
        
        switch (event.code) {
            case keyMapping.forward:
                this.controls.moveForward = true;
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
            case keyMapping.boost:
                this.controls.boost = true;
                break;
            case keyMapping.brake:
                this.controls.brake = true;
                break;
        }
    }
    
    onKeyUp(event) {
        const keyMapping = SCENE_CONFIG.camera.controls.keyMapping;
        
        switch (event.code) {
            case keyMapping.forward:
                this.controls.moveForward = false;
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
            case keyMapping.boost:
                this.controls.boost = false;
                break;
            case keyMapping.brake:
                this.controls.brake = false;
                break;
        }
    }
    
    updateControls(delta) {
        // Get current speed based on boost/brake state
        let currentSpeed = SCENE_CONFIG.camera.controls.moveSpeed;
        
        if (this.controls.boost) {
            currentSpeed = SCENE_CONFIG.camera.controls.boostSpeed;
        }
        if (this.controls.brake) {
            currentSpeed *= 0.3; // Reduce speed when braking
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
        
        // Update stars - make them move towards the camera
        if (this.stars) {
            const positions = this.stars.geometry.attributes.position.array;
            
            for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
                // Get the star's current position
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];
                
                // Calculate direction vector from star to camera
                const dx = this.camera.position.x - x;
                const dy = this.camera.position.y - y;
                const dz = this.camera.position.z - z;
                
                // Normalize the direction vector
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                // Move star towards camera based on its speed
                const speed = this.starSpeeds[j] * delta;
                
                // Move star along z-axis primarily (towards camera)
                positions[i + 2] += speed * 10;
                
                // Add slight movement towards camera's x and y for perspective
                positions[i] += (dx / distance) * speed;
                positions[i + 1] += (dy / distance) * speed;
                
                // If star passes the camera, reset it far away
                if (positions[i + 2] > this.camera.position.z) {
                    // Reset to a random position far away
                    const phi = Math.random() * Math.PI * 2;
                    const theta = Math.random() * Math.PI;
                    const radius = SCENE_CONFIG.starfield.size * (0.8 + Math.random() * 0.2);
                    
                    positions[i] = radius * Math.sin(theta) * Math.cos(phi) + this.camera.position.x;
                    positions[i + 1] = radius * Math.sin(theta) * Math.sin(phi) + this.camera.position.y;
                    positions[i + 2] = -radius * Math.cos(theta) + this.camera.position.z;
                    
                    // Update speed for the recycled star
                    const distanceFactor = 1.0 - (Math.abs(positions[i + 2] - this.camera.position.z) / SCENE_CONFIG.starfield.size);
                    this.starSpeeds[j] = SCENE_CONFIG.starfield.speed + 
                                       (distanceFactor * SCENE_CONFIG.starfield.maxSpeed * Math.random());
                }
            }
            
            this.stars.geometry.attributes.position.needsUpdate = true;
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
            this.gridMaterial.uniforms.cameraPosition.value.copy(this.camera.position);
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
        
        // Render scene with post-processing
        this.composer.render();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the exploration animation once dependencies are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if the canvas element exists
    const canvas = document.getElementById('explorationCanvas');
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

