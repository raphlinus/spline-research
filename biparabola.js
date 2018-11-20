let svgNS = "http://www.w3.org/2000/svg";

class Parabola {
	constructor(th, a) {
		this.th = th;
		this.a = a;
	}

	path_data(x0, y0, xscale, yscale) {
		let sth = Math.sin(this.th);
		let cth = Math.cos(this.th);
		let v = 1;
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

function plot(x, y, color = "black", r = 2) {
	let circle = document.createElementNS(svgNS, "circle");
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
	let line = document.createElementNS(svgNS, "line");
	line.setAttribute("x1", x - dx);
	line.setAttribute("y1", y + dy);
	line.setAttribute("x2", x + dx);
	line.setAttribute("y2", y - dy);
	line.setAttribute("stroke", "green");
	document.getElementById("plots").appendChild(line);
}

function solve_bisect(f, xmin = 0, xmax = 1) {
	let smin = Math.sign(f(xmin));
	if (smin == 0) { return xmin; }
	let smax = Math.sign(f(xmax));
	if (smax == 0) { return xmax; }
	if (smin == smax) {
		console.log("solve_bisect: doesn't straddle solution");
		return;
	}
	var x;
	for (var i = 0; i < 20; i++) {
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
		this.r_a = 2.0;

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
		let l_para = new Parabola(this.l_th, this.l_a);
		let left_par_data = l_para.path_data(this.x0, this.y0, this.chord, this.chord);
		document.getElementById("left_par").setAttribute("d", left_par_data);
		this.set_th_handle("left_th", 1, this.l_th);

		let r_para = new Parabola(this.r_th, this.r_a);
		let right_par_data = r_para.path_data(this.x0 + this.chord, this.y0, -this.chord, this.chord);
		document.getElementById("right_par").setAttribute("d", right_par_data);
		this.set_th_handle("right_th", -1, this.r_th);

		let plots = document.getElementById("plots");
		while (plots.firstChild) {
			plots.removeChild(plots.firstChild);
		}

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
