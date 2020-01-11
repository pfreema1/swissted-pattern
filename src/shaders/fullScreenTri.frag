precision highp float;
#pragma glslify: blendMultiply = require(glsl-blend/multiply)

uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

float circle(vec2 _st, float _radius){
    vec2 l = _st-vec2(0.5);
    return 1.-smoothstep(_radius-(_radius*0.01),
                         _radius+(_radius*0.01),
                         dot(l,l)*4.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    // uv.x *= uResolution.x / uResolution.y;

    vec4 color = vec4(0.86,0.88,0.83, 1.0);
    vec4 circleColor1 = vec4(0.00,0.69,0.97, 0.33);
    vec4 circleColor2 = vec4(0.95,0.00,0.52, 0.33);
    vec4 circleColor3 = vec4(1.00,0.82,0.21, 0.33);
    vec4 mouseCanvasColor = texture2D(uMouseCanvas, uv);
    
    uv *= 30.0;
    uv = fract(uv);

    float maxOffset = 0.4;
    float offsetAmt = maxOffset * mouseCanvasColor.r;
    float m = 0.5;

    // top circle
    float topCircle = circle(vec2(uv.x, uv.y + offsetAmt), 1.0 - (mouseCanvasColor.r + m));
    color = mix(color, circleColor1, topCircle);

    // left circle
    float leftCircle = circle(vec2(uv.x - offsetAmt, uv.y - offsetAmt), 1.0 - (mouseCanvasColor.r + m));
    color = mix(color, circleColor2, leftCircle);

    // right circle
    float rightCircle = circle(vec2(uv.x + offsetAmt, uv.y - offsetAmt), 1.0 - (mouseCanvasColor.r + m));
    color = mix(color, circleColor3, rightCircle);

    vec3 blendAllColor = circleColor1.rgb * circleColor2.rgb * circleColor3.rgb;
    vec3 topLeftBlend = circleColor1.rgb * circleColor2.rgb;
    vec3 topRightBlend = circleColor1.rgb * circleColor3.rgb;
    vec3 leftRightBlend = circleColor2.rgb * circleColor3.rgb;

    color = mix(color, vec4(leftRightBlend, 0.5), leftCircle * rightCircle);
    color = mix(color, vec4(topRightBlend, 0.5), topCircle * rightCircle);
    color = mix(color, vec4(topLeftBlend, 0.5), topCircle * leftCircle);
    color = mix(color, vec4(blendAllColor, 0.5), topCircle * leftCircle * rightCircle);

    // color = mouseCanvasColor;
    
    gl_FragColor = vec4(color);
}