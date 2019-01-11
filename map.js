
//TODO I might want to try this approach to resizing content;
// https://chartio.com/resources/tutorials/how-to-resize-an-svg-when-the-window-is-resized-in-d3-js/

/**
 * Factory which returns a D3 map component
 * @param {string} svg - A D3 selection holding the svg where the map will be rendered
*/
let createMap = function( svg, params ) {
    let contours = []; // Array of GeoJSON contour polygons
    let bounds = {features:[]}; // GeoJSON territorial lines to be drawn
    let tracks = []; // array or markers to be displayed
    let plots = []; // array of blips

    /** Default configuration arguments for the map component. */
    let args = {
        sphereBounds: [[-120,42],[-114,35]], // top left and bottom right bounding coordinates, defaults to Nevada
        worldScale: 6 * 60*60, // about an arcsecond to a screen pixel is what I'm aiming for...
        //screenBounds: [[0,0],[600,700]],
        markerScale: 1.0,
        zoomBounds: [0.1, 10.0],
        graticuleSteps: [10,10],
    };
    args = Object.assign( args, params );

    // prepare selection for various parts of the svg
    let group = svg.append('g')
        .classed('map', true);
    let back = group.append('g')
        .classed('background', true)
        .attr('pointer-events', 'all')
        .attr('transform', 'translate(0,0)scale(1)');
    let elevation = back.append( 'g' )
         .attr( 'class', 'elevation' )
         .selectAll( 'path' );
    let territory = back.append( 'g' )
        .attr( 'class', 'territory' )
        .selectAll( 'path' );
    let graticule = back.append( 'g' )
        .attr('class', 'graticule')
        .append( 'path' )
        .style('stroke', '#000')
        .datum( d3.geoGraticule().step(args.graticuleSteps) );
    let fore = group.append('g')
        .classed('foreground', true);
    let trackers = fore.append( 'g' )
        .attr( 'class', 'tracks' )
        .selectAll( 'use' );
    let plotters = fore.append('g')
        .attr( 'class', 'plots' )
        .selectAll( 'circle' );

    // default color scale for elevation, cribbed from 'https://en.wikipedia.org/wiki/Wikipedia:WikiProject_Maps/Conventions', though there are no given corresponding heights...
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

    /** The default function invokes a render of the entire map */
    let map = function() {
        graticule.attr('d', path);
        map.drawContours();
        map.drawBounds();
        map.drawTracks();
        map.drawPlots();
    };

    /** draw the graticule, elevations, and territories */
    map.drawGround = function() {
        graticule.attr('d', path);
        drawContours();
        drawBounds();
    };

    /** Updates the SVG's elevation polygons using the D3 general update pattern */
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
        territory = territory.data( bounds.features );
        territory.exit().remove();
        territory = territory.enter()
            .append( 'path' )
            .merge( territory )
                .attr( 'd', path );
    };

    /** Update the track on the screen to match the current track data.
     * Tracks can have custom markers and mouse interactivity. */
    map.drawTracks = function( ) {
        trackers = trackers.data( tracks );
        trackers.exit().remove();
        trackers = trackers.enter()
            .append( 'use' )
                .on( 'click', clicked )
            .merge( trackers )
                .each( function(d) {
                    let screen = map.sphere2screen( [d.x, d.y] );
                    d3.select(this)
                    .attr('x', screen[0])
                    .attr('y', screen[1])
                    .attr('class', d.class)
                    .attr( 'xlink:xlink:href', '#'+d.glyph);
                });
    }; // TODO I think the track selection should be keyed...

    /** Updates the plots on the screen to match the current plot data.
     * Plots are only styled circles with no mouse interactivity. */
    map.drawPlots = function( ) {
        plotters = plotters.data( plots );
        plotters.exit().remove();
        plotters = plotters.enter()
            .append( 'circle' )
            .merge( plotters )
                .each( function(d) {
                    let screen = map.sphere2screen( [d.x, d.y] );
                    d3.select(this)
                    .attr('cx', screen[0])
                    .attr('cy', screen[1])
                    .attr('r', 3) // TODO should radius be scaled?
                    .attr('class', d.class);
                });
    };

    // D3.zoom collects various mouse gestures into a transform which is cached with affected DOM nodes.
    // this transfor can then be appllied a number of ways
    //let worldBounds = args.sphereBounds.map(projection);
    let zoom = d3.zoom()
        .scaleExtent( args.zoomBounds )
        //.translateExtent( worldBounds )
        .on('zoom', function() {
            // Applies the current zoom transform to the ground geometries as a CSS transform
            back.attr('transform', d3.event.transform.toString() );
            
            // semantically zoom map markers by altering thier attributes.
            map.drawTracks( );
            map.drawPlots( );
        } );
    group.call( zoom );

    // public mutators for mouse event handlers...
    map.click = function( callback ) {
        clicked = callback;
        trackers.on('click', clicked);
        group.on('click', clicked);
        return map;
    }
    map.move = function( callback ) {
        group.on('mousemove', callback);
        return map;
    }

    // example handler for reference...
    let clicked = function (mark, index, selection) {
        // console.log(mark);

        // let screen = d3.mouse( this ); // group.node() );
        // console.log( map.screen2sphere(screen) );
        
        // // I want to stop propagation to the background if user clicks something in the foreground
        // d3.event.stopPropagation();
    };
    map.click( clicked );

    /** Changes the elevation color scale. */
    map.setColorScale = function( scale ) {
        color = scale;
        map.drawContours();
        return map;
    }

    /** sets the array holding the map's marker data */
    map.tracks = function( array ) {
        if (!array) 
            return tracks;
        
        tracks = array;
        // map.drawTracks();
        return map;
    };
    /** sets the array holding the map's marker data */
    map.plots = function( array ) {
        if (!array) 
            return plots;
        
        plots = array;
        // map.drawPlots();
        return map;
    };
    //TODO another way of thinking about this would be adding the data to the DOM Selection Node
    // This allows the map to be drawn on arbitrary data anywhere on the document. The default render
    // method would then operate on Selections, rendering the data in each of the selection nodes...

    /** Clears all marks from the map.
     * @returns the map component */
    map.clearPlots = function() {
        while (plots.length > 0)
            plots.pop();
        return map;
    }

    /** Adds an individual object to the marker data.
     * The object needs the following fields to display properly;
     * @param {number} mark.x : longitude of the mark
     * @param {number} mark.y : latitude of the mark
     * @param {string} glyph : name of the svg def to use as a marker
     * @param {string} class : string containing the CSS class to be applied to the mark
     * @returns The map object;
    */
    map.addTrack = function( track ) {
        tracks.push( track );
        return map;
    };

    map.addPlot = function( plot ) {
        plots.push( plot );
        return map;
    };

    /** Adds the given GeoJson object to the contour render list.
     * @param {GeoJson} contour - Should also contain a 'value' member representing the elevation in meters
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
        bounds.features.push(bound);
        map.drawBounds();
        return map;
    };

    /** Convert from view port coordinates into spherical coordinates */
    map.screen2sphere = function( screen ) {
        //let screen = d3.mouse( group.node() );
        let t = d3.zoomTransform( group.node() );
        let view = [
            (screen[0] - t.x) / t.k,
            (screen[1] - t.y) / t.k
        ];
        let sphere = projection.invert( view );
        return sphere;
    }

    /** Convert from spherical coordinates into viewport coordinates
     * @param {number[]} sphere - An array holding the longitude and latitude in that order
     * @return An array holding the planar viewport coordinates.
     */
    map.sphere2screen = function( sphere ) {
        let view = projection( sphere );
        let t = d3.zoomTransform( group.node() );
        let screen = [
            view[0]*t.k + t.x,
            view[1]*t.k + t.y
        ];
        return screen;
    }

    return map;
}