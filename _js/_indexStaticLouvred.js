// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Static Louvred Walls Module
export function loadStaticLouvredWalls(
  scene,
  position = { x: 0, y: 0, z: 0 }, // Default position if not provided
  scale = { x: 1, y: 1, z: 1 }, // Default scale if not provided
  rotation = { x: 0, y: 0, z: 0 } // Default rotation if not provided
) {
  const wallLoader = new GLTFLoader();

  // Return a promise to ensure the loaded object is accessible
  return new Promise((resolve, reject) => {
    wallLoader.load(
      "_models/_features/_walls/_staticLouvredWalls.gltf",
      (gltf) => {
        const _staticLouvredWalls = gltf.scene;

        // Create the walls and group them together
        const wallGroup = new THREE.Group();

        // Apply materials and shadows
        _staticLouvredWalls.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              roughness: 0.7, // Moderate roughness for a realistic look
              metalness: 0.8, // Increase metalness for a metallic appearance
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide,
              depthWrite: true, // Write the wall's depth to the buffer
              depthTest: true, // Enable depth testing for the wall
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Apply initial scaling, position, and rotation with validation checks
        if (position && position.x !== undefined && position.y !== undefined && position.z !== undefined) {
          _staticLouvredWalls.position.set(position.x, position.y, position.z);
        } else {
          console.warn("Position object is not properly defined for static louvred wall, using default values.");
          _staticLouvredWalls.position.set(0, 0, 0);
        }

        if (scale && scale.x !== undefined && scale.y !== undefined && scale.z !== undefined) {
          _staticLouvredWalls.scale.set(scale.x, scale.y, scale.z);
        } else {
          console.warn("Scale object is not properly defined for static louvred wall, using default values.");
          _staticLouvredWalls.scale.set(1, 1, 1);
        }

        if (rotation && rotation.x !== undefined && rotation.y !== undefined && rotation.z !== undefined) {
          _staticLouvredWalls.rotation.set(rotation.x, rotation.y, rotation.z);
        } else {
          console.warn("Rotation object is not properly defined for static louvred wall, using default values.");
          _staticLouvredWalls.rotation.set(0, 0, 0);
        }

        wallGroup.add(_staticLouvredWalls);

        // Add the group to the scene
        scene.add(wallGroup);

        // Return the group so it can be tracked
        resolve(wallGroup);
      },
      undefined,
      (error) => {
        console.error("Error loading static louvred wall: ", error);
        reject(error);
      }
    );
  });
}