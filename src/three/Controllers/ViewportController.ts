import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let self: ViewportController;

export default class ViewportController {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  controls: OrbitControls;

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    //Setting up 3D renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 0.0);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    window.addEventListener("resize", this.windowResized, false);
    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1
    );
    this.camera.position.set(0, 2, 0);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 0, 0);
    this.controls.domElement = this.renderer.domElement;
    this.controls.update();
    //
    self = this;
  }

  windowResized() {
    if (self.camera != null) {
      self.camera.aspect = self.canvas.clientWidth / self.canvas.clientHeight;
      self.camera.updateProjectionMatrix();
    }
    self.renderer.setSize(
      self.canvas.clientWidth,
      self.canvas.clientHeight,
      false
    );
  };

  render(scene: THREE.Scene) {
    if (this.controls && this.renderer) {
      this.controls.update();
      this.renderer.render(scene, this.camera);
    }
  };
}
