import * as THREE from 'three';
import GridMesh3D from 'three/object/GridMesh3D';
import OpenMesh from "OpenMesh";
import FragmentShader from "three/shader/FragmentShader";
import VertexShader from "three/shader/VertexShader";
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import CustomTriMesh from '../../CustomTriMesh';

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

    constructor(iScene: THREE.Scene, iOpenMesh: OpenMesh)
    {

        this.scene = iScene;
        this.openMeshController = iOpenMesh;

        // this.defaultGeo = new THREE.PlaneBufferGeometry(100, 100, 10, 10);
        // this.defaultMat = new THREE.MeshBasicMaterial({ color: 'red' });

        this.objExporter = new OBJExporter();
        this.textureLoader = new THREE.TextureLoader();
    }

    public async createGridMesh(testImgPath, blendColor)
    {
        const geo = new THREE.PlaneBufferGeometry(1, 1, 8, 8);

        const textureMap = await this.textureLoader.loadAsync(testImgPath);
        textureMap.wrapS = THREE.RepeatWrapping;
        textureMap.wrapT = THREE.RepeatWrapping;

        const uniforms = {
            map: { value: textureMap },
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

        const gridMesh = new GridMesh3D(geo, mat);
        this.scene.add(gridMesh);
        this.gridMeshAry.push(gridMesh);

        const triMeshData = await this.parseTriMesh(gridMesh);
        gridMesh.setTriMesh(triMeshData);

        return gridMesh
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
        console.log(removeChildrenObjFormat);
        const meshConnectivity = await this.openMeshController.read(removeChildrenObjFormat, customtriMesh);

        return meshConnectivity
    }

    public setAllMeshWireFrameVisible()
    {
        this.gridMeshAry.forEach((gird) =>
        {
            gird.setWireFrameVisible(!this.allWireFrameVisible)
        })
        this.allWireFrameVisible = !this.allWireFrameVisible;
    }

    public setAllMeshVerticesPointsVisible(option: boolean)
    {
        this.gridMeshAry.forEach((gird) =>
        {
            gird.setVerticesPointsVisible(!this.allVerticesVisible)
        })
        this.allVerticesVisible = !this.allVerticesVisible;
    }
}