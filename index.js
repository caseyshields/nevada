import Atlas from 'component/atlas.js';
import Contour from 'container/contour.js';
import Stamp from 'container/stamp.js';
import Navigation from 'navigation.js';

main();
async function main() {

    let svg = d3.select('svg.visualization');

    let data = await initializeState();
}

// create the state of the visualization, by loading it from data files
async function initializeState() {
    
    // Mark each intersection of integer longitude and latitude
    let targets = [];
    for (let x=-120; x<=-114; x++)
        for (let y=35; y<=42; y++)
            targets.push( {lon:x, lat:y, class:'stitches', glyph:'sink'} );
    // lets me visually check marks and contours have the same projection

    // load the GeoJson census tract features
    let tracts = await d3.json('data/2017tractsNV.json');

    // load elevation contours
    let terrain = [{type:'Sphere', value:0}];
    for (let m=0; m<=4000; m+=500) {
        let elevation = await d3.json(`data/N35W120H${m}.json`);
        terrain.push(elevation);
    }
    
    return [targets, tracts, terrain];
}

async function initializeVisualization(svg) {

    let coordinates = d3.select('#coordinates');
    let info = d3.select('#info');

    // the default click action updates the info panel
    let showInfo = function(d) {
        if(!d || d==undefined)
            return;
        let json = JSON.stringify(d, null, '\t');
        info.html(`<pre>${json}</pre>`);
    }

    let atlas = Atlas(svg, {})
        .move( function() {
            let screen = d3.mouse(this);
            let sphere = atlas.screen2sphere(screen);
            let lon = navigation.degrees2sexagesimal( sphere[0], 'W', 'E' );
            let lat = navigation.degrees2sexagesimal( sphere[1], 'S', 'N' );
            coordinates.html(`${lat} / ${lon}`);
        });
    atlas
        .addLayer( 'terrain', Contour()
            .projection( atlas.projection() )
            .classifier( d=>`h${d.value}` ) )
        .addLayer( 'territory', Contour()
            .projection( atlas.projection() )
            .classifier( d=>`tract${d.properties.TRACTCE}`) )
        .addLayer( 'targets', Stamp()
            )

}