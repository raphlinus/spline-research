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

//! Explorer for optimized Euler spiral to bezier conversion.

/// Polyfill for working around ancient browsers that don't support pointer events.
let hasPointerEvent = 'PointerEvent' in window;
let pointerName = hasPointerEvent ? 'pointer' : 'mouse';

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

// Various Euler spiral math adapted from spiro

function integ_spiro_12(k0, k1, k2, k3) {
	var t1_1 = k0;
	var t1_2 = .5 * k1;
	var t1_3 = (1./6) * k2;
	var t1_4 = (1./24) * k3;
	var t2_2 = t1_1 * t1_1;
	var t2_3 = 2 * (t1_1 * t1_2);
	var t2_4 = 2 * (t1_1 * t1_3) + t1_2 * t1_2;
	var t2_5 = 2 * (t1_1 * t1_4 + t1_2 * t1_3);
	var t2_6 = 2 * (t1_2 * t1_4) + t1_3 * t1_3;
	var t2_7 = 2 * (t1_3 * t1_4);
	var t2_8 = t1_4 * t1_4;
	var t3_4 = t2_2 * t1_2 + t2_3 * t1_1;
	var t3_6 = t2_2 * t1_4 + t2_3 * t1_3 + t2_4 * t1_2 + t2_5 * t1_1;
	var t3_8 = t2_4 * t1_4 + t2_5 * t1_3 + t2_6 * t1_2 + t2_7 * t1_1;
	var t3_10 = t2_6 * t1_4 + t2_7 * t1_3 + t2_8 * t1_2;
	var t4_4 = t2_2 * t2_2;
	var t4_5 = 2 * (t2_2 * t2_3);
	var t4_6 = 2 * (t2_2 * t2_4) + t2_3 * t2_3;
	var t4_7 = 2 * (t2_2 * t2_5 + t2_3 * t2_4);
	var t4_8 = 2 * (t2_2 * t2_6 + t2_3 * t2_5) + t2_4 * t2_4;
	var t4_9 = 2 * (t2_2 * t2_7 + t2_3 * t2_6 + t2_4 * t2_5);
	var t4_10 = 2 * (t2_2 * t2_8 + t2_3 * t2_7 + t2_4 * t2_6) + t2_5 * t2_5;
	var t5_6 = t4_4 * t1_2 + t4_5 * t1_1;
	var t5_8 = t4_4 * t1_4 + t4_5 * t1_3 + t4_6 * t1_2 + t4_7 * t1_1;
	var t5_10 = t4_6 * t1_4 + t4_7 * t1_3 + t4_8 * t1_2 + t4_9 * t1_1;
	var t6_6 = t4_4 * t2_2;
	var t6_7 = t4_4 * t2_3 + t4_5 * t2_2;
	var t6_8 = t4_4 * t2_4 + t4_5 * t2_3 + t4_6 * t2_2;
	var t6_9 = t4_4 * t2_5 + t4_5 * t2_4 + t4_6 * t2_3 + t4_7 * t2_2;
	var t6_10 = t4_4 * t2_6 + t4_5 * t2_5 + t4_6 * t2_4 + t4_7 * t2_3 + t4_8 * t2_2;
	var t7_8 = t6_6 * t1_2 + t6_7 * t1_1;
	var t7_10 = t6_6 * t1_4 + t6_7 * t1_3 + t6_8 * t1_2 + t6_9 * t1_1;
	var t8_8 = t6_6 * t2_2;
	var t8_9 = t6_6 * t2_3 + t6_7 * t2_2;
	var t8_10 = t6_6 * t2_4 + t6_7 * t2_3 + t6_8 * t2_2;
	var t9_10 = t8_8 * t1_2 + t8_9 * t1_1;
	var t10_10 = t8_8 * t2_2;
	var u = 1;
	u -= (1./24) * t2_2 + (1./160) * t2_4 + (1./896) * t2_6 + (1./4608) * t2_8;
	u += (1./1920) * t4_4 + (1./10752) * t4_6 + (1./55296) * t4_8 + (1./270336) * t4_10;
	u -= (1./322560) * t6_6 + (1./1658880) * t6_8 + (1./8110080) * t6_10;
	u += (1./92897280) * t8_8 + (1./454164480) * t8_10;
	u -= 2.4464949595157930e-11 * t10_10;
	var v = (1./12) * t1_2 + (1./80) * t1_4;
	v -= (1./480) * t3_4 + (1./2688) * t3_6 + (1./13824) * t3_8 + (1./67584) * t3_10;
	v += (1./53760) * t5_6 + (1./276480) * t5_8 + (1./1351680) * t5_10;
	v -= (1./11612160) * t7_8 + (1./56770560) * t7_10;
	v += 2.4464949595157932e-10 * t9_10;
	return {u: u, v: v};
}

function integ_spiro_12n(k0, k1, k2, k3, n) {
	let th1 = k0;
	let th2 = .5 * k1;
	let th3 = (1./6) * k2;
	let th4 = (1./24) * k3;
	let ds = 1. / n;
	let ds2 = ds * ds;
	let ds3 = ds2 * ds;

	k0 *= ds;
	k1 *= ds;
	k2 *= ds;
	k3 *= ds;

	var x = 0;
	var y = 0;
	var s = .5 * ds - .5;

	for (var i = 0; i < n; i++) {
		let km0 = (((1./6) * k3 * s + .5 * k2) * s + k1) * s + k0;
		let km1 = ((.5 * k3 * s + k2) * s + k1) * ds;
		let km2 = (k3 * s + k2) * ds2;
		let km3 = k3 * ds3;

		let uv = integ_spiro_12(km0, km1, km2, km3);
		let u = uv.u;
		let v = uv.v;

		let th = (((th4 * s + th3) * s + th2) * s + th1) * s;
		let cth = Math.cos(th);
		let sth = Math.sin(th);

		x += cth * u - sth * v;
		y += cth * v + sth * u;
		s += ds;
	}
	return {u: x * ds, v: y * ds};
}

// This function is tuned to give an accuracy within 1e-9.
function integ_spiro(k0, k1, k2, k3) {
	if (k2 == 0 && k3 == 0) {
		// Euler spiral
		var est_err_raw = .2 * k0 * k0 + Math.abs(k1);
		if (est_err_raw < 1) {
			return integ_spiro_12(k0, k1, k2, k3);
		}
	}
	return integ_spiro_12n(k0, k1, k2, k3, 4);
}

function fit_euler(th0, th1) {
	var k1_old = 0;
	var error_old = th1 - th0;
	var k0 = th0 + th1;
	while (k0 > 2 * Math.PI) k0 -= 4 * Math.PI;
	while (k0 < -2 * Math.PI) k0 += 4 * Math.PI;
	var k1 = 6 * (1 - Math.pow((.5 / Math.PI) * k0, 3)) * error_old;
	var xy;
	for (var i = 0; i < 10; i++) {
		xy = integ_spiro(k0, k1, 0, 0);
		let error = (th1 - th0) - (.25 * k1 - 2 * Math.atan2(xy.v, xy.u));
		if (Math.abs(error) < 1e-9) break;
		let new_k1 = k1 + (k1_old - k1) * error / (error - error_old);
		k1_old = k1;
		error_old = error;
		k1 = new_k1;
	}
	if (i == 10) {
		throw "fit_euler diverges at " + th0 + ", " + th1;
	}
	var chord = Math.hypot(xy.u, xy.v);
	var chth = Math.atan2(xy.v, xy.u)
	return {k0: k0, k1: k1, chord: chord, chth: chth};
}

class EulerSegment {
	constructor(th0, th1) {
		this.params = fit_euler(th0, th1);
		this.thmid = 0.5 * this.params.k0 - 0.125 * this.params.k1 - th0;
	}

	th(t) {
		let u = t - 0.5;
		// Maybe sign of following is wrong; this is confusing. But it matches spiro code.
		return this.thmid + (0.5 * this.params.k1 * u + this.params.k0) * u;
	}

	// Param t in [0, 1]. Return value assumes chord (0, 0) - (1, 0)
	xy(t) {
		let thm = this.th(t * 0.5);
		let k0 = this.params.k0;
		let k1 = this.params.k1;
		let uv = integ_spiro((k0 + k1 * 0.5 * (t - 1)) * t, k1 * t * t, 0, 0);
		let s = t / this.params.chord * Math.sin(thm);
		let c = t / this.params.chord * Math.cos(thm);
		let x = uv.u * c - uv.v * s;
		let y = -uv.v * c - uv.u * s;
		return new Vec2(x, y);
	}

	renderSvg(x0, y0, s) {
		var path = `M${x0} ${y0}`;
		let n = 5;
		let d = 1. / (n * 3 * this.params.chord);
		for (var i = 0; i < n; i++) {
			let t = i / n;
			let xy0 = this.xy(t);
			let xy1 = this.xy(t + 1/n);
			let th0 = this.th(t);
			let th1 = this.th(t + 1/n);
			let x1 = xy0.x + d * Math.cos(th0);
			let y1 = xy0.y - d * Math.sin(th0);
			let x2 = xy1.x - d * Math.cos(th1);
			let y2 = xy1.y + d * Math.sin(th1);
			let x3 = xy1.x;
			let y3 = xy1.y;
			path += ` C${x0 + s * x1} ${y0 - s * y1}`;
			path += ` ${x0 + s * x2} ${y0 - s * y2}`;
			path += ` ${x0 + s * x3} ${y0 - s * y3}`;
		}
		return path;
	}
}

let x0 = 500;

function lookupArms(th0, th1) {
	if (th0 < 0) {
		th0 = -th0;
		th1 = -th1;
	}
	let j = Math.round(rawDataN * (th0 / Math.PI));
	let i = Math.round(rawDataN * (0.5 + th1 / Math.PI));
	if (i < 0 || i >= rawDataN || j < 0 || j >= rawDataN/2) {
		return null;
	}
	let leftArm = rawData[j * rawDataN + i];
	let rightArm = rawData[j * rawDataN + i + rawDataN * rawDataN / 2];
	return {leftArm: leftArm, rightArm: rightArm};
}

class Ui {
	constructor() {
		let svg = document.getElementById("s");
		svg.addEventListener(pointerName + "move", e => this.mousemove(e));
		svg.addEventListener(pointerName + "up", e => this.mouseup(e));
		this.mousehandler = null;

		this.attach_handler("map", this.map_handler);

		this.attach_handler("left_th", this.left_th_handler);
		this.attach_handler("right_th", this.right_th_handler);

		this.coords = new Float64Array(8);
		this.coords[4] = 1;
		this.coords[6] = 1;
	}

	attach_handler(id, handler) {
		let element = document.getElementById(id);
		let svg = document.getElementById("s");
		element.addEventListener(pointerName + "down", e => {
			if (hasPointerEvent) {
				// TODO: is there some way to get reasonably good mouse capture if
				// pointer events are not supported?
				svg.setPointerCapture(e.pointerId);
			}
			this.mousehandler = handler;
			e.preventDefault();
		});
	}

	mousemove(e) {
		if (this.mousehandler != null) {
			this.mousehandler(e);
		}
		e.preventDefault();
	}

	mouseup(e) {
		if (hasPointerEvent) {
			e.target.releasePointerCapture(e.pointerId);
		}
		this.mousehandler = null;
		e.preventDefault();
	}

	left_th_handler(e) {
		let x = e.offsetX;
		let y = e.offsetY;
		this.setLeftHandle((x - x0) / 200, (200 - y) / 200);

		this.redraw();
	}

	right_th_handler(e) {
		let x = e.offsetX;
		let y = e.offsetY;
		this.setRightHandle((x - x0) / 200, (200 - y) / 200);

		this.redraw();
	}

	setLeftHandle(x, y) {
		this.coords[2] = x;
		this.coords[3] = y;
		let el = document.getElementById("left_th");
		el.setAttribute("cx", x0 + 200 * x);
		el.setAttribute("cy", 200 - 200 * y);
		let arm = document.getElementById("left_arm");
		arm.setAttribute("x2", x0 + 200 * x);
		arm.setAttribute("y2", 200 - 200 * y);
	}

	setRightHandle(x, y) {
		this.coords[4] = x;
		this.coords[5] = y;
		let el = document.getElementById("right_th");
		el.setAttribute("cx", x0 + 200 * x);
		el.setAttribute("cy", 200 - 200 * y);
		let arm = document.getElementById("right_arm");
		arm.setAttribute("x2", x0 + 200 * x);
		arm.setAttribute("y2", 200 - 200 * y);
	}

	map_handler(e) {
		let x = e.offsetX;
		let y = e.offsetY;
		this.th0 = Math.PI * (x / 400 - 0.5);
		this.th1 = Math.PI * (0.5 - y / 400);
		let arms = lookupArms(this.th0, this.th1);
		if (arms !== null) {
			this.setLeftHandle(Math.cos(this.th0) * arms.leftArm,
				Math.sin(this.th0) * arms.leftArm);
			this.setRightHandle(1 - Math.cos(this.th1) * arms.rightArm,
				Math.sin(this.th1) * arms.rightArm);

			this.redraw();
		}
	}

	redraw() {
		let th0 = this.th0;
		let th1 = this.th1;
		let coords = this.coords;

		// Draw the bezier
		var path = "";
		for (var i = 0; i < 4; i ++) {
			let x = x0 + 200 * coords[i * 2];
			let y = 200 - 200 * coords[i * 2 + 1];
			let cmd = ['M', ' C', ' ', ' '][i];
			path += `${cmd}${x} ${y}`;
		}
		document.getElementById("bez").setAttribute("d", path);

		// Draw the graph of curvature vs arclength.
		let cb = new CubicBez(coords);
		path = "";
		var cmd = "M";
		var last = new Vec2(0, 0);
		let fudge = 1e-3;
		var s = fudge;
		let n = 100;
		let dt = (1 - 2 * fudge) / n;
		let kScale = -0.05;
		for (var i = 0; i <= n; i++) {
			let t = fudge + dt * i;
			let xy = cb.eval(t);
			s += Math.hypot(xy.x - last.x, xy.y - last.y);
			last = xy;
			let x = x0 + 200 * s;
			let k = cb.curvature(t);
			if (!isNaN(k)) {
				let y = 300 - 200 * kScale * k;
				path += `${cmd}${x} ${y}`;
				cmd = " L";
			}
		}
		document.getElementById("curv").setAttribute("d", path);
		document.getElementById("curv-base").setAttribute("x2", x0 + 200 * s);

		if (th0 === undefined || th1 === undefined) {
			return;
		}
		// Draw the accurate Euler spiral
		let euler = new EulerSegment(th0, th1);
		// Compute t parameter of center point.
		//let t = euler.params.k0 / Math.sqrt(2 * Math.abs(euler.params.k1));
		let eulerPath = euler.renderSvg(500, 200, 200);
		document.getElementById("euler").setAttribute("d", eulerPath);

		// Draw the Euler curvature plot
		let k0 = (euler.params.k0 - 0.5 * euler.params.k1) * euler.params.chord;
		let k1 = (euler.params.k0 + 0.5 * euler.params.k1) * euler.params.chord;
		var ekPath = `M${x0} ${300 + 200 * kScale * k0}`;
		ekPath += ` L${x0 + 200 * s} ${300 + 200 * kScale * k1}`;
		document.getElementById("euler-curv").setAttribute("d", ekPath);
	}
}

let ui = new Ui();
