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

//! A simple interactive visualizer for 2-parameter spline curves based
//! on cubic Beziers.

class Ui {
	constructor() {
		let svg = document.getElementById("s");
		svg.addEventListener("pointermove", e => this.mousemove(e));
		svg.addEventListener("pointerup", e => this.mouseup(e));
		this.mousehandler = null;

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
		this.coords[2] = (x - 100) / 200;
		this.coords[3] = (200 - y) / 200;
		let el = document.getElementById("left_th");
		el.setAttribute("cx", x);
		el.setAttribute("cy", y);

		this.redraw();
	}

	right_th_handler(e) {
		let x = e.offsetX;
		let y = e.offsetY;
		this.coords[4] = (x - 100) / 200;
		this.coords[5] = (200 - y) / 200;
		let el = document.getElementById("right_th");
		el.setAttribute("cx", x);
		el.setAttribute("cy", y);

		this.redraw();
	}

	redraw() {
		let th0 = Math.atan2(this.coords[3], this.coords[2]);
		let th1 = Math.atan2(this.coords[5], 1 - this.coords[4]);
		//let coords = this.coords;
		let coords = myCubic(th0, th1);

		// Draw the bezier
		var path = "";
		for (var i = 0; i < 4; i ++) {
			let x = 100 + 200 * coords[i * 2];
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
			let x = 100 + 200 * s;
			let k = cb.curvature(t);
			if (!isNaN(k)) {
				let scale = -0.05;
				let y = 300 - 200 * scale * k;
				path += `${cmd}${x} ${y}`;
				cmd = " L";
			}
		}
		document.getElementById("curv").setAttribute("d", path);
		document.getElementById("curv-base").setAttribute("x2", 100 + 200 * s);
	}
}

let ui = new Ui();
