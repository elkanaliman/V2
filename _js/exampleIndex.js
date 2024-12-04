import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "https://threejs.org/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "https://threejs.org/examples/jsm/geometries/TextGeometry.js";

// ... (your existing imports and code)

// Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6FA8DC);

// Font loader to add text to the scene
const fontLoader = new FontLoader();
fontLoader.load('_models/_features/_fonts/_winterFont.json', function (font) {
    // Create text geometry
    const textGeometry = new TextGeometry('KAPENGURIA', {
        font: font,
        size: 50, // Set size of the text
        height: 10, // Set the depth of the text
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 2,
        bevelSize: 1.5,
        bevelSegments: 5
    });

    // Material for the text
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF5733, // Set color to make the text stand out
    });

    // Create a mesh for the text
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    
    // Set the position of the text
    textMesh.position.set(0, 50, 0); // Adjust position as needed
    textMesh.rotation.x = -Math.PI / 2; // If you want it lying flat on the ground

    // Add the text mesh to the scene
    scene.add(textMesh);
});

// ... (the rest of your code)

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Smooth camera movements
    renderer.render(scene, camera);
}

// Start the 3D rendering
animate();