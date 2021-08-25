import * as THREE from 'three';
import GridMesh3D, { TextureSource } from 'three/object/GridMesh3D';
import OpenMesh from "OpenMesh";
import FragmentShader from "three/shader/FragmentShader";
import VertexShader from "three/shader/VertexShader";
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import CustomTriMesh from '../../CustomTriMesh';
const testImageSeqPath = 'Images/red_bag/';
const imageSeqAmount = 72;
export default class ObjectManager
{

    scene: THREE.Scene

    defaultGeo: THREE.PlaneBufferGeometry
    defaultMat: THREE.MeshBasicMaterial

    gridMeshAry: GridMesh3D[] = [];

    textureLoader: THREE.TextureLoader;
    objExporter: OBJExporter;
    openMeshController: OpenMesh;

    allWireFrameVisible: boolean = true;
    allVerticesVisible: boolean = true;

    gridSegments: number;
    textureWidth: number;
    textureHeight: number;
    geoScaleDownRate: number;

    constructor(iScene: THREE.Scene, iOpenMesh: OpenMesh)
    {

        this.scene = iScene;
        this.openMeshController = iOpenMesh;

        // this.defaultGeo = new THREE.PlaneBufferGeometry(100, 100, 10, 10);
        // this.defaultMat = new THREE.MeshBasicMaterial({ color: 'red' });

        this.objExporter = new OBJExporter();
        this.textureLoader = new THREE.TextureLoader();
        this.gridSegments = 20;
        this.textureWidth = 0;
        this.textureHeight = 0;
        this.geoScaleDownRate = 10;
    }

    public async createGridMesh(sourceImgPath, targetImgPath, blendColor)
    {
        const sourceTextureMap = await this.textureLoader.loadAsync(sourceImgPath);
        sourceTextureMap.wrapS = THREE.RepeatWrapping;
        sourceTextureMap.wrapT = THREE.RepeatWrapping;
        this.textureWidth = sourceTextureMap.image.width;
        this.textureHeight = sourceTextureMap.image.height;
        console.log("texture size", this.textureWidth, this.textureHeight);

        const targetTextureMap = await this.textureLoader.loadAsync(targetImgPath);
        targetTextureMap.wrapS = THREE.RepeatWrapping;
        targetTextureMap.wrapT = THREE.RepeatWrapping;

        const uniforms = {
            map: { value: sourceTextureMap },
            uvOffset: { value: new THREE.Vector2(0, 0) },
            blendColor: { value: blendColor }
        };

        const mat = new THREE.ShaderMaterial({
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: uniforms
        })

        const geoWidth = this.textureWidth / this.geoScaleDownRate;
        const geoHeight = this.textureHeight / this.geoScaleDownRate;
        const geo = new THREE.PlaneBufferGeometry(geoWidth, geoHeight, this.gridSegments, this.gridSegments);

        const gridMesh = new GridMesh3D(geo, mat);
        gridMesh.sourceTextureMap = sourceTextureMap.clone();
        gridMesh.targetTextureMap = targetTextureMap.clone();
        gridMesh.sourceTextureMap.needsUpdate = true; //need call update function
        gridMesh.targetTextureMap.needsUpdate = true; //need call update function
        this.scene.add(gridMesh);
        this.gridMeshAry.push(gridMesh);

        const triMeshData = await this.parseTriMesh(gridMesh);
        gridMesh.setTriMesh(triMeshData);

        return gridMesh
    }


    public async updateTextureByFrameIndex(index)
    {
        let sourceViewIndex = Math.round(index / 10);
        console.log(sourceViewIndex)
        sourceViewIndex *= 2; //skip middle view
        if (sourceViewIndex >= imageSeqAmount)
            sourceViewIndex = 0;
        if (this.gridMeshAry[0] !== undefined)
        {
            if (sourceViewIndex >= imageSeqAmount)
                return;
            const imgPath = `${testImageSeqPath}frame${sourceViewIndex}.png`;
            const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            sourceTextureMap.wrapS = THREE.RepeatWrapping;
            sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.gridMeshAry[0].updateTextureByThreeTexture(sourceTextureMap)
        }
    }

    public switchTextureMap()
    {
        if (this.gridMeshAry[0] !== undefined)
        {
            if (this.gridMeshAry[0].textureType == TextureSource.SourceView)
            {

                this.gridMeshAry[0].updateTexture(TextureSource.TargetView)
            }
            else
            {
                this.gridMeshAry[0].updateTexture(TextureSource.SourceView)
            }
        }
    }

    private async parseTriMesh(mesh: THREE.Object3D)
    {
        //triMesh
        const customtriMesh = new CustomTriMesh();
        const originObjFormat = this.objExporter.parse(mesh);

        // objExporter will parse all the children object, 
        // so need to get the substring of origin format
        // make sure the obj format is only the target mesh
        const secondObjTagFormatIndex = originObjFormat.indexOf('o ', 1);
        const removeChildrenObjFormat = originObjFormat.substring(0, secondObjTagFormatIndex)
        // console.log(removeChildrenObjFormat);
        const meshConnectivity = await this.openMeshController.read(removeChildrenObjFormat, customtriMesh);

        return meshConnectivity
    }

    public setAllMeshWireFrameVisible()
    {
        // this.gridMeshAry.forEach((gird) =>
        // {
        //     gird.setWireFrameVisible(!this.allWireFrameVisible)
        // })
        // this.allWireFrameVisible = !this.allWireFrameVisible;

        this.gridMeshAry[0].setWireFrameVisible(!this.allWireFrameVisible)
        this.allWireFrameVisible = !this.allWireFrameVisible;
    }

    public setAllMeshVerticesPointsVisible(option: boolean)
    {
        // this.gridMeshAry.forEach((gird) =>
        // {
        //     gird.setVerticesPointsVisible(!this.allVerticesVisible)
        // })
        // this.allVerticesVisible = !this.allVerticesVisible;

        this.gridMeshAry[0].setVerticesPointsVisible(!this.allVerticesVisible)
        this.allVerticesVisible = !this.allVerticesVisible;
    }
}