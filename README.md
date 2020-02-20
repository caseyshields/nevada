# D3 Atlas

It's been a bit since I started writing D3 visualization components, and I realized some things.

The earlier, one-off components I was making was simply re-creating the 'tyranny of charts' situation in our libraries. Customers would request subtle modifications; such as the zoom behavior of a map marker, or whether it was linked to other markers- and this would caused revisions and schisms in the larger component and its interfaces.

So I took a step back and tried to emulate some of the properties that made D3 such a joy to work in the first place;

 - Simplicity
 - Composability
 - Generality

To fulfill simplicity I closely read 'On D3 Components' by Mike Bostock, the author of D3. He argues for components which are simply render methods that accept a selection. Visual properties independent of the data can be added as properties of the function, which can be fluently composed. I rather like this approach.

To make them composable I separated visual artifacts into 'containers' and 'components'. The basic idea is a visualization can be constructed as a tree of objects, whose leaves are components and whose interior nodes are containers.

This requires each component to know how to perfom the 'D3 General update pattern', and containers have to know how to recursively invoke thier child components.

I approach this in a straightforward way; the data array might be recursively packed with data arrays of components, and it is an argument of the main render method. The container has an index of components which it matches to the data items and recurses on.

This can let you accomplish neat effects. For example, in this demo when the user moves the camera around, layers which are marked as overlay are not affected by geographic projections or the camera, while other layers are. Try zooming around and notice how the icons don't change in size.

In this updated version, I'm applying this approach to one of my older D3 components.
 - I break elevation and territories into a 'Contour' component. Only CSS styling differentiates the actual markup!
 - The overlay icons marking the SRTM tile corners was broken into a 'Stamp' component which clones icons in your SVG defs.
 - The map itself was broken into an 'Atlas' container. It handles camera controls, holds the geographic projection and a stack of layers.

While there is a little more complexity, it is much easier to extend, and that functionality is much more re-usable. For example, if someone asks for the ability to render a network of markers on the map, you just write a new edge component. If they no longer want to display the nodes geospatially, you write a new container using the D3 force simulator. Hell, swap them out at run time if you want.
