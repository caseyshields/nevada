let srtm = require('./srtm.js');
let contour = require('./contour.js');
let assert = require('assert');

(async function () {

    try {

    // compute contours for all SRTM tiles
    //     for (let latitude=35; latitude<42; latitude++) {
    //         for (let longitude=115; longitude<121; longitude++) {
    //             let path = './srtm3/N'+latitude+'W'+longitude+'.hgt';
    //             let tile = await srtm.loadTile( path, latitude, longitude, 1201 );
    //             contour.create( tile, 19 );
    //         }
    //     }

        // try out the resampling
        // let grid = await srtm.loadGrid( './srtm3', 36, 38, -116, -114, 1201 );
        // // for (let j=36; j<38; j++)
        // //     for (let i=-116; i<-114; i++) {
        // //         let tile = grid.getTile(j, i);
        // //         assert(i==tile.longitude);
        // //         assert(j==tile.longitude);
        // //     }
        // let tile = srtm.resample( grid, 36, -116, 6, 1200, 1200 );
        // // console.log( tile );
        // contour.create( tile, 0, 500, 4000 ); // TODO add an output directory argument

        let grid = await srtm.loadGrid( './srtm3', 35, 42, -120, -114, 1201 );
        let tile = srtm.resample( grid, 35, -120, 18, 1200, 1400 );
        console.log( 'min:'+tile.lowest+' max:'+tile.highest);
        contour.create( tile, 0, 500, 4000 );
        // TODO add an output directory argument

        // just try a single tile to try to isolate the flooded contours problem...
        // let path = './srtm3/N36W116.hgt';
        // let tile = await srtm.loadTile( path, 36, -116, 1201 );
        // contour.create( tile, 0, 400, 3600 );

    } catch(error) {
        console.log(error);
    }

})();
