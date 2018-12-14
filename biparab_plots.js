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

// Just the biparabola solver for the purpose of making curvature
// map plots (can be run from node).
// TODO: reorganize so it's not code duplication.

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

// Solve a 1d function using the bisection method.
// Not super fast but very stable.
function solve_bisect(f, xmin = 0, xmax = 1) {
	let smin = Math.sign(f(xmin));
	if (smin == 0) { return xmin; }
	let smax = Math.sign(f(xmax));
	if (smax == 0) { return xmax; }
	if (smin == smax) {
		//console.log("solve_bisect: doesn't straddle solution");
		return;
	}
	var x;
	for (var i = 0; i < 30; i++) {
		x = 0.5 * (xmin + xmax);
		let s = Math.sign(f(x));
		if (s == 0) { return x; }
		if (s == smin) {
			xmin = x;
		} else {
			xmax = x;
		}
	}
	return x;
}

// Calculate the curvature at the join point
function calc_para_k(th, x, y) {
	// reparameterize, parabola is v = a u^2
	let u = Math.cos(th) * x + Math.sin(th) * y;
	let v = Math.cos(th) * y - Math.sin(th) * x;
	return 2 * u * v * Math.pow(u * u + 4 * v * v, -1.5);
}

function calc_para_v(th, x, y) {
	let dot = Math.cos(th) * y - Math.sin(th) * x;
	let res_x = x - Math.sin(th) * dot;
	let res_y = y + Math.cos(th) * dot;
	return new Vec2(res_x, res_y);
}

// Calculate curvature at the vertex
function calc_para_a(th, x, y) {
	let u = Math.cos(th) * x + Math.sin(th) * y;
	let v = Math.cos(th) * y - Math.sin(th) * x;
	return -v / (u * u);
}

function calc_y_for_x_join(th0, th1, x) {
	return solve_bisect(y => {
		let v0 = calc_para_v(th0, x, y);
		let v1 = calc_para_v(th1, 1 - x, y);
		let vcross = v0.x * v1.y + v0.y * v1.x;
		return vcross;
	}, -0.5, 0.5);
}

function solve_join2(th0, th1) {
	let x = solve_bisect(x => {
		let y = calc_y_for_x_join(th0, th1, x);
		let k0 = calc_para_k(th0, x, y);
		let k1 = calc_para_k(th1, 1 - x, y);
		return Math.abs(k0) - Math.abs(k1);
	}, 1e-6, 1.0 - 1e-6);
	let y = calc_y_for_x_join(th0, th1, x);
	let a0 = calc_para_a(th0, x, y);
	let a1 = calc_para_a(th1, 1 - x, y);
	return {a0: a0, a1: a1};
}

function make_contour_data() {
	let n = 1000;
	for (var j = 0; j < n; j++) {
		let th1 = -Math.PI/2 + Math.PI * j / (n - 1);
		for (var i = 0; i < n; i++) {
			let th0 = -Math.PI/2 + Math.PI * i / (n - 1);
			let a01 = solve_join2(th0, th1);
			let z = Math.atan(a01.a0);
			console.log(`${th0} ${th1} ${z}`);
		}
		console.log('');
	}
}

make_contour_data();
