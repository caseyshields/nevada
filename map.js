
/**
 * Factory which returns a D3 map component
 * @param {string} svg - A D3 selection holding the svg where the map will be rendered
*/
let createMap = function( svg ) {//minlat, maxlat, minlon, maxlon,  ) {
    var width = +svg.attr("width");
    var height = +svg.attr("height");
    let contours = []; // Array of GeoJSON contour polygons
    let tracts = {features:[]}; // GeoJSON territorial lines to be drawn
    let marks = []; // array or markers to be displayed
    let moved = function(screen){}; // callback for mouse movements
    let clicked = function(mark, index, selection){}; // callback for mouse clicks
    
    let scale = 1.0; // current projection scale
    let dragStart = null; // flagg for if the mouse is currently dragging
    let zoom = d3.zoom()
        //.scaleExtent([1,5])
        //.translateExtent([,]);
        .on('zoom', zoomed);
    svg.call( zoom );
    // let container = svg.append('g')
    //     .classed('map')
    //     .attr('transform', 'translate(0,0)scale(1,1)');
    // let bbox = container.node().getBBox();
    // console.log( bbox );
    
    // prepare selection for various parts of the svg
    let group = svg.append('g')
        .classed('map', true)
        .attr('transform', 'translate(0,0)scale(1)')
    let elevation = group.append( 'g' )
         .attr( 'class', 'elevation' )
         .selectAll( 'path' );
    let territory = group.append( 'g' )
        .attr( 'class', 'territory' )
        .selectAll( 'path' );
    let markers = group.append( 'g' )
        .attr( 'class', 'markers' )
        .selectAll( 'use' );
    let graticule = group.append( 'g' )
        .attr('class', 'graticule')
        .append( 'path' )
        .style('stroke', '#000')
        .datum( d3.geoGraticule().step([10, 10]) );

    // default color scale for elevation, cribbed from 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Maps/Conventions', though there are no given corresponding heights
    let color = d3.scaleQuantize()
        .range(['#ACD0A5','#94BF8B','#A8C68F','#BDCC96','#D1D7AB','#E1E4B5',//green to tan
        '#EFEBC0','#E8E1B6','#DED6A3','#D3CA9D','#CAB982','#C3A76B','#B9985A','#AA8753',//tan to brown
        '#AC9A7C','#BAAE9A','#CAC3B8','#E0DED8','#F5F4F2'])// brown to white
        .domain([-100, 4400]);

    // TODO once we project into screen coordinates we can move the SVG's view box around
    // svg.attr('viewbox', [-120,42,6,7]);
    //svg.attr('viewbox', [0,0,width, height]);

    // Projection for central Nevada, EPSG:32108
    // let clip = d3.geoClipRectangle(0, 0, 500, 500);
    let projection = //d3.geoIdentity()
        d3.geoTransverseMercator()
        .rotate([117, -39]) // .rotate([116 + 40 / 60, -34 - 45 / 60])
        .scale(width*10)
        .precision(0.0)// I'm pretty sure this just smoothes out existing segments on the screen- id doesn't simplyfy geometries!
    //    .postclip( clip )
       //.center([-117.0, 39.0]) // I really have no idea how else this method could be used but apparently this is wrong? It actually crashes the tab!
       ;

   let path = d3.geoPath()
       .projection( projection );
    
    // set up the mouse interactivity
    // svg.call( d3.drag()
    //     .on( 'start', started )
    //     .on( 'drag', dragged )
    //     .on( 'end', ended )
    // );
    // svg.call( d3.zoom()
    //     .on('zoom', wheel )
    // );
    //svg.on( 'mousemove', moved ); // TODO add mouse move event

    /** The default function invokes a render of the entire map */
    let map = function() {
        graticule.attr('d', path);
        map.drawContours();
        map.drawBounds();
        map.drawMarks();
    };

    /** draw the graticule, elevations, and territories */
    map.drawGround = function() {
        graticule.attr('d', path);
        drawContours();
        drawBounds();
    };

    /** Updates the SVG's elevation polygons */
    map.drawContours = function() {
        elevation = elevation.data( contours );
        elevation.exit().remove();
        elevation = elevation.enter()
            .append( 'path' )
            .merge( elevation )
                .attr('d', path )
                .style('fill', function(d) {
                        if(d.value) return color(d.value);
                        else return 'black';
                    })
                .order(function(a,b){return a.value-b.value;});
        //currently the exit block is never called, however we might want to eventually remove contours when we zoom out...
    };

    /** Updates the SVG's boundary lines */
    map.drawBounds = function() {
        territory = territory.data( tracts.features );
        territory.exit().remove();
        territory = territory.enter()
            .append( 'path' )
                .style( 'stroke', 'grey' )
            .merge( territory )
                .attr( 'd', path );
    };

    /** Updates the marks position in the SVG */
    map.drawMarks = function() {
        markers = markers.data( marks );
        markers.exit().remove();
        markers = markers.enter()
            .append( 'use' )
                .attr( 'xlink:xlink:href', function(d) {return '#'+d.glyph;} )
                .on( 'click', clicked )
            .merge( markers )
                .attr( 'class', function(d){return d.class;} )
                .each( function(d) {
                    let p = projection([d.x, d.y]);
                    d3.select(this)
                    .attr('x', p[0])
                    .attr('y', p[1]);
                });
    };

    /** Changes the elevation color scale. */
    map.setColorScale = function( scale ) {
        color = scale;
        map.drawContours();
        return map;
    }

    /** sets the array holding the map's marker data */
    map.marks = function( array ) {
        marks = array;
        map.drawMarks();
        return map;
    };

    /** Adds the given GeoJson object to the contour render list.
     * @param {GeoJson} contour - Should also contain a 'height' member representing the elevation in meters
     */
    map.addContour = function( contour ) {
        contours.push(contour);
        contours.sort( function(a,b){return a.value-b.value;} );
        map.drawContours();
        return map;
    };

    /** Adds the given geometry to the list of boundary lines
     * @param {GeoJson} bound - A line geometry to be drawn on top of the contours
     */
    map.addBounds = function( bound ) {
        tracts.features.push(bound);
        map.drawBounds();
        return map;
    };

    // map.move = function( callback ) {
    //     move = callback;
    //     return map;
    // }
    map.click = function( callback ) {
        clicked = callback;
        return map;
    }


    function zoomed() {
        // let tx = d3.event.transform.x;
        // let ty = d3.event.transform.y;
        // let sx = d3.event.transform.k;
        // svg.attr('transform', 'translate('+tx+','+ty+')scale('+sx+')');
        group.attr('transform', d3.event.transform.toString() );
        // console.log( d3.event.transform.toString() );
    }

    map.screen2sphere = function( screen ) {
        return projection.invert( screen );
    }

    map.sphere2screen = function( sphere ) {
        return projection( sphere );
    }

    return map;

    // // scales for screen coordinates to rotation
    // var lambda = d3.scaleLinear()
    //     .domain([-width, width])
    //     .range([-180, 180]);
    // var phi = d3.scaleLinear()
    //     .domain([-height, height])
    //     .range([90, -90]);
    
    // // these drag callbacks update a rotation applied to the projection
    // function started() { dragStart = d3.mouse(this); }
    // function dragged() {
    //     // get coordinates of mouse event in svg container
    //     let dragEnd = d3.mouse(this);

    //     // abort if this is the first point of the drag
    //     if(!dragStart) { dragStart = dragEnd; return; }

    //     // get the distance dragged on the screen, scaled by the zoom
    //     console.log(scale+ ' vs ' +projection.scale());
    //     let Dx = lambda( dragEnd[0]-dragStart[0] ) / scale;
    //     let Dy = phi( dragEnd[1]-dragStart[1] ) / scale;

    //     // add it to the current transformation
    //     let last = projection.rotate();
    //     last = [last[0] + Dx, last[1] + Dy];

    //     // update the projection
    //     projection.rotate( last );
    //     map();

    //     // update the drag point
    //     dragStart = dragEnd;
    // }
    // function ended() { dragStart = null; }

    // // the mouse wheel adjusts the field of view
    // function wheel() {
    //     scale = d3.event.transform.k;
    //     projection.scale( scale * width );
    //     //projection.clipAngle( scale * 179.0 );
    //     map();
    // }
}