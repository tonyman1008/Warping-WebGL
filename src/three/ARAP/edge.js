import * as math from 'mathjs';

class Edge
{
  constructor( start, end, parentFaceIndex )
  {
    this.start = start;
    this.end = end;
    this.parentFaceIndex = parentFaceIndex;
  }

  setNeighbors( neighbors )
  {
    this.HNeighbors = math.matrix();
    this.neighbors = neighbors;
    for ( let i = 0; i < neighbors.length; i++ )
    {
      this.HNeighbors.set( [ 2 * i, 0 ], 2 * neighbors[ i ] );
      this.HNeighbors.set( [ 2 * i + 1, 0 ], 2 * neighbors[ i ] + 1 );
    }
  }

  setIsBorderEdge( value )
  {
    this.isBorderEdge = value;
  }

  equals( edge )
  {
    let equal = false;
    if ( ( ( this.start == edge.start ) && ( this.end == edge.end ) ) ||
      ( ( this.start == edge.end ) && ( this.end == edge.start ) ) )
    {
      equal = true;
    }
    return equal;
  }

  static addNeighbors( neighbors, edge, face, faces )
  {
    //new face? 
    var face = faces[ edge.parentFaceIndex ];
    let vertex1 = face.a;
    let vertex2 = face.b;
    let vertex3 = face.c;

    if ( !neighbors.includes( vertex1 ) ) { neighbors.push( vertex1 ) };
    if ( !neighbors.includes( vertex2 ) ) { neighbors.push( vertex2 ) };
    if ( !neighbors.includes( vertex3 ) ) { neighbors.push( vertex3 ) };

    return neighbors;
  }

  static edgeDoesExist( edges, tmpEdge )
  {
    let exists = false;
    for ( let i = 0; i < edges.length; i++ )
    {
      if ( edges[ i ].equals( tmpEdge ) )
      {
        exists = true;
      }
    }
    return exists;
  }

  static getAllEdges( faces )
  {
    let allEdges = [];

    for ( let i = 0; i < faces.length; i++ )
    {

      let currentEdge1 = new Edge( faces[ i ].a, faces[ i ].b, i );
      let currentEdge2 = new Edge( faces[ i ].b, faces[ i ].c, i );
      let currentEdge3 = new Edge( faces[ i ].a, faces[ i ].c, i );

      allEdges.push( currentEdge1 );
      allEdges.push( currentEdge2 );
      allEdges.push( currentEdge3 );
    }
    return allEdges;
  }

  static getEdgeNeighbors( edge, allEdges, faces )
  {
    let count = 0;
    let neighbors = [];
    let face = null;
    neighbors.push( edge.start );
    neighbors.push( edge.end );
    for ( let i = 0; i < allEdges.length; i++ )
    {
      if ( edge.equals( allEdges[ i ] ) )
      {
        count++;
        face = faces[ allEdges[ i ].parentFaceIndex ]
        neighbors = this.addNeighbors( neighbors, allEdges[ i ], face, faces );
        // edge.this ???
      }
    }

    if ( count == 2 || count == 1 ) { return neighbors }

    return neighbors;
  }

  static getBorderEdges( edges, faces )
  {
    let borderEdges = [];
    for ( let i = 0; i < edges.length; i++ )
    {
      if ( Edge.isBorderEdge( edges[ i ], faces ) )
      {
        borderEdges.push( edges[ i ] );
      }
    }
    return borderEdges;
  }

  static getNonBorderEdges( edges, faces )
  {
    let nonBorderEdges = [];
    for ( let i = 0; i < edges.length; i++ )
    {
      if ( !Edge.isBorderEdge( edges[ i ], faces ) )
      {
        nonBorderEdges.push( edges[ i ] );
      }
    }
    return nonBorderEdges;
  }
}

export { Edge };