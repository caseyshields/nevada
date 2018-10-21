let fs = require('fs');
let d3 = Object.assign(
    require('d3'),
    require('d3-geo-projection')
);

exports.create = function(tile, min, step, max) {
    // TODO should take an arry of desired elevation slices...

    // determine the elevations to contour
    // let step = (tile.highest - tile.lowest)/count;
    // let h = tile.lowest;
    let h = min;
    let steps = [];
    while (h <= max) {//tile.highest) {
        steps.push( h );
        h+=step;
    }

    // use D3 to compute an array of contours
    let contours = d3.contours()
        .size( [tile.width,tile.height] ) // cols, rows
        .thresholds( steps )
        (tile.elevations);

    // construct a transform from image coordinates to latitude and longitude
    // let img2wgs = d3.geoProjection(
    //     function(x, y) {
    //         return [-tile.longitude + (x/(tile.samples)) ,
    //                 tile.latitude + (y/(tile.samples-1)) ];
    //     });
    let img2wgs = d3.geoIdentity()
            .scale( 1.0/tile.width ) // what about aspect ratios?
            .translate( [tile.longitude, tile.latitude] );
    // TODO transform into screen coordinates instead

    let all = [];
    for(let i in contours) {

        // transform every contour
        let geometry = d3.geoProject(contours[i], img2wgs);
        if (geometry) {
            geometry.value = steps[i];

            // and write it out to a file
            let pre = (tile.latitude>=0) ? 'N'+tile.latitude : 'S'+(-1*tile.latitude);
            let suf = (tile.longitude>=0) ? 'E'+tile.longitude : 'W'+(-1*tile.longitude);
            let path = 'elevation/'+pre+suf+'H'+steps[i]+'.json';
            fs.writeFileSync(
                path,
                JSON.stringify( geometry ),
                ()=>{console.log( 'wrote '+contour );}
            );
            all.push( geometry );
        }
    }

    // also write out the whole thing
    let pre = (tile.latitude>=0) ? 'N'+tile.latitude : 'S'+(-1*tile.latitude);
    let suf = (tile.longitude>=0) ? 'E'+tile.longitude : 'W'+(-1*tile.longitude);
    let path = 'elevation/'+pre+suf+'.json';
    fs.writeFileSync(
        path,
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
