/** A component which clones embedded SVG definitions with the 'use' tag.
 * Also provides customizable styling and mouse click actions.
 * @param {string} id - The id of the definition tag we are cloning
 */
export default function() {

    let classifier = d=>d.style;
    let glyph = d=>d.use;
    let position = d=>d;
    let clicker = d=>{};

    function stamp(parent, data) {

        //join the data to the Dom structure using corresponding array order( since a key isn't specified)
        let stamps = parent.selectAll('use')
            .data(data)

        // remove DOM nodes which have no corresponding data
        stamps.exit().remove();

        // create DOM nodes for datums without a node
        stamps = stamps.enter()
            .append('use')
                .on('click', clicker)
            // and now modify the DOM nodes to match the datums
            .merge(stamps).each( function(d) {
                let p = position(d);
                d3.select(this)
                    .attr('x', p[0])
                    .attr('y', p[1])
                    .attr('class', classifier)
                    .attr('xlink:xlink:href', '#'+glyph(d))
            });
    }

    /** a D3 style mutator for the position of the Stamp
     * @param {function} t - a function of the form f(d)=>[x,y]
     * @return {Object} the stamp object for the fluent programming style
     */
    stamp.position = function(t) {
        if (!t || t==undefined)
            return this.position;
        else position = t;
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

    // mark the component so camera transforms are not applied to it's rendered group
    stamp.overlay = true; // TODO shouldn't this be an attribute of the layer data and not the component?...

    return stamp;

    //TODO Might eventually want a method to procedurally add an icon to the SVG defs
}