// Load Three.js and required libraries from CDN
const loadDependencies = async () => {
    // First load Three.js core
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
    
    // Then load dependencies in order - using updated OrbitControls URL
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.7/dat.gui.min.js');
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

// Scene setup
let scene, camera, renderer, marble, controls, gui;

// Marble parameters
const params = {
    baseColor: '#0a0a44',
    accentColor: '#8f74ff',
    patternComplexity: 0.9,
    patternScale: 1.0,
    swirlIntensity: 0.25,
    swirlFrequency: 3.0,
    transparency: 1.0,
    refractionIntensity: 0.5,
    glossiness: 0.5,
    lightIntensity: 0.6,
    ambientLightColor: '#dbcaff',    // Added ambient light color
    directionalLightColor: '#ffdaf6', // Added directional light color
    displacementStrength: 0.7,
    lineScale: 3.0,      // Controls line frequency
    lineIntensity: 0.5,  // Controls line strength
    isAnimating: false,    // New parameter for animation toggle
    animationSpeed: 1.0,   // New parameter for rotation speed
    randomizeMarble: function() {
        // Generate random base color and convert to HSL for easier darkening
        const baseColorObj = new THREE.Color().setHSL(
            Math.random(),    // random hue
            0.7,             // high saturation
            0.15             // reduced lightness for darker color (changed from implicit 0.5-ish)
        );
        
        // Generate random accent color with controlled lightness
        const accentColorObj = new THREE.Color().setHSL(
            Math.random(),  // random hue
            0.7,           // high saturation
            0.6            // controlled lightness
        );
        
        // Generate random directional light color (vibrant)
        const randomLightColor = new THREE.Color().setHSL(
            Math.random(),  // random hue
            0.8,           // high saturation for vibrant color
            0.8            // high lightness to keep it bright
        );
        
        // Store old values
        const oldParams = { ...params };
        
        // Update parameters
        params.baseColor = '#' + baseColorObj.getHexString();
        params.accentColor = '#' + accentColorObj.getHexString();
        params.patternComplexity = Math.random() * 0.3 + 0.7;
        params.patternScale = Math.random() * 0.5 + 0.5;
        params.swirlIntensity = Math.random() * 0.6 + 0.2;
        params.swirlFrequency = Math.random() * 2.0 + 1.0;
        params.lightIntensity = Math.random() * 0.6 + 0.4;
        params.ambientLightColor = '#ffffff';
        params.directionalLightColor = '#' + randomLightColor.getHexString();
        params.displacementStrength = Math.random() * 0.7 + 0.3;
        params.lineScale = Math.random() + 1.0;
        params.lineIntensity = Math.random() * 0.6 + 0.2;
        
        // Update material uniforms
        marble.material.uniforms.baseColor.value.set(params.baseColor);
        marble.material.uniforms.accentColor.value.set(params.accentColor);
        marble.material.uniforms.patternComplexity.value = params.patternComplexity;
        marble.material.uniforms.patternScale.value = params.patternScale;
        marble.material.uniforms.swirlIntensity.value = params.swirlIntensity;
        marble.material.uniforms.swirlFrequency.value = params.swirlFrequency;
        marble.material.uniforms.transparency.value = params.transparency;
        marble.material.uniforms.refractionIntensity.value = params.refractionIntensity;
        marble.material.uniforms.glossiness.value = params.glossiness;
        marble.material.uniforms.lightIntensity.value = params.lightIntensity;
        marble.material.uniforms.ambientLightColor.value.set(params.ambientLightColor);
        marble.material.uniforms.directionalLightColor.value.set(params.directionalLightColor);
        marble.material.uniforms.displacementStrength.value = params.displacementStrength;
        marble.material.uniforms.lineScale.value = params.lineScale;
        marble.material.uniforms.lineIntensity.value = params.lineIntensity;
        
        // Update lights
        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                child.color.set(params.ambientLightColor);
            } else if (child instanceof THREE.DirectionalLight) {
                child.color.set(params.directionalLightColor);
            }
        });
        
        // Update GUI controllers
        for (let i in gui.__controllers) {
            const controller = gui.__controllers[i];
            if (controller.property in params && params[controller.property] !== oldParams[controller.property]) {
                controller.setValue(params[controller.property]);
            }
        }
        
        // Update folder controllers
        for (let folder in gui.__folders) {
            const controllers = gui.__folders[folder].__controllers;
            for (let i in controllers) {
                const controller = controllers[i];
                if (controller.property in params && params[controller.property] !== oldParams[controller.property]) {
                    controller.setValue(params[controller.property]);
                }
            }
        }
    },
    exportMarble: function() {
        saveAsImage();
    }
};

// Initialize the scene
function init() {
    // Find the container
    const container = document.querySelector('.marble-maker-container');
    if (!container) {
        console.error('Could not find marble-maker-container');
        return;
    }

    // Create scene
    scene = new THREE.Scene();

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    // Setup renderer with alpha
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        preserveDrawingBuffer: true,
        alpha: true  // Enable alpha
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha
    container.appendChild(renderer.domElement);

    // Add cursor style handling
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    renderer.domElement.addEventListener('mousemove', (event) => {
        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObject(marble);
        
        // Change cursor style based on intersection
        renderer.domElement.style.cursor = intersects.length > 0 ? 'move' : 'default';
    });

    // Add lights with color support
    const ambientLight = new THREE.AmbientLight(params.ambientLightColor, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(params.directionalLightColor, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Store light references for later updates
    window.lights = {
        ambient: ambientLight,
        directional: directionalLight
    };

    // Create marble material with custom shader
    const marbleUniforms = {
        baseColor: { value: new THREE.Color(params.baseColor) },
        accentColor: { value: new THREE.Color(params.accentColor) },
        patternComplexity: { value: params.patternComplexity },
        patternScale: { value: params.patternScale },
        swirlIntensity: { value: params.swirlIntensity },
        swirlFrequency: { value: params.swirlFrequency },
        transparency: { value: params.transparency },
        refractionIntensity: { value: params.refractionIntensity },
        glossiness: { value: params.glossiness },
        lightIntensity: { value: params.lightIntensity },
        ambientLightColor: { value: new THREE.Color(params.ambientLightColor) },    // Add ambient light color
        directionalLightColor: { value: new THREE.Color(params.directionalLightColor) }, // Add directional light color
        time: { value: 0 },
        cameraPos: { value: new THREE.Vector3() },
        displacementStrength: { value: params.displacementStrength },
        lineScale: { value: params.lineScale },
        lineIntensity: { value: params.lineIntensity },
    };

    const marbleMaterial = new THREE.ShaderMaterial({
        uniforms: marbleUniforms,
        vertexShader: `
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            
            void main() {
                vPosition = position;
                vNormal = normal;
                vUv = uv;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            #define PI 3.14159265359
            
            uniform vec3 baseColor;
            uniform vec3 accentColor;
            uniform float patternComplexity;
            uniform float patternScale;
            uniform float swirlIntensity;
            uniform float swirlFrequency;
            uniform float transparency;
            uniform float refractionIntensity;
            uniform float glossiness;
            uniform float lightIntensity;
            uniform vec3 ambientLightColor;
            uniform vec3 directionalLightColor;
            uniform float time;
            uniform vec3 cameraPos;
            uniform float displacementStrength;
            uniform float lineScale;
            uniform float lineIntensity;
            
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            
            // Improved noise function for better marble patterns
            float hash(float n) {
                return fract(sin(n) * 43758.5453123);
            }
            
            float noise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                
                float n = i.x + i.y * 157.0 + 113.0 * i.z;
                return mix(
                    mix(
                        mix(hash(n), hash(n + 1.0), f.x),
                        mix(hash(n + 157.0), hash(n + 158.0), f.x),
                        f.y
                    ),
                    mix(
                        mix(hash(n + 113.0), hash(n + 114.0), f.x),
                        mix(hash(n + 270.0), hash(n + 271.0), f.x),
                        f.y
                    ),
                    f.z
                );
            }
            
            float fbm(vec3 p) {
                // Simplified to just one noise sample instead of multiple octaves
                return noise(p);
            }
            
            // Sphere intersection for internal ray marching
            vec2 sphereIntersection(vec3 ro, vec3 rd, float r) {
                float b = dot(ro, rd);
                float c = dot(ro, ro) - r * r;
                float h = b * b - c;
                if(h < 0.0) return vec2(-1.0);
                h = sqrt(h);
                return vec2(-b - h, -b + h);
            }
            
            // Add displacement noise function
            vec3 displacementNoise(vec3 p) {
                vec3 noise = vec3(
                    fbm(p),
                    fbm(p + vec3(1.0)),
                    fbm(p + vec3(2.0))
                );
                return noise * 2.0 - 1.0;
            }
            
            void main() {
                vec3 viewDir = normalize(vWorldPosition - cameraPos);
                vec3 normal = normalize(vNormal);
                
                float ior = 1.45;
                vec3 refractDir = refract(viewDir, normal, 1.0 / ior);
                
                if(dot(refractDir, refractDir) == 0.0) {
                    refractDir = reflect(viewDir, normal);
                }
                
                vec3 ro = vPosition;
                vec3 rd = refractDir;
                
                vec2 intersect = sphereIntersection(ro, rd, 0.99);
                
                vec3 color = baseColor;
                float density = 0.0;
                
                float stepSize = (intersect.y - intersect.x) / 12.0; // Increased steps for better quality
                
                for(float t = intersect.x; t < intersect.y; t += stepSize) {
                    vec3 pos = ro + rd * t;
                    
                    // Add displacement to sampling position
                    vec3 displacement = displacementNoise(pos * patternScale) * displacementStrength;
                    vec3 samplePos = pos + displacement;
                    
                    // Create swirling pattern with displacement
                    vec3 swirl = samplePos * patternScale;
                    swirl.x += sin(samplePos.y * swirlFrequency) * swirlIntensity;
                    swirl.z += cos(samplePos.y * swirlFrequency) * swirlIntensity;
                    
                    float pattern = fbm(swirl * patternComplexity);
                    pattern = smoothstep(0.4, 0.6, pattern);
                    
                    // Add line pattern
                    float lines = cos((samplePos.x + pattern * lineIntensity) * lineScale * PI);
                    pattern = mix(pattern, lines * 0.5 + 0.5, 0.5);
                    
                    density += pattern * stepSize;
                }
                
                // Enhanced color mixing with displacement influence
                color = mix(baseColor, accentColor, density * 2.0);
                
                // Add fresnel effect
                float fresnel = pow(1.0 - abs(dot(normal, -viewDir)), 2.0) * refractionIntensity;
                color = mix(color, vec3(1.0), fresnel);
                
                // Add colored lighting with more even distribution
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                vec3 halfDir = normalize(lightDir - viewDir);
                float specular = pow(max(dot(normal, halfDir), 0.0), 32.0 * glossiness);
                
                // Increase ambient contribution and reduce directional contrast
                vec3 ambient = ambientLightColor * color * 0.7;  // Increased from 0.5 to 0.7
                vec3 diffuse = directionalLightColor * color * (max(dot(normal, lightDir), 0.0) * 0.5 + 0.5);  // Added bias to reduce contrast
                vec3 spec = directionalLightColor * specular * 0.8;  // Reduced specular intensity
                
                color = (ambient + diffuse) * lightIntensity + spec;
                
                gl_FragColor = vec4(color, transparency);
            }
        `,
        transparent: true
    });

    // Create marble geometry
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    marble = new THREE.Mesh(geometry, marbleMaterial);
    scene.add(marble);

    // Setup controls - note the updated OrbitControls reference
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;  // Disable zooming
    controls.minDistance = 2.5;     // Keep these as fallbacks
    controls.maxDistance = 2.5;     // Keep these as fallbacks

    // Setup GUI
    setupGUI();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

function setupGUI() {
    gui = new dat.GUI();
    
    // Create folders for better organization
    const colorFolder = gui.addFolder('Colors');
    const lightingFolder = gui.addFolder('Lighting');
    const patternFolder = gui.addFolder('Pattern');
    
    // Colors
    colorFolder.addColor(params, 'baseColor').name('Base Color').onChange(value => {
        marble.material.uniforms.baseColor.value.set(value);
    });
    colorFolder.addColor(params, 'accentColor').name('Accent Color').onChange(value => {
        marble.material.uniforms.accentColor.value.set(value);
    });
    
    // Lighting
    lightingFolder.add(params, 'lightIntensity', 0.1, 1).name('Light Intensity').onChange(value => {
        window.lights.ambient.intensity = value * 0.5;
        window.lights.directional.intensity = value * 0.8;
        marble.material.uniforms.lightIntensity.value = value;
    });
    lightingFolder.addColor(params, 'ambientLightColor').name('Ambient Light Color').onChange(value => {
        window.lights.ambient.color.set(value);
        marble.material.uniforms.ambientLightColor.value.set(value);
    });
    lightingFolder.addColor(params, 'directionalLightColor').name('Directional Light Color').onChange(value => {
        window.lights.directional.color.set(value);
        marble.material.uniforms.directionalLightColor.value.set(value);
    });
    
    // Pattern
    patternFolder.add(params, 'patternComplexity', 0, 1).name('Pattern Complexity').onChange(value => {
        marble.material.uniforms.patternComplexity.value = value;
    });
    patternFolder.add(params, 'patternScale', 0.1, 1).name('Pattern Scale').onChange(value => {
        marble.material.uniforms.patternScale.value = value;
    });
    patternFolder.add(params, 'swirlIntensity', 0, 1).name('Swirl Intensity').onChange(value => {
        marble.material.uniforms.swirlIntensity.value = value;
    });
    patternFolder.add(params, 'swirlFrequency', 0.5, 3.0).name('Swirl Frequency').onChange(value => {
        marble.material.uniforms.swirlFrequency.value = value;
    });
    patternFolder.add(params, 'lineScale', 1, 2).name('Line Scale').onChange(value => {
        marble.material.uniforms.lineScale.value = value;
    });
    patternFolder.add(params, 'lineIntensity', 0, 1).name('Line Intensity').onChange(value => {
        marble.material.uniforms.lineIntensity.value = value;
    });
    patternFolder.add(params, 'displacementStrength', 0, 1).name('Displacement Strength').onChange(value => {
        marble.material.uniforms.displacementStrength.value = value;
    });
    
    // Add animation folder
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(params, 'isAnimating').name('Rotate Marble');
    animationFolder.add(params, 'animationSpeed', 0.1, 3).name('Rotation Speed');
    
    // Main controls
    gui.add(params, 'randomizeMarble').name('Randomize');
    gui.add(params, 'exportMarble').name('Export as PNG');
}

let animationFrameId;
const TIME_DELTA = 0.01;

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    // Add rotation animation
    if (params.isAnimating) {
        marble.rotation.y += 0.01 * params.animationSpeed;
    }
    
    controls.update();
    
    // Update time uniform only if it exists
    const timeUniform = marble.material.uniforms.time;
    if (timeUniform) {
        timeUniform.value += TIME_DELTA;
    }
    
    // Update camera position only if it changed
    const cameraPosUniform = marble.material.uniforms.cameraPos;
    if (!cameraPosUniform.value.equals(camera.position)) {
        cameraPosUniform.value.copy(camera.position);
    }
    
    renderer.render(scene, camera);
}

// Cache container element
let containerElement;

function onWindowResize() {
    if (!containerElement) {
        containerElement = document.querySelector('.marble-maker-container');
        if (!containerElement) return;
    }

    const width = containerElement.clientWidth;
    const height = containerElement.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Reusable objects for export
const exportObjects = {
    scene: null,
    camera: null,
    renderTarget: null,
    canvas: null
};

function saveAsImage() {
    // Initialize export objects if they don't exist
    if (!exportObjects.scene) {
        exportObjects.scene = new THREE.Scene();
        exportObjects.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        exportObjects.renderTarget = new THREE.WebGLRenderTarget(1024, 1024);
        exportObjects.canvas = document.createElement('canvas');
        exportObjects.canvas.width = 1024;
        exportObjects.canvas.height = 1024;
    }
    
    const { scene: exportScene, camera: exportCamera, renderTarget, canvas } = exportObjects;
    
    // Clear previous contents
    while(exportScene.children.length > 0) { 
        exportScene.remove(exportScene.children[0]); 
    }
    
    // Setup scene
    exportScene.background = new THREE.Color(0x000000);
    
    // Clone marble with current state
    const exportMarble = marble.clone();
    exportMarble.material = marble.material.clone();
    exportMarble.rotation.copy(marble.rotation);
    exportMarble.position.copy(marble.position);
    exportScene.add(exportMarble);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(params.ambientLightColor, 0.5 * params.lightIntensity);
    const directionalLight = new THREE.DirectionalLight(params.directionalLightColor, 0.8 * params.lightIntensity);
    directionalLight.position.set(1, 1, 1);
    exportScene.add(ambientLight, directionalLight);
    
    // Setup camera
    const direction = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
    exportCamera.position.copy(direction.multiplyScalar(2.62));
    exportCamera.lookAt(0, 0, 0);
    exportCamera.updateProjectionMatrix();
    
    // Store and update renderer settings
    const currentRenderTarget = renderer.getRenderTarget();
    const currentAlpha = renderer.getClearAlpha();
    
    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(exportScene, exportCamera);
    
    // Process image
    const context = canvas.getContext('2d');
    const pixels = new Uint8Array(1024 * 1024 * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, 1024, 1024, pixels);
    
    const imageData = new ImageData(1024, 1024);
    for (let i = 0; i < 1024; i++) {
        const invI = 1023 - i;
        for (let j = 0; j < 1024; j++) {
            const sourceIdx = (i * 1024 + j) * 4;
            const targetIdx = (invI * 1024 + j) * 4;
            imageData.data.set(pixels.subarray(sourceIdx, sourceIdx + 4), targetIdx);
        }
    }
    context.putImageData(imageData, 0, 0);
    
    // Download image
    const link = document.createElement('a');
    link.download = 'marble.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Restore renderer settings
    renderer.setRenderTarget(currentRenderTarget);
    renderer.setClearColor(0x000000, 0);
    
    // Cleanup cloned objects
    exportMarble.geometry.dispose();
    exportMarble.material.dispose();
}

// Cleanup function for proper disposal
function cleanup() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    if (gui) {
        gui.destroy();
    }
    
    if (marble) {
        marble.geometry.dispose();
        marble.material.dispose();
    }
    
    if (renderer) {
        renderer.dispose();
    }
    
    window.removeEventListener('resize', onWindowResize);
}

// Initialize when DOM is ready and dependencies are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load dependencies and initialize
    loadDependencies().then(() => {
        init();
    }).catch(error => {
        console.error('Error loading dependencies:', error);
    });
});
