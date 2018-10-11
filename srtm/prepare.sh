#!/bin/sh
echo "Downloading SRTM heightmap for Nevada"
LAT=35
while [ $LAT -lt 42 ]; do
    LON=120
    while [ $LON -gt 114 ]; do
        # echo $LAT"N"$LON"W"
        if [ ! -f "N"$LAT"W"$LON".hgt.zip" ]; then
            curl --basic "https://dds.cr.usgs.gov/srtm/version2_1/SRTM3/North_America/N"$LAT"W"$LON".hgt.zip" -o "./N"$LAT"W"$LON".hgt.zip"
        fi
        if [ ! -f "N"$LAT"W"$LON".hgt" ]; then
            unzip -o "N"$LAT"W"$LON".hgt.zip"
        fi
        let LON=LON-1
    done
    let LAT=LAT+1
done

#echo npm install d3-contour

# for i in $( ls ); do
#     echo item: $i
# done