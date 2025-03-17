// Load Three.js and required libraries from CDN
const loadDependencies = async () => {
    // First load Three.js core
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
    
    // Then load dependencies in order - using updated OrbitControls URL
    await loadScript('https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js');
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
    baseColor: '#dc50ff',
    accentColor: '#7350ff',
    patternComplexity: 0.4,
    patternScale: 2.0,
    transparency: 0.9,
    refractionIntensity: 1.2,
    glossiness: 0.8,
    lightIntensity: 0.6,
    randomizeMarble: function() {
        // Generate random colors
        const randomColor1 = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        const randomColor2 = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        // Update parameters
        params.baseColor = randomColor1;
        params.accentColor = randomColor2;
        params.patternComplexity = Math.random() * 1.5 + 0.2; // Range: 0.2 to 1.7
        params.patternScale = Math.random() * 2.5 + 0.3;      // Range: 0.3 to 2.8
        params.transparency = Math.random() * 0.3 + 0.7;      // Range: 0.7 to 1.0
        params.refractionIntensity = Math.random() * 1.5 + 0.5; // Range: 0.5 to 2.0
        params.glossiness = Math.random() * 0.6 + 0.4;        // Range: 0.4 to 1.0
        params.lightIntensity = Math.random() * 1.2 + 0.4;    // Range: 0.4 to 1.6
        
        // Update material uniforms
        marble.material.uniforms.baseColor.value.set(params.baseColor);
        marble.material.uniforms.accentColor.value.set(params.accentColor);
        marble.material.uniforms.patternComplexity.value = params.patternComplexity;
        marble.material.uniforms.patternScale.value = params.patternScale;
        marble.material.uniforms.transparency.value = params.transparency;
        marble.material.uniforms.refractionIntensity.value = params.refractionIntensity;
        marble.material.uniforms.glossiness.value = params.glossiness;
        marble.material.uniforms.lightIntensity.value = params.lightIntensity;
        
        // Update lights
        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                child.intensity = params.lightIntensity * 0.5;
            } else if (child instanceof THREE.DirectionalLight) {
                child.intensity = params.lightIntensity * 0.8;
            }
        });
        
        // Update all GUI controllers
        for (let i in gui.__controllers) {
            gui.__controllers[i].updateDisplay();
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

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create marble material with custom shader
    const marbleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            baseColor: { value: new THREE.Color(params.baseColor) },
            accentColor: { value: new THREE.Color(params.accentColor) },
            patternComplexity: { value: params.patternComplexity },
            patternScale: { value: params.patternScale },
            transparency: { value: params.transparency },
            refractionIntensity: { value: params.refractionIntensity },
            glossiness: { value: params.glossiness },
            lightIntensity: { value: params.lightIntensity },
            time: { value: 0 },
            cameraPos: { value: new THREE.Vector3() }
        },
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
            uniform vec3 baseColor;
            uniform vec3 accentColor;
            uniform float patternComplexity;
            uniform float patternScale;
            uniform float transparency;
            uniform float refractionIntensity;
            uniform float glossiness;
            uniform float lightIntensity;
            uniform float time;
            uniform vec3 cameraPos;
            
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
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                // More octaves for better detail
                for(float i = 0.0; i < 6.0; i++) {
                    value += amplitude * noise(p * frequency);
                    frequency *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
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
            
            void main() {
                // Calculate view ray
                vec3 viewDir = normalize(vWorldPosition - cameraPos);
                vec3 normal = normalize(vNormal);
                
                // Calculate refraction
                float ior = 1.45; // Glass IOR
                vec3 refractDir = refract(viewDir, normal, 1.0 / ior);
                
                // If no refraction (total internal reflection), use reflection
                if(dot(refractDir, refractDir) == 0.0) {
                    refractDir = reflect(viewDir, normal);
                }
                
                // Ray march through the sphere to accumulate internal patterns
                vec3 ro = vPosition;
                vec3 rd = refractDir;
                
                // Get sphere intersection points
                vec2 intersect = sphereIntersection(ro, rd, 0.99);
                
                // Initialize color accumulation
                vec3 color = baseColor;
                float density = 0.0;
                
                // Sample points inside the sphere
                float stepSize = (intersect.y - intersect.x) / 8.0;
                for(float t = intersect.x; t < intersect.y; t += stepSize) {
                    vec3 pos = ro + rd * t;
                    
                    // Create swirling pattern
                    vec3 swirl = pos * patternScale;
                    swirl.x += sin(pos.y * 2.0 + time * 0.2) * 0.5;
                    swirl.z += cos(pos.y * 2.0 + time * 0.2) * 0.5;
                    
                    // Accumulate pattern density
                    float pattern = fbm(swirl * patternComplexity);
                    pattern = smoothstep(0.4, 0.6, pattern);
                    
                    density += pattern * stepSize;
                }
                
                // Mix colors based on accumulated density
                color = mix(baseColor, accentColor, density * 2.0);
                
                // Add fresnel effect
                float fresnel = pow(1.0 - abs(dot(normal, -viewDir)), 5.0) * refractionIntensity;
                color = mix(color, vec3(1.0), fresnel);
                
                // Add specular highlight
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                vec3 halfDir = normalize(lightDir - viewDir);
                float specular = pow(max(dot(normal, halfDir), 0.0), 32.0 * glossiness);
                color += vec3(specular * lightIntensity);
                
                // Final color with transparency
                gl_FragColor = vec4(color, transparency);
            }
        `,
        transparent: true
    });

    // Create marble geometry
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    marble = new THREE.Mesh(geometry, marbleMaterial);
    scene.add(marble);

    // Setup controls - note the updated OrbitControls reference
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;  // Disable zooming
    controls.minDistance = 3;     // Keep these as fallbacks
    controls.maxDistance = 3;     // Keep these as fallbacks

    // Setup GUI
    setupGUI();

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
}

function setupGUI() {
    gui = new dat.GUI();
    
    gui.addColor(params, 'baseColor').onChange(value => {
        marble.material.uniforms.baseColor.value.set(value);
    });
    
    gui.addColor(params, 'accentColor').onChange(value => {
        marble.material.uniforms.accentColor.value.set(value);
    });
    
    gui.add(params, 'patternComplexity', 0, 2).onChange(value => {
        marble.material.uniforms.patternComplexity.value = value;
    });
    
    gui.add(params, 'patternScale', 0.1, 3).onChange(value => {
        marble.material.uniforms.patternScale.value = value;
    });
    
    gui.add(params, 'transparency', 0, 1).onChange(value => {
        marble.material.uniforms.transparency.value = value;
    });
    
    gui.add(params, 'refractionIntensity', 0, 2).onChange(value => {
        marble.material.uniforms.refractionIntensity.value = value;
    });
    
    gui.add(params, 'glossiness', 0, 1).onChange(value => {
        marble.material.uniforms.glossiness.value = value;
    });
    
    gui.add(params, 'lightIntensity', 0.1, 2).onChange(value => {
        scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                child.intensity = value * 0.5;  // Keep ambient light slightly dimmer
            } else if (child instanceof THREE.DirectionalLight) {
                child.intensity = value * 0.8;
            }
        });
        marble.material.uniforms.lightIntensity.value = value;
    });
    
    gui.add(params, 'randomizeMarble').name('Randomize');
    gui.add(params, 'exportMarble').name('Export as PNG');
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Update uniforms
    if (marble.material.uniforms.time) {
        marble.material.uniforms.time.value += 0.01;
    }
    marble.material.uniforms.cameraPos.value.copy(camera.position);
    
    // Render scene
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.querySelector('.marble-maker-container');
    if (!container) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function saveAsImage() {
    // Create a new scene for rendering just the marble
    const exportScene = new THREE.Scene();
    exportScene.background = new THREE.Color(0x000000);
    
    // Clone the marble and its material for the export scene
    const exportMarble = marble.clone();
    exportMarble.material = marble.material.clone();
    // Copy the current rotation and position
    exportMarble.rotation.copy(marble.rotation);
    exportMarble.position.copy(marble.position);
    exportScene.add(exportMarble);
    
    // Add the same lights as main scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5 * params.lightIntensity);
    exportScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8 * params.lightIntensity);
    directionalLight.position.set(1, 1, 1);
    exportScene.add(directionalLight);
    
    // Setup camera for export
    const exportCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    // Calculate camera position to match current view direction but ensure marble fills frame
    const direction = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();
    exportCamera.position.copy(direction.multiplyScalar(2.8)); // Closer camera position to fill frame
    exportCamera.lookAt(0, 0, 0);
    exportCamera.updateProjectionMatrix();
    
    // Create temporary render target
    const renderTarget = new THREE.WebGLRenderTarget(1024, 1024);
    
    // Store current renderer settings
    const currentRenderTarget = renderer.getRenderTarget();
    const currentAlpha = renderer.getClearAlpha();
    
    // Setup renderer for export
    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(exportScene, exportCamera);
    
    // Create a new canvas for the final image
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    // Read pixels from render target
    const pixels = new Uint8Array(1024 * 1024 * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, 1024, 1024, pixels);
    
    // Create ImageData and flip it vertically
    const imageData = new ImageData(1024, 1024);
    for (let y = 0; y < 1024; y++) {
        for (let x = 0; x < 1024; x++) {
            const sourceIndex = (y * 1024 + x) * 4;
            const targetIndex = ((1023 - y) * 1024 + x) * 4;
            imageData.data[targetIndex] = pixels[sourceIndex];
            imageData.data[targetIndex + 1] = pixels[sourceIndex + 1];
            imageData.data[targetIndex + 2] = pixels[sourceIndex + 2];
            imageData.data[targetIndex + 3] = pixels[sourceIndex + 3];
        }
    }
    context.putImageData(imageData, 0, 0);
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'marble.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Restore renderer settings
    renderer.setRenderTarget(currentRenderTarget);
    renderer.setClearColor(0x000000, 0); // Restore transparent background
    
    // Clean up
    renderTarget.dispose();
    exportMarble.geometry.dispose();
    exportMarble.material.dispose();
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
