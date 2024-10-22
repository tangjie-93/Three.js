# 1.  初始化 WebGL 缓冲区渲染器
```js
// 初始化 WebGL 缓冲区渲染器 主要执行 gl.drawArrays( mode, start, count )和gl.drawArraysInstanced( mode, start, count, primcount );
bufferRenderer = new WebGLBufferRenderer(_gl, extensions, info);
```
# 2. WebGLBufferRenderer 源码解析
```js
/**
 * WebGL 缓冲渲染器类
 *
 * @param {WebGLRenderingContext} gl - WebGL 渲染上下文
 * @param {Object} extensions - WebGL 扩展对象
 * @param {Object} info - 渲染信息对象
 */
function WebGLBufferRenderer( gl, extensions, info ) {

	let mode;
	/**
	 * 设置模式
	 *
	 * @param value 模式值
	 * @returns 无返回值
	 */
	function setMode( value ) {
		mode = value;
	}

	/**
	 * 渲染函数
	 *
	 * @param start 起始索引
	 * @param count 渲染的元素数量
	 */
	function render( start, count ) {
		gl.drawArrays( mode, start, count );
		info.update( count, mode, 1 );
	}

	/**
	 * 渲染实例
	 *
	 * @param start 起始位置
	 * @param count 渲染数量
	 * @param primcount 实例数量
	 * @returns 无返回值
	 */
	function renderInstances( start, count, primcount ) {
		if ( primcount === 0 ) return;
		gl.drawArraysInstanced( mode, start, count, primcount );
		info.update( count, mode, primcount );
	}
	/**
	 * 渲染多个绘制实例
	 *
	 * @param starts 绘制实例的起始位置数组
	 * @param counts 绘制实例的顶点数数组
	 * @param drawCount 绘制实例的数量
	 * @param primcount 每个绘制实例的绘制数量数组
	 * @returns 无返回值
	 */
	function renderMultiDraw( starts, counts, drawCount ) {
		if ( drawCount === 0 ) return;
		const extension = extensions.get( 'WEBGL_multi_draw' );
		extension.multiDrawArraysWEBGL( mode, starts, 0, counts, 0, drawCount );
		let elementCount = 0;
		for ( let i = 0; i < drawCount; i ++ ) {
			elementCount += counts[ i ];
		}
		info.update( elementCount, mode, 1 );

	}

	/**
	 * 渲染多个绘制实例
	 *
	 * @param starts 起始索引数组
	 * @param counts 绘制数量数组
	 * @param drawCount 绘制实例数量
	 * @param primcount 每个实例的基元数量数组
	 * @returns 无返回值
	 */
	function renderMultiDrawInstances( starts, counts, drawCount, primcount ) {
		if ( drawCount === 0 ) return;
		const extension = extensions.get( 'WEBGL_multi_draw' );
		if ( extension === null ) {
			for ( let i = 0; i < starts.length; i ++ ) {
				renderInstances( starts[ i ], counts[ i ], primcount[ i ] );
			}
		} else {
			extension.multiDrawArraysInstancedWEBGL( mode, starts, 0, counts, 0, primcount, 0, drawCount );
			let elementCount = 0;
			for ( let i = 0; i < drawCount; i ++ ) {
				elementCount += counts[ i ];
			}
			for ( let i = 0; i < primcount.length; i ++ ) {
				info.update( elementCount, mode, primcount[ i ] );
			}
		}
	}

	this.setMode = setMode;
	this.render = render;
	this.renderInstances = renderInstances;
	this.renderMultiDraw = renderMultiDraw;
	this.renderMultiDrawInstances = renderMultiDrawInstances;
}
export { WebGLBufferRenderer };
```