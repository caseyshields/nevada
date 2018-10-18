(async function () {

    let fs = require('fs');
    let d3 = Object.assign(
        require('d3'),
        require('d3-geo-projection')
    );

    // compute contours for all SRTM tiles
    try {
        for (let latitide=35; latitide<42; latitide++) {
            for (let longitude=115; longitude<121; longitude++) {
                let path = '../srtm3/N'+latitude+'W'+longitude+'.hgt';
                let tile = await loadSrtmTile(path, latitude, longitude, 1201);
                createContours( tile, 100);
            }
        }
    } catch(error) {
        console.log(error);
    }

function createContours(tile, step) {

    // determine the elevations to contour
    let h = tile.lowest;
    let steps = [];
    while (h < tile.highest) {
        steps.push( h );
        h+=step;
    }

    // use D3 to compute an array of contours
    let contours = d3.contours()
        .size( [tile.samples,tile.samples] )
        .thresholds( steps )
        (tile.elevations);

    // construct a transform from image coordinates to latitude and longitude
    let img2wgs = d3.geoIdentity()
            .scale( 1.0/tile.samples )
            .translate( [tile.longitude, tile.latitude] );

    let all = [];
    for(let i in contours) {

        // transform every contour
        let geometry = d3.geoProject(contours[i], img2wgs);
        if (geometry) {
            geometry.value = steps[i];

            // and write it out to a file
            let contour = 'N'+tile.latitude+'W'+tile.longitude+'H'+steps[i]+'.json';
            fs.writeFileSync(
                contour,
                JSON.stringify( geometry ),
                ()=>{console.log( 'wrote '+contour );}
            );
            all.push( geometry );
        }
    }

    // also write out the whole thing
    let contour = 'N'+tile.latitude+'W'+tile.longitude+'_all.json';
    fs.writeFileSync(
        contour,
        JSON.stringify( all ),
        ()=>{console.log( 'wrote '+contour );}
    );
}

function loadSrtmTile(path, lat, lon, samples) {
    let min=0, max=0;
    let heights = [];

    return new Promise( (resolve, reject) => {
        fs.createReadStream( path, {highWaterMark:samples*2} )
            .on('data', function (data) {
                // for (let lat=0; lat<N; lat++) {
                    for (let lon=0; lon<samples; lon++) {
                        let height = data.readInt16BE( 2 * lon );
                        // the min 16 bit int is a sentinel value for no data
                        if (height<min && height>-32768)
                            min = height;
                        else if (height>max)
                            max = height;
                        heights.push( height );
                        // heights[lat][lon] = height;
                    }
                // }
            })
            .on('end', ()=>{
                resolve( {
                    latitude: lat,
                    longitude: lon,
                    elevations: heights,
                    samples: samples,
                    resolution: 3600/samples,
                    lowest: min,
                    highest: max } );
            } )
            .on('error', (error)=>{ reject( error ); } );
    });
}
})();
// trying out some different ways to express GeoJSON transformations...
// let img2wgs = d3.geoProjection(
//     function(x, y) {
//         return [minLongitude + (x*resolution/arcseconds),
//                 minLatitude + (y*resolution/arcseconds) ];
//     });
// let img2wgs = d3.geoTransform({
//     point: function(x, y) {
//         this.stream.point(minLongitude + (x*resolution/arcseconds),
//                 minLatitude + (y*resolution/arcseconds) );
//     }
// });

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

// function readSrtm(path, N, fn) {
//     let min=0, max=0;
//     let heights = [];
//     while( heights.push([]) < N );
//     fs.createReadStream( path, {highWaterMark:N*2} )
//         .on('data',
//             function (data) {
//                 for (let lat=0; lat<N; lat++) {
//                     for (let lon=0; lon<N; lon++) {
//                         let height = data.readInt16BE( 2*lon );
//                         if (height<min && height>-32768) min = height;
//                         else if (height>max) max = height;
//                         heights[lat][lon] = height;
//                     }
//                 }
//             })
//         .on('end', function() {
//             console.log( 'min:'+min+' max:'+max );
//             // for (let i=0; i<N; i++)
//             //     console.log( heights[0][i]+'\t' );
//             fn(heights, min, max);
//         })
//         .on( 'error', function(err) {
//             console.log(err);
//         } );
//     // return {min, max, heights};
// }
