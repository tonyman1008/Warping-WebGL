import * as THREE from "three";
import TriMesh from "OpenMesh/Mesh/TriMeshT";
import { FaceHandle, VertexHandle } from "OpenMesh/Mesh/Handles/Handles";
import { MeshBasicMaterial } from "three";

let self: MeshEditor;

function getL2Distance(point: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3): number
{
  point.distanceTo(v1)
  return point.distanceTo(v1) + point.distanceTo(v2) + point.distanceTo(v3);
}

export default class MeshEditor
{
  public mesh: THREE.Mesh;
  public points: THREE.Points;
  public selectedFacesMeshes: THREE.Group = new THREE.Group();
  //
  private camera: THREE.Camera;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  //
  private triMesh: TriMesh;
  private selectMode: boolean = true;
  private selectedFaces: FaceHandle[];
  private selectedPoints: VertexHandle[];
  private renderedFaceIndex: number[];
  private renderedPointsIndex: number[];
  //
  private initPointsColor: number[];
  private _pointScale: number;
  //
  private vertexColor = new THREE.Color('blue');
  private triangleMeshColor = new THREE.Color(0x426ff5);
  //

  constructor(iCamera)
  {
    this.camera = iCamera;
    this.selectedPoints = [];
    this.selectedFaces = [];
    this.renderedFaceIndex = [];
    this.renderedPointsIndex = [];
    self = this;
  }

  set pointScale(value: number)
  {
    this._pointScale = value;
    this.selectedFacesMeshes.scale.setScalar(value)
  }

  get pointScale()
  {
    return this._pointScale;
  }

  load(mesh: THREE.Mesh, points: THREE.Points, triMesh: TriMesh)
  {
    this.triMesh = triMesh;
    this.mesh = mesh;
    this.points = points;
    this.pointScale = 1;
    const pointsGeometry = points.geometry as THREE.BufferGeometry;
    this.initPointsColor = Array.from(pointsGeometry.getAttribute("color").array);
    // this.attachPointerEvent();
  }

  setVertexColor(vertexHandles: VertexHandle[], color: THREE.Color)
  {
    const geometry = this.points.geometry as THREE.BufferGeometry;
    const colors = Array.from(geometry.getAttribute("color").array);

    for (let i = 0; i < vertexHandles.length; i++)
    {
      const index = vertexHandles[i].idx();
      colors[3 * index] = color.r;
      colors[3 * index + 1] = color.g;
      colors[3 * index + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    geometry.attributes.color.needsUpdate = true;
  }

  async createTriangle(faceHandles: FaceHandle[], color: THREE.Color)
  {
    const op = this.triMesh;
    const geometry = new THREE.BufferGeometry();
    const vertices = []
    for (let i = 0; i < faceHandles.length; i++)
    {
      for (let fv_it = op.fv_cwiter(faceHandles[i]); fv_it.is_valid(); await fv_it.next())
      {
        const pointPos = op.point(fv_it.handle());
        vertices.push(pointPos.x, pointPos.y, pointPos.z);
      }
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    const material = new MeshBasicMaterial({ color })
    return new THREE.Mesh(geometry, material);
  }

  openMeshDemo(e)
  {
    if (e.key === "e" || e.key === "E")
    {
      if (self.selectMode)
      {
        self.findOneRingVertices();
      } else
      {
        self.findOneRingFaces();
      }
    } else if (e.key === "q" || e.key === "Q")
    {
      self.selectMode = !self.selectMode;
      self.clearSelected();
    }
  }

  async findOneRingVertices()
  {
    const oneRingVertices: VertexHandle[] = [];
    if (this.selectedPoints.length > 0)
    {
      for (let i = 0; i < this.selectedPoints.length; i++)
      {
        for (let vv_cwiter = self.triMesh.vv_cwbegin(this.selectedPoints[i]); vv_cwiter.is_valid(); await vv_cwiter.next())
        {
          if (oneRingVertices.find(handle => handle.idx() === vv_cwiter.handle().idx()) === undefined)
          {
            if (!this.renderedPointsIndex.includes(vv_cwiter.handle().idx()))
            {
              oneRingVertices.push(vv_cwiter.handle());
              //record the rendered faces' index.
              this.renderedPointsIndex.push(vv_cwiter.handle().idx());
              const handle = vv_cwiter.handle()
              oneRingVertices.push(handle);
            }
          }
        }
      }
      this.selectedPoints = [];
      this.setVertexColor(oneRingVertices, this.vertexColor);
      this.selectedPoints = Array.from(oneRingVertices);
    }
  }

  async findOneRingFaces()
  {
    const oneRingFaces = []
    if (this.selectedFaces.length > 0)
    {
      for (let i = 0; i < this.selectedFaces.length; i++)
      {
        for (let ff_iter = self.triMesh.ff_cwiter(this.selectedFaces[i]); ff_iter.is_valid(); await ff_iter.next())
        {
          //determine whether the face has been rendered, if so, ignore the rendered face.
          if (oneRingFaces.find(handle => handle.idx() === ff_iter.handle().idx()) === undefined)
          {
            if (!this.renderedFaceIndex.includes(ff_iter.handle().idx()))
            {
              oneRingFaces.push(ff_iter.handle());
              //record the rendered faces' index.
              this.renderedFaceIndex.push(ff_iter.handle().idx());
            }
          }
        }
      }
      this.selectedFaces = [];
      const face = await this.createTriangle(oneRingFaces, this.triangleMeshColor);
      this.selectedFaces = Array.from(oneRingFaces);
      this.selectedFacesMeshes.add(face);
    }
  }

  clearSelected()
  {
    //clear face meshes.
    while (this.selectedFacesMeshes.children.length !== 0)
    {
      this.selectedFacesMeshes.remove(this.selectedFacesMeshes.children[0]);
    }
    if (this.selectedFaces.length > 0)
    {
      //remove all records and 
      this.selectedFaces = [];
      this.renderedFaceIndex = [];
    }

    const pointsGeometry = this.points.geometry as THREE.BufferGeometry;
    pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(this.initPointsColor, 3));
    if (this.selectedPoints.length > 0)
    {
      //change the vertices color back to the original color.
      this.selectedPoints = [];
      this.renderedPointsIndex = [];
    }
  }

  async getFace()
  {

    const intersects = self.raycaster.intersectObject(this.mesh);
    let selectedFace: FaceHandle;
    if (intersects.length > 0)
    {
      let min = 100; //TODO: define the distance
      const point = intersects[0].point;
      //find the nearest face for the clickeddown position.
      for (let f_iter = self.triMesh.faces_begin(); f_iter.idx() !== self.triMesh.faces_end().idx(); f_iter.next())
      {

        let fv_iter = self.triMesh.fv_cwiter(f_iter.handle());

        let temp = self.triMesh.point(fv_iter.handle());
        const temp1 = new THREE.Vector3(temp.x, temp.y, temp.z);
        temp1.multiplyScalar(this._pointScale);
        await fv_iter.next();

        temp = self.triMesh.point(fv_iter.handle());
        const temp2 = new THREE.Vector3(temp.x, temp.y, temp.z);
        temp2.multiplyScalar(this._pointScale);

        await fv_iter.next();

        temp = self.triMesh.point(fv_iter.handle());
        const temp3 = new THREE.Vector3(temp.x, temp.y, temp.z);
        temp3.multiplyScalar(this._pointScale);
        //caculate distance;
        let distance = getL2Distance(point, temp1, temp2, temp3)
        if (distance < min)
        {
          console.log("get face")

          min = distance;
          selectedFace = f_iter.handle();
        }
      }
      if (selectedFace !== undefined)
      {
        console.log("selectedFace")

        if (!this.renderedFaceIndex.includes(selectedFace.idx()))
        {
          const face = await this.createTriangle([selectedFace], this.triangleMeshColor);
          this.selectedFacesMeshes.add(face);
          //record selected faces.
          this.selectedFaces.push(selectedFace);
          //record rendered face.
          this.renderedFaceIndex.push(selectedFace.idx());
        }
      }
    }
  }

  async getPoint()
  {
    const intersects = this.raycaster.intersectObject(
      this.mesh
    );
    if (intersects.length > 0)
    {
      let min = 1;

      const clickedPointPosition = intersects[0].point;
      let clickedPoint: VertexHandle;
      for (let v_iter = this.triMesh.vertices_begin(); v_iter.idx() !== this.triMesh.vertices_end().idx(); v_iter.next())
      {
        const { x, y, z } = clickedPointPosition;
        const point = this.triMesh.point(v_iter.handle());
        const distance = Math.sqrt(Math.pow((x - point.x * this._pointScale), 2) + Math.pow((y - point.y * this._pointScale), 2) + Math.pow((z - point.z * this._pointScale), 2));
        if (distance <= min)
        {
          min = distance;
          clickedPoint = v_iter.handle();
        }
      }

      if (clickedPoint !== undefined)
      {
        console.log("get point")

        if (!this.renderedPointsIndex.includes(clickedPoint.idx()))
        {
          console.log('set color')
          this.setVertexColor([clickedPoint], this.vertexColor);
          this.selectedPoints.push(clickedPoint);
          this.renderedPointsIndex.push(clickedPoint.idx());
        }
      }
    }
  }

  onPointerDown(event: PointerEvent)
  {
    if (event.buttons === 1)
    {
      self.setRaycaster(event);
      if (self.selectMode)
      {
        self.getPoint();
      } else
      {
        self.getFace();
      }
    } else
    {
      self.clearSelected();
    }
  }

  setRaycaster(event: any)
  {
    this.getMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  getMouse(event: any)
  {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  attachPointerEvent()
  {
    document.addEventListener("pointerdown", this.onPointerDown, false);
    window.addEventListener("keydown", this.openMeshDemo);
  }
}
