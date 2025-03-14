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

class ExplorationAnimation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.clock = new THREE.Clock();
        this.citySize = 100;
        this.buildings = [];
        this.neonLights = [];
        this.cameraSpeed = 0.1;
        this.time = 0;
    }

    init() {
        // Get the canvas element
        const canvas = document.getElementById('explorationCanvas');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, -100);
        
        // Create renderer - don't pass canvas directly
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000);
        
        // Append the renderer's canvas to our container
        canvas.appendChild(this.renderer.domElement);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x101010);
        this.scene.add(ambientLight);
        
        // Create grid
        this.createGrid();
        
        // Create procedural city
        this.createProceduralCity();
        
        // Add post-processing
        this.setupPostProcessing();
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    createGrid() {
        // Create a grid helper for the ground plane
        const gridSize = 200;
        const gridDivisions = 100;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x0088ff, 0x220066);
        this.scene.add(gridHelper);
        
        // Create a custom shader material for the grid
        const gridMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;
                
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
                
                void main() {
                    vec2 uv = vUv * 2.0 - 1.0;
                    
                    // Grid effect
                    float gridX = abs(fract(uv.x * 20.0 - time * 0.1) - 0.5);
                    float gridY = abs(fract(uv.y * 20.0 - time * 0.05) - 0.5);
                    
                    // Noise distortion
                    float noise = snoise(uv * 5.0 + time * 0.2) * 0.1;
                    gridX += noise;
                    gridY += noise;
                    
                    // Grid lines
                    float grid = min(gridX, gridY);
                    
                    // Pulse effect
                    float pulse = sin(time * 2.0) * 0.5 + 0.5;
                    
                    // Colors
                    vec3 color1 = vec3(0.0, 0.5, 1.0); // Cyan
                    vec3 color2 = vec3(1.0, 0.0, 0.5); // Magenta
                    
                    // Mix colors based on position and time
                    vec3 color = mix(color1, color2, sin(uv.x * 3.0 + time) * 0.5 + 0.5);
                    
                    // Apply grid effect
                    float gridIntensity = smoothstep(0.05, 0.0, grid);
                    color = mix(vec3(0.0), color, gridIntensity * (pulse * 0.5 + 0.5));
                    
                    // Add scanlines
                    float scanline = sin(uv.y * 100.0 + time * 10.0) * 0.5 + 0.5;
                    color *= mix(0.9, 1.0, scanline);
                    
                    // Output final color
                    gl_FragColor = vec4(color, gridIntensity * 0.8);
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
        for (let i = 0; i < 500; i++) {
            this.createBuilding();
        }
        
        // Create floating neon structures
        for (let i = 0; i < 200; i++) {
            this.createNeonStructure();
        }
    }

    createBuilding() {
        // Use procedural noise to determine building properties
        const x = (Math.random() - 0.5) * this.citySize * 2;
        const z = (Math.random() - 0.5) * this.citySize * 2 - 50; // Bias towards negative z for camera path
        
        // Use simplex-like noise for height (we'll fake it with Math.random for simplicity)
        const seed = Math.sin(x * 0.1) * Math.cos(z * 0.1);
        const height = 1 + Math.pow(Math.random(), 2) * 15;
        const width = 0.5 + Math.random() * 2;
        const depth = 0.5 + Math.random() * 2;
        
        // Create geometry
        const geometry = new THREE.BoxGeometry(width, height, depth);
        
        // Create custom shader material for the building
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                emissiveColor: { value: new THREE.Color(
                    Math.random() * 0.1, 
                    0.05 + Math.random() * 0.2, 
                    0.1 + Math.random() * 0.5
                ) },
                baseColor: { value: new THREE.Color(0x020210) },
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
                    
                    // Window pattern
                    float windowX = step(0.9, fract(uv.x * 10.0));
                    float windowY = step(0.9, fract(uv.y * 20.0));
                    float window = windowX * windowY;
                    
                    // Random window lights
                    float windowRandom = random(vec2(floor(uv.x * 10.0), floor(uv.y * 20.0)));
                    float windowLight = step(0.6, windowRandom);
                    
                    // Flickering effect
                    float flicker = sin(time * 10.0 * windowRandom) * 0.5 + 0.5;
                    
                    // Edge glow
                    float edgeX = smoothstep(0.0, 0.05, uv.x) * smoothstep(1.0, 0.95, uv.x);
                    float edgeY = smoothstep(0.0, 0.05, uv.y) * smoothstep(1.0, 0.95, uv.y);
                    float edge = edgeX * edgeY;
                    
                    // Combine effects
                    color = mix(color, emissiveColor, window * windowLight * flicker);
                    color = mix(color, emissiveColor, edge * 0.5);
                    
                    // Glitch effect
                    float glitchLine = step(0.98, random(vec2(floor(time * 10.0), floor(uv.y * 50.0))));
                    if (glitchLine > 0.0) {
                        color = mix(color, vec3(1.0), 0.8 * glitchIntensity);
                        
                        // Horizontal displacement
                        uv.x += (random(vec2(time, uv.y)) - 0.5) * 0.1;
                    }
                    
                    // Scanlines
                    float scanline = sin(uv.y * 100.0 + time * 5.0) * 0.5 + 0.5;
                    color *= mix(0.9, 1.0, scanline);
                    
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
        
        // Create neon material with custom shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(
                    Math.random() > 0.5 ? 1.0 : 0.0,
                    Math.random() > 0.5 ? 1.0 : 0.0,
                    Math.random() > 0.5 ? 1.0 : 0.0
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
                    
                    // Pulse effect
                    float pulse = sin(time * 2.0) * 0.5 + 0.5;
                    
                    // Final color with edge glow
                    vec3 finalColor = color * (0.5 + pulse * 0.5);
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
        
        // Add bloom pass
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        this.composer.addPass(bloomPass);
        
        // Add custom glitch and chromatic aberration shader pass
        const glitchPass = new THREE.ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                amount: { value: 0.08 },
                seed: { value: 0 },
                distortion: { value: 0.1 }
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
                    
                    // Random glitch
                    float glitchSeed = floor(time * 10.0) + seed;
                    float glitchAmount = amount * random(vec2(glitchSeed, 234.0));
                    
                    if (random(vec2(glitchSeed, uv.y * 100.0)) > 0.96) {
                        uv.x += glitchAmount * (random(vec2(glitchSeed, uv.y)) * 2.0 - 1.0);
                        color = texture2D(tDiffuse, uv).rgb;
                    }
                    
                    // Scanlines
                    float scanline = sin(uv.y * 800.0 + time * 10.0) * 0.02 + 1.0;
                    color *= scanline;
                    
                    // Vignette
                    float vignette = smoothstep(1.0, 0.5, length(uv - 0.5) * 1.5);
                    color *= vignette;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });
        glitchPass.renderToScreen = true;
        this.composer.addPass(glitchPass);
        
        // Store the glitch pass for animation
        this.glitchPass = glitchPass;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        this.time += delta;
        
        // Update camera position - move forward
        this.camera.position.z -= this.cameraSpeed;
        
        // Slightly move camera in a sine wave pattern
        this.camera.position.x = Math.sin(this.time * 0.5) * 3;
        this.camera.position.y = 5 + Math.sin(this.time * 0.3) * 1;
        
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
        }
        
        // Update post-processing effects
        if (this.glitchPass) {
            this.glitchPass.uniforms.time.value = this.time;
            this.glitchPass.uniforms.seed.value = Math.random() * 100;
            
            // Increase glitch during certain intervals
            if (Math.sin(this.time * 0.1) > 0.8) {
                this.glitchPass.uniforms.amount.value = 0.2;
            } else {
                this.glitchPass.uniforms.amount.value = 0.08;
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

