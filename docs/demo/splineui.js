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
		this.isClosed = false;
		this.bezpath = new BezPath;
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
			let subdivideDist = 5;
			let ty = ev.altKey ? "smooth" : "corner";
			let hit = this.bezpath.hitTest(pt.x, pt.y);
			let insIx = this.knots.length;
			if (hit.bestDist < subdivideDist) {
				ty = "smooth";
				insIx = hit.bestMark + 1;
			}
			let knot = new Knot(this, pt.x, pt.y, ty);
			this.knots.splice(insIx, 0, knot);
			this.ui.attachReceiver(knot.handleEl, this, knot);
			// TODO: setter rather than state change?
			this.ui.receiver = this;
			this.setSelection(new Set([knot]));
			if (ty === "corner") {
				knot.addTanTarget();
				this.mode = "creating";
			} else {
				this.mode = "dragging";
			}
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
			if (this.selection.size == 1
				&& this.selection.has(this.knots[this.knots.length - 1])
				&& this.knots.length >= 3
				&& obj === this.knots[0])
			{
				this.isClosed = true;
			}
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

	onPointerHover(ev) {
		let pt = this.ui.getCoords(ev);
		// TODO: hover the knots and the visible tangent handles
		let hit = this.bezpath.hitTest(pt.x, pt.y);
		// TODO: display proposed knot
	}

	onKeyDown(ev) {
		if (ev.key === "Backspace" || ev.key === "Delete") {
			for (let i = 0; i < this.knots.length; i++) {
				let knot = this.knots[i];
				if (this.selection.has(knot)) {
					this.knots.splice(i, 1);
					knot.handleEl.remove();
					i--;
				}
			}
			if (this.knots.length < 3) {
				this.isClosed = false;
			}
			this.selection = new Set();
			this.render();
			return true;
		} else if (ev.key === "ArrowLeft") {
			this.nudge(-1, 0, ev);
			return true;
		} else if (ev.key === "ArrowRight") {
			this.nudge(1, 0, ev);
			return true;
		} else if (ev.key === "ArrowUp") {
			this.nudge(0, -1, ev);
			return true;
		} else if (ev.key === "ArrowDown") {
			this.nudge(0, 1, ev);
			return true;
		}
		return false;
	}

	nudge(dx, dy, ev) {
		if (ev && ev.shiftKey) {
			dx *= 10;
			dy *= 10;
		}
		for (let knot of this.selection) {
			knot.updatePos(knot.x + dx, knot.y + dy);
		}
		this.render();
	}

	render() {
		let ctrlPts = [];
		for (let knot of this.knots) {
			let pt = new ControlPoint(new Vec2(knot.x, knot.y), knot.ty, knot.th);
			ctrlPts.push(pt);
		}
		let spline = new Spline(ctrlPts, this.isClosed);
		spline.solve();
		// Should this be bundled into solve?
		spline.computeCurvatureBlending();
		this.bezpath = spline.render();
		let path = this.bezpath.renderSvg();
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

		if ("PointerEvent" in window) {
			svg.addEventListener("pointermove", e => this.pointerMove(e));
			svg.addEventListener("pointerup", e => this.pointerUp(e));
			svg.addEventListener("pointerdown", e => this.pointerDown(e));
		} else {
			// Fallback for ancient browsers
			svg.addEventListener("mousemove", e => this.mouseMove(e));
			svg.addEventListener("mouseup", e => this.mouseUp(e));
			svg.addEventListener("mousedown", e => this.mouseDown(e));
			// TODO: add touch handlers
		}
		window.addEventListener("keydown", e => this.keyDown(e));
		this.mousehandler = null;
		this.receiver = null;
	}

	attachHandler(element, handler) {
		let svg = document.getElementById("s");
		if ("PointerEvent" in window) {
			element.addEventListener("pointerdown", e => {
				svg.setPointerCapture(e.pointerId);
				this.mousehandler = handler;
				e.preventDefault();
				e.stopPropagation();
			});
		} else {
			element.addEventListener("mousedown", e => {
				this.mousehandler = handler;
				e.preventDefault();
				e.stopPropagation();
			});
			// TODO: add touch handlers
		}
	}

	/// This is the pattern for the new object-y style.

	// Maybe just rely on closures to capture obj?
	attachReceiver(element, receiver, obj) {
		let svg = document.getElementById("s");
		if ("PointerEvent" in window) {
			element.addEventListener("pointerdown", e => {
				this.gestureDet.onPointerDown(e);
				svg.setPointerCapture(e.pointerId);
				this.receiver = receiver;
				receiver.onPointerDown(e, obj);
				e.stopPropagation();
			});
		} else {
			element.addEventListener("mousedown", e => {
				this.gestureDet.onPointerDown(e);
				this.receiver = receiver;
				receiver.onPointerDown(e, obj);
				e.stopPropagation();
			});
			// TODO: add touch handlers
		}
	}

	pointerDownCommon(e) {
		this.gestureDet.onPointerDown(e);
		this.se.onPointerDown(e, null);
		e.preventDefault();
	}

	pointerDown(e) {
		let svg = document.getElementById("s");
		svg.setPointerCapture(e.pointerId);
		this.pointerDownCommon(e);
	}

	mouseDown(e) {
		this.pointerDownCommon(e);
	}

	pointerMove(e) {
		if (this.receiver !== null) {
			this.receiver.onPointerMove(e);
		} else if (this.mousehandler !== null) {
			this.mousehandler(e);
		} else {
			this.se.onPointerHover(e);
		}
		e.preventDefault();
	}

	mouseMove(e) {
		this.pointerMove(e);
	}

	pointerUpCommon(e) {
		if (this.receiver !== null) {
			this.receiver.onPointerUp(e);
		}
		this.mousehandler = null;
		this.receiver = null;
		e.preventDefault();
	}

	pointerUp(e) {
		e.target.releasePointerCapture(e.pointerId);
		this.pointerUpCommon(e);
	}

	mouseUp(e) {
		this.pointerUpCommon(e);
	}

	keyDown(e) {
		let handled = this.se.onKeyDown(e);
		if (handled) {
			e.preventDefault();
		}
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
