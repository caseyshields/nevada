let fs = require('fs');

exports.loadTile = function(path, lat, lon, samples) {
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
