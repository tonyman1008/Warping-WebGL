import * as React from "react";
import { useEffect } from "react";
import ComparisonViewer from "three/ComparisonViewer";
import "./ComparisonThreeViewer.css"

const ComparisonThreeViewer = () =>
{
    useEffect(() =>
    {
        const three = new ComparisonViewer();

        three.animate();
        return () =>
        {
            three.clear();
        }
    }, [])
    return (
        <div className="viewerContainer">
            <div id="frameIndex"> 0 </div>
            <div id="GT_Text"> GT </div>
            <div id="warped_Text"> Warped </div>
            <div id="fw_Text"> Forward </div>
            <div id="bw_Text"> Backward </div>
            <canvas id="three-canvas" />
        </div>
    );
}

export default ComparisonThreeViewer;
