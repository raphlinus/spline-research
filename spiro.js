// Copyright 2018 Raph Levien

/// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

// Various Euler spiral math adapted from spiro

function integ_spiro_12(k0, k1, k2, k3) {
	let t1_1 = k0;
	let t1_2 = .5 * k1;
	let t1_3 = (1./6) * k2;
	let t1_4 = (1./24) * k3;
	let t2_2 = t1_1 * t1_1;
	let t2_3 = 2 * (t1_1 * t1_2);
	let t2_4 = 2 * (t1_1 * t1_3) + t1_2 * t1_2;
	let t2_5 = 2 * (t1_1 * t1_4 + t1_2 * t1_3);
	let t2_6 = 2 * (t1_2 * t1_4) + t1_3 * t1_3;
	let t2_7 = 2 * (t1_3 * t1_4);
	let t2_8 = t1_4 * t1_4;
	let t3_4 = t2_2 * t1_2 + t2_3 * t1_1;
	let t3_6 = t2_2 * t1_4 + t2_3 * t1_3 + t2_4 * t1_2 + t2_5 * t1_1;
	let t3_8 = t2_4 * t1_4 + t2_5 * t1_3 + t2_6 * t1_2 + t2_7 * t1_1;
	let t3_10 = t2_6 * t1_4 + t2_7 * t1_3 + t2_8 * t1_2;
	let t4_4 = t2_2 * t2_2;
	let t4_5 = 2 * (t2_2 * t2_3);
	let t4_6 = 2 * (t2_2 * t2_4) + t2_3 * t2_3;
	let t4_7 = 2 * (t2_2 * t2_5 + t2_3 * t2_4);
	let t4_8 = 2 * (t2_2 * t2_6 + t2_3 * t2_5) + t2_4 * t2_4;
	let t4_9 = 2 * (t2_2 * t2_7 + t2_3 * t2_6 + t2_4 * t2_5);
	let t4_10 = 2 * (t2_2 * t2_8 + t2_3 * t2_7 + t2_4 * t2_6) + t2_5 * t2_5;
	let t5_6 = t4_4 * t1_2 + t4_5 * t1_1;
	let t5_8 = t4_4 * t1_4 + t4_5 * t1_3 + t4_6 * t1_2 + t4_7 * t1_1;
	let t5_10 = t4_6 * t1_4 + t4_7 * t1_3 + t4_8 * t1_2 + t4_9 * t1_1;
	let t6_6 = t4_4 * t2_2;
	let t6_7 = t4_4 * t2_3 + t4_5 * t2_2;
	let t6_8 = t4_4 * t2_4 + t4_5 * t2_3 + t4_6 * t2_2;
	let t6_9 = t4_4 * t2_5 + t4_5 * t2_4 + t4_6 * t2_3 + t4_7 * t2_2;
	let t6_10 = t4_4 * t2_6 + t4_5 * t2_5 + t4_6 * t2_4 + t4_7 * t2_3 + t4_8 * t2_2;
	let t7_8 = t6_6 * t1_2 + t6_7 * t1_1;
	let t7_10 = t6_6 * t1_4 + t6_7 * t1_3 + t6_8 * t1_2 + t6_9 * t1_1;
	let t8_8 = t6_6 * t2_2;
	let t8_9 = t6_6 * t2_3 + t6_7 * t2_2;
	let t8_10 = t6_6 * t2_4 + t6_7 * t2_3 + t6_8 * t2_2;
	let t9_10 = t8_8 * t1_2 + t8_9 * t1_1;
	let t10_10 = t8_8 * t2_2;
	let u = 1;
	u -= (1./24) * t2_2 + (1./160) * t2_4 + (1./896) * t2_6 + (1./4608) * t2_8;
	u += (1./1920) * t4_4 + (1./10752) * t4_6 + (1./55296) * t4_8 + (1./270336) * t4_10;
	u -= (1./322560) * t6_6 + (1./1658880) * t6_8 + (1./8110080) * t6_10;
	u += (1./92897280) * t8_8 + (1./454164480) * t8_10;
	u -= 2.4464949595157930e-11 * t10_10;
	let v = (1./12) * t1_2 + (1./80) * t1_4;
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

	let x = 0;
	let y = 0;
	let s = .5 * ds - .5;

	for (let i = 0; i < n; i++) {
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
		let est_err_raw = .2 * k0 * k0 + Math.abs(k1);
		if (est_err_raw < 1) {
			return integ_spiro_12(k0, k1, k2, k3);
		}
	}
	return integ_spiro_12n(k0, k1, k2, k3, 4);
}

function fit_euler(th0, th1) {
	let k1_old = 0;
	let error_old = th1 - th0;
	let k0 = th0 + th1;
	while (k0 > 2 * Math.PI) k0 -= 4 * Math.PI;
	while (k0 < -2 * Math.PI) k0 += 4 * Math.PI;
	let k1 = 6 * (1 - Math.pow((.5 / Math.PI) * k0, 3)) * error_old;
	let xy;
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
	let chord = Math.hypot(xy.u, xy.v);
	let chth = Math.atan2(xy.v, xy.u)
	return {k0: k0, k1: k1, chord: chord, chth: chth};
}

// This is adapted from spiro_seg_to_bpath in spiro.c
function render_spiro_rec(ks, x0, y0, x1, y1, result, depth) {
	let bend = Math.abs(ks[0]) + Math.abs(.5 * ks[1]) + Math.abs(.125 * ks[2]) +
		Math.abs((1./48) * ks[3]);

	let segCh = Math.hypot(x1 - x0, y1 - y0);
	let segTh = Math.atan2(y1 - y0, x1 - x0);
	let xy = integ_spiro(ks[0], ks[1], ks[2], ks[3]);
	let ch = Math.hypot(xy.u, xy.v);
	let th = Math.atan2(xy.v, xy.u);
	let scale = segCh / ch;
	let rot = segTh - th;
	if (depth > 5 || bend < 1.0) {
		let thEven = (1/384) * ks[3] + (1/8) * ks[1] + rot;
		let thOdd = (1/48) * ks[2] + 0.5 * ks[0];
		let ul = (scale * (1/3)) * Math.cos(thEven - thOdd);
		let vl = (scale * (1/3)) * Math.sin(thEven - thOdd);
		let ur = (scale * (1/3)) * Math.cos(thEven + thOdd);
		let vr = (scale * (1/3)) * Math.sin(thEven + thOdd);
		result.push(new Vec2(x0 + ul, y0 + vl));
		result.push(new Vec2(x1 - ur, y1 - vr));
	} else {
		// Recursively subdivide
		let ksub = [
			.5 * ks[0] - .125 * ks[1] + (1./64) * ks[2] - (1./768) * ks[3],
			.25 * ks[1] - (1./16) * ks[2] + (1./128) * ks[3],
			.125 * ks[2] - (1./32) * ks[3],
			(1./16) * ks[3]
		];
		let thsub = rot - .25 * ks[0] + (1./32) * ks[1] - (1./384) * ks[2] + (1./6144) * ks[3];
		let cth = 0.5 * scale * Math.cos(thsub);
		let sth = 0.5 * scale * Math.sin(thsub);
		let xysub = integ_spiro(ksub[0], ksub[1], ksub[2], ksub[3]);
		let xmid = x0 + cth * xysub.u - sth * xysub.v;
		let ymid = y0 + cth * xysub.v + sth * xysub.u;
		render_spiro_rec(ksub, x0, y0, xmid, ymid, result, depth + 1);
		result.push(new Vec2(xmid, ymid));
		ksub[0] += 0.25 * ks[1] + (1/384) * ks[3];
		ksub[1] += 0.125 * ks[2];
		ksub[2] += (1/16) * ks[3];
		render_spiro_rec(ksub, xmid, ymid, x1, y1, result, depth + 1);
	}
}


// Adapted from https://stackoverflow.com/questions/1148309/inverting-a-4x4-matrix
function inv4x4(m) {
	let A2323 = m[10] * m[15] - m[11] * m[14];
	let A1323 = m[ 9] * m[15] - m[11] * m[13];
	let A1223 = m[ 9] * m[14] - m[10] * m[13];
	let A0323 = m[ 8] * m[15] - m[11] * m[12];
	let A0223 = m[ 8] * m[14] - m[10] * m[12];
	let A0123 = m[ 8] * m[13] - m[ 9] * m[12];
	let A2313 = m[ 6] * m[15] - m[ 7] * m[14];
	let A1313 = m[ 5] * m[15] - m[ 7] * m[13];
	let A1213 = m[ 5] * m[14] - m[ 6] * m[13];
	let A2312 = m[ 6] * m[11] - m[ 7] * m[10];
	let A1312 = m[ 5] * m[11] - m[ 7] * m[ 9];
	let A1212 = m[ 5] * m[10] - m[ 6] * m[ 9];
	let A0313 = m[ 4] * m[15] - m[ 7] * m[12];
	let A0213 = m[ 4] * m[14] - m[ 6] * m[12];
	let A0312 = m[ 4] * m[11] - m[ 7] * m[ 8];
	let A0212 = m[ 4] * m[10] - m[ 6] * m[ 8];
	let A0113 = m[ 4] * m[13] - m[ 5] * m[12];
	let A0112 = m[ 4] * m[ 9] - m[ 5] * m[ 8];

	let det = m[ 0] * ( m[ 5] * A2323 - m[ 6] * A1323 + m[ 7] * A1223 ) 
    	- m[ 1] * ( m[ 4] * A2323 - m[ 6] * A0323 + m[ 7] * A0223 ) 
    	+ m[ 2] * ( m[ 4] * A1323 - m[ 5] * A0323 + m[ 7] * A0123 ) 
    	- m[ 3] * ( m[ 4] * A1223 - m[ 5] * A0223 + m[ 6] * A0123 );
	det = 1 / det;

	let r = new Float64Array(16);
	r[ 0] = det *   ( m[ 5] * A2323 - m[ 6] * A1323 + m[ 7] * A1223 );
	r[ 1] = det * - ( m[ 1] * A2323 - m[ 2] * A1323 + m[ 3] * A1223 );
	r[ 2] = det *   ( m[ 1] * A2313 - m[ 2] * A1313 + m[ 3] * A1213 );
	r[ 3] = det * - ( m[ 1] * A2312 - m[ 2] * A1312 + m[ 3] * A1212 );
	r[ 4] = det * - ( m[ 4] * A2323 - m[ 6] * A0323 + m[ 7] * A0223 );
	r[ 5] = det *   ( m[ 0] * A2323 - m[ 2] * A0323 + m[ 3] * A0223 );
	r[ 6] = det * - ( m[ 0] * A2313 - m[ 2] * A0313 + m[ 3] * A0213 );
	r[ 7] = det *   ( m[ 0] * A2312 - m[ 2] * A0312 + m[ 3] * A0212 );
	r[ 8] = det *   ( m[ 4] * A1323 - m[ 5] * A0323 + m[ 7] * A0123 );
	r[ 9] = det * - ( m[ 0] * A1323 - m[ 1] * A0323 + m[ 3] * A0123 );
	r[10] = det *   ( m[ 0] * A1313 - m[ 1] * A0313 + m[ 3] * A0113 );
	r[11] = det * - ( m[ 0] * A1312 - m[ 1] * A0312 + m[ 3] * A0112 );
	r[12] = det * - ( m[ 4] * A1223 - m[ 5] * A0223 + m[ 6] * A0123 );
	r[13] = det *   ( m[ 0] * A1223 - m[ 1] * A0223 + m[ 2] * A0123 );
	r[14] = det * - ( m[ 0] * A1213 - m[ 1] * A0213 + m[ 2] * A0113 );
	r[15] = det *   ( m[ 0] * A1212 - m[ 1] * A0212 + m[ 2] * A0112 );
	return r;
};

function compute_spiro_ends(ks) {
	let result = new Float64Array(4);
	let xy = integ_spiro(ks[0], ks[1], ks[2], ks[3]);
	let ch = Math.hypot(xy.u, xy.v);
	let th = Math.atan2(xy.v, xy.u);
	let thEven = 0.5 * ks[0] + (1/48) * ks[2];
	let thOdd = 0.124 * ks[1] + (1/384) * ks[3] - th;
	result[0] = thEven - thOdd;
	result[1] = thEven + thOdd;
	let kEven = ch * (ks[0] + 0.125 * ks[2]);
	let kOdd = ch * (0.5 * ks[1] + (1/48) * ks[3]);
	result[2] = kEven - kOdd;
	result[3] = kEven + kOdd;
	return result;
}

// Should be inverse of compute_spiro_ends
function solve_spiro_ends(ends) {
	let ks = new Float64Array(4);
	let m = new Float64Array(16);
	let delta = 1e-6;
	let nIter = 3;
	for (let iter = 0; iter < nIter; iter++) {
		let ends0 = compute_spiro_ends(ks);
		// TODO: compute error norm and bail on success
		for (let i = 0; i < 4; i++) {
			let ks1 = new Float64Array(ks);
			ks1[i] += delta;
			let ends1 = compute_spiro_ends(ks1);
			for (let j = 0; j < 4; j++) {
				m[i * 4 + j] = (ends1[j] - ends0[j]) * (1/delta);
			}
		}
		let inv = inv4x4(m);
		for (let i = 0; i < 16; i++) {
			ks[i & 3] += (ends[i >> 2] - ends0[i >> 2]) * inv[i];
		}
	}
	return ks;
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

	kEndpoints() {
		let k0 = (this.params.k0 - 0.5 * this.params.k1) * this.params.chord;
		let k1 = (this.params.k0 + 0.5 * this.params.k1) * this.params.chord;
		return {k0: k0, k1: k1};
	}

	renderSvg(x0, y0, s) {
		let path = `M${x0} ${y0}`;
		let n = 5;
		let d = 1. / (n * 3 * this.params.chord);
		for (let i = 0; i < n; i++) {
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

class SpiroCurve extends TwoParamCurve {
	computeCurvature(th0, th1) {
		let seg = new EulerSegment(th0, th1);
		let kEndpoints = seg.kEndpoints();
		let ak0 = Math.atan(kEndpoints.k0);
		let ak1 = Math.atan(kEndpoints.k1);
		return {ak0: ak0, ak1: ak1};
	}

	endpointTangent(th) {
		return th;
	}

	render(th0, th1) {
		let seg = new EulerSegment(th0, th1);
		let result = [];
		let ks = [-seg.params.k0, -seg.params.k1, 0, 0];
		render_spiro_rec(ks, 0, 0, 1, 0, result, 0);
		return result;
	}

	render4(th0, th1, k0, k1) {
		if (k0 === null || k1 === null) {
			let seg = new EulerSegment(th0, th1);
			let kEndpoints = seg.kEndpoints();
			if (k0 === null) {
				k0 = kEndpoints.k0;
			}
			if (k1 === null) {
				k1 = kEndpoints.k1;
			}
		}
		let ends = new Float64Array([-th0, -th1, -k0, -k1]);
		let ks = solve_spiro_ends(ends);
		let result = [];
		render_spiro_rec(ks, 0, 0, 1, 0, result, 0);
		return result;
	}
}

function makeCurvatureMap(curve) {
	let n = 100;
	for (let j = 0; j < n; j++) {
		let th1 = -Math.PI/2 + Math.PI * j / (n - 1);
		for (let i = 0; i < n; i++) {
			let th0 = -Math.PI/2 + Math.PI * i / (n - 1);
			let euler = new EulerSegment(th0, th1);
			let kEndpoints = euler.kEndpoints();
			console.log(`${th0} ${th1} ${kEndpoints.k0}`);
		}
		console.log('');
	}
}

//makeCurvatureMap();
