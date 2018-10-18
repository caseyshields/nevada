(async function () {

    let srtm = require('./srtm.js');
    let contour = require('./contour.js');

    // compute contours for all SRTM tiles
    try {
        for (let latitude=35; latitude<42; latitude++) {
            for (let longitude=115; longitude<121; longitude++) {
                let path = './srtm3/N'+latitude+'W'+longitude+'.hgt';
                let tile = await srtm.loadTile( path, latitude, longitude, 1201 );
                contour.create( tile, 100 );
            }
        }
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
