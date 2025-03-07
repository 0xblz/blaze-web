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

// Initialize the ethereal animation once Three.js is loaded
loadThreeJS().then(() => {
    // Initialize Three.js scene
    const app = new EtherealAnimation();
    app.init();
    app.animate();
}).catch(error => {
    console.error('Error initializing animation:', error);
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
        
        // Speed boost parameters - adjusted for more noticeable acceleration
        this.isMouseDown = false;
        this.speedBoost = 1.0; // Normal speed multiplier
        this.maxSpeedBoost = 8.0; // Increased maximum speed boost
        this.speedBoostIncrement = 0.15; // Faster acceleration
        this.speedBoostDecrement = 0.08; // Slightly faster deceleration
        
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
        this.renderer.domElement.style.pointerEvents = 'none'; // Allow clicks to pass through
        this.container.appendChild(this.renderer.domElement);
        
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
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.onMouseDown.bind(this), { passive: true });
        document.addEventListener('touchend', this.onMouseUp.bind(this), { passive: true });
        document.addEventListener('touchcancel', this.onMouseUp.bind(this), { passive: true });
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
        // Only create glowing particles, no shapes
        this.createGlowingParticles();
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
    
    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
    }
    
    onMouseMove(event) {
        // Update target mouse position for smooth movement
        this.targetMouse.x = (event.clientX / this.width) * 2 - 1;
        this.targetMouse.y = -(event.clientY / this.height) * 2 + 1;
        
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
        this.isMouseDown = true;
        
        // Create a visual indicator for speed boost
        this.createSpeedBoostIndicator();
    }
    
    onMouseUp(event) {
        this.isMouseDown = false;
        
        // Remove the speed boost indicator
        this.removeSpeedBoostIndicator();
    }
    
    createSpeedBoostIndicator() {
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
    }
    
    removeSpeedBoostIndicator() {
        if (this.speedBoostIndicator) {
            document.body.removeChild(this.speedBoostIndicator);
            this.speedBoostIndicator = null;
        }
    }
    
    updateSpeedBoostIndicator() {
        if (this.speedBoostIndicator) {
            this.speedBoostIndicator.textContent = `SPEED: ${this.speedBoost.toFixed(1)}x`;
            
            // Change color based on speed
            const hue = 240 - (this.speedBoost / this.maxSpeedBoost) * 240; // Blue to red
            this.speedBoostIndicator.style.color = `hsl(${hue}, 100%, 70%)`;
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
        
        // Update speed boost based on mouse down state
        if (this.isMouseDown) {
            // Increase speed boost when mouse is down
            this.speedBoost = Math.min(this.speedBoost + this.speedBoostIncrement, this.maxSpeedBoost);
        } else {
            // Gradually decrease speed boost when mouse is up
            this.speedBoost = Math.max(this.speedBoost - this.speedBoostDecrement, 1.0);
        }
        
        // Update the speed boost indicator
        this.updateSpeedBoostIndicator();
        
        // Calculate streak factor based on speed boost
        // Only add streaks when speed is above normal
        const streakFactor = Math.max(0, (this.speedBoost - 1.0) / (this.maxSpeedBoost - 1.0));
        
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
        
        // Update each particle
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const ix = particle.index * 3;
            
            // Move particle towards the viewer (positive Z) with time scaling and speed boost
            // Ensure minimum movement speed
            const boostedSpeed = particle.speed * this.speedBoost;
            positions[ix + 2] += Math.max(boostedSpeed * timeScale, boostedSpeed * 0.5);
            
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
            
            // Reset particle if it passes too close to the camera
            if (positions[ix + 2] > 600) {
                // Reset to a new random position far away
                // Keep the same X and Y coordinates but move it far back in Z
                // This maintains the particle's path and prevents direction changes
                positions[ix] = particle.originalX;
                positions[ix + 1] = particle.originalY;
                positions[ix + 2] = -spaceDepth; // Far behind the camera
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
        
        // Update time uniform for shaders
        if (this.particleSystem.material.uniforms) {
            this.particleSystem.material.uniforms.time.value = this.clock.getElapsedTime();
            // Update speed boost uniform
            this.particleSystem.material.uniforms.speedBoost.value = this.speedBoost;
        }
        
        // Update particles
        this.updateParticles();
        
        // Apply subtle camera movement based on mouse position for 3D effect
        // Reduced camera movement speed for gentler effect
        this.camera.position.x += (this.mouse.x * 30 - this.camera.position.x) * 0.02;
        this.camera.position.y += (-this.mouse.y * 30 - this.camera.position.y) * 0.02;
        
        // Instead of moving the camera forward during speed boost,
        // we'll keep the camera stationary and just increase particle speed
        // This prevents the direction change issue
        
        this.camera.lookAt(this.scene.position);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
} 