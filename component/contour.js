/** Contour draws a GeoJson allay as a Group of SVG Paths. A projection
 * is applied to GeoJson coordinates and a camera transform is applied to
 * the enclosing SVG Group. The generated Dom has the following structure;
 ``` html
 <g transform="${projection}>"
    <path
        class="${classifier(datum)}"
        d="${}">
    </path>
    <!-- a Path is created for each GeoJson Feature the component is joined to -->
 </g>
 ```
 * @param {Object} projection - A D3 Projection to be applied to the GeoJson data
 */
export default function( projection ) {

    // a D3 path generator which applies a projection to GeoJson data
    let path = d3.geoPath().projection( projection );

    // function/constant used to determine the class attribute of the generated path
    let classifier = null;

    /** default render function
     * @param {Object} parent - a D3 selection holding the root node(s) of the visualization
     * @param {Array} data - the GeoJson data array the component will render
     */
    function contour(parent, data) {
        // TODO consider projecting and quantizing to make DOM smaller;
        let projected = d3.geoProject(data, projection);
        let approximated = d3.geoQuantize( projected, digits);

        // D3 general update pattern; join the DOM selection to the data
        let selection = parent.selectAll('path').data(data);
        selection.exit().remove();
        selection = selection.enter()
            .append('path')
                .attr('class', classifier)
                .attr('d', path)
                //.attr('pointer-events', ... ) // consider interactivity...
            .merge( selection)
                // TODO consider moving attributes here if they need to be dynamic
    };

    /** A D3 style mutator for the Contour component's current projection
     * @param {function} p - A D3 Projection
     * @return Returns the current projection if p isn't given, otherwise returns the Contour object
    */
    contour.projection = function(f) {
        if (!f || f==undefined)
            return projection;
        projection = f;
        path = d3.geoPath().projection(f);
        return contour;
    }

    /** A D3 style mutator for the classifier, which determines the SVG Path's class attribute.
     * @param {function} c - a function which takes the datum and returns a CSS class string
     * @return The current classifier if c is not supplied, otherwise returns the contour object
    */
    contour.classifier = function(c) {
        if (!c || c==undefined)
            return classifier;
        classifier = c;

        return contour;
    }

    // mark the contour as not an overlay, so the camera transform is applied to it in a container.
    contour.overlay = false;

    return contour;
}