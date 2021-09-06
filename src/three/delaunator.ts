import Delaunator from "delaunator";
import * as THREE from "three";

function getGeometry(keyPoints: number[], width: number, height: number)
{
    const points3d = [];
    for (let i = 0; i < keyPoints.length; i += 3)
    {
        points3d.push(
            new THREE.Vector3(
                keyPoints[i],
                keyPoints[i + 1],
                0
            )
        );
    }
    const result = Delaunator.from(
        points3d.map((v) =>
        {
            return [v.x, v.y];
        })
    );
    const meshIndex = [];
    const triangles = result.triangles;
    for (let i = 0; i < triangles.length; i++)
    {
        meshIndex.push(triangles[i]);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points3d);

    geometry.setIndex(meshIndex);
    geometry.computeVertexNormals();
    getUV(geometry);
    console.log("remeshing complete !!")
    return geometry;
}

function getUV(geometry: THREE.BufferGeometry)
{
    geometry.computeBoundingBox();
    const { min, max } = geometry.boundingBox;
    const position = geometry.attributes["position"].array;
    const uv = [];
    for (let i = 0; i < position.length; i += 3)
    {
        const u = (position[i] + max.x) / (max.x - min.x);
        const v = (position[i + 1] + max.y) / (max.y - min.y);
        uv.push(u, v);
    }
    geometry.setAttribute(
        "uv",
        new THREE.BufferAttribute(Float32Array.from(uv), 2)
    );
}
export { getGeometry };
