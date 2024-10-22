# 1. 初始化program
```js
// 创建一个新的 WebGLProgram 对象，并将其赋值给 program
program = new WebGLProgram(renderer, cacheKey, parameters, bindingStates);
```
# 2. 源码解析
## 2.1. 创建program
```js
function WebGLProgram( renderer, cacheKey, parameters, bindingStates ) {
	// 获取webgl上下文
	const gl = renderer.getContext();
	// 自定义数据
	const defines = parameters.defines;
	// 获取顶点着色器
	let vertexShader = parameters.vertexShader;
	// 获取片段着色器
	let fragmentShader = parameters.fragmentShader;
	const shadowMapTypeDefine = generateShadowMapTypeDefine( parameters );
	const envMapTypeDefine = generateEnvMapTypeDefine( parameters );
	const envMapModeDefine = generateEnvMapModeDefine( parameters );
	const envMapBlendingDefine = generateEnvMapBlendingDefine( parameters );
	const envMapCubeUVSize = generateCubeUVSize( parameters );
	const customVertexExtensions = generateVertexExtensions( parameters );
	const customDefines = generateDefines( defines );
	// 创建program
	const program = gl.createProgram();
    ....
    gl.attachShader( program, glVertexShader );
	gl.attachShader( program, glFragmentShader );
	// Force a particular attribute to index 0.
	if ( parameters.index0AttributeName !== undefined ) {
		gl.bindAttribLocation( program, 0, parameters.index0AttributeName );
	} else if ( parameters.morphTargets === true ) {
		// programs with morphTargets displace position out of attribute 0
		// 将 'position' 绑定到顶点属性位置 0
		// 必须在调用 gl.linkProgram() 之前使用，否则不会生效
		gl.bindAttribLocation( program, 0, 'position' );
	}
	gl.linkProgram( program );
}
```   
## 2.2. 创建着色器
```js
function WebGLProgram( renderer, cacheKey, parameters, bindingStates ) {
	// 获取webgl上下文
	const gl = renderer.getContext();
	// 自定义数据
	const defines = parameters.defines;
	// 获取顶点着色器
	let vertexShader = parameters.vertexShader;
	// 获取片段着色器
	let fragmentShader = parameters.fragmentShader;

	const shadowMapTypeDefine = generateShadowMapTypeDefine( parameters );
	const envMapTypeDefine = generateEnvMapTypeDefine( parameters );
	const envMapModeDefine = generateEnvMapModeDefine( parameters );
	const envMapBlendingDefine = generateEnvMapBlendingDefine( parameters );
	const envMapCubeUVSize = generateCubeUVSize( parameters );
	const customVertexExtensions = generateVertexExtensions( parameters );
	const customDefines = generateDefines( defines );
	// 创建program
	const program = gl.createProgram();
	let prefixVertex, prefixFragment;
	let versionString = parameters.glslVersion ? '#version ' + parameters.glslVersion + '\n' : '';
	// 构建顶点和片元着色器代码的前置字符串
	if ( parameters.isRawShaderMaterial ) {
		prefixVertex = [
			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,
			customDefines
		].filter( filterEmptyLine ).join( '\n' );
		if ( prefixVertex.length > 0 ) {
			prefixVertex += '\n';
		}
		prefixFragment = [
			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,
			customDefines
		].filter( filterEmptyLine ).join( '\n' );
		if ( prefixFragment.length > 0 ) {
			prefixFragment += '\n';
		}
	} else {
		prefixVertex = [
			generatePrecision( parameters ),
			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,
			customDefines,
			parameters.extensionClipCullDistance ? '#define USE_CLIP_DISTANCE' : '',
			parameters.batching ? '#define USE_BATCHING' : '',
			parameters.batchingColor ? '#define USE_BATCHING_COLOR' : '',
			parameters.instancing ? '#define USE_INSTANCING' : '',
			parameters.instancingColor ? '#define USE_INSTANCING_COLOR' : '',
			parameters.instancingMorph ? '#define USE_INSTANCING_MORPH' : '',

			parameters.useFog && parameters.fog ? '#define USE_FOG' : '',
			parameters.useFog && parameters.fogExp2 ? '#define FOG_EXP2' : '',

			parameters.map ? '#define USE_MAP' : '',
			parameters.envMap ? '#define USE_ENVMAP' : '',
			parameters.envMap ? '#define ' + envMapModeDefine : '',
			parameters.lightMap ? '#define USE_LIGHTMAP' : '',
			parameters.aoMap ? '#define USE_AOMAP' : '',
			parameters.bumpMap ? '#define USE_BUMPMAP' : '',
			parameters.normalMap ? '#define USE_NORMALMAP' : '',
			parameters.normalMapObjectSpace ? '#define USE_NORMALMAP_OBJECTSPACE' : '',
			parameters.normalMapTangentSpace ? '#define USE_NORMALMAP_TANGENTSPACE' : '',
			parameters.displacementMap ? '#define USE_DISPLACEMENTMAP' : '',
			parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',

			parameters.anisotropy ? '#define USE_ANISOTROPY' : '',
			parameters.anisotropyMap ? '#define USE_ANISOTROPYMAP' : '',

			parameters.clearcoatMap ? '#define USE_CLEARCOATMAP' : '',
			parameters.clearcoatRoughnessMap ? '#define USE_CLEARCOAT_ROUGHNESSMAP' : '',
			parameters.clearcoatNormalMap ? '#define USE_CLEARCOAT_NORMALMAP' : '',

			parameters.iridescenceMap ? '#define USE_IRIDESCENCEMAP' : '',
			parameters.iridescenceThicknessMap ? '#define USE_IRIDESCENCE_THICKNESSMAP' : '',

			parameters.specularMap ? '#define USE_SPECULARMAP' : '',
			parameters.specularColorMap ? '#define USE_SPECULAR_COLORMAP' : '',
			parameters.specularIntensityMap ? '#define USE_SPECULAR_INTENSITYMAP' : '',

			parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
			parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',
			parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
			parameters.alphaHash ? '#define USE_ALPHAHASH' : '',

			parameters.transmission ? '#define USE_TRANSMISSION' : '',
			parameters.transmissionMap ? '#define USE_TRANSMISSIONMAP' : '',
			parameters.thicknessMap ? '#define USE_THICKNESSMAP' : '',

			parameters.sheenColorMap ? '#define USE_SHEEN_COLORMAP' : '',
			parameters.sheenRoughnessMap ? '#define USE_SHEEN_ROUGHNESSMAP' : '',
            
			parameters.mapUv ? '#define MAP_UV ' + parameters.mapUv : '',
			parameters.alphaMapUv ? '#define ALPHAMAP_UV ' + parameters.alphaMapUv : '',
			parameters.lightMapUv ? '#define LIGHTMAP_UV ' + parameters.lightMapUv : '',
			parameters.aoMapUv ? '#define AOMAP_UV ' + parameters.aoMapUv : '',
			parameters.emissiveMapUv ? '#define EMISSIVEMAP_UV ' + parameters.emissiveMapUv : '',
			parameters.bumpMapUv ? '#define BUMPMAP_UV ' + parameters.bumpMapUv : '',
			parameters.normalMapUv ? '#define NORMALMAP_UV ' + parameters.normalMapUv : '',
			parameters.displacementMapUv ? '#define DISPLACEMENTMAP_UV ' + parameters.displacementMapUv : '',

			parameters.metalnessMapUv ? '#define METALNESSMAP_UV ' + parameters.metalnessMapUv : '',
			parameters.roughnessMapUv ? '#define ROUGHNESSMAP_UV ' + parameters.roughnessMapUv : '',

			parameters.anisotropyMapUv ? '#define ANISOTROPYMAP_UV ' + parameters.anisotropyMapUv : '',

			parameters.clearcoatMapUv ? '#define CLEARCOATMAP_UV ' + parameters.clearcoatMapUv : '',
			parameters.clearcoatNormalMapUv ? '#define CLEARCOAT_NORMALMAP_UV ' + parameters.clearcoatNormalMapUv : '',
			parameters.clearcoatRoughnessMapUv ? '#define CLEARCOAT_ROUGHNESSMAP_UV ' + parameters.clearcoatRoughnessMapUv : '',

			parameters.iridescenceMapUv ? '#define IRIDESCENCEMAP_UV ' + parameters.iridescenceMapUv : '',
			parameters.iridescenceThicknessMapUv ? '#define IRIDESCENCE_THICKNESSMAP_UV ' + parameters.iridescenceThicknessMapUv : '',

			parameters.sheenColorMapUv ? '#define SHEEN_COLORMAP_UV ' + parameters.sheenColorMapUv : '',
			parameters.sheenRoughnessMapUv ? '#define SHEEN_ROUGHNESSMAP_UV ' + parameters.sheenRoughnessMapUv : '',

			parameters.specularMapUv ? '#define SPECULARMAP_UV ' + parameters.specularMapUv : '',
			parameters.specularColorMapUv ? '#define SPECULAR_COLORMAP_UV ' + parameters.specularColorMapUv : '',
			parameters.specularIntensityMapUv ? '#define SPECULAR_INTENSITYMAP_UV ' + parameters.specularIntensityMapUv : '',

			parameters.transmissionMapUv ? '#define TRANSMISSIONMAP_UV ' + parameters.transmissionMapUv : '',
			parameters.thicknessMapUv ? '#define THICKNESSMAP_UV ' + parameters.thicknessMapUv : '',
			parameters.vertexTangents && parameters.flatShading === false ? '#define USE_TANGENT' : '',
			parameters.vertexColors ? '#define USE_COLOR' : '',
			parameters.vertexAlphas ? '#define USE_COLOR_ALPHA' : '',
			parameters.vertexUv1s ? '#define USE_UV1' : '',
			parameters.vertexUv2s ? '#define USE_UV2' : '',
			parameters.vertexUv3s ? '#define USE_UV3' : '',

			parameters.pointsUvs ? '#define USE_POINTS_UV' : '',

			parameters.flatShading ? '#define FLAT_SHADED' : '',

			parameters.skinning ? '#define USE_SKINNING' : '',

			parameters.morphTargets ? '#define USE_MORPHTARGETS' : '',
			parameters.morphNormals && parameters.flatShading === false ? '#define USE_MORPHNORMALS' : '',
			( parameters.morphColors ) ? '#define USE_MORPHCOLORS' : '',
			( parameters.morphTargetsCount > 0 ) ? '#define MORPHTARGETS_TEXTURE_STRIDE ' + parameters.morphTextureStride : '',
			( parameters.morphTargetsCount > 0 ) ? '#define MORPHTARGETS_COUNT ' + parameters.morphTargetsCount : '',
			parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
			parameters.flipSided ? '#define FLIP_SIDED' : '',

			parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
			parameters.shadowMapEnabled ? '#define ' + shadowMapTypeDefine : '',

			parameters.sizeAttenuation ? '#define USE_SIZEATTENUATION' : '',

			parameters.numLightProbes > 0 ? '#define USE_LIGHT_PROBES' : '',

			parameters.logarithmicDepthBuffer ? '#define USE_LOGDEPTHBUF' : '',
			'uniform mat4 modelMatrix;',
			'uniform mat4 modelViewMatrix;',
			'uniform mat4 projectionMatrix;',
			'uniform mat4 viewMatrix;',
			'uniform mat3 normalMatrix;',
			'uniform vec3 cameraPosition;',
			'uniform bool isOrthographic;',
			'#ifdef USE_INSTANCING',
			'	attribute mat4 instanceMatrix;',

			'#endif',

			'#ifdef USE_INSTANCING_COLOR',

			'	attribute vec3 instanceColor;',

			'#endif',

			'#ifdef USE_INSTANCING_MORPH',

			'	uniform sampler2D morphTexture;',

			'#endif',

			'attribute vec3 position;',
			'attribute vec3 normal;',
			'attribute vec2 uv;',

			'#ifdef USE_UV1',

			'	attribute vec2 uv1;',

			'#endif',

			'#ifdef USE_UV2',

			'	attribute vec2 uv2;',

			'#endif',

			'#ifdef USE_UV3',

			'	attribute vec2 uv3;',

			'#endif',

			'#ifdef USE_TANGENT',

			'	attribute vec4 tangent;',

			'#endif',

			'#if defined( USE_COLOR_ALPHA )',

			'	attribute vec4 color;',

			'#elif defined( USE_COLOR )',

			'	attribute vec3 color;',

			'#endif',

			'#ifdef USE_SKINNING',

			'	attribute vec4 skinIndex;',
			'	attribute vec4 skinWeight;',

			'#endif',

			'\n'

		].filter( filterEmptyLine ).join( '\n' );

		prefixFragment = [
			generatePrecision( parameters ),
			'#define SHADER_TYPE ' + parameters.shaderType,
			'#define SHADER_NAME ' + parameters.shaderName,
			customDefines,
			parameters.useFog && parameters.fog ? '#define USE_FOG' : '',
			parameters.useFog && parameters.fogExp2 ? '#define FOG_EXP2' : '',
			parameters.alphaToCoverage ? '#define ALPHA_TO_COVERAGE' : '',
			parameters.map ? '#define USE_MAP' : '',
			parameters.matcap ? '#define USE_MATCAP' : '',
			parameters.envMap ? '#define USE_ENVMAP' : '',
			parameters.envMap ? '#define ' + envMapTypeDefine : '',
			parameters.envMap ? '#define ' + envMapModeDefine : '',
			parameters.envMap ? '#define ' + envMapBlendingDefine : '',
			envMapCubeUVSize ? '#define CUBEUV_TEXEL_WIDTH ' + envMapCubeUVSize.texelWidth : '',
			envMapCubeUVSize ? '#define CUBEUV_TEXEL_HEIGHT ' + envMapCubeUVSize.texelHeight : '',
			envMapCubeUVSize ? '#define CUBEUV_MAX_MIP ' + envMapCubeUVSize.maxMip + '.0' : '',
			parameters.lightMap ? '#define USE_LIGHTMAP' : '',
			parameters.aoMap ? '#define USE_AOMAP' : '',
			parameters.bumpMap ? '#define USE_BUMPMAP' : '',
			parameters.normalMap ? '#define USE_NORMALMAP' : '',
			parameters.normalMapObjectSpace ? '#define USE_NORMALMAP_OBJECTSPACE' : '',
			parameters.normalMapTangentSpace ? '#define USE_NORMALMAP_TANGENTSPACE' : '',
			parameters.emissiveMap ? '#define USE_EMISSIVEMAP' : '',

			parameters.anisotropy ? '#define USE_ANISOTROPY' : '',
			parameters.anisotropyMap ? '#define USE_ANISOTROPYMAP' : '',

			parameters.clearcoat ? '#define USE_CLEARCOAT' : '',
			parameters.clearcoatMap ? '#define USE_CLEARCOATMAP' : '',
			parameters.clearcoatRoughnessMap ? '#define USE_CLEARCOAT_ROUGHNESSMAP' : '',
			parameters.clearcoatNormalMap ? '#define USE_CLEARCOAT_NORMALMAP' : '',

			parameters.dispersion ? '#define USE_DISPERSION' : '',

			parameters.iridescence ? '#define USE_IRIDESCENCE' : '',
			parameters.iridescenceMap ? '#define USE_IRIDESCENCEMAP' : '',
			parameters.iridescenceThicknessMap ? '#define USE_IRIDESCENCE_THICKNESSMAP' : '',

			parameters.specularMap ? '#define USE_SPECULARMAP' : '',
			parameters.specularColorMap ? '#define USE_SPECULAR_COLORMAP' : '',
			parameters.specularIntensityMap ? '#define USE_SPECULAR_INTENSITYMAP' : '',

			parameters.roughnessMap ? '#define USE_ROUGHNESSMAP' : '',
			parameters.metalnessMap ? '#define USE_METALNESSMAP' : '',

			parameters.alphaMap ? '#define USE_ALPHAMAP' : '',
			parameters.alphaTest ? '#define USE_ALPHATEST' : '',
			parameters.alphaHash ? '#define USE_ALPHAHASH' : '',

			parameters.sheen ? '#define USE_SHEEN' : '',
			parameters.sheenColorMap ? '#define USE_SHEEN_COLORMAP' : '',
			parameters.sheenRoughnessMap ? '#define USE_SHEEN_ROUGHNESSMAP' : '',

			parameters.transmission ? '#define USE_TRANSMISSION' : '',
			parameters.transmissionMap ? '#define USE_TRANSMISSIONMAP' : '',
			parameters.thicknessMap ? '#define USE_THICKNESSMAP' : '',

			parameters.vertexTangents && parameters.flatShading === false ? '#define USE_TANGENT' : '',
			parameters.vertexColors || parameters.instancingColor || parameters.batchingColor ? '#define USE_COLOR' : '',
			parameters.vertexAlphas ? '#define USE_COLOR_ALPHA' : '',
			parameters.vertexUv1s ? '#define USE_UV1' : '',
			parameters.vertexUv2s ? '#define USE_UV2' : '',
			parameters.vertexUv3s ? '#define USE_UV3' : '',

			parameters.pointsUvs ? '#define USE_POINTS_UV' : '',

			parameters.gradientMap ? '#define USE_GRADIENTMAP' : '',

			parameters.flatShading ? '#define FLAT_SHADED' : '',

			parameters.doubleSided ? '#define DOUBLE_SIDED' : '',
			parameters.flipSided ? '#define FLIP_SIDED' : '',

			parameters.shadowMapEnabled ? '#define USE_SHADOWMAP' : '',
			parameters.shadowMapEnabled ? '#define ' + shadowMapTypeDefine : '',

			parameters.premultipliedAlpha ? '#define PREMULTIPLIED_ALPHA' : '',

			parameters.numLightProbes > 0 ? '#define USE_LIGHT_PROBES' : '',

			parameters.decodeVideoTexture ? '#define DECODE_VIDEO_TEXTURE' : '',

			parameters.logarithmicDepthBuffer ? '#define USE_LOGDEPTHBUF' : '',

			'uniform mat4 viewMatrix;',
			'uniform vec3 cameraPosition;',
			'uniform bool isOrthographic;',

			( parameters.toneMapping !== NoToneMapping ) ? '#define TONE_MAPPING' : '',
			( parameters.toneMapping !== NoToneMapping ) ? ShaderChunk[ 'tonemapping_pars_fragment' ] : '', // this code is required here because it is used by the toneMapping() function defined below
			( parameters.toneMapping !== NoToneMapping ) ? getToneMappingFunction( 'toneMapping', parameters.toneMapping ) : '',

			parameters.dithering ? '#define DITHERING' : '',
			parameters.opaque ? '#define OPAQUE' : '',

			ShaderChunk[ 'colorspace_pars_fragment' ], // this code is required here because it is used by the various encoding/decoding function defined below
			getTexelEncodingFunction( 'linearToOutputTexel', parameters.outputColorSpace ),

			parameters.useDepthPacking ? '#define DEPTH_PACKING ' + parameters.depthPacking : '',

			'\n'

		].filter( filterEmptyLine ).join( '\n' );
	}
	// 解析#include
	vertexShader = resolveIncludes( vertexShader );
	// 替换字符串中的光源数量参数
	vertexShader = replaceLightNums( vertexShader, parameters );
	// 替换字符串中的剪切平面数量
	vertexShader = replaceClippingPlaneNums( vertexShader, parameters );

	fragmentShader = resolveIncludes( fragmentShader );
	fragmentShader = replaceLightNums( fragmentShader, parameters );
	fragmentShader = replaceClippingPlaneNums( fragmentShader, parameters );

	vertexShader = unrollLoops( vertexShader );
	fragmentShader = unrollLoops( fragmentShader );
	if ( parameters.isRawShaderMaterial !== true ) {
		// GLSL 3.0 conversion for built-in materials and ShaderMaterial
		versionString = '#version 300 es\n';
		prefixVertex = [
			customVertexExtensions,
			'#define attribute in',
			'#define varying out',
			'#define texture2D texture'
		].join( '\n' ) + '\n' + prefixVertex;

		prefixFragment = [
			'#define varying in',
			( parameters.glslVersion === GLSL3 ) ? '' : 'layout(location = 0) out highp vec4 pc_fragColor;',
			( parameters.glslVersion === GLSL3 ) ? '' : '#define gl_FragColor pc_fragColor',
			'#define gl_FragDepthEXT gl_FragDepth',
			'#define texture2D texture',
			'#define textureCube texture',
			'#define texture2DProj textureProj',
			'#define texture2DLodEXT textureLod',
			'#define texture2DProjLodEXT textureProjLod',
			'#define textureCubeLodEXT textureLod',
			'#define texture2DGradEXT textureGrad',
			'#define texture2DProjGradEXT textureProjGrad',
			'#define textureCubeGradEXT textureGrad'
		].join( '\n' ) + '\n' + prefixFragment;

	}
	// 得到最终的着色器代码
	const vertexGlsl = versionString + prefixVertex + vertexShader;
	const fragmentGlsl = versionString + prefixFragment + fragmentShader;
	// 创建着色器对象
	/**
	 *  const shader = gl.createShader( type );
		gl.shaderSource( shader, string );
		gl.compileShader( shader );
	 */
	const glVertexShader = WebGLShader( gl, gl.VERTEX_SHADER, vertexGlsl );
	const glFragmentShader = WebGLShader( gl, gl.FRAGMENT_SHADER, fragmentGlsl );
    ...
}
```
## 2.3. 定义实例属性
```js
/**
 * 首次使用时的处理函数
 *
 * @param self 当前对象
 * @returns 无返回值
 */
function onFirstUse( self ) {
	// check for link errors
	// 是否应该检测shader编译错误
	if ( renderer.debug.checkShaderErrors ) {
		// 获取日志信息
		const programLog = gl.getProgramInfoLog( program ).trim();
		const vertexLog = gl.getShaderInfoLog( glVertexShader ).trim();
		const fragmentLog = gl.getShaderInfoLog( glFragmentShader ).trim();

		let runnable = true;
		let haveDiagnostics = true;
		// 检查链接状态
		if ( gl.getProgramParameter( program, gl.LINK_STATUS ) === false ) {
			runnable = false;
			if ( typeof renderer.debug.onShaderError === 'function' ) {
				renderer.debug.onShaderError( gl, program, glVertexShader, glFragmentShader );
			} else {
				// 打印错误日志
				const vertexErrors = getShaderErrors( gl, glVertexShader, 'vertex' );
				const fragmentErrors = getShaderErrors( gl, glFragmentShader, 'fragment' );
				console.error(
					'THREE.WebGLProgram: Shader Error ' + gl.getError() + ' - ' +
					'VALIDATE_STATUS ' + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + '\n\n' +
					'Material Name: ' + self.name + '\n' +
					'Material Type: ' + self.type + '\n\n' +
					'Program Info Log: ' + programLog + '\n' +
					vertexErrors + '\n' +
					fragmentErrors
				);

			}

		} else if ( programLog !== '' ) {

			console.warn( 'THREE.WebGLProgram: Program Info Log:', programLog );

		} else if ( vertexLog === '' || fragmentLog === '' ) {

			haveDiagnostics = false;
		}
		if ( haveDiagnostics ) {
			self.diagnostics = {
				runnable: runnable,
				programLog: programLog,
				vertexShader: {
					log: vertexLog,
					prefix: prefixVertex
				},
				fragmentShader: {
					log: fragmentLog,
					prefix: prefixFragment
				}
			};
		}
	}
	// 用完就删除
	gl.deleteShader( glVertexShader );
	gl.deleteShader( glFragmentShader );

	cachedUniforms = new WebGLUniforms( gl, program );
	cachedAttributes = fetchAttributeLocations( gl, program );

}
// set up caching for uniform locations
let cachedUniforms;
this.getUniforms = function () {
	if ( cachedUniforms === undefined ) {
		// Populates cachedUniforms and cachedAttributes
		onFirstUse( this );
	}
	return cachedUniforms;
};

// set up caching for attribute locations

let cachedAttributes;
this.getAttributes = function () {
	if ( cachedAttributes === undefined ) {
		// Populates cachedAttributes and cachedUniforms
		onFirstUse( this );
	}
	return cachedAttributes;
};

// indicate when the program is ready to be used. if the KHR_parallel_shader_compile extension isn't supported,
// flag the program as ready immediately. It may cause a stall when it's first used.

let programReady = ( parameters.rendererExtensionParallelShaderCompile === false );
// 判断program是否准备好使用了
this.isReady = function () {
	if ( programReady === false ) {
		programReady = gl.getProgramParameter( program, COMPLETION_STATUS_KHR );
	}
	return programReady;
};

// 资源释放
this.destroy = function () {
	bindingStates.releaseStatesOfProgram( this );
	gl.deleteProgram( program );
	this.program = undefined;
};

this.type = parameters.shaderType;
this.name = parameters.shaderName;
this.id = programIdCount ++;
this.cacheKey = cacheKey;
this.usedTimes = 1;
this.program = program;
this.vertexShader = glVertexShader;
this.fragmentShader = glFragmentShader;
```

## 2.4. 获取属性的位置信息
```js
let cachedAttributes;
this.getAttributes = function () {
	if ( cachedAttributes === undefined ) {
		// Populates cachedAttributes and cachedUniforms
		onFirstUse( this );
	}
	return cachedAttributes;
};
/**
 * @description
 * 获取属性的位置信息，返回一个对象包含所有属性的类型、位置和位置大小。
 *
 * @param {WebGLRenderingContext} gl - WebGLRenderingContext 对象。
 * @param {WebGLProgram} program - WebGLProgram 对象，表示当前使用中的程序。
 *
 * @returns {Object} 返回一个对象，其中包含了所有属性的类型、位置和位置大小。
 * 每个属性都是一个对象，包含以下字段：
 * - type (Number)：属性的类型，可能为 gl.FLOAT、gl.FLOAT_VEC2、gl.FLOAT_VEC3 或 gl.FLOAT_MAT2、gl.FLOAT_MAT3 或 gl.FLOAT_MAT4。
 * - location (Number)：属性在着色器程序中的位置。
 * - locationSize (Number)：属性的位置大小，默认为 1，如果属性是 mat2、mat3 或 mat4，则为 2、3 或 4。
 */
function fetchAttributeLocations( gl, program ) {
	const attributes = {};
	// 获取程序中活动属性的数量
	const n = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES );
	for ( let i = 0; i < n; i ++ ) {
		// 获取活动属性的信息
		const info = gl.getActiveAttrib( program, i );
		// 获取属性名称
		const name = info.name;
		let locationSize = 1;
		// 根据属性类型设置位置大小
		if ( info.type === gl.FLOAT_MAT2 ) locationSize = 2;
		if ( info.type === gl.FLOAT_MAT3 ) locationSize = 3;
		if ( info.type === gl.FLOAT_MAT4 ) locationSize = 4;
		// 将属性信息保存到attributes对象中
		attributes[ name ] = {
			type: info.type,
			// 获取属性的位置
			location: gl.getAttribLocation( program, name ),
			locationSize: locationSize
		};
	}
	// 返回保存了属性信息的对象
	return attributes;
}
```
## 2.5. 获取及解析uniforms
```js
let cachedUniforms;
this.getUniforms = function () {
    if ( cachedUniforms === undefined ) {
        // Populates cachedUniforms and cachedAttributes
        onFirstUse( this );
    }
    return cachedUniforms;
};

/**
* 首次使用时的处理函数
*
* @param self 当前对象
* @returns 无返回值
*/
function onFirstUse( self ) {
    ...
    cachedUniforms = new WebGLUniforms( gl, program );
    cachedAttributes = fetchAttributeLocations( gl, program );
}
```
## 2.6. WebGLUniforms 源码解析
### 2.6.1. 核心代码
```js
const info = gl.getActiveUniform( program, i );
const addr = gl.getUniformLocation( program, info.name );
//解析Uniform 根据不通的数据类型调用不通的方法去将数据传递给webgl
// 如gl.uniform1f( this.addr, v );gl.uniform2fv( this.addr, v );
parseUniform( info, addr, this );
```
### 2.6.2. 源码解析
```js
class WebGLUniforms {

	/**
	 * 构造函数
	 *
	 * @param gl WebGLRenderingContext 对象
	 * @param program WebGLProgram 对象
	 */
	constructor( gl, program ) {
		this.seq = [];
		this.map = {};
		const n = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS );
		for ( let i = 0; i < n; ++ i ) {
			const info = gl.getActiveUniform( program, i ),
				addr = gl.getUniformLocation( program, info.name );
			parseUniform( info, addr, this );
		}
	}
	setValue( gl, name, value, textures ) {
		const u = this.map[ name ];
		if ( u !== undefined ) u.setValue( gl, value, textures );
	}

	/**
	 * 设置可选属性
	 *
	 * @param gl WebGL上下文对象
	 * @param object 包含属性的对象
	 * @param name 属性名
	 */
	setOptional( gl, object, name ) {
		const v = object[ name ];
		if ( v !== undefined ) this.setValue( gl, name, v );
	}
	/**
	 * 上传数据
	 *
	 * @param gl WebGLRenderingContext 上下文对象
	 * @param seq 包含上传序列的数组
	 * @param values 包含数据值的对象数组
	 * @param textures 纹理对象数组
	 * @returns 无返回值
	 */
	static upload( gl, seq, values, textures ) {
		// 遍历序列数组
		for ( let i = 0, n = seq.length; i !== n; ++ i ) {
			// 获取当前序列和对应的值
			const u = seq[ i ],
				v = values[ u.id ];
			// 如果值需要更新
			if ( v.needsUpdate !== false ) {
				// 注意：当 .needsUpdate 未定义时，总是进行更新
				// 设置值到序列中
				u.setValue( gl, v.value, textures );
			}
		}
	}
	/**
	 * 根据给定的序列和值数组，返回序列中所有id存在于值数组中的元素所组成的数组
	 *
	 * @param seq 给定的序列
	 * @param values 值数组
	 * @returns 序列中所有id存在于值数组中的元素所组成的数组
	 */
	static seqWithValue( seq, values ) {
		const r = [];
		for ( let i = 0, n = seq.length; i !== n; ++ i ) {
			const u = seq[ i ];
			if ( u.id in values ) r.push( u );
		}
		return r;
	}
}
export { WebGLUniforms };
```