import * as THREE from 'three'

export default class ImageExporter
{
    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private downloadLink: HTMLAnchorElement;

    constructor(iScene: THREE.Scene, iCamera: THREE.PerspectiveCamera, IRenderer: THREE.WebGLRenderer)
    {
        this.scene = iScene;
        this.camera = iCamera;
        this.renderer = IRenderer;
        this.downloadLink = document.createElement('a');
    }

    public exportCanvasToImage(imageName: string)
    {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        this.downloadLink.href = dataURL;
        this.downloadLink.download = `${imageName}.png`;
        this.downloadLink.click();
    }
}