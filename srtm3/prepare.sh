#!/bin/sh
echo "Downloading SRTM3 heightmap for Nevada"
LAT=35
while [ $LAT -lt 42 ]; do
    LON=120
    while [ $LON -gt 114 ]; do
        # echo $LAT"N"$LON"W"
        HGT="N"$LAT"W"$LON".hgt"
        ZIP=$HGT".zip"
        if [ ! -f $HGT ]; then
            if [ ! -f $ZIP ]; then
                curl --basic "https://dds.cr.usgs.gov/srtm/version2_1/SRTM3/North_America/"$ZIP -o $ZIP
            fi
            unzip -o $ZIP
        fi
        if [ -f $ZIP ]; then
            rm $ZIP
        fi
        let LON=LON-1
    done
    let LAT=LAT+1
done

#echo npm install d3-contour

# for i in $( ls ); do
#     echo item: $i
# done