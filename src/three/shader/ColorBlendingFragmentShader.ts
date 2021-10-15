const ColorAddFragmentShader = `
varying mediump vec2 modeluv;
uniform sampler2D sourceMap;
uniform vec3 blendColor;

void main()	{
	vec4 sourceTex = texture2D(sourceMap,modeluv);

	float inter = 0.5;
    vec3 blendColor = mix(sourceTex.rgb,blendColor,inter);

	gl_FragColor = vec4(blendColor,sourceTex.a);

}
`;

export default ColorAddFragmentShader;