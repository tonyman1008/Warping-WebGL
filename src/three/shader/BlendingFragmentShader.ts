const FragmentShader = `
varying mediump vec2 modeluv;
uniform sampler2D map;

void main()	{
	gl_FragColor = texture2D(map, modeluv);
}
`;

export default FragmentShader;