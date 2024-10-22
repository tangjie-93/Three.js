# 1. 初始化 WebGL 渲染状态 
```js
// 初始化 WebGL 渲染状态 主要是处理跟光源相关的代码
renderStates = new WebGLRenderStates(extensions);
```
# 2. WebGLRenderStates 源码解析
```js
/**
 * @description
 * 创建一个WebGLRenderStates对象，用于管理场景的WebGL渲染状态。
 * 该对象包含两个方法：get和dispose。
 * get方法接收两个参数：scene（场景）和renderCallDepth（渲染调用深度），返回一个WebGLRenderState对象。
 * WebGLRenderState对象是一个WeakMap，用于存储场景的WebGL渲染状态。
 * 如果当前场景没有WebGL渲染状态，则会创建一个新的WebGLRenderState对象并将其添加到WeakMap中。
 * 如果当前场景已经有WebGL渲染状态，但是渲染调用深度超过了现有状态的长度，则会创建一个新的WebGLRenderState对象并将其添加到WeakMap中。
 * 否则，返回现有状态中对应的WebGLRenderState对象。
 * dispose方法用于释放WebGLRenderStates对象，重置所有WeakMap。
 *
 * @param {Object} extensions - WebGL扩展对象，包含常用的WebGL扩展，例如OES_texture_float、OES_element_index_uint等。
 * @returns {Object} 包含get和dispose两个方法的WebGLRenderStates对象。
 */
function WebGLRenderStates( extensions ) {
	// 创建一个WeakMap对象，用于存储场景与渲染状态数组的映射关系
	let renderStates = new WeakMap();
	// 获取指定场景的渲染状态
	function get( scene, renderCallDepth = 0 ) {
		// 从renderStates中获取场景对应的渲染状态数组
		const renderStateArray = renderStates.get( scene );
		let renderState;
		// 如果渲染状态数组不存在
		if ( renderStateArray === undefined ) {
			// 创建一个新的WebGLRenderState对象
			renderState = new WebGLRenderState( extensions );
			// 将新的WebGLRenderState对象存入renderStates中，以场景为键，渲染状态数组为值
			renderStates.set( scene, [ renderState ] );
		// 如果渲染状态数组存在
		} else {
			// 如果当前的渲染调用深度大于等于渲染状态数组的长度
			if ( renderCallDepth >= renderStateArray.length ) {
				// 创建一个新的WebGLRenderState对象
				renderState = new WebGLRenderState( extensions );
				// 将新的WebGLRenderState对象添加到渲染状态数组的末尾
				renderStateArray.push( renderState );
			// 如果当前的渲染调用深度小于渲染状态数组的长度
			} else {
				// 从渲染状态数组中获取指定深度的渲染状态
				renderState = renderStateArray[ renderCallDepth ];
			}
		}
		// 返回渲染状态
		return renderState;
	}
	// 销毁方法，清空renderStates
	function dispose() {
		renderStates = new WeakMap();
	}
	// 返回包含get和dispose方法的对象
	return {
		get: get,
		dispose: dispose
	};
}
export { WebGLRenderStates };
```
# 3. WebGLRenderState源码解析
```js
/**
 * WebGL渲染状态类
 *
 * @param extensions WebGL扩展对象
 * @returns 返回一个包含WebGL渲染状态相关方法和属性的对象
 */
function WebGLRenderState( extensions ) {
	const lights = new WebGLLights( extensions );
	const lightsArray = [];
	const shadowsArray = [];
	/**
	 * 初始化函数
	 *
	 * @param camera 相机对象
	 * @returns 无返回值
	 */
	function init( camera ) {
		state.camera = camera;
		lightsArray.length = 0;
		shadowsArray.length = 0;
	}

	/**
	 * 将灯光对象推入灯光数组
	 *
	 * @param light 灯光对象
	 */
	function pushLight( light ) {
		lightsArray.push( light );
	}

	/**
	 * 将阴影灯光对象推入阴影灯光数组
	 *
	 * @param shadowLight 阴影灯光对象
	 */
	function pushShadow( shadowLight ) {
		shadowsArray.push( shadowLight );
	}

	/**
	 * 设置灯光
	 *
	 * @description 根据传入的灯光数组，调用 lights.setup 方法进行灯光设置
	 *
	 * @param {Array} lightsArray 灯光数组
	 *
	 * @returns {void} 无返回值
	 */
	function setupLights() {
		lights.setup( lightsArray );
	}
	/**
	 * 设置灯光视图
	 *
	 * @param camera 相机对象
	 * @returns 无返回值
	 */
	function setupLightsView( camera ) {
		lights.setupView( lightsArray, camera );
	}
	const state = {
		lightsArray: lightsArray,
		shadowsArray: shadowsArray,
		camera: null,
		lights: lights,
		transmissionRenderTarget: {}
	};
	return {
		init: init,
		state: state,
		setupLights: setupLights,
		setupLightsView: setupLightsView,
		pushLight: pushLight,
		pushShadow: pushShadow
	};
}
```