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
	let n = 100;
	for (var j = 0; j < n; j++) {
		let th1 = -Math.PI/2 + Math.PI * j / (n - 1);
		for (var i = 0; i < n; i++) {
			let th0 = -Math.PI/2 + Math.PI * i / (n - 1);
			let atanK = curve.computeCurvature(th0, th1).ak0;
			let k = 0.25 * Math.tan(atanK);
			var scaled = Math.asin((Math.sqrt(4 * k * k + 1) - 1) / (2 * k));
			if (atanK > Math.PI / 2) {
				scaled = scaled + Math.PI;
			} else if (atanK < -Math.PI / 2) {
				scaled = scaled - Math.PI;
			}
			console.log(`${th0} ${th1} ${scaled}`);
		}
		console.log('');
	}
}

makeCurvatureMap(new MyCurve);
//plotFamily(new MyCurve);
