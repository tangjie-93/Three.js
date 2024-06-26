/**
 * @file 雾天效果
 * @author chiyanchao
 */
 import {ShaderMaterial} from 'three';
 import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
 
 const vertexShaderRain = `
 varying vec2 vUv;
 void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
 
 }`;
 const fragmentShaderRain = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    // #extension GL_OES_standard_derivatives : enable

    #define NUM_OCTAVES 5
     uniform sampler2D baseTexture;
     uniform sampler2D bloomTexture;
     varying vec2 vUv;
     uniform float time;
     uniform float opacity;

     vec4 getTexture( sampler2D texelToLinearTexture ) {
         vec4 texColor = LinearToLinear( texture2D( texelToLinearTexture , vUv ) );
         return texColor;
     }
 
     mat3 rotY(float a) {
        float c = cos(a);
        float s = sin(a);
        return mat3(
            c, 0, -s,
            0, 1, 0,
            s, 0, c
        );
    }
    
    float random(vec2 pos) {
        return fract(sin(dot(pos.xy, vec2(1399.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 pos) {
        vec2 i = floor(pos);
        vec2 f = fract(pos);
        float a = random(i + vec2(0.0, 0.0));
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }


    float fbm(vec2 pos) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i=0; i<NUM_OCTAVES; i++) {
            v += a * noise(pos);
            pos = rot * pos * 2.0 + shift;
            a *= 0.5;
        }
        return v;
    }
 
    void main() {
        vec4 color=( getTexture( baseTexture ) + vec4( opacity ) * getTexture( bloomTexture ) );
        vec2 iResolution = vec2(3840,2160);
        vec2 p = (gl_FragCoord.xy * 3.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
	    float t = 0.0, d;
	    float time2 = 4.0 * time / 2.0;
        vec2 q = vec2(0.0);
        q.x = fbm(p + 0.00 * time2);
        q.y = fbm(p + vec2(1.0));
        vec2 r = vec2(0.0);
        r.x = fbm(p + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time2);
        r.y = fbm(p + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time2);
        float f = fbm(p + r);
        vec3 color2 = mix(
            vec3(0.9, 1.0, 0.8),
            vec3(.866667, 1.0, 0.866667),
            clamp((f * f) * 4.0, 0.0, 1.0)
        );
        color2 = mix(
            color2,
            vec3(1.0, 1.0, 1.0),
            clamp(length(q), 0.0, 1.0)
        );
        color2 = mix(
            color2,
            vec3(1.0, 1.0, 1.0),
            clamp(length(r.x), 0.0, 1.0)
        );
	    color2 = (f *f * f + 0.8 * f * f + 0.8 * f) * color2;
	    gl_FragColor = vec4(color2, 0.5) + color;
    
    }`;
 export default function RainPass(args = {}) {
     const time = args.time || 1.0;
     const texture = args.bloomComposer.renderTarget2.texture || null;
     const opacity = args.opacity || 0.8;
     const step = args.step||0.1;
     const sp = new ShaderPass(
         new ShaderMaterial({
             uniforms: {
                 baseTexture: {value: null},
                 bloomTexture: {value: texture},
                 time: {value: time},
                 opacity: {value: opacity}
             },
             vertexShader: vertexShaderRain,
             fragmentShader: fragmentShaderRain,
             defines: {}
         }),
         'baseTexture'
     );
     sp.name = 'FogPass';
     sp.render = function (renderer, writeBuffer, readBuffer) {
         if (this.uniforms[this.textureID]) {
             this.uniforms[this.textureID].value = readBuffer.texture;
         }
         this.uniforms.time.value += step;
         this.fsQuad.material = this.material;
 
         if (this.renderToScreen) {
             renderer.setRenderTarget(null);
             this.fsQuad.render(renderer);
         } else {
             renderer.setRenderTarget(writeBuffer);
             // TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
             if (this.clear) {
                 renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
             }
             this.fsQuad.render(renderer);
         }
     };
     return sp;
 }
 