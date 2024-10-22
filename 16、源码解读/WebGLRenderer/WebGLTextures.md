## 1. 初始化 WebGL 纹理
主要是用于使用状态类state来操作纹理相关的内容。
```js
// 初始化 WebGL 纹理
textures = new WebGLTextures(_gl, extensions, state, properties, capabilities, utils, info);
```
## 2. WebGLTextures结构图
<img src='../../img/WebGLTextures.png' />