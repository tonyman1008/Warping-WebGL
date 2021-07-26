import * as THREE from 'three'
import ViewportController from "./base/ViewportController";
import ObjectManager from './base/ObjectManager';
import OpenMesh from "OpenMesh";
import MeshEditor from './MeshEditor';
import * as dat from "dat-gui";
import GridMesh3D from './object/GridMesh3D';
import testImgPath from 'assets/balenciagaBag_crop/img01.png';
import ASAP from './ASAP/ASAP';

export default class Viewer
{

    scene: THREE.Scene;
    container: HTMLCanvasElement;

    viewportControls: ViewportController;
    objectMgr: ObjectManager;
    openMeshController: OpenMesh;
    meshEditor: MeshEditor;
    datGUI: dat;

    testMesh: GridMesh3D;

    testWarpDegree: number;
    defaultPositionAttribute: THREE.BufferAttribute;
    ASAP: ASAP;

    constructor()
    {
        this.scene = new THREE.Scene()
        this.container = document.getElementById('three-canvas') as HTMLCanvasElement;

        //initial set manager
        this.viewportControls = new ViewportController();
        this.viewportControls.init(this.container);
        this.viewportControls.camera.position.set(0, 0, 150)
        this.viewportControls.controls.enableRotate = false;

        this.openMeshController = new OpenMesh();
        this.meshEditor = new MeshEditor(this.viewportControls.camera);
        this.objectMgr = new ObjectManager(this.scene, this.openMeshController);
        this.datGUI = new dat.GUI();

        this.ASAP = new ASAP(this.viewportControls.camera, this.scene);

        this.testWarpDegree = 0;
        this.testCreateMesh();
        this.setGUI()
    }

    setGUI()
    {
        const uniformWarpFolder = this.datGUI.addFolder('UniformWarp');
        uniformWarpFolder.add(this, 'testWarpDegree', -30, 30, 1).name('warpDeg').onChange(this.warp.bind(this));
        uniformWarpFolder.add(this, 'resetViewPort');
        uniformWarpFolder.add(this, 'resetWarp');

        const ASAPFolder = this.datGUI.addFolder('ASAP');
        ASAPFolder.add(this.ASAP, 'enableASAP');
        ASAPFolder.add(this.ASAP, 'barycentricCoordMode').name('barycentricMode').onChange(() => this.ASAP.onModeChange());
        ASAPFolder.add(this.ASAP, 'resetASAP');

        this.datGUI.add(this.objectMgr, 'setAllMeshWireFrameVisible').name('wireFrameVisible')
        this.datGUI.add(this.objectMgr, 'setAllMeshVerticesPointsVisible').name('verticesVisible')
    }

    async testCreateMesh()
    {
        //initial TEST
        const blendColor = new THREE.Vector4(1, 1, 1, 1);
        this.testMesh = await this.objectMgr.createGridMesh(testImgPath, blendColor);

        // store initial position buffer attribute
        const geo = this.testMesh.geometry as THREE.PlaneBufferGeometry;
        const positionAttribute = geo.getAttribute('position');
        this.defaultPositionAttribute = positionAttribute.clone();

        console.log(this.testMesh);
        this.meshEditor.load(this.testMesh, this.testMesh.verticesPoints, this.testMesh.triMesh);
        this.scene.add(this.meshEditor.selectedFacesMeshes);

        //asap test
        this.ASAP.initializeFromMesh(this.testMesh);
    }

    warp()
    {
        //reset
        this.resetWarp()

        //apply rotation deg of object
        const matrix = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(this.testWarpDegree));
        this.testMesh.applyMatrix4(matrix);
        this.testMesh.updateMatrix();
        this.testMesh.updateMatrixWorld();

        //copy origin vertices position
        const geo = this.testMesh.geometry as THREE.PlaneBufferGeometry;
        const positionAttribute = geo.getAttribute('position');
        var vertices = geo.attributes.position.array;

        // apply position to world space
        const vertexWorldPos: THREE.Vector3[] = [];
        for (let i = 0; i < vertices.length; i = i + 3)
        {
            const vec = new THREE.Vector3().fromBufferAttribute(positionAttribute, i / 3);
            this.testMesh.localToWorld(vec)
            vertexWorldPos.push(vec);
        }

        //apply revert rotation deg of object
        const revertMatrix = new THREE.Matrix4().makeRotationY(-THREE.MathUtils.degToRad(this.testWarpDegree));
        this.testMesh.applyMatrix4(revertMatrix);
        this.testMesh.updateMatrix();
        this.testMesh.updateMatrixWorld();

        // apply position to local space
        for (let i = 0; i < vertexWorldPos.length; i++)
        {
            this.testMesh.worldToLocal(vertexWorldPos[i]);
        }

        for (let i = 0; i < vertices.length; i = i + 3)
        {
            //a vertex' position is (vertices[i],vertices[i+1],vertices[i+2])
            if (vertices[i] == -50 || vertices[i] == 50)
                continue;
            if (vertices[i + 1] == -50 || vertices[i + 1] == 50)
                continue;
            const vertexIndex = i / 3;
            geo.attributes.position.setXY(vertexIndex, vertexWorldPos[vertexIndex].x, vertexWorldPos[vertexIndex].y);
        }
        geo.attributes.position.needsUpdate = true;
    }

    resetWarp()
    {
        const geo = this.testMesh.geometry as THREE.PlaneBufferGeometry;
        const positionAttribute = geo.getAttribute('position') as THREE.BufferAttribute;
        positionAttribute.copy(this.defaultPositionAttribute)
        positionAttribute.needsUpdate = true;
    }

    resetViewPort()
    {
        console.log("reset viewport")
        this.viewportControls.camera.position.set(0, 0, 150)
    }

    animate()
    {
        requestAnimationFrame(this.animate.bind(this));
        this.viewportControls.render(this.scene);
    }

    clear()
    {

    }
}
