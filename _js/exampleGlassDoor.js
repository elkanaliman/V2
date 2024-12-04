// Import necessary THREE.js libraries
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";


function updateModel(scene, _slidingGlassDoor, _length, _width){

    const _newGlassLength = _length;
    const _newGlassWidth = _width;


    _slidingGlassDoor.position.set( _newGlassLength, _newGlassWidth);

    scene.add(_slidingGlassDoor);

}



export function loadGlassDoorXample(scene, _length, _width) {
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
                            color: 0xffffff, // White color for the glass roof
                transparent: true, // Enable transparency
                opacity: .7, // Set the opacity to 1 for a fully reflective surface
                metalness: .8, // High metalness for a mirror-like appearance
               // roughness: 0.1, // Low roughness for a smooth surface
                side: THREE.DoubleSide // Render both sides of the glass
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
                _slidingGlassDoor.position.set(55, 0, 4);
                _slidingGlassDoor.rotation.y = Math.PI / 2;
                _slidingGlassDoor.scale.set(0.84, 1, 1);
                _wallGroup.add(_slidingGlassDoor);
            

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