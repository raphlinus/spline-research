// Copyright 2018 Raph Levien

//! UI for drawing splines

/// Fancy name for something that just detects double clicks, but might expand.
class GestureDet {
	constructor(ui) {
		this.ui = ui;
		this.lastEv = null;
		this.lastPt = null;
		this.clickCount = 0;
	}

	onPointerDown(ev) {
		let dblClickThreshold = 550; // ms
		let radiusThreshold = 5;
		let pt = this.ui.getCoords(ev);
		if (this.lastEv !== null) {
			if (ev.timeStamp - this.lastEv.timeStamp > dblClickThreshold
				|| Math.hypot(pt.x - this.lastPt.x, pt.y - this.lastPt.y) > radiusThreshold) {
				this.clickCount = 0;
			}
		}
		this.lastEv = ev;
		this.lastPt = pt;
		this.clickCount++;
	}
}

// Dimensions of the tangent target
let tanR1 = 5;
let tanR2 = 15;
let tanR3 = 20;

/// State and UI for an editable spline
class SplineEdit {
	constructor(ui) {
		this.ui = ui;
		this.knots = [];
		this.selection = new Set();
		this.mode = "start";
		this.toSmooth = false;
	}

	setSelection(sel) {
		for (let obj of this.selection) {
			if (!sel.has(obj)) {
				obj.handleEl.classList.remove("selected");
				obj.removeTanTarget();
				obj.removeTanHandle();
			}
		}
		for (let obj of sel) {
			if (!this.selection.has(obj)) {
				obj.handleEl.classList.add("selected");
				if (this.mode === "dragging") {
					obj.addTanHandle();
				}
			}
		}
		this.selection = sel;
	}

	onPointerDown(ev, obj) {
		let pt = this.ui.getCoords(ev);
		if (obj === null) {
			let knot = new Knot(this, pt.x, pt.y, "corner");
			this.knots.push(knot);
			this.ui.attachReceiver(knot.handleEl, this, knot);
			// TODO: setter rather than state change?
			this.ui.receiver = this;
			this.setSelection(new Set([knot]));
			knot.addTanTarget();
			this.mode = "creating";
			this.initPt = pt;
		} else if (obj instanceof TanHandle) {
			obj.knot.removeTanHandle();
			this.mode = "tanhandle";
			// This suggests maybe we should use selected point, not initPt
			this.initPt = new Vec2(obj.knot.x, obj.knot.y);
			this.setSelection(new Set([obj.knot]));
			obj.knot.addTanTarget();
			obj.knot.setTan(obj.knot.th, tanR3);
		} else {
			this.mode = "dragging";
			if (this.ui.gestureDet.clickCount > 1) {
				if (obj.ty === "corner") {
					this.initPt = new Vec2(obj.x, obj.y);
					this.mode = "tanhandle";
					obj.addTanTarget();
					this.toSmooth = true;
				} else {
					obj.setTy("corner");
					obj.removeTanHandle();
					obj.setTan(null);
				}
			}
			let sel = new Set([obj]);
			if (this.mode === "dragging" && (ev.shiftKey || this.selection.has(obj))) {
				for (let a of this.selection) {
					sel.add(a);
				}
			}
			this.setSelection(sel);
		}
		this.render();
		this.lastPt = pt;
	}

	onPointerMove(ev) {
		let pt = this.ui.getCoords(ev);
		let dx = pt.x - this.lastPt.x;
		let dy = pt.y - this.lastPt.y;
		if (this.mode === "dragging") {
			for (let knot of this.selection) {
				knot.updatePos(knot.x + dx, knot.y + dy);
			}
		} else if (this.mode === "creating" || this.mode === "tanhandle") {
			let r = Math.hypot(pt.x - this.initPt.x, pt.y - this.initPt.y);
			let ty = r < tanR1 ? "corner" : "smooth";
			let  th = null;
			if (r >= tanR1 && r < 2 * tanR3 - tanR2) {
				this.toSmooth = false;
				th = Math.atan2(pt.y - this.initPt.y, pt.x - this.initPt.x);
				if (r < tanR2) {
					th = Math.PI / 2 * Math.round(th * (2 / Math.PI));
				}
			}
			for (let knot of this.selection) {
				knot.setTy(ty);
				knot.setTan(th, tanR3);
			}
		}
		this.render();
		this.lastPt = pt;
	}

	onPointerUp(ev) {
		for (let knot of this.selection) {
			if (this.toSmooth) {
				knot.setTy("smooth");
				this.toSmooth = false;
				this.render();
			}
			knot.removeTanTarget();
			if (this.mode === "creating" || this.mode === "tanhandle") {
				knot.addTanHandle();
			}
		}
		this.mode = "start";
	}

	render() {
		let ctrlPts = [];
		for (let knot of this.knots) {
			let pt = new ControlPoint(new Vec2(knot.x, knot.y), knot.ty, knot.th);
			ctrlPts.push(pt);
		}
		let spline = new Spline(ctrlPts);
		spline.solve();
		let path = spline.renderSvg();
		document.getElementById("spline").setAttribute("d", path);
	}
}

class Knot {
	/// ty is one of 'corner', 'smooth'.
	constructor(se, x, y, ty) {
		this.se = se;
		this.x = x;
		this.y = y;
		this.ty = ty;
		this.th = null;

		this.handleEl = this.createHandleEl();
	}

	createHandleEl() {
		let handle = this.se.ui.createSvgElement("g", true);
		handle.setAttribute("class", "handle");
		handle.setAttribute("transform", `translate(${this.x} ${this.y})`);
		// TODO: handles group should probably be variable in ui
		document.getElementById("handles").appendChild(handle);
		let inner = this.renderHandleEl();
		handle.appendChild(inner);
		return handle;
	}

	renderHandleEl() {
		let r = 4;
		let inner;
		if (this.ty === "corner") {
			inner = this.se.ui.createSvgElement("rect", true);
			inner.setAttribute("x", -r);
			inner.setAttribute("y", -r);
			inner.setAttribute("width", r * 2);
			inner.setAttribute("height", r * 2);
		} else {
			inner = this.se.ui.createSvgElement("circle", true);
			inner.setAttribute("cx", 0);
			inner.setAttribute("cy", 0);
			inner.setAttribute("r", r);
		}
		inner.setAttribute("class", "handle");
		return inner;			
	}

	addTanTarget() {
		for (let i = 0; i < 4; i++) {
			let th = i * (Math.PI / 2);
			let s = Math.sin(th);
			let c = Math.cos(th);
			let line = this.se.ui.createSvgElement("line");
			line.setAttribute("x1", tanR1 * c);
			line.setAttribute("y1", tanR1 * s);
			line.setAttribute("x2", tanR2 * c);
			line.setAttribute("y2", tanR2 * s);
			line.setAttribute("class", "target");
			this.handleEl.appendChild(line);

		}
		let circle = this.se.ui.createSvgElement("circle");
		circle.setAttribute("cx", 0);
		circle.setAttribute("cy", 0);
		circle.setAttribute("r", tanR3);
		circle.setAttribute("class", "target");
		this.handleEl.appendChild(circle);
	}

	removeTanTarget() {
		for (let child of this.handleEl.querySelectorAll(".target")) {
			this.handleEl.removeChild(child);
		}
	}

	setTan(th, r) {
		for (let child of this.handleEl.querySelectorAll(".tan")) {
			this.handleEl.removeChild(child);
		}
		if (th !== null) {
			let line = this.se.ui.createSvgElement("line");
			line.setAttribute("x1", -r * Math.cos(th));
			line.setAttribute("y1", -r * Math.sin(th));
			line.setAttribute("x2", r * Math.cos(th));
			line.setAttribute("y2", r * Math.sin(th));
			line.setAttribute("class", "tan");
			this.handleEl.appendChild(line);
		}
		this.th = th;
	}

	addTanHandle() {
		let th = this.th;
		if (th !== null) {
			this.setTan(th, tanR2);
			let circle = this.se.ui.createSvgElement("circle", true);
			circle.setAttribute("cx", tanR2 * Math.cos(this.th));
			circle.setAttribute("cy", tanR2 * Math.sin(th));
			circle.setAttribute("r", 3);
			circle.setAttribute("class", "tanhandle");
			this.handleEl.appendChild(circle);
			let tanHandle = new TanHandle(this);
			// To be more object oriented, receiver might be the knot or tanHandle. Ah well.
			this.se.ui.attachReceiver(circle, this.se, tanHandle);
		}
	}

	removeTanHandle() {
		// Maybe DRY?
		for (let child of this.handleEl.querySelectorAll(".tanhandle")) {
			this.handleEl.removeChild(child);
		}
	}

	toggleTy() {
		let ty = this.ty === "corner" ? "smooth" : "corner";
		this.setTy(ty);
	}

	setTy(ty) {
		if (ty !== this.ty) {
			this.ty = ty;
			let oldHandle = this.handleEl.querySelector(".handle");
			this.handleEl.replaceChild(this.renderHandleEl(), oldHandle);
		}
	}

	updatePos(x, y) {
		this.x = x;
		this.y = y;
		this.handleEl.setAttribute("transform", `translate(${x} ${y})`);
	}
}

class TanHandle {
	constructor(knot) {
		this.knot = knot;
	}
}

// TODO: create UI base class rather than cutting and pasting.
class Ui {
	constructor() {
		this.svgNS = "http://www.w3.org/2000/svg";
		this.setupHandlers();
		this.controlPts = [];
		this.se = new SplineEdit(this);
		this.gestureDet = new GestureDet(this);
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
		if (this.receiver !== null) {
			this.receiver.onPointerUp(e);
		}
		e.target.releasePointerCapture(e.pointerId);
		this.mousehandler = null;
		this.receiver = null;
	}

	// On Chrome, just offsetX, offsetY work, but on FF it takes the group transforms
	// into account. We always want coords relative to the SVG.
	getCoords(e) {
		let svg = document.getElementById("s");
		let rect = svg.getBoundingClientRect();
		let x = e.clientX - rect.left;
		let y = e.clientY - rect.top;
		return new Vec2(x, y);
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
		let path = "";
		let cmd = "M";
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
			for (let i = 0; i < nIter; i++) {
				spline.iterDumb(i);
			}
			let splinePath = spline.renderSvg();
			document.getElementById("spline").setAttribute("d", splinePath);
		}

		if (showBiParabola) {
			let pts = [];
			for (let pt of this.controlPts) {
				pts.push(new Vec2(pt.x + spline2Offset, pt.y));
			}
			let spline2 = new TwoParamSpline(new BiParabola, pts);
			spline2.initialThs();
			for (let i = 0; i < nIter; i++) {
				let absErr = spline2.iterDumb(i);
				if (i == nIter - 1) {
					console.log(`biparabola err: ${absErr}`);
				}
			}
			let spline2Path = spline2.renderSvg();
			document.getElementById("spline2").setAttribute("d", spline2Path);
		}

		/*
		for (let i = 0; i < ths.length; i++) {
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
