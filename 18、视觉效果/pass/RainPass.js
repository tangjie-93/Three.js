/**
 * @file 下雨效果
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
     uniform sampler2D baseTexture;
     uniform sampler2D bloomTexture;
     varying vec2 vUv;
     uniform float time;
     uniform float opacity;
     vec4 getTexture( sampler2D texelToLinearTexture ) {
         vec4 texColor = LinearToLinear( texture2D( texelToLinearTexture , vUv ) );
         return texColor;
     }
 
    vec4 getColor(vec4 o,vec2 u){
        vec2 mo = vec2(.25,.0);
        vec3 origin = vec3(6.0*mo.x, 3.0 + 4.0*mo.y, -4.0);
        vec3 target = vec3( 0.0, 0.8, 1.2 );
    
        vec3 cw = normalize( target-origin);
        o += 1.-fract((u.y*0.001+u.x*.11)*fract(u.x*.41)+time*0.4 )*100.-1.5*o -cw.x;
        return o;
    }
 
    void main() {
        vec4 color=( getTexture( baseTexture ) + vec4( opacity ) * getTexture( bloomTexture ) );
        vec4 _color3057 =vec4(0.0, 0.0, 0.0, 1.0);
        vec4 color2=getColor(_color3057,gl_FragCoord.xy);
        if (color2.x < 0.0){
        (color2 = vec4(0.0, 0.0, 0.0, 1.0));
        }
        if (color2.y < 0.0){
        (color2 = vec4(0.0, 0.0, 0.0, 1.0));
        }
        if (color2.z < 0.0){
        (color2 = vec4(0.0, 0.0, 0.0, 1.0));
        }
        if (color2.w < 0.0){
        (color2 = vec4(0.0, 0.0, 0.0, 1.0));
        }
        color2 = vec4(color2.xyz, 1.0);
        gl_FragColor = color+color2;
    
    }`;
 export default function RainPass(args = {}) {
     const time = args.time || 1.0;
     const texture = args.bloomComposer.renderTarget2.texture || null;
     const opacity = args.opacity || 0.2;
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
     sp.name = 'RainPass';
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
 