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
		svg.addEventListener("pointermove", e => this.mousemove(e));
		svg.addEventListener("pointerup", e => this.mouseup(e));
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
	}

	setRightHandle(x, y) {
		this.coords[4] = x;
		this.coords[5] = y;
		let el = document.getElementById("right_th");
		el.setAttribute("cx", x0 + 200 * x);
		el.setAttribute("cy", 200 - 200 * y);
	}

	map_handler(e) {
		let x = e.offsetX;
		let y = e.offsetY;
		let th0 = Math.PI * (x / 400 - 0.5);
		let th1 = Math.PI * (0.5 - y / 400);
		let arms = lookupArms(th0, th1);
		if (arms !== null) {
			this.setLeftHandle(Math.cos(th0) * arms.leftArm, Math.sin(th0) * arms.leftArm);
			this.setRightHandle(1 - Math.cos(th1) * arms.rightArm, Math.sin(th1) * arms.rightArm);

			this.redraw();
		}
	}

	redraw() {
		let th0 = Math.atan2(this.coords[3], this.coords[2]);
		let th1 = Math.atan2(this.coords[5], 1 - this.coords[4]);
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
		var s = 0;
		for (var i = 0; i <= 100; i++) {
			let t = 0.01 * i;
			let xy = cb.eval(t);
			s += Math.hypot(xy.x - last.x, xy.y - last.y);
			last = xy;
			let x = x0 + 200 * s;
			let k = cb.curvature(t);
			if (!isNaN(k)) {
				let scale = -0.05;
				let y = 300 - 200 * scale * k;
				path += `${cmd}${x} ${y}`;
				cmd = " L";
			}
		}
		document.getElementById("curv").setAttribute("d", path);
		document.getElementById("curv-base").setAttribute("x2", x0 + 200 * s);
	}
}

let ui = new Ui();
