import * as React from "react";
import { useEffect } from "react";
import Viewer from "three/Viewer";
import "./ThreeViewer.css"
const ThreeViewer = () => {

    useEffect(() => {
        const three = new Viewer();
        three.animate();
        return () => {
            three.clear();
        }
    }, [])
    return (
        <div className="viewerContainer">
            <canvas id="three-canvas" />
        </div>
    );
}

export default ThreeViewer;
