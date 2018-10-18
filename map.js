
let createMap = function( svg, file ) {//minlat, maxlat, minlon, maxlon,  ) {
    let width = 512;
    let height = 512;
    let scale = 1.0;
    let dragStart = null;

    var lambda = d3.scaleLinear()
        .domain([-width, width])
        .range([-180, 180]);

    var phi = d3.scaleLinear()
        .domain([-height, height])
        .range([90, -90]);

    // let projection = d3.geoStereographic()
    //         .translate( [width/2, height/2] )
    //         .scale( width )
    //         .clipAngle( 179 );

    // Projection for central Nevada, EPSG:32108
    let projection = d3.geoTransverseMercator()
        .rotate([116 + 40 / 60, -34 - 45 / 60]);
    //     .fitSize( [width, height] );
        
    let path = d3.geoPath()
        .projection( projection );

    // append a graticule path to the svg
    svg.append( 'path' )
        .attr('class', 'graticule')
        .datum( d3.geoGraticule().step([15, 10]) );
    
    // let elevation = svg.append( 'g' )
    //     .attr( 'class', 'elevation' )
    //     .selectAll( 'path' );

    // let territory = svg.append( 'g' )
    //     .attr( 'class', 'territory' )
    //     .selectAll( 'path' );

    // set up the mouse interactivity
    svg.call( d3.drag()
        .on( 'start', started )
        .on( 'drag', dragged )
        .on( 'end', ended )
    );

    // svg.call( d3.zoom()
    //     .on('zoom', wheel )
    // );

    // svg.on( 'mousemove', move );

    // load the background contour
    // d3.json( file, function(error, json) {
    //     if (error) throw error;
    //     plot( json );
    // });

    // function plot( geojson ) {
    //     let path = d3.geoPath( projection );
    //     elevation.append('path')
    //         .attr(d)
    // }

    let map = function() {

        //draw the graticule
        svg.select('.graticule')
            .attr('d', path);

        // TODO draw the elevations
        // elevation.selectAll('path')
        //     .data(contours)
        //     .enter()
        //     .append('path')
        //         .attr("d", path)
        //         //.attr("fill", "#666");
        //         //.style( 'stroke', "#000" )
        //         .style("fill", function(d){
        //             var value = d.value;
        //             if(value) return color(value);
        //             return "#666";
        //         });

        // TODO draw the territories

        // TODO draw the targets
    };

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