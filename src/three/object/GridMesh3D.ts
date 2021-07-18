import * as THREE from 'three'

export default class GridMesh3D extends THREE.Mesh {


    verticesMat: THREE.PointsMaterial
    wireframeMat: THREE.MeshBasicMaterial

    verticesPoints: THREE.Points;
    wireframe: THREE.Mesh;

    constructor(geo, mat) {
        super(geo, mat);

        this.verticesMat = new THREE.PointsMaterial({
            size: 3,
            color: "green",
        });
        this.wireframeMat = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 'red',
        });

        this.createWireFrame();
        this.createVerticesPoints();
    }

    private createWireFrame() {
        this.wireframe = new THREE.Mesh(this.geometry, this.wireframeMat);
        this.wireframe.renderOrder = 3;

        this.add(this.wireframe);
    }

    private createVerticesPoints() {

        this.verticesPoints = new THREE.Points(this.geometry, this.verticesMat);
        this.renderOrder = 5;

        this.add(this.verticesPoints);
    }
}