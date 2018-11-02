
/**
 * Factory which returns a D3 map component
 * @param {string} svg - A D3 selection holding the svg where the map will be rendered
*/
let createMap = function( svg, params ) {
    let contours = []; // Array of GeoJSON contour polygons
    let tracts = {features:[]}; // GeoJSON territorial lines to be drawn
    let marks = []; // array or markers to be displayed
    
    let args = {
        sphereBounds: [[-120,42],[-114,35]], // top left and bottom right bounding coordinates, defaults to Nevada
        worldScale: 6 * 60*60, // about an arcsecond to a screen pixel is what I'm aiming for...
        screenBounds: [[0,0],[600,700]],
        markerScale: 1.0,
        zoomBounds: [0.2, 5.0],
    };
    args = Object.assign( args, params );

    // prepare selection for various parts of the svg
    let group = svg.append('g')
        .classed('map', true)
        .attr('transform', 'translate(0,0)scale(1)')
    let elevation = group.append( 'g' )
         .attr( 'class', 'elevation' )
         .attr('pointer-events', 'all')
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

    // create a projection which maps spherical coordinates onto planar viewport coordinates
    let lt = args.sphereBounds[0];
    let br = args.sphereBounds[1];
    let toCenter = [ -(lt[0]+br[0])/2.0, -(lt[1]+br[1])/2.0 ];
    let projection =
        d3.geoTransverseMercator()
        .rotate( toCenter ) // previously used [116 + 40 / 60, -38 - 45 / 60]
        .scale( args.worldScale )

        // lines are a bit straighter with the plain mercator, however there is more distortion...
        // d3.geoMercator()
        // .scale( args.worldScale )
        // .center( -toCenter )
        
        // I should eventually clip, but I'm not sure what stage to do it at...
        //.clipExtent( [[0,0], [600,700]] ) // screen coordinates of the projection output
       ;

    // D3.path can generate various viewport geometries from raw geometries by applying a projection
    let path = d3.geoPath()
       .projection( projection );
    
    // args.sphereBounds.reduce(
    //     function(acc, cur) {
    //         acc.forEach(
    //             (v,i)=>{acc[i]+=cur[i];}
    //         );
    //         return acc;
    //     }, [0,0] ); // js hipster.

    // D3.zoom collects various mouse gestures into a transform which can be applied to different objects in different ways
    let worldBounds = args.sphereBounds.map(projection);
    let zoom = d3.zoom()
        .scaleExtent( args.zoomBounds )
        .translateExtent( worldBounds )
        .on('zoom', zoomed);
    svg.call( zoom );

    let moved = function(){}; // callback for mouse movements

    let clicked = function(mark, index, selection){
        let screen = d3.mouse( this )
        let transform = d3.zoomTransform( group );
        let sphere = projection.invert(screen);
        // Note: 'this' refers to the top level map node
        console.log( mark );
        console.log( transform );
        console.log( screen );
        console.log( sphere );
    }; // callback for mouse clicks

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
                // hack^ : the xlink is pared off in the attribute name conversion, but not two...
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

    map.click = function( callback ) {
        clicked = callback;
        group.on('click', clicked);
        return map;
    }
    map.move = function( callback ) {
        moved = callback;
        group.on('mousemove', moved);
        return map;
    }
    map.move(moved);
    map.click(clicked);

    /** Applies the current zoom transform to the ground geometries as a CSS
     * transform, and semantically zooms map markers by altering thier attributes.*/
    function zoomed() {
        // console.log( d3.event.transform.toString() );
        group.attr('transform', d3.event.transform.toString() );
        
        //TODO alter markers on a separate layer
    }

    map.screen2sphere = function( screen ) {
        return projection.invert( screen );
    }

    map.sphere2screen = function( sphere ) {
        return projection( sphere );
    }

    return map;

}