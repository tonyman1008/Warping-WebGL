import * as THREE from 'three'
import ViewportController from "./base/ViewportController";
import ObjectManager from './base/ObjectManager';
import OpenMesh from "OpenMesh";
import MeshEditor from './MeshEditor';
import * as dat from "dat-gui";
import GridMesh3D from './object/GridMesh3D';
import ARAP from './ARAP/ARAP';
import testImgPath from 'assets/Image/red_bag/frame0.png';
import testImgPath2 from 'assets/Image/red_bag/frame0.png';
import matchPointsData from 'assets/MatchPointsData/cake/frame0&frame3/MatchPoints.json';
import MatchPointsSeqData from 'assets/MatchPointsData/red_bag/Manual/MatchPointsSeqData.json';

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
    leftTargetMesh: GridMesh3D;
    rightargetMesh: GridMesh3D;

    testWarpDegree: number;
    defaultPositionAttribute: THREE.BufferAttribute;
    ARAP: ARAP;

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
        this.datGUI = new dat.GUI({ width: 300 });

        this.ARAP = new ARAP(this.viewportControls.camera, this.objectMgr, this.scene, this.container);

        this.testWarpDegree = 0;
        this.testCreateMesh();
        this.setGUI()
    }

    setGUI()
    {
        //Basic gui setting
        this.datGUI.width = '450px'

        const uniformWarpFolder = this.datGUI.addFolder('UniformWarp');
        uniformWarpFolder.add(this, 'testWarpDegree', -30, 30, 1).name('warpDeg').onChange(this.warp.bind(this));
        uniformWarpFolder.add(this, 'resetViewPort');
        uniformWarpFolder.add(this, 'resetWarp');

        const ARAPFolder = this.datGUI.addFolder('ARAP');
        ARAPFolder.open();
        ARAPFolder.add(this.ARAP, 'enableARAP');
        ARAPFolder.add(this.ARAP, 'barycentricCoordMode').name('barycentricMode').onChange(() => this.ARAP.onModeChange()).listen();
        ARAPFolder.add(this.ARAP, 'setAllHandlesVisible').name('handlesVisible');
        ARAPFolder.add(this.ARAP, 'resetARAP');
        ARAPFolder.add(this.ARAP, 'testMatchPoints').name('matchVertices');
        ARAPFolder.add(this.ARAP, 'testMatchPointsBarycentry').name('matchBarycentry')
        ARAPFolder.add(this.ARAP, 'preComputeWarpFrame').name('computeFrame');
        ARAPFolder.add(this.ARAP.LinearAlgebra, 'w', 1, 100, 1).name('weight');
        ARAPFolder.add(this.ARAP, 'warpRatio', 0, 1, 0.1).onChange(() =>
        {
            this.ARAP.warpMatchPoints();
        })
        ARAPFolder.add(this.ARAP, 'warpFrameIndex', 0, 360 - 1, 1).listen().onChange(() =>
        {
            this.ARAP.warpFrame();
        })
        ARAPFolder.add(this.ARAP, 'playPreWarpFrameAnimation');
        ARAPFolder.add(this.ARAP, 'playViewHoppingAnimation');
        ARAPFolder.add(this.ARAP, 'animationFPS', 1, 60, 1);

        const basicFunctionFolder = this.datGUI.addFolder('Basic Function');
        basicFunctionFolder.open();
        basicFunctionFolder.add(this.objectMgr, 'setAllMeshWireFrameVisible').name('wireFrameVisible')
        basicFunctionFolder.add(this.objectMgr, 'setAllMeshVerticesPointsVisible').name('verticesVisible')
        basicFunctionFolder.add(this, 'setTargetMeshVisible').name('TargetMeshVisible')
        basicFunctionFolder.add(this.objectMgr, 'switchTextureMap')
    }

    setTargetMeshVisible()
    {
        this.leftTargetMesh.visible = !this.leftTargetMesh.visible;
    }

    async testCreateMesh()
    {
        //initial TEST
        const blendColor = new THREE.Vector4(1, 1, 1, 1);
        this.testMesh = await this.objectMgr.createGridMesh(testImgPath, testImgPath2, blendColor);
        this.viewportControls.setCameraPosToFitObject(this.testMesh);

        // const blendColor2 = new THREE.Vector4(0, 255, 0, 0.5);
        // this.leftTargetMesh = await this.objectMgr.createGridMesh(testImgPath2, testImgPath, blendColor2);
        // this.leftTargetMesh.translateZ(-0.0001)
        // this.leftTargetMesh.setVerticesPointsVisible(false)
        // this.leftTargetMesh.setWireFrameVisible(false)
        // this.leftTargetMesh.visible = false

        // store initial position buffer attribute
        const geo = this.testMesh.geometry as THREE.PlaneBufferGeometry;
        const positionAttribute = geo.getAttribute('position');
        this.defaultPositionAttribute = positionAttribute.clone();

        // console.log(this.testMesh);
        this.meshEditor.load(this.testMesh, this.testMesh.verticesPoints, this.testMesh.triMesh);
        this.scene.add(this.meshEditor.selectedFacesMeshes);

        this.loadMatchPoints();

        //ARAP test
        this.ARAP.initializeFromMesh(this.testMesh);
    }

    //TODO: rewrite format
    loadMatchPoints()
    {
        const { textureWidth, textureHeight, geoScaleDownRate } = this.objectMgr;
        console.log("matchPointsSeq length", MatchPointsSeqData.length);
        for (let j = 0; j < MatchPointsSeqData.length; j++)
        {
            const jsonArray = MatchPointsSeqData[j].matchPoints
            const MatchPointsArray = [];
            for (let i = 0; i < jsonArray.length; i++)
            {
                // image domain anchor is leftTop (right, down are positive)
                // texture domain anchor is middle (right, top are positive)
                // need to parse match points data(image domain);

                //source
                const srcX = (jsonArray[i].keyPointOne[0] - textureWidth / 2) / geoScaleDownRate;
                const srcY = (textureHeight / 2 - jsonArray[i].keyPointOne[1]) / geoScaleDownRate;
                const srcZ = 0;
                const srcMatchPos = new THREE.Vector3(srcX, srcY, srcZ)

                //target
                const tgtX = (jsonArray[i].keyPointTwo[0] - textureWidth / 2) / geoScaleDownRate;
                const tgtY = (textureHeight / 2 - jsonArray[i].keyPointTwo[1]) / geoScaleDownRate;
                const tgtZ = 0;
                const tgtMatchPos = new THREE.Vector3(tgtX, tgtY, tgtZ)

                const matchPosPair = { src: srcMatchPos, tgt: tgtMatchPos };
                MatchPointsArray.push(matchPosPair);
            }

            //add four corners to be handles
            const leftTop = new THREE.Vector3(-textureWidth / geoScaleDownRate / 2, textureHeight / geoScaleDownRate / 2, 0);
            const leftDown = new THREE.Vector3(-textureWidth / geoScaleDownRate / 2, -textureHeight / geoScaleDownRate / 2, 0);
            const rightTop = new THREE.Vector3(textureWidth / geoScaleDownRate / 2, textureHeight / geoScaleDownRate / 2, 0);
            const rightDown = new THREE.Vector3(textureWidth / geoScaleDownRate / 2, -textureHeight / geoScaleDownRate / 2, 0);
            const corners = [leftTop, leftDown, rightTop, rightDown];
            for (let j = 0; j < 4; j++)
            {
                //set four corner to tgt and src match points;
                const matchPosPair = { src: corners[j], tgt: corners[j] };
                MatchPointsArray.push(matchPosPair);
            }

            // const leftTopCenter = new THREE.Vector3(-textureWidth / geoScaleDownRate / 2 * 0.2, textureHeight / geoScaleDownRate / 2 * 0.2, 0);
            // const leftDownCenter = new THREE.Vector3(-textureWidth / geoScaleDownRate / 2 * 0.2, -textureHeight / geoScaleDownRate / 2 * 0.2, 0);
            // const rightTopCenter = new THREE.Vector3(textureWidth / geoScaleDownRate / 2 * 0.2, textureHeight / geoScaleDownRate / 2 * 0.2, 0);
            // const rightDownCenter = new THREE.Vector3(textureWidth / geoScaleDownRate / 2 * 0.2, -textureHeight / geoScaleDownRate / 2 * 0.2, 0);
            // const cornersCenter = [leftTopCenter, leftDownCenter, rightTopCenter, rightDownCenter];
            // // add center constrain points
            // for (let j = 0; j < 4; j++)
            // {
            //     //set four corner to tgt and src match points;
            //     const matchPosPair = { src: cornersCenter[j], tgt: cornersCenter[j] };
            //     MatchPointsArray.push(matchPosPair);
            // }

            for (let i = 1; i < 3; i++)
            {
                const leftTopCenter_test = new THREE.Vector3(-textureWidth / geoScaleDownRate / 2 * (i / 10), textureHeight / geoScaleDownRate / 2 * (i / 10), 0);
                const leftDownCenter_test = new THREE.Vector3(-textureWidth / geoScaleDownRate / 2 * (i / 10), -textureHeight / geoScaleDownRate / 2 * (i / 10), 0);
                const rightTopCenter_test = new THREE.Vector3(textureWidth / geoScaleDownRate / 2 * (i / 10), textureHeight / geoScaleDownRate / 2 * (i / 10), 0);
                const rightDownCenter_test = new THREE.Vector3(textureWidth / geoScaleDownRate / 2 * (i / 10), -textureHeight / geoScaleDownRate / 2 * (i / 10), 0);
                const cornersCenter_test = [leftTopCenter_test, leftDownCenter_test, rightTopCenter_test, rightDownCenter_test];

                for (let j = 0; j < 4; j++)
                {
                    //set four corner to tgt and src match points;
                    const matchPosPair = { src: cornersCenter_test[j], tgt: cornersCenter_test[j] };
                    MatchPointsArray.push(matchPosPair);
                }
            }

            this.ARAP.matchPointsSeqArray.push(MatchPointsArray)
            // console.log("match points length", this.ARAP.matchPointsArray.length);
        }
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

    //TODO
    clear()
    {

    }
}
