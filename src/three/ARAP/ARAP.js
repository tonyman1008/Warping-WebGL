import * as THREE from 'three'
import LinearAlgebra from './linearAlgebra';
import { cloneVertices, isBorderEdge, createTrianglesFromFaces } from './extras'
import { Edge } from './edge'
import { Geometry } from 'three/examples/jsm/deprecated/Geometry.js'; //deprecated

export default class ARAP
{

    constructor( iCamera, iScene )
    {
        this.camera = iCamera
        this.scene = iScene
        this.model = null;
        this.handles = [];
        this.edges = [];
        this.frames = [];
        this.faces = [];
        this.selectedHandle = null;
        this.originalVertices = null;
        this.deformedVertices = null;
        this.barycentricCoordMode = false;
        this.clickedOnHandle = false;
        this.enableARAP = true;
        this.handlesVisible = true;
        this.w = 1000; // TODO set weight

        // this.keyFrameMode = false; // TODO

        this.raycaster = new THREE.Raycaster();
        this.LinearAlgebra = new LinearAlgebra();
        this.attachEvent();
        console.log( "ARAP init" )

        // ***this geometry structure is deprecated after v125 threejs test
        this.testGeometry = new Geometry();
    }

    getNearestHandleIndex( x, y, vertices )
    {
        const mouseTarget = this.getPointInWorldCoordinates( x, y );
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
        for ( let i = 0; i < this.handles.length; i++ )
        {
            this.scene.remove( this.handles[i] );
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
                newHandle = this.createHandleAtPosition( worldPos, this.model.geometry.faces, this.deformedVertices );
                this.handles.push( newHandle );
                console.log( 'Compilation started! Adding marker! Please Wait..' );
                //TODO: chnage set time out
                setTimeout( () =>
                {
                    this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                        () =>
                        {
                            console.log( 'Compilation finished! Can drag model!' );
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
                                console.log( 'Compilation finished! Can drag model!' );
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
                            console.log( 'Compilation finished! Can drag model!' );
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
                            console.log( 'Compilation finished! Can drag model!' );
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

            // model might not have loaded so might need to moved listeners to after the 
            // model has loaded
            let newVertices = this.LinearAlgebra.manipulation( this.handles, this.edges, this.originalVertices );
            for ( let i = 0; i < newVertices.length; i++ )
            {
                this.model.geometry.attributes.position.setXY( i, newVertices[ i ].x, newVertices[ i ].y );

                // this.model.geometry.vertices[ i ].x = newVertices[ i ].x;
                // this.model.geometry.vertices[ i ].y = newVertices[ i ].y;
                this.testGeometry.vertices[i].x = this.originalVertices[i].x
                this.testGeometry.vertices[i].y = this.originalVertices[i].y
            }
            this.model.geometry.attributes.position.needsUpdate = true;
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
        const intersect = this.raycaster.intersectObject( this.model );
        if(intersect.length > 0){
            return true;
        }else{
            console.log("Please click in mesh area")
            return false;
        }
    }

    setWeight( weight )
    {
        this.w = weight;
    }

    async initializeFromMesh( mesh )
    {
        // for ( let f_iter = mesh.triMesh.faces_begin(); f_iter.idx() !== mesh.triMesh.faces_end().idx(); f_iter.next() )
        // {
        //     const vertexIDs = [];
        //     let fv_iter = mesh.triMesh.fv_cwiter(f_iter.handle());
        //     vertexIDs.push(fv_iter.handle().idx());
        //     await fv_iter.next();
        //     vertexIDs.push(fv_iter.handle().idx());
        //     await fv_iter.next();
        //     vertexIDs.push(fv_iter.handle().idx());
        //     console.log("faceid",f_iter.handle().idx());
        //     console.log("vertexids",vertexIDs);
        // }

        // console.log( mesh );

        this.model = mesh;
        // ***this geometry structure is deprecated after v125 threejs test
        const positionAttribute = this.model.geometry.getAttribute( 'position' );
        console.log( positionAttribute );
        // ###deprecated
        this.testGeometry.fromBufferGeometry( mesh.geometry );
        console.log( this.testGeometry );

        this.faces = this.testGeometry.faces;
        // this.faces = mesh.geometry.faces;
        for ( let i = 0; i < this.faces.length; i++ )
        {
            const currentEdge1 = new Edge( this.faces[ i ].a, this.faces[ i ].b, i );
            const currentEdge2 = new Edge( this.faces[ i ].b, this.faces[ i ].c, i );
            const currentEdge3 = new Edge( this.faces[ i ].a, this.faces[ i ].c, i );
            if ( !Edge.edgeDoesExist( this.edges, currentEdge1 ) ) { this.edges.push( currentEdge1 ); }
            if ( !Edge.edgeDoesExist( this.edges, currentEdge2 ) ) { this.edges.push( currentEdge2 ); }
            if ( !Edge.edgeDoesExist( this.edges, currentEdge3 ) ) { this.edges.push( currentEdge3 ); }
        }

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
        // this.originalVertices = cloneVertices( this.model.geometry.vertices );
        // this.deformedVertices = cloneVertices( this.model.geometry.vertices );
        this.LinearAlgebra.registration( this.edges, this.originalVertices, this.deformedVertices );
    }

    createHandleAtVertex( index, vertices )
    {
        const vertex = vertices[ index ];
        const uniformScale = this.camera.position.z / 120;
        const geometry = new THREE.SphereGeometry( 1, 32, 32 );
        const material = new THREE.MeshPhongMaterial( { shininess: 1 } );
        const newHandle = new THREE.Mesh( geometry, material );
        
        newHandle.position.set( vertex.x, vertex.y, vertex.z );
        newHandle.scale.set( uniformScale, uniformScale, uniformScale );
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
        const uniformScale = this.camera.position.z / 120;
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

                let areaA = triangleA.area();
                let areaA1 = triangleA1.area();
                let areaA2 = triangleA2.area();
                let areaA3 = triangleA3.area();

                let l1 = areaA1 / areaA;
                let l2 = areaA2 / areaA;
                let l3 = areaA3 / areaA;

                x1y1 = x1y1.multiplyScalar( l1 );
                x2y2 = x2y2.multiplyScalar( l2 );
                x3y3 = x3y3.multiplyScalar( l3 );

                let p = x1y1.add( x2y2 ).add( x3y3 );

                let geometry = new THREE.SphereGeometry( 1, 32, 32 );
                let material = new THREE.MeshPhongMaterial( { shininess: 1 } );
                newHandle = new THREE.Mesh( geometry, material );
                newHandle.position.set( p.x, p.y, p.z );
                newHandle.scale.set( uniformScale, uniformScale, uniformScale );
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

    setAllHandlesVisible(){
        this.handles.forEach((handle)=>{
            handle.visible = !this.handlesVisible;
        })
        this.handlesVisible = !this.handlesVisible
    }

    onModeChange(){
        this.eraseAllHandle();
        console.log( 'Mode change! Removing all handle marker! Please Wait..' );
        setTimeout( () =>
        {
            this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                () =>
                {
                    console.log( 'Compilation finished! Can drag model!' );
                } );
        }, 20 );
    }

    //TODO: reset
    resetARAP()
    {
        if(this.enableARAP == false) return;

        for ( let i = 0; i < this.originalVertices.length; i++ )
        {
            this.model.geometry.attributes.position.setXY( i, this.originalVertices[ i ].x, this.originalVertices[ i ].y );
            this.testGeometry.vertices[i].x = this.originalVertices[i].x
            this.testGeometry.vertices[i].y = this.originalVertices[i].y
        }
        this.model.geometry.attributes.position.needsUpdate= true;
        this.deformedVertices = cloneVertices(this.testGeometry.vertices);
        this.LinearAlgebra.resetDeformedVertices(this.deformedVertices)
        this.handlesVisible = true;
        this.eraseAllHandle();
    }

    //TODO: store frame of deformation vertices
    // updateFrameListeners() {
    //   $('.framesContainer > img').click(function (event) {
    //     for (let i = 0; i < frames[$(this).index()].vertices.length; i++) {
    //         this.model.geometry.vertices[i].x = frames[$(this).index()].vertices[i].x;
    //       this.model.geometry.vertices[i].y = frames[$(this).index()].vertices[i].y;
    //       this.deformedVertices = cloneVertices(model.geometry.vertices);
    //     }
    //     this.model.geometry.verticesNeedUpdate = true;

    //     for (let i = 0; i < this.handles.length; i++) {
    //       this.eraseHandle(handles[i]);
    //     }
    //     this.handles = [];

    //     for (let i = 0; i < frames[$(this).index()].handles.length; i++) {
    //         this.handles.push(frames[$(this).index()].handles[i]);
    //         this.drawHandle(frames[$(this).index()].handles[i]);
    //     }

    //     keyFrameMode = true;
    //   });
    // }

    //TODO: windows resize?

    attachEvent()
    {
        document.addEventListener( "mousedown", this.mouseDown.bind( this ) );
        document.addEventListener( "mouseup", this.mouseUp.bind( this ) );
        document.addEventListener( "mousemove", this.mouseMove.bind( this ) );
    }
}

