// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Aluminum Wall Module
export function loadRetractingLouvredWalls(scene, object) {
  const wallLoader = new GLTFLoader();

  // Return a promise to ensure the loaded object is accessible
  return new Promise((resolve, reject) => {
    wallLoader.load(
      "models/_features/_walls/_retractingLouvredWalls.gltf",
      (gltf) => {
        const _retractingLouvredWalls = gltf.scene;

        // Create the walls and group them together
        const wallGroup = new THREE.Group();

        // Apply materials and shadows
        _retractingLouvredWalls.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              roughness: 0.7,   // Moderate roughness for a realistic look
              metalness: 0.8,   // Increase metalness for a metallic appearance
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide,
              depthWrite: true,  // Write the wall's depth to the buffer
              depthTest: true,  // Enable depth testing for the wall
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Position wall at side B
        const wallB = _retractingLouvredWalls.clone();
        wallB.scale.set(0.8, 1, 1);
        wallB.position.set(55, 0, 4);
        wallB.rotation.y = Math.PI / 2;
        wallGroup.add(wallB);

        // Position wall at side D
        const wallD = _retractingLouvredWalls.clone();
        wallD.scale.set(0.8, 1, 1);
        wallD.position.set(-550, 0, 4);
        wallD.rotation.y = Math.PI / 2;
        wallGroup.add(wallD);

        // Add the group to the scene
        scene.add(wallGroup);

        // Return the group so it can be tracked
        resolve(wallGroup);
      },
      undefined,
      (error) => {
        console.error("Error loading Retracting wall: ", error);
        reject(error);
      }
    );
  });
}
