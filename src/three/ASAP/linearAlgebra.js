import * as math from 'mathjs';
// import { NDArray } from 'vectorious';
import { getVertex,getEdgeVectorFromEdge } from './extras';
// var Gks = [];
// var GkTerms = [];
// var Hks = [];
// var L1 = null;
// var L2 = null;
// var this.C1 = null;
// var this.C2 = null;
// var this.A1 = null;
// var A2 = null;
// var INVA1TA1 = null;
// var INVA2TA2 = null;
// var A1Term = null;
// var A2Term = null;
// var w = 1000;

export default class LinearAlgebra
{
  constructor( )
  {
    this.Gks = [];
    this.GkTerms = [];
    this.Hks = [];
    this.L1 = null;
    this.L2 = null;
    this.C1 = null;
    this.C2 = null;
    this.A1 = null;
    this.A2 = null;
    this.INVA1TA1 = null;
    this.INVA2TA2 = null;
    this.A1Term = null;
    this.A2Term = null;
    this.w = 1000;
    this.deformedVertices = [];
  }

  registration( edges, vertices,deformedVertices )
  {
    // add
    this.deformedVertices = deformedVertices;

    var gk, hk, gkTerm = null;
    for ( var i = 0; i < edges.length; i++ )
    {
      gk = this.getGkMatrix( edges[ i ], vertices, true );
      this.Gks.push( gk );
      gkTerm = math.multiply( math.inv( math.multiply( math.transpose( gk ), gk ) ), math.transpose( gk ) );
      this.GkTerms.push( gkTerm );
      hk = this.getHkFromEdge( edges[ i ], vertices, gkTerm );
      this.Hks.push( hk );
    }

    this.L1 = this.buildL1( this.Hks, edges );
    this.L2 = this.buildL2( edges );
  }

  compilation( handles, vertices, barycentricMode, _callback )
  {
    this.C1 = this.buildC1( handles, vertices, barycentricMode );
    this.C2 = this.buildC2( handles, vertices, barycentricMode );

    this.A1 = math.concat( this.L1, this.C1, 0 );
    this.A2 = math.concat( this.L2, this.C2, 0 );
    console.log( this.A1.toArray() );
    this.A1 = math.matrix( this.A1.toArray() );
    this.A2 = math.matrix( this.A2.toArray() );
    console.log( this.A1 );

    const A1_Transpose = math.transpose( this.A1 );
    const A2_Transpose = math.transpose( this.A2 );
    this.A1Term = math.multiply( math.inv( math.multiply( A1_Transpose, this.A1 ) ), A1_Transpose )
    this.A2Term = math.multiply( math.inv( math.multiply( A2_Transpose, this.A2 ) ), A2_Transpose )
    // this.A1Term = ( A1_Transpose.multiply( this.A1 ) ).inv().multiply( A1_Transpose );
    // this.A2Term = ( A2_Transpose.multiply( this.A2 ) ).inv().multiply( A2_Transpose );

    //syntax ?
    // A1Term = (A1.transpose().multiply(A1)).inverse().multiply(A1.transpose());
    // A2Term = (A2.transpose().multiply(A2)).inverse().multiply(A2.transpose());

    _callback();
  }


  buildC1( handles, vertices, barycentricMode )
  {
    var C1 = math.zeros( handles.length * 2, vertices.length * 2 );
    if ( barycentricMode )
    {
      for ( var i = 0; i < handles.length; i++ )
      {
        C1.set( [ 2 * i, 2 * handles[ i ].triangleV1Index ], this.w * ( handles[ i ].l1 ) );
        C1.set( [ 2 * i + 1, 2 * handles[ i ].triangleV1Index + 1 ], this.w * ( handles[ i ].l1 ) );
        C1.set( [ 2 * i, 2 * handles[ i ].triangleV2Index ], this.w * ( handles[ i ].l2 ) );
        C1.set( [ 2 * i + 1, 2 * handles[ i ].triangleV2Index + 1 ], this.w * ( handles[ i ].l2 ) );
        C1.set( [ 2 * i, 2 * handles[ i ].triangleV3Index ], this.w * ( handles[ i ].l3 ) );
        C1.set( [ 2 * i + 1, 2 * handles[ i ].triangleV3Index + 1 ], this.w * ( handles[ i ].l3 ) );
      }
    } else
    {
      for ( var i = 0; i < handles.length; i++ )
      {
        C1.set( [ 2 * i, 2 * handles[ i ].v_index ], this.w );
        C1.set( [ 2 * i + 1, 2 * handles[ i ].v_index + 1 ], this.w );
      }
    }
    return C1;
  }

  buildC2( handles, vertices, barycentricMode )
  {
    var C2 = math.zeros( handles.length, vertices.length );
    if ( barycentricMode )
    {
      for ( var i = 0; i < handles.length; i++ )
      {
        C2.set( [ i, handles[ i ].triangleV1Index ], this.w * ( handles[ i ].l1 ) );
        C2.set( [ i, handles[ i ].triangleV2Index ], this.w * ( handles[ i ].l2 ) );
        C2.set( [ i, handles[ i ].triangleV3Index ], this.w * ( handles[ i ].l3 ) );
      }
    } else
    {
      for ( var i = 0; i < handles.length; i++ )
      {
        C2.set( [ i, handles[ i ].v_index ], this.w );
      }
    }
    return C2;
  }

  getHkFromEdge( edge, vertices, gkTerm )
  {
    var edgeStartVertex = getVertex( edge.start, vertices );
    var edgeEndVertex = getVertex( edge.end, vertices );
    var ekx = edgeEndVertex.x - edgeStartVertex.x;
    var eky = edgeEndVertex.y - edgeStartVertex.y;
    var ekxyTerm = math.matrix( [ [ ekx, eky ], [ eky, -ekx ] ] );
    var constantTerm = null;

    if ( edge.isBorderEdge )
    {
      constantTerm = math.matrix( [ [ -1, 0, 1, 0, 0, 0 ],
      [ 0, -1, 0, 1, 0, 0 ] ] );
    } else
    {
      constantTerm = math.matrix( [ [ -1, 0, 1, 0, 0, 0, 0, 0 ],
      [ 0, -1, 0, 1, 0, 0, 0, 0 ] ] );
    }

    let gkTermTopTwoRows = math.evaluate( 'gkTerm[1:2,:]', {
      gkTerm,
    } );

    var h = math.subtract( constantTerm, math.multiply( ekxyTerm, gkTermTopTwoRows ) );
    return h;
  }

  buildL1( Hks, edges )
  {
    var L1 = math.matrix();
    for ( var i = 0; i < Hks.length; i++ )
    {
      for ( var j = 0; j < Hks[ i ].size()[ 1 ]; j++ )
      {
        L1.set( [ 2 * i, edges[ i ].HNeighbors.get( [ j, 0 ] ) ], Hks[ i ].get( [ 0, j ] ) )
        L1.set( [ 2 * i + 1, edges[ i ].HNeighbors.get( [ j, 0 ] ) ], Hks[ i ].get( [ 1, j ] ) )
      }
    }
    return L1;
  }

  buildL2( edges )
  {
    var L2 = math.matrix();
    for ( var i = 0; i < edges.length; i++ )
    {
      L2.set( [ i, edges[ i ].end ], 1 );
      L2.set( [ i, edges[ i ].start ], -1 );
    }
    return L2;
  }

  manipulation( handles, edges, origVertices )
  {
    var b1 = this.buildB1( handles, edges );
    var similarityTransformResult = this.similarityTransform( b1 );

    var b2x = this.buildB2( handles, edges, similarityTransformResult, origVertices, 'x' );
    var b2y = this.buildB2( handles, edges, similarityTransformResult, origVertices, 'y' );

    var scaleAdjustmentResult = this.scaleAdjustmentRenameMe( b2x, b2y );

    return scaleAdjustmentResult;
  }

  similarityTransform( b1 )
  {
    b1 = math.matrix( b1.toArray() );
    var res = math.multiply( this.A1Term, b1 );
    // var res = this.A1Term.multiply( b1 );
    console.log(res);
    console.log(this.deformedVertices);
    for ( var i = 0; i < this.deformedVertices.length; i++ )
    {
      this.deformedVertices[ i ].x = math.subset(res,math.index(2*i,0));
      this.deformedVertices[ i ].y = math.subset(res,math.index(2*i+1,0));
      // this.deformedVertices[ i ].x = res.get( 2 * i, 0 );
      // this.deformedVertices[ i ].y = res.get( 2 * i + 1, 0 );
    }
    return this.deformedVertices;
  }

  scaleAdjustmentRenameMe( b2x, b2y )
  {
    b2x = math.matrix( b2x.toArray() );
    b2y = math.matrix( b2y.toArray() );
    var resx = math.multiply( this.A2Term, b2x );
    var resy = math.multiply( this.A2Term, b2y );
    // var resx = this.A2Term.multiply( b2x );
    // var resy = this.A2Term.multiply( b2y );

    for ( var i = 0; i < this.deformedVertices.length; i++ )
    {
      this.deformedVertices[ i ].x = math.subset(resx,math.index(i,0))
      this.deformedVertices[ i ].y = math.subset(resy,math.index(i,0))
      // this.deformedVertices[ i ].x = resx.get( i, 0 );
      // this.deformedVertices[ i ].y = resy.get( i, 0 );
    }
    return this.deformedVertices;
  }

  buildB1( handles, edges )
  {
    var b1EdgeVectors = math.matrix( math.zeros( [ edges.length * 2, 1 ] ) );
    var b1Handles = math.matrix();
    var b1 = math.matrix();
    for ( var i = 0; i < handles.length; i++ )
    {
      b1Handles.set( [ 2 * i, 0 ], this.w * handles[ i ].position.x );
      b1Handles.set( [ 2 * i + 1, 0 ], this.w * handles[ i ].position.y );
    }
    b1 = math.concat( b1EdgeVectors, b1Handles, 0 );

    return b1;
  }

  buildB2( handles, edges, newVertices, origVertices, axis )
  {
    var axis = ( axis == 'x' ? 0 : 1 );
    var b2EdgeVectors = math.matrix();
    var b2Handles = math.matrix();
    var b2 = math.matrix();
    var Tks = this.getTks( edges, this.Gks, newVertices );

    for ( var i = 0; i < edges.length; i++ )
    {
      var ek = getEdgeVectorFromEdge( edges[ i ], origVertices );
      b2EdgeVectors.set( [ i, 0 ], math.multiply( Tks[ i ], ek ).get( [ axis, 0 ] ) );
    }

    for ( var i = 0; i < handles.length; i++ )
    {
      b2Handles.set( [ i, 0 ], ( axis == 0 ? this.w * handles[ i ].position.x : this.w * handles[ i ].position.y ) )
    }

    b2 = math.concat( b2EdgeVectors, b2Handles, 0 );

    return b2;
  }

  getTks( edges, Gks, vertices )
  {
    var Tks = [];
    for ( var i = 0; i < edges.length; i++ )
    {
      var edgeNeighbors = math.matrix();
      for ( var k = 0; k < edges[ i ].neighbors.length; k++ )
      {
        edgeNeighbors.set( [ 2 * k, 0 ], getVertex( edges[ i ].neighbors[ k ], vertices ).x );
        edgeNeighbors.set( [ 2 * k + 1, 0 ], getVertex( edges[ i ].neighbors[ k ], vertices ).y );
      }

      var gkTerm = this.GkTerms[ i ];
      let gkTermTopTwoRows = math.evaluate( 'gkTerm[1:2,:]', {
        gkTerm,
      } );

      var cksk = math.multiply( gkTermTopTwoRows, edgeNeighbors );
      var ck = cksk.get( [ 0, 0 ] );
      var sk = cksk.get( [ 1, 0 ] );
      var Tk = math.matrix( [ [ ck, sk ], [ -sk, ck ] ] );
      var normalizationTerm = math.sqrt( math.add( math.square( ck ), math.square( sk ) ) );
      Tk = math.dotDivide( Tk, normalizationTerm );
      Tks.push( Tk );
    }
    return Tks;
  }

  getGkMatrix( edge, vertices, includeTranslation )
  {
    var vi, vj, vl, vr = null;
    var gk = null;
    if ( includeTranslation )
    {
      if ( edge.isBorderEdge )
      {
        vi = getVertex( edge.neighbors[ 0 ], vertices );
        vj = getVertex( edge.neighbors[ 1 ], vertices );
        vl = getVertex( edge.neighbors[ 2 ], vertices );
        gk = math.matrix( [ [ vi.x, vi.y, 1, 0 ],
        [ vi.y, -vi.x, 0, 1 ],
        [ vj.x, vj.y, 1, 0 ],
        [ vj.y, -vj.x, 0, 1 ],
        [ vl.x, vl.y, 1, 0 ],
        [ vl.y, -vl.x, 0, 1 ] ] );
      } else
      {
        vi = getVertex( edge.neighbors[ 0 ], vertices );
        vj = getVertex( edge.neighbors[ 1 ], vertices );
        vl = getVertex( edge.neighbors[ 2 ], vertices );
        vr = getVertex( edge.neighbors[ 3 ], vertices );
        gk = math.matrix( [ [ vi.x, vi.y, 1, 0 ],
        [ vi.y, -vi.x, 0, 1 ],
        [ vj.x, vj.y, 1, 0 ],
        [ vj.y, -vj.x, 0, 1 ],
        [ vl.x, vl.y, 1, 0 ],
        [ vl.y, -vl.x, 0, 1 ],
        [ vr.x, vr.y, 1, 0 ],
        [ vr.y, -vr.x, 0, 1 ] ] );
      }
    } else
    {
      if ( edge.isBorderEdge )
      {
        vi = getVertex( edge.neighbors[ 0 ], vertices );
        vj = getVertex( edge.neighbors[ 1 ], vertices );
        vl = getVertex( edge.neighbors[ 2 ], vertices );
        gk = math.matrix( [ [ vi.x, vi.y ],
        [ vi.y, -vi.x ],
        [ vj.x, vj.y ],
        [ vj.y, -vj.x ],
        [ vl.x, vl.y ],
        [ vl.y, -vl.x ] ] );
      } else
      {
        vi = getVertex( edge.neighbors[ 0 ], vertices );
        vj = getVertex( edge.neighbors[ 1 ], vertices );
        vl = getVertex( edge.neighbors[ 2 ], vertices );
        vr = getVertex( edge.neighbors[ 3 ], vertices );
        gk = math.matrix( [ [ vi.x, vi.y ],
        [ vi.y, -vi.x ],
        [ vj.x, vj.y ],
        [ vj.y, -vj.x ],
        [ vl.x, vl.y ],
        [ vl.y, -vl.x ],
        [ vr.x, vr.y ],
        [ vr.y, -vr.x ] ] );
      }
    }
    return gk;
  }

}





