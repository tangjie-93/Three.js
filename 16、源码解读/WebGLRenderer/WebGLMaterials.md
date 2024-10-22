# 1. 初始化 WebGL 材质
```js
// 初始化 WebGL 材质 主要是将material上的属性赋值到uniforms上
materials = new WebGLMaterials(_this, properties);
```
# 2. WebGLMaterials 源码解析
```js
import { BackSide } from '../../constants.js';
import { getUnlitUniformColorSpace } from '../shaders/UniformsUtils.js';
import { Euler } from '../../math/Euler.js';
import { Matrix4 } from '../../math/Matrix4.js';

const _e1 = /*@__PURE__*/ new Euler();
const _m1 = /*@__PURE__*/ new Matrix4();

/**
 * @description
 * 更新WebGL材质统一变量函数。包括刷新雾效、刷新材质等操作。
 *
 * @param {Object} renderer WebGLRenderer对象，必需参数。
 * @param {Object} properties Map对象，包含所有材质和光源的属性信息。
 * @returns {Object} 返回一个对象，包含两个方法：refreshFogUniforms和refreshMaterialUniforms。
 * refreshFogUniforms方法用于刷新雾效统一变量；refreshMaterialUniforms方法用于刷新材质统一变量。
 */
function WebGLMaterials(renderer, properties) {
	/**
	 * 刷新变换统一变量
	 *
	 * @param map 地图对象
	 * @param uniform 统一变量对象
	 */
	function refreshTransformUniform(map, uniform) {
		if (map.matrixAutoUpdate === true) {
			map.updateMatrix();
		}
		uniform.value.copy(map.matrix);
	}

	/**
	 * 刷新雾效统一变量
	 *
	 * @param uniforms 统一变量对象
	 * @param fog 雾效对象
	 */
	function refreshFogUniforms(uniforms, fog) {
		fog.color.getRGB(uniforms.fogColor.value, getUnlitUniformColorSpace(renderer));
		if (fog.isFog) {
			uniforms.fogNear.value = fog.near;
			uniforms.fogFar.value = fog.far;
		} else if (fog.isFogExp2) {
			uniforms.fogDensity.value = fog.density;
		}
	}
	/**
	 * 刷新材质统一变量
	 *
	 * @param uniforms 统一变量对象
	 * @param material 材质对象
	 * @param pixelRatio 像素比
	 * @param height 高度
	 * @param transmissionRenderTarget 透射渲染目标
	 */
	function refreshMaterialUniforms(uniforms, material, pixelRatio, height, transmissionRenderTarget) {
		if (material.isMeshBasicMaterial) {
			refreshUniformsCommon(uniforms, material);
		} else if (material.isMeshLambertMaterial) {
			refreshUniformsCommon(uniforms, material);
		} else if (material.isMeshToonMaterial) {
			refreshUniformsCommon(uniforms, material);
			refreshUniformsToon(uniforms, material);

		} else if (material.isMeshPhongMaterial) {
			refreshUniformsCommon(uniforms, material);
			refreshUniformsPhong(uniforms, material);
		} else if (material.isMeshStandardMaterial) {

			refreshUniformsCommon(uniforms, material);
			refreshUniformsStandard(uniforms, material);
			if (material.isMeshPhysicalMaterial) {
				refreshUniformsPhysical(uniforms, material, transmissionRenderTarget);
			}
		} else if (material.isMeshMatcapMaterial) {
			refreshUniformsCommon(uniforms, material);
			refreshUniformsMatcap(uniforms, material);
		} else if (material.isMeshDepthMaterial) {
			refreshUniformsCommon(uniforms, material);
		} else if (material.isMeshDistanceMaterial) {
			refreshUniformsCommon(uniforms, material);
			refreshUniformsDistance(uniforms, material);
		} else if (material.isMeshNormalMaterial) {
			refreshUniformsCommon(uniforms, material);
		} else if (material.isLineBasicMaterial) {
			refreshUniformsLine(uniforms, material);
			if (material.isLineDashedMaterial) {
				refreshUniformsDash(uniforms, material);
			}
		} else if (material.isPointsMaterial) {
			refreshUniformsPoints(uniforms, material, pixelRatio, height);
		} else if (material.isSpriteMaterial) {
			refreshUniformsSprites(uniforms, material);
		} else if (material.isShadowMaterial) {
			uniforms.color.value.copy(material.color);
			uniforms.opacity.value = material.opacity;
		} else if (material.isShaderMaterial) {
			material.uniformsNeedUpdate = false; // #15581
		}
	}
	
	/**
	 * 刷新统一变量，用于更新材质属性
	 *
	 * @param uniforms 统一变量对象
	 * @param material 材质对象
	 */
	function refreshUniformsCommon(uniforms, material) {
		uniforms.opacity.value = material.opacity;
		if (material.color) {
			uniforms.diffuse.value.copy(material.color);
		}
		if (material.emissive) {
			uniforms.emissive.value.copy(material.emissive).multiplyScalar(material.emissiveIntensity);
		}
		// 处理纹理贴图
		if (material.map) {
			uniforms.map.value = material.map;
			refreshTransformUniform(material.map, uniforms.mapTransform);
		}
		if (material.alphaMap) {
			uniforms.alphaMap.value = material.alphaMap;
			refreshTransformUniform(material.alphaMap, uniforms.alphaMapTransform);
		}
		if (material.bumpMap) {
			uniforms.bumpMap.value = material.bumpMap;
			refreshTransformUniform(material.bumpMap, uniforms.bumpMapTransform);
			uniforms.bumpScale.value = material.bumpScale;
			if (material.side === BackSide) {
				uniforms.bumpScale.value *= - 1;
			}
		}
		if (material.normalMap) {
			uniforms.normalMap.value = material.normalMap;
			refreshTransformUniform(material.normalMap, uniforms.normalMapTransform);
			uniforms.normalScale.value.copy(material.normalScale);
			if (material.side === BackSide) {
				uniforms.normalScale.value.negate();
			}
		}
		if (material.displacementMap) {
			uniforms.displacementMap.value = material.displacementMap;
			refreshTransformUniform(material.displacementMap, uniforms.displacementMapTransform);
			uniforms.displacementScale.value = material.displacementScale;
			uniforms.displacementBias.value = material.displacementBias;
		}
		if (material.emissiveMap) {
			uniforms.emissiveMap.value = material.emissiveMap;
			refreshTransformUniform(material.emissiveMap, uniforms.emissiveMapTransform);
		}
		if (material.specularMap) {
			uniforms.specularMap.value = material.specularMap;
			refreshTransformUniform(material.specularMap, uniforms.specularMapTransform);
		}
		if (material.alphaTest > 0) {
			uniforms.alphaTest.value = material.alphaTest;
		}
		const materialProperties = properties.get(material);
		const envMap = materialProperties.envMap;
		const envMapRotation = materialProperties.envMapRotation;
		if (envMap) {
			uniforms.envMap.value = envMap;
			_e1.copy(envMapRotation);
			// accommodate left-handed frame
			_e1.x *= - 1; _e1.y *= - 1; _e1.z *= - 1;
			if (envMap.isCubeTexture && envMap.isRenderTargetTexture === false) {
				// environment maps which are not cube render targets or PMREMs follow a different convention
				_e1.y *= - 1;
				_e1.z *= - 1;
			}
			uniforms.envMapRotation.value.setFromMatrix4(_m1.makeRotationFromEuler(_e1));
			uniforms.flipEnvMap.value = (envMap.isCubeTexture && envMap.isRenderTargetTexture === false) ? - 1 : 1;
			uniforms.reflectivity.value = material.reflectivity;
			uniforms.ior.value = material.ior;
			uniforms.refractionRatio.value = material.refractionRatio;
		}
		if (material.lightMap) {
			uniforms.lightMap.value = material.lightMap;
			uniforms.lightMapIntensity.value = material.lightMapIntensity;
			refreshTransformUniform(material.lightMap, uniforms.lightMapTransform);
		}
		if (material.aoMap) {
			uniforms.aoMap.value = material.aoMap;
			uniforms.aoMapIntensity.value = material.aoMapIntensity;
			refreshTransformUniform(material.aoMap, uniforms.aoMapTransform);
		}
	}

	/**
	 * 刷新uniforms中的线材质属性
	 *
	 * @param uniforms uniforms对象
	 * @param material 材质对象
	 */
	function refreshUniformsLine(uniforms, material) {
		uniforms.diffuse.value.copy(material.color);
		uniforms.opacity.value = material.opacity;
		if (material.map) {
			uniforms.map.value = material.map;
			refreshTransformUniform(material.map, uniforms.mapTransform);
		}

	}

	/**
	 * 刷新uniformsDash
	 *
	 * @param uniforms uniforms对象
	 * @param material material对象
	 */
	function refreshUniformsDash(uniforms, material) {
		uniforms.dashSize.value = material.dashSize;
		uniforms.totalSize.value = material.dashSize + material.gapSize;
		uniforms.scale.value = material.scale;
	}
    ...
    return {
		refreshFogUniforms: refreshFogUniforms,
		refreshMaterialUniforms: refreshMaterialUniforms
	};
}
export { WebGLMaterials };
```