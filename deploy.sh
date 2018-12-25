#!/bin/sh
# A script to copy the main research HTML page to the demo
cp bezpath.js curves.js splineui.js docs/demo
cat spline.html | grep -v "biparabola.js" | grep -v "spiro.js" > docs/demo/index.html
