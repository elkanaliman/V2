// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Glass Walls Module
export function loadGlassWalls(
  scene,
  position = { x: 0, y: 0, z: 0 }, // Default position if not provided
  scale = { x: 1, y: 1, z: 1 }, // Default scale if not provided
  rotation = { x: 0, y: 0, z: 0 } // Default rotation if not provided
) {
  const wallLoader = new GLTFLoader();

  return new Promise((resolve, reject) => {
    wallLoader.load(
      "_models/_features/_walls/_solidGlassWalls.gltf",
      (gltf) => {
        const _glassWalls = gltf.scene;

        // Apply initial scaling, position, and rotation with default checks
        if (position && position.x !== undefined && position.y !== undefined && position.z !== undefined) {
          _glassWalls.position.set(position.x, position.y, position.z);
        } else {
          console.warn("Position object is not properly defined for glass wall, using default values.");
          _glassWalls.position.set(0, 0, 0);
        }

        if (scale && scale.x !== undefined && scale.y !== undefined && scale.z !== undefined) {
          _glassWalls.scale.set(scale.x, scale.y, scale.z);
        } else {
          console.warn("Scale object is not properly defined for glass wall, using default values.");
          _glassWalls.scale.set(1, 1, 1);
        }

        if (rotation && rotation.x !== undefined && rotation.y !== undefined && rotation.z !== undefined) {
          _glassWalls.rotation.set(rotation.x, rotation.y, rotation.z);
        } else {
          console.warn("Rotation object is not properly defined for glass wall, using default values.");
          _glassWalls.rotation.set(0, 0, 0);
        }

        // Create the walls and group them together
        const wallGroup = new THREE.Group();
        wallGroup.add(_glassWalls);

        // Apply materials and shadows to the group elements
        wallGroup.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.9,
              metalness: 1,
              roughness: 0.1,
              side: THREE.DoubleSide
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Add the wall group to the scene and track it
        scene.add(wallGroup);

        // Track this glass wall instance so that it can be properly updated or disposed
        resolve(wallGroup);
      },
      undefined,
      (error) => {
        console.error("Error loading glass wall: ", error);
        reject(error);
      }
    );
  });
}