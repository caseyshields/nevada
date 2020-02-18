/** Contour draws a GeoJson dataset as a SVG Path after applying a D3 Projection supplied at construction.
 * @param {function} config.classifier - a function which maps a datum onto a string which is used to set the markup's class
 * @param {projection} config.projection = a function which transforms the given geodetic coordinates to screen, defaults to a mercator projection
 */
export default function() {

    let projection = null;
    let path = null;
    let classifier = null;

    function render( parent, data) {

        let contours = parent.selectAll('path').data(data);

        contours.exit().remove();

        contours = contours.enter()
            .append('path')
                .attr('class', classifier)
                //.attr('pointer-events', ... )
                // TODO we might want to se mouse interactivity so events pass through these possibly complicated geometries;
                // especially since the main use case of the mouse is controlling the camera
            .merge( contours)
                .attr('d', path)
                //.attr('class', classifier())
                // TODO might want to make styling updateable...
    };

    render.projection = function(f) {
        if (!f || f==undefined)
            return projection;
        projection = f;

        // also create an SVG path generator for the projection
        path = d3.geoPath().projection(f);

        return render;
    }

    /** This will control the CSS class of the SVG path tag when it is created */
    render.classifier = function(c) {
        if (!c || c==undefined)
            return classifier;
        classifier = c;

        return render;
    }

    return render;
}