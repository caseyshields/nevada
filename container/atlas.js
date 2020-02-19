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
        zoomBounds : [0.1, 1000], // zoom magnification bounds
    }

    // create a projection which maps spherical coordinate onto planar viewport coordinates
    let lt = args.sphereBounds[0];
    let rb = args.sphereBounds[1];
    let toCenter = [ -(lt[0]+rb[0])/2.0, -(lt[1]+rb[1])/2.0];
    let tMercator = 
        d3.geoTransverseMercator()
            .rotate( toCenter )
            .scale( args.worldScale )
            ;//.clipExtent( screenBounds );

    // D3.path can generate various viewport geometries from raw geometries by applying a projection
    let path = d3.geoPath().projection( tMercator );

    // the atlas component needs to know which component renders which layer
    let index = {};

    /** Renders an Atlas for the given layer data set. The resulting DOM has roughly the following structure;
    ``` html
    <g>
        <g class=""
            <!-- The transform attribute is only set if the component is not an overlay. -->
            transform="...">
            <!-- content is rendered recursively by the component corresponding to the class -->
        </g>
        <!-- subsequent groups are created here for each joined datum -->
    </g>
    ```
     * @param {Object} selection - a D3 Selection of the root node(s) of the Atlas
     * @param {Array} data - an array of data layer objects with the following properties;
     * @param {String} data[n].classy - The CSS class of the layer as well as the name of the component
     * @param {Array} data[n].data - The data which will be rendered by the layer's component
     */
    function atlas( selection, data ) {

        // cache a reference to the dataset for repaints
        selection.datum(data);

        // select all layers which belong to the atlas
        let layers = selection.selectAll('g')
            .data( data, d=>d?d.classy : select(this).attr('class') );
        // then join them to the data, indexed by class, defaulting to the Dom class

        //D3 General Update Pattern

        // remove layers with no corresponding data
        layers.exit().remove()

        // add new layers in reverse data order, so layers are rendered bottom-up
        layers = layers.enter()
                .insert('g', ':first-child')
                .attr('class', (d)=>d.classy )

            // repaint all layers
            .merge(layers)
                .each( function(d) {

                    // select this layer group as the parent element
                    let parent = d3.select(this)

                    // look up the configured component
                    let component = index[d.classy];

                    // and recurse on the child component
                    component( parent, d.data );
                });
        return layers;
    }

    /** Adds a component to the Atlas which will be used to render layers with the given name.
     * The component must be a function that accepts a D3 Selection followed by an Array. Also,
     * If that component possesses a member called 'overlay', the atlas will not apply camera
     * transforms to it's layer.
     * @param {String} name - The name of the layer, will also be used as the class attribute for the layer's SVG group
     * @param {Object} component - A D3 Component which also has the 'projection' method
     * @return {Object} The atlas object for fluent styling
     */
    atlas.addLayer = function(name, component) {
        if (index[name])
            throw new Error(`Atlas already contains a layer called ${name}`);
        index[name] = component;
        return atlas;
    }

    /** A D3 style mutator for the geographic projection used by the atlas.
     * @param {function} p = a D3 Geo Projection
     * @returns The current projection when an argument is not provided, otherwise the atlas is returned to allow method chaining.
     */
    atlas.projection = function( p ) {
        if (!p || p==undefined)
            return tMercator;
        tMercator = p;
        path = d3.geoPath().projection( tMercator );
        return atlas;
    }

    // d3.zoom collect mouse gestures into a transform which is cached with the DOM node it's applied to
    // this transform can then be used in CSS tranforms, or your own positioning methods
    let zoom = d3.zoom()
        .scaleExtent( args.zoomBounds )
        // .translateExtent( worldBounds )
        .on('zoom', function() {

            // applly the camera transform to all non-overlay layers
            selection.selectAll('g')
                .each( function(d) {
                    let component = components[d.classy];
                    if(!component.overlay)
                        d3.select(this).attr('transform', d3.event.transform.toString());
                })

            // repaint the atlas
            atlas.repaint();
        });

    // add the D3 Zoom gestures to the atlas's SVG group
    selection.call(zoom);

    /** Getter for the current camera transform
     * @return a D3 Zoom transform
     */
    atlas.transform = function() {
        // the D3 Zoom component stores the camera transform in the node where the zoom was applied
        return d3.zoomTransform( selection.node() );
    }

    /** Re-render the atlas using the dataset last joined to the DOM */
    atlas.repaint = function() {
        // the last render cached the data at the root selection, so we recover it
        let datum = selection.datum();
        atlas( selection, datum );
    }

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
        console.log( JSON.stringify(item) );

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
        let sphere = tMercator.invert( view );
        return sphere;
    }

    /** Convert from geodetic coordinates into viewport coordinates
     * @param {number[]} sphere - an array holding the geodetic [lon, lat] coordinates
     * @return {number[]} an array holding the [x,y] screen coordinates
     */
    atlas.sphere2screen = function(sphere) {
        let view = tMercator(sphere);
        let t = d3.zoomTransform(atlas.node());
        let screen = [
            view[0]*t.k + t.x,
            view[1]*t.k + t.y
        ];
        return screen;
    }

    return atlas;
}