// Copyright 2018 Raph Levien

//! UI for drawing splines

// TODO: create UI base class rather than cutting and pasting.
class Ui {
	constructor() {
		this.svgNS = "http://www.w3.org/2000/svg";
		this.setupHandlers();
		this.controlPts = [];
	}

	setupHandlers() {
		let svg = document.getElementById("s");

		svg.addEventListener("pointermove", e => this.mousemove(e));
		svg.addEventListener("pointerup", e => this.mouseup(e));
		svg.addEventListener("pointerdown", e => this.mousedown(e));
		this.mousehandler = null;
	}

	attachHandler(element, handler) {
		let svg = document.getElementById("s");
		element.addEventListener("pointerdown", e => {
			svg.setPointerCapture(e.pointerId);
			this.mousehandler = handler;
			e.stopPropagation();
		});
	}

	mousedown(e) {
		let svg = document.getElementById("s");
		svg.setPointerCapture(e.pointerId);
		this.addPoint(e.offsetX, e.offsetY);
		this.redraw();
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

	createSvgElement(tagName, isRaw = false) {
		let element = document.createElementNS(this.svgNS, tagName);
		if (!isRaw) {
			element.setAttribute("pointer-events", "none");
		}
		return element;
	}

	resetPlots() {
		let plots = document.getElementById("plots");
		while (plots.firstChild) {
			plots.removeChild(plots.firstChild);
		}
	}

	plotCircle(x, y, r = 2, color = "black", isRaw = false) {
		let circle = this.createSvgElement("circle", isRaw);
		circle.setAttribute("cx", x);
		circle.setAttribute("cy", y);
		circle.setAttribute("r", r);
		if (color !== null) {
			circle.setAttribute("fill", color);
		}
		document.getElementById("plots").appendChild(circle);
		return circle;
	}

	tangentMarker(x, y, th) {
		let len = 8;
		let dx = len * Math.cos(th);
		let dy = len * Math.sin(th);
		let line = this.createSvgElement("line");
		line.setAttribute("x1", x - dx);
		line.setAttribute("y1", y + dy);
		line.setAttribute("x2", x + dx);
		line.setAttribute("y2", y - dy);
		line.setAttribute("stroke", "green");
		document.getElementById("plots").appendChild(line);
	}

	redraw() {
		this.resetPlots();
		var path = "";
		var cmd = "M";
		for (let pt of this.controlPts) {
			path += `${cmd}${pt.x} ${pt.y}`;
			cmd = " L";
		}
		document.getElementById("ctrlpoly").setAttribute("d", path);

		let showMyCurve = true;
		let showBiParabola = true;
		let spline2Offset = 200;
		let nIter = 10;

		if (showMyCurve) {
			let spline = new TwoParamSpline(new MyCurve, this.controlPts);
			let ths = spline.initialThs();
			for (var i = 0; i < nIter; i++) {
				spline.iterDumb(i);
			}
			let splinePath = spline.renderSvg();
			document.getElementById("spline").setAttribute("d", splinePath);
		}

		if (showBiParabola) {
			var pts = [];
			for (var pt of this.controlPts) {
				pts.push(new Vec2(pt.x + spline2Offset, pt.y));
			}
			let spline2 = new TwoParamSpline(new BiParabola, pts);
			spline2.initialThs();
			for (var i = 0; i < nIter; i++) {
				let absErr = spline2.iterDumb(i);
				if (i == nIter - 1) {
					console.log(`biparabola err: ${absErr}`);
				}
			}
			let spline2Path = spline2.renderSvg();
			document.getElementById("spline2").setAttribute("d", spline2Path);
		}

		/*
		for (var i = 0; i < ths.length; i++) {
			let pt = this.controlPts[i]
			this.tangentMarker(pt.x, pt.y, -ths[i]);
		}
		*/
	}

	// TODO: extend so it can insert at an arbitrary location
	addPoint(x, y) {
		let ix = this.controlPts.length;
		this.controlPts.push(new Vec2(x, y));

		let handle = this.createSvgElement("circle", true);
		handle.setAttribute("cx", x);
		handle.setAttribute("cy", y);
		handle.setAttribute("r", 4);
		handle.setAttribute("class", "handle");
		document.getElementById("handles").appendChild(handle);
		this.attachHandler(handle, e => {
			this.movePoint(handle, ix, e.offsetX, e.offsetY);
		});
		this.mousehandler = e => this.movePoint(handle, ix, e.offsetX, e.offsetY);
	}

	movePoint(handle, ix, x, y) {
		handle.setAttribute("cx", x);
		handle.setAttribute("cy", y);
		this.controlPts[ix] = new Vec2(x, y);
		this.redraw();
	}
}

let ui = new Ui();
