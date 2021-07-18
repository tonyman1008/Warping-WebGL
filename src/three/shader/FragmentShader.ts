const FragmentShader = `
varying mediump vec2 modeluv;
uniform vec2 uvOffset;
uniform sampler2D map;

void main()	{
	gl_FragColor = texture2D(map, modeluv+uvOffset);
}
`;

export default FragmentShader;