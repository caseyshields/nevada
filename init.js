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
        let grid = await srtm.loadGrid( './srtm3', 36, 38, -116, -114, 1201 );
        // for (let j=36; j<38; j++)
        //     for (let i=-116; i<-114; i++) {
        //         let tile = grid.getTile(j, i);
        //         assert(i==tile.longitude);
        //         assert(j==tile.longitude);
        //     }

        let tile = srtm.resample( grid, 36, -116, 6, 1200, 1200 );
        // console.log( tile );

        contour.create( tile, 0, 100, 4000 ); // TODO add an output directory argument

    } catch(error) {
        console.log(error);
    }

})();

// I don't think we should compute all the contours from one grid;
// this will make each contour geometry very long, most of it needing to 
// clipped when we are zoomed in to any degree!

// So instead compute contour polygons for every cell.
// We might even want to eventually further subdivide the patches...

// function readSrtmGrid( minLat, maxLat, minLon, maxLon, arcseconds) {
//     let srtm = {};
//     srtm.resolution = 3600/arcseconds;
//     srtm.width = (maxLat - minLat) * resolution + 1;
//     srtm.height = (maxLon - minLon) * resolution + 1;
//     srtm.data = new Array(width * height);
//     for(let lat = minLat; lat<maxLat; lat++) {
//         for(let lon = minLon; lon<maxLat; lon++) {
//             for(let i=0; i<resolution; i++) {
//                 for(let j=0; j<resolution, j++) {
//                     srtm.data[  ];
//                 }
//             }
//         }
//     }
// }
