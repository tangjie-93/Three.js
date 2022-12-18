import {
    Object3D,
    Scene,
    DirectionalLight,
    PlaneGeometry,
    MeshPhongMaterial,
    Mesh,
    PerspectiveCamera,
    WebGLRenderer,
    BoxGeometry,
    CylinderGeometry,
    SphereGeometry,
    SplineCurve,
    BufferGeometry,
    LineBasicMaterial,
    Line,
    Vector3,
    Vector2,
    AxesHelper
} from "../../../js/three.js";
import { OrbitControls } from "../../../js/OrbitControls.js";

export class Tank extends Object3D {
    constructor(args) {
        super(args);
        this.init();
    }
    init() {

        this.targetPosition = new Vector3();
        this.tankPosition = new Vector2();
        this.tankTarget = new Vector2();
        this.infoElem = document.querySelector('#info');
        this.initScene();
        this.addLight();
        this.addCamera();
        this.createGround();
        this.initRenderer();
        this.addControl();
        this.createTank();
        this.animate();
    }
    initScene() {
        this.scene = new Scene();
        const axes = new AxesHelper(10);
        axes.material.depthTest = false;
        axes.renderOrder = 2; // 在网格渲染之后再渲染
        this.scene.add(axes);
    }
    addLight() {
        const light = new DirectionalLight(0xffffff, 1);
        light.position.set(0, 20, 0);
        this.scene.add(light);
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;

        const d = 50;
        light.shadow.camera.left = -d;
        light.shadow.camera.right = d;
        light.shadow.camera.top = d;
        light.shadow.camera.bottom = -d;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 50;
        light.shadow.bias = 0.001;

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 2, 4);
        this.scene.add(directionalLight);
    }
    makeCamera({ fov = 40, aspect = 2, zNear = 0.1, zFar = 1000 }) {
        return new PerspectiveCamera(fov, aspect, zNear, zFar);
    }
    addCamera() {
        const camera = this.makeCamera({});
        camera.position.set(8, 4, 10).multiplyScalar(3);
        camera.lookAt(0, 0, 0);
        this.camera = camera;
    }
    initRenderer() {
        const canvas = document.querySelector('#container');
        const renderer = new WebGLRenderer({ canvas, antialias: true });
        renderer.setClearColor(0xAAAAAA);
        // 使阴影生效
        renderer.shadowMap.enabled = true;
        this.renderer = renderer;
    }
    createGround() {
        const groundGeometry = new PlaneGeometry(500, 500);
        const groundMaterial = new MeshPhongMaterial({ color: 0xCC8866 });
        const groundMesh = new Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = Math.PI * -.5;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);
    }
    createTank() {

        // 坦克场景图
        const tank = new Object3D();
        this.scene.add(tank);
        this.tank = tank;
        const carWidth = 4;
        const carHeight = 1;
        const carLength = 8;
        this.addCarBody(carWidth, carHeight, carLength);
        this.addTankCamera();
        this.addWheels(carWidth, carHeight, carLength);
        this.addDoneModel();
        this.addTurretModel(carLength);
        this.addTurretCamera();

        this.addTargetOrbit(carLength);
        this.addTargetCamera();
        this.createCurve();
        this.cameras = [
            { cam: this.camera, desc: 'detached camera', },
            { cam: this.turretCamera, desc: 'on turret looking at target', },
            { cam: this.targetCamera, desc: 'near target looking at tank', },
            { cam: this.tankCamera, desc: 'above back of tank', },
        ];
    }
    // 添加坦克的车体  
    addCarBody(carWidth, carHeight, carLength) {
        const bodyGeometry = new BoxGeometry(carWidth, carHeight, carLength);
        const bodyMaterial = new MeshPhongMaterial({ color: 0x6688AA });
        const bodyMesh = new Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.y = 1.4;
        bodyMesh.castShadow = true;
        this.tank.add(bodyMesh);
        this.bodyMesh = bodyMesh;
        this.bodyMaterial = bodyMaterial;

        const axes = new AxesHelper(10);
        axes.material.depthTest = false;
        axes.renderOrder = 2; // 在网格渲染之后再渲染
        bodyMesh.add(axes);
    }
    // 添加坦克相机
    addTankCamera() {
        const tankCameraFov = 75;
        const tankCamera = this.makeCamera({ fov: tankCameraFov });
        tankCamera.position.y = 3;
        tankCamera.position.z = -6;
        tankCamera.rotation.y = Math.PI;
        this.tankCamera = tankCamera;
        // this.bodyMesh.add(tankCamera);
    }
    // 添加车轮
    addWheels(carWidth, carHeight, carLength) {
        const wheelRadius = 1;
        const wheelThickness = .5;
        const wheelSegments = 6;
        const wheelGeometry = new CylinderGeometry(
            wheelRadius,     // top radius
            wheelRadius,     // bottom radius
            wheelThickness,  // height of cylinder
            wheelSegments);
        const wheelMaterial = new MeshPhongMaterial({ color: 0x888888 });
        const wheelPositions = [
            // x轴为车宽一半+车轮厚度一半，y轴为车高一半
            [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, carLength / 3],
            [carWidth / 2 + wheelThickness / 2, -carHeight / 2, carLength / 3],
            [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, 0],
            [carWidth / 2 + wheelThickness / 2, -carHeight / 2, 0],
            [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, -carLength / 3],
            [carWidth / 2 + wheelThickness / 2, -carHeight / 2, -carLength / 3],
        ];
        this.wheelMeshes = wheelPositions.map((position) => {
            const mesh = new Mesh(wheelGeometry, wheelMaterial);
            mesh.position.set(...position);
            mesh.rotation.z = Math.PI * .5;
            mesh.castShadow = true;
            this.bodyMesh.add(mesh);
            return mesh;
        });

    }
    // 坦克中间的球体
    addDoneModel() {
        const domeRadius = 2;
        const domeWidthSubdivisions = 12;
        const domeHeightSubdivisions = 12;
        const domePhiStart = 0;
        const domePhiEnd = Math.PI * 2;
        const domeThetaStart = 0;
        const domeThetaEnd = Math.PI * .5;
        const domeGeometry = new SphereGeometry(
            domeRadius, domeWidthSubdivisions, domeHeightSubdivisions,
            domePhiStart, domePhiEnd, domeThetaStart, domeThetaEnd);
        const domeMesh = new Mesh(domeGeometry, this.bodyMaterial);
        domeMesh.castShadow = true;
        // 往上移动0.5个单位
        domeMesh.position.y = .5;
        this.bodyMesh.add(domeMesh);

    }
    // 添加炮塔模型
    addTurretModel(carLength) {
        const turretWidth = .1;
        const turretHeight = .1;
        const turretLength = carLength * .75 * .2;
        const turretGeometry = new BoxGeometry(
            turretWidth, turretHeight, turretLength);
        const turretMesh = new Mesh(turretGeometry, this.bodyMaterial);
        turretMesh.castShadow = true;
        // 在z轴方向上移动 turretLength * .5 个单位
        turretMesh.position.z = turretLength * .5;

        const turretPivot = new Object3D();
        turretPivot.scale.set(5, 5, 5);
        //往上移动0.5个单位
        turretPivot.position.y = .5;
        turretPivot.add(turretMesh);
        this.bodyMesh.add(turretPivot);

        this.turretMesh = turretMesh;
        this.turretPivot = turretPivot;
    }
    // 添加turret相机
    addTurretCamera() {
        const turretCamera = this.makeCamera({});
        turretCamera.position.y = .75 * .2;
        this.turretMesh.add(turretCamera);
        this.turretCamera = turretCamera;
    }
    // 添加目标的场景，炮塔对准的模型
    addTargetOrbit(carLength) {
        const targetGeometry = new SphereGeometry(.5, 6, 3);
        const targetMaterial = new MeshPhongMaterial({ color: 0x00FF00, flatShading: true });
        const targetMesh = new Mesh(targetGeometry, targetMaterial);


        const targetOrbit = new Object3D();
        const targetElevation = new Object3D();
        const targetBob = new Object3D();

        targetMesh.castShadow = true;
        // 设置偏移和基准高度
        targetElevation.position.z = carLength * 2;
        targetElevation.position.y = 8;

        this.scene.add(targetOrbit);
        targetOrbit.add(targetElevation);
        targetElevation.add(targetBob);
        targetBob.add(targetMesh);


        this.targetOrbit = targetOrbit;
        this.targetMesh = targetMesh;
        this.targetBob = targetBob;
        this.targetMaterial = targetMaterial;
    }
    // 添加目标相机
    addTargetCamera() {
        const targetCamera = this.makeCamera({});
        const targetCameraPivot = new Object3D();
        targetCamera.position.y = 1;
        targetCamera.position.z = -2;
        console.log('targetCamera',targetCamera);

        // 相机绕y轴旋状180度
        targetCamera.rotation.y = Math.PI;
        targetCameraPivot.add(targetCamera);
        this.targetBob.add(targetCameraPivot);

        this.targetCamera = targetCamera;
        this.targetCameraPivot = targetCameraPivot;
    }
    // 创建样条曲线
    createCurve(params) {
        // Create a sine-like wave
        const curve = new SplineCurve([
            new Vector2(-10, 0),
            new Vector2(-5, 5),
            new Vector2(0, 0),
            new Vector2(5, -5),
            new Vector2(10, 0),
            new Vector2(5, 10),
            new Vector2(-5, 10),
            new Vector2(-10, -10),
            new Vector2(-15, -8),
            new Vector2(-10, 0),
        ]);

        const points = curve.getPoints(150);
        const geometry = new BufferGeometry().setFromPoints(points);
        const material = new LineBasicMaterial({ color: 0xff0000 });
        const splineObject = new Line(geometry, material);
        // 绕x轴旋转
        splineObject.rotation.x = Math.PI * .5;
        splineObject.position.y = 0.05;
        this.scene.add(splineObject);
        this.splineObject = splineObject;
        this.curve = curve;
    }

    resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }
    render(time) {
        time *= 0.001;
        const { renderer, cameras, resizeRendererToDisplaySize } = this;
        // 判断canvas显示大小是否变了
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            cameras.forEach((cameraInfo) => {
                const camera = cameraInfo.cam;
                // 不断更新相机的视锥
                camera.aspect = canvas.clientWidth / canvas.clientHeight;
                camera.updateProjectionMatrix();
            });
        }
        // this.control.update();

        this.moveTarget(time);
        this.moveTank(time);
        this.moveWheels(time);
        this.lookAtTarget();
        this.renderByCamera(time);
        requestAnimationFrame(this.render.bind(this));
    }
    addControl() {
      this.control=  new OrbitControls(this.camera, this.renderer.domElement);
    }

    lookAtTarget() {
        const targetPosition = this.targetPosition;
        // face turret at target 
        // 获取目标球体的世界位置(世界坐标系中的位置)
        this.targetMesh.getWorldPosition(targetPosition);
       
        // 塔楼看向目标球体
        this.turretPivot.lookAt(targetPosition);

        // make the turretCamera look at target 
        // 塔楼相机也看向目标球体
        this.turretCamera.lookAt(targetPosition);

        // make the targetCameraPivot look at the at the tank
        // 获取坦克在世界坐标系中的位置
        this.tank.getWorldPosition(targetPosition);
        // 目标球体相机看向坦克
        this.targetCameraPivot.lookAt(targetPosition);
    }

    moveTarget(time) {
        // move target  移动过目标球体
        this.targetOrbit.rotation.y = time * .27;// 旋转目标球体的视场
        this.targetBob.position.y = Math.sin(time * 2) * 2; // 是目标球体上下运动，相对于 targetElevation 上下摆动
        // 修改目标球体
        this.targetMesh.rotation.x = time * 7; // 旋转目标球体
        this.targetMesh.rotation.y = time * 13;// 旋转目标球体
        // 修改目标球体的颜色
        this.targetMaterial.emissive.setHSL(time * 10 % 1, 1, .25);
        this.targetMaterial.color.setHSL(time * 10 % 1, 1, .25);
    }
    moveTank(time) {
        // move tank 使坦克移动
        const tankTime = time * .05;
        const { tankPosition, tankTarget } = this;
        //0.0 是曲线的起始点，1.0 是曲线的终点，所以对1求余
        this.curve.getPointAt(tankTime % 1, tankPosition);
        this.curve.getPointAt((tankTime + 0.01) % 1, tankTarget);
        // 设置坦克的位置 因为线已经绕x轴旋状90度了，所以现在的y轴坐标就是z轴坐标
        this.tank.position.set(tankPosition.x, 0, tankPosition.y);
        
        // 设置坦克看向的位置，设置坦克的前进方向
        this.tank.lookAt(tankTarget.x, 0, tankTarget.y);
    }
    moveWheels(time){
        // 车轮绕x轴旋转
        this.wheelMeshes.forEach((obj) => {
            obj.rotation.x = time * 3;
        });
    }
    renderByCamera(time){
         // 切换相机
         const camera = this.cameras[time * .25 % this.cameras.length | 0];
         this.infoElem.textContent = camera.desc;
         this.renderer.render(this.scene, this.camera);
 
         // this.renderer.render(this.scene, camera.cam);
    }
    animate() {
        requestAnimationFrame(this.render.bind(this));
    }
}