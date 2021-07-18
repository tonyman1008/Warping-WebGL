const VertexShader = `
attribute float size;
attribute vec4 color;

varying vec4 vColor;

void main() {

    vColor = color;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    gl_PointSize = size * ( 300.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;

}`;
export default VertexShader;
