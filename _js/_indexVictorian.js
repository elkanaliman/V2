// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

let _victorianLampModel;

// Function to load the Victorian Lamp and add it to the pergola
export function loadVictorianLamp(scene, object) {
  const lampLoader = new GLTFLoader();

  // Load the Victorian Lamp model
  lampLoader.load('_models/_features/_lights/_victorian/scene.gltf', (gltf) => {
    _victorianLampModel = gltf.scene;

    // Set the position of the Victorian Lamp inside the pergola
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    _victorianLampModel.position.set(300, .8, -300); // Set it near the roof of the pergola
    _victorianLampModel.scale.set(.3, .3, .3); // Scale the lamp if necessary

    // Traverse the lamp model to enable shadows
    _victorianLampModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Add the lamp model to the scene
    scene.add(_victorianLampModel);

  });
}

