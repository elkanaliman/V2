// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";


export function loadGlassDoor(scene, object) {
  const wallLoader = new GLTFLoader();



  // Return a promise to ensure the loaded object is accessible
  return new Promise((resolve, reject) => {
    wallLoader.load(
      "_models/_features/_door/_slidingGlassDoor.gltf",
      (gltf) => {
        const _slidingGlassDoor = gltf.scene;

        // Create the walls and group them together
        const wallGroup = new THREE.Group();

        // Apply materials and shadows
        _slidingGlassDoor.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
            
                color: 0xffffff,           // Set the base color to white
                roughness: 0.05,           // Reduce roughness to make it even smoother
                metalness: 0.3,            // Increase metalness slightly for more reflection
                transparent: true,         // Enable transparency
                opacity: 0.3,              // Reduce opacity to make it look more transparent (lower values are more transparent)
                side: THREE.DoubleSide,    // Render both sides to ensure it looks correct regardless of viewing angle
                depthWrite: true,          // Write depth for accurate overlapping of other transparent elements
                depthTest: true,           // Enable depth testing for proper scene layering
                envMapIntensity: 0.7       // Add some environmental reflection to make it look like real glass
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Position wall at side B
        const _glassDoor = _slidingGlassDoor.clone();
        _glassDoor.scale.set(1.04, 1.04, 1);
        _glassDoor.position.set(5, 0, 4);
        _glassDoor.rotation.y = Math.PI / 1;
        wallGroup.add(_glassDoor);

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
