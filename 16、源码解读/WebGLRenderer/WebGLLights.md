# 1. WebGLLights源码解析
该类主要有两个实例方法 `setup` 和 `setupView`，该类主要是统计光源的类型以及给光源赋值

## 1.1. setup源码解析
统计光源的类型和数量，并且判断是否有贴图，以及是否产生阴影，并赋值颜色、强度以及距离等属性。
```js
function setup( lights ) {
	let r = 0, g = 0, b = 0;

	for ( let i = 0; i < 9; i ++ ) state.probe[ i ].set( 0, 0, 0 );

	let directionalLength = 0;
	let pointLength = 0;
	let spotLength = 0;
	let rectAreaLength = 0;
	let hemiLength = 0;

	let numDirectionalShadows = 0;
	let numPointShadows = 0;
	let numSpotShadows = 0;
	let numSpotMaps = 0;
	let numSpotShadowsWithMaps = 0;

	let numLightProbes = 0;

	// ordering : [shadow casting + map texturing, map texturing, shadow casting, none ]
	lights.sort( shadowCastingAndTexturingLightsFirst );
	// 统计不同光源的数量，并给uniforms或者shadowUniforms赋值
	for ( let i = 0, l = lights.length; i < l; i ++ ) {
		const light = lights[ i ];
		const color = light.color;
		const intensity = light.intensity;
		const distance = light.distance;
		const shadowMap = ( light.shadow && light.shadow.map ) ? light.shadow.map.texture : null;
		// 判断光源类型
		if ( light.isAmbientLight ) {
			r += color.r * intensity;
			g += color.g * intensity;
			b += color.b * intensity;
		} else if ( light.isLightProbe ) {

			for ( let j = 0; j < 9; j ++ ) {
				state.probe[ j ].addScaledVector( light.sh.coefficients[ j ], intensity );
			}
			numLightProbes ++;

		} else if ( light.isDirectionalLight ) {
			const uniforms = cache.get( light );
			uniforms.color.copy( light.color ).multiplyScalar( light.intensity );
			// 是否产生光照
			if ( light.castShadow ) {
				const shadow = light.shadow;
				const shadowUniforms = shadowCache.get( light );
				shadowUniforms.shadowIntensity = shadow.intensity;
				shadowUniforms.shadowBias = shadow.bias;
				shadowUniforms.shadowNormalBias = shadow.normalBias;
				shadowUniforms.shadowRadius = shadow.radius;
				shadowUniforms.shadowMapSize = shadow.mapSize;

				state.directionalShadow[ directionalLength ] = shadowUniforms;
				state.directionalShadowMap[ directionalLength ] = shadowMap;
				state.directionalShadowMatrix[ directionalLength ] = light.shadow.matrix;
				numDirectionalShadows ++;
			}
			state.directional[ directionalLength ] = uniforms;
			directionalLength ++;

		} else if ( light.isSpotLight ) {

			const uniforms = cache.get( light );

			uniforms.position.setFromMatrixPosition( light.matrixWorld );

			uniforms.color.copy( color ).multiplyScalar( intensity );
			uniforms.distance = distance;

			uniforms.coneCos = Math.cos( light.angle );
			uniforms.penumbraCos = Math.cos( light.angle * ( 1 - light.penumbra ) );
			uniforms.decay = light.decay;

			state.spot[ spotLength ] = uniforms;

			const shadow = light.shadow;
			//是否有贴图
			if ( light.map ) {
				state.spotLightMap[ numSpotMaps ] = light.map;
				numSpotMaps ++;
				// make sure the lightMatrix is up to date
				// TODO : do it if required only
				shadow.updateMatrices( light );
				if ( light.castShadow ) numSpotShadowsWithMaps ++;
			}
			state.spotLightMatrix[ spotLength ] = shadow.matrix;
			// 是否产生光照
			if ( light.castShadow ) {

				const shadowUniforms = shadowCache.get( light );

				shadowUniforms.shadowIntensity = shadow.intensity;
				shadowUniforms.shadowBias = shadow.bias;
				shadowUniforms.shadowNormalBias = shadow.normalBias;
				shadowUniforms.shadowRadius = shadow.radius;
				shadowUniforms.shadowMapSize = shadow.mapSize;

				state.spotShadow[ spotLength ] = shadowUniforms;
				state.spotShadowMap[ spotLength ] = shadowMap;
				numSpotShadows ++;
			}
			spotLength ++;
		} else if ( light.isRectAreaLight ) {
			const uniforms = cache.get( light );
			uniforms.color.copy( color ).multiplyScalar( intensity );
			uniforms.halfWidth.set( light.width * 0.5, 0.0, 0.0 );
			uniforms.halfHeight.set( 0.0, light.height * 0.5, 0.0 );
			state.rectArea[ rectAreaLength ] = uniforms;
			rectAreaLength ++;
		} else if ( light.isPointLight ) {
			const uniforms = cache.get( light );
			uniforms.color.copy( light.color ).multiplyScalar( light.intensity );
			uniforms.distance = light.distance;
			uniforms.decay = light.decay;
			//是否产生光照
			if ( light.castShadow ) {
				const shadow = light.shadow;
				const shadowUniforms = shadowCache.get( light );
				shadowUniforms.shadowIntensity = shadow.intensity;
				shadowUniforms.shadowBias = shadow.bias;
				shadowUniforms.shadowNormalBias = shadow.normalBias;
				shadowUniforms.shadowRadius = shadow.radius;
				shadowUniforms.shadowMapSize = shadow.mapSize;
				shadowUniforms.shadowCameraNear = shadow.camera.near;
				shadowUniforms.shadowCameraFar = shadow.camera.far;
				state.pointShadow[ pointLength ] = shadowUniforms;
				state.pointShadowMap[ pointLength ] = shadowMap;
				state.pointShadowMatrix[ pointLength ] = light.shadow.matrix;
				numPointShadows ++;
			}

			state.point[ pointLength ] = uniforms;

			pointLength ++;

		} else if ( light.isHemisphereLight ) {
			const uniforms = cache.get( light );
			uniforms.skyColor.copy( light.color ).multiplyScalar( intensity );
			uniforms.groundColor.copy( light.groundColor ).multiplyScalar( intensity );
			state.hemi[ hemiLength ] = uniforms;
			hemiLength ++;
		}
	}
	//面光源特殊处理
	if ( rectAreaLength > 0 ) {
		if ( extensions.has( 'OES_texture_float_linear' ) === true ) {
			state.rectAreaLTC1 = UniformsLib.LTC_FLOAT_1;
			state.rectAreaLTC2 = UniformsLib.LTC_FLOAT_2;
		} else {
			state.rectAreaLTC1 = UniformsLib.LTC_HALF_1;
			state.rectAreaLTC2 = UniformsLib.LTC_HALF_2;
		}
	}
	state.ambient[ 0 ] = r;
	state.ambient[ 1 ] = g;
	state.ambient[ 2 ] = b;

	const hash = state.hash;
	// 更新state的值
	if ( hash.directionalLength !== directionalLength ||
		hash.pointLength !== pointLength ||
		hash.spotLength !== spotLength ||
		hash.rectAreaLength !== rectAreaLength ||
		hash.hemiLength !== hemiLength ||
		hash.numDirectionalShadows !== numDirectionalShadows ||
		hash.numPointShadows !== numPointShadows ||
		hash.numSpotShadows !== numSpotShadows ||
		hash.numSpotMaps !== numSpotMaps ||
		hash.numLightProbes !== numLightProbes ) {
        ...
		state.version = nextVersion ++;
	}
}
```
## 1.2. setupView源码解析
根据光源类型来进行不同的处理，计算光源在相机坐标系中的位置和方向。
```js
/**
 * 设置视图中的光源信息
 *
 * @param lights 光源数组
 * @param camera 相机实例
 * @returns 无返回值
 */
function setupView( lights, camera ) {
	//统计不同光源的数量
	let directionalLength = 0;
	let pointLength = 0;
	let spotLength = 0;
	let rectAreaLength = 0;
	let hemiLength = 0;
	//视图矩阵 用于后续光源的位置和方向变换
	const viewMatrix = camera.matrixWorldInverse;

	for ( let i = 0, l = lights.length; i < l; i ++ ) {

		const light = lights[ i ];
		//根据光源类型来进行不同的处理
		//方向光源
		if ( light.isDirectionalLight ) {
			const uniforms = state.directional[ directionalLength ];
			uniforms.direction.setFromMatrixPosition( light.matrixWorld );
			vector3.setFromMatrixPosition( light.target.matrixWorld );
			uniforms.direction.sub( vector3 );
			uniforms.direction.transformDirection( viewMatrix );
			directionalLength ++;
		} else if ( light.isSpotLight ) {
			const uniforms = state.spot[ spotLength ];
			uniforms.position.setFromMatrixPosition( light.matrixWorld );
			uniforms.position.applyMatrix4( viewMatrix );
			uniforms.direction.setFromMatrixPosition( light.matrixWorld );
			vector3.setFromMatrixPosition( light.target.matrixWorld );
			uniforms.direction.sub( vector3 );
			uniforms.direction.transformDirection( viewMatrix );
			spotLength ++;
		} else if ( light.isRectAreaLight ) {
			const uniforms = state.rectArea[ rectAreaLength ];
			uniforms.position.setFromMatrixPosition( light.matrixWorld );
			uniforms.position.applyMatrix4( viewMatrix );
			// extract local rotation of light to derive width/height half vectors
			matrix42.identity();
			matrix4.copy( light.matrixWorld );
			matrix4.premultiply( viewMatrix );
			matrix42.extractRotation( matrix4 );
			uniforms.halfWidth.set( light.width * 0.5, 0.0, 0.0 );
			uniforms.halfHeight.set( 0.0, light.height * 0.5, 0.0 );
			uniforms.halfWidth.applyMatrix4( matrix42 );
			uniforms.halfHeight.applyMatrix4( matrix42 );
			rectAreaLength ++;
		} else if ( light.isPointLight ) {
			const uniforms = state.point[ pointLength ];
			uniforms.position.setFromMatrixPosition( light.matrixWorld );
			uniforms.position.applyMatrix4( viewMatrix );
			pointLength ++;
		} else if ( light.isHemisphereLight ) {
			const uniforms = state.hemi[ hemiLength ];
			uniforms.direction.setFromMatrixPosition( light.matrixWorld );
			uniforms.direction.transformDirection( viewMatrix );
			hemiLength ++;
		}
	}
}
1.3. 根据不同光源设置不同的uniforms 变量
/**
 * 缓存统一变量对象
 *
 * @returns 返回包含各种灯光类型的统一变量对象的对象
 */
function UniformsCache() {

	const lights = {};

	return {
		get: function (light) {
			if (lights[light.id] !== undefined) {
				return lights[light.id];
			}
			let uniforms;
			switch (light.type) {
				case 'DirectionalLight':
					uniforms = {
						direction: new Vector3(),
						color: new Color()
					};
					break;
				case 'SpotLight':
					uniforms = {
						position: new Vector3(),
						direction: new Vector3(),
						color: new Color(),
						distance: 0,
						coneCos: 0,
						penumbraCos: 0,
						decay: 0
					};
					break;
				case 'PointLight':
					uniforms = {
						position: new Vector3(),
						color: new Color(),
						distance: 0,
						decay: 0
					};
					break;
				case 'HemisphereLight':
					uniforms = {
						direction: new Vector3(),
						skyColor: new Color(),
						groundColor: new Color()
					};
					break;
				case 'RectAreaLight':
					uniforms = {
						color: new Color(),
						position: new Vector3(),
						halfWidth: new Vector3(),
						halfHeight: new Vector3()
					};
					break;
			}
			lights[light.id] = uniforms;
			return uniforms;
		}
	};
}

/**
 * ShadowUniformsCache函数用于创建一个阴影统一变量缓存对象
 *
 * @returns 返回一个对象，包含以下属性：
 *   - get: 一个函数，用于获取指定光源的阴影统一变量
 */
function ShadowUniformsCache() {
	const lights = {};
	return {
		get: function (light) {
			if (lights[light.id] !== undefined) {

				return lights[light.id];

			}
			let uniforms;
			switch (light.type) {
				case 'DirectionalLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2()
					};
					break;
				case 'SpotLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2()
					};
					break;
				case 'PointLight':
					uniforms = {
						shadowIntensity: 1,
						shadowBias: 0,
						shadowNormalBias: 0,
						shadowRadius: 1,
						shadowMapSize: new Vector2(),
						shadowCameraNear: 1,
						shadowCameraFar: 1000
					};
					break;
				// TODO (abelnation): set RectAreaLight shadow uniforms
			}
			lights[light.id] = uniforms;
			return uniforms;
		}
	};
}
```