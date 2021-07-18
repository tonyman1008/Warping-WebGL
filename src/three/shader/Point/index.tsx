import fragmentShader from "./fragmentShader";
import vertexShader from "./vertexShader";

class PointsShader {
  fragmentShader: string;
  vertexShader: string;
  constructor() {
    this.fragmentShader = fragmentShader;
    this.vertexShader = vertexShader;
  }
}

export default PointsShader;
