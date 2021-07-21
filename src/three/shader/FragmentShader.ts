const FragmentShader = `
varying mediump vec2 modeluv;
uniform vec2 uvOffset;
uniform sampler2D map;
uniform vec4 blendColor;

void main()	{
	gl_FragColor = texture2D(map, modeluv+uvOffset)*blendColor;
}
`;

export default FragmentShader;