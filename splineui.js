// Copyright 2018 Raph Levien

//! UI for drawing splines

/// Fancy name for something that just detects double clicks, but might expand.
class GestureDet {
	constructor() {
		this.lastEv = null;
		this.clickCount = 0;
	}

	onPointerDown(ev) {
		let dblClickThreshold = 550; // ms
		let radiusThreshold = 5;
		if (this.lastEv !== null) {
			if (ev.timeStamp - this.lastEv.timeStamp > dblClickThreshold
				|| Math.hypot(ev.offsetX - this.lastEv.offsetX,
					ev.offsetY - this.lastEv.offsetY) > radiusThreshold) {
				this.clickCount = 0;
			}
		}
		this.lastEv = ev;
		this.clickCount++;
	}
}

/// State and UI for an editable spline
class SplineEdit {
	constructor(ui) {
		this.ui = ui;
		this.knots = [];
		this.selection = new Set();
	}

	setSelection(sel) {
		for (let obj of this.selection) {
			if (!sel.has(obj)) {
				obj.handleEl.classList.remove("selected");
			}
		}
		for (let obj of sel) {
			if (!this.selection.has(obj)) {
				obj.handleEl.classList.add("selected");
			}
		}
		this.selection = sel;
	}

	onPointerDown(ev, obj) {
		if (obj == null) {
			let knot = new Knot(this, ev.offsetX, ev.offsetY, "smooth");
			this.knots.push(knot);
			this.ui.attachReceiver(knot.handleEl, this, knot);
			// TODO: setter rather than state change?
			this.ui.receiver = this;
			this.setSelection(new Set([knot]));
		} else {
			if (this.ui.gestureDet.clickCount > 1) {
				obj.toggleTy();
			}
			var sel = new Set([obj]);
			if (ev.shiftKey || this.selection.has(obj)) {
				for (let a of this.selection) {
					sel.add(a);
				}
			}
			this.setSelection(sel);
			for (let knot of sel) {
				knot.mode = "dragging";
			}
		}
		this.lastPt = new Vec2(ev.offsetX, ev.offsetY);
	}

	onPointerMove(ev) {
		let pt = new Vec2(ev.offsetX, ev.offsetY);
		let dx = pt.x - this.lastPt.x;
		let dy = pt.y - this.lastPt.y;
		for (let knot of this.selection) {
			if (knot.mode === "dragging") {
				knot.updatePos(knot.x + dx, knot.y + dy);
			}
		}
		this.lastPt = pt;
	}
}

class Knot {
	/// ty is one of 'corner', 'smooth'.
	constructor(se, x, y, ty) {
		this.se = se;
		this.x = x;
		this.y = y;
		this.ty = ty;

		this.mode = "creating";
		this.handleEl = this.createHandleEl();
	}

	createHandleEl() {
		let handle = this.se.ui.createSvgElement("circle", true);
		handle.setAttribute("cx", this.x);
		handle.setAttribute("cy", this.y);
		handle.setAttribute("r", 4);
		handle.setAttribute("class", "handle");
		// TODO: handles group should probably be variable in ui
		document.getElementById("handles").appendChild(handle);
		return handle;
	}

	toggleTy() {
		let ty = this.ty === "corner" ? "smooth" : "corner";
		this.changeTy(ty);
	}

	changeTy(ty) {
		if (ty !== this.ty) {
			if (ty === "corner") {
				this.handleEl.classList.add("corner");
			} else {
				this.handleEl.classList.remove("corner");
			}
		}
		this.ty = ty;
	}

	updatePos(x, y) {
		this.x = x;
		this.y = y;
		this.handleEl.setAttribute("cx", x);
		this.handleEl.setAttribute("cy", y);
	}
}

// TODO: create UI base class rather than cutting and pasting.
class Ui {
	constructor() {
		this.svgNS = "http://www.w3.org/2000/svg";
		this.setupHandlers();
		this.controlPts = [];
		this.se = new SplineEdit(this);
		this.gestureDet = new GestureDet();
	}

	setupHandlers() {
		let svg = document.getElementById("s");

		svg.addEventListener("pointermove", e => this.pointerMove(e));
		svg.addEventListener("pointerup", e => this.pointerUp(e));
		svg.addEventListener("pointerdown", e => this.pointerDown(e));
		this.mousehandler = null;
		this.receiver = null;
	}

	attachHandler(element, handler) {
		let svg = document.getElementById("s");
		element.addEventListener("pointerdown", e => {
			svg.setPointerCapture(e.pointerId);
			this.mousehandler = handler;
			e.stopPropagation();
		});
	}

	/// This is the pattern for the new object-y style.

	// Maybe just rely on closures to capture obj?
	attachReceiver(element, receiver, obj) {
		let svg = document.getElementById("s");
		element.addEventListener("pointerdown", e => {
			this.gestureDet.onPointerDown(e);
			svg.setPointerCapture(e.pointerId);
			this.receiver = receiver;
			receiver.onPointerDown(e, obj);
			e.stopPropagation();
		});
	}

	pointerDown(e) {
		this.gestureDet.onPointerDown(e);
		let svg = document.getElementById("s");
		svg.setPointerCapture(e.pointerId);
		this.se.onPointerDown(e, null);
		//this.addPoint(e.offsetX, e.offsetY);
		//this.redraw();
	}

	pointerMove(e) {
		if (this.receiver !== null) {
			this.receiver.onPointerMove(e);
		} else if (this.mousehandler !== null) {
			this.mousehandler(e);
		}
	}

	pointerUp(e) {
		e.target.releasePointerCapture(e.pointerId);
		this.mousehandler = null;
		this.receiver = null;
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
