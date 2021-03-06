# D3 Atlas

 A map of Nevada's terrain and census tracts. The tracts come from the 2017 census, and the contours were computed from The Shuttle Radar Topography Mission data using D3.

This visualization is a composite of D3 components. An 'Atlas' component holds a geographic projection, a camera transform, and a stack of components which are rendered in order. It is a D3 style component which applies the General Update Pattern recursively to it's constituent components.

The 'Contour' component creates projected SVG paths. It is added twice to the Atlas; Once to draw the territories, and once to draw the elevation contours. The only difference between them is the CSS styling for fill and stroke. They are loaded asynchronously and the map is refreshed as they arrive.

A 'Stamp' component clones SVG definitions. In this case, I put a '+'-shaped marker at every corner of the original SRTM raster tiles. Notice how the markers do not change size as you zoom in and out on the terrain? Layers can be marked so the Atlas does not apply its transforms to them, which is useful for overlays.

Mouse interactivity can be added to any component. In this example mouse movement calculates the geodetic coordinates of the pointer using the inverse of the Atlas's transforms. Carefully clicking on a Stamp marker will printout the the data contents of that marker in the bottom left corner of the screen. Dragging and scrolling updates the camera transform using D3.Zoom.

Compositing components and then attaching behavior to them in this way makes extensibility and code reuse much easier. Though I'm not sure I got the container interface polished enough, I still think I got the right idea for more complex dashboards or subtly different customer needs.
