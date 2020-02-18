export default createAtlas;

/** Factory which returns an Atlas D3 Component. An Atlas contains a cartographic
 * coordinate projection, a camera transform, and a stack of layer components.
 * The atlas provides the projection for components that render geodetic data.
 * When rendering, the Atlas applies the camera transform to each layer and
 * recurses; invoking the D3 general update pattern on the layer's component
 * using the associated dataset.
 * @param {string} svg - A D3 selection holding the svg where the map will be rendered
 * @param {Object} params - A object containing initial setting of the component
 */
function createAtlas(selection, params) {

    /** default configuration arguments for the map component */
    let args = {
        sphereBounds : [[-120,42],[-114,35]], // top left and bottom right bounding coordinates, defaults to Nevada
        worldScale : 6 * 60 * 60, // about an arcsecond to screen pixel
        // screenBounds: [[0,0],[600,700]], // TODO figure out how to bound the zoom component
        zoomBounds : [0.1, 10], // zoom magnification bounds
    }

    // create a projection which maps spherical coordinate onto planar viewport coordinates
    let lt = args.sphereBounds[0];
    let rb = args.sphereBounds[1];
    let toCenter = [ -(lt[0]+br[0])/2.0, -(lt[1]+br[1])/2.0];
    let tMercator = 
        d3.geoTransverseMercator()
            .rotate( toCenter )
            .scale( args.worldScale )
            ;//.clipExtent( screenBounds );

    // D3.path can generate various viewport geometries from raw geometries by applying a projection
    let path = d3.geoPath().projection( tmercator );

    // the atlas component needs to know which component renders which layer
    let index = {};

    /** The atlas component follows the D3 idiom, so it is a function that accepts a selection where the layers should be joined. */
    function atlas( selection, data ) {

        // select all layers which belong to the atlas, then join them to the data
        let layers = selection.selectAll('g').data( data );
        // TODO cache this selection, so it doesn't have to be recomputed everytime?

        // select every layer
        layers.exit().remove() // TODO the laer selection should be keyed
        layers = layers.enter()
            .append('g')
                //.classed( d=>d.classifier, true) // put the key in the class
                .attr('class', function(d) {
                    return d.classifier;
                })
            .merge(layers)
                .each( function(d) {

                    // select this layer group as the parent element
                    let parent = d3.select(this)

                    // look up the configured component
                    let component = index[d.classifier];

                    // and recurse on the child component
                    component( parent, d.data );
                });
        return layers;
    }

    /** Adds a layer to the Atlas. Selection data corresponding to the layer 
     * will be rendered using the specified component.
     * @param {String} name - The name of the layer, will also be used as the class attribute for the layer's SVG group
     * @param {Object} component - A D3 Component which also has the 'projection' method
     */
    atlas.addLayer = function(name, component) {
        if (index[name])
            throw new Error(`Atlas already contains a layer called ${name}`);
        index[name] = component;
    }

    atlas.projection = function( p ) {
        if (!p || p==undefined)
            return tmercator;
        tmercator = p;
        path = d3.geoPath().projection( tmercator );
        return atlas;
    }

    // d3.zoom collect mouse gestures into a transform which is cached with the DOM node it's applied to
    // this transform can then be used in CSS tranforms, or your own positioning methods
    let zoom = d3.zoom()
        .scaleExtent( args.zoomBounds )
        .translateExtent( worldBounds )
        .on('zoom', function() {
            // applies the current zoom's affine transform to 'ground' geometry as a CSS transform
            selection.selectAll('g')
            .attr('transform', d3.event.transform.toString() );
        });

    // add the D3 Zoom gestures to the atlas's SVG group
    selection.call(zoom);

    /** mutator for mouse 'move' event handlers
     * @return {Object} The Atlas object for a fluent programming style
     */
    atlas.move = function( callback ) {
        selection.on('mousemove', callback);
        return atlas;
    }

    /** mutator for mouse 'click' event handlers
     * @return {Object} The atlas component for fluent programming style
     */
    atlas.click = function( callback ) {
        clicked = callback;
        selection.on('click', clicked);
        return atlas;
    }

    // example handler for reference
    let clicked = function (item, index, selection) {
        let screen = d3.mouse(this);
        let sphere = atlas.screen2sphere(screen)
        let details = {screen, sphere, item}
        console.log( JSON.stringify(mark) );

        // useful when you wnat no more handlers to be invoked after this one...
        //d3.event.stopPropagation()
    }
    atlas.click( clicked );

    /** Convert from viewport coordinates into spherical coordinates, by inverting the camera transform, then inverting the projection transform.
     * @param {number[]} screen - an array holding the [x,y] screen coordinates
     * @return {number[]} an array holding the geodetic [lon, lat] coordinates
    */
    atlas.screen2sphere = function(screen) {
        let t = d3.zoomTransform( selection.node() );
        let view = [
            (screen[0] - t.x) / t.k,
            (screen[1] - t.y) / t.k
        ];
        let sphere = tmercator.invert( view );
        return sphere;
    }

    /** Convert from geodetic coordinates into viewport coordinates
     * @param {number[]} sphere - an array holding the geodetic [lon, lat] coordinates
     * @return {number[]} an array holding the [x,y] screen coordinates
     */
    atlas.sphere2screen = function(screen) {
        let view = tmercator(sphere);
        let t = d3.zoomTransform(atlas.node());
        let screen = [
            view[0]*t.k + t.x,
            view[1]*t.k + t.y
        ];
        return screen;
    }

    return atlas;
}