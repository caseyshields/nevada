// Adapted from 'Aviation Formulary v1.46' by Ed Williams
// http://edwilliams.org/avform.htm

export default {

    degreeFormat : d3.format(" 3"),
    minuteFormat : d3.format("02.3f"),
    
    deg2rad : (deg) => deg*Math.PI/180,
    rad2deg : (rad) => rad*180/Math.PI,
    nm2rad : (nm) => nm*180*60/Math.PI,
    rad2nm : (rad) => rad*Math.PI/180*60,
    nm2m : (nm) => nm*1852.0,

    degrees2sexagesimal : function( deg, neg, pos) {
        let suffix = (deg<0) ? neg : pos;
        deg = Math.abs( deg );
        let d = Math.floor( deg );
        let r = (deg - d) * 60.0;
        return degreeFormat(d)+"° "+minuteFormat(r)+"' "+suffix;
    },

    /** Spherical distance. Given by d = 2*asin( sqrt( (sin((lat1-lat2)/2))^2 + cos(lat1)*cos(lat2)*(sin((lon1-lon2)/2))^2) )
     * @param {number} lat1 : latitude in radians
     * @return spherical distance in radians */
    sphericalDistance : function(lat1, lon1, lat2, lon2) {
        let d = 2 * Math.asin( Math.sqrt( 
            Math.pow( Math.sin((lat1-lat2)/2), 2)
            + Math.cos(lat1) * Math.cos(lat2) 
                * Math.pow( Math.sin((lon1-lon2)/2), 2) ));
        return d;
    },

    /** tc = mod(atan2(sin(lon1-lon2)*cos(lat2), cos(lat1)*sin(lat2)-sin(lat1)*cos(lat2)*cos(lon1-lon2)), 2*pi)
     * @param {number} lat1 : Latitude in radians
     * @return initial course for great circle navigation in radians
    */
    initialCourse : function(lat1, lon1, lat2, lon2) {
        if( Math.abs(Math.cos(lat1)) < Number.EPSILON )
            return PI;
        return Math.atan2(
                Math.sin(lon1-lon2) * Math.cos(lat2),
                Math.cos(lat1)*Math.sin(lat2)
                    - Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon1-lon2)
            ) % (2*Math.PI);
    },

    /** Lat/lon given radial and distance
    A point {lat,lon} is a distance d out on the tc radial from point 1 if:

        lat=asin( sin(lat1)*cos(d) + cos(lat1)*sin(d)*cos(tc) )
        IF (cos(lat)=0)
            lon=lon1      // endpoint a pole
        ELSE
            lon=mod( lon1-asin(sin(tc)*sin(d)/cos(lat))+pi, 2*pi)-pi
        ENDIF

        1 nauticalMile = 1 arcminute(Re=6366.71km) = 1852m
        
    This algorithm is limited to distances such that dlon <pi/2, i.e those that extend around less than one quarter of the circumference of the earth in longitude. A completely general, but more complicated algorithm is necessary if greater distances are allowed:

        lat =asin(sin(lat1)*cos(d)+cos(lat1)*sin(d)*cos(tc))
        dlon=atan2(sin(tc)*sin(d)*cos(lat1),cos(d)-sin(lat1)*sin(lat))
        lon=mod( lon1-dlon +pi,2*pi )-pi
    */
    travel : function(lat1, lon1, tc, d) {
        let lat = Math.asin( Math.sin(lat1)*Math.cos(d) 
                + Math.cos(lat1)*Math.sin(d)*Math.cos(tc) );
        let lon = (Math.cos(lat) == 0) ? lon1
            : ((lon1 - Math.asin( Math.sin(tc)*Math.sin(d)/Math.cos(lat) ) + Math.PI) % (2*Math.PI)) - Math.PI;
        return [lat, lon];
    }
};

//TODO implement the rest of the aviation formulary

/** Intersecting radials
Now how to compute the latitude, lat3, and longitude, lon3 of an intersection formed by the crs13 true bearing from point 1 and the crs23 true bearing from point 2:

dst12=2*asin(sqrt((sin((lat1-lat2)/2))^2+
                   cos(lat1)*cos(lat2)*sin((lon1-lon2)/2)^2))
IF sin(lon2-lon1)<0
   crs12=acos((sin(lat2)-sin(lat1)*cos(dst12))/(sin(dst12)*cos(lat1)))
   crs21=2.*pi-acos((sin(lat1)-sin(lat2)*cos(dst12))/(sin(dst12)*cos(lat2)))
ELSE
   crs12=2.*pi-acos((sin(lat2)-sin(lat1)*cos(dst12))/(sin(dst12)*cos(lat1)))
   crs21=acos((sin(lat1)-sin(lat2)*cos(dst12))/(sin(dst12)*cos(lat2)))
ENDIF

ang1=mod(crs13-crs12+pi,2.*pi)-pi
ang2=mod(crs21-crs23+pi,2.*pi)-pi

IF (sin(ang1)=0 AND sin(ang2)=0)
   "infinity of intersections"
ELSEIF sin(ang1)*sin(ang2)<0
   "intersection ambiguous"
ELSE
   ang1=abs(ang1)
   ang2=abs(ang2)
   ang3=acos(-cos(ang1)*cos(ang2)+sin(ang1)*sin(ang2)*cos(dst12)) 
   dst13=atan2(sin(dst12)*sin(ang1)*sin(ang2),cos(ang2)+cos(ang1)*cos(ang3))
   lat3=asin(sin(lat1)*cos(dst13)+cos(lat1)*sin(dst13)*cos(crs13))
   dlon=atan2(sin(crs13)*sin(dst13)*cos(lat1),cos(dst13)-sin(lat1)*sin(lat3))
   lon3=mod(lon1-dlon+pi,2*pi)-pi
ENDIF
The points 1,2 and the (if unique) intersection 3 form a spherical triangle with interior angles abs(ang1), abs(ang2) and ang3. To find the pair of antipodal intersections of two great circles uses the following reference.
*/

/**Intermediate points on a great circle
In previous sections we have found intermediate points on a great circle given either the crossing latitude or longitude. Here we find points (lat,lon) a given fraction of the distance (d) between them. Suppose the starting point is (lat1,lon1) and the final point (lat2,lon2) and we want the point a fraction f along the great circle route. f=0 is point 1. f=1 is point 2. The two points cannot be antipodal ( i.e. lat1+lat2=0 and abs(lon1-lon2)=pi) because then the route is undefined. The intermediate latitude and longitude is then given by:

        A=sin((1-f)*d)/sin(d)
        B=sin(f*d)/sin(d)
        x = A*cos(lat1)*cos(lon1) +  B*cos(lat2)*cos(lon2)
        y = A*cos(lat1)*sin(lon1) +  B*cos(lat2)*sin(lon2)
        z = A*sin(lat1)           +  B*sin(lat2)
        lat=atan2(z,sqrt(x^2+y^2))
        lon=atan2(y,x)
 */

// some tests...
// console.log( sphericalDistance(38, -117, 39, -117) )

// console.log( (33+57/60)*(Math.PI/180) );
// console.log( (118+24/60)*(Math.PI/180) );

// console.log( sphericalDistance(
//     0.592539, 2.066470,
//     0.709186, 1.287762 )); // 0.623585

// console.log( initialCourse(
//     0.592539, 2.066470,
//     0.709186, 1.287762 )); // 1.1500339427083197

// console.log( travel( 0.592539, 2.066470, 1.150035, 0.0290888) );
// [0.6041798689300695, 2.0342057117747903]

//console.log( travel( 0.592539, 2.066470, 1.150035, 0.623585) );
// [0.7091853789072877, 1.2877619553381212]
