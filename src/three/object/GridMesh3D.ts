import * as THREE from 'three'
import TriMesh from 'OpenMesh/Mesh/TriMeshT';

export default class GridMesh3D extends THREE.Mesh
{

    verticesMat: THREE.PointsMaterial
    wireframeMat: THREE.MeshBasicMaterial
    defaultVertexColor: THREE.Color;
    wireFrameRenderOrder: number;
    verticesPointsRenderOrder: number;

    public verticesPoints: THREE.Points;
    public wireframe: THREE.Mesh;
    public triMesh: TriMesh;

    constructor(geo, mat)
    {
        super(geo, mat);

        this.verticesMat = new THREE.PointsMaterial({
            side: THREE.DoubleSide,
            size: 2,
            transparent: false,
            vertexColors: true,
        })
        this.wireframeMat = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 'red',
        });
        this.defaultVertexColor = new THREE.Color(0x00ff00);
        this.wireFrameRenderOrder = 1;
        this.verticesPointsRenderOrder = 5;

        this.createWireFrame();
        this.createVerticesPoints();
    }

    private createWireFrame()
    {
        this.wireframe = new THREE.Mesh(this.geometry, this.wireframeMat);
        this.wireframe.renderOrder = this.wireFrameRenderOrder;

        this.add(this.wireframe);
    }

    private createVerticesPoints()
    {
        const verticesPosition = this.geometry.getAttribute('position').array;
        // 3 value for a vertex item position
        const verticeLength = verticesPosition.length / 3;
        const vertextColor = [];

        console.log("vertices length", verticeLength / 3)
        for (let i = 0; i < verticeLength; i++)
        {
            const color = this.defaultVertexColor;
            vertextColor.push(color.r, color.g, color.b);
        }
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertextColor, 3));
        this.verticesPoints = new THREE.Points(this.geometry, this.verticesMat);
        this.verticesPoints.renderOrder = this.verticesPointsRenderOrder;

        this.add(this.verticesPoints);
    }

    public setTriMesh(triMesh: TriMesh)
    {
        this.triMesh = triMesh;
        console.log(this.triMesh)
    }

    public setWireFrameVisible(option: boolean)
    {
        this.wireframe.visible = option;
    }

    public setVerticesPointsVisible(option: boolean)
    {
        this.verticesPoints.visible = option;
    }
}