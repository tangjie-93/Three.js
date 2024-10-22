# 1. 初始化 WebGL 信息
主要用于统计在渲染过程中内存的使用情况和渲染次数以及类型的数量。
```js
// 初始化 WebGL 信息 如调用次数、点线面的数量，几何图形的数量，纹理的数量
info = new WebGLInfo(_gl);
```

* WebGLInfo源码解读
```js
/**
 * WebGLInfo 类，用于记录 WebGL 渲染信息
 *
 * @param {WebGLRenderingContext} gl - WebGL 渲染上下文
 * @returns {Object} 包含 WebGL 渲染信息的对象
 */
function WebGLInfo( gl ) {
	// 存储内存使用情况的对象
	const memory = {
		geometries: 0,
		textures: 0
	};
	// 存储渲染情况的对象
	const render = {
		frame: 0,
		calls: 0,
		triangles: 0,
		points: 0,
		lines: 0
	};
	// 更新渲染统计信息的函数
	function update( count, mode, instanceCount ) {
		// 增加渲染调用次数
		render.calls ++;
		// 根据不同的渲染模式更新对应的统计信息
		switch ( mode ) {
			case gl.TRIANGLES:
				// 更新三角形的数量
				render.triangles += instanceCount * ( count / 3 );
				break;
			case gl.LINES:
				// 更新线的数量
				render.lines += instanceCount * ( count / 2 );
				break;
			case gl.LINE_STRIP:
				// 更新线段的数量（线带）
				render.lines += instanceCount * ( count - 1 );
				break;
			case gl.LINE_LOOP:
				// 更新线的数量（线环）
				render.lines += instanceCount * count;
				break;
			case gl.POINTS:
				// 更新点的数量
				render.points += instanceCount * count;
				break;
			default:
				// 未知的渲染模式，打印错误信息
				console.error( 'THREE.WebGLInfo: Unknown draw mode:', mode );
				break;
		}
	}
	// 重置渲染统计信息的函数
	function reset() {
		// 重置渲染调用次数、三角形数量、点数量和线数量
		render.calls = 0;
		render.triangles = 0;
		render.points = 0;
		render.lines = 0;
	}
	// 返回包含内存使用情况、渲染统计信息、程序对象、自动重置标志、重置函数和更新函数的对象
	return {
		memory: memory,
		render: render,
		programs: null,
		autoReset: true,
		reset: reset,
		update: update
	};
}
export { WebGLInfo };
```