import * as THREE from 'three'
import ViewportController from "./base/ViewportController";
import ObjectManager from './base/ObjectManager';
import OpenMesh from "OpenMesh";

export default class Viewer {

    scene: THREE.Scene;
    container: HTMLCanvasElement;

    viewportControls: ViewportController;
    objectMgr: ObjectManager;
    openMeshLib: OpenMesh;

    constructor() {
        this.scene = new THREE.Scene()
        this.container = document.getElementById('three-canvas') as HTMLCanvasElement;

        //initial set manager
        this.viewportControls = new ViewportController();
        this.viewportControls.init(this.container);
        this.viewportControls.camera.position.set(0, 0, 150)

        this.openMeshLib = new OpenMesh();
        this.objectMgr = new ObjectManager(this.scene);

        //initial TEST
        this.objectMgr.createGridMesh();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.viewportControls.render(this.scene);
    }

    clear() {

    }
}
