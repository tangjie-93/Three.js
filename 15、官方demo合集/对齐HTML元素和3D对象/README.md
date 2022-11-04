## 1.立方体上方文字
+ 我们需要提供一个HTML元素来包含我们的标签元素。
+ 通过将Canvas元素和 <div id="labels"> 放在一个父元素里面，我们可以用这个CSS让它们重叠。
+ 生成立方体。它同时添加一个Label元素。
+ 在渲染时定位Label元素。
+ 解决旋转对象时导致的重叠问题（射线拾取,没有拾取到的不显示）。
+ 处理超出视锥体不可见的问题
    + 检查 tempV.z（物体中心点）检查此对象的原点是否在截锥体之外。
    + 检查对象本身是否在视锥体中
    ```js
    // 初始化
    const frustum = new THREE.Frustum();
    const viewProjection = new THREE.Matrix4();
    
    ...
    
    // 在检查前
    camera.updateMatrix();
    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    
    ...
    
    // 然后，对每一个Mesh
    someMesh.updateMatrix();
    someMesh.updateMatrixWorld();
    
    viewProjection.multiplyMatrices(
        camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(viewProjection);
    const inFrustum = frustum.contains(someMesh));
    ```
+ 解决Label显示顺序，离相机越近，显示在上面，给元素添加zIndex属性。

## 2.球体上方国家

+ 根据位置添加 Label。
+ 解决 出现背对我们的Label 的问题（根据相机到Label的方向向量和Label到球体中心的向量的点击来决定显示或隐藏标签）。
+ 解决Label数量太多，显示重叠的问题（根据国家面积大小来决定显示或隐藏Label）。

## 3.纹理索引拾取高亮一个国家


