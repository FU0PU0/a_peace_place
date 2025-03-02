// Import Three.js core and required loaders
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'; // Loader for .exr files

// Create a scene
const scene = new THREE.Scene();

// Set up a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

// Create a renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
document.body.appendChild(renderer.domElement);

// Load .exr file as background and environment map
const exrLoader = new EXRLoader();
exrLoader.load(
  'models/autumn_field_puresky_4k.exr', // Replace with the path to your .exr file
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping; // Map texture to a spherical environment
    scene.background = texture; // Set as the scene background
    scene.environment = texture; // Apply to the environment for reflections
  },
  undefined,
  (error) => {
    console.error('An error occurred while loading the EXR file:', error);
  }
);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;

// Configure shadow quality
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
scene.add(directionalLight);

// Load a 3D model using GLTFLoader
const loader = new GLTFLoader();

let model; // To store the loaded model
let screenMesh; // To store the screen mesh
let cameraTarget = new THREE.Vector3(0, 0, 0); // Target position for the camera

loader.load(
  'models/computer4.glb', // Replace with the actual path to your model
  (gltf) => {
    model = gltf.scene;
    model.position.set(0, 0, 0);
    model.scale.set(4, 4, 4);

    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true; // Allow model to cast shadows
        node.receiveShadow = false;

        // Find the screen mesh
        if (node.name === 'screen') { // Replace 'screen' with the name of your screen mesh
          screenMesh = node;
        }
      }
    });

    // Calculate camera target based on the model's bounding box
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    cameraTarget.copy(center);

    scene.add(model);
  },
  undefined,
  (error) => {
    console.error('An error occurred while loading the model:', error);
  }
);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
let time = 0;
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    time += 0.01;

    // Add subtle camera movement
    const verticalRadius = 0.2;
    const horizontalRadius = 0.5;
    camera.position.x = cameraTarget.x + Math.sin(time) * horizontalRadius;
    camera.position.y = cameraTarget.y + 0.5 + Math.sin(time * 0.5) * verticalRadius;
    camera.position.z = cameraTarget.z + 3;

    // Ensure the camera always looks at the model
    camera.lookAt(cameraTarget);
  }

  renderer.render(scene, camera);
}
animate();

// Add click event for camera zoom and redirection with sound
const clickSound = new Audio('click-sound.mp3'); // Replace with the actual path to your sound file

document.addEventListener('click', () => {
  if (!model || !screenMesh) return;

  // Play click sound
  clickSound.currentTime = 0; // Reset sound in case of multiple clicks
  clickSound.play();

  const screenWorldPosition = screenMesh.getWorldPosition(new THREE.Vector3());
  const targetPosition = screenWorldPosition.clone().add(new THREE.Vector3(0, 0, 2.5)); // Adjust z for a comfortable distance
  const targetLookAt = screenWorldPosition.clone();

  const initialPosition = camera.position.clone();
  let zoomProgress = 0;
  const zoomDuration = 120; // Number of frames for the zoom animation

  function zoomIn() {
    if (zoomProgress < zoomDuration) {
      zoomProgress++;

      // Interpolate camera position towards the screen
      camera.position.lerpVectors(initialPosition, targetPosition, zoomProgress / zoomDuration);
      camera.lookAt(targetLookAt); // Always look at the screen's center

      renderer.render(scene, camera);
      requestAnimationFrame(zoomIn);
    } else {
      // Redirect to the webpage after zoom completes
      window.location.href = 'site.html';
    }
  }

  zoomIn();
});
