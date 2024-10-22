# 1. 初始化 WebGL 对象
```js
// 初始化 WebGL 信息 如调用次数、点线面的数量，几何图形的数量，纹理的数量
info = new WebGLInfo(_gl);
// 初始化 WebGL 属性 用于处理 WebGL 中的属性缓冲,主要是处理以下代码的逻辑
/**
* 	const buffer = gl.createBuffer();
    gl.bindBuffer( bufferType, buffer );
    gl.bufferData( bufferType, array, usage );
*/
attributes = new WebGLAttributes(_gl);
// 初始化 WebGL 几何体  
// 主要处理attributes里面的属性，并释放bindingStates的内存
geometries = new WebGLGeometries(_gl, attributes, info, bindingStates);
// 初始化 WebGL 对象 用于操作object的
objects = new WebGLObjects(_gl, geometries, attributes, info);
```
# 2. WebGLObjects源码解读
```js
/**
 * WebGLObjects 类
 *
 * @param {WebGLRenderingContext} gl - WebGL 渲染上下文
 * @param {Map} geometries - 几何体映射表
 * @param {Map} attributes - 属性映射表
 * @param {Object} info - 渲染信息
 * @returns {Object} - 包含 update 和 dispose 方法的对象
 */
function WebGLObjects( gl, geometries, attributes, info ) {

	let updateMap = new WeakMap();

	/**
	 * 更新物体
	 *
	 * @param object 物体对象
	 * @returns 返回更新后的BufferGeometry对象
	 */
	function update( object ) {
		// 获取当前渲染帧
		const frame = info.render.frame;
		// 获取对象的几何体
		const geometry = object.geometry;
		// 从几何体缓存中获取对应的缓冲几何体 //实际上是buffergeometry = geometry
		const buffergeometry = geometries.get( object, geometry );
		// 每帧更新一次
		// Update once per frame
		if ( updateMap.get( buffergeometry ) !== frame ) {
			// 更新缓冲几何体
			// 实际上 更新的是geometry.attributes
			geometries.update( buffergeometry );
			// 更新缓冲几何体对应的帧
			updateMap.set( buffergeometry, frame );
		}
		// 如果对象是实例化网格
		if ( object.isInstancedMesh ) {
			// 如果对象没有监听 'dispose' 事件，则添加监听器
			if ( object.hasEventListener( 'dispose', onInstancedMeshDispose ) === false ) {
				object.addEventListener( 'dispose', onInstancedMeshDispose );
			}
			// 如果对象对应的帧与当前帧不同
			if ( updateMap.get( object ) !== frame ) {
				// 更新对象的实例矩阵
				attributes.update( object.instanceMatrix, gl.ARRAY_BUFFER );
				// 如果对象的实例颜色不为空
				if ( object.instanceColor !== null ) {
					// 更新对象的实例颜色
					attributes.update( object.instanceColor, gl.ARRAY_BUFFER );
				}
				// 更新对象对应的帧
				updateMap.set( object, frame );
			}
		}
		// 如果对象是蒙皮网格
		if ( object.isSkinnedMesh ) {
			// 获取对象的骨骼
			const skeleton = object.skeleton;
			// 如果骨骼对应的帧与当前帧不同
			if ( updateMap.get( skeleton ) !== frame ) {
				// 更新骨骼
				skeleton.update();
				// 更新骨骼对应的帧
				updateMap.set( skeleton, frame );
			}
		}
		// 返回缓冲几何体
		return buffergeometry;
	}

	function dispose() {
		updateMap = new WeakMap();
	}
	/**
	 * 销毁实例网格时触发的回调函数
	 *
	 * @param event 事件对象
	 */
	function onInstancedMeshDispose( event ) {
		const instancedMesh = event.target;
		instancedMesh.removeEventListener( 'dispose', onInstancedMeshDispose );
		// 主要调用 gl.deleteBuffer( data.buffer );删除WebGL缓冲区
		attributes.remove( instancedMesh.instanceMatrix );
		if ( instancedMesh.instanceColor !== null ) attributes.remove( instancedMesh.instanceColor );
	}
	return {
		update: update,
		dispose: dispose
	};
}
export { WebGLObjects };
```