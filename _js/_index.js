// Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
// import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";



// Get the container dimensions for the 3D canvas
const container = document.getElementById("container3D");
let width = container.clientWidth;
let height = container.clientHeight;


window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Update camera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // Update renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
// Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 100, 2); 

const groundMaterial = new THREE.ShaderMaterial({
  uniforms: {
    sunPosition: { value: new THREE.Vector3(20, 700, 0) },
    sunColor: { value: new THREE.Color(0xFFF5E1) }, // Warmer sunlight
    noiseScale: { value: 1500.0 },
    smallNoiseScale: { value: 300.0 },
    microNoiseScale: { value: 50.0 },
    fogColor: { value: new THREE.Color(0xD8E4FF) }, // Slightly blueish fog (UK sky)
    fogNear: { value: 2000.0 },
    fogFar: { value: 8000.0 },
    time: { value: 0.0 }, // For subtle grass movement
    grassScale: { value: 10.0 } // Scale of grass detail
  },
  
  vertexShader: `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vFogDepth;
  varying float vHeight;

  uniform float noiseScale;
  uniform float smallNoiseScale;
  uniform float microNoiseScale;
  uniform float time;

  // Improved noise functions
  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Smoothstep
    
    float a = hash(i.x + i.y * 57.0);
    float b = hash(i.x + 1.0 + i.y * 57.0);
    float c = hash(i.x + i.y * 57.0 + 1.0);
    float d = hash(i.x + 1.0 + i.y * 57.0 + 1.0);
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    // Add multiple octaves of noise for natural-looking garden terrain
    // Fewer octaves and smaller amplitude for more gentle rolling hills
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.45;
      frequency *= 2.0;
    }
    
    return value;
  }

  void main() {
    vUv = uv;
    
    // Start with base position
    vec3 newPosition = position;
    
    // Gentler terrain for gardens - lower amplitude
    float largeNoise = fbm(position.xz / noiseScale) * 400.0;
    
    // Medium details - gentle undulations
    float mediumNoise = fbm(position.xz / smallNoiseScale) * 100.0;
    
    // Small details - grass texture
    float smallNoise = fbm(position.xz / microNoiseScale) * 20.0;
    
    // Combine all noise layers - gentler for maintained gardens
    newPosition.y += largeNoise + mediumNoise + smallNoise;
    
    // Save height for coloring
    vHeight = newPosition.y;
    
    // Calculate world position
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
    
    // Calculate proper normals for lighting
    vec3 bitangent = normalize(cross(normalize(vec3(0.0, 1.0, 0.01)), normalize(vec3(0.01, 1.0, 0.0))));
    vec3 tangent = normalize(cross(normalize(vec3(0.0, 1.0, 0.01)), bitangent));
    
    // Sample nearby points to compute normal
    float eps = 1.0;
    float hL = fbm((position.xz - vec2(eps, 0.0)) / noiseScale) * 400.0 + 
               fbm((position.xz - vec2(eps, 0.0)) / smallNoiseScale) * 100.0 + 
               fbm((position.xz - vec2(eps, 0.0)) / microNoiseScale) * 20.0;
               
    float hR = fbm((position.xz + vec2(eps, 0.0)) / noiseScale) * 400.0 + 
               fbm((position.xz + vec2(eps, 0.0)) / smallNoiseScale) * 100.0 + 
               fbm((position.xz + vec2(eps, 0.0)) / microNoiseScale) * 20.0;
               
    float hD = fbm((position.xz - vec2(0.0, eps)) / noiseScale) * 400.0 + 
               fbm((position.xz - vec2(0.0, eps)) / smallNoiseScale) * 100.0 + 
               fbm((position.xz - vec2(0.0, eps)) / microNoiseScale) * 20.0;
               
    float hU = fbm((position.xz + vec2(0.0, eps)) / noiseScale) * 400.0 + 
               fbm((position.xz + vec2(0.0, eps)) / smallNoiseScale) * 100.0 + 
               fbm((position.xz + vec2(0.0, eps)) / microNoiseScale) * 20.0;
    
    // Compute normal from heightmap samples
    vec3 computedNormal = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));
    vNormal = normalMatrix * computedNormal;
    
    // For fog calculation
    vFogDepth = length((modelViewMatrix * vec4(newPosition, 1.0)).xyz);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
  `,
  
  fragmentShader: `
  uniform vec3 sunPosition;
  uniform vec3 sunColor;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  uniform float time;
  uniform float grassScale;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vFogDepth;
  varying float vHeight;

  // Noise functions for detail textures
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Grass pattern with less contrast
  float grassPattern(vec2 pos, float scale) {
    // Create wind effect
    float windStrength = 0.05;
    float windSpeed = time * 0.2;
    float wind = sin(windSpeed + pos.x * 0.01 + pos.y * 0.01) * windStrength;
    
    // Base grass texture (reducing intensity)
    vec2 grassPos = pos * scale + vec2(wind, 0.0);
    float pattern = snoise(grassPos) * 0.3; // Reduced intensity
    
    // Add some variation at different scales (with reduced intensity)
    pattern += snoise(grassPos * 2.0) * 0.15;
    pattern += snoise(grassPos * 4.0) * 0.05;
    
    return pattern;
  }

  void main() {
    // UK garden color palette - consistent greens
    vec3 brightGrass = vec3(0.26, 0.48, 0.16); // Bright green UK grass
    vec3 slightlyDarkerGrass = vec3(0.23, 0.45, 0.15); // Slightly darker for subtle variation
    
    // Generate detailed grass texture with less contrast
    float grassDetail = grassPattern(vWorldPosition.xz, grassScale);
    
    // Base grass color with minimal variations (no dirt or paths)
    vec3 baseColor = mix(brightGrass, slightlyDarkerGrass, grassDetail * 0.3 + 0.5);
    
    // Add subtle highlights for grass blades
    float grassBlades = snoise(vWorldPosition.xz * 2.0) * 0.03; // Reduced effect
    baseColor *= (1.0 + grassBlades);
    
    // Calculate light direction and distance
    vec3 lightDirection = normalize(sunPosition - vWorldPosition);
    float lightDistance = length(sunPosition - vWorldPosition);
    
    // Lighting calculation with minimal ambient occlusion
    float ao = 0.7 + 0.3 * snoise(vWorldPosition.xz * 0.1); // Less variation in AO
    float diffuse = max(dot(vNormal, lightDirection), 0.0);
    
    // Softer specular for dewy grass
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 halfwayVector = normalize(lightDirection + viewDirection);
    float shininess = 100.0; // Higher for smaller highlights
    float specular = 0.0;
    if (diffuse > 0.0) {
      specular = pow(max(dot(vNormal, halfwayVector), 0.0), shininess);
    }
    
    // Light attenuation
    float attenuation = 1.0 / (1.0 + lightDistance * 0.00001);
    
    // Combine lighting - brighter ambient for garden setting
    vec3 ambient = vec3(0.4) * ao; // Brighter ambient
    vec3 diffuseLight = diffuse * sunColor * attenuation;
    vec3 specularLight = specular * vec3(1.0, 1.0, 0.9) * 0.3 * attenuation; // Stronger for dewy look
    
    // Final color with lighting
    vec3 finalColor = baseColor * (ambient + diffuseLight) + specularLight;
    
    // Apply atmospheric fog - typical for UK
    float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    finalColor = mix(finalColor, fogColor, fogFactor);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
  `,
  side: THREE.FrontSide
});

// Create the ground mesh
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -4;
scene.add(ground);

// Add scene fog (this will work with the shader fog)
scene.fog = new THREE.Fog(0xD8E4FF, 2000, 8000);

function createDoubleSidedSign(frontText, backText, position, width = 1200, height = 400) {
  // Create geometry for both sides
  const signGeometry = new THREE.PlaneGeometry(width, height);
  
  // Create front side canvas and texture
  const frontCanvas = document.createElement('canvas');
  const frontContext = frontCanvas.getContext('2d');
  frontCanvas.width = 1024;
  frontCanvas.height = 512;
  
  // Set front background
  frontContext.fillStyle = 'rgba(255, 255, 240, 0.9)';
  frontContext.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
  
  // Add front border
  frontContext.strokeStyle = '#553322';
  frontContext.lineWidth = 10;
  frontContext.strokeRect(5, 5, frontCanvas.width - 10, frontCanvas.height - 10);
  
  // Add front text
  frontContext.font = 'bold 60px Arial';
  frontContext.fillStyle = '#336633';
  frontContext.textAlign = 'center';
  frontContext.textBaseline = 'middle';
  
  // Handle multiline text for front
  const frontLines = frontText.split('\n');
  const lineHeight = 70;
  const frontStartY = frontCanvas.height / 2 - (lineHeight * (frontLines.length - 1)) / 2;
  
  frontLines.forEach((line, i) => {
    frontContext.fillText(line, frontCanvas.width / 2, frontStartY + i * lineHeight);
  });
  
  // Create front texture
  const frontTexture = new THREE.CanvasTexture(frontCanvas);
  
  // Create back side canvas and texture
  const backCanvas = document.createElement('canvas');
  const backContext = backCanvas.getContext('2d');
  backCanvas.width = 1024;
  backCanvas.height = 512;
  
  // Set back background
  backContext.fillStyle = 'rgba(255, 255, 240, 0.9)';
  backContext.fillRect(0, 0, backCanvas.width, backCanvas.height);
  
  // Add back border
  backContext.strokeStyle = '#553322';
  backContext.lineWidth = 10;
  backContext.strokeRect(5, 5, backCanvas.width - 10, backCanvas.height - 10);
  
  // Add back text
  backContext.font = 'bold 60px Arial';
  backContext.fillStyle = '#336633';
  backContext.textAlign = 'center';
  backContext.textBaseline = 'middle';
  
  // Handle multiline text for back
  const backLines = backText.split('\n');
  const backStartY = backCanvas.height / 2 - (lineHeight * (backLines.length - 1)) / 2;
  
  backLines.forEach((line, i) => {
    backContext.fillText(line, backCanvas.width / 2, backStartY + i * lineHeight);
  });
  
  // Create back texture
  const backTexture = new THREE.CanvasTexture(backCanvas);
  
  // Create materials (not transparent, single-sided)
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: frontTexture,
    transparent: false,
    side: THREE.FrontSide
  });
  
  const backMaterial = new THREE.MeshBasicMaterial({
    map: backTexture,
    transparent: false,
    side: THREE.FrontSide
  });
  
  // Create front mesh
  const frontSign = new THREE.Mesh(signGeometry, frontMaterial);
  frontSign.position.set(position.x, position.y, position.z);
  
  // Create back mesh (flipped 180 degrees to face the opposite direction)
  const backSign = new THREE.Mesh(signGeometry, backMaterial);
  backSign.position.set(position.x, position.y, position.z - 1); // Slightly offset to avoid z-fighting
  backSign.rotation.y = Math.PI; // Rotate 180 degrees around Y axis
  
  // Group both sides together
  const signGroup = new THREE.Group();
  signGroup.add(frontSign);
  signGroup.add(backSign);
  
  // Add to scene
  scene.add(signGroup);
  
  return signGroup;
}

const frontText = "Hello there 👋 \nStart by clicking on wall mounted.\nRight click to rotate,\nand dont forget to view other sides\nof the map. Have fun.";
const backText = "Enchante. Thank you for viewing\nDon't forget to submit your design.";

createDoubleSidedSign(frontText, backText, { x: 1000, y: 150, z: -800 });


// You can make text face the camera by adding this to your animation loop
function updateTextOrientation() {
  // Find all sign objects (if you want them to always face the camera)
  scene.traverse(function(object) {
    // Check if this is one of our instruction signs (you might want to tag them)
    if (object.userData.isInstructionSign) {
      // Make the sign face the camera (only rotating on Y axis)
      const signToCamera = new THREE.Vector3();
      signToCamera.subVectors(camera.position, object.position);
      signToCamera.y = 0; // Keep sign upright - only rotate on horizontal plane
      object.lookAt(camera.position.x, object.position.y, camera.position.z);
    }
  });
}

function createButton(text, position, width = 200, height = 800, onClick) {
  // Create a group to hold button elements
  const buttonGroup = new THREE.Group();


  
  // Create button base (box rectangle)
  const buttonGeometry = new THREE.BoxGeometry(400, 50, 20);
  const buttonMaterial = new THREE.MeshPhongMaterial({
    color: 0xCFB53B,  
    specular: 0x111111,
    shininess: 0
  });
  const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
  buttonGroup.add(buttonMesh);
  
  // Create button text using canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 1400;
  canvas.height = 300;
  
  // Clear canvas
  context.fillStyle = 'rgba(255, 0, 0, 0)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  context.font = 'bold 130px Arial';
  context.fillStyle = 'green';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2 , canvas.height / 2);
  context.shadowColor = 'rgba(0, 0, 0, 0.7)';
context.shadowOffsetX = 5;
context.shadowOffsetY = 5;
context.shadowBlur = 10;
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Create a plane for the text
  const textGeometry = new THREE.PlaneGeometry(width - 40, height - 20);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textMesh.position.z = 11; // Position slightly above button surface
  buttonGroup.add(textMesh);
  
  // Position the button group
  buttonGroup.position.set(position.x, position.y, position.z);
  
  // Add to scene
  scene.add(buttonGroup);
  
  // Store original position and color for hover/click effects
  buttonGroup.userData = {
    isButton: true,
    originalY: position.y,
    originalColor: buttonMaterial.color.clone(),
    originalTextPos: textMesh.position.z,
    isHovered: false,
    isPressed: false
  };
  
  // Register the button for interaction
  interactiveObjects.push({
    mesh: buttonGroup,
    onClick: onClick || function() {
      console.log(`Button "${text}" clicked!`);
    },
    onHover: function() {
      if (!buttonGroup.userData.isHovered) {
        buttonGroup.userData.isHovered = true;
        buttonMaterial.color.setHex(0x5C9CFF); // Lighter blue on hover
        textMesh.position.z = 13; // Raise text slightly
      }
    },
    onHoverExit: function() {
      if (buttonGroup.userData.isHovered) {
        buttonGroup.userData.isHovered = false;
        buttonMaterial.color.copy(buttonGroup.userData.originalColor);
        textMesh.position.z = buttonGroup.userData.originalTextPos;
      }
    },
    onPress: function() {
      buttonGroup.userData.isPressed = true;
      buttonGroup.position.y -= 5; // Press down effect
      buttonMaterial.color.setHex(0x3367D6); // Darker blue when pressed
    },
    onRelease: function() {
      buttonGroup.userData.isPressed = false;
      buttonGroup.position.y = buttonGroup.userData.originalY;
      if (buttonGroup.userData.isHovered) {
        buttonMaterial.color.setHex(0x5C9CFF); // Back to hover color
      } else {
        buttonMaterial.color.copy(buttonGroup.userData.originalColor);
      }
    }
  });

  buttonGroup.rotation.x = THREE.MathUtils.degToRad(-80);
  
  return buttonGroup;
}




// Array to store interactive objects
const interactiveObjects = [];

// Raycaster for detecting clicks and hovers
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to load canopy model
let isWallMountedModelLoaded = null;
function loadWallMountedModel(url, position = { x: 0, y: 0, z: 0 }) {
  loader.load(
      url,
      function (gltf) {
          const newObject = gltf.scene;

          // Enable shadows
          newObject.traverse(function (node) {
              if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
              }
          });
          
          newObject.scale.set(100, 100, 100);
          
          // Set the position
          newObject.position.set(position.x, position.y, position.z);

          gsap.from(newObject.position, {
            y: position.y +40,
            duration: 1,
            ease: "power2.out"
          });

          if (isWallMountedModelLoaded) {
            scene.remove(isWallMountedModelLoaded);
            isWallMountedModelLoaded.traverse((child) =>{
              if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
              }
            });
            isWallMountedModelLoaded = null;
          }
          // Add the object to the scene and our tracking array
          scene.add(newObject);
          object.push(newObject);
          isWallMountedModelLoaded = newObject;

          // Adjust camera to fit all objects if this is the first object
          if (object.length === 1) {
              adjustCameraToFitObject(newObject);
          }
      },
      function (xhr) {
        
      },
      function (error) {
          console.error(error);
      }
  );
}

let isCanopySelected = false

const wallMountedCanopyButton = createButton('Wall Mounted Canopy', { x: -150, y: 50, z: 150 }, 300, 100, function() {
  if (isWallMountedModelLoaded) {
    scene.remove(isWallMountedModelLoaded);
  }

  loadWallMountedModel('_models/A/freestandingGREY.glb', { x: 0, y: 0, z: 0 });
  
  // Turn on the canopy selected switch
  isCanopySelected = true;
  updateSubmitButtonState()
  
  // Make the roof button look normal now that it can be used
  makeButtonLookEnabled(sampleRoofButton);
});

/*
let isFreeStandingModelLoaded = null;
function loadFreeStandingMountedModel(url, position = { x: 0, y: 0, z: 0 }) {
  loader.load(
      url,
      function (gltf) {
          const newObject = gltf.scene;

          // Enable shadows
          newObject.traverse(function (node) {
              if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
              }
          });
          
          newObject.scale.set(100, 100, 100);
          
          // Set the position
          newObject.position.set(position.x, position.y, position.z);

          gsap.from(newObject.position, {
            y: position.y +40,
            duration: 1,
            ease: "power2.out"
          });

          if (isFreeStandingModelLoaded) {
            scene.remove(isFreeStandingModelLoaded);
            isFreeStandingModelLoaded.traverse((child) =>{
              if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
              }
            });
            isFreeStandingModelLoaded = null;
          }
          // Add the object to the scene and our tracking array
          scene.add(newObject);
          object.push(newObject);
          isFreeStandingModelLoaded = newObject;

          // Adjust camera to fit all objects if this is the first object
          if (object.length === 1) {
              adjustCameraToFitObject(newObject);
          }
      },
      function (xhr) {
          console.log((xhr.loaded / xhr.total * 100) + '');
      },
      function (error) {
          console.error(error);
      }
  );
}
*/

/*
const freeStandingCanopyButton = createButton('Free standing canopy', { x: -150, y: 50, z: 250 }, 300, 100, function() {

  if (isWallMountedModelLoaded) {
    scene.remove(isWallMountedModelLoaded);
  }

  loadFreeStandingMountedModel('_models/A/freestandingGREY.glb', { x: -300, y: 0, z: 0 });
  
  // Turn on the canopy selected switch
  isCanopySelected = true;
  
  // Make the roof button look normal now that it can be used
  makeButtonLookEnabled(sampleFlatRoofButton);
});*/


// Function to load roof model
let isSlantedRoofModelLoaded = null;
function loadSlantedRoofModel(url, position = { x: 0, y: 0, z: 0 }) {
  loader.load(
      url,
      function (gltf) {
          const newObject = gltf.scene;

          // Enable shadows
          newObject.traverse(function (node) {
              if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
              }
          });
          
          newObject.scale.set(100, 100, 100);
          
          // Set the position
          newObject.position.set(position.x, position.y, position.z);

          gsap.from(newObject.position, {
            y: position.y +40,
            duration: 1,
            ease: "power2.out"
          });

          if (isSlantedRoofModelLoaded ) {
            scene.remove(isSlantedRoofModelLoaded );
            isSlantedRoofModelLoaded .traverse((child) =>{
              if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
              }
            });
            isSlantedRoofModelLoaded  = null;
          }
          // Add the object to the scene and our tracking array
          scene.add(newObject);
          object.push(newObject);
          isSlantedRoofModelLoaded  = newObject;

          // Adjust camera to fit all objects if this is the first object
          if (object.length === 1) {
              adjustCameraToFitObject(newObject);
          }
      },
      function (xhr) {
      
      },
      function (error) {
          console.error(error);
      }
  );
}
  // This is the Slanted Room Button Section
let isSlantedRoofSelected = false;
const sampleRoofButton = createButton('Slanted roof', { x: 300, y: 50, z: 150}, 300, 100, function() {
  if (!isCanopySelected) {
    return; 
  }
  
  if (isSlantedRoofModelLoaded) {
    scene.remove(isSlantedRoofModelLoaded);
  }
  loadSlantedRoofModel('_models/A/slopglassGREY.glb', { x: 0, y: 0, z: 0 });
  isSlantedRoofSelected = true; // use this to track if a roof has been selected
  updateSubmitButtonState()

  makeButtonLookEnabled(slidingGlassButton);
  makeButtonLookEnabled(aluminumButton);
  makeButtonLookEnabled(glassWallButton);

  
});

// Make the roof button look disabled at the start
makeButtonLookDisabled(sampleRoofButton);

//This is the Flat Roof Loading function 

/* 
let isFlatRoofModelLoaded = null;
function loadFlatRoofModel(url, position = { x: 0, y: 0, z: 0 }) {
  loader.load(
      url,
      function (gltf) {
          const newObject = gltf.scene;

          // Enable shadows
          newObject.traverse(function (node) {
              if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
              }
          });
          
          newObject.scale.set(100, 100, 100);
          
          // Set the position
          newObject.position.set(position.x, position.y, position.z);

          gsap.from(newObject.position, {
            y: position.y +40,
            duration: 1,
            ease: "power2.out"
          });

          if (isFlatRoofModelLoaded) {
            scene.remove(isFlatRoofModelLoaded);
            isFlatRoofModelLoaded.traverse((child) =>{
              if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
              }
            });
            isFlatRoofModelLoaded = null;
          }
          // Add the object to the scene and our tracking array
          scene.add(newObject);
          object.push(newObject);
          isFlatRoofModelLoaded = newObject;

          // Adjust camera to fit all objects if this is the first object
          if (object.length === 1) {
              adjustCameraToFitObject(newObject);
          }
      },
      function (xhr) {
          console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      function (error) {
          console.error(error);
      }
  );
}
*/

  // This is the Flat Roof Button Section
  /*let isFlatRoofSelected = false;
  const sampleFlatRoofButton = createButton('Flat roof', { x: 300, y: 50, z: 150 }, 300, 100, function() {

    if (!isCanopySelected) {
      return; 
    }
    
    if (isSlantedRoofModelLoaded) {
      scene.remove(isSlantedRoofModelLoaded);
    }
    loadFlatRoofModel('_models/A/flatglassGrEY.glb', { x: 0, y: 0, z: 0 });
    isFlatRoofSelected = true; // use this to track if a roof has been selected
  
    makeButtonLookEnabled(slidingGlassButton);
    makeButtonLookEnabled(aluminumButton);
    makeButtonLookEnabled(glassWallButton);
  

  
    
  });
  
  // Make the roof button look disabled at the start
  makeButtonLookDisabled(sampleFlatRoofButton);*/




let loadedWalls = [];
function loadWallModel(url, position = { x: 0, y: 0, z: 0 }) {
  loader.load(
      url,
      function (gltf) {
          const newObject = gltf.scene;

          // Enable shadows
          newObject.traverse(function (node) {
              if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
              }
          });
          
          newObject.scale.set(100, 100, 100);
          
          // Set the position
          newObject.position.set(position.x, position.y, position.z);

          gsap.from(newObject.position, {
            y: position.y +40,
            duration: 1,
            ease: "power2.out"
          });

          // Add the object to the scene and our tracking array
          scene.add(newObject);
          loadedWalls.push(newObject);
  

          // Adjust camera to fit all objects if this is the first object
          if (object.length === 1) {
              adjustCameraToFitObject(newObject);
          }
      },
      function (xhr) {
        
      },
      function (error) {
          console.error(error);
      }
  );
}


let isWallsSelected = false;
const slidingGlassButton = createButton('Sliding Glass Door', { x: 900, y: 50, z: -50 }, 300, 100, function() {
  if (!isCanopySelected || !isSlantedRoofSelected) {
    return;
  }
  loadWallModel('_models/A/Cynslidingdoors.glb', { x: 0, y: 0, z: 0 });

  isWallsSelected = true;
  updateSubmitButtonState()
});

makeButtonLookDisabled(slidingGlassButton);

const aluminumButton = createButton('Aluminum Wall', { x: 900, y: 50, z: 50 }, 300, 100, function() {
  if (!isCanopySelected || !isSlantedRoofSelected) {
    return;
  }
  loadWallModel('_models/A/Cynaluminslop2GREY.glb', { x: 0, y: 0, z: 0 });
  isWallsSelected = true;
  updateSubmitButtonState()
});

makeButtonLookDisabled(aluminumButton);

const glassWallButton = createButton('Glass Wall', { x: 900, y: 50, z: 150 }, 300, 100, function() {
  if (!isCanopySelected || !isSlantedRoofSelected ) {
    return;
  }
  loadWallModel('_models/A/Cynglasswall3slopGREY.glb', { x: 0, y: 0, z: 0 });
  isWallsSelected = true;
  updateSubmitButtonState()
});
makeButtonLookDisabled(glassWallButton);

let isSubmit = false;
const submitButton = createButton('Submit', { x: 900, y: 50, z: -250 }, 300, 100, function() {
  if (areAllSelectionsComplete()) {
    isSubmit = true;
    window.location.href = "_html/_details.html";
  }
  // Do nothing if selections aren't complete
});



function updateSubmitButtonState() {
  if (areAllSelectionsComplete()) {
    makeButtonLookEnabled(submitButton);
  } else {
    makeButtonLookDisabled(submitButton);
  }
}

function areAllSelectionsComplete() {
  return isCanopySelected && isSlantedRoofSelected && isWallsSelected;
}

function makeButtonLookDisabled(button) {
  // Find the main part of the button (the gold rectangle)
  const buttonBase = button.children[0];
  
  // Change its color to gray
  buttonBase.material.color.setHex(0x888888);
  
  // Make it a bit see-through
  buttonBase.material.transparent = true;
  buttonBase.material.opacity = 0.7;
}

function makeButtonLookEnabled(button) {
  // Find the main part of the button
  const buttonBase = button.children[0];
  
  // Change it back to the gold color
  buttonBase.material.color.setHex(0xCFB53B);
  
  // Make it fully visible
  buttonBase.material.opacity = 1.0;
}


const resetButton = createButton('Reset', { x: 900, y: 50, z: -450 }, 300, 100, function() {
  resetScene();
});

function resetScene() {
  // Remove slanted roof if loaded
  if (isSlantedRoofModelLoaded) {
    scene.remove(isSlantedRoofModelLoaded);
    isSlantedRoofModelLoaded.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    isSlantedRoofModelLoaded = null;
  }

  // Remove wall-mounted canopy if loaded
  if (isWallMountedModelLoaded) {
    scene.remove(isWallMountedModelLoaded);
    isWallMountedModelLoaded.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
    isWallMountedModelLoaded = null;
  }

  // Remove all loaded walls
  loadedWalls.forEach((model) => {
    scene.remove(model);
    model.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  });

  // Clear the models array
  loadedWalls.length = 0;

  // Reset all state variables
  isCanopySelected = false;
  isSlantedRoofSelected = false;
  isWallsSelected = false;

  // Disable buttons after reset
  makeButtonLookDisabled(sampleRoofButton);
  makeButtonLookDisabled(glassWallButton);
  makeButtonLookDisabled(aluminumButton);
  makeButtonLookDisabled(slidingGlassButton);
  makeButtonLookDisabled(wallMountedCanopyButton);
  makeButtonLookDisabled(submitButton);

}

// Event listeners for interaction
function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Check for hovering
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  let hovered = false;
  
  // Loop through intersected objects
  for (let i = 0; i < intersects.length; i++) {
    // Find the parent group if we hit a child mesh
    let object = intersects[i].object;
    while (object.parent && !object.userData.isButton) {
      object = object.parent;
    }
    
    // If we found a button, handle hover
    if (object.userData && object.userData.isButton) {
      // Find the interactive object that matches this mesh
      for (let j = 0; j < interactiveObjects.length; j++) {
        if (interactiveObjects[j].mesh === object) {
          interactiveObjects[j].onHover();
          hovered = true;
          // Set cursor to pointer for better UX
          document.body.style.cursor = 'pointer';
          break;
        }
      }
      if (hovered) break;
    }
  }
  
  // If not hovering over any buttons, reset all buttons and cursor
  if (!hovered) {
    document.body.style.cursor = 'auto';
    for (let i = 0; i < interactiveObjects.length; i++) {
      interactiveObjects[i].onHoverExit();
    }
  }
}

function onMouseDown(event) {
  // Use same logic as hover to find buttons under mouse
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  for (let i = 0; i < intersects.length; i++) {
    let object = intersects[i].object;
    while (object.parent && !object.userData.isButton) {
      object = object.parent;
    }
    
    if (object.userData && object.userData.isButton) {
      for (let j = 0; j < interactiveObjects.length; j++) {
        if (interactiveObjects[j].mesh === object) {
          interactiveObjects[j].onPress();
          break;
        }
      }
      break;
    }
  }
}

function onMouseUp(event) {
  // Handle click completion and trigger onClick
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  let clicked = false;
  
  for (let i = 0; i < intersects.length; i++) {
    let object = intersects[i].object;
    while (object.parent && !object.userData.isButton) {
      object = object.parent;
    }
    
    if (object.userData && object.userData.isButton) {
      for (let j = 0; j < interactiveObjects.length; j++) {
        if (interactiveObjects[j].mesh === object) {
          if (object.userData.isPressed) {
            interactiveObjects[j].onClick();
          }
          interactiveObjects[j].onRelease();
          clicked = true;
          break;
        }
      }
      if (clicked) break;
    }
  }
  
  // Release all buttons that might be pressed
  for (let i = 0; i < interactiveObjects.length; i++) {
    const obj = interactiveObjects[i].mesh;
    if (obj.userData.isPressed) {
      interactiveObjects[i].onRelease();
    }
  }
}

// Add event listeners
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onMouseDown, false);
window.addEventListener('mouseup', onMouseUp, false);

// Make sure to include this in your animation loop
function updateButtons() {
  // Update any button animations or effects here
  // This is a good place to add continuous button effects if needed
}

window.addEventListener("wheel", (event) => {
  // Get zoom amount from wheel event
  const zoomAmount = event.deltaY * 0.05; // Adjust sensitivity as needed
  
  // Update camera FOV
  let newFOV = camera.fov + zoomAmount;
  
  // Clamp FOV between reasonable values
  newFOV = Math.max(1, Math.min(newFOV, 200));
  
  // Apply new FOV with animation
  gsap.to(camera, {
    fov: newFOV,
    duration: 0.5,
    onUpdate: function() {
      camera.updateProjectionMatrix(); // Important! Must call this when changing FOV
    }
  });
});






const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
camera.position.set(0, 1000, 1000); // Position high up and back
camera.lookAt(0, 0, 0); // Look at the center

// Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true; // Enable shadow maps in the renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add the renderer to the DOM
container.appendChild(renderer.domElement);




let object  = [];
const loader = new GLTFLoader();


function loadFloor(url, position = { x: 0, y: 0, z: 0 }) {
  loader.load(
      url,
      function (gltf) {
          const newObject = gltf.scene;

          // Enable shadows
          newObject.traverse(function (node) {
              if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
              }
          });
          
          newObject.scale.set(100, 100, 100);
          
          // Set the position
          newObject.position.set(position.x, position.y, position.z);

          gsap.from(newObject.position, {
            y: position.y +40,
            duration: 1,
            ease: "power2.out"
          });

          // Add the object to the scene and our tracking array
          scene.add(newObject);
          object.push(newObject);

          // Adjust camera to fit all objects if this is the first object
          if (object.length === 1) {
              adjustCameraToFitObject(newObject);
          }
      },
      function (xhr) {
         
      },
      function (error) {
          console.error(error);
      }
  );
}


let isRoomLoaded = null;
function loadRoom(url, position = { x: 0, y: 0, z: 0 }) {
  loader.load(
      url,
      function (gltf) {
          const newObject = gltf.scene;

          // Enable shadows
          newObject.traverse(function (node) {
              if (node.isMesh) {
                  node.castShadow = true;
                  node.receiveShadow = true;
              }
          });
          
          newObject.scale.set(40, 70, 50);
          
          // Set the position
          newObject.position.set(position.x, position.y, position.z);

          gsap.from(newObject.position, {
            y: position.y +40,
            duration: 1,
            ease: "power2.out"
          });

          if (isRoomLoaded ) {
            scene.remove(isRoomLoaded );
            isRoomLoaded.traverse((child) =>{
              if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
              }
            });
            isRoomLoaded  = null;
          }

          // Add the object to the scene and our tracking array
          scene.add(newObject);
          object.push(newObject);
          isRoomLoaded = newObject;

          // Adjust camera to fit all objects if this is the first object
          if (object.length === 1) {
              adjustCameraToFitObject(newObject);
          }
      },
      function (xhr) {
        
      },
      function (error) {
          console.error(error);
      }
  );
}








function adjustCameraToFitObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Calculate proper camera distance
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));

  // Position camera for top-down architectural view
  const distance = cameraZ * 2; // Adjust this multiplier as needed
  camera.position.set(
      center.x,          // Center horizontally
      distance * 0.8,    // Height - 80% of distance
      distance * 0.6     // Back - 60% of distance
  );
  
  camera.lookAt(center);
}

loadFloor('_models/A/floor.glb', { x: 0, y: 0, z: 0 });
let isHousePlaced = false;
const addRemoveFloor = createButton('Add/Remove House', { x: -700, y: 50, z: 250 }, 300, 100, function() {
    if (!isHousePlaced) {
        // Load the house if it's not already placed
        loadRoom('_models/A/British_house_008.glb', { x: -200, y: 0, z: -200 });
        isHousePlaced = true;
        
        // Update button text - different approach that doesn't use this.element
        addRemoveFloor.children[0].textContent = 'Remove House';
        // Or if your button has a specific structure, you might need:
        // addRemoveFloor.querySelector('text').textContent = 'Remove House';
    } else {
        // Remove the house if it's already placed
        if (isRoomLoaded) {
            scene.remove(isRoomLoaded);
            isRoomLoaded.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
            isRoomLoaded = null;
            
            // Find and remove the house from the objects array
            const index = object.findIndex(obj => obj === isRoomLoaded);
            if (index !== -1) {
                object.splice(index, 1);
            }
        }
        isHousePlaced = false;
        
        // Update button text
        addRemoveFloor.children[0].textContent = 'Add House';
        // Or: addRemoveFloor.querySelector('text').textContent = 'Add House';
    }
});


 



// Studio lighting setup
const keyLight = new THREE.DirectionalLight(0xFFD580, 2); // Increase intensity to make it brighter
keyLight.position.set(20, 100, 50); // Position the sun at an angle for realistic lighting
keyLight.castShadow = true; // Allow the light to cast shadows
scene.add(keyLight);

// Add a backlight to soften shadows and increase the fill
const backLight = new THREE.DirectionalLight(0xFFDD99, 1.5); // Increased intensity for backlight
backLight.position.set(-30, 50, -30); // Positioned to highlight the back of the object
backLight.castShadow = false; // No shadows from back light to keep it subtle
scene.add(backLight);

// Use ambient light for overall brightness
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Adjust intensity as needed
scene.add(ambientLight);

// You can also add a hemispheric light
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5); // Sky color, ground color, intensity
hemisphereLight.position.set(0, 200, 0);
scene.add(hemisphereLight);


// Mouse movement stuff
let isRotating = false;
let rotationCenter = new THREE.Vector3(0, 0, 0); 
let isDragging = false;
let previousMousePos = {
  x: 0,
  y: 0
}

let previousPos = {
  x: 0,
  y: 0
}


window.addEventListener("contextmenu", (event) => {
  event.preventDefault(); // Prevent context menu from appearing
});


window.addEventListener("mousedown", (event) => {
  // Get normalized mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  if (event.button === 0) { // Left click
    isDragging = true;
    previousMousePos = {
      x: event.clientX,
      y: event.clientY 
    };
  } else if (event.button === 2) { // Right click
    // Cast a ray to find what was clicked
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      // Use the point of intersection as rotation center
      rotationCenter.copy(intersects[0].point);
    }
    
    isRotating = true;
    previousMousePos = {
      x: event.clientX,
      y: event.clientY 
    };
  }
});
window.addEventListener("mousemove", (event) => {
  // Your existing drag code
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePos.x,
      y: event.clientY - previousMousePos.y
    };

    gsap.to(camera.position, {
      x: camera.position.x - deltaMove.x * 20,
      z: camera.position.z - deltaMove.y * 20
    });
  }
  
  // Modified rotation code to use the clicked point
  if (isRotating) {
    const deltaRotate = {
      x: event.clientX - previousMousePos.x,
      y: event.clientY - previousMousePos.y
    };
    
    // Rotate around the clicked point
    const rotationSpeed = 0.01;
    
    // Rotate horizontally around Y axis
    camera.position.sub(rotationCenter);
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deltaRotate.x * rotationSpeed);
    camera.position.add(rotationCenter);
    
    // Rotate vertically around X axis
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    camera.position.sub(rotationCenter);
    camera.position.applyAxisAngle(right, -deltaRotate.y * rotationSpeed);
    camera.position.add(rotationCenter);
    
    // Look at the rotation center
    camera.lookAt(rotationCenter);
  }
  
  previousMousePos = {
    x: event.clientX,
    y: event.clientY
  };
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    isDragging = false;
  } else if (event.button === 2) {
    isRotating = false;
  }
});


window.addEventListener("touchstart", (event) => {
  event.preventDefault(); // Prevent default touch behaviors like scrolling
  
  const touch = event.touches[0];
  
  // Get normalized touch coordinates
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  
  if (event.touches.length === 1) {
    // Single touch = drag (like left click)
    isDragging = true;
    previousPos = {
      x: touch.clientX,
      y: touch.clientY
    };
  } else if (event.touches.length === 2) {
    // Two finger touch = rotation (like right click)
    // Get midpoint between the two touches
    const touch2 = event.touches[1];
    const midX = (touch.clientX + touch2.clientX) / 2;
    const midY = (touch.clientY + touch2.clientY) / 2;
    
    // Update normalized coordinates for the midpoint
    mouse.x = (midX / window.innerWidth) * 2 - 1;
    mouse.y = -(midY / window.innerHeight) * 2 + 1;
    
    // Cast ray to find rotation center
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      rotationCenter.copy(intersects[0].point);
    }
    
    isRotating = true;
    isDragging = false; // Ensure we're not dragging and rotating simultaneously
    previousPos = {
      x: midX,
      y: midY
    };
  }
});

window.addEventListener("touchmove", (event) => {
  event.preventDefault();
  
  if (event.touches.length === 1 && isDragging) {
    const touch = event.touches[0];
    
    const deltaMove = {
      x: touch.clientX - previousPos.x,
      y: touch.clientY - previousPos.y
    };

    gsap.to(camera.position, {
      x: camera.position.x - deltaMove.x * 20,
      z: camera.position.z - deltaMove.y * 20
    });
    
    previousPos = {
      x: touch.clientX,
      y: touch.clientY
    };
  } else if (event.touches.length === 2 && isRotating) {
    // Calculate midpoint for two-finger rotation
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const midX = (touch1.clientX + touch2.clientX) / 2;
    const midY = (touch1.clientY + touch2.clientY) / 2;
    
    const deltaRotate = {
      x: midX - previousPos.x,
      y: midY - previousPos.y
    };
    
    handleRotation(deltaRotate);
    
    previousPos = {
      x: midX,
      y: midY
    };
  }
});

window.addEventListener("touchend", (event) => {
  if (event.touches.length === 0) {
    // All fingers lifted
    isDragging = false;
    isRotating = false;
  } else if (event.touches.length === 1) {
    // If we were rotating with 2 fingers and one was lifted,
    // switch to dragging mode
    if (isRotating) {
      isRotating = false;
      isDragging = true;
      const touch = event.touches[0];
      previousPos = {
        x: touch.clientX,
        y: touch.clientY
      };
    }
  }
});





// Render the scene
function animate() {
    requestAnimationFrame(animate);
    updateTextOrientation();
    //controls.update(); // Smooth camera movements
    updateButtons()
    renderer.render(scene, camera);
}

// Start the 3D rendering
animate();
