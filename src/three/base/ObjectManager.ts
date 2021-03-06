import * as THREE from 'three';
import GridMesh3D, { TextureSource } from 'three/object/GridMesh3D';
import OpenMesh from "OpenMesh";
import FragmentShader from "three/shader/FragmentShader";
import VertexShader from "three/shader/VertexShader";
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import CustomTriMesh from '../../CustomTriMesh';
const testImageSeqPath = 'Images/car_1000x1000/';
const imageSeqAmount = 360;
export default class ObjectManager
{
    // scene
    scene: THREE.Scene

    // default geometry, material
    defaultGeo: THREE.PlaneBufferGeometry
    defaultMat: THREE.MeshBasicMaterial

    // test mesh object array
    gridMeshAry: GridMesh3D[];

    // manager
    textureLoader: THREE.TextureLoader;
    objExporter: OBJExporter;
    openMeshController: OpenMesh;

    // attribute
    allWireFrameVisible: boolean = true;
    allVerticesVisible: boolean = true;

    // object parameter
    gridSegments: number;
    textureWidth: number;
    textureHeight: number;
    geoScaleDownRate: number;
    sourceTextureIndex: number

    // delaunay geometry
    preComputeDelaunayGeo: THREE.BufferGeometry[];

    //
    preLoadTexturesAry: THREE.Texture[]

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
        this.geoScaleDownRate = 1;
        this.sourceTextureIndex = 0;

        this.gridMeshAry = [];
        this.preComputeDelaunayGeo = [];
        this.preLoadTexturesAry = [];
    }

    public async createGridMesh(sourceImgPath: string, targetImgPath: string)
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


    public async updateTextureByFrameIndex(index: number)
    {
        // check if the same
        if (this.sourceTextureIndex == index) return;

        this.sourceTextureIndex = index

        console.log("update texture image index", this.sourceTextureIndex)
        if (this.sourceTextureIndex >= imageSeqAmount)
            this.sourceTextureIndex = 0;
        if (this.gridMeshAry[0] !== undefined)
        {
            if (this.sourceTextureIndex >= imageSeqAmount)
                return;
            // const imgPath = `${testImageSeqPath}${this.sourceTextureIndex}.png`;
            // const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            // sourceTextureMap.wrapS = THREE.RepeatWrapping;
            // sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.gridMeshAry[0].updateTextureByThreeTexture(this.preLoadTexturesAry[this.sourceTextureIndex])
        }
    }

    public async preloadTexture()
    {
        console.log("preload texture")
        for (let i = 0; i < imageSeqAmount; i++)
        {
            const imgPath = `${testImageSeqPath}${i}.png`;
            const sourceTextureMap = await this.textureLoader.loadAsync(imgPath);
            sourceTextureMap.wrapS = THREE.RepeatWrapping;
            sourceTextureMap.wrapT = THREE.RepeatWrapping;
            this.preLoadTexturesAry.push(sourceTextureMap)
        }
        console.log("preload texture complete")
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