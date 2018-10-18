let fs = require('fs');
let d3 = Object.assign(
    require('d3'),
    require('d3-geo-projection')
);

exports.create = function(tile, step) {

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
            let contour = 'elevation/N'+tile.latitude+'W'+tile.longitude+'H'+steps[i]+'.json';
            fs.writeFileSync(
                contour,
                JSON.stringify( geometry ),
                ()=>{console.log( 'wrote '+contour );}
            );
            all.push( geometry );
        }
    }

    // also write out the whole thing
    let contour = 'elevation/N'+tile.latitude+'W'+tile.longitude+'_all.json';
    fs.writeFileSync(
        contour,
        JSON.stringify( all ),
        ()=>{console.log( 'wrote '+contour );}
    );
}

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
