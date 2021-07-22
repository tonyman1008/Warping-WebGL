import * as THREE from 'three'
import LinearAlgebra from './linearAlgebra';
import {cloneVertices,isBorderEdge,createTrianglesFromFaces} from './extras'
import {Edge} from './edge'

// var camera, scene, renderer, mesh;
// var origin = new THREE.Vector3(0, 0, 0);
// var cameraPosition = new THREE.Vector3(0, 0, 4);
// var model = null;
// var handles = [];
// var edges = [];
// var frames = [];
// var noFrame = 1;
// var keyFrameMode = false;
// var selectedHandle = null;
// var originalVertices = null;
// var deformedVertices = null;
// var barycentricCoordMode = false;

export default class ASAP
{

    constructor( iCamera, iScene, iRenderer )
    {
        this.camera = iCamera
        this.scene = iScene
        this.renderer = iRenderer
        this.mesh = null;
        this.origin = new THREE.Vector3( 0, 0, 0 );
        this.cameraPosition = new THREE.Vector3( 0, 0, 4 );
        this.model = null;
        this.handles = [];
        this.edges = [];
        this.frames = [];
        this.noFrame = 1;
        this.faces = [];
        this.keyFrameMode = false;
        this.selectedHandle = null;
        this.originalVertices = null;
        this.deformedVertices = null;
        this.barycentricCoordMode = false;

        this.clickedOnHandle = false

        this.LinearAlgebra = new LinearAlgebra();
        console.log( "test" )
    }

    contextMenu( event )
    {
        if ( this.keyFrameMode )
        {
            // $('.infoText').text('Viewing Keyframe. Please click "Reset" to start again.');
            console.log( 'Viewing Keyframe. Please click "Reset" to start again.' );
            return false;
        }

        var x = event.clientX;
        var y = event.clientY;
        var handleToRemove = null;

        if ( this.barycentricCoordMode )
        {
            var nearestHandleIndex = this.getNearestHandleIndex( x, y, this.deformedVertices );
            if ( this.handleExistsBaryCentricMode( nearestHandleIndex ) )
            {
                handleToRemove = this.getHandleBaryCentricMode( nearestHandleIndex );
                this.eraseHandle( handleToRemove );
                this.handles.splice( nearestHandleIndex, 1 );
                // $('.infoText').text('Compilation started! Removing marker! Please Wait..');
                console.log( 'Compilation started! Removing marker! Please Wait..' );
                setTimeout( function ()
                {
                    this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                        function ()
                        {
                            // $('.infoText').text('Compilation finished! Can drag model!');
                            console.log( 'Compilation finished! Can drag model!' );
                        } );
                }, 20 );
            }
        } else
        {
            var nearestVertexIndex = this.getNearestModelVertexIndex( x, y, this.deformedVertices );
            if ( this.handleExists( nearestVertexIndex ) )
            {
                handleToRemove = this.getHandle( nearestVertexIndex );
                this.eraseHandle( handleToRemove );
                this.handles = this.handles.filter( it => it.v_index != handleToRemove.v_index );
                // $('.infoText').text('Compilation started! Removing marker! Please Wait..');
                console.log( 'Compilation started! Removing marker! Please Wait..' );
                setTimeout( function ()
                {
                    this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                        function ()
                        {
                            // $('.infoText').text('Compilation finished! Can drag model!');
                            console.log( 'Compilation finished! Can drag model!' );
                        } );
                }, 20 );
            }
        }
        return false;
    }

    getNearestHandleIndex( x, y, vertices )
    {
        var mouseTarget = this.getPointInWorldCoordinates( x, y );
        var distanceFromHandle = 0;
        var distanceTolerance = this.cameraPosition.z / 100;
        var closestHandleIndex = null;

        for ( var i = 0; i < this.handles.length; i++ )
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
        var vector = new THREE.Vector3();
        vector.set( ( x / window.innerWidth ) * 2 - 1, -( y / window.innerHeight ) * 2 + 1, 0.5 );
        vector.unproject( this.camera );
        var dir = vector.sub( this.camera.position ).normalize();
        var distance = - this.camera.position.z / dir.z;
        var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );

        return pos;
    };

    eraseHandle( handle )
    {
        for ( var i = 0; i < this.handles.length; i++ )
        {
            if ( this.handles[ i ].v_index == this.handle.v_index )
            {
                this.scene.remove( handle );
                break;
            }
        }
        this.updateScene();
    }

    getHandleBaryCentricMode( index )
    {
        this.handle = null;
        for ( var i = 0; i < this.handles.length; i++ )
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
        for ( var i = 0; i < this.handles.length; i++ )
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
        for ( var i = 0; i < this.handles.length; i++ )
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
        for ( var i = 0; i < this.handles.length; i++ )
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
        var mouseTarget = this.getPointInWorldCoordinates( x, y );
        var distanceFromVertex = 0;
        var distanceTolerance = this.cameraPosition.z / 100;;
        var closestVertexIndex = null;

        for ( var i = 0; i < vertices.length; i++ )
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

    mouseClick_left( event )
    {
        var leftClicked = event.which == 1 ? true : false;
        if ( leftClicked )
        {
            var x = event.clientX;
            var y = event.clientY;

            if ( this.barycentricCoordMode )
            {
                var worldPos = this.getPointInWorldCoordinates( x, y );
                var nearestHandle = null;
                var nearestHandleIndex = this.getNearestHandleIndex( x, y, this.deformedVertices );
                var newHandle = null;

                if ( this.handleExistsBaryCentricMode( nearestHandleIndex ) )
                {
                    this.selectedHandle = this.getHandleBaryCentricMode( nearestHandleIndex );
                    this.clickedOnHandle = true;
                } else
                {
                    this.clickedOnHandle = false;
                    newHandle = this.createHandleAtPosition( worldPos, this.model.geometry.faces, this.deformedVertices );
                    this.handles.push( newHandle );
                    console.log( 'Compilation started! Adding marker! Please Wait..' );
                    setTimeout( function ()
                    {
                        this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                            function ()
                            {
                                console.log( 'Compilation finished! Can drag model!' );
                                this.drawHandle( newHandle );
                            } );
                    }, 20 );
                }
            } else
            {
                var nearestVertex = null;
                var nearestVertexIndex = this.getNearestModelVertexIndex( x, y, this.deformedVertices );
                var newHandle = null;

                if ( this.handleExists( nearestVertexIndex ) )
                {
                    this.selectedHandle = this.getHandle( nearestVertexIndex );
                    this.clickedOnHandle = true;
                } else
                {
                    this.clickedOnHandle = false;
                    if ( nearestVertexIndex != null )
                    {
                        newHandle = this.createHandleAtVertex( nearestVertexIndex, this.deformedVertices );
                        this.handles.push( newHandle );
                        console.log( 'Compilation started! Adding marker! Please Wait..' );
                        setTimeout( function ()
                        {
                            this.LinearAlgebra.compilation( this.handles, this.originalVertices, this.barycentricCoordMode,
                                function ()
                                {
                                    console.log( 'Compilation finished! Can drag model!' );
                                    this.drawHandle( newHandle );
                                } );
                        }, 20 );
                    } else
                    {
                        console.log( 'No vertex found!' );
                    }
                }
            }

        }
    }

    mouseMove(event){
      if (this.keyFrameMode) {
        console.log('Viewing Keyframe. Please click "Reset" to start again.');
        return false;
      }

      if (this.clickedOnHandle) {
        var x = event.clientX;
        var y = event.clientY;
        var mouseTarget = this.getPointInWorldCoordinates(x, y);

        //this will update handles[i] element that is selectedHandle
        this.selectedHandle.position.x = mouseTarget.x;
        this.selectedHandle.position.y = mouseTarget.y;

        // model might not have loaded so might need to moved listeners to after the 
        // model has loaded
        let newVertices = this.LinearAlgebra.manipulation(this.handles, this.edges, this.originalVertices);
        for (var i = 0; i < newVertices.length; i++) {
            this.model.geometry.vertices[i].x = newVertices[i].x;
            this.model.geometry.vertices[i].y = newVertices[i].y;
        }

        this.model.geometry.verticesNeedUpdate = true;
        this.updateScene();
      }
    }

    mouseUp(event)
    {
      if (this.clickedOnHandle) {
        this.clickedOnHandle = false;
      }
    }

    // updateFrameListeners() {
    //   $('.framesContainer > img').click(function (event) {
    //     for (var i = 0; i < frames[$(this).index()].vertices.length; i++) {
    //         this.model.geometry.vertices[i].x = frames[$(this).index()].vertices[i].x;
    //       this.model.geometry.vertices[i].y = frames[$(this).index()].vertices[i].y;
    //       this.deformedVertices = cloneVertices(model.geometry.vertices);
    //     }
    //     this.model.geometry.verticesNeedUpdate = true;

    //     for (var i = 0; i < this.handles.length; i++) {
    //       this.eraseHandle(handles[i]);
    //     }
    //     this.handles = [];

    //     for (var i = 0; i < frames[$(this).index()].handles.length; i++) {
    //         this.handles.push(frames[$(this).index()].handles[i]);
    //         this.drawHandle(frames[$(this).index()].handles[i]);
    //     }

    //     this.updateScene();
    //     keyFrameMode = true;
    //   });
    // }

    // function reset(){
    //   localStorage.clear();
    //   location.reload();
    // }

    //  setBarycentricCoord(){
    //   if (localStorage.getItem("barycentricCoord") == 'true') {
    //     localStorage.setItem("barycentricCoord", 'false');
    //   } else {
    //     localStorage.setItem("barycentricCoord", 'true');
    //   }
    //   location.reload();
    // }

     setWeight(weight){
      this.w = weight;
    }



    // function loadObj(objPath) {
    //   var loader = new THREE.OBJLoader();
    //   loader.load(
    //     objPath,
    //     function (object) {
    //       child = object.children[0];
    //       var geometry = new THREE.Geometry().fromBufferGeometry(child.geometry);
    //       geometry.mergeVertices();
    //       var material = new THREE.MeshBasicMaterial({ wireframe: true });
    //       model = new THREE.Mesh(geometry, material);

    //       scene.add(model);
    //       initializeFromMesh(model);
    //       this.updateScene();
    //     },
    //     function (xhr) {
    //       console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    //     },
    //     function (error) {
    //       console.log('An error happened');
    //     }
    //   );
    // };

    initializeFromMesh( mesh )
    {
        this.faces = mesh.geometry.faces;
        for ( var i = 0; i < this.faces.length; i++ )
        {
            var currentEdge1 = new Edge( this.faces[ i ].a, this.faces[ i ].b, i );
            var currentEdge2 = new Edge( this.faces[ i ].b, this.faces[ i ].c, i );
            var currentEdge3 = new Edge( this.faces[ i ].a, this.faces[ i ].c, i );

            if ( !Edge.edgeDoesExist( this.edges, currentEdge1 ) ) { this.edges.push( currentEdge1 ); }
            if ( !Edge.edgeDoesExist( this.edges, currentEdge2 ) ) { this.edges.push( currentEdge2 ); }
            if ( !Edge.edgeDoesExist( this.edges, currentEdge3 ) ) { this.edges.push( currentEdge3 ); }
        }

        for ( var i = 0; i < this.edges.length; i++ )
        {
            if ( isBorderEdge( this.edges[ i ], this.faces ) )
            {
                this.edges[ i ].setIsBorderEdge( true );
            } else
            {
                this.dges[ i ].setIsBorderEdge( false );
            }
        }

        var allEdges = Edge.getAllEdges( this.faces );
        for ( var i = 0; i < this.edges.length; i++ )
        {
            var neighbors = Edge.getEdgeNeighbors( this.edges[ i ], allEdges, this.faces );
            this.edges[ i ].setNeighbors( neighbors );
        }

        this.originalVertices = cloneVertices( this.model.geometry.vertices );
        this.deformedVertices = cloneVertices( this.model.geometry.vertices );
        this.LinearAlgebra.registration( this.dges, this.originalVertices );
    }

    createHandleAtVertex( index, vertices )
    {
        var vertex = vertices[ index ];
        var newHandle = null;
        var uniformScale = this.cameraPosition.z / 120;
        var geometry = new THREE.SphereGeometry( 1, 32, 32 );
        var material = new THREE.MeshPhongMaterial( { shininess: 1 } );
        var newHandle = new THREE.Mesh( geometry, material );

        newHandle.position.set( vertex.x, vertex.y, vertex.z );
        newHandle.scale.set( uniformScale, uniformScale, uniformScale );
        newHandle.v_index = index;

        return newHandle;
    }

    drawHandle( handle )
    {
        this.scene.add( handle );
        this.updateScene();
    }



    createHandleAtPosition( worldPos, faces, vertices )
    {
        var triangles = createTrianglesFromFaces(this.model.geometry.faces, vertices );
        var newHandle = null;
        var uniformScale = this.cameraPosition.z / 120;
        for ( var i = 0; i < triangles.length; i++ )
        {
            if ( triangles[ i ].containsPoint( worldPos ) )
            {

                var x1y1 = new THREE.Vector3( triangles[ i ].a.x, triangles[ i ].a.y, triangles[ i ].a.z );
                var x2y2 = new THREE.Vector3( triangles[ i ].b.x, triangles[ i ].b.y, triangles[ i ].b.z );
                var x3y3 = new THREE.Vector3( triangles[ i ].c.x, triangles[ i ].c.y, triangles[ i ].c.z );

                var triangleA = new THREE.Triangle( x3y3, x2y2, x1y1 );
                var triangleA1 = new THREE.Triangle( x3y3, x2y2, worldPos );
                var triangleA2 = new THREE.Triangle( x1y1, x3y3, worldPos );
                var triangleA3 = new THREE.Triangle( x1y1, x2y2, worldPos );

                var areaA = triangleA.area();
                var areaA1 = triangleA1.area();
                var areaA2 = triangleA2.area();
                var areaA3 = triangleA3.area();

                var l1 = areaA1 / areaA;
                var l2 = areaA2 / areaA;
                var l3 = areaA3 / areaA;

                x1y1 = x1y1.multiplyScalar( l1 );
                x2y2 = x2y2.multiplyScalar( l2 );
                x3y3 = x3y3.multiplyScalar( l3 );

                var p = x1y1.add( x2y2 ).add( x3y3 );

                var geometry = new THREE.SphereGeometry( 1, 32, 32 );
                var material = new THREE.MeshPhongMaterial( { shininess: 1 } );
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

    updateScene()
    {
        this.renderer.render( this.scene, this.camera );
    };
}

/////////////////////////////////////////////////////////////////////////////////////////


    // function initialization(objFile) {

    //     barycentricCoordMode = false;
    //     var clickedOnHandle = false;

    // scene = new THREE.Scene();
    // camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    // camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    // camera.lookAt(origin);

    // var light = new THREE.PointLight('red', 1, 0);
    // light.position.set(10, 10, 10);
    // scene.add(light);

    // renderer = new THREE.WebGLRenderer({ antialias: true, canvas: drawingSurface });
    // renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // renderer.gammaInput = true;
    // renderer.gammaOutput = true;
    // renderer.render(scene, camera);

    // loadObj(objFile);
    // renderAxes();
    // };

