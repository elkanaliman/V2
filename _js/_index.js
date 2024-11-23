// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { loadAluminumWall } from './_indexAluminum.js';
import { loadStaticLouvredWalls } from './_indexStaticLouvred.js';
import { loadRetractingLouvredWalls } from './_indexRetractingLouvred.js';
import { loadVictorianLamp } from './_indexVictorian.js';
import { loadLightLamp } from './_indexLights.js';
import { loadGlassDoor } from './_indexGlassDoors.js';
import { loadPullDownBlinds } from './_indexPullDownBlinds.js';

// Get the container dimensions for the 3D canvas
const container = document.getElementById("container3D");
let width = container.clientWidth;
let height = container.clientHeight;

// Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6FA8DC);

// Create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.set(10, 5, 20);

// Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true; // Enable shadow maps in the renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add the renderer to the DOM
container.appendChild(renderer.domElement);

// OrbitControls allow the camera to move around the scene
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smoother camera motion
controls.dampingFactor = 0.1;
controls.maxPolarAngle = Math.PI / 2; // Restrict the camera's vertical movement

// Load a marble texture for the floor to make it human-like and elegant

const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('_models/_features/_textures/_floor/_pavement.jpg'); 

// Repeat the texture to simulate tiles
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(15, 15); // Adjust repetition based on desired tile size



// Repeat the texture to simulate tiles
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(15, 15); // Increase the repetition to make it look like smaller, elegant tiles

// Create a plane to serve as the floor
const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,       // Apply the marble tiled texture
  roughness: 0.1,  // Lower roughness for a glossy effect
  metalness: 0.4,  // Increase metalness for a slight reflection
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
floor.position.y = -2.5;
floor.receiveShadow = true;
scene.add(floor);

// Set which object to render
let object, rafterLightsArray = [], _glassRoof, _louvres, _plasticRoof, _retractingLouvredRoof, _slidingGlassDoors, _pullDownBlinds;

// Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

// Function to load a model


function loadModel(url) {
  // If an object is already loaded, remove it before loading a new one
  if (object) {
    scene.remove(object);
    // Remove all existing rafter lights if they exist
    rafterLightsArray.forEach(light => scene.remove(light));
    rafterLightsArray = [];
  }

  loader.load(
    url,
    function (gltf) {
      object = gltf.scene;

      // Enable casting and receiving shadows for the loaded object
      object.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true; // Object will cast a shadow
          node.receiveShadow = true; // Object will receive shadows
        }
      });

      // Add the object to the scene
      scene.add(object);

      // Calculate the bounding box of the object
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);

      // Calculate the optimal camera distance based on the model's size
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180); // Convert FOV to radians
      let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));

      // Set an offset so the model is not touching the camera
      cameraZ *= 1.5;

      // Set the camera position accordingly
      camera.position.set(0, size.y / 2, cameraZ);
      controls.target.set(0, size.y / 2, 0);
      controls.update();

      // Create lights along the rafters after the model is loaded
      //createRafterLights(size);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.error(error);
    }
  );
}

// Load the wall-mounted canopy model initially
loadModel('_models/A/_modelA.gltf');

// Event listener for selecting canopy types
let canopyObject = null;
document.getElementById("_canopyTypeSelect").addEventListener("change", (event) => {
  const wallLoader = new GLTFLoader();

  if (event.target.value === "_wallMounted") {
    wallLoader.load('_models/A/_modelBGrey.gltf', (gltf) => {
      const _modelBGrey = gltf.scene;

      // Traverse and update materials
      _modelBGrey.traverse((node) => {
        if (node.isMesh) {
          node.material = new THREE.MeshStandardMaterial({
            color: 0x000000,           // Set the base color to grey
            roughness: 0.5,            // Reduce roughness to make it even smoother
            metalness: 0.8,            // Increase metalness slightly for more reflection
            opacity: 0.3,              // Reduce opacity to make it look more transparent
            side: THREE.DoubleSide,    // Render both sides
            depthWrite: true,          // Write depth for accurate overlapping
            depthTest: true,           // Enable depth testing for proper scene layering
            envMapIntensity: 0.7       // Add environmental reflection
          });
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // Remove existing object if needed
      if (object) {
        scene.remove(object);
      }

      // Add the updated model to the scene
      scene.add(_modelBGrey);
      canopyObject = _modelBGrey;  // Track the current canopy object for further removal
    });

  } else if (event.target.value === "_freeStanding") {
    wallLoader.load('_models/A/_modelA.gltf', (gltf) => {
      const _modelA = gltf.scene;

      // Traverse and update materials
      _modelA.traverse((node) => {
        if (node.isMesh) {
          node.material = new THREE.MeshStandardMaterial({
            color: 0x777777,           // Set the base color to grey
            roughness: 0.5,            // Reduce roughness to make it even smoother
            metalness: 0.8,            // Increase metalness slightly for more reflection
            opacity: 0.3,              // Reduce opacity to make it look more transparent
            side: THREE.DoubleSide,    // Render both sides
            depthWrite: true,          // Write depth for accurate overlapping
            depthTest: true,           // Enable depth testing for proper scene layering
            envMapIntensity: 0.7       // Add environmental reflection
          });
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // Remove existing object if needed
      if (object) {
        scene.remove(object);
      }

      // Add the updated model to the scene
      scene.add(_modelA);
      canopyObject = _modelA; 
    });
  }
});

document.getElementById("_colorFeatureSelect").addEventListener("change", (event) => {
  const selectedColor = event.target.value;

  if (canopyObject) {
    canopyObject.traverse((node) => {
      if (node.isMesh) {
        // Set color based on the selected option
        switch (selectedColor) {
          case "_white":
            node.material.color.set(0xffffff); // Set to white color
            break;
          case "_grey":
            node.material.color.set(0x777777); // Set to grey color
            break;
        }
      }
    });
  }
});

// Event listener for selecting roof types
document.getElementById("_roofFeatureSelect").addEventListener("change", (event) => {
  const roofLoader = new GLTFLoader();

  if (_glassRoof) scene.remove(_glassRoof);
  if (_louvres) scene.remove(_louvres);
  if (_plasticRoof) scene.remove(_plasticRoof);
  if (_retractingLouvredRoof) scene.remove(_retractingLouvredRoof);
  
 

  switch (event.target.value) {
    case "_louvred":
      roofLoader.load('_models/_features/_roof/_louvredRoof/_louvres.gltf', (gltf) => {
        _louvres = gltf.scene;
    
        // Set initial rotation for louvers to simulate a partially open state
        _louvres.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              color: 0xD9EAD3, // White color for the glass roof
              //transparent: true, // Enable transparency
              opacity: 0.5, // Set the opacity level (0 is fully transparent, 1 is opaque)
              roughness: 1, // Make the glass relatively smooth
              metalness: 1, // Add a slight metallic feel
              side: THREE.DoubleSide // Render both sides of the glass
            });
          }
        });
    
        addFeatureToScene(_louvres);
      });
    break;
      case "_glassRoof":
        roofLoader.load('_models/_features/_roof/_glassRoof/_glassRoof.gltf', (gltf) => {
          _glassRoof = gltf.scene;
  
          _glassRoof.traverse((node) => {
            if (node.isMesh) {
              node.material = new THREE.MeshStandardMaterial({
                color: 0xffffff, // White color for the glass roof
                transparent: true, // Enable transparency
                opacity: 0.5, // Set the opacity level (0 is fully transparent, 1 is opaque)
                roughness: 0.1, // Make the glass relatively smooth
                metalness: 0.3, // Add a slight metallic feel
                side: THREE.DoubleSide // Render both sides of the glass
              });
              node.castShadow = true; // Allow the roof to cast shadows
              node.receiveShadow = true; // Allow the roof to receive shadows
            }
          });
          addFeatureToScene(_glassRoof);
        });
        break;
      break;
      case "_plasticRoof":
        roofLoader.load('_models/_features/_roof/_plasticRoof/_plasticRoof.gltf', (gltf) => {
          _plasticRoof = gltf.scene;
  
          _plasticRoof.traverse((node) => {
            if (node.isMesh) {
              node.material = new THREE.MeshStandardMaterial({
                color: 0x6E2C00, // White color for the glass roof
                transparent: true,
                opacity: .9, // Set the opacity level (0 is fully transparent, 1 is opaque)
                roughness: 1, // Make the glass relatively smooth
                metalness: 0.8, // Add a slight metallic feel
                
              });
              node.castShadow = true; // Allow the roof to cast shadows
              node.receiveShadow = true; // Allow the roof to receive shadows
            }
          });
          addFeatureToScene(_plasticRoof);
        });
        break;


        case "_retractingLouvredRoof":
        roofLoader.load('_models/_features/_roof/_slidingLouvreRoof/_slidingLouvreRoof.gltf', (gltf) => {
          _retractingLouvredRoof = gltf.scene;
  
          _retractingLouvredRoof.traverse((node) => {
            if (node.isMesh) {
              node.material = new THREE.MeshStandardMaterial({
                color: 0x6E2C00, // White color for the glass roof
                transparent: true,
                opacity: .9, // Set the opacity level (0 is fully transparent, 1 is opaque)
                roughness: 1, // Make the glass relatively smooth
                metalness: 0.8, // Add a slight metallic feel
                
              });
              node.castShadow = true; // Allow the roof to cast shadows
              node.receiveShadow = true; // Allow the roof to receive shadows
            }
          });
          addFeatureToScene(_retractingLouvredRoof);
        });
        break;
  }
});

// Event listener for selecting wall types

let _currentWall = null; // Track the current wall group in the scene

document.getElementById("_wallFeatureSelect").addEventListener("change", async (event) => {


  // Check if there is a wall currently loaded
  if (_currentWall) {
    // Remove current wall from the scene
    scene.remove(_currentWall);

    // Dispose of geometry and material to free memory
    _currentWall.traverse((node) => {
      if (node.isMesh) {
        node.geometry.dispose();
        node.material.dispose();
      }
    });

    _currentWall = null; // Clear the reference to indicate no wall is loaded
  }

  // Load new wall based on the user's selection
  try {
    switch (event.target.value) {
      case "_solidAluminiumWalls":
        _currentWall = await loadAluminumWall(scene, object);
        
        break;
      case "_louvredWalls":
        _currentWall = await loadStaticLouvredWalls(scene, object);
        break;
      case "_retractingLouvredWalls":
        _currentWall = await loadRetractingLouvredWalls(scene, object);
        break;
      default:
        _currentWall = null; // In case of default or empty selection
        break;
    }
  } catch (error) {
    console.error("Error loading wall: ", error);
  }
});



document.getElementById("_victorianStyle").addEventListener("change", (event) => {
  if (event.target.value === "_victorian") {
    loadVictorianLamp(scene, object);
  }
});


document.getElementById("_lightToggleButton").addEventListener("click", () => {
  if (object) {
    loadLightLamp(scene, object);
  }
});


document.getElementById("_doorFeatureSelect").addEventListener("change", async (event) => {
  // Remove current sliding glass door if already loaded
  if (_slidingGlassDoors) {
    scene.remove(_slidingGlassDoors);
    _slidingGlassDoors.traverse((node) => {
      if (node.isMesh) {
        node.geometry.dispose();
        node.material.dispose();
      }
    });
    _slidingGlassDoors = null;
  }

  // Remove current pull-down blinds if already loaded
  if (_pullDownBlinds) {
    scene.remove(_pullDownBlinds);
    _pullDownBlinds.traverse((node) => {
      if (node.isMesh) {
        node.geometry.dispose();
        node.material.dispose();
      }
    });
    _pullDownBlinds = null;
  }

  // Load new feature based on the user's selection
  if (event.target.value === "_slidingGlassDoors") {
    try {
      _slidingGlassDoors = await loadGlassDoor(scene, object);
    } catch (error) {
      console.error("Error loading sliding glass doors: ", error);
    }
  } else if (event.target.value === "_pullDownBlinds") {
    try {
      _pullDownBlinds = await loadPullDownBlinds(scene, object);
    } catch (error) {
      console.error("Error loading pull-down blinds: ", error);
    }
  }
});



// Studio lighting setup
const keyLight = new THREE.DirectionalLight(0xFFD580, 1.2); // Warm yellow color for sunlight
keyLight.position.set(50, 100, 50); // Position the sun at an angle for realistic lighting
keyLight.castShadow = true; // Allow the light to cast shadows
scene.add(keyLight);

const backLight = new THREE.DirectionalLight(0xFFDD99, 0.3); // Dim warm backlight
backLight.position.set(-30, 50, -30); // Positioned to highlight the back of the object
backLight.castShadow = false; // No shadows from back light to keep it subtle
scene.add(backLight);

// Add a more intense ambient light to improve visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Increased intensity to brighten the entire scene
scene.add(ambientLight);

// Function to add features to the scene
function addFeatureToScene(feature) {
  feature.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  scene.add(feature);
}

// Render the scene
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Smooth camera movements
  renderer.render(scene, camera);
}

// Start the 3D rendering
animate();
