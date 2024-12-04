// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Aluminum Wall Module
export function loadBlinds(scene, position, scale, rotation) {
  const wallLoader = new GLTFLoader();

  // Return a promise to ensure the loaded object is accessible
  return new Promise((resolve, reject) => {
    wallLoader.load(
      "_models/_features/_walls/_solidGlassWalls.gltf",
      (gltf) => {
        const _binds = gltf.scene;

        // Create the walls and group them together
        const wallGroup = new THREE.Group();

        // Apply materials and shadows
        _glassWalls.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              roughness: 0.7,   // Moderate roughness for a realistic look
              metalness: 1,   // Increase metalness for a metallic appearance
               transparent: true,
               opacity: .4,
               side: THREE.DoubleSide,
               depthWrite: true,  // Write the wall's depth to the buffer
               depthTest: true,  // Enable depth testing for the wall
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        _glassWalls.position.set(position.x, position.y, position.z);
        _glassWalls.scale.set(scale.x, scale.y, scale.z);
        _glassWalls.rotation.set(rotation.x, rotation.y, rotation.z);


        wallGroup.add(_glassWalls);

        // Add the group to the scene
        scene.add(wallGroup);

        // Return the group so it can be tracked
        resolve(wallGroup);
      },
      undefined,
      (error) => {
        console.error("Error loading aluminum wall: ", error);
        reject(error);
      }
    );
  });
}
