/**
 * @file 下雨效果
 * @author chiyanchao
 */
 import {ShaderMaterial} from 'three';
 import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
 
 const vertexShader = `
 varying vec2 vUv;
 void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
 
 }`;
 const fragmentShader = `
     #define PI 3.14159
     #define	TAU 6.28318
    //  uniform sampler2D baseTexture;
     uniform sampler2D bloomTexture;
     varying vec2 vUv;
     uniform float time;
     vec4 getTexture( sampler2D texelToLinearTexture ) {
         vec4 texColor = LinearToLinear( texture2D( texelToLinearTexture , vUv ) );
         return texColor;
     }
     //snow original -> http://glslsandbox.com/e#36547.1
     float snow(vec2 uv,float scale)
     {
         //float time = iTime*0.75;
         uv+=time/scale;
         uv.y+=time*2./scale;
         uv.x+=sin(uv.y+time*.5)/scale;
         uv*=scale;
         vec2 s=floor(uv);
         vec2 f=fract(uv);
         float k=3.0;
         vec2 p =.5+.35*sin(11.*fract(sin((s+scale)*mat2(7.0,3.0,6.0,5.0))*5.))-f;
         float d=length(p);
         k=min(d,k);
         k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
         return k;
     }
 
 
     vec3 _Snow(vec2 uv,vec3 background)
     {
         float c = snow(uv,30.)*.3;
         c+=snow(uv,20.)*.5;
         c+=snow(uv,15.)*.8;
         c+=snow(uv,10.);
         c+=snow(uv,8.);
         c+=snow(uv,6.);
         c+=snow(uv,5.);
         c = clamp(c,0.0,1.0);
         vec3 scol = vec3(0.8,0.8,0.8);
         scol = mix(background,scol,c);
         return scol;
     }
     void main() {
         vec2 iResolution = vec2(3840,2160);
         vec2 p = (gl_FragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
         vec4 color = getTexture( bloomTexture );
         vec3 col = _Snow(p.xy*0.5, color.rgb);
         gl_FragColor = vec4(col,color.a);
 
     }`;
 export default function SnowPass(args = {}) {
     const time = args.time || 1.0;
     const step = args.step || 0.01
     const texture = args.bloomComposer.renderTarget2.texture || null;
     const sp = new ShaderPass(
         new ShaderMaterial({
             uniforms: {
                 baseTexture: {value: null},
                 bloomTexture: {value: texture},
                 time: {value: time},
             },
             vertexShader: vertexShader,
             fragmentShader: fragmentShader,
             defines: {}
         }),
         'baseTexture'
     );
     sp.name = 'SnowPass';
     sp.render = function (renderer, writeBuffer, readBuffer) {
         if (this.uniforms[this.textureID]) {
             this.uniforms[this.textureID].value = readBuffer.texture;
         }
         this.uniforms.time.value += step ;
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
 