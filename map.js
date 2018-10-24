
let createMap = function( svg, file ) {//minlat, maxlat, minlon, maxlon,  ) {
    var width = +svg.attr("width");
    var height = +svg.attr("height");
    let scale = 1.0;
    let dragStart = null;
    let contours = [];
    let tracts = {features:[]};
    let marks = [];

    // color scale for land height
    // let color = d3.scaleQuantize()
    //      .range(['#ACD0A5','#94BF8B','#A8C68F','#BDCC96','#D1D7AB','#E1E4B5','#EFEBC0','#E8E1B6','#DED6A3','#D3CA9D','#CAB982','#C3A76B','#B9985A','#AA8753','#AC9A7C','#BAAE9A','#CAC3B8','#E0DED8','#F5F4F2'])
         // colors provided by 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Maps/Conventions'
         // TODO, how do I fix this to the representative elevations; the article has no clues...
    let color = d3.scaleLinear()
        .range(['#222', '#ddd'])
        .domain([0, 4000]);

    // scales for screen coordinates to rotation
    var lambda = d3.scaleLinear()
        .domain([-width, width])
        .range([-180, 180]);
    var phi = d3.scaleLinear()
        .domain([-height, height])
        .range([90, -90]);

    // Projection for central Nevada, EPSG:32108
    // let projection = d3.geoIdentity();
    let projection = d3.geoTransverseMercator()
        .rotate([116 + 40 / 60, -34 - 45 / 60]);
    // let projection = d3.geoStereographic()
    //         .translate( [width/2, height/2] )
    //         .scale( width )
    //         .clipAngle( 179 );
    let path = d3.geoPath()
        .projection( projection );
    
    let elevation = svg.append( 'g' )
         .attr( 'class', 'elevation' )
         .selectAll( 'path' );

    let territory = svg.append( 'g' )
        .attr( 'class', 'territory' )
        .selectAll( 'path' );

    let markers = svg.append( 'g' )
        .attr( 'class', 'markers' )
        .selectAll( 'use' ); // TODO can you do this?

    // append a graticule path to the svg
    let graticule = svg.append( 'g' )
        .attr('class', 'graticule')
        .append( 'path' )
        .style('stroke', '#000')
        .datum( d3.geoGraticule().step([10, 10]) );

    // set up the mouse interactivity
    svg.call( d3.drag()
        .on( 'start', started )
        .on( 'drag', dragged )
        .on( 'end', ended )
    );

    svg.call( d3.zoom()
        .on('zoom', wheel )
    );

    // svg.on( 'mousemove', move );

    // load the background contour
    d3.json( file, function(error, json) {
        if (error) throw error;
        contours = json;
        console.log('loaded elevations')
        // projection.fitSize([512,512], contours);
        map();
    });

    d3.json( 'tracts/nv.json', function(error, json) {
        if (error) throw error;
        console.log('loaded territory');
        tracts = json;
        console.log(tracts);
        map();
    });

    let map = function() {

        //draw the graticule
        graticule.attr('d', path);

        // draw the elevations
        elevation = elevation.data( contours );
        elevation.exit().remove(); // this might happen if we lower height resolution while zooming out...
        elevation = elevation.enter()
            .append( 'path' )
            .merge( elevation )
                .attr('d', path )
                .style('stroke', 'black')
                .style( 'fill', function(d) {
                    if(d.value) return color(d.value);
                    else return 'grey';
                });
                
        // draw the territories
        territory = territory.data( tracts.features );
        territory.exit().remove();
        territory = territory.enter()
            .append( 'path' )
                .style( 'stroke', 'white' )
            .merge( territory )
                .attr( 'd', path );

        // draw the targets
        markers = markers.data( marks );
        markers.exit().remove();
        markers = markers.enter()
            .append( 'use' )
                .attr( 'xlink:xlink:href', function(d) {return '#'+d.glyph;} )
                .attr( 'class', function(d){return d.class;} )
            .merge( markers )
                .each( function(d) {
                    let p = projection([d.x, d.y]);
                    d3.select(this)
                    .attr('x', p[0])
                    .attr('y', p[1]);
                });
    };

    /** sets the array holding the map's marker data */
    map.marks = function( array ) {
        marks = array;
    }

    // these drag callbacks update a rotation applied to the projection
    function started() { dragStart = d3.mouse(this); }
    function dragged() {
        // get coordinates of mouse event in svg container
        let dragEnd = d3.mouse(this);

        // abort if this is the first point of the drag
        if(!dragStart) { dragStart = dragEnd; return; }

        // get the distance dragged on the screen, scaled by the zoom
        let Dx = lambda( dragEnd[0]-dragStart[0] ) / scale;
        let Dy = phi( dragEnd[1]-dragStart[1] ) / scale;

        // add it to the current transformation
        let last = projection.rotate();
        last = [last[0] + Dx, last[1] + Dy];

        // update the projection
        projection.rotate( last );
        map();

        // update the drag point
        dragStart = dragEnd;
    }
    function ended() { dragStart = null; }

    // the mouse wheel adjusts the field of view
    function wheel() {
        scale = d3.event.transform.k;
        projection.scale( scale * width );
        //projection.clipAngle( scale * 179.0 );
        map();
    }

    return map;
}