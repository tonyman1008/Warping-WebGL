import * as THREE from 'three'
import ViewportController from "./base/ViewportController";
import ObjectManager from './base/ObjectManager';
import OpenMesh from "OpenMesh";
import MeshEditor from './MeshEditor';
import * as dat from "dat.gui";
import GridMesh3D from './object/GridMesh3D';
import ARAP from './ARAP/ARAP';
import testImgPath from 'assets/Image/car_1000x1000/0.png';
import testImgPath2 from 'assets/Image/car_1000x1000/5.png';
import matchPointsData from 'assets/MatchPointsData/cake/frame0&frame3/MatchPoints.json';
import CorrespondenceData from 'assets/MatchPointsData/car_1000x1000/unity-output/PotionData_60vertices_72view_5degDiff.json';
import { getGeometry } from './Delaunator';

declare global
{
    interface Window
    {
        three: any;
    }
}

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
    rightargetMsh: GridMesh3D;

    defaultPositionAttribute: THREE.BufferAttribute;
    ARAP: ARAP;

    soruceTestPoints: THREE.Mesh[];
    targetTestPoints: THREE.Mesh[];

    //utility
    frameIndex2DText: HTMLElement;

    constructor()
    {
        window.three = this;
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

        this.frameIndex2DText = document.getElementById("frameIndex") as HTMLElement
        this.frameIndex2DText.innerHTML = this.ARAP.warpFrameIndex.toString();

        this.soruceTestPoints = [];
        this.targetTestPoints = [];
        this.testDelaunayRemesh();
        this.setGUI()
    }

    setGUI()
    {
        //Basic gui setting
        this.datGUI.width = '400px'

        const ARAPFolder = this.datGUI.addFolder('ARAP');
        ARAPFolder.open();
        ARAPFolder.add(this.ARAP, 'enableARAP');
        ARAPFolder.add(this.ARAP, 'resetARAP');
        ARAPFolder.add(this.ARAP, 'testMatchPoints').name('matchVertices');
        ARAPFolder.add(this.ARAP, 'testMatchPointsBarycentry').name('matchBarycentry')
        ARAPFolder.add(this.ARAP.LinearAlgebra, 'w', 1, 10000, 1).name('weight');
        ARAPFolder.add(this.ARAP, 'warpFrameIndex', 0, this.ARAP.targetFramesAmount - 1, 1).listen().onChange((val) =>
        {
            this.ARAP.warpFrame();
            this.frameIndex2DText.innerHTML = val;
        })
        ARAPFolder.add(this.ARAP, 'playPreWarpFrameAnimation');
        ARAPFolder.add(this.ARAP, 'playViewHoppingAnimation');
        ARAPFolder.add(this.ARAP, 'animationFPS', 1, 60, 1);

        const basicFunctionFolder = this.datGUI.addFolder('Basic Function');
        basicFunctionFolder.open();
        basicFunctionFolder.add(this.objectMgr, 'setAllMeshWireFrameVisible').name('wireFrameVisible')
        basicFunctionFolder.add(this.objectMgr, 'setAllMeshVerticesPointsVisible').name('verticesVisible')
        basicFunctionFolder.add(this, 'setAllTargetPointVisible')
        basicFunctionFolder.add(this, 'setAllSourcePointVisible')
        basicFunctionFolder.add(this.ARAP, 'setAllHandlesVisible').name('handlesVisible');
    }

    async testCreateMesh()
    {
        //initial TEST
        const blendColor = new THREE.Vector4(1, 1, 1, 1);
        this.testMesh = await this.objectMgr.createGridMesh(testImgPath, testImgPath2, blendColor);
        this.viewportControls.setCameraPosToFitObject(this.testMesh);

        // store initial position buffer attribute
        const geo = this.testMesh.geometry as THREE.PlaneBufferGeometry;
        const positionAttribute = geo.getAttribute('position');
        this.defaultPositionAttribute = positionAttribute.clone();

        // console.log(this.testMesh);
        this.meshEditor.load(this.testMesh, this.testMesh.verticesPoints, this.testMesh.triMesh);
        this.scene.add(this.meshEditor.selectedFacesMeshes);

        this.loadMatchPoints();

        //ARAP test
        // this.ARAP.initializeFromMesh(this.testMesh);
    }

    async testDelaunayRemesh()
    {
        //initial TEST
        const blendColor = new THREE.Vector4(1, 1, 1, 1);
        this.testMesh = await this.objectMgr.createGridMesh(testImgPath, testImgPath2, blendColor);
        this.viewportControls.setCameraPosToFitObject(this.testMesh);

        const { textureWidth, textureHeight, geoScaleDownRate } = this.objectMgr;

        // store initial position buffer attribute
        let originGeo = this.testMesh.geometry as THREE.PlaneBufferGeometry;
        const positionAttribute = originGeo.getAttribute('position');
        let PositionAttributeAry = positionAttribute.clone().array;

        for (let i = 0; i < CorrespondenceData.matchPointSeqData.length; i++)
        {
            const jsonArray = CorrespondenceData.matchPointSeqData[i].matchPoints;
            let remeshPoint = Array.from(PositionAttributeAry);

            for (let j = 0; j < jsonArray.length; j++)
            {
                // image domain anchor is leftTop (right, down are positive)
                // texture domain anchor is middle (right, top are positive)
                // need to parse match points data(image domain);

                //source
                const srcX = (jsonArray[j].keyPointOne[0] - textureWidth / 2) / geoScaleDownRate;
                const srcY = (textureHeight / 2 - jsonArray[j].keyPointOne[1]) / geoScaleDownRate;
                const srcZ = 0;

                // const srcGeo = new THREE.SphereGeometry(4);
                // const srcMat = new THREE.MeshBasicMaterial({ color: 'green' });
                // const srcTestSphere = new THREE.Mesh(srcGeo, srcMat);
                // srcTestSphere.position.set(srcX, srcY, srcZ)
                // this.scene.add(srcTestSphere);
                // this.soruceTestPoints.push(srcTestSphere);

                //target
                const tgtX = (jsonArray[j].keyPointTwo[0] - textureWidth / 2) / geoScaleDownRate;
                const tgtY = (textureHeight / 2 - jsonArray[j].keyPointTwo[1]) / geoScaleDownRate;
                const tgtZ = 0;

                // const tgtGeo = new THREE.SphereGeometry(4);
                // const tgtMat = new THREE.MeshBasicMaterial({ color: 'blue' });
                // const tgtTestSphere = new THREE.Mesh(tgtGeo, tgtMat);
                // tgtTestSphere.position.set(tgtX, tgtY, tgtZ)
                // this.scene.add(tgtTestSphere);
                // this.targetTestPoints.push(tgtTestSphere);

                let srcPoint = [srcX, srcY, srcZ];
                let tgtPoint = [tgtX, tgtY, tgtZ];
                remeshPoint = remeshPoint.concat(srcPoint, tgtPoint);
            }
            let delaunayGeo = getGeometry(remeshPoint, textureWidth, textureHeight);
            console.log("delaunayGeo", delaunayGeo.attributes.position.count)
            this.objectMgr.preComputeDelaunayGeo.push(delaunayGeo);
        }

        this.testMesh.updateGeometry(this.objectMgr.preComputeDelaunayGeo[0]);

        await this.loadMatchPoints();

        this.ARAP.targetMesh = this.testMesh;
        // this.ARAP.initializeFromMesh(this.testMesh);
    }

    //TODO: rewrite format
    async loadMatchPoints()
    {
        const { textureWidth, textureHeight, geoScaleDownRate } = this.objectMgr;
        const matchPointsSeqData = CorrespondenceData.matchPointSeqData;
        console.log("matchPointsSeq length", matchPointsSeqData.length);
        for (let i = 0; i < matchPointsSeqData.length; i++)
        {
            const jsonArray = matchPointsSeqData[i].matchPoints
            const MatchPointsArray = [];
            for (let j = 0; j < jsonArray.length; j++)
            {
                // image domain anchor is leftTop (right, down are positive)
                // texture domain anchor is middle (right, top are positive)
                // need to parse match points data(image domain);

                //source
                const srcX = (jsonArray[j].keyPointOne[0] - textureWidth / 2) / geoScaleDownRate;
                const srcY = (textureHeight / 2 - jsonArray[j].keyPointOne[1]) / geoScaleDownRate;
                const srcZ = 0;
                const srcMatchPos = new THREE.Vector3(srcX, srcY, srcZ)

                //target
                const tgtX = (jsonArray[j].keyPointTwo[0] - textureWidth / 2) / geoScaleDownRate;
                const tgtY = (textureHeight / 2 - jsonArray[j].keyPointTwo[1]) / geoScaleDownRate;
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

            for (let k = 0; k < 4; k++)
            {
                //set four corner to tgt and src match points;
                const matchPosPair = { src: corners[k], tgt: corners[k] };
                MatchPointsArray.push(matchPosPair);
            }

            // area constraint
            const sqareIndex = 9;
            for (let k = -sqareIndex; k < sqareIndex; k++)
            {
                const testPoints = new THREE.Vector3(textureWidth / 2 * k * 0.1, textureHeight / 2 * sqareIndex * 0.1, 0);
                const testPointsDown = new THREE.Vector3(textureWidth / 2 * k * 0.1, -textureHeight / 2 * sqareIndex * 0.1, 0);
                const matchPosPair = { src: testPoints, tgt: testPoints };
                const matchPosPairDown = { src: testPointsDown, tgt: testPointsDown };
                MatchPointsArray.push(matchPosPair, matchPosPairDown);
            }

            for (let k = -sqareIndex; k < sqareIndex; k++)
            {
                const testPoints = new THREE.Vector3(textureWidth / 2 * sqareIndex * 0.1, textureHeight / 2 * k * 0.1, 0);
                const testPointsDown = new THREE.Vector3(-textureWidth / 2 * sqareIndex * 0.1, textureHeight / 2 * k * 0.1, 0);
                const matchPosPair = { src: testPoints, tgt: testPoints };
                const matchPosPairDown = { src: testPointsDown, tgt: testPointsDown };
                MatchPointsArray.push(matchPosPair, matchPosPairDown);
            }

            this.ARAP.matchPointsSeqArray.push(MatchPointsArray)
        }
    }

    setAllSourcePointVisible()
    {
        this.soruceTestPoints.forEach((point) =>
        {
            point.visible = !point.visible
        });
    }

    setAllTargetPointVisible()
    {
        this.targetTestPoints.forEach((point) =>
        {
            point.visible = !point.visible
        });
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
