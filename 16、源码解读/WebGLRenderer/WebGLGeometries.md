# 1. 初始化 WebGL 几何体
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
// 初始化 WebGL 绑定状态, 主要是执行以下代码的逻辑
/**
    *  //缓冲区中的数据按照一定的规律传递给位置变量apos
    gl.vertexAttribPointer(aposLocation, 3, gl.FLOAT, false, 0, 0);
    //允许数据传递
    gl.enableVertexAttribArray(aposLocation);
*/
bindingStates = new WebGLBindingStates(_gl, attributes);

// 初始化 WebGL 几何体  
// 主要处理attributes里面的属性，并释放bindingStates的内存
geometries = new WebGLGeometries(_gl, attributes, info, bindingStates);
```
# 2. 源码解析
```js
import { Uint16BufferAttribute, Uint32BufferAttribute } from '../../core/BufferAttribute.js';
import { arrayNeedsUint32 } from '../../utils.js';

/**
 * WebGLGeometries 类，用于处理 WebGL 中的几何体对象。
 *
 * @param {WebGLRenderingContext} gl - WebGL 渲染上下文对象。
 * @param {Object} attributes - 缓存属性对象。
 * @param {Object} info - 存储内存信息的对象。
 * @param {WebGLBindingStates} bindingStates - WebGL 绑定状态对象。
 * @returns {Object} - 包含 get、update、getWireframeAttribute 方法的对象。
 */
function WebGLGeometries( gl, attributes, info, bindingStates ) {

	const geometries = {};
	const wireframeAttributes = new WeakMap();

	/**
	 * 当几何体被销毁时触发此函数
	 *
	 * @param event 事件对象
	 */
	function onGeometryDispose( event ) {
		// 获取被销毁的几何体
		const geometry = event.target;
		// 如果几何体有索引，则移除对应的属性
		if ( geometry.index !== null ) {
			attributes.remove( geometry.index );
		}
		// 遍历几何体的所有属性，并移除它们
		for ( const name in geometry.attributes ) {
			attributes.remove( geometry.attributes[ name ] );
		}
		// 遍历几何体的所有变形属性
		for ( const name in geometry.morphAttributes ) {
			// 获取变形属性的数组
			const array = geometry.morphAttributes[ name ];
			// 遍历数组中的每个元素，并移除对应的属性
			for ( let i = 0, l = array.length; i < l; i ++ ) {
				attributes.remove( array[ i ] );
			}
		}
		// 移除几何体的销毁事件监听器
		geometry.removeEventListener( 'dispose', onGeometryDispose );
		// 从几何体集合中删除该几何体
		delete geometries[ geometry.id ];
		// 获取几何体的线框属性
		const attribute = wireframeAttributes.get( geometry );
		// 如果存在线框属性，则移除它，并从线框属性集合中删除该几何体
		if ( attribute ) {
			attributes.remove( attribute );
			wireframeAttributes.delete( geometry );
		}
		// 释放几何体的状态
		bindingStates.releaseStatesOfGeometry( geometry );
		// 如果几何体是实例化缓冲几何体，则删除其最大实例数量属性
		if ( geometry.isInstancedBufferGeometry === true ) {
			delete geometry._maxInstanceCount;
		}
		// 减少内存中的几何体数量
		info.memory.geometries --;
	}
	function get( object, geometry ) {
		if ( geometries[ geometry.id ] === true ) return geometry;
		geometry.addEventListener( 'dispose', onGeometryDispose );
		geometries[ geometry.id ] = true;
		info.memory.geometries ++;
		return geometry;
	}
	/**
	 * 更新几何体的属性数据
	 *
	 * @param geometry 几何体对象
	 * @returns 无返回值
	 */
	function update( geometry ) {
		const geometryAttributes = geometry.attributes;
		// Updating index buffer in VAO now. See WebGLBindingStates.
		for ( const name in geometryAttributes ) {
			attributes.update( geometryAttributes[ name ], gl.ARRAY_BUFFER );
		}
		// morph targets
		const morphAttributes = geometry.morphAttributes;
		for ( const name in morphAttributes ) {
			const array = morphAttributes[ name ];
			for ( let i = 0, l = array.length; i < l; i ++ ) {
				attributes.update( array[ i ], gl.ARRAY_BUFFER );
			}
		}
	}
	/**
	 * 更新线框属性
	 *
	 * @param geometry 几何体对象
	 * @returns 无返回值
	 */
	function updateWireframeAttribute( geometry ) {
		// 存储线框的索引数组
		const indices = [];
		// 获取几何体的索引属性
		const geometryIndex = geometry.index;
		// 获取几何体的位置属性
		const geometryPosition = geometry.attributes.position;
		// 初始化版本号为0
		let version = 0;
		// 如果几何体有索引属性
		if ( geometryIndex !== null ) {
			// 获取索引数组
			const array = geometryIndex.array;
			// 获取版本号
			version = geometryIndex.version;
			// 遍历索引数组，每3个元素为一组
			for ( let i = 0, l = array.length; i < l; i += 3 ) {
				// 获取当前组的三个索引值
				const a = array[ i + 0 ];
				const b = array[ i + 1 ];
				const c = array[ i + 2 ];
				// 将索引值按线框的顺序添加到indices数组中
				indices.push( a, b, b, c, c, a );
			}
		// 如果几何体没有索引属性但有位置属性
		} else if ( geometryPosition !== undefined ) {
			// 获取位置数组
			const array = geometryPosition.array;
			// 获取版本号
			version = geometryPosition.version;
			// 遍历位置数组，每3个元素为一组
			for ( let i = 0, l = ( array.length / 3 ) - 1; i < l; i += 3 ) {
				// 获取当前组的三个位置索引值
				const a = i + 0;
				const b = i + 1;
				const c = i + 2;
				// 将索引值按线框的顺序添加到indices数组中
				indices.push( a, b, b, c, c, a );
			}
		// 如果几何体既没有索引属性也没有位置属性，则直接返回
		} else {
			return;
		}
		// 根据indices数组的长度选择使用Uint32BufferAttribute还是Uint16BufferAttribute创建新的属性
		const attribute = new ( arrayNeedsUint32( indices ) ? Uint32BufferAttribute : Uint16BufferAttribute )( indices, 1 );
		// 设置属性的版本号
		attribute.version = version;
		// 更新VAO中的索引缓冲区。参考WebGLBindingStates
		// Updating index buffer in VAO now. See WebGLBindingStates
		// 获取之前存储的几何体的线框属性
		const previousAttribute = wireframeAttributes.get( geometry );
		// 如果存在之前的线框属性，则从attributes中移除
		if ( previousAttribute ) attributes.remove( previousAttribute );
		// 将新的线框属性存储到wireframeAttributes中
		wireframeAttributes.set( geometry, attribute );
	}
	/**
	 * 获取线框属性
	 *
	 * @param geometry 几何体对象
	 * @returns 返回线框属性
	 */
	function getWireframeAttribute( geometry ) {
		// 获取当前几何体的线框属性
		const currentAttribute = wireframeAttributes.get( geometry );
		if ( currentAttribute ) {
			// 获取几何体的索引
			const geometryIndex = geometry.index;
			if ( geometryIndex !== null ) {
				// 如果属性已过时，则创建一个新的属性
				// if the attribute is obsolete, create a new one
				if ( currentAttribute.version < geometryIndex.version ) {
					// 更新线框属性
					updateWireframeAttribute( geometry );
				}
			}
		} else {
			// 如果当前几何体没有线框属性，则创建一个新的属性
			updateWireframeAttribute( geometry );
		}
		// 返回几何体的线框属性
		return wireframeAttributes.get( geometry );
	}
	return {
		get: get,
		update: update,
		getWireframeAttribute: getWireframeAttribute
	};
}
export { WebGLGeometries };
```