// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

let _lightLampModel;

// Function to load the Victorian Lamp and add it to the pergola
export function loadLightLamp(scene, object) {
  const _lampLoader = new GLTFLoader();

  // Load the Victorian Lamp model
  _lampLoader.load('models/_features/_lights/_ceilingLight/scene.gltf', (gltf) => {
    _lightLampModel = gltf.scene;

    // Set the position of the Victorian Lamp inside the pergola
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    _lightLampModel.position.set(2, 220, -2); // Set it near the roof of the pergola
    _lightLampModel.scale.set(40, 40, 40); // Scale the lamp if necessary

    // Traverse the lamp model to enable shadows
    _lightLampModel.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Add the lamp model to the scene
    scene.add(_lightLampModel);

  });
}

