const StitchingFragmentShader = `
varying mediump vec2 modeluv;
uniform sampler2D sourceMap;
uniform sampler2D targetMap;
uniform float interpVal;

void main()	{
	vec4 sourceTex = texture2D(sourceMap,modeluv);
	vec4 targetTex = texture2D(targetMap,modeluv);

	vec3 sourceColor = vec3(1.0,0.0,0.0);
	vec3 targetColor = vec3(0.0,1.0,0.0);
    float inter = 0.5;
    vec3 interpolationSrcColor = mix(sourceTex.rgb,sourceColor,inter);
    vec3 interpolationTgtColor = mix(targetTex.rgb,targetColor,inter);
    
    // interpolation
    if(modeluv.x > interpVal){
        gl_FragColor = vec4(interpolationTgtColor,targetTex.a);
    }else{
        gl_FragColor = vec4(interpolationSrcColor,sourceTex.a);
    }

    // half
    // if(modeluv.x > 0.5){
    //     gl_FragColor = vec4(interpolationTgtColor,targetTex.a);
    // }else{
    //     gl_FragColor = vec4(interpolationSrcColor,sourceTex.a);
    // }
}
`;

export default StitchingFragmentShader;