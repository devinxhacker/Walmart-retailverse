// HTML elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

// Start camera feed
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
});

// Setup Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Load Sofa Model
let sofa;
const loader = new THREE.GLTFLoader();
loader.load('model/sofa.glb', function (gltf) {
  sofa = gltf.scene;
  sofa.scale.set(0.5, 0.5, 0.5);
  scene.add(sofa);
  sofa.visible = false; // wait for user tap
});

// Handle tap/click to place model
canvas.addEventListener('click', (event) => {
  if (!sofa) return;
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const point = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(2));
  sofa.position.copy(point);
  sofa.visible = true;
});

// Gesture Controls
const hammer = new Hammer(canvas);
hammer.get('pinch').set({ enable: true });
hammer.get('rotate').set({ enable: true });

let scale = 0.5;
let rotationY = 0;
let isDragging = false;
let dragStart = { x: 0, y: 0 };

// Drag
canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('mousemove', (e) => {
  if (isDragging && sofa) {
    let dx = (e.clientX - dragStart.x) / 100;
    let dy = (e.clientY - dragStart.y) / 100;
    sofa.position.x += dx;
    sofa.position.y -= dy;
    dragStart = { x: e.clientX, y: e.clientY };
  }
});
canvas.addEventListener('mouseup', () => { isDragging = false; });

// Touch move
hammer.on('pan', (ev) => {
  if (sofa) {
    sofa.position.x += ev.deltaX / 500;
    sofa.position.y -= ev.deltaY / 500;
  }
});

// Scale
hammer.on('pinch', (ev) => {
  if (sofa) {
    scale = THREE.MathUtils.clamp(ev.scale * scale, 0.1, 3);
    sofa.scale.set(scale, scale, scale);
  }
});

// Rotate
hammer.on('rotate', (ev) => {
  if (sofa) {
    rotationY += ev.rotation * 0.005;
    sofa.rotation.y = rotationY;
  }
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
