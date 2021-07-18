import { FPropHandle } from "OpenMesh/Mesh/Handles/PropHandles";
import TriMesh from "OpenMesh/Mesh/TriMeshT";

export default class CustomTriMesh extends TriMesh {
    private R: FPropHandle<Number>
    private G: FPropHandle<Number>
    private B: FPropHandle<Number>
    private A: FPropHandle<Number>

    constructor() {
        super();
        this.R = new FPropHandle<Number>(this.add_property(new FPropHandle<Number>(), "f:R", 0));
        this.G = new FPropHandle<Number>(this.add_property(new FPropHandle<Number>(), "f:G", 0));
        this.B = new FPropHandle<Number>(this.add_property(new FPropHandle<Number>(), "f:B", 0));
        this.A = new FPropHandle<Number>(this.add_property(new FPropHandle<Number>(), "f:A", 0));
    }

    Rs() {
        return this.property(this.R)
    }
}