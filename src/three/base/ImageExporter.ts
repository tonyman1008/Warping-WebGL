import * as THREE from 'three'

export default class ImageExporter
{
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private downloadLink: HTMLAnchorElement;
    private captureWidth: number;
    private captureHeight: number;

    constructor(iScene: THREE.Scene, iCamera: THREE.PerspectiveCamera, IRenderer: THREE.WebGLRenderer)
    {
        this.scene = iScene;
        this.camera = iCamera;
        this.renderer = IRenderer;
        this.downloadLink = document.createElement('a');

        this.captureWidth = 1000;
        this.captureHeight = 1000;
    }

    public exportCanvasToImage(imageName: string)
    {
        this.resizeCaptureCanvas(this.captureWidth, this.captureHeight)

        const dataURL = this.renderer.domElement.toDataURL('image/png');
        this.downloadLink.href = dataURL;
        this.downloadLink.download = `${imageName}.png`;
        this.downloadLink.click();

        this.resizeCaptureCanvas(window.innerWidth, window.innerHeight)
    }

    public resizeCaptureCanvas(width, height)
    {
        const fovRadian = this.camera.fov * (Math.PI / 180);
        const targetCameraPosZ = (width / 2) / Math.tan(fovRadian / 2)
        this.camera.position.set(0, 0, targetCameraPosZ);

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.render(this.scene, this.camera);
    }
}