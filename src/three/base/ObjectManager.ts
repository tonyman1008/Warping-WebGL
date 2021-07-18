import * as THREE from 'three';
import GridMesh3D from 'three/object/GridMesh3D';
import FragmentShader from "three/shader/FragmentShader";
import VertexShader from "three/shader/VertexShader";
import testImgPath from 'assets/img01.png';

export default class ObjectManager {

    scene: THREE.Scene

    defaultGeo: THREE.PlaneBufferGeometry
    defaultMat: THREE.MeshBasicMaterial

    gridMeshAry: THREE.Mesh[] = [];

    textureMap: THREE.Texture;
    textureLoader: THREE.TextureLoader;

    constructor(iScene: THREE.Scene) {

        this.scene = iScene;

        this.defaultGeo = new THREE.PlaneBufferGeometry(100, 100, 10, 10);
        this.defaultMat = new THREE.MeshBasicMaterial({ color: 'red' });

        this.textureLoader = new THREE.TextureLoader();

        this.textureMap = this.textureLoader.load(testImgPath);
        this.textureMap.wrapS = THREE.RepeatWrapping;
        this.textureMap.wrapT = THREE.RepeatWrapping;
    }

    public createGridMesh() {
        const geo = new THREE.PlaneBufferGeometry(100, 100, 10, 10);
        const uniforms = {
            map: { value: this.textureMap },
            uvOffset: { value: new THREE.Vector2(0, 0) }
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
    }
}