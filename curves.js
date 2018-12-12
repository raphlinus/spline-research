// Copyright 2018 Raph Levien

//! A library of primitives for curves and splines.

/// A simple container for 2-vectors
class Vec2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	norm() {
		return Math.hypot(this.x, this.y);
	}

	dot(other) {
		return this.x * other.x + this.y * other.y;
	}

	cross(other) {
		return this.x * other.y - this.y * other.x;
	}
}

class CubicBez {
	/// Argument is array of coordinate values [x0, y0, x1, y1, x2, y2, x3, y3].
	constructor(coords) {
		this.c = coords;
	}

	weightsum(c0, c1, c2, c3) {
		let x = c0 * this.c[0] + c1 * this.c[2] + c2 * this.c[4] + c3 * this.c[6];
		let y = c0 * this.c[1] + c1 * this.c[3] + c2 * this.c[5] + c3 * this.c[7];
		return new Vec2(x, y);
	}

	eval(t) {
		let mt = 1 - t;
		let c0 = mt * mt * mt;
		let c1 = 3 * mt * mt * t;
		let c2 = 3 * mt * t * t;
		let c3 = t * t * t;
		return this.weightsum(c0, c1, c2, c3);
	}

	deriv(t) {
		let mt = 1 - t;
		let c0 = -3 * mt * mt;
		let c3 = 3 * t * t;
		let c1 = -6 * t * mt - c0;
		let c2 = 6 * t * mt - c3;
		return this.weightsum(c0, c1, c2, c3);
	}

	deriv2(t) {
		let mt = 1 - t;
		let c0 = 6 * mt;
		let c3 = 6 * t;
		let c1 = 6 - 18 * mt;
		let c2 = 6 - 18 * t;
		return this.weightsum(c0, c1, c2, c3);
	}

	curvature(t) {
		let d = this.deriv(t);
		let d2 = this.deriv2(t);
		return d.cross(d2) / Math.pow(d.norm(), 3);
	}

	atanCurvature(t) {
		let d = this.deriv(t);
		let d2 = this.deriv2(t);
		return Math.atan2(d.cross(d2), Math.pow(d.norm(), 3));
	}
}

function testCubicBez() {
	let c = new Float64Array(8);
	for (var i = 0; i < 8; i++) {
		c[i] = Math.random();
	}
	let cb = new CubicBez(c);
	let t = Math.random();
	let epsilon = 1e-6;
	let xy0 = cb.eval(t);
	let xy1 = cb.eval(t + epsilon);
	console.log(new Vec2((xy1.x - xy0.x) / epsilon, (xy1.y - xy0.y) / epsilon));
	console.log(cb.deriv(t));

	let dxy0 = cb.deriv(t);
	let dxy1 = cb.deriv(t + epsilon);
	console.log(new Vec2((dxy1.x - dxy0.x) / epsilon, (dxy1.y - dxy0.y) / epsilon));
	console.log(cb.deriv2(t));
}

/// Solve tridiagonal matrix system. Destroys inputs, leaves output in x.
///
/// Solves a[i] * x[i - 1] + b[i] * x[i] + c[i] * x[i + 1] = d[i]
///
/// Inputs are array-like objects (typed arrays are good for performance).
///
/// Note: this is not necessarily the fastest, see:
/// https://en.wikibooks.org/wiki/Algorithm_Implementation/Linear_Algebra/Tridiagonal_matrix_algorithm
function tridiag(a, b, c, d, x) {
	let n = x.length;
	for (var i = 1; i < n; i++) {
		let m = a[i] / b[i - 1];
		b[i] -= m * c[i - 1];
		d[i] -= m * d[i - 1];
	}
	x[n - 1] = d[n - 1] / b[n - 1];
	for (var i = n - 2; i >= 0; i--) {
		x[i] = (d[i] - c[i] * x[i + 1]) / b[i];
	}
}

function testTridiag(n) {
	let a = new Float64Array(n);
	let b = new Float64Array(n);
	let c = new Float64Array(n);
	let d = new Float64Array(n);
	let x = new Float64Array(n);

	for (var i = 0; i < n; i++) {
		a[i] = Math.random();
		b[i] = 2 + Math.random();
		c[i] = Math.random();
		d[i] = Math.random();
		x[i] = Math.random();
	}
	let bsave = new Float64Array(b);
	let dsave = new Float64Array(d);
	let xsave = new Float64Array(x);
	tridiag(a, b, c, d, x);
	b = bsave; d = dsave;
	console.log(b[0] * x[0] + c[0] * x[1] - d[0]);
	for (var i = 1; i < n - 1; i++) {
		console.log(a[i] * x[i - 1] + b[i] * x[i] + c[i] * x[i + 1] - d[i]);
	}
	console.log(a[n - 1] * x[n - 2] + b[n - 1] * x[n - 1] - d[n - 1]);
}

//testTridiag(10);
//testCubicBez();

/// Create a smooth cubic bezier.
function myCubic(th0, th1) {
	function myCubicLen(th0, th1) {
		let offset = 0.3 * Math.sin(th1 * 2 - 0.4 * Math.sin(th1 * 2));
		let newShape = true;
		if (newShape) {
			let scale = 1.0 / (3 * 0.8);
			let len = scale * (Math.cos(th0 - offset) - 0.2 * Math.cos((3 * (th0 - offset))));
			return len;
		} else {
			let drive = 2.0;
			let scale = 1.0 / (3 * Math.tanh(drive));
			let len = scale * Math.tanh(drive * Math.cos(th0 - offset));
			return len;
		}
	}

	var coords = new Float64Array(8);
	let len0 = myCubicLen(th0, th1);
	coords[2] = Math.cos(th0) * len0;
	coords[3] = Math.sin(th0) * len0;

	let len1 = myCubicLen(th1, th0);
	coords[4] = 1 - Math.cos(th1) * len1;
	coords[5] = Math.sin(th1) * len1;
	coords[6] = 1;
	return coords;
}

//! Base class for two parameter curve families

class TwoParamCurve {
	/// Render the curve, providing an array of _interior_ cubic bezier
	/// control points only. Return value is an array of 3n-1 Vec2's.
	// render(th0, th1)

	/// Compute curvature.
	///
	/// Result is an object with ak0 and ak1 (arctan of curvature at endpoints).
	/// Quadrant is significant - a value outside -pi/2 to pi/2 means a reversal
	/// of direction.
	// computeCurvature(th0, th1)

	/// Get endpoint condition.
	///
	/// Return tangent at endpoint given next-to-endpoint tangent.
	// endpointTangent(th)

	/// Compute curvature derivatives.
	///
	/// Result is an object with dak0dth0 and friends.
	/// Default implementation is approximate through central differencing, but
	/// curves can override.
	computeCurvatureDerivs(th0, th1) {
		let epsilon = 1e-6;
		let scale = 2.0 / epsilon;
		let k0plus = this.computeCurvature(th0 + epsilon, th1);
		let k0minus = this.computeCurvature(th0 - epsilon, th1);
		let dak0dth0 = scale * (k0plus.ak0 - k0minus.ak0);
		let dak1dth0 = scale * (k0plus.ak1 - k0minus.ak1);
		let k1plus = this.computeCurvature(th0, th1 + epsilon);
		let k1minus = this.computeCurvature(th0, th1 - epsilon);
		let dak0dth1 = scale * (k1plus.ak0 - k1minus.ak0);
		let dak1dth1 = scale * (k1plus.ak1 - k1minus.ak1);
		return {dak0dth0: dak0dth0, dak1dth0: dak1dth0, dak0dth1: dak0dth1, dak1dth1: dak1dth1};
	}
}

class MyCurve extends TwoParamCurve {
	render(th0, th1) {
		let c = myCubic(th0, th1);
		return [new Vec2(c[2], c[3]), new Vec2(c[4], c[5])];
	}

	computeCurvature(th0, th1) {
		let cb = new CubicBez(myCubic(th0, th1));
		function curv(t, th) {
			let c = Math.cos(th);
			let s = Math.sin(th);
			let d2 = cb.deriv2(t);
			let d2cross = d2.y * c - d2.x * s;
			let d = cb.deriv(t);
			let ddot = d.x * c + d.y * s;
			return Math.atan2(d2cross, ddot * Math.abs(ddot));
		}

		//let ak0 = cb.atanCurvature(0);
		//let ak1 = cb.atanCurvature(1);
		let ak0 = curv(0, th0);
		let ak1 = curv(1, -th1);

		return {ak0: ak0, ak1: ak1};
	}

	endpointTangent(th) {
		// Same value as parabola:
		//return Math.atan(2 * Math.tan(th)) - th;

		return 0.5 * Math.sin(2 * th);
	}
}

//! Global spline solver

// normalize theta to -pi..pi
function mod2pi(th) {
	let twopi = 2 * Math.PI;
	let frac = th * (1 / twopi);
	return twopi * (frac - Math.round(frac)); 
}


class TwoParamSpline {
	constructor(curve, ctrlPts) {
		this.curve = curve;
		this.ctrlPts = ctrlPts;
		this.startTh = null;
		this.endTh = null;
	}

	/// Determine initial tangent angles, given array of Vec2 control points.
	initialThs() {
		var ths = new Float64Array(this.ctrlPts.length);
		for (var i = 1; i < ths.length - 1; i++) {
			let dx0 = this.ctrlPts[i].x - this.ctrlPts[i - 1].x;
			let dy0 = this.ctrlPts[i].y - this.ctrlPts[i - 1].y;
			let l0 = Math.hypot(dx0, dy0);
			let dx1 = this.ctrlPts[i + 1].x - this.ctrlPts[i].x;
			let dy1 = this.ctrlPts[i + 1].y - this.ctrlPts[i].y;
			let l1 = Math.hypot(dx1, dy1);
			let th0 = Math.atan2(dy0, dx0);
			let th1 = Math.atan2(dy1, dx1);
			let bend = mod2pi(th1 - th0);
			let th = mod2pi(th0 + bend * l0 / (l0 + l1));
			ths[i] = th;
			if (i == 1) { ths[0] = th0; }
			if (i == ths.length - 2) { ths[i + 1] = th1; }
		}
		if (this.startTh !== null) {
			ths[0] = this.startTh;
		}
		if (this.endTh !== null) {
			ths[ths.length - 1] = this.endTh;
		}
		this.ths = ths;
		return ths;
	}

	/// Get tangent angles relative to endpoints, and chord length.
	getThs(i) {
		let dx = this.ctrlPts[i + 1].x - this.ctrlPts[i].x;
		let dy = this.ctrlPts[i + 1].y - this.ctrlPts[i].y;
		let th =  Math.atan2(dy, dx);
		let th0 = mod2pi(this.ths[i] - th);
		let th1 = mod2pi(th - this.ths[i + 1]);
		let chord = Math.hypot(dx, dy);
		return {th0: th0, th1: th1, chord: chord};
	}

	/// Crawl towards a curvature continuous solution.
	iterDumb(iter) {
		function computeErr(ths0, ak0, ths1, ak1) {
			// rescale tangents by geometric mean of chordlengths
			let ch0 = Math.sqrt(ths0.chord);
			let ch1 = Math.sqrt(ths1.chord);
			let a0 = Math.atan2(Math.sin(ak0.ak1) * ch1, Math.cos(ak0.ak1) * ch0);
			let a1 = Math.atan2(Math.sin(ak1.ak0) * ch0, Math.cos(ak1.ak0) * ch1);
			return a0 - a1;
			/*
			return ths1.chord * Math.sin(ak0.ak1) * Math.cos(ak1.ak0)
				- ths0.chord * Math.sin(ak1.ak0) * Math.cos(ak0.ak1);
			*/
		}

		let n = this.ctrlPts.length;
		// Fix endpoint tangents; we rely on iteration for this to converge
		if (this.startTh === null) {
			let ths0 = this.getThs(0);
			this.ths[0] += this.curve.endpointTangent(ths0.th1) - ths0.th0;
		}

		if (this.endTh === null) {
			let ths0 = this.getThs(n - 2);
			this.ths[n - 1] -= this.curve.endpointTangent(ths0.th0) - ths0.th1;
		}
		if (n < 3) return 0;

		var absErr = 0;
		var x = new Float64Array(n - 2);
		var ths0 = this.getThs(0);
		var ak0 = this.curve.computeCurvature(ths0.th0, ths0.th1);
		//console.log('');
		for (var i = 0; i < n - 2; i++) {
			let ths1 = this.getThs(i + 1);
			let ak1 = this.curve.computeCurvature(ths1.th0, ths1.th1);
			let err = computeErr(ths0, ak0, ths1, ak1);
			absErr += Math.abs(err);

			let epsilon = 1e-3;
			let ak0p = this.curve.computeCurvature(ths0.th0, ths0.th1 + epsilon);
			let ak1p = this.curve.computeCurvature(ths1.th0 - epsilon, ths1.th1);
			let errp = computeErr(ths0, ak0p, ths1, ak1p);
			let derr = (errp - err) * (1 / epsilon);
			//console.log(err, derr, ak0, ak1, ak0p, ak1p);
			x[i] = err / derr;

			ths0 = ths1;
			ak0 = ak1;
		}

		for (var i = 0; i < n - 2; i++) {
			let scale = Math.tanh(0.25 * (iter + 1));
			this.ths[i + 1] += scale * x[i];
		}

		return absErr;
	}

	/// Perform one step of a Newton solver.
	// Not yet implemented
	iterate() {
		let n = this.ctrlPts.length;
		if (n < 3) return;
		var a = new Float64Array(n - 2);
		var b = new Float64Array(n - 2);
		var c = new Float64Array(n - 2);
		var d = new Float64Array(n - 2);
		var x = new Float64Array(n - 2);

		let ths0 = this.getThs(0);
		var last_ak = this.curve.computeCurvature(ths0.th0, ths0.th1);
		var last_dak = this.curve.computeCurvatureDerivs(ths0.th0, ths0.th1);
		var last_a = Math.hypot(this.ctrlPts[1].x - this.ctrlPts[0].x,
			this.ctrlPts[1].y - this.ctrlPts[0].y);
		for (var i = 0; i < n - 2; i++) {
			let ths = this.getThs(i + 1);
			let ak = this.curve.computeCurvature(ths.th0, ths.th1);
			let dak = this.curve.computeCurvatureDerivs(ths.th0, ths.th1);
			var a = Math.hypot(this.ctrlPts[i + 2].x - this.ctrlPts[i + 1].x,
				this.ctrlPts[i + 2].y - this.ctrlPts[i + 1].y);
			let c0 = Math.cos(last_ak.ak1);
			let s0 = Math.sin(last_ak.ak1);
			let c1 = Math.cos(ak.ak0);
			let s1 = Math.sin(ak.ak0);

			// TODO: fill in derivatives properly
			d[i] = a * s0 * c1 - last_a * s1 * c0;

			last_ak = ak;
			last_dak = dak;
			last_a = a;
		}

		tridiag(a, b, c, d, x);
		for (var i = 0; i < n - 2; i++) {
			this.ths[i + 1] -= x[i];
		}
	}

	/// Return an SVG path string.
	renderSvg() {
		let c = this.ctrlPts;
		if (c.length == 0) { return ""; }
		let path = `M${c[0].x} ${c[0].y}`;
		let cmd = " C";
		for (var i = 0; i < c.length - 1; i++) {
			let ths = this.getThs(i);
			let render = this.curve.render(ths.th0, ths.th1);
			let dx = c[i + 1].x - c[i].x;
			let dy = c[i + 1].y - c[i].y;
			for (var j = 0; j < render.length; j++) {
				let pt = render[j];
				let x = c[i].x + dx * pt.x - dy * pt.y;
				let y = c[i].y + dy * pt.x + dx * pt.y;
				path += `${cmd}${x} ${y}`;
				cmd = " ";
			}
			path += ` ${c[i + 1].x} ${c[i + 1].y}`;
		}
		return path;
	}
}

/// Spline handles more general cases, including corners.
class Spline {
	constructor(ctrlPts, isClosed) {
		this.ctrlPts = ctrlPts;
		this.isClosed = isClosed;
		this.curve = new MyCurve();
	}

	solve() {
		var i = 0;
		while (i + 1 < this.ctrlPts.length) {
			let ptI = this.ctrlPts[i];
			let ptI1 = this.ctrlPts[i + 1];
			// Assume point i is a corner point (this will change when we have closed paths).
			if ((i + 2 == this.ctrlPts.length || ptI1.ty === "corner")
				&& ptI.th === null && ptI1.th === null) {
				let dx = ptI1.pt.x - ptI.pt.x;
				let dy = ptI1.pt.y - ptI.pt.y;
				let th = Math.atan2(dy, dx);
				ptI.rTh = th;
				ptI1.lTh = th;
				i += 1;
			} else {
				// We have a curve.
				let innerPts = [ptI.pt];
				let j = i + 1;
				while (j < this.ctrlPts.length) {
					let ptJ = this.ctrlPts[j];
					innerPts.push(ptJ.pt);
					j += 1;
					if (ptJ.ty === "corner" || ptJ.th !== null) {
						break;
					}
				}
				//console.log(innerPts);
				let inner = new TwoParamSpline(this.curve, innerPts);
				inner.startTh = this.ctrlPts[i].th;
				inner.endTh = this.ctrlPts[j - 1].th;
				let nIter = 10;
				inner.initialThs();
				for (let k = 0; k < nIter; k++) {
					inner.iterDumb(k);
				}
				for (let k = i; k + 1 < j; k++) {
					this.ctrlPts[k].rTh = inner.ths[k - i];
					this.ctrlPts[k + 1].lTh = inner.ths[k + 1 - i];
				}

				i = j - 1;
			}
		}
	}

	renderSvg() {
		if (this.ctrlPts.length == 0) {
			return "";
		}
		let pt0 = this.ctrlPts[0];
		let path = `M${pt0.pt.x} ${pt0.pt.y}`;
		let i = 0;
		let cmd = " C";
		for (let i = 0; i + 1 < this.ctrlPts.length; i++) {
			let ptI = this.ctrlPts[i];
			let ptI1 = this.ctrlPts[i + 1];
			let dx = ptI1.pt.x - ptI.pt.x;
			let dy = ptI1.pt.y - ptI.pt.y;
			let chth = Math.atan2(dy, dx);
			let th0 = mod2pi(ptI.rTh - chth);
			let th1 = mod2pi(chth - ptI1.lTh);
			let render = this.curve.render(th0, th1);
			for (let j = 0; j < render.length; j++) {
				let pt = render[j];
				let x = ptI.pt.x + dx * pt.x - dy * pt.y;
				let y = ptI.pt.y + dy * pt.x + dx * pt.y;
				path += `${cmd}${x} ${y}`;
				cmd = " ";
			}
			path += ` ${ptI1.pt.x} ${ptI1.pt.y}`;
		}
		return path;
	}
}

/// ControlPoint is a lot like `Knot` but has no UI, is used for spline solving.
class ControlPoint {
	constructor(pt, ty, th) {
		this.pt = pt;
		this.ty = ty;
		this.th = th;
	}
}
