# 1. 初始化 WebGL 渲染列表
```js
// 初始化 WebGL 渲染列表 存储渲染数据用的
renderLists = new WebGLRenderLists();
```
# 2. WebGLRenderLists源码解析
```js
/**
 * WebGL渲染列表类
 * 用于创建并管理WebGL渲染列表
 *
 * @class WebGLRenderLists
 */
function WebGLRenderLists() {
	// 创建一个WeakMap实例，用于存储场景与渲染列表数组的映射关系
	let lists = new WeakMap();
	// 获取指定场景和渲染调用深度的渲染列表
	function get( scene, renderCallDepth ) {
		// 获取指定场景的渲染列表数组
		const listArray = lists.get( scene );
		let list;
		// 如果渲染列表数组为空（即未定义）
		if ( listArray === undefined ) {
			// 创建一个新的WebGLRenderList实例
			list = new WebGLRenderList();
			// 将新创建的渲染列表放入场景对应的渲染列表数组中
			lists.set( scene, [ list ] );
		// 如果渲染列表数组不为空
		} else {
			// 如果渲染调用深度大于等于渲染列表数组的长度
			if ( renderCallDepth >= listArray.length ) {
				// 创建一个新的WebGLRenderList实例
				list = new WebGLRenderList();
				// 将新创建的渲染列表添加到渲染列表数组的末尾
				listArray.push( list );
			// 如果渲染调用深度小于渲染列表数组的长度
			} else {
				// 直接获取渲染列表数组中对应渲染调用深度的渲染列表
				list = listArray[ renderCallDepth ];
			}
		}
		// 返回渲染列表
		return list;
	}

	// 销毁WebGLRenderLists实例，清除存储的渲染列表数组
	function dispose() {
		lists = new WeakMap();
	}
	// 返回包含get和dispose方法的对象
	return {
		get: get,
		dispose: dispose
	};
}
```
# 3. WebGLRenderList源码解析
```js
/**
 * WebGL渲染列表
 *
 * @class WebGLRenderList
 * @description WebGL渲染列表类，用于管理不同渲染顺序的渲染项
 */
function WebGLRenderList() {
	const renderItems = [];
	let renderItemsIndex = 0;
	// 不透明渲染列表
	const opaque = [];
	// 半透明渲染列表
	const transmissive = [];
	// 透明渲染列表
	const transparent = [];

	/**
	 * 初始化函数
	 *
	 * @description 清除相关数组并重置索引值
	 */
	function init() {
		renderItemsIndex = 0;
		opaque.length = 0;
		transmissive.length = 0;
		transparent.length = 0;
	}

	/**
	 * 获取下一个渲染项
	 *
	 * @param object 渲染项对应的对象
	 * @param geometry 渲染项对应的几何体
	 * @param material 渲染项对应的材质
	 * @param groupOrder 渲染项所在的组顺序
	 * @param z 渲染项的z值
	 * @param group 渲染项所在的组
	 * @returns 下一个渲染项
	 */
	function getNextRenderItem( object, geometry, material, groupOrder, z, group ) {
		let renderItem = renderItems[ renderItemsIndex ];
		if ( renderItem === undefined ) {
			renderItem = {
				id: object.id,
				object: object,
				geometry: geometry,
				material: material,
				groupOrder: groupOrder,
				renderOrder: object.renderOrder,
				z: z,
				group: group
			};
			renderItems[ renderItemsIndex ] = renderItem;
		} else {
			renderItem.id = object.id;
			renderItem.object = object;
			renderItem.geometry = geometry;
			renderItem.material = material;
			renderItem.groupOrder = groupOrder;
			renderItem.renderOrder = object.renderOrder;
			renderItem.z = z;
			renderItem.group = group;
		}
		renderItemsIndex ++;
		return renderItem;
	}

	/**
	 * 将渲染项添加到相应的数组中
	 *
	 * @param object 对象
	 * @param geometry 几何体
	 * @param material 材质
	 * @param groupOrder 组顺序
	 * @param z z轴位置
	 * @param group 组
	 */
	function push( object, geometry, material, groupOrder, z, group ) {
		const renderItem = getNextRenderItem( object, geometry, material, groupOrder, z, group );
		if ( material.transmission > 0.0 ) {
			transmissive.push( renderItem );
		} else if ( material.transparent === true ) {
			transparent.push( renderItem );
		} else {
			opaque.push( renderItem );
		}
	}

	/**
	 * 在指定数组中插入一个渲染项
	 *
	 * @param object 对象
	 * @param geometry 几何体
	 * @param material 材质
	 * @param groupOrder 组顺序
	 * @param z Z轴位置
	 * @param group 组
	 */
	function unshift( object, geometry, material, groupOrder, z, group ) {
		const renderItem = getNextRenderItem( object, geometry, material, groupOrder, z, group );
		if ( material.transmission > 0.0 ) {
			transmissive.unshift( renderItem );
		} else if ( material.transparent === true ) {
			transparent.unshift( renderItem );
		} else {
			opaque.unshift( renderItem );
		}
	}
	/**
	 * 对数组进行排序
	 *
	 * @param customOpaqueSort 自定义不透明排序函数，可选
	 * @param customTransparentSort 自定义透明排序函数，可选
	 */
	function sort( customOpaqueSort, customTransparentSort ) {
		if ( opaque.length > 1 ) opaque.sort( customOpaqueSort || painterSortStable );
		if ( transmissive.length > 1 ) transmissive.sort( customTransparentSort || reversePainterSortStable );
		if ( transparent.length > 1 ) transparent.sort( customTransparentSort || reversePainterSortStable );
	}

	/**
	 * 清理列表中不活动的渲染项的引用
	 */
	function finish() {
		// Clear references from inactive renderItems in the list
		for ( let i = renderItemsIndex, il = renderItems.length; i < il; i ++ ) {
			const renderItem = renderItems[ i ];
			if ( renderItem.id === null ) break;
			renderItem.id = null;
			renderItem.object = null;
			renderItem.geometry = null;
			renderItem.material = null;
			renderItem.group = null;
		}
	}
	return {
		opaque: opaque,
		transmissive: transmissive,
		transparent: transparent,
		init: init,
		push: push,
		unshift: unshift,
		finish: finish,
		sort: sort
	};
}
```