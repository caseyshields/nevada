/** A component which clones embedded SVG definitions with the 'use' tag.
 * @param {string} id - The id of the definition tag we are cloning
 */
export default function(id) {

    let classifier;
    let clicker;
    let glyph;
    let transform;

    function stamp(parent, data) {

        //join the data to the Dom structure using corresponding array order( since a key isn't specified)
        let stamps = parent.selectAll('use')
            .data(data)

        // remove Dom nodes which have no corresponding data
        stamps.exit().remove();

        // create Dom nodes for datums without a node
        stamps = stamps.enter()
            .append('use')
                .on('click', clicker)
            // and now modify the Dom nodes to match the datums
            .merge(stamps).each( function(d) {
                let screen = transform(d);
                d3.select(this)
                    .attr('x', screen[0])
                    .attr('y', screen[1])
                    .attr('class', classifier)
                    .attr('xlink:xlink:href', '#'+glyph)
            });
    }

    /** a D3 style mutator for the D3 transform function
     * @param {function} t - a function of the form f(d)=[x,y]
     * @return {Object} the stamp object for the fluent programming style
     */
    stamp.transform = function(t) {
        if (!t || t==undefined)
            return this.transform;
        else transform = t;
        return stamp;
    }

    /** A D3 style mutator for the clasifier function
     * @param {function} c - a function which maps a datum onto a CSS class string
     * @return {Object} the stamp object for a fluent programming style
    */
    stamp.classifier = function(c) {
        if (!c || c==undefined)
            return classifier;
        else classifier = c;
        return stamp;
    }

    /** A D3 style mtator for the classifier function
     * @param {function} g - The id of a tag in the SVG defs tag
     * @return {object} The stamp object for a fluent programming style
    */
    stamp.glyph = function (g) {
        if (!g || g==undefined)
            return glyph;
        else glyph = g;
        return stamp;
    }

    /** A D3 style mutator for the click event handler
     * @param {function} h - the click event callback
     * @return {Object} the stamp object for a fluent programming style
    */
    stamp.clicker = function(h) {
        if (!h || h==undefined)
            return clicker;
        else clicker = h;
        return stamp;
    }

    return stamp;
}