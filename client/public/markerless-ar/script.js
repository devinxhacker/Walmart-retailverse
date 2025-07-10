let video = document.getElementById('video');
let canvas = document.getElementById('canvas');

// Setup Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Improved Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(0, 1, 1);
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Load shoe model
let leftShoe, rightShoe;
const loader = new THREE.GLTFLoader();
loader.load('./model/shoe.glb', glb => {
  leftShoe = glb.scene.clone();
  rightShoe = glb.scene.clone();
  leftShoe.visible = false;
  rightShoe.visible = false;
  scene.add(leftShoe);
  scene.add(rightShoe);
});

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      initPoseDetection();
    };
  })
  .catch(err => console.error("Camera Error:", err));

let detector;

async function initPoseDetection() {
  await tf.setBackend('webgl');
  await tf.ready();

  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    }
  );

  detectLoop();
}

function getFootData(keypoints, side = 'left') {
  // Get keypoints for the foot
  const ankle = keypoints.find(k => k.name === `${side}_ankle`);
  const heel = keypoints.find(k => k.name === `${side}_heel`);
  const footIndex = keypoints.find(k => k.name === `${side}_foot_index`);

  if (!ankle || !heel || !footIndex) return null;
  if (ankle.score < 0.4 || heel.score < 0.4 || footIndex.score < 0.4) return null;

  // Calculate foot center (midpoint between heel and foot index)
  const centerX = (heel.x + footIndex.x) / 2;
  const centerY = (heel.y + footIndex.y) / 2;

  // Calculate angle of the foot
  const dx = footIndex.x - heel.x;
  const dy = footIndex.y - heel.y;
  const angle = Math.atan2(dy, dx);

  // Calculate foot length (distance between heel and foot index)
  const length = Math.sqrt(dx * dx + dy * dy);

  return { centerX, centerY, angle, length };
}

async function detectLoop() {
  requestAnimationFrame(detectLoop);

  if (!detector || video.readyState < 2) return;

  const poses = await detector.estimatePoses(video);
  if (poses.length > 0) {
    const keypoints = poses[0].keypoints;

    // LEFT FOOT
    if (leftShoe) {
      const leftFoot = getFootData(keypoints, 'left');
      if (leftFoot) {
        // Normalize X and Y to -1 to +1
        let x = (leftFoot.centerX / video.videoWidth) * 2 - 1;
        let y = -(leftFoot.centerY / video.videoHeight) * 2 + 1;
        leftShoe.position.set(x, y, -0.1); // Slightly in front of camera plane

        // Rotate shoe to match foot angle
        leftShoe.rotation.z = -leftFoot.angle;

        // Scale shoe to match foot length (tune 0.002 as needed)
        // You may need to adjust this factor for your model/camera
        const scale = leftFoot.length * 0.0025;
        leftShoe.scale.set(scale, scale, scale);
        leftShoe.visible = true;
      } else {
        leftShoe.visible = false;
      }
    }

    // RIGHT FOOT
    if (rightShoe) {
      const rightFoot = getFootData(keypoints, 'right');
      if (rightFoot) {
        let x = (rightFoot.centerX / video.videoWidth) * 2 - 1;
        let y = -(rightFoot.centerY / video.videoHeight) * 2 + 1;
        rightShoe.position.set(x, y, -0.1);
        rightShoe.rotation.z = -rightFoot.angle;
        const scale = rightFoot.length * 0.0025;
        rightShoe.scale.set(scale, scale, scale);
        rightShoe.visible = true;
      } else {
        rightShoe.visible = false;
      }
    }
  } else {
    if (leftShoe) leftShoe.visible = false;
    if (rightShoe) rightShoe.visible = false;
  }

  renderer.render(scene, camera);
}