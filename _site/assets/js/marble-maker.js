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
    baseColor: '#ff4fed',
    accentColor: '#61c1ff',
    patternComplexity: 1,
    patternScale: 2.0,
    transparency: 0.9,
    refractionIntensity: 1.2,
    glossiness: 0.8,
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
    scene.background = new THREE.Color(0x1a1a1a);

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 3;

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        preserveDrawingBuffer: true 
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
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
                color += vec3(specular);
                
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
    const renderTarget = new THREE.WebGLRenderTarget(1024, 1024);
    const originalAspect = camera.aspect;
    
    // Temporarily set camera aspect to 1:1
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    
    // Render to target
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    
    // Create download link
    const image = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'marble.png';
    link.href = image;
    link.click();
    
    // Restore original settings
    camera.aspect = originalAspect;
    camera.updateProjectionMatrix();
    renderer.setRenderTarget(null);
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
