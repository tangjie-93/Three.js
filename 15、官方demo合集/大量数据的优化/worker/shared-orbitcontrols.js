// import * as THREE from '../../../js/three.js';
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
import { OrbitControls } from '../../../js/OrbitControls.js';
import {PickHelper} from "./PickHelper.js";
export function init(data) {   /* eslint-disable-line no-unused-vars */
    const { canvas, inputElement } = data;
    const renderer = new THREE.WebGLRenderer({ canvas });
    const scene = new THREE.Scene();
    const camera = addCamera();
    addControls();
    addLight();
    // addEvents();
    const cubes = addCubes();
    const pickHelper = new PickHelper({inputElement});

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = inputElement.clientWidth;
        const height = inputElement.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = inputElement.clientWidth / inputElement.clientHeight;
            camera.updateProjectionMatrix();
        }

        rotateCubes(cubes,time);
        // 创建射线
        pickHelper.pick(pickHelper.pickPosition, scene, camera, time);

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);


    function rotateCubes(cubes,time){
        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });
    }
    function addCubes(){
        const boxWidth = 1;
        const boxHeight = 1;
        const boxDepth = 1;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        return  [
            makeInstance(geometry, 0x44aa88, 0),
            makeInstance(geometry, 0x8844aa, -2),
            makeInstance(geometry, 0xaa8844, 2),
        ];
     
    }

    function makeInstance(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;
        scene.add(cube);
        return cube;
    }

    function addLight() {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    function addCamera() {
        const fov = 75;
        const aspect = 2; // the canvas default
        const near = 0.1;
        const far = 100;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = 4;
        return camera;
    }

    function addControls() {
        const controls = new OrbitControls(camera, inputElement);
        controls.target.set(0, 0, 0);
        controls.update();
    }

}

