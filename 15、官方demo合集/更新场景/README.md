## 1、如何更新场景
默认情况下，所有对象都会自动更新它们的矩阵。
但是，如果你知道对象将是静态的，则可以禁用此选项并在需要时手动更新转换矩阵。
```javascript
object.matrixAutoUpdate = false;
object.updateMatrix()
```

### 1、BufferGeometry
更新`BufferGeometries`，最重要的是理解你不能调整 `buffers` 大小（这种操作开销很大，相当于创建了个新的`geometry`）。 但你可以更新 `buffers` 的内容。
如果要在第一次渲染后更改position数值，则需要像这样设置needsUpdate标志：
```javascript
line.geometry.attributes.position.needsUpdate = true; // 需要加在第一次渲染之后
```

### 2. Materials
所有   `uniforms` 值都可以自由改变（比如 `colors, textures, opacity` 等等）
一旦 `material` 被渲染了一次, `material` 的属性变化了，需要建立新的 `shader` 程序。你需要设置
```javascript
material.needsUpdate = true
```
这可能会非常缓慢并导致帧率的波动。（特别是在 `Windows`上，因为`shader`编译在 `directx` 中比 `opengl` 慢）。
### 3.Textures
```javascript
texture.needsUpdate = true;
```

### 4.Cameras
如果你需要改变
+ fov
+ aspect
+ near
+ far
那么你需要重新计算投影矩阵：
```javascript
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
```

## 2、废置对象
在不需要用到改对象时，需要释放内存。
```javascript
scene.remove( mesh );
// clean up
geometry.dispose();
material.dispose();
texture.dispose();
```