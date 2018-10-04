echo "entirely taken from Mike Bostock's 'Command Line Cartography'"

curl --basic "http://www2.census.gov/geo/tiger/GENZ2017/shp/cb_2017_32_tract_500k.zip" -o cb_2017_32_tract_500k.zip

unzip -o cb_2014_06_tract_500k.zip

npm install -g shapefile

shp2json cb_2017_32_tract_500k.shp -o nv.json
