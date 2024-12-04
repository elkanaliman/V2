// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Aluminum Wall Module
export function loadAluminumWall(scene, position, scale, rotation) {
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
             //this here is to add textures later @dev,
              roughness: 0.7, //these are spaces for comments for future devs
              metalness: 0.8, //
              transparent: true, //
              opacity: 1, //
              side: THREE.DoubleSide, //
              depthWrite: true, //
              depthTest: true, //
            });
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        // Position wall at side B
       // const wallB = _solidAluminiumWalls.clone();
        //wallB.scale.set(0.84, 1, 1);
        //wallB.position.set(1, 0, 4);
        //wallB.rotation.y = Math.PI / 0.5;
        //wallGroup.add(wallB);

        _solidAluminiumWalls.position.set(position.x, position.y, position.z);
        _solidAluminiumWalls.scale.set(scale.x, scale.y, scale.z);
        _solidAluminiumWalls.rotation.set(rotation.x, rotation.y, rotation.z);


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

