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
}

function plot(x, y) {
	let circle = document.createElementNS(svgNS, "circle");
	circle.setAttribute("cx", x);
	circle.setAttribute("cy", y);
	circle.setAttribute("r", 2);
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

let th = 0.7;
let a = 1.0;
let para = new Parabola(th, a);
let left_par_data = para.path_data(100, 200, 200, 200);
document.getElementById("left_par").setAttribute("d", left_par_data);

for (var i = 0; i <= 10; i++) {
	let x = i / 10.0;
	let t = para.solve_t_given_x(x, 1);
	console.log(x, t);
	let y = para.compute_y_given_t(t);
	plot(100 + x * 200, 200 - y * 200);
	let local_th = para.compute_th_given_t(t);
	tangent_marker(100 + x * 200, 200 - y * 200, local_th);
}

let rpara = new Parabola(0.9, 2.0);
let right_par_data = rpara.path_data(300, 200, -200, 200);
document.getElementById("right_par").setAttribute("d", right_par_data);
