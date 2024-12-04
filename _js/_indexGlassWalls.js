// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Aluminum Wall Module
export function loadGlassWalls(scene, position, scale, rotation) {
  const wallLoader = new GLTFLoader();

  // Return a promise to ensure the loaded object is accessible
  return new Promise((resolve, reject) => {
    wallLoader.load(
      "_models/_features/_walls/_solidGlassWalls.gltf",
      (gltf) => {
        const _glassWalls = gltf.scene;

        // Create the walls and group them together
        const wallGroup = new THREE.Group();

        // Apply materials and shadows
        _glassWalls.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              color: 0xffffff, // White color for the glass roof
                transparent: true, // Enable transparency
                opacity: .9, // Set the opacity to 1 for a fully reflective surface
               metalness: 1, // High metalness for a mirror-like appearance
                roughness: 0.1, // Low roughness for a smooth surface
                side: THREE.DoubleSide // Render both sides of the glass
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
