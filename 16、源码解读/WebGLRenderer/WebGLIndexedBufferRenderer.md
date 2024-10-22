# 1. 初始化 WebGL 索引缓冲区渲染器
```js
// 初始化 WebGL 索引缓冲区渲染器 主要执行 gl.drawElements( mode, count, type, start * bytesPerElement )和gl.drawElementsInstanced( mode, count, type, start * bytesPerElement, primcount );
indexedBufferRenderer = new WebGLIndexedBufferRenderer(_gl, extensions, info);
```
# 2. WebGLIndexedBufferRenderer源码解析
```js
/**
 * WebGLIndexedBufferRenderer 构造函数，用于WebGL的索引缓冲区渲染。
 *
 * @param {WebGLRenderingContext} gl - WebGL渲染上下文。
 * @param {WebGLExtensions} extensions - WebGL扩展集合。
 * @param {WebGLInfo} info - WebGL信息统计对象。
 */
function WebGLIndexedBufferRenderer( gl, extensions, info ) {

	// 渲染模式
	let mode;

	function setMode( value ) {
		// 设置渲染模式
		mode = value;
	}

	// 索引类型及每个元素的字节数
	let type, bytesPerElement;

	/**
	 * 设置索引类型及每个元素的字节数
	 *
	 * @param value 包含索引类型及每个元素字节数的对象
	 * @param value.type 索引类型
	 * @param value.bytesPerElement 每个元素的字节数
	 */
	function setIndex( value ) {
		// 设置索引类型及每个元素的字节数
		type = value.type;
		bytesPerElement = value.bytesPerElement;
	}

	/**
	 * 绘制图形
	 *
	 * @param start 起始偏移量
	 * @param count 元素计数
	 * @returns 无返回值
	 */
	function render( start, count ) {
		// 使用给定的渲染模式、元素计数、索引类型和起始偏移绘制图形
		gl.drawElements( mode, count, type, start * bytesPerElement );

		// 更新渲染信息
		info.update( count, mode, 1 );
	}

	/**
	 * 渲染实例
	 *
	 * @param start 起始偏移
	 * @param count 元素计数
	 * @param primcount 实例计数
	 * @returns 无返回值
	 */
	function renderInstances( start, count, primcount ) {
		// 如果实例计数为0，则直接返回
		if ( primcount === 0 ) return;
		// 使用给定的渲染模式、元素计数、索引类型、起始偏移和实例计数绘制多个实例
		gl.drawElementsInstanced( mode, count, type, start * bytesPerElement, primcount );
		// 更新渲染信息
		info.update( count, mode, primcount );
	}
	/**
	 * 绘制多个图形
	 *
	 * @param starts 起始位置数组
	 * @param counts 每个图形绘制的元素数量数组
	 * @param drawCount 绘制次数
	 * @returns 无返回值
	 */
	function renderMultiDraw( starts, counts, drawCount ) {
		// 如果绘制次数为0，则直接返回
		if ( drawCount === 0 ) return;
		// 获取多绘制扩展
		const extension = extensions.get( 'WEBGL_multi_draw' );
		// 使用多绘制扩展绘制多个图形
		extension.multiDrawElementsWEBGL( mode, counts, 0, type, starts, 0, drawCount );
		let elementCount = 0;
		// 计算总元素数量
		for ( let i = 0; i < drawCount; i ++ ) {
			elementCount += counts[ i ];
		}
		// 更新渲染信息
		info.update( elementCount, mode, 1 )
	}

	/**
	 * 渲染多个绘制实例
	 *
	 * @param starts 绘制实例的起始位置数组
	 * @param counts 绘制实例的绘制次数数组
	 * @param drawCount 绘制实例的总数
	 * @param primcount 每个绘制实例的基元数量数组
	 */
	function renderMultiDrawInstances( starts, counts, drawCount, primcount ) {
		// 如果绘制次数为0，则直接返回
		if ( drawCount === 0 ) return;
		// 获取多绘制扩展
		const extension = extensions.get( 'WEBGL_multi_draw' );
		// 如果扩展不存在，则逐个绘制实例
		if ( extension === null ) {
			for ( let i = 0; i < starts.length; i ++ ) {
				renderInstances( starts[ i ] / bytesPerElement, counts[ i ], primcount[ i ] );
			}
		} else {
			// 使用多绘制扩展绘制多个实例
			extension.multiDrawElementsInstancedWEBGL( mode, counts, 0, type, starts, 0, primcount, 0, drawCount );
			let elementCount = 0;
			// 计算总元素数量
			for ( let i = 0; i < drawCount; i ++ ) {
				elementCount += counts[ i ];
			}
			// 更新渲染信息
			for ( let i = 0; i < primcount.length; i ++ ) {
				info.update( elementCount, mode, primcount[ i ] );
			}
		}
	}
	// 公开方法
	this.setMode = setMode;
	this.setIndex = setIndex;
	this.render = render;
	this.renderInstances = renderInstances;
	this.renderMultiDraw = renderMultiDraw;
	this.renderMultiDrawInstances = renderMultiDrawInstances;
}
export { WebGLIndexedBufferRenderer };
```