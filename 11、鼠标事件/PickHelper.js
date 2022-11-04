import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';

export class PickHelper {
    constructor(args) {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
        this.pickPosition = { x:  -100000, y:  -100000 };
        this.inputElement = args.inputElement;
        this.addEvents(args.inputElement);
    }
    pick(normalizedPosition, scene, camera, time) {
        // restore the color if there is a picked object
        if (this.pickedObject) {
            this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
            this.pickedObject = undefined;
        }

        // cast a ray through the frustum 创建一条相机到指定点位的射线
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
            // pick the first object. It's the closest one
            this.pickedObject = intersectedObjects[0].object;
            // save its color
            this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
            // set its emissive color to flashing red/yellow
            this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
        }
    }
    addEvents(inputElement) {
        inputElement.addEventListener('mousemove', this.setPickPosition.bind(this));
        inputElement.addEventListener('mouseout', this.clearPickPosition.bind(this));
        inputElement.addEventListener('mouseleave', this.clearPickPosition.bind(this));

        inputElement.addEventListener('touchstart', (event) => {
            // prevent the window from scrolling
            event.preventDefault();
            this.setPickPosition(event.touches[0]);
        }, { passive: false });

        inputElement.addEventListener('touchmove', (event) => {
            event.preventDefault();
            this.setPickPosition(event.touches[0]);
        },{passive:false});

        inputElement.addEventListener('touchend', this.clearPickPosition.bind(this));
    }
    setPickPosition(event) {
        const {pickPosition,inputElement} = this;
        const pos = this.getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / inputElement.clientWidth) * 2 - 1;
        pickPosition.y = (pos.y / inputElement.clientHeight) * -2 + 1;  // note we flip Y
    }
    clearPickPosition() {
        // unlike the mouse which always has a position
        // if the user stops touching the screen we want
        // to stop picking. For now we just pick a value
        // unlikely to pick something
        this.pickPosition.x = -100000;
        this.pickPosition.y = -100000;
    }
    getCanvasRelativePosition(event) {
        const rect = this.inputElement.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }
    
}