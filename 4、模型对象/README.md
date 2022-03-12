## 1、模型介绍
模型都是由几何体 `Geometry`和材质`Material`构成。
<embed src="http://www.yanhuangxueyuan.com/upload/threejs28%E7%82%B9%E7%BA%BF%E9%9D%A2%E6%A8%A1%E5%9E%8B.svg" >

## 2、模型对象旋转平移缩放变换
点模型 `Points`、线模型 `Line`、网格网格模型 `Mesh` 等模型对象的基类都是 `Object3D`。
<embed src="http://www.yanhuangxueyuan.com/upload/threejs29Object3D.svg" >

### 1、缩放
执行`.translateX()`、`.translateY()`、.`translateOnAxis()` 等方法本质上改变的都是模型的位置属性.position。
```js
//网格模型xyz方向分别缩放0.5,1.5,2倍
mesh.scale.set(0.5, 1.5, 2);
//x轴方向放大2倍
mesh.scale.x = 2.0;
```
### 2、平移
```js
// 等价于mesh.position = mesh.position + 100;
mesh.translateX(100);//沿着x轴正方向平移距离100
//沿着Z轴负方向平移距离50。
mesh.translateZ(-50);
//沿着自定义的方向移动。
//向量Vector3对象表示方向
var axis = new THREE.Vector3(1, 1, 1);
axis.normalize(); //向量归一化
//沿着axis轴表示方向平移100
mesh.translateOnAxis(axis, 100);
```
### 3、位置属性
模型位置`.position`的默认值是`THREE.Vector3(0.0,0.0,0.0)`。
```js
//设置网格模型y坐标
mesh.position.y = 80;
//设置模型xyz坐标
mesh.position.set(80,2,10);
```
## 3、旋转
执行旋转`.rotateX()`等方法和执行平移`.translateY()`等方法一样都是对模型状态属性的改变，区别在于执行平移方法改变的是模型的位置属性 **`.position`**，执行模型的旋转方法改变的是表示模型角度状态的角度属性 **`.rotation`** 或者四元数属性 **`.quaternion`** 。
```js
mesh.rotateX(Math.PI/4);//绕x轴旋转π/4
var axis = new THREE.Vector3(0,1,0);//向量axis
mesh.rotateOnAxis(axis,Math.PI/8);//绕axis轴旋转π/8
```


