import * as math from 'mathjs';
import { getVertex, getEdgeVectorFromEdge } from './extras';

export default class LinearAlgebra
{
  constructor()
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
    this.w = 1;
    this.deformedVertices = [];
  }

  registration( edges, vertices, deformedVertices )
  {
    // add
    this.deformedVertices = deformedVertices;

    let gk, hk, gkTerm = null;
    for ( let i = 0; i < edges.length; i++ )
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
    if ( handles.length == 0 )
      return;

    // console.time( 'buildC12' )
    this.C1 = this.buildC1( handles, vertices, barycentricMode );
    this.C2 = this.buildC2( handles, vertices, barycentricMode );
    // console.timeEnd( 'buildC12' )


    this.A1 = math.concat( this.L1, this.C1, 0 );
    this.A2 = math.concat( this.L2, this.C2, 0 );

    this.A1 = math.sparse( this.A1.toArray() );
    this.A2 = math.sparse( this.A2.toArray() );

    console.time( 'Transpose' )
    const A1_Transpose = math.transpose( this.A1 );
    const A2_Transpose = math.transpose( this.A2 );
    console.timeEnd( 'Transpose' )
    console.time( 'mult' )
    const multA1 = math.multiply( A1_Transpose, this.A1 );
    const multA2 = math.multiply( A2_Transpose, this.A2 );
    console.timeEnd( 'mult' )
    console.time( 'inv' )
    const invA1 = math.inv( multA1 );
    const invA2 = math.inv( multA2 );
    console.timeEnd( 'inv' )
    console.time( 'mult2' )
    this.A1Term = math.multiply( invA1, A1_Transpose );
    this.A2Term = math.multiply( invA2, A2_Transpose );
    console.timeEnd( 'mult2' )

    // this.A1Term = math.multiply( math.inv( math.multiply( A1_Transpose, this.A1 ) ), A1_Transpose )
    // this.A2Term = math.multiply( math.inv( math.multiply( A2_Transpose, this.A2 ) ), A2_Transpose )

    // this.A1Term = ( A1_Transpose.multiply( this.A1 ) ).inv().multiply( A1_Transpose );
    // this.A2Term = ( A2_Transpose.multiply( this.A2 ) ).inv().multiply( A2_Transpose );

    _callback();
  }


  buildC1( handles, vertices, barycentricMode )
  {

    let C1 = math.zeros( handles.length * 2, vertices.length * 2 );
    if ( barycentricMode )
    {
      for ( let i = 0; i < handles.length; i++ )
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
      for ( let i = 0; i < handles.length; i++ )
      {
        C1.set( [ 2 * i, 2 * handles[ i ].v_index ], this.w );
        C1.set( [ 2 * i + 1, 2 * handles[ i ].v_index + 1 ], this.w );
      }
    }

    return C1;
  }

  buildC2( handles, vertices, barycentricMode )
  {
    let C2 = math.zeros( handles.length, vertices.length );
    if ( barycentricMode )
    {
      for ( let i = 0; i < handles.length; i++ )
      {
        C2.set( [ i, handles[ i ].triangleV1Index ], this.w * ( handles[ i ].l1 ) );
        C2.set( [ i, handles[ i ].triangleV2Index ], this.w * ( handles[ i ].l2 ) );
        C2.set( [ i, handles[ i ].triangleV3Index ], this.w * ( handles[ i ].l3 ) );
      }
    } else
    {
      for ( let i = 0; i < handles.length; i++ )
      {
        C2.set( [ i, handles[ i ].v_index ], this.w );
      }
    }
    return C2;
  }

  getHkFromEdge( edge, vertices, gkTerm )
  {
    const edgeStartVertex = getVertex( edge.start, vertices );
    const edgeEndVertex = getVertex( edge.end, vertices );
    let ekx = edgeEndVertex.x - edgeStartVertex.x;
    let eky = edgeEndVertex.y - edgeStartVertex.y;
    let ekxyTerm = math.matrix( [ [ ekx, eky ], [ eky, -ekx ] ] );
    let constantTerm = null;

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

    let h = math.subtract( constantTerm, math.multiply( ekxyTerm, gkTermTopTwoRows ) );
    return h;
  }

  buildL1( Hks, edges )
  {
    console.time( 'l1' )

    let L1 = math.sparse();
    for ( let i = 0; i < Hks.length; i++ )
    {
      for ( let j = 0; j < Hks[ i ].size()[ 1 ]; j++ )
      {
        L1.set( [ 2 * i, edges[ i ].HNeighbors.get( [ j, 0 ] ) ], Hks[ i ].get( [ 0, j ] ) )
        L1.set( [ 2 * i + 1, edges[ i ].HNeighbors.get( [ j, 0 ] ) ], Hks[ i ].get( [ 1, j ] ) )
      }
    }
    console.timeEnd( 'l1' )
    return L1;
  }

  buildL2( edges )
  {
    console.time( 'l2' )
    let L2 = math.sparse();
    for ( let i = 0; i < edges.length; i++ )
    {
      L2.set( [ i, edges[ i ].end ], 1 );
      L2.set( [ i, edges[ i ].start ], -1 );
    }
    console.timeEnd( 'l2' )
    return L2;
  }

  manipulation( handles, edges, origVertices )
  {
    let b1 = this.buildB1( handles, edges );
    let similarityTransformResult = this.similarityTransform( b1 );

    let b2x = this.buildB2( handles, edges, similarityTransformResult, origVertices, 'x' );
    let b2y = this.buildB2( handles, edges, similarityTransformResult, origVertices, 'y' );

    let scaleAdjustmentResult = this.scaleAdjustmentRenameMe( b2x, b2y );

    return scaleAdjustmentResult;
  }

  similarityTransform( b1 )
  {
    b1 = math.sparse( b1.toArray() );
    let res = math.multiply( this.A1Term, b1 );
    // let res = this.A1Term.multiply( b1 );
    for ( let i = 0; i < this.deformedVertices.length; i++ )
    {
      this.deformedVertices[ i ].x = math.subset( res, math.index( 2 * i, 0 ) );
      this.deformedVertices[ i ].y = math.subset( res, math.index( 2 * i + 1, 0 ) );
      // this.deformedVertices[ i ].x = res.get( 2 * i, 0 );
      // this.deformedVertices[ i ].y = res.get( 2 * i + 1, 0 );
    }
    return this.deformedVertices;
  }

  scaleAdjustmentRenameMe( b2x, b2y )
  {
    b2x = math.sparse( b2x.toArray() );
    b2y = math.sparse( b2y.toArray() );
    let resx = math.multiply( this.A2Term, b2x );
    let resy = math.multiply( this.A2Term, b2y );
    // let resx = this.A2Term.multiply( b2x );
    // let resy = this.A2Term.multiply( b2y );

    for ( let i = 0; i < this.deformedVertices.length; i++ )
    {
      this.deformedVertices[ i ].x = math.subset( resx, math.index( i, 0 ) )
      this.deformedVertices[ i ].y = math.subset( resy, math.index( i, 0 ) )
      // this.deformedVertices[ i ].x = resx.get( i, 0 );
      // this.deformedVertices[ i ].y = resy.get( i, 0 );
    }
    return this.deformedVertices;
  }

  buildB1( handles, edges )
  {
    let b1EdgeVectors = math.sparse( math.zeros( [ edges.length * 2, 1 ] ) );
    let b1Handles = math.sparse();
    let b1 = math.sparse();
    for ( let i = 0; i < handles.length; i++ )
    {
      b1Handles.set( [ 2 * i, 0 ], this.w * handles[ i ].position.x );
      b1Handles.set( [ 2 * i + 1, 0 ], this.w * handles[ i ].position.y );
    }
    b1 = math.concat( b1EdgeVectors, b1Handles, 0 );

    return b1;
  }

  buildB2( handles, edges, newVertices, origVertices, axis )
  {
    var axisFlag = ( axis == 'x' ? 0 : 1 );
    let b2EdgeVectors = math.sparse();
    let b2Handles = math.sparse();
    let b2 = math.sparse();
    let Tks = this.getTks( edges, this.Gks, newVertices );

    for ( let i = 0; i < edges.length; i++ )
    {
      let ek = getEdgeVectorFromEdge( edges[ i ], origVertices );
      b2EdgeVectors.set( [ i, 0 ], math.multiply( Tks[ i ], ek ).get( [ axisFlag, 0 ] ) );
    }

    for ( let i = 0; i < handles.length; i++ )
    {
      b2Handles.set( [ i, 0 ], ( axisFlag == 0 ? this.w * handles[ i ].position.x : this.w * handles[ i ].position.y ) )
    }

    b2 = math.concat( b2EdgeVectors, b2Handles, 0 );

    return b2;
  }

  getTks( edges, Gks, vertices )
  {
    let Tks = [];
    for ( let i = 0; i < edges.length; i++ )
    {
      let edgeNeighbors = math.sparse();
      for ( let k = 0; k < edges[ i ].neighbors.length; k++ )
      {
        edgeNeighbors.set( [ 2 * k, 0 ], getVertex( edges[ i ].neighbors[ k ], vertices ).x );
        edgeNeighbors.set( [ 2 * k + 1, 0 ], getVertex( edges[ i ].neighbors[ k ], vertices ).y );
      }

      let gkTerm = this.GkTerms[ i ];
      let gkTermTopTwoRows = math.evaluate( 'gkTerm[1:2,:]', {
        gkTerm,
      } );

      let cksk = math.multiply( gkTermTopTwoRows, edgeNeighbors );
      let ck = cksk.get( [ 0, 0 ] );
      let sk = cksk.get( [ 1, 0 ] );
      let Tk = math.sparse( [ [ ck, sk ], [ -sk, ck ] ] );
      let normalizationTerm = math.sqrt( math.add( math.square( ck ), math.square( sk ) ) );
      Tk = math.dotDivide( Tk, normalizationTerm );
      Tks.push( Tk );
    }
    return Tks;
  }

  getGkMatrix( edge, vertices, includeTranslation )
  {
    let vi, vj, vl, vr = null;
    let gk = null;
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

  resetDeformedVertices( deformedVertices )
  {
    this.deformedVertices = deformedVertices
  }

  reset()
  {

  }

  //
  manipulation_test( handlesPos, edges, origVertices )
  {
    
      let b1 = this.buildB1_test( handlesPos, edges );
      let similarityTransformResult = this.similarityTransform_test( b1 );

      let b2x = this.buildB2_test( handlesPos, edges, similarityTransformResult, origVertices, 'x' );
      let b2y = this.buildB2_test( handlesPos, edges, similarityTransformResult, origVertices, 'y' );

      let scaleAdjustmentResult = this.scaleAdjustmentRenameMe_test( b2x, b2y );
      return scaleAdjustmentResult;
  }

  similarityTransform_test( b1 )
  {
    b1 = math.sparse( b1.toArray() );
    let res = math.multiply( this.A1Term, b1 );
    // let res = this.A1Term.multiply( b1 );
    for ( let i = 0; i < this.deformedVertices.length; i++ )
    {
      this.deformedVertices[ i ].x = math.subset( res, math.index( 2 * i, 0 ) );
      this.deformedVertices[ i ].y = math.subset( res, math.index( 2 * i + 1, 0 ) );
      // this.deformedVertices[ i ].x = res.get( 2 * i, 0 );
      // this.deformedVertices[ i ].y = res.get( 2 * i + 1, 0 );
    }
    return this.deformedVertices;
  }

  scaleAdjustmentRenameMe_test( b2x, b2y )
  {
    b2x = math.sparse( b2x.toArray() );
    b2y = math.sparse( b2y.toArray() );
    let resx = math.multiply( this.A2Term, b2x );
    let resy = math.multiply( this.A2Term, b2y );
    // let resx = this.A2Term.multiply( b2x );
    // let resy = this.A2Term.multiply( b2y );

    for ( let i = 0; i < this.deformedVertices.length; i++ )
    {
      this.deformedVertices[ i ].x = math.subset( resx, math.index( i, 0 ) )
      this.deformedVertices[ i ].y = math.subset( resy, math.index( i, 0 ) )
      // this.deformedVertices[ i ].x = resx.get( i, 0 );
      // this.deformedVertices[ i ].y = resy.get( i, 0 );
    }
    return this.deformedVertices;
  }

  buildB1_test( handlesPos, edges )
  {
    let b1EdgeVectors = math.sparse( math.zeros( [ edges.length * 2, 1 ] ) );
    let b1Handles = math.sparse();
    let b1 = math.sparse();
    for ( let i = 0; i < handlesPos.length; i++ )
    {
      b1Handles.set( [ 2 * i, 0 ], this.w * handlesPos[ i ].x );
      b1Handles.set( [ 2 * i + 1, 0 ], this.w * handlesPos[ i ].y );
    }
    b1 = math.concat( b1EdgeVectors, b1Handles, 0 );

    return b1;
  }

  buildB2_test( handlesPos, edges, newVertices, origVertices, axis )
  {
    var axisFlag = ( axis == 'x' ? 0 : 1 );
    let b2EdgeVectors = math.sparse();
    let b2Handles = math.sparse();
    let b2 = math.sparse();
    let Tks = this.getTks( edges, this.Gks, newVertices );

    for ( let i = 0; i < edges.length; i++ )
    {
      let ek = getEdgeVectorFromEdge( edges[ i ], origVertices );
      b2EdgeVectors.set( [ i, 0 ], math.multiply( Tks[ i ], ek ).get( [ axisFlag, 0 ] ) );
    }

    for ( let i = 0; i < handlesPos.length; i++ )
    {
      b2Handles.set( [ i, 0 ], ( axisFlag == 0 ? this.w * handlesPos[ i ].x : this.w * handlesPos[ i ].y ) )
    }

    b2 = math.concat( b2EdgeVectors, b2Handles, 0 );

    return b2;
  }
}





