(async function () {
    let fs = require('fs');
    let d3 = require('d3');
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

        for (let v in contours)
            console.log( contours[v] );

        fs.writeFile(
            './srtm/N36W116.json',
            JSON.stringify( contours ),
            ()=>{console.log(done);}
        );

    } catch(error) {
        console.log(error);
    }

function readSrtmPromise(path, N) {
    let min=0, max=0;
    let heights = new Array(N*N);
    // let heights = [];
    // while( heights.push([]) < N );

    return new Promise( (resolve, reject) => {
        fs.createReadStream( path, {highWaterMark:N*2} )
            .on('data', function (data) {
                for (let lat=0; lat<N; lat++) {
                    for (let lon=0; lon<N; lon++) {
                        let height = data.readInt16BE( 2*lon );
                        // the min 16 bit int is a sentinel value for no data
                        if (height<min && height>-32768)
                            min = height;
                        else if (height>max)
                            max = height;
                        heights[lat*N + lon] = height;
                        // heights[lat][lon] = height;
                    }
                }
            })
            .on('end', ()=>{
                resolve({elevations:heights, lowest:min, highest:max});
            } )
            .on('error', (error)=>{ reject( error ); } );
    });
}

// taken from https://github.com/d3/d3-contour
function testExample() {
    // Populate a grid of n×m values where -2 ≤ x ≤ 2 and -2 ≤ y ≤ 1.
    var n = 256, m = 256, values = new Array(n * m);
    for (var j = 0.5, k = 0; j < m; ++j) {
        for (var i = 0.5; i < n; ++i, ++k) {
            values[k] = goldsteinPrice(i / n * 4 - 2, 1 - j / m * 3);
        }
    }

    // Compute the contour polygons at log-spaced intervals; returns an array of MultiPolygon.
    var contours = d3.contours()
        .size([n, m])
        .thresholds(d3.range(2, 21).map(p => Math.pow(2, p)))
        (values);

        for (let v in contours)
            console.log( contours[v] );

    // See https://en.wikipedia.org/wiki/Test_functions_for_optimization
    function goldsteinPrice(x, y) {
        return (1 + Math.pow(x + y + 1, 2) * (19 - 14 * x + 3 * x * x - 14 * y + 6 * x * x + 3 * y * y))
            * (30 + Math.pow(2 * x - 3 * y, 2) * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y * y));
    }
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

})();
// fs.open( path, 'r',
//     (open_error, fd) => {
//         if (open_error) {
//             console.log( "failed to open" );
//             return;
//         }
//         console.log('open');
//         var buffer = new Buffer(N*2);
//         for (let lat=0; lat<N; lat++) {
//             // hmm promise version
//             fd.read(buffer, 0, N*2, lat*N*2)
//             .then( (data) => {
//                 for (let lon=0; lon<N; lon++)
//                     heights[lat][lon] = data.buffer.readInt16BE(lon);
//                 })
//             .error( (read_error)=> {
//                 console.log("failed to read");
//                 });
//     }

//     fs.close( fd,
//         (err) => {
//             if(err) throw err;
//             console.log( 'closed' );
//         }
//     );
//     }
// );

// read entire file
// let all = fs.readFile((error, data)=>{
//     for (var lat=0; lat<1201)
// });
