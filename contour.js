let fs = require('fs');
let d3 = Object.assign(
    require('d3'),
    require('d3-geo-projection')
);

exports.create = function(tile, min, step, max) {
    // TODO should take an array of desired elevation slices...

    // determine the elevations to contour
    let h = min;
    let steps = [];
    while (h <= max) {
        steps.push( h );
        h+=step;
    }

    // use D3 to compute an array of contours
    let contours = d3.contours()
        .size( [tile.width,tile.height] )
        .thresholds( steps )
        (tile.elevations).map(convert);

    // Bafflingly, converting the coordinates appears to reverse some, not all, of the polygons, which cause fill flooding to the entire plane.
    // I need to study this problem more...
    function convert(d) {
        var p = {
            type: "Polygon",
            coordinates: d3.merge( d.coordinates.map(function(polygon) {
                return polygon.map( function(ring) {
                    return ring.map( function(point) {
                        return [
                            tile.longitude + (point[0]*tile.resolution/3600.0),
                            tile.latitude + (tile.resolution*tile.height)/3600 - (point[1]*tile.resolution/3600.0) ];
                    }).reverse();
                })
            }))
        };

        // no antimeridian crossed in my dataset
        p = d3.geoStitch(p);

        return p.coordinates.length 
            ? {type:"Polygon", coordinates: p.coordinates, value: d.value}
            : {type:"Sphere", value: d.value};
    } // cribbed from https://bl.ocks.org/mbostock/83c0be21dba7602ee14982b020b12f51

    // previous attempts;
    let projection = d3.geoIdentity()
    //         .scale( tile.resolution/3600.0 ) // what about aspect ratios?
    //         .translate( [tile.longitude, tile.latitude] );
    // construct a transform from image coordinates to latitude and longitude
    // let projection = d3.geoProjection(
    //     function(x, y) {
    //         return [-tile.longitude + (x/(tile.samples)) ,
    //                 tile.latitude + (y/(tile.samples-1)) ];
    //     });
    // let projection = d3.geoTransform({
    //     point: function(x, y) {
    //         this.stream.point(minLongitude + (x*resolution/arcseconds),
    //                 minLatitude + (y*resolution/arcseconds) );
    //     }
    // });

    
    // // geoProject() doesn't handle the output of d3-contour?
    // let geometry = d3.geoProject(contours, projection);
    // for(let i in geometry)
    //     geometry[i].value = steps[i];
    // let pre = (tile.latitude>=0) ? 'N'+tile.latitude : 'S'+(-1*tile.latitude);
    // let suf = (tile.longitude>=0) ? 'E'+tile.longitude : 'W'+(-1*tile.longitude);
    // let path = 'elevation/'+pre+suf+'.json';
    // fs.writeFileSync(
    //     path,
    //     JSON.stringify( geometry ),
    //     ()=>{console.log( 'wrote '+contour );}
    // );
    // // are my contour examples old?
    
    // // let all = [];
    // for(let i in contours) {

    //     // transform every contour
    //     let geometry = d3.geoProject(contours[i], projection);
    //     if (geometry) {
    //         geometry.value = steps[i];

    //         // and write it out to a file
    //         let pre = (tile.latitude>=0) ? 'N'+tile.latitude : 'S'+(-1*tile.latitude);
    //         let suf = (tile.longitude>=0) ? 'E'+tile.longitude : 'W'+(-1*tile.longitude);
    //         let path = 'elevation/'+pre+suf+'H'+steps[i]+'.json';
    //         fs.writeFileSync(
    //             path,
    //             JSON.stringify( geometry ),
    //             ()=>{console.log( 'wrote '+contour );}
    //         );
    //         // all.push( geometry );
    //     }
    // }

    for(let i in contours) {
        contours[i].value = steps[i];
        let pre = (tile.latitude>=0) ? 'N'+tile.latitude : 'S'+(-1*tile.latitude);
        let suf = (tile.longitude>=0) ? 'E'+tile.longitude : 'W'+(-1*tile.longitude);
        let path = 'elevation/'+pre+suf+'H'+steps[i]+'.json';
        fs.writeFileSync(
            path,
            JSON.stringify( contours[i] ),
            ()=>{console.log( 'wrote '+path );}
        );
    }


    // // also write out the whole thing
    // let pre = (tile.latitude>=0) ? 'N'+tile.latitude : 'S'+(-1*tile.latitude);
    // let suf = (tile.longitude>=0) ? 'E'+tile.longitude : 'W'+(-1*tile.longitude);
    // let path = 'elevation/'+pre+suf+'.json';
    // fs.writeFileSync(
    //     path,
    //     JSON.stringify( all ),
    //     ()=>{console.log( 'wrote '+contour );}
    // );
}
