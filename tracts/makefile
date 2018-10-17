# obtained from a Mike Bostock tutorial at 'https://bost.ocks.org/mike/make/'

counties.zip:
	curl -o counties.zip 'http://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_20m.zip'
# dang, msys does not have curl, and I'm not sure how to build it. probably switch to cygwin
# maybe use wget?

gz_2010_us_050_00_20m.shp: counties.zip
	unzip counties.zip
	touch gz_2010_us_050_00_20m.shp

counties.json: gz_2010_us_050_00_20m.shp
	topojson -o counties.json -- counties=gz_2010_us_050_00_20m.shp

# once I get curl working I'll convert my batch file, like at;
# https://gist.github.com/johan/db11e7bd04f030031dae209fa1a6c3e4