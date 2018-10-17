(async function () {

    let fs = require('fs');
    let d3 = Object.assign( require('d3'), require('d3-geo-projection') );
    let path = './srtm/N36W116.hgt';
    const N = 1201;

    try {
        let steps = d3.range(0, 12).map((x)=>{return x*300;});
        console.log( steps );
        
        let map = await readSrtmPromise(path, N);
        console.log( 'min:'+map.lowest+' max:'+map.highest+' size:'+map.elevations.size );

        let contours = d3.contours()
            .size( [N,N] ) //cols, rows
            .thresholds( steps )
            (map.elevations);

        // // write out the raw contours in image coordinates
        // fs.writeFile(
        //     './srtm/N36W116.json',
        //     JSON.stringify( contours ),
        //     ()=>{console.log('done');}
        // );

        // transform the contours into lat lon coordinates
        let minLongitude = 36;
        let minLatitude = -116;
        let arcseconds = 60*60;
        let resolution = 3;
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
        let img2wgs = d3.geoIdentity()
                .scale(resolution/arcseconds)
                .translate([minLongitude, minLatitude]);
        let latlon = d3.geoProject(contours, img2wgs);
        // what the hell am I doing wrong, for every possible way of applying a projection?...

        // write out the countours in word coordinates
        fs.writeFile(
            './srtm/N36W116_spherical.json',
            JSON.stringify( latlon ),
            ()=>{console.log('done');}
        );
        // TODO print out separate contours for different elevations

    } catch(error) {
        console.log(error);
    }

function readSrtmPromise(path, N) {
    let min=0, max=0;
    let heights = [];
    // let heights = [];
    // while( heights.push([]) < N );

    return new Promise( (resolve, reject) => {
        fs.createReadStream( path, {highWaterMark:N*2} )
            .on('data', function (data) {
                // for (let lat=0; lat<N; lat++) {
                    for (let lon=0; lon<N; lon++) {
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
                resolve({elevations:heights, lowest:min, highest:max});
            } )
            .on('error', (error)=>{ reject( error ); } );
    });
}

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

})();

// read entire file
// let all = fs.readFile((error, data)=>{
//     for (var lat=0; lat<1201)
// });
