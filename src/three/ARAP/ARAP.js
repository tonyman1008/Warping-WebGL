import * as THREE from 'three'
import LinearAlgebra from './linearAlgebra';
import { cloneVertices, isBorderEdge, createTrianglesFromFaces } from './extras'
import { Edge } from './edge'
import { Geometry } from 'three/examples/jsm/deprecated/Geometry.js'; //deprecated
import { TextureSource } from 'three/object/GridMesh3D';

export default class ARAP
{

    constructor( iCamera, iScene, ICanvas, IObjManager, iImageExporter )
    {
        this.camera = iCamera;
        this.objectMgr = IObjManager;
        this.imageExporter = iImageExporter;
        this.scene = iScene;
        this.canvas = ICanvas;
        this.targetMesh = null;
        this.handles = [];
        this.edges = [];
        this.faces = [];
        this.selectedHandle = null;
        this.originalVertices = null;
        this.deformedVertices = null;
        this.barycentricCoordMode = false;
        this.clickedOnHandle = false;
        this.enableARAP = true;
        this.handlesVisible = true;
        this.w = 1; // TODO set weight

        this.raycaster = new THREE.Raycaster();
        this.LinearAlgebra = new LinearAlgebra();
        // this.attachEvent( this.canvas );
        console.log( "ARAP init" )

        // ***this geometry structure is deprecated after v125 threejs test
        this.testGeometry = new Geometry();

        // match points test
        this.matchPointsSeqArray = [];
        this.linerInterpolationVertexsPosArray = [];
        this.handleOriginPosAry = [];
        this.handleTargetPosAry = [];
        this.handlesPos = [];
        this.preComputeDeformedVerticesAry = [];
        this.preComputeHandlePosAry = [];
        this.nowWarpFrameIndex = 0;
        this.nowHoppingFrameIndex = 0;
        this.degDiffBetweenTwoSourceImg = 5;
        this.animationFPS = 1;
        this.startFrameIndex = 0;
        this.endFrameIndex = 10;
        this.handleColor = new THREE.Color( 'Fuchsia' );
    }

    getNearestHandleIndex( x, y, vertices )
    {
        const mouseTarget = this.getPointInWorldCoordinates( x, y );
        console.log( mouseTarget );
        let distanceFromHandle = 0;
        let distanceTolerance = this.camera.position.z / 100;
        let closestHandleIndex = null;

        for ( let i = 0; i < this.handles.length; i++ )
        {
            distanceFromHandle = this.handles[ i ].position.distanceTo( mouseTarget );
            if ( distanceFromHandle < distanceTolerance )
            {
                closestHandleIndex = i;
                distanceTolerance = distanceFromHandle;
            }
        }
        return closestHandleIndex;
    }

    getPointInWorldCoordinates( x, y )
    {
        const vector = new THREE.Vector3();
        vector.set( ( x / window.innerWidth ) * 2 - 1, -( y / window.innerHeight ) * 2 + 1, 0.5 );
        vector.unproject( this.camera );
        const dir = vector.sub( this.camera.position ).normalize();
        const distance = - this.camera.position.z / dir.z;
        const pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );

        return pos;
    };

    eraseHandle( handle )
    {
        for ( let i = 0; i < this.handles.length; i++ )
        {
            if ( this.handles[ i ].v_index == this.handle.v_index )
            {
                this.scene.remove( handle );
                break;
            }
        }
    }

    eraseAllHandle()
    {
        console.log( "erase handles" )
        for ( let i = 0; i < this.handles.length; i++ )
        {
            this.scene.remove( this.handles[ i ] );
        }
        this.handles = [];
    }

    getHandleBaryCentricMode( index )
    {
        this.handle = null;
        for ( let i = 0; i < this.handles.length; i++ )
        {
            if ( i == index )
            {
                this.handle = this.handles[ i ];
                return this.handle;
            }
        }
        return this.handle;
    }

    getHandle( modelVertexIndex )
    {
        this.handle = null;
        for ( let i = 0; i < this.handles.length; i++ )
        {
            if ( this.handles[ i ].v_index == modelVertexIndex )
            {
                this.handle = this.handles[ i ];
                return this.handle;
            }
        }
        return this.handle;
    }

    handleExists( modelVertexIndex )
    {
        let exists = false;
        for ( let i = 0; i < this.handles.length; i++ )
        {
            if ( this.handles[ i ].v_index == modelVertexIndex )
            {
                exists = true;
                return exists;
            }
        }
        return exists;
    }

    handleExistsBaryCentricMode( index )
    {
        let exists = false;
        for ( let i = 0; i < this.handles.length; i++ )
        {
            if ( i == index )
            {
                exists = true;
                return exists;
            }
        }
        return exists;
    }

    getNearestModelVertexIndex( x, y, vertices )
    {
        const mouseTarget = this.getPointInWorldCoordinates( x, y );
        console.log( mouseTarget );
        let distanceFromVertex = 0;
        let distanceTolerance = this.camera.position.z / 100;;
        let closestVertexIndex = null;

        for ( let i = 0; i < vertices.length; i++ )
        {
            distanceFromVertex = vertices[ i ].distanceTo( mouseTarget );
            if ( distanceFromVertex < distanceTolerance )
            {
                closestVertexIndex = i;
                distanceTolerance = distanceFromVertex;
            }
        }

        return closestVertexIndex;
    }

    mouseLeftClick( event )
    {
        const x = event.clientX;
        const y = event.clientY;
        const isClickPointsOnObject = this.checkIfClickPointOnObject( x, y )
        if ( isClickPointsOnObject == false ) return;

        if ( this.barycentricCoordMode )
        {
            const worldPos = this.getPointInWorldCoordinates( x, y );
            const nearestHandle = null;
            const nearestHandleIndex = this.getNearestHandleIndex( x, y, this.deformedVertices );
            let newHandle = null;

            if ( this.handleExistsBaryCentricMode( nearestHandleIndex ) )
            {
                this.selectedHandle = this.getHandleBaryCentricMode( nearestHandleIndex );
                this.clickedOnHandle = true;
            }
            else
            {
                this.clickedOnHandle = false;
                newHandle = this.createHandleAtPosition( worldPos, this.targetMesh.geometry.faces, this.deformedVertices );
                this.handles.push( newHandle );
                console.log( 'Compilation started! Adding marker! Please Wait..' );
                //TODO: chnage set time out
                setTimeout( () =>
                {
                    this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                        () =>
                        {
                            console.log( 'Compilation finished! Can drag targetMesh!' );
                            this.drawHandle( newHandle );
                        } );
                }, 20 );
            }
        }
        else
        {
            const nearestVertex = null;
            const nearestVertexIndex = this.getNearestModelVertexIndex( x, y, this.deformedVertices );
            let newHandle = null;

            if ( this.handleExists( nearestVertexIndex ) )
            {
                this.selectedHandle = this.getHandle( nearestVertexIndex );
                this.clickedOnHandle = true;
            }
            else
            {
                this.clickedOnHandle = false;
                if ( nearestVertexIndex != null )
                {
                    newHandle = this.createHandleAtVertex( nearestVertexIndex, this.deformedVertices );
                    this.handles.push( newHandle );
                    console.log( 'Compilation started! Adding handle marker! Please Wait..' );
                    setTimeout( () =>
                    {
                        this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                            () =>
                            {
                                console.log( 'Compilation finished! Can drag targetMesh!' );
                                this.drawHandle( newHandle );
                            } );
                    }, 20 );
                }
                else
                {
                    console.log( 'No vertex found!' );
                }
            }
        }
    }

    //test
    getNearestVertexIndexOnWorldPos( x, y, vertices )
    {
        const worldPos = new THREE.Vector3( x, y, 0 );
        let distanceFromVertex = 0;
        let distanceTolerance = this.camera.position.z / 100;;
        let closestVertexIndex = null;

        for ( let i = 0; i < vertices.length; i++ )
        {
            distanceFromVertex = vertices[ i ].distanceTo( worldPos );
            if ( distanceFromVertex < distanceTolerance )
            {
                closestVertexIndex = i;
                distanceTolerance = distanceFromVertex;
            }
        }

        return closestVertexIndex;
    }

    //test
    getNearestHandleIndexOnWorldPos( worldPos )
    {

        let distanceFromHandle = 0;
        let distanceTolerance = this.camera.position.z / 100;
        let closestHandleIndex = null;

        for ( let i = 0; i < this.handles.length; i++ )
        {
            distanceFromHandle = this.handles[ i ].position.distanceTo( worldPos );
            if ( distanceFromHandle < distanceTolerance )
            {
                closestHandleIndex = i;
                distanceTolerance = distanceFromHandle;
            }
        }
        return closestHandleIndex;
    }

    filterMatchPointsArray( matchPoints )
    {
        const newMatchPointsArray = [];
        for ( let i = 0; i < matchPoints.length; i++ )
        {
            const { x, y } = matchPoints[ i ].src;
            const nearestVertexIndex = this.getNearestVertexIndexOnWorldPos( x, y, this.deformedVertices );
            if ( nearestVertexIndex != null )
                newMatchPointsArray.push( matchPoints[ i ] )
        }
        console.log( "filter match point vertices complete length", newMatchPointsArray.length )
        return newMatchPointsArray
    }

    //test
    async testMatchPoints()
    {
        console.log( "testMatchPoints start" );
        console.time( "ARAP_PreCompute_Process" )
        for ( let i = this.startFrameIndex / this.degDiffBetweenTwoSourceImg; i < this.endFrameIndex / this.degDiffBetweenTwoSourceImg; i++ )
        {
            // clear
            // this.eraseAllHandle();
            // this.handleTargetPosAry = [];
            // this.handleOriginPosAry = [];

            // change mesh
            this.targetMesh.updateGeometry( this.objectMgr.preComputeDelaunayGeo[ i ] )
            // init arap mesh
            await this.initializeFromMesh( this.objectMgr.preComputeDelaunayGeo[ i ] );

            const matchPoints = this.matchPointsSeqArray[ i ].slice();

            for ( let k = 0; k < this.degDiffBetweenTwoSourceImg; k++ )
            {
                let handlesAry = [];
                let srcHandlesPosAry = [];
                let tgtHandlesPosAry = [];

                // create handle from matchPoints data
                for ( let j = 0; j < matchPoints.length; j++ )
                {
                    const { x, y } = k < ( this.degDiffBetweenTwoSourceImg / 2 ) ? matchPoints[ j ].src : matchPoints[ j ].tgt;

                    const nearestVertexIndex = this.getNearestVertexIndexOnWorldPos( x, y, this.deformedVertices );
                    let newHandle = null;

                    if ( !this.handleExists( nearestVertexIndex ) )
                    {
                        if ( nearestVertexIndex != null )
                        {
                            newHandle = this.createHandleAtVertex( nearestVertexIndex, this.deformedVertices );
                            // this.handles.push( newHandle );
                            srcHandlesPosAry.push( matchPoints[ j ].src );
                            tgtHandlesPosAry.push( matchPoints[ j ].tgt );
                            handlesAry.push( newHandle );
                            // this.drawHandle( newHandle );
                        }
                        else
                        {
                            console.log( 'No vertex found!' );
                        }
                    }
                }

                // arap compilation
                await this.LinearAlgebra.compilation( handlesAry, this.originalVertices, this.barycentricCoordMode,
                    async () =>
                    {
                        // console.log( `Compilation frame ${i} finished! ` );
                        // pre-compute warp frame
                        // await this.preComputeWarpFrame( srcHandlesPosAry, tgtHandlesPosAry );

                        const newHandlesPosAry = [];
                        const interpolationRatio = k / this.degDiffBetweenTwoSourceImg;
                        console.log( "interpolation Ratio", interpolationRatio );
                        for ( let j = 0; j < srcHandlesPosAry.length; j++ )
                        {
                            const newHandlePos = new THREE.Vector3();
                            newHandlePos.lerpVectors( srcHandlesPosAry[ j ], tgtHandlesPosAry[ j ], interpolationRatio )

                            newHandlesPosAry.push( newHandlePos );
                        }
                        const newVerticesFrame = this.LinearAlgebra.manipulation_test( newHandlesPosAry, this.edges, this.originalVertices );
                        this.preComputeDeformedVerticesAry.push( newVerticesFrame );

                        console.log( "preComputeFrame length", this.preComputeDeformedVerticesAry.length )

                        // this.handleTargetPosAry = [];
                        // this.handleOriginPosAry = [];
                        this.eraseAllHandle();
                    } );
            }

            // let handlesAry = [];
            // let srcHandlesPosAry = [];
            // let tgtHandlesPosAry = [];

            // // create handle from matchPoints data
            // for ( let j = 0; j < matchPoints.length; j++ )
            // {
            //     const { x, y } = matchPoints[ j ].src;

            //     const nearestVertexIndex = this.getNearestVertexIndexOnWorldPos( x, y, this.deformedVertices );
            //     let newHandle = null;

            //     if ( !this.handleExists( nearestVertexIndex ) )
            //     {
            //         if ( nearestVertexIndex != null )
            //         {
            //             newHandle = this.createHandleAtVertex( nearestVertexIndex, this.deformedVertices );
            //             // this.handles.push( newHandle );
            //             srcHandlesPosAry.push( matchPoints[ j ].src );
            //             tgtHandlesPosAry.push( matchPoints[ j ].tgt );
            //             handlesAry.push( newHandle );
            //             // this.drawHandle( newHandle );
            //         }
            //         else
            //         {
            //             console.log( 'No vertex found!' );
            //         }
            //     }
            // }

            // // arap compilation
            // await this.LinearAlgebra.compilation( handlesAry, this.originalVertices, this.barycentricCoordMode,
            //     async () =>
            //     {
            //         console.log( `Compilation frame ${i} finished! ` );
            //         // pre-compute warp frame
            //         await this.preComputeWarpFrame( srcHandlesPosAry, tgtHandlesPosAry );
            //         this.handleTargetPosAry = [];
            //         this.handleOriginPosAry = [];
            //         this.eraseAllHandle();
            //     } );
        }

        // reset to first frame geometry
        const textureIndex = parseInt( this.startFrameIndex / this.degDiffBetweenTwoSourceImg ) * this.degDiffBetweenTwoSourceImg;
        await this.objectMgr.updateTextureByFrameIndex( textureIndex );

        const meshIndex = parseInt( this.startFrameIndex / this.degDiffBetweenTwoSourceImg )
        this.targetMesh.updateGeometry( this.objectMgr.preComputeDelaunayGeo[ meshIndex ] );


        console.timeEnd( "ARAP_PreCompute_Process" )
    }

    async testMatchPointsBarycentry()
    {
        console.log( "testMatchPointsBarycentry start" );
        this.barycentricCoordMode = true;

        for ( let i = 0; i < 2; i++ )
        {
            this.targetMesh.updateGeometry( this.objectMgr.preComputeDelaunayGeo[ i ] )
            // init arap mesh
            await this.initializeFromMesh( this.objectMgr.preComputeDelaunayGeo[ i ] );

            const matchPoints = this.matchPointsSeqArray[ i ].slice();
            const handlesAry = [];
            let srcHandlesPosAry = [];
            let tgtHandlesPosAry = [];

            for ( let j = 0; j < matchPoints.length; j++ )
            {
                const srcPos = matchPoints[ j ].src;
                const tgtPos = matchPoints[ j ].tgt;

                const nearestHandleIndex = this.getNearestHandleIndexOnWorldPos( srcPos );
                let newHandle = null;

                // if ( !this.handleExistsBaryCentricMode( nearestHandleIndex ) )
                // {
                //     if ( nearestHandleIndex == null )
                //     {
                newHandle = this.createHandleAtPosition( srcPos, this.targetMesh.geometry.faces, this.deformedVertices );
                this.handles.push( newHandle );
                srcHandlesPosAry.push( srcPos );
                tgtHandlesPosAry.push( tgtPos );
                handlesAry.push( newHandle );
                // this.drawHandle( newHandle );
                //     }
                // }
            }
            await this.LinearAlgebra.compilation( handlesAry, this.originalVertices, this.barycentricCoordMode,
                async () =>
                {
                    console.log( `Compilation frame ${i} finished! ` );
                    await this.preComputeWarpFrame( srcHandlesPosAry, tgtHandlesPosAry );
                    this.handleTargetPosAry = [];
                    this.handleOriginPosAry = [];
                    this.eraseAllHandle();
                } );
        }
        console.log( "all preCompute complete length", this.preComputeDeformedVerticesAry.length )
    }

    async preComputeWarpFrame( srcHandlesPosAry, tgtHandlesPosAry )
    {
        // if ( this.handles.length == 0 )
        //     return;

        // interpolation between frame 0 & fame N
        // const startFrameVertices = cloneVertices( this.originalVertices )
        // this.preComputeDeformedVerticesAry.push( startFrameVertices );
        // this.preComputeHandlePosAry.push( srcHandlesPosAry.slice() );

        console.time( 'preComputeWarpFrame' )
        for ( let i = 0; i < this.degDiffBetweenTwoSourceImg; i++ )
        {
            const newHandlesPosAry = [];
            const interpolationRatio = i / this.degDiffBetweenTwoSourceImg;
            console.log( "interratio", interpolationRatio );
            for ( let j = 0; j < srcHandlesPosAry.length; j++ )
            {
                const newHandlePos = new THREE.Vector3();
                newHandlePos.lerpVectors( srcHandlesPosAry[ j ], tgtHandlesPosAry[ j ], interpolationRatio )

                newHandlesPosAry.push( newHandlePos );
            }
            const newVerticesFrame = this.LinearAlgebra.manipulation_test( newHandlesPosAry, this.edges, this.originalVertices );

            this.preComputeDeformedVerticesAry.push( newVerticesFrame );
            this.preComputeHandlePosAry.push( newHandlesPosAry );
        }
        console.log( "preComputeFrame length", this.preComputeDeformedVerticesAry.length )
        console.timeEnd( 'preComputeWarpFrame' )
    }

    async warpFrame()
    {
        if ( this.preComputeDeformedVerticesAry.length == 0 )
            return;

        const frameIndex = Math.round( this.nowWarpFrameIndex );
        console.log( "frameIndex", frameIndex );

        // switch texture at middle point
        const textureIndex = Math.round( frameIndex / this.degDiffBetweenTwoSourceImg ) * this.degDiffBetweenTwoSourceImg;
        await this.objectMgr.updateTextureByFrameIndex( textureIndex );
        console.log( "textureIndex", textureIndex );

        const meshIndex = parseInt( frameIndex / this.degDiffBetweenTwoSourceImg )
        this.targetMesh.updateGeometry( this.objectMgr.preComputeDelaunayGeo[ meshIndex ] );
        console.log( "mesh index", meshIndex )

        // 
        const preComputeStartIndex = frameIndex - this.startFrameIndex
        for ( let i = 0; i < this.preComputeDeformedVerticesAry[ preComputeStartIndex ].length; i++ )
        {
            this.targetMesh.geometry.attributes.position.setXY( i, this.preComputeDeformedVerticesAry[ preComputeStartIndex ][ i ].x, this.preComputeDeformedVerticesAry[ preComputeStartIndex ][ i ].y );
            // this.testGeometry.vertices[ i ].x = this.preComputeDeformedVerticesAry[ frameIndex ][ i ].x;
            // this.testGeometry.vertices[ i ].y = this.preComputeDeformedVerticesAry[ frameIndex ][ i ].y;
        }

        // // handle position
        // for ( let j = 0; j < this.handles.length; j++ )
        // {
        //     this.handles[ j ].position.copy( this.preComputeHandlePosAry[ frameIndex ][ j ] );
        // }
        // this.targetMesh.geometry.attributes.position.needsUpdate = true;
    }

    async hoppingFrame()
    {
        const frameIndex = Math.round( this.nowHoppingFrameIndex );
        console.log( "frameindex", frameIndex )

        await this.objectMgr.updateTextureByFrameIndex( frameIndex )
        if ( frameIndex % this.degDiffBetweenTwoSourceImg == 0 )
            this.targetMesh.updateGeometry( this.objectMgr.preComputeDelaunayGeo[ frameIndex / this.degDiffBetweenTwoSourceImg ] )
    }

    async playPreWarpFrameAnimation()
    {
        this.nowWarpFrameIndex = this.startFrameIndex;
        const rotataAnimation = setInterval( () =>
        {
            this.warpFrame();
            document.getElementById( "frameIndex" ).innerHTML = this.nowWarpFrameIndex.toString();

            this.imageExporter.exportCanvasToImage(this.nowWarpFrameIndex.toString())

            const nextIndex = this.nowWarpFrameIndex + 1;
            if ( nextIndex == this.endFrameIndex )
            {
                clearInterval( rotataAnimation )
            }
            else
            {
                this.nowWarpFrameIndex = nextIndex
            }
        }, 1000 / this.animationFPS );
    }

    async playViewHoppingAnimation()
    {
        this.nowHoppingFrameIndex = this.startFrameIndex;
        const rotataAnimation = setInterval( () =>
        {
            this.hoppingFrame();
            document.getElementById( "frameIndex" ).innerHTML = this.nowHoppingFrameIndex.toString();

            // this.imageExporter.exportCanvasToImage(this.nowHoppingFrameIndex.toString())

            const nextIndex = this.nowHoppingFrameIndex + 1;
            if ( nextIndex == this.endFrameIndex )
            {
                clearInterval( rotataAnimation )
            }
            else
            {
                this.nowHoppingFrameIndex = nextIndex
            }
        }, 1000 / this.animationFPS );
    }

    mouseRightClick( event )
    {
        if ( this.keyFrameMode )
        {
            console.log( 'Viewing Keyframe. Please click "Reset" to start again.' );
            return false;
        }

        const x = event.clientX;
        const y = event.clientY;
        let handleToRemove = null;

        if ( this.barycentricCoordMode )
        {
            const nearestHandleIndex = this.getNearestHandleIndex( x, y, this.deformedVertices );
            if ( this.handleExistsBaryCentricMode( nearestHandleIndex ) )
            {
                handleToRemove = this.getHandleBaryCentricMode( nearestHandleIndex );
                this.eraseHandle( handleToRemove );
                this.handles.splice( nearestHandleIndex, 1 );
                console.log( 'Compilation started! Removing handle marker! Please Wait..' );
                setTimeout( () =>
                {
                    this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                        () =>
                        {
                            console.log( 'Compilation finished! Can drag targetMesh!' );
                        } );
                }, 20 );
            }
        } else
        {
            const nearestVertexIndex = this.getNearestModelVertexIndex( x, y, this.deformedVertices );
            if ( this.handleExists( nearestVertexIndex ) )
            {
                handleToRemove = this.getHandle( nearestVertexIndex );
                this.eraseHandle( handleToRemove );
                this.handles = this.handles.filter( it => it.v_index != handleToRemove.v_index );
                console.log( 'Compilation started! Removing handle marker! Please Wait..' );
                setTimeout( () =>
                {
                    this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                        () =>
                        {
                            console.log( 'Compilation finished! Can drag targetMesh!' );
                        } );
                }, 20 );
            }
        }
        return false;
    }

    mouseDown( event )
    {
        if ( this.enableARAP == false ) return;
        if ( event.button == 0 )
        {
            this.mouseLeftClick( event );
        }
        else if ( event.button == 2 )
        {
            this.mouseRightClick( event );
        }
    }

    mouseMove( event )
    {
        if ( this.enableARAP == false ) return;

        if ( this.keyFrameMode )
        {
            console.log( 'Viewing Keyframe. Please click "Reset" to start again.' );
            return false;
        }

        if ( this.clickedOnHandle )
        {
            const x = event.clientX;
            const y = event.clientY;
            const mouseTarget = this.getPointInWorldCoordinates( x, y );

            //this will update handles[i] element that is selectedHandle
            this.selectedHandle.position.x = mouseTarget.x;
            this.selectedHandle.position.y = mouseTarget.y;

            // targetMesh might not have loaded so might need to moved listeners to after the 
            // targetMesh has loaded
            let newVertices = this.LinearAlgebra.manipulation( this.handles, this.edges, this.originalVertices );
            for ( let i = 0; i < newVertices.length; i++ )
            {
                this.targetMesh.geometry.attributes.position.setXY( i, newVertices[ i ].x, newVertices[ i ].y );

                this.testGeometry.vertices[ i ].x = newVertices[ i ].x
                this.testGeometry.vertices[ i ].y = newVertices[ i ].y
            }
            this.targetMesh.geometry.attributes.position.needsUpdate = true;
        }
    }

    mouseUp( event )
    {
        if ( this.clickedOnHandle )
        {
            this.clickedOnHandle = false;
        }
    }

    checkIfClickPointOnObject( x, y )
    {
        const mouseWorldPos = new THREE.Vector2( x, )
        mouseWorldPos.set( ( x / window.innerWidth ) * 2 - 1, -( y / window.innerHeight ) * 2 + 1 );
        this.raycaster.setFromCamera( mouseWorldPos, this.camera )
        const intersect = this.raycaster.intersectObject( this.targetMesh );
        if ( intersect.length > 0 )
        {
            return true;
        } else
        {
            console.log( "Please click in mesh area" )
            return false;
        }
    }

    setWeight( weight )
    {
        this.w = weight;
    }

    async initializeFromMesh( geometry )
    {
        console.time( 'arap_init_mesh' )

        // this.targetMesh = mesh;
        // ***this geometry structure is deprecated after v125 threejs test
        const positionAttribute = this.targetMesh.geometry.getAttribute( 'position' );
        // ###deprecated
        this.testGeometry.dispose();
        this.testGeometry = new Geometry()
        this.testGeometry.fromBufferGeometry( geometry );
        // console.log( "geometry", geometry );
        // console.log( "arap init geometry", this.testGeometry );

        this.faces = this.testGeometry.faces;
        // console.log("face",this.faces);
        // this.faces = mesh.geometry.faces;

        this.edges = [];
        for ( let i = 0; i < this.faces.length; i++ )
        {
            const currentEdge1 = new Edge( this.faces[ i ].a, this.faces[ i ].b, i );
            const currentEdge2 = new Edge( this.faces[ i ].b, this.faces[ i ].c, i );
            const currentEdge3 = new Edge( this.faces[ i ].a, this.faces[ i ].c, i );
            if ( !Edge.edgeDoesExist( this.edges, currentEdge1 ) ) { this.edges.push( currentEdge1 ); }
            if ( !Edge.edgeDoesExist( this.edges, currentEdge2 ) ) { this.edges.push( currentEdge2 ); }
            if ( !Edge.edgeDoesExist( this.edges, currentEdge3 ) ) { this.edges.push( currentEdge3 ); }
        }
        // console.log("edge",this.edges);

        for ( let i = 0; i < this.edges.length; i++ )
        {
            if ( isBorderEdge( this.edges[ i ], this.faces ) )
            {
                this.edges[ i ].setIsBorderEdge( true );
            }
            else
            {
                this.edges[ i ].setIsBorderEdge( false );
            }
        }

        const allEdges = Edge.getAllEdges( this.faces );
        for ( let i = 0; i < this.edges.length; i++ )
        {
            const neighbors = Edge.getEdgeNeighbors( this.edges[ i ], allEdges, this.faces );
            this.edges[ i ].setNeighbors( neighbors );
        }

        // ###deprecated
        this.originalVertices = cloneVertices( this.testGeometry.vertices );
        this.deformedVertices = cloneVertices( this.testGeometry.vertices );
        await this.LinearAlgebra.registration( this.edges, this.originalVertices, this.deformedVertices );
        console.timeEnd( 'arap_init_mesh' )
        console.log( "init complete" )
    }

    createHandleAtVertex( index, vertices )
    {
        const vertex = vertices[ index ];
        const geometry = new THREE.SphereGeometry( 4, 32, 32 );
        const material = new THREE.MeshBasicMaterial( { color: this.handleColor } );
        const newHandle = new THREE.Mesh( geometry, material );

        newHandle.position.set( vertex.x, vertex.y, vertex.z );
        newHandle.v_index = index;

        return newHandle;
    }

    drawHandle( handle )
    {
        this.scene.add( handle );
    }

    createHandleAtPosition( worldPos, faces, vertices )
    {
        const triangles = createTrianglesFromFaces( this.testGeometry.faces, vertices );
        let newHandle = null;
        for ( let i = 0; i < triangles.length; i++ )
        {
            if ( triangles[ i ].containsPoint( worldPos ) )
            {

                let x1y1 = new THREE.Vector3( triangles[ i ].a.x, triangles[ i ].a.y, triangles[ i ].a.z );
                let x2y2 = new THREE.Vector3( triangles[ i ].b.x, triangles[ i ].b.y, triangles[ i ].b.z );
                let x3y3 = new THREE.Vector3( triangles[ i ].c.x, triangles[ i ].c.y, triangles[ i ].c.z );

                let triangleA = new THREE.Triangle( x3y3, x2y2, x1y1 );
                let triangleA1 = new THREE.Triangle( x3y3, x2y2, worldPos );
                let triangleA2 = new THREE.Triangle( x1y1, x3y3, worldPos );
                let triangleA3 = new THREE.Triangle( x1y1, x2y2, worldPos );

                let areaA = triangleA.getArea();
                let areaA1 = triangleA1.getArea();
                let areaA2 = triangleA2.getArea();
                let areaA3 = triangleA3.getArea();

                let l1 = areaA1 / areaA;
                let l2 = areaA2 / areaA;
                let l3 = areaA3 / areaA;

                x1y1 = x1y1.multiplyScalar( l1 );
                x2y2 = x2y2.multiplyScalar( l2 );
                x3y3 = x3y3.multiplyScalar( l3 );

                let p = x1y1.add( x2y2 ).add( x3y3 );

                let geometry = new THREE.SphereGeometry( 3, 32, 32 );
                let material = new THREE.MeshBasicMaterial( { color: this.handleColor } );
                newHandle = new THREE.Mesh( geometry, material );
                newHandle.position.set( p.x, p.y, p.z );
                newHandle.l1 = l1;
                newHandle.l2 = l2;
                newHandle.l3 = l3;
                newHandle.triangleV1Index = triangles[ i ].v1Index;
                newHandle.triangleV2Index = triangles[ i ].v2Index;
                newHandle.triangleV3Index = triangles[ i ].v3Index;
            }
        }

        return newHandle;
    }

    setAllHandlesVisible()
    {
        this.handles.forEach( ( handle ) =>
        {
            handle.visible = !this.handlesVisible;
        } )
        this.handlesVisible = !this.handlesVisible
    }

    onModeChange()
    {
        this.eraseAllHandle();
        console.log( 'Mode change! Removing all handle marker! Please Wait..' );
        setTimeout( () =>
        {
            this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                () =>
                {
                    console.log( 'Compilation finished! Can drag targetMesh!' );
                } );
        }, 20 );
    }

    //TODO: reset
    resetARAP()
    {
        if ( this.enableARAP == false ) return;

        for ( let i = 0; i < this.originalVertices.length; i++ )
        {
            this.targetMesh.geometry.attributes.position.setXY( i, this.originalVertices[ i ].x, this.originalVertices[ i ].y );
            this.testGeometry.vertices[ i ].x = this.originalVertices[ i ].x
            this.testGeometry.vertices[ i ].y = this.originalVertices[ i ].y
        }
        this.targetMesh.geometry.attributes.position.needsUpdate = true;
        this.deformedVertices = cloneVertices( this.testGeometry.vertices );
        this.LinearAlgebra.resetDeformedVertices( this.deformedVertices )
        this.handlesVisible = true;
        this.eraseAllHandle();
    }

    attachEvent( canvas )
    {
        canvas.addEventListener( "mousedown", this.mouseDown.bind( this ) );
        canvas.addEventListener( "mouseup", this.mouseUp.bind( this ) );
        canvas.addEventListener( "mousemove", this.mouseMove.bind( this ) );
    }
}

