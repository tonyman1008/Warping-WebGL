import * as math from 'mathjs'
import {Edge} from './edge'
import * as THREE from 'three'

// function renderAxes(){
//   let colors = ['red','green','blue'];
//   for (let i = 0; i < 3; i++) {
//     let geometry = new THREE.Geometry();
//     let axis_color = colors[i];
//     switch (i) {
//       case 0:
//         geometry.vertices.push(new THREE.Vector3(-5, 0, 0));
//         geometry.vertices.push(new THREE.Vector3(5, 0, 0));
//         break;
//       case 1:
//         geometry.vertices.push(new THREE.Vector3(0, -5, 0));
//         geometry.vertices.push(new THREE.Vector3(0, 5, 0));
//         break;
//       case 2:
//         geometry.vertices.push(new THREE.Vector3(0, 0, 5));
//         geometry.vertices.push(new THREE.Vector3(0, 0, -5));
//         break;
//     };
//     let material = new THREE.LineBasicMaterial({ color: axis_color }); 
//     let axis =  new THREE.Line(geometry, material);
//     scene.add(axis);
//   };
// }

//???????
// function addNeighbors(neighbors,edge,face,faces){
//   let face =  faces[edge.parentFaceIndex];
//   let vertex1 = face.a;
//   let vertex2 = face.b;
//   let vertex3 = face.c;
  
//   if(!neighbors.includes(vertex1)){ neighbors.push(vertex1) };
//   if(!neighbors.includes(vertex2)){ neighbors.push(vertex2) };
//   if(!neighbors.includes(vertex3)){ neighbors.push(vertex3) };
  
//   return neighbors;
// }

// function drawEdge(edge,model){
//   drawMarker(createMarker(model.geometry.vertices[edge.start],edge.start));
//   drawMarker(createMarker(model.geometry.vertices[edge.end],edge.end));
// }

function getVertex(i,vertices){
  return vertices[i];
}

function getEdgeVectorFromEdge(edge,vertices){
  let edgeVector = math.sparse();
  let edgeEndVertex = getVertex(edge.end,vertices);
  let edgeStartVertex = getVertex(edge.start,vertices);
  
  edgeVector.set([0,0], edgeEndVertex.x - edgeStartVertex.x );
  edgeVector.set([1,0], edgeEndVertex.y - edgeStartVertex.y );
  
  return edgeVector;
}

function isBorderEdge(edge,faces){
  let isBorderEdge = null;
  let count = 0;
  for (let i = 0; i < faces.length; i++) {
    let edge1 = new Edge(faces[i].a,faces[i].b,i);
    let edge2 = new Edge(faces[i].b,faces[i].c,i);
    let edge3 = new Edge(faces[i].a,faces[i].c,i);
    if(edge.equals(edge1) || edge.equals(edge2) || edge.equals(edge3)){
      count ++;
    }
  }
  
  if(count < 2){
    isBorderEdge = true;
  }else{
    isBorderEdge = false;
  }
  return isBorderEdge;
}

function cloneVertices(vertices){
  let clonedVertices = [];
  for (let i = 0; i < vertices.length; i++) {
    clonedVertices.push(vertices[i].clone());
  }
  return clonedVertices;
}

function cloneHandles(handles){
  let clonedHandles = [];
  for (let i = 0; i < handles.length; i++) {
    clonedHandles.push(handles[i].clone());
  }
  return clonedHandles;
}

function getNeighborVerticesCoordinates(neighbors,vertices){
  let vertexCoordinates = math.sparse();
  let vertex = null;
  for (let k = 0; k < neighbors.length; k++) {
    vertex = getVertex(neighbors[k],vertices);
    vertexCoordinates.set([2*k,0],vertex.x);
    vertexCoordinates.set([2*k+1,0],vertex.y);
  }
  return vertexCoordinates;
}

function createTrianglesFromFaces(faces, vertices){
  let triangles = [];
  let v1,v2,v3;
  for (let i = 0; i < faces.length; i++) {
    v1 = getVertex(faces[i].a,vertices);
    v2 = getVertex(faces[i].b,vertices);
    v3 = getVertex(faces[i].c,vertices);
    
    let triangle = new THREE.Triangle(v1,v2,v3);
    triangle.v1Index = faces[i].a;
    triangle.v2Index = faces[i].b;
    triangle.v3Index = faces[i].c;
    triangles.push(triangle);
  }
  
  return triangles;
}

// // This is legacy code
//  function pseudoInverse(sparse){
//   let pseudoInverse = math.sparse();
//   let res = numeric.svd(sparse.toArray());
//   let U = math.sparse(res.U);
//   let S = math.sparse(res.S);
//   let V = math.sparse(res.V);
//   let tol = 5.3291e-15;
//   for (let i = 0; i < S.size()[0]; i++) {
//     if(S.get([i]) > tol){
//       S.set([i],1/S.get([i]));
//     }
//   }
//   S = math.diag(S);
//   pseudoInverse = math.multiply(math.multiply(V,S),math.transpose(U));
//   return pseudoInverse;
// }

export {getVertex,getEdgeVectorFromEdge,isBorderEdge,cloneVertices,cloneHandles,getNeighborVerticesCoordinates,createTrianglesFromFaces}
