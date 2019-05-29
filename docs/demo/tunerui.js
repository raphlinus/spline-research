// Copyright 2019 Raph Levien

// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

//! UI for editing tuning curve masters

class Tuner {
    constructor(ui) {
        // TODO someday: maybe this should be configurable by UI.
        this.n = 4;
        // Size of unit square relative to size available;
        this.scale = 0.9;
        this.mapSize = 480;
        this.ui = ui;

        // display of two-bezier segment
        this.bx0 = 500;
        this.by0 = 100;
        this.bdx = 280;

        // display of curvature plot
        this.cx0 = this.bx0;
        this.cy0 = 300;
        this.cdx = 200;

        this.ctrlPts = [];

        this.dragObj = null;
    }

    onPointerDown(ev, obj) {
        let pt = this.ui.getCoords(ev);

        for (let cpt of this.ctrlPts) {
            let xy = cpt.getXy();
            let hitDist = Math.hypot(xy.x - pt.x, xy.y - pt.y);
            if (hitDist < 6) {
                // TODO: either remove control points or set up read-only versions
                this.dragObj = cpt;
                return;
            }
        }

        let i = Math.round((2 / this.mapSize * pt.x - 1) * this.n / this.scale);
        let j = Math.round((1 - 2 / this.mapSize * pt.y) * this.n / this.scale);
        let quantized = this.gridToXy(i, j);
        let hitDist = Math.hypot(quantized.x - pt.x, quantized.y - pt.y);
        if (hitDist < 6 && i >= 0 && j >= -i && j <= i) {
            console.log("hit point", i, j);
            let master = this.curveGrid.get_master(i, j);
            let th0 = i * 0.5 * Math.PI / this.n;
            let th1 = j * 0.5 * Math.PI / this.n;
            this.renderCurve(master, th0, th1);
            for (var cpt of this.ctrlPts) {
                cpt.destroy();
            }
            let ctrlPts = [];
            for (let k = 0; k < 4; k++) {
                let ctrlPt = new CtrlPt(this, i, j, k);
                ctrlPts.push(ctrlPt);
            }
            this.ctrlPts = ctrlPts;
        } else {
            this.showInterp(pt);
        }
    }

    onPointerMove(ev) {
        let pt = this.ui.getCoords(ev);
        if (this.dragObj instanceof CtrlPt) {
            this.dragObj.drag(pt);
        } else {
            this.showInterp(pt);
        }
    }

    onPointerUp(ev) {
        this.dragObj = null;
    }

    onPointerHover(ev) {
        //console.log("hover");
    }

    // Various initialization including populating UI elements.
    setUpGrid() {
        let masters = [];
        for (let i = 0; i <= this.n; i++) {
            let th0 = 0.5 * Math.PI * i / this.n;
            for (let j = -i; j <= i; j++) {
                let th1 = 0.5 * Math.PI * j / this.n;
                let cubic = new CubicBez(myCubic(th0, th1));
                masters.push(TwoCubics.raise(cubic));
            }
        }
        this.curveGrid = new CurveGrid(this.n, masters);

        for (let i = 0; i <= this.n; i++) {
            for (let j = -i; j <= i; j++) {
                let pt = this.gridToXy(i, j);
                this.ui.plotCircle(pt.x, pt.y);
            }
        }
    }

    gridToXy(i, j) {
        let x = this.mapSize * 0.5 * (1 + this.scale / this.n * i);
        let y = this.mapSize * 0.5 * (1 - this.scale / this.n * j);
        return new Vec2(x, y);
    }

    renderCurve(twoCubics, th0, th1) {
        let r = twoCubics.render(th0, th1);

        // First, render the curve
        let path = `M${this.bx0} ${this.by0}`;
        let cmd = " C";
        for (var j = 0; j < r.length; j++) {
            let pt = r[j];
            let x = this.bx0 + this.bdx * pt.x;
            let y = this.by0 - this.bdx * pt.y;
            path += `${cmd}${x} ${y}`;
            cmd = " ";
        }
        path += ` ${this.bx0 + this.bdx} ${this.by0}`;
        document.getElementById("bez").setAttribute("d", path);

        let centerPt = twoCubics.getCenterPt(th0, th1);
        document.getElementById("ctr").setAttribute("cx", this.bx0 + this.bdx * centerPt.x);
        document.getElementById("ctr").setAttribute("cy", this.by0 - this.bdx * centerPt.y);

        // Then, render the curvature plot
        path = "";
        cmd = "M";
        let last = new Vec2(0, 0);
        let s = 0;
        let n = 100;
        let cb;
        for (let i = 0; i <= n; i++) {
            if (i == 0 || i == n/2) {
                let coords = new Float64Array(8);
                for (let j = 0; j < 4; j++) {
                    let ix = i == 0 ? j - 1 : j + 2;
                    let pt = ix < 0 ? new Vec2(0, 0) : ix > 4 ? new Vec2(1, 0) : r[ix];
                    coords[j * 2] = pt.x;
                    coords[j * 2 + 1] = pt.y;
                }
                cb = new CubicBez(coords);
            }
            let t = (i < n/2 ? i : i - n/2) * (2.0 / n);
            let xy = cb.eval(t);
            s += Math.hypot(xy.x - last.x, xy.y - last.y);
            last = xy;
            let x = this.cx0 + this.cdx * s;
            let k = cb.curvature(t);
            if (!isNaN(k)) {
                let scale = -0.05;
                let y = this.cy0 - this.cdx * scale * k;
                path += `${cmd}${x} ${y}`;
                cmd = " L";
            }
        }
        document.getElementById("curv").setAttribute("d", path);
        document.getElementById("curv-base").setAttribute("x2", this.cx0 + this.cdx * s);
    }

    updateCtrlPts() {
        for (var ctrlPt of this.ctrlPts) {
            ctrlPt.update();
        }
    }

    // Show the interpolated curve, coordinates in screen space
    showInterp(pt) {
        let th0 = (2 / this.mapSize * pt.x - 1) / this.scale * 0.5 * Math.PI;
        let th1 = (1 - 2 / this.mapSize * pt.y) / this.scale * 0.5 * Math.PI;
        let interp = this.curveGrid.get_interp(th0, th1);
        this.renderCurve(interp, th0, th1);
        // TODO: want to show interpolated control points as well, but want to
        // disable their editability.
    }

    setUpButtons() {
        document.getElementById("loadbutton").addEventListener("click", (e) => {
            this.load();
        });
        document.getElementById("savebutton").addEventListener("click", (e) => {
            this.save();
        });
    }

    load() {
        let el = document.getElementById("json");
        let json = JSON.parse(el.value);
        this.curveGrid = CurveGrid.fromJson(json);
        // TODO: give visual indication that it loaded
    }

    save() {
        let el = document.getElementById("json");
        el.value = JSON.stringify(this.curveGrid.toJson());
        el.select();
        document.execCommand("copy");
        // TODO: pop up a toast saying "copied to clipboard"
    }
}

class CtrlPt {
    // i, j are grid position in grid. k is identifier of which control point
    constructor(tuner, i, j, k) {
        this.tuner = tuner;
        this.i = i;
        this.j = j;
        this.k = k;
        let xy = this.getXy();
        this.el = this.tuner.ui.plotCircle(xy.x, xy.y);
    }

    getMaster() {
        return this.tuner.curveGrid.get_master(this.i, this.j);
    }

    getXy() {
        let master = this.getMaster();
        let th0 = this.i * 0.5 * Math.PI / this.tuner.n;
        let th1 = this.j * 0.5 * Math.PI / this.tuner.n;
        let r = master.render(th0, th1);
        let r_ix = this.k < 2 ? this.k : this.k + 1;
        let pt = r[r_ix];
        let x = this.tuner.bx0 + this.tuner.bdx * pt.x;
        let y = this.tuner.by0 - this.tuner.bdx * pt.y;
        return new Vec2(x, y);
    }

    update() {
        let xy = this.getXy();
        this.el.setAttribute("cx", xy.x);
        this.el.setAttribute("cy", xy.y);
    }

    drag(pt) {
        let x = (pt.x - this.tuner.bx0) / this.tuner.bdx;
        let y = (this.tuner.by0 - pt.y) / this.tuner.bdx;
        let master = this.getMaster();
        let sym = this.i == this.j;
        let antisym = this.i == -this.j;
        if (this.k == 0) {
            master.a[0] = Math.hypot(x, y);
            if (sym || antisym) {
                master.a[5] = master.a[0];
            }
        } else if (this.k == 1) {
            master.a[1] = x;
            master.a[2] = y;
            if (sym) {
                master.a[3] = 1 - x;
                master.a[4] = y;
            } else if (antisym) {
                master.a[3] = 1 - x;
                master.a[4] = -y;
            }
        } else if (this.k == 2) {
            master.a[3] = x;
            master.a[4] = y;
            if (sym) {
                master.a[1] = 1 - x;
                master.a[2] = y;
            } else if (antisym) {
                master.a[1] = 1 - x;
                master.a[2] = -y;
            }
        } else if (this.k == 3) {
            master.a[5] = Math.hypot(1 - x, y);
            if (sym || antisym) {
                master.a[0] = master.a[5];
            }
        }
        let th0 = this.i * 0.5 * Math.PI / this.tuner.n;
        let th1 = this.j * 0.5 * Math.PI / this.tuner.n;
        this.tuner.renderCurve(master, th0, th1);
        this.tuner.updateCtrlPts();
    }

    destroy() {
        this.el.remove();
        this.el = null;
    }
}

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

// TODO: create UI base class rather than cutting and pasting.
class Ui {
    constructor() {
        this.svgNS = "http://www.w3.org/2000/svg";
        this.setupHandlers();
        this.gestureDet = new GestureDet(this);
        this.keyHandlerActive = true;
        this.pressed = false;
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
        //window.addEventListener("keydown", e => this.keyDown(e));
    }

    pointerDownCommon(e) {
        this.pressed = true;
        this.gestureDet.onPointerDown(e);
        this.inner.onPointerDown(e, null);
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
        if (this.pressed) {
            this.inner.onPointerMove(e);
        } else {
            this.inner.onPointerHover(e);
        }
        e.preventDefault();
    }

    mouseMove(e) {
        this.pointerMove(e);
    }

    pointerUpCommon(e) {
        this.pressed = false;
        this.inner.onPointerUp(e);
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
        // Maybe would be better to use focus instead of explicit logic...
        if (!this.keyHandlerActive) { return; }
        let handled = this.inner.onKeyDown(e);
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
        this.removeAllChildren(document.getElementById("plots"));
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

    removeAllChildren(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
}

let ui = new Ui();
ui.inner = new Tuner(ui);
ui.inner.setUpGrid();
ui.inner.setUpButtons();

