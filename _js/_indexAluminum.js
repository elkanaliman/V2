// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Aluminum Wall Module
export function loadAluminumWall(
  scene,
  position = { x: 0, y: 0, z: 0 }, // Default position if not provided
  scale = { x: 1, y: 1, z: 1 }, // Default scale if not provided
  rotation = { x: 0, y: 0, z: 0 } // Default rotation if not provided
) {
  const wallLoader = new GLTFLoader();

  // Return a promise to ensure the loaded object is accessible
  return new Promise((resolve, reject) => {
    wallLoader.load(
      "_models/_features/_walls/_solidAluminiumWalls.gltf",
      (gltf) => {
        const _solidAluminiumWalls = gltf.scene;

        // Create the walls and group them together
        const wallGroup = new THREE.Group();

        // Apply materials and shadows
        _solidAluminiumWalls.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              // Material properties
              roughness: 0.7,
              metalness: 0.8,
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide,
              depthWrite: true,
              depthTest: true,
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Position, scale, and rotate the wall using the provided values
        if (position && position.x !== undefined && position.y !== undefined && position.z !== undefined) {
          _solidAluminiumWalls.position.set(position.x, position.y, position.z);
        } else {
          console.warn("Position object is not properly defined, using default values.");
          _solidAluminiumWalls.position.set(0, 0, 0);
        }

        if (scale && scale.x !== undefined && scale.y !== undefined && scale.z !== undefined) {
          _solidAluminiumWalls.scale.set(scale.x, scale.y, scale.z);
        } else {
          console.warn("Scale object is not properly defined, using default values.");
          _solidAluminiumWalls.scale.set(1, 1, 1);
        }

        if (rotation && rotation.x !== undefined && rotation.y !== undefined && rotation.z !== undefined) {
          _solidAluminiumWalls.rotation.set(rotation.x, rotation.y, rotation.z);
        } else {
          console.warn("Rotation object is not properly defined, using default values.");
          _solidAluminiumWalls.rotation.set(0, 0, 0);
        }

        // Add the wall to the wall group
        wallGroup.add(_solidAluminiumWalls);

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