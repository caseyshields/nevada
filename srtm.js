let fs = require('fs');

module.exports = srtmModule();

function srtmModule() {
const returnObj = {}

// TODO I think the lats might need to be flipped...
returnObj.loadTile = function(path, lat, lon, samples) {
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

returnObj.loadGrid = async function(dir, minLat, maxLat, minLon, maxLon, samples) {
    let grid = {  };
    grid.width = maxLon - minLon;
    grid.height = maxLat - minLat;

    // load all of the tiles of the grid
    grid.tiles = [];
    for (let lat=minLat; lat<maxLat; lat++) {
        for (let lon=minLon; lon<maxLon; lon++) {
            let suf = (lon>=0) ? 'E'+lon : 'W'+(-1*lon);
            let pre = (lat>=0) ? 'N'+lat : 'S'+(-1*lat);
            let path = dir+'/'+pre+suf+'.hgt'
            let tile = await returnObj.loadTile(path, lat, lon, samples);
            grid.tiles.push( tile );
        }
    }
    
    grid.isContained = function( lat, lon ) {
        if (grid.tiles[0].latitude <= lat || lat < grid.tiles[0].latitude + grid.height)
            if (grid.tiles[0].longitude <= lon || lon < grid.tiles[0].longitude + grid.width)
                return true;
        return false;
    }

    /** returns the tile specified by the coordinate of it's lower left corner in degrees */
    grid.getTile = function(lat, lon) {
        if (grid.isContained(lat, lon))
            return grid.tiles[ lat * grid.width + lon ];
        return null;
    }

    /** returns the specified sample */
    grid.getCell = function( latDeg, latSec, lonDeg, lonSec ) {
        let tile = grid.getTile(latDeg, lonDeg);
        if (tile)
            return tile.elevations[ latSec*samples + lonSec];
        return null;
    }

    grid.getSample = function( lat, lon ) {
        let latDeg = Math.floor(lat);
        let lonDeg = Math.floor(lon);
        let latWeight = Math.round( samples*(lat - latDeg) );
        let lonWeight = samples*(lon - lonDeg);
    }

    grid.getBiLinearSample = function( lat, lon ) {
        // separate degrees, pixes and remainder
        let latDeg = Math.floor(lat);
        let lonDeg = Math.floor(lon);
        let latWeight = samples*(lat - latDeg);
        let lonWeight = samples*(lon - lonDeg);
        let latSec = Math.floor( latWeight );
        let lonSec = Math.floor( lonWeight );
        latWeight-=latSec;
        lonWeight-=lonSec;

        // use the remainders to bilinearly interpolate the 4 nearest pixels.
        let sample = grid.getCell(latDeg, latSec, lonDeg, lonSec) * (1.0-latWeight) * (1.0-lonWeight);
        sample += grid.getCell(latDeg, latSec, lonDeg, lonSec+1) * (1.0-latWeight) * (lonWeight);
        sample += grid.getCell(latDeg, latSec+1, lonDeg, lonSec) * (lonWeight) * (1.0-lonWeight);
        sample += grid.getCell(latDeg, latSec+1, lonDeg, lonSec+1) * (latWeight) * (lonweight);
        // note: there is actually one extra sample row and column on the extreme side of the artm tiles, so we can't sample past the edge of the array this way...

        return sample/4;
    } //TODO add a get method which accepts a kernel to weight a set of samples

    return grid;
}

/** Construct a new Tile from sparse sampling of a grid
 * step : distance between adjacent samples in arcseconds
 */
returnObj.resample = function( grid, latitude, longitude, step, width, height ) {

    // initialize the tile
    let tile = {};
    tile.latitude = latitude;
    tile.longitude = longitude;
    tile.width = width;
    tile.height = height;
    tile.resolution = step;
    tile.lowest = 0;
    tile.highest = 0;
    tile.elevations = [];
    let d = step/3600;

    // sample the specified grid
    for (let y=0; y<height; y++) {
        let lat = latitude + y * d;
        for (let x=0; x<width; x++) {
            let lon = longitude + x * d;

            // track maxima
            let height = grid.getSample(lat, lon);
            if (height>tile.highest)
                tile.highest = height;
            if (height<tile.lowest)
                tile.lowest = height;

            tile.elevations.push( height );
        }
    }
    return tile;
}

return returnObj;
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
