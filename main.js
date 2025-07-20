// =============================================
// 1. SETUP
// =============================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 70, 250);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =============================================
// 2. CORE OBJECTS AND DATA
// =============================================
const planetsData = [
    { name: 'Mercury', size: 3.8, distance: 40, color: 0xaaaaaa, speed: 0.004 },
    { name: 'Venus', size: 9.5, distance: 70, color: 0xffd700, speed: 0.003 },
    { name: 'Earth', size: 10, distance: 100, color: 0x0077ff, speed: 0.002 },
    { name: 'Mars', size: 5.3, distance: 140, color: 0xff5733, speed: 0.0015 },
    { name: 'Jupiter', size: 40, distance: 220, color: 0xd2b48c, speed: 0.0008 },
    { name: 'Saturn', size: 35, distance: 300, color: 0xf0e68c, speed: 0.0006 },
    { name: 'Uranus', size: 20, distance: 380, color: 0xadd8e6, speed: 0.0004 },
    { name: 'Neptune', size: 19, distance: 450, color: 0x0000ff, speed: 0.0002 },
];
const planetMeshes = [];
const planetObjects = [];

// =============================================
// 3. FEATURE IMPLEMENTATION
// =============================================

// ✨ A. Lighting
const pointLight = new THREE.PointLight(0xffffff, 2, 800);
let ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Start with dark mode ambient light
scene.add(pointLight, ambientLight);

// ✨ B. Camera Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 50;
controls.maxDistance = 1000;

// ✨ C. Sun and Planets Creation
const sun = new THREE.Mesh(new THREE.SphereGeometry(20, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
scene.add(sun);

planetsData.forEach(planetInfo => {
    const planet = new THREE.Mesh(new THREE.SphereGeometry(planetInfo.size, 32, 32), new THREE.MeshStandardMaterial({ color: planetInfo.color }));
    planet.position.x = planetInfo.distance;
    planet.name = planetInfo.name; // Set name for raycasting
    const orbit = new THREE.Object3D();
    orbit.add(planet);
    scene.add(orbit);
    planetObjects.push({ ...planetInfo, mesh: planet, orbit: orbit });
    planetMeshes.push(planet);
});

// ✨ D. Background Stars
const starGeometry = new THREE.BufferGeometry();
const starVertices = [];
for (let i = 0; i < 15000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 }));
scene.add(stars);

// ✨ E. Pause/Resume Logic
let isPaused = false;
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.innerText = isPaused ? 'Resume' : 'Pause';
});

// ✨ F. Dark/Light Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        scene.background = new THREE.Color(0xf0f8ff); // Light blue sky
        ambientLight.intensity = 1.0; // Brighter ambient light for light mode
        stars.material.color.set(0x000000); // Set stars to black
    } else {
        scene.background = null; // Default dark 
        ambientLight.intensity = 0.5; // Dimmer for dark mode
        stars.material.color.set(0xffffff); // Set stars back to white
    }
});

// ✨ G. Speed Control Sliders
const slidersContainer = document.getElementById('sliders-container');
planetObjects.forEach(p => {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    const label = document.createElement('label');
    label.innerText = p.name;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '0.01';
    slider.step = '0.0001';
    slider.value = p.speed;
    slider.addEventListener('input', (e) => p.speed = parseFloat(e.target.value));
    sliderContainer.append(label, slider);
    slidersContainer.appendChild(sliderContainer);
});

// ✨ H. Raycasting for Hover Tooltips and Click-to-Zoom
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.innerText = intersects[0].object.name;
    } else {
        tooltip.style.display = 'none';
    }
}

function onDoubleClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
        const targetObject = intersects[0].object;
        const targetPosition = new THREE.Vector3();
        targetObject.getWorldPosition(targetPosition); // Get world position of the planet

        // Set controls target to the planet's position
        controls.target.copy(targetPosition);

        // Position the camera slightly away from the planet
        const offset = new THREE.Vector3(0, 20, 50); // Adjust offset as needed
        const newCameraPosition = targetPosition.clone().add(offset);
        camera.position.copy(newCameraPosition);
    }
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('dblclick', onDoubleClick);

// =============================================
// 4. ANIMATION LOOP
// =============================================
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (!isPaused) {
        sun.rotation.y += 0.0005;
        planetObjects.forEach(p => {
            p.orbit.rotation.y += p.speed;
            p.mesh.rotation.y += 0.01;
        });
    }

    renderer.render(scene, camera);
}

animate();