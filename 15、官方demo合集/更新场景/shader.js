export const fragmentShader = /* glsl */`
    varying vec3 vNormal;
    varying vec2 vUv;

    uniform vec3 color;
    uniform sampler2D colorTexture;

    void main() {

        vec3 light = vec3( 0.5, 0.2, 1.0 );
        // 归一化
        light = normalize( light );
        // 点集
        float dProd = dot( vNormal, light ) * 0.5 + 0.5;

        vec4 tcolor = texture2D( colorTexture, vUv );
        // 灰度
        vec4 gray = vec4( vec3( tcolor.r * 0.3 + tcolor.g * 0.59 + tcolor.b * 0.11 ), 1.0 );

        gl_FragColor = gray * vec4( vec3( dProd ) * vec3( color ), 1.0 );

    }
`;

export const vertexShader =  /* glsl */`
    uniform float amplitude;
    // 通过 sphere.geometry.attributes.displacement传进来
    attribute float displacement;

    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {

        vNormal = normal;
        // uv 和 position 都是从sphere.geometry.attributes获取的
        vUv = ( 0.5 + amplitude ) * uv + vec2( amplitude );

        vec3 newPosition = position + amplitude * normal * vec3( displacement );
        // 投影矩阵和模型矩阵
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

    }
`;


export const particles = {
    vertexShader: /* glsl */`
        attribute float size;
        varying vec3 vColor;
        void main() {
            // 颜色差值
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size * ( 300.0 / -mvPosition.z );
            gl_Position = projectionMatrix * mvPosition;

        }
    `,
    fragmentShader: /* glsl */`
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4( vColor, 1.0 );
            gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
        }
    `
}
