import * as THREE from 'three'
import Global from "./Global";
import ViewportController from "./Controllers/ViewportController";


export default class Viewer {

    scene: THREE.Scene;
    container: HTMLCanvasElement;
    viewportControls: ViewportController = Global.inst.viewportController;

    constructor() {
        this.scene = new THREE.Scene()
        this.container = document.getElementById('three-canvas') as HTMLCanvasElement;
        this.viewportControls.init(this.container);

        //initial
        const geo = new THREE.BoxGeometry(1, 1);
        const mat = new THREE.MeshBasicMaterial({ color: 'red' });
        const testBox = new THREE.Mesh(geo, mat);
        this.scene.add(testBox)
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.viewportControls.render(this.scene);
    }

    clear() {

    }
}
