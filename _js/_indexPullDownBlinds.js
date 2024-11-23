// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";


export function loadPullDownBlinds(scene, object) {
  const wallLoader = new GLTFLoader();



  // Return a promise to ensure the loaded object is accessible
  return new Promise((resolve, reject) => {
    wallLoader.load(
      "models/_features/_door/_blinds.gltf",
      (gltf) => {
        const _pullDownBlinds = gltf.scene;

        // Create the walls and group them together
        const wallGroup = new THREE.Group();

        // Apply materials and shadows
        _pullDownBlinds.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
            
                color: 0xA9A9A9,          // Set the base color to dark grey for a sleek modern look
                roughness: 0.6,           // Moderate roughness to keep a fabric-like texture but with a smooth finish
                metalness: 0.3,           // Slight metalness for a modern look with a hint of reflective sheen
                transparent: true,        // Enable transparency to give the blinds a softer appearance
                opacity: 0.9,             // Slightly transparent for a more realistic and subtle effect
                side: THREE.DoubleSide,   // Render both sides to ensure the material is visible from all angles
                depthWrite: true,         // Write depth for accurate overlapping of other elements
                depthTest: true,          // Enable depth testing for proper scene layering
                envMapIntensity: 0.5,     // Add some environmental reflection for realism
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Position wall at side B
        const _blinds = _pullDownBlinds.clone();
        _blinds.scale.set(1.04, 1.04, 1);
        _blinds.position.set(5, 0, 4);
        _blinds.rotation.y = Math.PI / 1;
        wallGroup.add(_blinds);

        // Position wall at side D
        //const wallD = _solidAluminiumWalls.clone();
        //wallD.scale.set(0.8, 1, 1);
        //wallD.position.set(-550, 0, 4);
        //wallD.rotation.y = Math.PI / 2;
        //wallGroup.add(wallD);

        // Add the group to the scene
        scene.add(wallGroup);

        // Return the group so it can be tracked
        resolve(wallGroup);
      },
      undefined,
      (error) => {
        console.error("Error loading Sliding Glass Door: ", error);
        reject(error);
      }
    );
  });
}
