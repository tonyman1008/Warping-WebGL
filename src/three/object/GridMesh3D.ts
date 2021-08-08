import * as THREE from 'three'
import TriMesh from 'OpenMesh/Mesh/TriMeshT';
export enum TextureSource
{
    SourceView = 0,
    TargetView = 1,
}
export default class GridMesh3D extends THREE.Mesh
{

    verticesMat: THREE.PointsMaterial
    wireframeMat: THREE.MeshBasicMaterial
    defaultVertexColor: THREE.Color;
    wireFrameRenderOrder: number;
    verticesPointsRenderOrder: number;
    sourceTextureMap: THREE.Texture;
    targetTextureMap: THREE.Texture;
    textureType: TextureSource;

    public verticesPoints: THREE.Points;
    public wireframe: THREE.Mesh;
    public triMesh: TriMesh;

    constructor(geo, mat)
    {
        super(geo, mat);

        this.verticesMat = new THREE.PointsMaterial({
            side: THREE.DoubleSide,
            size: 0.01,
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
        this.sourceTextureMap = null
        this.targetTextureMap = null
        this.textureType = TextureSource.SourceView;

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

        console.log("vertices length", verticeLength)
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

    public updateTexture(type: TextureSource)
    {
        if (this.textureType == type)
            return;

        if (this.textureType == TextureSource.SourceView)
        {
            (this.material as THREE.ShaderMaterial).uniforms.map.value = this.targetTextureMap;
            this.textureType = type;
        }
        else
        {
            (this.material as THREE.ShaderMaterial).uniforms.map.value = this.sourceTextureMap;
            this.textureType = type;
        }
    }

    public setTriMesh(triMesh: TriMesh)
    {
        this.triMesh = triMesh;
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