import * as React from "react";
import { useEffect } from "react";
import Viewer from "three/Viewer";
import ComparisonViewer from "three/ComparisonViewer";
import "./ThreeViewer.css"
import { useParams } from 'react-router-dom'

const ThreeViewer = () =>
{
    const { viewer } = useParams()

    useEffect(() =>
    {
        let three;
        if (viewer == "compare")
        {
            three = new ComparisonViewer();
        }
        else
        {
            three = new Viewer()
        }

        three.animate();
        return () =>
        {
            three.clear();
        }
    }, [])
    return (
        <div className="viewerContainer">
            <div id="frameIndex"> 0 </div>
            <canvas id="three-canvas" />
        </div>
    );
}

export default ThreeViewer;
