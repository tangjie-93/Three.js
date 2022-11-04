import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';

export class GPUPickHelper {
    constructor(args) {
        // 创建一个1px的渲染目标
        this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
        this.pixelBuffer = new Uint8Array(4);
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
        this.pickPosition = { x:  -100000, y:  -100000 };
        this.inputElement = args.inputElement;
        this.addEvents(args.inputElement);
    }
    pick(cssPosition, scene, camera, time,renderer,idToObject) {
        const {pickingTexture, pixelBuffer} = this;
  
        // restore the color if there is a picked object
        if (this.pickedObject) {
          this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
          this.pickedObject = undefined;
        }
  
        // set the view offset to represent just a single pixel under the mouse
        const pixelRatio = renderer.getPixelRatio();
        camera.setViewOffset(
            renderer.getContext().drawingBufferWidth,   // full width
            renderer.getContext().drawingBufferHeight,  // full top
            cssPosition.x * pixelRatio | 0,             // rect x
            cssPosition.y * pixelRatio | 0,             // rect y
            1,                                          // rect width
            1,                                          // rect height
        );
        // render the scene
        renderer.setRenderTarget(pickingTexture);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        // clear the view offset so rendering returns to normal
        camera.clearViewOffset();
        //read the pixel
        renderer.readRenderTargetPixels(
            pickingTexture,
            0,   // x
            0,   // y
            1,   // width
            1,   // height
            pixelBuffer);

         // 
        const id =
            (pixelBuffer[0] << 16) |
            (pixelBuffer[1] <<  8) |
            (pixelBuffer[2]      );

  
        const intersectedObject = idToObject[id];
        if (intersectedObject) {
            console.log('pixelBuffer',pixelBuffer,id);

          // pick the first object. It's the closest one
          this.pickedObject = intersectedObject;
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
        const {pickPosition} = this;
        const pos = this.getCanvasRelativePosition(event);
        pickPosition.x = pos.x;
        pickPosition.y = pos.y;
        // pickPosition.x = (pos.x / inputElement.clientWidth) * 2 - 1;
        // pickPosition.y = (pos.y / inputElement.clientHeight) * -2 + 1;  // note we flip Y
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