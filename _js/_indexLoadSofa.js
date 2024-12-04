// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

let _victorianLampModel;

// Function to load the Victorian Lamp and add it to the pergola
export function loadSofa(scene, object) {
  //const _textureLoader = new THREE.TextureLoader();
  //const _flowerTexture = _textureLoader.load('_models/_features/_models/_texture1.png');
  const lampLoader = new GLTFLoader();

  // Load the Victorian Lamp model
  lampLoader.load('_models/_features/_models/sofa/scene.gltf', (gltf) => {
    _victorianLampModel = gltf.scene;

    // Set the position of the Victorian Lamp inside the pergola
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);

    _victorianLampModel.position.set(380, .8, -40); // Set it near the roof of the pergola
    _victorianLampModel.scale.set(.08, .08, .08); // Scale the lamp if necessary
    _victorianLampModel.rotation.y = Math.PI / 2;

    // Traverse the lamp model to enable shadows
    _victorianLampModel.traverse((node) => {
      if (node.isMesh) {

        node.material = new THREE.MeshStandardMaterial({
          //map: _flowerTexture,
          roughness: 0.5,
          metalness: 0.8,
          side: THREE.DoubleSide,
        });


        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Add the lamp model to the scene
    scene.add(_victorianLampModel);

  });
}

