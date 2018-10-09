echo "entirely taken from Mike Bostock's 'Command Line Cartography'"

curl --basic "http://www2.census.gov/geo/tiger/GENZ2017/shp/cb_2017_32_tract_500k.zip" -o cb_2017_32_tract_500k.zip

unzip -o cb_2014_06_tract_500k.zip

npm install -g shapefile

shp2json cb_2017_32_tract_500k.shp -o nv.json

geoproject 'd3.geoTransverseMercator().rotate([116 + 40 / 60, -34 - 45 / 60]).fitSize([512, 512], d)' < nv.json > nv_screen.json

geo2svg -w 512 -h 512 nv_screen.json > nv_screen.svg

echo "cobbling together some rasters for contour drawings"

curl --basic "https://dds.cr.usgs.gov/srtm/version2_1/SRTM3/North_America/N36W116.hgt.zip" -o "./srtm/N36W116.hgt.zip"

unzip -o "srtm/N36W116.hgt.zip"

npm install d3-contour
