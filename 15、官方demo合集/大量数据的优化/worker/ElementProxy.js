let nextProxyId = 0;
export class ElementProxy {
    constructor(element, worker) {
        this.id = nextProxyId++;
        this.worker = worker;
        this.registerId();
        this.sendSize(element);
        this.initEvent();
        this.registerEvent(element,this.eventHandlers);

        // really need to use ResizeObserver
        window.addEventListener('resize', ()=>{
            this.sendSize(element);
        });
    }
    initEvent(){
        this.mouseEventHandler = this.makeSendPropertiesHandler([
            'ctrlKey',
            'metaKey',
            'shiftKey',
            'button',
            'pointerType',
            'clientX',
            'clientY',
            'pageX',
            'pageY',
        ]);
        this.wheelEventHandlerImpl = this.makeSendPropertiesHandler([
            'deltaX',
            'deltaY',
        ]);
        this.keydownEventHandler = this.makeSendPropertiesHandler([
            'ctrlKey',
            'metaKey',
            'shiftKey',
            'keyCode',
        ]);
        // The four arrow keys
        this.orbitKeys = {
            '37': true,  // left
            '38': true,  // up
            '39': true,  // right
            '40': true,  // down
        };
         this.eventHandlers = {
            contextmenu: this.preventDefaultHandler,
            mousedown: this.mouseEventHandler,
            mousemove: this.mouseEventHandler,
            mouseup:this. mouseEventHandler,
            pointerdown: this.mouseEventHandler,
            pointermove: this.mouseEventHandler,
            pointerup: this.mouseEventHandler,
            touchstart: this.touchEventHandler,
            touchmove: this.touchEventHandler,
            touchend: this.touchEventHandler,
            wheel: this.wheelEventHandler,
            keydown: this.filteredKeydownEventHandler,
        };
    }
    wheelEventHandler(event, sendFn) {
        this.preventDefaultHandler(event);
        this.wheelEventHandlerImpl(event, sendFn);
    }

    preventDefaultHandler(event) {
        event.preventDefault();
    }

     copyProperties(src, properties, dst) {
        for (const name of properties) {
            dst[name] = src[name];
        }
    }

    makeSendPropertiesHandler(properties) {
        return (event, sendFn)=> {
            const data = { type: event.type };
            this.copyProperties(event, properties, data);
            sendFn(data);
        };
    }

    touchEventHandler(event, sendFn) {
        const touches = [];
        const data = { type: event.type, touches };
        for (let i = 0; i < event.touches.length; ++i) {
            const touch = event.touches[i];
            touches.push({
                pageX: touch.pageX,
                pageY: touch.pageY,
            });
        }
        sendFn(data);
    }
     filteredKeydownEventHandler(event, sendFn) {
        const { keyCode } = event;
        if (this.orbitKeys[keyCode]) {
            event.preventDefault();
            this.keydownEventHandler(event, sendFn);
        }
    }

    registerEvent(element,eventHandlers){
        for (const [eventName, handler] of Object.entries(eventHandlers)) {
            // 注册⌚️
            element.addEventListener(eventName, event=> {
                handler(event, this.sendEvent.bind(this));
            },{passive:false});
        }
    }
    registerId(){
         // register an id
         this.worker.postMessage({
            type: 'makeProxy',
            id: this.id,
        });
    }
    sendEvent(data){
        this.worker.postMessage({
            type: 'event',
            id: this.id,
            data,
        });
    }
    sendSize(element) {
            const rect = element.getBoundingClientRect();
            this.sendEvent({
                type: 'size',
                left: rect.left,
                top: rect.top,
                width: element.clientWidth,
                height: element.clientHeight,
            });
        }

}
