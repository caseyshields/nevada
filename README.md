<a name="createMap"></a>

## createMap(svg)
Factory which returns a D3 map component

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| svg | <code>string</code> | A D3 selection holding the svg where the map will be rendered |


* [createMap(svg)](#createMap)
    * [~args](#createMap..args)
    * [~map()](#createMap..map)
        * [.drawGround()](#createMap..map.drawGround)
        * [.drawContours()](#createMap..map.drawContours)
        * [.drawBounds()](#createMap..map.drawBounds)
        * [.drawMarks()](#createMap..map.drawMarks)
        * [.setColorScale()](#createMap..map.setColorScale)
        * [.marks()](#createMap..map.marks)
        * [.addContour(contour)](#createMap..map.addContour)
        * [.addBounds(bound)](#createMap..map.addBounds)
        * [.screen2sphere()](#createMap..map.screen2sphere)
        * [.sphere2screen(sphere)](#createMap..map.sphere2screen) ΓçÆ

<a name="createMap..args"></a>

### createMap~args
Default configuration arguments for the map component.

**Kind**: inner property of [<code>createMap</code>](#createMap)  
<a name="createMap..map"></a>

### createMap~map()
The default function invokes a render of the entire map

**Kind**: inner method of [<code>createMap</code>](#createMap)  

* [~map()](#createMap..map)
    * [.drawGround()](#createMap..map.drawGround)
    * [.drawContours()](#createMap..map.drawContours)
    * [.drawBounds()](#createMap..map.drawBounds)
    * [.drawMarks()](#createMap..map.drawMarks)
    * [.setColorScale()](#createMap..map.setColorScale)
    * [.marks()](#createMap..map.marks)
    * [.addContour(contour)](#createMap..map.addContour)
    * [.addBounds(bound)](#createMap..map.addBounds)
    * [.screen2sphere()](#createMap..map.screen2sphere)
    * [.sphere2screen(sphere)](#createMap..map.sphere2screen) ΓçÆ

<a name="createMap..map.drawGround"></a>

#### map.drawGround()
draw the graticule, elevations, and territories

**Kind**: static method of [<code>map</code>](#createMap..map)  
<a name="createMap..map.drawContours"></a>

#### map.drawContours()
Updates the SVG's elevation polygons using the D3 general update pattern

**Kind**: static method of [<code>map</code>](#createMap..map)  
<a name="createMap..map.drawBounds"></a>

#### map.drawBounds()
Updates the SVG's boundary lines

**Kind**: static method of [<code>map</code>](#createMap..map)  
<a name="createMap..map.drawMarks"></a>

#### map.drawMarks()
Updates the marks position in the SVG

**Kind**: static method of [<code>map</code>](#createMap..map)  
<a name="createMap..map.setColorScale"></a>

#### map.setColorScale()
Changes the elevation color scale.

**Kind**: static method of [<code>map</code>](#createMap..map)  
<a name="createMap..map.marks"></a>

#### map.marks()
sets the array holding the map's marker data

**Kind**: static method of [<code>map</code>](#createMap..map)  
<a name="createMap..map.addContour"></a>

#### map.addContour(contour)
Adds the given GeoJson object to the contour render list.

**Kind**: static method of [<code>map</code>](#createMap..map)  

| Param | Type | Description |
| --- | --- | --- |
| contour | <code>GeoJson</code> | Should also contain a 'height' member representing the elevation in meters |

<a name="createMap..map.addBounds"></a>

#### map.addBounds(bound)
Adds the given geometry to the list of boundary lines

**Kind**: static method of [<code>map</code>](#createMap..map)  

| Param | Type | Description |
| --- | --- | --- |
| bound | <code>GeoJson</code> | A line geometry to be drawn on top of the contours |

<a name="createMap..map.screen2sphere"></a>

#### map.screen2sphere()
Convert from view port coordinates into spherical coordinates

**Kind**: static method of [<code>map</code>](#createMap..map)  
<a name="createMap..map.sphere2screen"></a>

#### map.sphere2screen(sphere) ΓçÆ
Convert from spherical coordinates into viewport coordinates

**Kind**: static method of [<code>map</code>](#createMap..map)  
**Returns**: An array holding the planar viewport coordinates.  

| Param | Type | Description |
| --- | --- | --- |
| sphere | <code>Array.&lt;number&gt;</code> | An array holding the longitude and latitude in that order |

