/**
 * @file 渲染泛光时，需要进行纹理混合
 * @author wema
 */

 const vertexShader = `
 varying vec2 vUv;
 
 void main() {
 
     vUv = uv;
 
     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
 
 }`;
 
 const fragmentShader = `
 uniform sampler2D baseTexture;
 uniform sampler2D bloomTexture;
 
 varying vec2 vUv;
 
 vec4 getTexture( sampler2D texelToLinearTexture ) {
 
     vec4 texColor = LinearToLinear( texture2D( texelToLinearTexture , vUv ) );
     return texColor;
 }
 
 void main() {
 
     gl_FragColor = ( getTexture( baseTexture ) + vec4( 1.0 ) * getTexture( bloomTexture ) );
 
 }
 `;
 
 export {vertexShader, fragmentShader};
 