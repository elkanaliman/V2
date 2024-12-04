// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";


function updateModel(scene, _slidingGlassDoor, _length, _width){

    const _newGlassLength = _length;
    const _newGlassWidth = _width;


    _slidingGlassDoor.position.set( _newGlassLength, _newGlassWidth);

    scene.add(_slidingGlassDoor);

}



export function loadGlassDoor(scene, _length, _width) {
    const wallLoader = new GLTFLoader();

    return new Promise((resolve, reject) => {
        wallLoader.load(
            "_models/_features/_door/_glassDoor.gltf",
            (gltf) => {
                const _slidingGlassDoor = gltf.scene;
                const _wallGroup = new THREE.Group();

                // Apply materials and shadows to give it a realistic glass effect
                _slidingGlassDoor.traverse((node) => {
                    if (node.isMesh) {
                        node.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,        // Glass-like base color
                            roughness: 0.05,       // Smooth surface
                            metalness: 1,        // Slight metallic shine
                            transparent: true,     // Enable transparency
                            opacity: 0.3,          // Adjust transparency level
                            side: THREE.DoubleSide,// Render both sides
                            depthWrite: true,      // Accurate overlapping
                            depthTest: true,       // Ensure depth testing for proper layering
                        });
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });


                const _newLength = _length;
                const _newWidth = _width;

                const _testing = _newLength + _newWidth;

                console.log("Total: " , _testing);

                //_slidingGlassDoor.scale.set(1,1,1);
                // Add to the scene
                _slidingGlassDoor.rotation.y = Math.PI / 0.5;
                _wallGroup.add(_slidingGlassDoor);
                


                if (object) {
                    scene.remove(object);
                  }

                //updateModel(scene, _slidingGlassDoor, _newLength, _newWidth);
                 scene.add(_wallGroup);

                // Resolve with the loaded glass door object
                 resolve(_wallGroup);
            },
            undefined,
            (error) => {
                console.error("Error loading Sliding Glass Door: ", error);
                reject(error);
            }
        );
    });
}