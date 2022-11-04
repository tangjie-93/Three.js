import {
    AmbientLight, 
    BasicShadowMap, 
    BoxBufferGeometry, 
    DoubleSide, 
    LoadingManager, 
    Mesh, 
    MeshBasicMaterial, 
    MeshPhongMaterial, 
    Object3D, 
    PCFShadowMap, 
    PCFSoftShadowMap, 
    PerspectiveCamera, 
    PlaneBufferGeometry, 
    PointLight,
    Scene, 
    SphereBufferGeometry, 
    TextureLoader,
    Vector3, 
    WebGLRenderer
} from '../js/three.js';
import {OrbitControls} from "../js/OrbitControls.js";
import {MTLLoader} from "../js/loaders/MTLLoader.js";
import {OBJLoader} from "../js/loaders/OBJLoader.js"
export class Game extends Object3D{
    constructor(args){
        super(args);
        this.scene = null;
        this.mesh =null;
        this.texture = null;
        this.sprite = null;
        this.camera = null;
        this.renderer = null;
        this.ground = null;
        this.modelsAllLoaded=false;
        this.player = {
            height:1.8,
            speed:0.2,
            turnSpeed:Math.PI*0.02,
            canShoot:0
        }
        this.bullets = [];
        this.keyCodeMap = new Map();

        this.init();
        this.addMesh();
        this.createMap();
        this.addControl();
        this.addLight();
        this.addModels();
        this.addQuickCode();
        this.addCrate();
        this.animate();
    }
    init(){
        this.scene = new Scene();
        // 相机
        const aspect = window.innerWidth/window.innerHeight;
        const camera = new PerspectiveCamera(90,aspect,0.1,1000);
        camera.position.set(0,1.8,-15);
        camera.lookAt(new Vector3(0,1.8,0));
        this.camera = camera;
        // 渲染器
        const renderer = new WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth,window.innerHeight);
        renderer.shadowMap.enabled=true;
        /**
         * BasicShadowMap
         * PCFShadowMap
         * PCFSoftShadowMap
         */
        renderer.shadowMap.type = PCFSoftShadowMap;
        this.renderer = renderer;
        document.body.appendChild(renderer.domElement);
    }
    createMap(){
        const ground = new PlaneBufferGeometry(400,400,10,10);
        const material = new MeshPhongMaterial({
            color:0xffffff,
            side:DoubleSide,
            wireframe:false
        });
        const mesh = new Mesh(ground,material);
        // mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.rotateX(-Math.PI/2);
        this.ground = mesh;
        this.scene.add(mesh);
    }
    addLight(){
        const ambientLight = new AmbientLight(0xffffff,0.2);
        this.scene.add(ambientLight);
        const light = new PointLight(0xFFFFFF,0.8,180);
        light.position.set(-3,6,-3);
        // 产生阴影
        light.castShadow = true;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 25;//离光源多远范围会产生阴影
        this.scene.add(light);
    }
    addControl(){
        // const controls = new OrbitControls(this.camera,this.renderer.domElement);
        window.addEventListener('resize',this.resizeHandler.bind(this))
    }
    resizeHandler(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.camera.lookAt( this.scene.position );

        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
    addMesh(){
        const geometry = new BoxBufferGeometry(1,1,1);
        const material = new MeshPhongMaterial({
            color:0xFF4444,
        });
        const mesh= new Mesh(geometry,material);
        mesh.rotateY(Math.PI/6 );
        mesh.position.y = 1;
        mesh.castShadow = true;
        // 接收阴影
        mesh.receiveShadow = true;
        this.mesh = mesh;
        this.scene.add(this.mesh);
    }
    addCrate(){
        const textureLoader = new TextureLoader();
        const crateTexture =  textureLoader.load("./images/crate0_diffuse.jpg");
        const crateBumpMap = textureLoader.load("./images/crate0_bump.jpg");
        const normalTexture = textureLoader.load('./images/crate0_normal.jpg');
        const crate = new Mesh(
            new BoxBufferGeometry(3,3,3),
            new MeshPhongMaterial({
                color:0xffff00,
                // 纹理贴图
                map:crateTexture,
                // 法线贴图 法线是用于计算物体的明暗程度,将低解析度的模型渲染得更逼真，反映模型的深度、真实性和光滑度
                normalMap:normalTexture,

                bumpMap:crateBumpMap,


            })
        )
        crate.position.set(2.5,1,2.5);
        crate.castShadow = true;
        crate.receiveShadow = true;
        this.crate = crate;
        this.scene.add(crate);

    }
    addModels(){
        const loadingManager = new LoadingManager();
        loadingManager.onLoad =()=>{
            this.modelsAllLoaded = true;
        };
        const models = {
            tent: {
                obj:"./models/Tent_Poles_01.obj",
                mtl:"models/Tent_Poles_01.mtl",
                position:[-5,0,4],
                cloneObj:{
                    position:[-8, 0, 4]
                },
                castShadow:true

            },
            campfire: {
                obj:"./models/Campfire_01.obj",
                mtl:"./models/Campfire_01.mtl",
                position:[-5, 0, 1],
                cloneObj:{
                    position:[-8, 0, 1]
                },
                castShadow:true
            },
            pirateShip: {
                obj:"./models/PirateShip.obj",
                mtl:"./models/PirateShip.mtl",
                position:[-13, -1, 1],
                rotation:[0, Math.PI, 0],
                cloneObj:{
                    position:[13, -1, 1]
                },
                castShadow:true
            },
            playerWeapon: {
                obj:"./models/uziGold.obj",
                mtl:"./models/uziGold.mtl",
                position:[0,1.2,-14.5],
                rotation:[0, 0, 0],
                scale:[10,10,10],
                castShadow:false
            }
        };
        Object.entries(models).forEach(([key,value])=>{
            this.addModel(key,value,loadingManager);
        })
    }
    addModel(modelName,value,loadingManager){
        const {obj,mtl,position,castShadow,rotation,cloneObj,scale} = value
        const mtlLoader = new MTLLoader(loadingManager);
        // 添加帐篷
        mtlLoader.load(mtl,materials=>{
            const objLoader = new OBJLoader(loadingManager);
            objLoader.setMaterials(materials);
            objLoader.load(obj,mesh=>{
                // 遍历模型
                castShadow!==undefined&&mesh.traverse(model=>{
                    if(model instanceof Mesh){
                        model.castShadow = castShadow;
                    }
                })
                this.scene.add(mesh);
                this[modelName] = mesh;
                position&&mesh.position.set(...position);
                rotation&&mesh.rotation.set(...rotation);
                scale&&mesh.scale.set(...scale);
                if(cloneObj){
                    const cloneModel = mesh.clone();
                    cloneObj.position&&cloneModel.position.set(...cloneObj.position);
                    this.scene.add(cloneModel);
                }
            })
        })
    }
    addBullet(){
        const {playerWeapon,camera} = this;
        // 设置子弹
        const bullet = new Mesh(
            new SphereBufferGeometry(0.05,8,8),
            new MeshBasicMaterial({
                color:0xffffff
            })
            
        )
        // 设置子弹的位置
        const {x, y, z} = playerWeapon.position;
        bullet.position.set(
			x,
			y + 0.15,
			z
		);
		// 设置子弹的速度，子弹跟y轴平行,在x轴上越来越小，在z轴上越来越大
		// set the velocity of the bullet
		bullet.velocity = new Vector3(
			-Math.sin(camera.rotation.y),
			0,
			Math.cos(camera.rotation.y)
		);
		
		// after 1000ms, set alive to false and remove from scene
		// setting alive to false flags our update code to remove
		// the bullet from the bullets array
		bullet.alive = true;
		setTimeout(()=>{
			bullet.alive = false;
			this.scene.remove(bullet);
		}, 1000);
		
		// add to scene, array, and set the delay to 10 frames
		this.bullets.push(bullet);
		this.scene.add(bullet);
		this.player.canShoot = 10;
    }
    moveBullet(){
        const bullets = this.bullets;
        for(let index=0; index<bullets.length; index+=1){
            if( bullets[index] === undefined ) continue;
            if( bullets[index].alive == false ){
                index--;
                bullets.splice(index,1);
                continue;
            }
            bullets[index].position.add(bullets[index].velocity);
        }
        // 10帧后才可以再次发射子弹
        if(this.player.canShoot>0){
            this.player.canShoot--;
        }
    }
    moveWeapon(){
        if(this.modelsAllLoaded){
            const camera = this.camera;
            const time = Date.now() * 0.0005;
            // 枪的位置的设置
            // x轴：跟相机y轴旋转的角度有关
            // y轴：在y轴设置枪的抖动，跟左右移动和前后移动有关
            // z轴：设置枪在相机前方的位置 0.75m(正方向)，旋转角度时，位置会变
            // position the gun in front of the camera
            this.playerWeapon.position.set(
                camera.position.x- Math.sin(camera.rotation.y + Math.PI/6) * 0.75,// Math.PI/6使枪有一定斜角
                camera.position.y - 0.5 + Math.sin(time*4 + camera.position.x + camera.position.z)*0.01,//设置枪的抖动 跟左右移动和前后移动有关
                camera.position.z + Math.cos(camera.rotation.y + Math.PI/6) * 0.75
            )
            //保证枪跟摄像机的旋转角度一致
            this.playerWeapon.rotation.set(
                camera.rotation.x,
                camera.rotation.y - Math.PI,
                camera.rotation.z
            )
            // this.playerWeapon.rotation.y = -Math.PI;
        }
    }
    addQuickCode(){
        window.addEventListener('keydown',this.keyDownHandler.bind(this));
    }
    keyDownHandler(event){
        const {camera,player} = this;
        // 反方向旋转相机的角度
        switch(event.keyCode){
            case 37://左键
            case 65:// A 
                camera.rotation.y -= player.turnSpeed;
                break;
            case 39://右键
            case 68:// D
                camera.rotation.y += player.turnSpeed;
                break;
            case 38: //上
            case 87:// W
                camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
                camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
                // camera.position.z += player.speed;
                break;
            case 40: //下
            case 83: // S
                camera.position.x += Math.sin(camera.rotation.y) * player.speed;
		        camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
                // camera.position.z -= player.speed;
                break;
            case 32:
                if(this.modelsAllLoaded&&this.player.canShoot <= 0){
                    this.addBullet();
                }
                
        }
    }
    animate(){
        requestAnimationFrame(()=>{
            this.animate();
        });
        this.mesh.rotation.x+=0.01;
        this.mesh.rotation.y+=0.01;
        this.crate.rotation.y+=0.01;
        this.moveWeapon();
        this.moveBullet();
        this.renderer.render(this.scene,this.camera);
    }
    dispose(){
        window.removeEventListener('keydown',this.keyDownHandler.bind(this));
        window.removeEventListener('resize',this.resizeHandler.bind(this))
        Object.keys(this).forEach(key=>{
            if(this[key] instanceof Mesh){
                this.scene.remove(this[key]);
                this[key] = null;
            }
        })
        

    }
}