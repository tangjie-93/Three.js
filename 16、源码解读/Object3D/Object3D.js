import { Quaternion } from '../math/Quaternion.js';
import { Vector3 } from '../math/Vector3.js';
import { Matrix4 } from '../math/Matrix4.js';
import { EventDispatcher } from './EventDispatcher.js';
import { Euler } from '../math/Euler.js';
import { Layers } from './Layers.js';
import { Matrix3 } from '../math/Matrix3.js';
import * as MathUtils from '../math/MathUtils.js';

let _object3DId = 0;

const _v1 = /*@__PURE__*/ new Vector3();
const _q1 = /*@__PURE__*/ new Quaternion();
const _m1 = /*@__PURE__*/ new Matrix4();
const _target = /*@__PURE__*/ new Vector3();

const _position = /*@__PURE__*/ new Vector3();
const _scale = /*@__PURE__*/ new Vector3();
const _quaternion = /*@__PURE__*/ new Quaternion();

const _xAxis = /*@__PURE__*/ new Vector3(1, 0, 0);
const _yAxis = /*@__PURE__*/ new Vector3(0, 1, 0);
const _zAxis = /*@__PURE__*/ new Vector3(0, 0, 1);

const _addedEvent = { type: 'added' };
const _removedEvent = { type: 'removed' };

const _childaddedEvent = { type: 'childadded', child: null };
const _childremovedEvent = { type: 'childremoved', child: null };

class Object3D extends EventDispatcher {

	/**
	 * Object3D 构造函数
	 * 创建一个新的 Object3D 实例
	 */
	constructor() {

		super();
		// 标记该对象是否为3D对象
		this.isObject3D = true;

		// 为该对象设置唯一ID
		Object.defineProperty(this, 'id', { value: _object3DId++ });

		// 生成UUID作为该对象的唯一标识符
		this.uuid = MathUtils.generateUUID();

		// 初始化对象名称和类型
		this.name = '';
		this.type = 'Object3D';

		// 初始化父对象和子对象数组
		this.parent = null;
		this.children = [];

		// 初始化向上方向，默认为Object3D.DEFAULT_UP
		this.up = Object3D.DEFAULT_UP.clone();

		// 创建位置、旋转、四元数和缩放向量
		const position = new Vector3();
		const rotation = new Euler();
		const quaternion = new Quaternion();
		const scale = new Vector3(1, 1, 1);

		// 旋转变化时的回调函数
		function onRotationChange() {
			quaternion.setFromEuler(rotation, false);
		}

		// 四元数变化时的回调函数
		function onQuaternionChange() {
			rotation.setFromQuaternion(quaternion, undefined, false);
		}

		// 监听旋转和四元数的变化，并调用相应的回调函数
		rotation._onChange(onRotationChange);
		quaternion._onChange(onQuaternionChange);

		// 定义对象的属性，并设置其配置
		Object.defineProperties(this, {
			position: {
				configurable: true,
				enumerable: true,
				value: position
			},
			rotation: {
				configurable: true,
				enumerable: true,
				value: rotation
			},
			quaternion: {
				configurable: true,
				enumerable: true,
				value: quaternion
			},
			scale: {
				configurable: true,
				enumerable: true,
				value: scale
			},
			modelViewMatrix: {
				value: new Matrix4()
			},
			normalMatrix: {
				value: new Matrix3()
			}
		});

		// 创建矩阵对象
		this.matrix = new Matrix4();
		this.matrixWorld = new Matrix4();

		// 设置矩阵是否自动更新的默认值
		this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;

		// 设置世界矩阵是否自动更新的默认值，由渲染器检查
		this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE; // checked by the renderer
		this.matrixWorldNeedsUpdate = false;

		// 初始化图层和可见性
		this.layers = new Layers();
		this.visible = true;

		// 设置是否投射和接收阴影
		this.castShadow = false;
		this.receiveShadow = false;

		// 设置对象是否进行视锥体裁剪和渲染

		this.frustumCulled = true;
		this.renderOrder = 0;

		this.animations = [];

		this.userData = {};

	}

	onBeforeShadow( /* renderer, object, camera, shadowCamera, geometry, depthMaterial, group */) { }

	onAfterShadow( /* renderer, object, camera, shadowCamera, geometry, depthMaterial, group */) { }

	onBeforeRender( /* renderer, scene, camera, geometry, material, group */) { }

	onAfterRender( /* renderer, scene, camera, geometry, material, group */) { }

	/**
	 * 应用一个4x4矩阵到当前对象上
	 *
	 * @param matrix 传入需要应用的4x4矩阵
	 */
	applyMatrix4(matrix) {

		// 如果自动更新矩阵标志为true，则更新矩阵
		if (this.matrixAutoUpdate) this.updateMatrix();

		// 将传入的矩阵与当前矩阵进行预乘操作
		this.matrix.premultiply(matrix);

		// 将预乘后的矩阵分解为位置、四元数和缩放值
		this.matrix.decompose(this.position, this.quaternion, this.scale);

	}

	/**
	 * 将传入的四元数 q 与当前对象的四元数相乘，并将结果赋值给当前对象的四元数
	 *
	 * @param q 要进行乘法的四元数
	 * @returns 当前对象
	 */
	applyQuaternion(q) {
		// 将传入的四元数 q 与当前对象的四元数相乘，结果赋值给当前对象的四元数
		this.quaternion.premultiply(q);

		// 返回当前对象
		return this;
	}

	/**
	 * 根据给定的轴和角度设置旋转。
	 *
	 * @param axis 轴向量，假设已标准化。
	 * @param angle 旋转角度，以弧度为单位。
	 */
	setRotationFromAxisAngle(axis, angle) {

		// assumes axis is normalized

		this.quaternion.setFromAxisAngle(axis, angle);

	}

	/**
	 * 从欧拉角设置旋转
	 *
	 * @param euler 欧拉角数组，包含三个元素，分别对应x、y、z轴上的旋转角度
	 * @returns 无返回值
	 */
	setRotationFromEuler(euler) {

		this.quaternion.setFromEuler(euler, true);

	}

	/**
	 * 根据给定的旋转矩阵设置物体的四元数。
	 *
	 * @param m 一个纯旋转矩阵，假设其上部的3x3为纯旋转矩阵（即未经缩放）。
	 */
	setRotationFromMatrix(m) {

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		this.quaternion.setFromRotationMatrix(m);

	}

	/**
	 * 从四元数设置旋转
	 *
	 * @param q 四元数对象
	 */
	setRotationFromQuaternion(q) {

		// assumes q is normalized

		this.quaternion.copy(q);

	}

	/**
	 * 在对象空间内绕指定轴旋转对象
	 *
	 * @param axis 旋转轴，假设已归一化
	 * @param angle 旋转角度
	 * @returns 返回当前对象，方便链式调用
	 */
	rotateOnAxis(axis, angle) {

		// rotate object on axis in object space
		// axis is assumed to be normalized

		_q1.setFromAxisAngle(axis, angle);

		this.quaternion.multiply(_q1);

		return this;

	}

	/**
	 * 在世界空间中的轴上旋转对象
	 *
	 * @param axis 轴向量，假定已归一化
	 * @param angle 旋转角度，以弧度为单位
	 * @returns 返回当前对象
	 */
	rotateOnWorldAxis(axis, angle) {

		// 在世界空间中根据指定的轴进行旋转
		// 假设axis已经被单位化
		// 此方法假设没有旋转的父对象
		_q1.setFromAxisAngle(axis, angle);

		// 将_q1的四元数与当前对象的四元数相乘
		this.quaternion.premultiply(_q1);

		return this;

	}

	rotateX(angle) {

		return this.rotateOnAxis(_xAxis, angle);

	}

	rotateY(angle) {

		return this.rotateOnAxis(_yAxis, angle);

	}

	rotateZ(angle) {

		return this.rotateOnAxis(_zAxis, angle);

	}

	/**
	 * 沿着轴在对象空间中移动对象一定距离
	 *
	 * @param axis 轴向量，假设已经标准化
	 * @param distance 移动的距离
	 * @returns 返回当前对象
	 */
	translateOnAxis(axis, distance) {

		// translate object by distance along axis in object space
		// axis is assumed to be normalized

		_v1.copy(axis).applyQuaternion(this.quaternion);

		this.position.add(_v1.multiplyScalar(distance));

		return this;

	}

	translateX(distance) {

		return this.translateOnAxis(_xAxis, distance);

	}

	translateY(distance) {

		return this.translateOnAxis(_yAxis, distance);

	}

	translateZ(distance) {

		return this.translateOnAxis(_zAxis, distance);

	}

	/**
	 * 将局部坐标向量转换为世界坐标向量
	 *
	 * @param vector 局部坐标向量
	 * @returns 世界坐标向量
	 */
	localToWorld(vector) {

		this.updateWorldMatrix(true, false);

		return vector.applyMatrix4(this.matrixWorld);

	}

	/**
	 * 将世界坐标系的向量转换为局部坐标系的向量
	 *
	 * @param vector 世界坐标系下的向量
	 * @returns 局部坐标系下的向量
	 */
	worldToLocal(vector) {

		this.updateWorldMatrix(true, false);

		return vector.applyMatrix4(_m1.copy(this.matrixWorld).invert());

	}

	/**
	 * 使物体朝向指定的坐标点
	 *
	 * @param x 目标坐标点的x坐标或三维向量对象
	 * @param y 目标坐标点的y坐标（当x为三维向量对象时，此参数无效）
	 * @param z 目标坐标点的z坐标（当x为三维向量对象时，此参数无效）
	 * @returns 无返回值
	 * @note 此方法不支持具有非均匀缩放父对象的物体
	 */
	lookAt(x, y, z) {

		// This method does not support objects having non-uniformly-scaled parent(s)

		if (x.isVector3) {

			_target.copy(x);

		} else {

			_target.set(x, y, z);

		}

		const parent = this.parent;

		this.updateWorldMatrix(true, false);

		_position.setFromMatrixPosition(this.matrixWorld);

		if (this.isCamera || this.isLight) {

			_m1.lookAt(_position, _target, this.up);

		} else {

			_m1.lookAt(_target, _position, this.up);

		}

		this.quaternion.setFromRotationMatrix(_m1);

		if (parent) {

			_m1.extractRotation(parent.matrixWorld);
			_q1.setFromRotationMatrix(_m1);
			this.quaternion.premultiply(_q1.invert());

		}

	}

	add(object) {

		if (arguments.length > 1) {

			for (let i = 0; i < arguments.length; i++) {

				this.add(arguments[i]);

			}

			return this;

		}

		if (object === this) {

			console.error('THREE.Object3D.add: object can\'t be added as a child of itself.', object);
			return this;

		}

		if (object && object.isObject3D) {

			object.removeFromParent();
			object.parent = this;
			this.children.push(object);

			object.dispatchEvent(_addedEvent);

			_childaddedEvent.child = object;
			this.dispatchEvent(_childaddedEvent);
			_childaddedEvent.child = null;

		} else {

			console.error('THREE.Object3D.add: object not an instance of THREE.Object3D.', object);

		}

		return this;

	}

	remove(object) {

		if (arguments.length > 1) {

			for (let i = 0; i < arguments.length; i++) {

				this.remove(arguments[i]);

			}

			return this;

		}

		const index = this.children.indexOf(object);

		if (index !== - 1) {

			object.parent = null;
			this.children.splice(index, 1);

			object.dispatchEvent(_removedEvent);

			_childremovedEvent.child = object;
			this.dispatchEvent(_childremovedEvent);
			_childremovedEvent.child = null;

		}

		return this;

	}

	removeFromParent() {

		const parent = this.parent;

		if (parent !== null) {

			parent.remove(this);

		}

		return this;

	}

	clear() {

		return this.remove(... this.children);

	}

	attach(object) {

		// adds object as a child of this, while maintaining the object's world transform

		// Note: This method does not support scene graphs having non-uniformly-scaled nodes(s)

		this.updateWorldMatrix(true, false);

		_m1.copy(this.matrixWorld).invert();

		if (object.parent !== null) {

			object.parent.updateWorldMatrix(true, false);

			_m1.multiply(object.parent.matrixWorld);

		}

		object.applyMatrix4(_m1);

		object.removeFromParent();
		object.parent = this;
		this.children.push(object);

		object.updateWorldMatrix(false, true);

		object.dispatchEvent(_addedEvent);

		_childaddedEvent.child = object;
		this.dispatchEvent(_childaddedEvent);
		_childaddedEvent.child = null;

		return this;

	}

	getObjectById(id) {

		return this.getObjectByProperty('id', id);

	}

	getObjectByName(name) {

		return this.getObjectByProperty('name', name);

	}

	getObjectByProperty(name, value) {

		if (this[name] === value) return this;

		for (let i = 0, l = this.children.length; i < l; i++) {

			const child = this.children[i];
			const object = child.getObjectByProperty(name, value);

			if (object !== undefined) {

				return object;

			}

		}

		return undefined;

	}

	getObjectsByProperty(name, value, result = []) {

		if (this[name] === value) result.push(this);

		const children = this.children;

		for (let i = 0, l = children.length; i < l; i++) {

			children[i].getObjectsByProperty(name, value, result);

		}

		return result;

	}

	getWorldPosition(target) {
		this.updateWorldMatrix(true, false);
		//从矩阵中获取世界坐标
		return target.setFromMatrixPosition(this.matrixWorld);

	}

	getWorldQuaternion(target) {

		this.updateWorldMatrix(true, false);

		this.matrixWorld.decompose(_position, target, _scale);

		return target;

	}

	/**
	 * 获取目标对象的缩放比例
	 *
	 * @param target 目标对象，用于存储返回的缩放比例
	 * @returns 返回目标对象的缩放比例
	 */
	getWorldScale(target) {

		this.updateWorldMatrix(true, false);

		this.matrixWorld.decompose(_position, _quaternion, target);

		return target;

	}

	/**
	 * 获取世界方向向量
	 *
	 * @param target 目标向量
	 * @returns 返回世界方向向量
	 */
	getWorldDirection(target) {

		this.updateWorldMatrix(true, false);

		const e = this.matrixWorld.elements;

		return target.set(e[8], e[9], e[10]).normalize();

	}

	raycast( /* raycaster, intersects */) { }

	traverse(callback) {

		callback(this);

		const children = this.children;

		for (let i = 0, l = children.length; i < l; i++) {

			children[i].traverse(callback);

		}

	}

	traverseVisible(callback) {

		if (this.visible === false) return;

		callback(this);

		const children = this.children;

		for (let i = 0, l = children.length; i < l; i++) {

			children[i].traverseVisible(callback);

		}

	}

	traverseAncestors(callback) {

		const parent = this.parent;

		if (parent !== null) {

			callback(parent);

			parent.traverseAncestors(callback);

		}

	}

	/**
	 * 更新矩阵
	 *
	 * 将位置、四元数和缩放组合成一个矩阵，并设置matrixWorld需要更新
	 */
	updateMatrix() {

		this.matrix.compose(this.position, this.quaternion, this.scale);

		this.matrixWorldNeedsUpdate = true;

	}

	/**
	 * 更新矩阵世界
	 *
	 * @param force 是否强制更新，默认为false
	 * @returns 无返回值
	 */
	updateMatrixWorld(force) {

		if (this.matrixAutoUpdate) this.updateMatrix();

		if (this.matrixWorldNeedsUpdate || force) {

			if (this.matrixWorldAutoUpdate === true) {

				if (this.parent === null) {

					this.matrixWorld.copy(this.matrix);

				} else {

					this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);

				}

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// make sure descendants are updated if required

		const children = this.children;

		for (let i = 0, l = children.length; i < l; i++) {

			const child = children[i];

			child.updateMatrixWorld(force);

		}

	}

	/**
	 * 更新当前对象的世界矩阵。
	 *
	 * @param updateParents 是否更新父级的世界矩阵。默认为 false。
	 * @param updateChildren 是否更新子对象的世界矩阵。默认为 false。
	 */
	updateWorldMatrix(updateParents, updateChildren) {

		const parent = this.parent;

		if (updateParents === true && parent !== null) {

			parent.updateWorldMatrix(true, false);

		}

		if (this.matrixAutoUpdate) this.updateMatrix();

		if (this.matrixWorldAutoUpdate === true) {

			if (this.parent === null) {

				this.matrixWorld.copy(this.matrix);

			} else {

				this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);

			}

		}

		// make sure descendants are updated

		if (updateChildren === true) {

			const children = this.children;

			for (let i = 0, l = children.length; i < l; i++) {

				const child = children[i];

				child.updateWorldMatrix(false, true);

			}

		}

	}

	toJSON(meta) {

		// meta is a string when called from JSON.stringify
		const isRootObject = (meta === undefined || typeof meta === 'string');

		const output = {};

		// meta is a hash used to collect geometries, materials.
		// not providing it implies that this is the root object
		// being serialized.
		if (isRootObject) {

			// initialize meta obj
			meta = {
				geometries: {},
				materials: {},
				textures: {},
				images: {},
				shapes: {},
				skeletons: {},
				animations: {},
				nodes: {}
			};

			output.metadata = {
				version: 4.6,
				type: 'Object',
				generator: 'Object3D.toJSON'
			};

		}

		// standard Object3D serialization

		const object = {};

		object.uuid = this.uuid;
		object.type = this.type;

		if (this.name !== '') object.name = this.name;
		if (this.castShadow === true) object.castShadow = true;
		if (this.receiveShadow === true) object.receiveShadow = true;
		if (this.visible === false) object.visible = false;
		if (this.frustumCulled === false) object.frustumCulled = false;
		if (this.renderOrder !== 0) object.renderOrder = this.renderOrder;
		if (Object.keys(this.userData).length > 0) object.userData = this.userData;

		object.layers = this.layers.mask;
		object.matrix = this.matrix.toArray();
		object.up = this.up.toArray();

		if (this.matrixAutoUpdate === false) object.matrixAutoUpdate = false;

		// object specific properties

		if (this.isInstancedMesh) {

			object.type = 'InstancedMesh';
			object.count = this.count;
			object.instanceMatrix = this.instanceMatrix.toJSON();
			if (this.instanceColor !== null) object.instanceColor = this.instanceColor.toJSON();

		}

		if (this.isBatchedMesh) {

			object.type = 'BatchedMesh';
			object.perObjectFrustumCulled = this.perObjectFrustumCulled;
			object.sortObjects = this.sortObjects;

			object.drawRanges = this._drawRanges;
			object.reservedRanges = this._reservedRanges;

			object.visibility = this._visibility;
			object.active = this._active;
			object.bounds = this._bounds.map(bound => ({
				boxInitialized: bound.boxInitialized,
				boxMin: bound.box.min.toArray(),
				boxMax: bound.box.max.toArray(),

				sphereInitialized: bound.sphereInitialized,
				sphereRadius: bound.sphere.radius,
				sphereCenter: bound.sphere.center.toArray()
			}));

			object.maxInstanceCount = this._maxInstanceCount;
			object.maxVertexCount = this._maxVertexCount;
			object.maxIndexCount = this._maxIndexCount;

			object.geometryInitialized = this._geometryInitialized;
			object.geometryCount = this._geometryCount;

			object.matricesTexture = this._matricesTexture.toJSON(meta);

			if (this._colorsTexture !== null) object.colorsTexture = this._colorsTexture.toJSON(meta);

			if (this.boundingSphere !== null) {

				object.boundingSphere = {
					center: object.boundingSphere.center.toArray(),
					radius: object.boundingSphere.radius
				};

			}

			if (this.boundingBox !== null) {

				object.boundingBox = {
					min: object.boundingBox.min.toArray(),
					max: object.boundingBox.max.toArray()
				};

			}

		}

		//

		function serialize(library, element) {

			if (library[element.uuid] === undefined) {

				library[element.uuid] = element.toJSON(meta);

			}

			return element.uuid;

		}

		if (this.isScene) {

			if (this.background) {

				if (this.background.isColor) {

					object.background = this.background.toJSON();

				} else if (this.background.isTexture) {

					object.background = this.background.toJSON(meta).uuid;

				}

			}

			if (this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== true) {

				object.environment = this.environment.toJSON(meta).uuid;

			}

		} else if (this.isMesh || this.isLine || this.isPoints) {

			object.geometry = serialize(meta.geometries, this.geometry);

			const parameters = this.geometry.parameters;

			if (parameters !== undefined && parameters.shapes !== undefined) {

				const shapes = parameters.shapes;

				if (Array.isArray(shapes)) {

					for (let i = 0, l = shapes.length; i < l; i++) {

						const shape = shapes[i];

						serialize(meta.shapes, shape);

					}

				} else {

					serialize(meta.shapes, shapes);

				}

			}

		}

		if (this.isSkinnedMesh) {

			object.bindMode = this.bindMode;
			object.bindMatrix = this.bindMatrix.toArray();

			if (this.skeleton !== undefined) {

				serialize(meta.skeletons, this.skeleton);

				object.skeleton = this.skeleton.uuid;

			}

		}

		if (this.material !== undefined) {

			if (Array.isArray(this.material)) {

				const uuids = [];

				for (let i = 0, l = this.material.length; i < l; i++) {

					uuids.push(serialize(meta.materials, this.material[i]));

				}

				object.material = uuids;

			} else {

				object.material = serialize(meta.materials, this.material);

			}

		}

		//

		if (this.children.length > 0) {

			object.children = [];

			for (let i = 0; i < this.children.length; i++) {

				object.children.push(this.children[i].toJSON(meta).object);

			}

		}

		//

		if (this.animations.length > 0) {

			object.animations = [];

			for (let i = 0; i < this.animations.length; i++) {

				const animation = this.animations[i];

				object.animations.push(serialize(meta.animations, animation));

			}

		}

		if (isRootObject) {

			const geometries = extractFromCache(meta.geometries);
			const materials = extractFromCache(meta.materials);
			const textures = extractFromCache(meta.textures);
			const images = extractFromCache(meta.images);
			const shapes = extractFromCache(meta.shapes);
			const skeletons = extractFromCache(meta.skeletons);
			const animations = extractFromCache(meta.animations);
			const nodes = extractFromCache(meta.nodes);

			if (geometries.length > 0) output.geometries = geometries;
			if (materials.length > 0) output.materials = materials;
			if (textures.length > 0) output.textures = textures;
			if (images.length > 0) output.images = images;
			if (shapes.length > 0) output.shapes = shapes;
			if (skeletons.length > 0) output.skeletons = skeletons;
			if (animations.length > 0) output.animations = animations;
			if (nodes.length > 0) output.nodes = nodes;

		}

		output.object = object;

		return output;

		// extract data from the cache hash
		// remove metadata on each item
		// and return as array
		function extractFromCache(cache) {

			const values = [];
			for (const key in cache) {

				const data = cache[key];
				delete data.metadata;
				values.push(data);

			}

			return values;

		}

	}

	clone(recursive) {

		return new this.constructor().copy(this, recursive);

	}

	copy(source, recursive = true) {

		this.name = source.name;

		this.up.copy(source.up);

		this.position.copy(source.position);
		this.rotation.order = source.rotation.order;
		this.quaternion.copy(source.quaternion);
		this.scale.copy(source.scale);

		this.matrix.copy(source.matrix);
		this.matrixWorld.copy(source.matrixWorld);

		this.matrixAutoUpdate = source.matrixAutoUpdate;

		this.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate;
		this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

		this.layers.mask = source.layers.mask;
		this.visible = source.visible;

		this.castShadow = source.castShadow;
		this.receiveShadow = source.receiveShadow;

		this.frustumCulled = source.frustumCulled;
		this.renderOrder = source.renderOrder;

		this.animations = source.animations.slice();

		this.userData = JSON.parse(JSON.stringify(source.userData));

		if (recursive === true) {

			for (let i = 0; i < source.children.length; i++) {

				const child = source.children[i];
				this.add(child.clone());

			}

		}

		return this;

	}

}

Object3D.DEFAULT_UP = /*@__PURE__*/ new Vector3(0, 1, 0);
Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true;
Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;

export { Object3D };
