// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";


import { loadAluminumWall } from './_indexAluminum.js';
import { loadRetractingLouvredWalls } from './_indexRetractingLouvred.js';
import { loadStaticLouvredWalls } from './_indexStaticLouvred.js';
import { loadSofa } from "./_indexLoadSofa.js";
import { loadGlassWalls } from "./_indexGlassWalls.js";

const canopyTypeSelect = document.getElementById('_canopyTypeSelect');




const frontSideSelect = document.getElementById('_frontSide');


const side1Select = document.getElementById('_side1');

const side2Select = document.getElementById('_side2');


const backsideSelect = document.getElementById('_backside');





// Event Listeners for Progressive Display
canopyTypeSelect.addEventListener('change', function () {


    if (canopyTypeSelect.value === "_wallMounted") {
      // Show only Front, Side 1, and Side 2 for wall-mounted canopies

    frontSideSelect.style.display = 'block';
    side1Select.style.display = 'block';
    side2Select.style.display = 'none';
    backsideSelect.style.display = 'block';
  } else if (canopyTypeSelect.value === "_freeStanding") {
      // Show all four sides for free-standing canopies
  
      frontSideSelect.style.display = 'block';

      side1Select.style.display = 'block';

      side2Select.style.display = 'block';

      backsideSelect.style.display = 'block';
  }
});




// Get the container dimensions for the 3D canvas
const container = document.getElementById("container3D");
let width = container.clientWidth;
let height = container.clientHeight;

// Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xC0C0C0);

// Create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000); // Decreased FOV for a better perspective
camera.position.set(100, 150, 200); // Set the camera far away initially to see everything better

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
controls.minDistance = 10; // Allow closer zoom in
controls.maxDistance = 1500; // Increased maximum zoom distance to allow full zoom out

// Load a marble texture for the floor
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('_models/_features/_textures/_floor/_pavement.jpg');

// Repeat the texture to simulate tiles
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
//floorTexture.repeat.set(3, 3); // Increase the repetition to make it look like smaller, elegant tiles

// Create a plane to serve as the floor
const floorGeometry = new THREE.PlaneGeometry(800, 800);
const floorMaterial = new THREE.MeshStandardMaterial({
   // map: floorTexture, // Apply the marble tiled texture
    roughness: 1, // Lower roughness for a glossy effect
    metalness: .1, // Increase metalness for a slight reflection
    color: 0x152e45,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
floor.position.y = -2.5;
floor.receiveShadow = true;
scene.add(floor);

// Set which object to render
let object, _glassRoof, _louvres, _plasticRoof, _retractingLouvredRoof, _glassDoor;
const loader = new GLTFLoader();


function disposeObject(obj) {
  obj.traverse((node) => {
      if (!node.isMesh) return;

      if (node.geometry) {
          node.geometry.dispose();
      }

      if (node.material) {
          if (Array.isArray(node.material)) {
              // Dispose of multi-materials
              node.material.forEach((material) => disposeMaterial(material));
          } else {
              disposeMaterial(node.material);
          }
      }
  });
}

// Function to load a model
function loadModel(url) {

    if (object) {
      scene.remove(object);
      disposeObject(object); // Dispose of geometries and materials to avoid memory leaks
      object = null;
  }

    loader.load(
        url,
        function (gltf) {
            object = gltf.scene;

            // Enable casting and receiving shadows for the loaded object
            object.traverse(function (node) {
                if (node.isMesh) {
                  color: 0x272727,
                    node.castShadow = true; // Object will cast a shadow
                    node.receiveShadow = true; // Object will receive shadows
                }
            });



            // Add the object to the scene
            scene.add(object);

            // Adjust camera to fit the object
            adjustCameraToFitObject(object);

            

        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error(error);
        }
    );
}

function adjustCameraToFitObject(object) {
    // Calculate the bounding box of the object
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Set the camera's distance and orientation to give a full view
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180); // Convert FOV to radians
    let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));

    cameraZ *= 2.5; // Increase distance for a better overall view
    camera.position.set(center.x + cameraZ, center.y + cameraZ, cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
}

// Load the wall-mounted canopy model initially
loadModel('_models/A/_modelBGrey.gltf');
loadSofa(scene, loader);








// Event listener for selecting canopy types
let canopyObject = null;
document.getElementById("_canopyTypeSelect").addEventListener("change", (event) => {
  const wallLoader = new GLTFLoader();

  if (event.target.value === "_wallMounted") {

          // Remove existing object if needed
          if (object) {
            scene.remove(object);
          }
    wallLoader.load('_models/A/_modelBGrey.gltf', (gltf) => {
      const _wallMounted = gltf.scene;

      // Traverse and update materials
      _wallMounted.traverse((node) => {
        if (node.isMesh) {
          node.material = new THREE.MeshStandardMaterial({
            color: 0xADD8E6,  // Lighter brown base color

            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true
          });
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      loadSofa(scene, object);



      // Add the updated model to the scene
      scene.add(_wallMounted);
      canopyObject = _wallMounted;  // Track the current canopy object for further removal
    });

  } else if (event.target.value === "_freeStanding") {

    if (object) {
      scene.remove(object);
      
    }

    wallLoader.load('_models/A/_modelA.gltf', (gltf) => {
      const _freeStandingCanopy = gltf.scene;

      // materials color and how it look at the event start
      _freeStandingCanopy.traverse((node) => {
        if (node.isMesh) {
          node.material = new THREE.MeshStandardMaterial({
            color: 0xADD8E6,  

            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true

      
          });
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });



      // Add the updated model to the scene
      scene.add(_freeStandingCanopy);
      canopyObject = _freeStandingCanopy; 

    });
    canopyObject = null;
  }
});

 const _lengthSelect = document.getElementById('lengthInput');
 const _widthSelect = document.getElementById('widthInput');


 _lengthSelect.addEventListener('change', updateModel);
 _widthSelect.addEventListener('change', updateModel);

 const _pergolaLength1 = parseInt(_lengthSelect.value);
 const _pergolaWidth1 = parseInt(_widthSelect.value); 

 const _added = _pergolaLength1 + _pergolaWidth1;
 console.log('Total is', _added);

 function updateModel() {
  const pergolaLength = parseInt(_lengthSelect.value) || 1; // Default to 1 if no valid value is given
  const pergolaWidth = parseInt(_widthSelect.value) || 1;   // Default to 1 if no valid value is given

  // Update the canopy size
  if (canopyObject) {
    canopyObject.scale.set(pergolaLength, 1, pergolaWidth);
  }

  // Update the roof scale
  if (_louvres) {
    updateRoofDimensions(_louvres, pergolaLength, pergolaWidth);
  }
  if (_glassRoof) {
    updateRoofDimensions(_glassRoof, pergolaLength, pergolaWidth);
  }
  if (_plasticRoof) {
    updateRoofDimensions(_plasticRoof, pergolaLength, pergolaWidth);
  }
  if (_retractingLouvredRoof) {
    updateRoofDimensions(_retractingLouvredRoof, pergolaLength, pergolaWidth);
  }

  // Update wall dimensions
  updateWallDimensions(pergolaLength, pergolaWidth);
}

function updateWallDimensions(length, width) {
  // Update dimensions for aluminum walls, if they exist
  if (_aluminiumWallGroup) {
    updateWallProperties(_aluminiumWallGroup, "Front Side", length, width);
    updateWallProperties(_aluminiumWallGroup, "Side 1", length, width);
    updateWallProperties(_aluminiumWallGroup, "Side 2", length, width);
    updateWallProperties(_aluminiumWallGroup, "Back Side", length, width);
  }

  // Update dimensions for glass walls, if they exist
  if (_glassWallsGroup) {
    updateWallProperties(_glassWallsGroup, "Front Side", length, width);
    updateWallProperties(_glassWallsGroup, "Side 1", length, width);
    updateWallProperties(_glassWallsGroup, "Side 2", length, width);
    updateWallProperties(_glassWallsGroup, "Back Side", length, width);
  }

  // Update dimensions for fixed louvres, if they exist
  if (_fixedLouversGroup) {
    updateWallProperties(_fixedLouversGroup, "Front Side", length, width);
    updateWallProperties(_fixedLouversGroup, "Side 1", length, width);
    updateWallProperties(_fixedLouversGroup, "Side 2", length, width);
    updateWallProperties(_fixedLouversGroup, "Back Side", length, width);
  }

  // Update dimensions for opening louvres, if they exist
  if (_openingLouversGroup) {
    updateWallProperties(_openingLouversGroup, "Front Side", length, width);
    updateWallProperties(_openingLouversGroup, "Side 1", length, width);
    updateWallProperties(_openingLouversGroup, "Side 2", length, width);
    updateWallProperties(_openingLouversGroup, "Back Side", length, width);
  }
}







function updateRoofDimensions(_featureRoof) {

  const _updatedRoofLength = parseInt(_lengthSelect.value) || 1; // Default to 1 if invalid
  const _updatedRoofWidth = parseInt(_widthSelect.value) || 1;
  if (_louvres) {
    _featureRoof.scale.set(_updatedRoofLength, 1, _updatedRoofWidth); // Adjust length (X), width (Z), keep height (Y)
    console.log(`Roof updated to length: ${_updatedRoofLength}, width: ${_updatedRoofWidth}`);
  } if (_glassRoof) {
    _featureRoof.scale.set(_updatedRoofLength, 1, _updatedRoofWidth); // Adjust length (X), width (Z), keep height (Y)
    console.log(`Roof updated to length: ${_updatedRoofLength}, width: ${_updatedRoofWidth}`);
  }if (_plasticRoof) {
    _featureRoof.scale.set(_updatedRoofLength, 1, _updatedRoofWidth); // Adjust length (X), width (Z), keep height (Y)
    console.log(`Roof updated to length: ${_updatedRoofLength}, width: ${_updatedRoofWidth}`);
  }if (_retractingLouvredRoof) {
    _featureRoof.scale.set(_updatedRoofLength, 1, _updatedRoofWidth); // Adjust length (X), width (Z), keep height (Y)
    console.log(`Roof updated to length: ${_updatedRoofLength}, width: ${_updatedRoofWidth}`);
  }
  
  else {
    console.error('Roof object is not yet loaded or defined.');
  }



  scene.add(_featureRoof);
}




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
        updateRoofDimensions(_louvres);
        scene.add(_louvres);
        
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
                opacity: 1, // Set the opacity to 1 for a fully reflective surface
                metalness: 1, // High metalness for a mirror-like appearance
                roughness: 0.1, // Low roughness for a smooth surface
                side: THREE.DoubleSide // Render both sides of the glass
              });
              node.castShadow = true; // Allow the roof to cast shadows
              node.receiveShadow = true; // Allow the roof to receive shadows
            }
          });
          updateRoofDimensions(_glassRoof);
          scene.add(_glassRoof);
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
          updateRoofDimensions(_plasticRoof);
          scene.add(_plasticRoof);
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
          updateRoofDimensions(_retractingLouvredRoof);
          scene.add(_retractingLouvredRoof);
        });
        break;
  }
});




// Define variables to keep track of different walls
let _aluminiumWallGroup = null;
let _glassWallsGroup = null;
let _fixedLouversGroup = null;
let _openingLouversGroup = null;

async function handleSideSelection(selectElement, sideName) {
  selectElement.addEventListener("change", async function () {
    let wallGroup = null;



    // Load the selected wall type
    switch (selectElement.value) {
      case "_aluminiumWall":
        try {
          wallGroup = await loadAluminumWall(scene);
          _aluminiumWallGroup = wallGroup; // Store reference
        } catch (error) {
          console.error("Error loading aluminum wall:", error);
        }
        break;

      case "_glassWalls":
        try {
          wallGroup = await loadGlassWalls(scene);
          _glassWallsGroup = wallGroup; // Store reference
        } catch (error) {
          console.error("Error loading glass wall:", error);
        }
        break;

      case "_fixedLouvers":
        try {
          wallGroup = await loadStaticLouvredWalls(scene);
          _fixedLouversGroup = wallGroup; // Store reference
        } catch (error) {
          console.error("Error loading fixed louvred wall:", error);
        }
        break;

      case "_openingLouvers":
        try {
          wallGroup = await loadRetractingLouvredWalls(scene);
          _openingLouversGroup = wallGroup; // Store reference
        } catch (error) {
          console.error("Error loading opening louvred wall:", error);
        }
        break;

      default:
        console.error("Unknown wall type selected: " + selectElement.value);
        return;
    }

    // If wallGroup is loaded, add it to the scene and update properties
    if (wallGroup) {
      scene.add(wallGroup);
      updateWallProperties(wallGroup, sideName, parseInt(_lengthSelect.value) || 1, parseInt(_widthSelect.value) || 1);
    }
  });
}

// Function to update wall properties like position, scale, and rotation
function updateWallProperties(wallGroup, sideName, length, width) {
  let position, scale, rotation;

  switch (sideName) {
    case "Front Side":
      position = { x: 0, y: 0, z: length / 2 };
      scale = { x: width, y: 1, z: 1 };
      rotation = { x: 0, y: 0, z: 0 };
      break;

    case "Side 1":
      position = { x: width / 2, y: 0, z: 0 };
      scale = { x: 1, y: 1, z: length };
      rotation = { x: 0, y: Math.PI / 2, z: 0 };
      break;

    case "Side 2":
      position = { x: -width / 2, y: 0, z: 0 };
      scale = { x: 1, y: 1, z: length };
      rotation = { x: 0, y: -Math.PI / 2, z: 0 };
      break;

    case "Back Side":
      position = { x: 0, y: 0, z: -length / 2 };
      scale = { x: width, y: 1, z: 1 };
      rotation = { x: 0, y: Math.PI, z: 0 };
      break;

    default:
      console.error("Unknown side selected: " + sideName);
      return;
  }

  wallGroup.position.set(position.x, position.y, position.z);
  wallGroup.scale.set(scale.x, scale.y, scale.z);
  wallGroup.rotation.set(rotation.x, rotation.y, rotation.z);
}

// Attach event listeners to the wall selection elements
handleSideSelection(document.getElementById('_frontSide'), "Front Side");
handleSideSelection(document.getElementById('_side1'), "Side 1");
handleSideSelection(document.getElementById('_side2'), "Side 2");
handleSideSelection(document.getElementById('_backside'), "Back Side");





// Studio lighting setup
const keyLight = new THREE.DirectionalLight(0xFFD580, 1.2); // Warm yellow color for sunlight
keyLight.position.set(20, 100, 50); // Position the sun at an angle for realistic lighting
keyLight.castShadow = true; // Allow the light to cast shadows
scene.add(keyLight);

const backLight = new THREE.DirectionalLight(0xFFDD99, 0.3); // Dim warm backlight
backLight.position.set(-30, 50, -30); // Positioned to highlight the back of the object
backLight.castShadow = false; // No shadows from back light to keep it subtle
scene.add(backLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Adjust intensity as needed
scene.add(ambientLight);

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Smooth camera movements
    renderer.render(scene, camera);
}

// Start the 3D rendering
animate();
