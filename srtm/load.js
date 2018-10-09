var fs = require('fs');

var stream = fs.createReadStream('./srtm/N36W116.hgt');
stream.on('data', function (chunk) {
    console.log(chunk.length);
});

// var all = fs.readFile((error, data)=>{

// });

// fs.open( "./srtm/N36W116.hgt", 'r', (open_error, fd) =>
// {
//     if (open_error) {
//         console.log( "failed to open" );
//         return;
//     }

//     var buffer = new Buffer(1024);
//     fs.read(fs, buffer, 0, 1024, 0, (read_error, buffer) => {
//         if(read_error) {
//             console.log("failed to read");
//             return;
//         }

//     })
// });