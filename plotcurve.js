// Copyright 2018 Raph Levien

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Code for plotting bezier-based curves, and making curvature maps.
// Note: this is a rough prototype and will probably get subsumed under
// more general curve manipulation.

function plotFamily(curve) {
	let n = 12;
	let len = 36;
	let minth = -Math.PI/2;
	let maxth = Math.PI/2;
	console.log("%!PS-Adobe-3.0")
	for (var j = 0; j <= n; j++) {
		let th1 = -Math.PI/2 + Math.PI * j / n;
		let y = 3.5 * 72 + 6.5 * 72 * j / n;
		for (var i = 0; i <= n; i++) {
			let th0 = -Math.PI/2 + Math.PI * i / n;
			let x = 72 + 6.5 * 72 * i / n;
			let pts = curve.render(th0, th1);
			console.log(`${x - 0.5 * len} ${y} moveto`);
			for (var k = 0; k < pts.length; k++) {
				let pt = pts[k];
				console.log(`${x + (pt.x - 0.5) * len} ${y + pt.y * len}`);
				if (k % 3 == 2) {
					console.log("curveto");
				}
			}
			console.log(`${x + 0.5 * len} ${y} curveto stroke`);
		}
	}
	console.log("showpage");
}

/// Make a curvature map of a two param curve, suitable for gnuplot
function makeCurvatureMap(curve) {
	let n = 50;
	let mapScaling = "none";
	for (var j = 0; j < n; j++) {
		let th1 = -Math.PI/2 + Math.PI * j / (n - 1);
		for (var i = 0; i < n; i++) {
			let th0 = -Math.PI/2 + Math.PI * i / (n - 1);
			let atanK = curve.computeCurvature(th0, th1).ak0;
			let k = Math.tan(atanK);
			let toPlot;
			if (mapScaling === "none") {
				toPlot = k;
			} else if (mapScaling === "atan") {
				toPlot = atanK;
			} else if (mapScaling === "sincos2") {
				// Somewhat arbitrary scaling parameter here...
				let k1 = 0.25 * k;
				var scaled = Math.asin((Math.sqrt(4 * k1 * k1 + 1) - 1) / (2 * k1));
				if (atanK > Math.PI / 2) {
					scaled = scaled + Math.PI;
				} else if (atanK < -Math.PI / 2) {
					scaled = scaled - Math.PI;
				}
				toPlot = scaled;
			}
			console.log(`${th0} ${th1} ${toPlot}`);
		}
		console.log('');
	}
}

makeCurvatureMap(new BiParabola);
//plotFamily(new MyCurve);
