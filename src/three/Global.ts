import ViewportController from './Controllers/ViewportController'
import OpenMesh from "OpenMesh";


export default class Global {
    private static instance: Global = null;
    public viewportController: ViewportController = null;
    public openMesh: OpenMesh = null;

    public static get inst() {
        if (Global.instance == null) {
            Global.instance = new Global();
            Global.instance.viewportController = new ViewportController();
            Global.instance.openMesh = new OpenMesh();
        }
        return Global.instance;
    }
}