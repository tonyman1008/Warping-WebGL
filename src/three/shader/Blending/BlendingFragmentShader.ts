const BledingFragmentShader = `
varying mediump vec2 modeluv;
uniform sampler2D sourceMap;
uniform sampler2D targetMap;
uniform float interpVal;

void main()	{
	vec4 sourceTex = texture2D(sourceMap,modeluv);
	vec4 targetTex = texture2D(targetMap,modeluv);

	// vec4 sourceTex = vec4(0.0,1.0,0.0,1.0);
	// vec4 targetTex = vec4(1.0,0.0,0.0,1.0);

	// linear interpolation
	vec4 interTex;
	interTex = mix(sourceTex,targetTex,interpVal);
	gl_FragColor = interTex;

	// linear rgb interpolation
	// vec3 sourceColor = sourceTex.rgb;
	// vec3 targetColor = targetTex.rgb;
	// vec3 interColor = mix(sourceColor,targetColor,interpVal);

	// multi-transparent texture blending
	// vec3 interColor ;
	// interColor = sourceTex.rgb * sourceTex.a + targetTex.rgb * targetTex.a *  (1.0 - sourceTex.a);  // blending equation
	// if(sourceTex.a < 0.1 && targetTex.a < 0.1)
	// {
	// 	discard;
	// }
	// gl_FragColor = vec4(interColor,1);
}
`;

export default BledingFragmentShader;