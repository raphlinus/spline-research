let svgNS = "http://www.w3.org/2000/svg";

class Parabola {
	constructor(th, a) {
		this.th = th;
		this.a = a;
	}

	path_data(x0, y0, xscale, yscale) {
		let sth = Math.sin(this.th);
		let cth = Math.cos(this.th);
		let v = Math.sign(this.a);
		let u = Math.sqrt(v / this.a);
		let x1 = x0 + xscale * (u * cth + v * sth);
		let y1 = y0 + yscale * (v * cth - u * sth);
		let x2 = x0 - xscale * v * sth;
		let y2 = y0 - yscale * v * cth;
		let x3 = x0 + xscale * (-u * cth + v * sth);
		let y3 = y0 + yscale * (v * cth + u * sth);
		return `M${x1} ${y1} Q${x2} ${y2} ${x3} ${y3}`;		
	}

	solve_t_given_x(x, branch) {
		let sth = Math.sin(this.th);
		let cth = Math.cos(this.th);
		return (-cth + branch * Math.sqrt(cth*cth + 4 * sth * this.a * x)) / (2 * sth * this.a);
	}

	compute_y_given_t(t) {
		return Math.sin(this.th) * t - Math.cos(this.th) * this.a * t * t;
	}

	compute_th_given_t(t) {
		return this.th - Math.atan(2 * t * this.a);
	}

	compute_k_given_t(t) {
		return this.a * Math.pow(1 + Math.pow(this.a * t, 2), -1.5);
	}
}

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

class QuadBez {
	constructor(x0, y0, x1, y1, x2, y2) {
		this.x0 = x0;
		this.y0 = y0;
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	eval(t) {
		let mt = 1 - t;
		let x = mt * mt * this.x0 + 2 * t * mt * this.x1 + t * t * this.x2;
		let y = mt * mt * this.y0 + 2 * t * mt * this.y1 + t * t * this.y2;
		return new Vec2(x, y);
	}

	deriv(t) {
		let x = (1 - t) * (this.x1 - this.x0) + t * (this.x2 - this.x1);
		let y = (1 - t) * (this.y1 - this.y0) + t * (this.y2 - this.y1);
		return new Vec2(x, y);
	}

	// could be hoisted to constructor
	deriv2() {
		let x = this.x0 - 2 * this.x1 + this.x2;
		let y = this.y0 - 2 * this.y1 + this.y2;
		return new Vec2(x, y);
	}

	curvature(t) {
		let d = this.deriv(t);
		let d2 = this.deriv2();
		return d.cross(d2) / Math.pow(d.norm(), 3);
	}

	path_data(x0, y0, scale) {
		let x1 = x0 + scale * this.x0;
		let y1 = y0 - scale * this.y0;
		let x2 = x0 + scale * this.x1;
		let y2 = y0 - scale * this.y1;
		let x3 = x0 + scale * this.x2;
		let y3 = y0 - scale * this.y2;
		return `M${x1} ${y1} Q${x2} ${y2} ${x3} ${y3}`;
	}
}

function createSvgElement(tagName) {
	let element = document.createElementNS(svgNS, tagName);
	element.setAttribute("pointer-events", "none");
	return element;
}

function plot(x, y, color = "black", r = 2) {
	let circle = createSvgElement("circle");
	circle.setAttribute("cx", x);
	circle.setAttribute("cy", y);
	circle.setAttribute("r", r);
	circle.setAttribute("fill", color)
	document.getElementById("plots").appendChild(circle);
}

function tangent_marker(x, y, th) {
	let len = 5;
	let dx = len * Math.cos(th);
	let dy = len * Math.sin(th);
	let line = createSvgElement("line");
	line.setAttribute("x1", x - dx);
	line.setAttribute("y1", y + dy);
	line.setAttribute("x2", x + dx);
	line.setAttribute("y2", y - dy);
	line.setAttribute("stroke", "green");
	document.getElementById("plots").appendChild(line);
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

// Solve a function returning a 2-vector using Newton method.
function solve2d(f, u_init, v_init) {
	var u = u_init;
	var v = v_init;
	let epsilon = 1e-8;
	for (var i = 0; i < 200; i++) {
		//console.log(u, v);
		let a = f(u, v);
		//console.log(`a=(${a.x}, ${a.y})`);
		let a_du = f(u + epsilon, v);
		let dxdu = (a_du.x - a.x) / epsilon;
		let dydu = (a_du.y - a.y) / epsilon;
		let a_dv = f(u, v + epsilon);
		let dxdv = (a_dv.x - a.x) / epsilon;
		let dydv = (a_dv.y - a.y) / epsilon;
		//console.log(`dxdu=${dxdu}, dydu=${dydu}, dxdv=${dxdv}, dydv=${dydv}`);
		let determ = dxdu * dydv - dydu * dxdv;
		let factor = 0.1;
		u -= factor * (a.x * dydv - a.y * dydu) / determ;
		v -= factor * (a.y * dxdu - a.x * dxdv) / determ;
	}
	return {u: u, v: v};
}

function solve2d_brute(f, umin, umax, vmin, vmax) {
	let n = 100;
	let e_best = 1e12;
	let u_best = null;
	let v_best = null;
	for (var i = 0; i <= n; i++) {
		u = umin + i / n * (umax - umin);
		for (var j = 0; j <= n; j++) {
			v = vmin + j / n * (vmax - vmin);
			let xy = f(u, v);
			let norm2 = xy.x * xy.x + xy.y * xy.y;
			if (norm2 < e_best) {
				e_best = norm2;
				u_best = u;
				v_best = v;
			}
		}
	}
	return {u: u_best, v: v_best};
}

function solve2d_hybrid(f, umin, umax, vmin, vmax) {
	let uv = solve2d_brute(f, umin, umax, vmin, vmax);
	plot(100 + 200 * uv.u, 200 - 200 * uv.v);
	return solve2d(f, uv.u, uv.v);
}

function make_two_quads(d0, d1, a0, a1, b) {
	let x1 = a0 * d0.x;
	let y1 = a0 * d0.y;
	let x3 = 1 + a1 * d1.x;
	let y3 = a1 * d1.y;
	let x2 = x1 + b * (x3 - x1);
	let y2 = y1 + b * (y3 - y1);
	let q0 = new QuadBez(0, 0, x1, y1, x2, y2);
	let q1 = new QuadBez(x2, y2, x3, y3, 1, 0);
	return {q0: q0, q1: q1};
}

function solve_quads_for_b(d0, d1, a0, a1) {
	return solve_bisect(b => {
		let quads = make_two_quads(d0, d1, a0, a1, b);
		let kl = quads.q0.curvature(1);
		let kr = quads.q1.curvature(0);
		return Math.abs(kl) - Math.abs(kr);
	}, 0.001, 0.999);
}

function solve_quads(th0, th1) {
	let d0 = new Vec2(Math.cos(th0), Math.sin(th0));
	let d1 = new Vec2(-Math.cos(th1), Math.sin(th1));
	let uv = solve2d_hybrid((u, v) => {
		let b = solve_quads_for_b(d0, d1, u, v);
		let quads = make_two_quads(d0, d1, u, v, b);
		let dot0 = quads.q0.deriv(0).dot(quads.q0.deriv2());
		let dot1 = quads.q1.deriv(1).dot(quads.q1.deriv2());
		return new Vec2(dot0, dot1);
	}, 0.01, 0.4, 0.01, 0.4);
	let b = solve_quads_for_b(d0, d1, uv.u, uv.v);
	console.log(`solve_quads soln ${uv.u} ${uv.v} ${b}`);
	let quads = make_two_quads(d0, d1, uv.u, uv.v, b);
	document.getElementById("left_qb").setAttribute("d", quads.q0.path_data(100, 300, 200));
	document.getElementById("right_qb").setAttribute("d", quads.q1.path_data(100, 300, 200));
	console.log(uv, b);
}

// Another attempt at solving, using the join point as the 2d parameter space

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

function solve_join(th0, th1) {
	let xy = solve2d((x, y) => {
		let k0 = calc_para_k(th0, x, y);
		let k1 = calc_para_k(th1, 1 - x, y);
		let v0 = calc_para_v(th0, x, y);
		let v1 = calc_para_v(th1, 1 - x, y);
		//console.log(x, y, k0, k1, v0, v1);
		let vcross = v0.x * v1.y + v0.y * v1.x;
		return new Vec2(Math.abs(k0) - Math.abs(k1), 10 * vcross);
	}, 0.5, 0);
	let a0 = calc_para_a(th0, xy.u, xy.v);
	let a1 = calc_para_a(th1, 1 - xy.u, xy.v);
	plot(100 + 200 * xy.u, 200 - 200 * xy.v);
	console.log(xy, a0, a1);
	return {a0: a0, a1: a1};
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
	plot(100 + 200 * x, 200 - 200 * y);
	return {a0: a0, a1: a1};
}

function visualize_err(th0, th1) {
	for (var i = 0; i <= 10; i++) {
		let x = i * .1;
		for (var j = -5; j <= 5; j++) {
			let y = j * .1;
			let v0 = calc_para_v(th0, x, y);
			let th = Math.atan2(v0.y, v0.x);
			tangent_marker(100 + 200 * x, 200 - 200 * y, th);

			let v1 = calc_para_v(th1, 1 - x, y);
			let th2 = Math.atan2(v1.y, -v1.x);
			tangent_marker(100 + 200 * x, 200 - 200 * y, th2);

			let k0 = calc_para_k(th0, x, y);
			let k1 = calc_para_k(th1, 1 - x, y);
			let ke = Math.abs(k0) - Math.abs(k1);
			if (!isNaN(ke)) {
				let r = Math.max(0, Math.min(15, Math.round(7 + 8 * ke)));
				let color = '#' + r.toString(16) + '77';
				plot(100 + 200 * x, 200 - 200 * y, color);
			}
		}
	}
}

let th = 0.1;
let a = 2.0;
let para = new Parabola(th, a);
let left_par_data = para.path_data(100, 200, 200, 200);
document.getElementById("left_par").setAttribute("d", left_par_data);

let rpara = new Parabola(0.9, 2.0);
let right_par_data = rpara.path_data(300, 200, -200, 200);
document.getElementById("right_par").setAttribute("d", right_par_data);

let x_equalk = solve_bisect(x => {
	let t0 = para.solve_t_given_x(x, 1);
	let k0 = para.compute_k_given_t(t0);
	let t1 = rpara.solve_t_given_x(1 - x, 1);
	let k1 = para.compute_k_given_t(t1);
	//console.log(`x=${x}, t0=${t0}, k0=${k0}, t1=${t1}, k1=${k1}`);
	return k0 - k1;
});
console.log(x_equalk);

class Ui {
	constructor() {
		// Initial values of UI-controller parameters.
		this.l_th = 0.7;
		this.l_a = 2.0;
		this.r_th = 0.9;
		this.r_a = 1.0;

		// Layout values.
		this.x0 = 100;
		this.y0 = 200;
		this.chord = 200;

		let svg = document.getElementById("s");
		svg.addEventListener("pointermove", e => this.mousemove(e));
		svg.addEventListener("pointerup", e => this.mouseup(e));
		this.mousehandler = null;

		this.attach_handler("left_th", this.left_th_handler);
		this.attach_handler("right_th", this.right_th_handler);
	}

	attach_handler(id, handler) {
		let element = document.getElementById(id);
		let svg = document.getElementById("s");
		element.addEventListener("pointerdown", e => {
			svg.setPointerCapture(e.pointerId);
			this.mousehandler = handler;
		});
	}

	mousemove(e) {
		if (this.mousehandler != null) {
			this.mousehandler(e);
		}
	}

	mouseup(e) {
		e.target.releasePointerCapture(e.pointerId);
		this.mousehandler = null;
	}

	left_th_handler(e) {
		let x = e.offsetX;
		let y = e.offsetY;
		this.l_th = Math.atan2(this.y0 - y, x - this.x0);
		this.redraw();
	}

	right_th_handler(e) {
		let x = e.offsetX;
		let y = e.offsetY;
		this.r_th = Math.atan2(this.y0 - y, this.x0 + this.chord - x);
		this.redraw();
	}

	redraw() {
		let plots = document.getElementById("plots");
		while (plots.firstChild) {
			plots.removeChild(plots.firstChild);
		}

		// The quad solver also kinda works, and sometimes finds solutions that the join-based
		// solver does not.
		//solve_quads(this.l_th, this.r_th);
		let vertex_ks = solve_join2(this.l_th, this.r_th);
		visualize_err(this.l_th, this.r_th);
		this.l_a = vertex_ks.a0;
		this.r_a = vertex_ks.a1;
		//this.calc_best();
		let l_para = new Parabola(this.l_th, this.l_a);
		let left_par_data = l_para.path_data(this.x0, this.y0, this.chord, this.chord);
		document.getElementById("left_par").setAttribute("d", left_par_data);
		this.set_th_handle("left_th", 1, this.l_th);

		let r_para = new Parabola(this.r_th, this.r_a);
		let right_par_data = r_para.path_data(this.x0 + this.chord, this.y0, -this.chord, this.chord);
		document.getElementById("right_par").setAttribute("d", right_par_data);
		this.set_th_handle("right_th", -1, this.r_th);

		/*
		for (var i = 0; i <= 10; i++) {
			let x = i / 10.0;
			let t = l_para.solve_t_given_x(x, 1);
			let y = l_para.compute_y_given_t(t);
			plot(this.x0 + x * this.chord, this.y0 - y * this.chord);
			let local_th = l_para.compute_th_given_t(t);
			tangent_marker(this.x0 + x * this.chord, this.y0 - y * this.chord, local_th);
			let k = l_para.compute_k_given_t(t);
			plot(this.x0 + x * this.chord, this.y0 + 150 - k * 50);
		}
		*/

	}

	calc_err(l_para, r_para) {
		let x = solve_bisect(x => {
			let t0 = l_para.solve_t_given_x(x, 1);
			let k0 = l_para.compute_k_given_t(t0);
			let t1 = r_para.solve_t_given_x(1 - x, 1);
			let k1 = r_para.compute_k_given_t(t1);
			//console.log(`x=${x}, t0=${t0}, k0=${k0}, t1=${t1}, k1=${k1}`);
			return k0 - k1;
		});
		let t0 = l_para.solve_t_given_x(x, 1);
		let y0 = l_para.compute_y_given_t(t0);
		let t1 = r_para.solve_t_given_x(1 - x, 1);
		let y1 = r_para.compute_y_given_t(t1);
		let dy = y1 - y0;
		//plot(this.x0 + x * this.chord, this.y0 - y0 * this.chord);
		//plot(this.x0 + x * this.chord, this.y0 - y1 * this.chord);
		let th0 = l_para.compute_th_given_t(t0);
		let th1 = r_para.compute_th_given_t(t1);
		return {y_err: dy, th_err: Math.sin(th0 + th1)};
	}

	calc_best() {
		var e_best = 1e12;
		var l_a_best = 0;
		var r_a_best = 0;
		for (var i = 0; i < 100; i++) {
			let l_a = i * 0.1;
			let l_para = new Parabola(this.l_th, l_a);
			for (var j = 0; j < 100; j++) {
				let r_a = j * 0.1;
				let r_para = new Parabola(this.r_th, r_a);
				let err = this.calc_err(l_para, r_para);
				let enorm = Math.pow(err.y_err, 2) + Math.pow(err.th_err, 2);
				if (enorm < e_best) {
					e_best = enorm;
					l_a_best = l_a;
					r_a_best = r_a;
				}
			}
		}
		this.l_a = l_a_best;
		this.r_a = r_a_best;
	}

	set_th_handle(id, xscale, th) {
		let x0 = this.x0 + 0.5 * this.chord * (1 - xscale);
		let g = document.getElementById(id);
		let dx = xscale * 50 * Math.cos(th);
		let dy = 50 * Math.sin(th);
		let line = g.firstChild.nextSibling;
		line.setAttribute("x2", x0 + dx);
		line.setAttribute("y2", this.y0 - dy);
		let circ = line.nextSibling.nextSibling;
		circ.setAttribute("cx", x0 + dx);
		circ.setAttribute("cy", this.y0 - dy);
	}
}

let ui = new Ui();
ui.redraw();
