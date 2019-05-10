// Copyright 2018 Raph Levien

// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

//! Utilities for representing and manipulating bezier paths.

const MOVETO = "m";
const LINETO = "l";
const CURVETO = "c";
const CLOSEPATH = "z";
const MARK = "#";

class BezPath {
	constructor() {
		this.cmds = [];
	}

	// Construction mutations (builder could be separate but oh well).
	moveto(x, y) {
		this.cmds.push([MOVETO, x, y]);
	}

	lineto(x, y) {
		this.cmds.push([LINETO, x, y]);
	}

	curveto(x1, y1, x2, y2, x3, y3) {
		this.cmds.push([CURVETO, x1, y1, x2, y2, x3, y3]);
	}

	closepath() {
		this.cmds.push([CLOSEPATH]);
	}

	mark(i) {
		this.cmds.push([MARK, i]);
	}

	renderSvg() {
		let path = "";
		for (let cmd of this.cmds) {
			let op = cmd[0];
			if (op === MOVETO) {
				path += `M${cmd[1]} ${cmd[2]}`;
			} else if (op === LINETO) {
				path += `L${cmd[1]} ${cmd[2]}`;
			} else if (op === CURVETO) {
				path += `C${cmd[1]} ${cmd[2]} ${cmd[3]} ${cmd[4]} ${cmd[5]} ${cmd[6]}`;
			} else if (op === CLOSEPATH) {
				path += "Z";
			}
		}
		return path;
	}

	hitTest(x, y) {
		let result = new HitTestResult(x, y);
		let curX;
		let curY;
		let curMark = null;
		for (let cmd of this.cmds) {
			let op = cmd[0];
			if (op === MOVETO) {
				curX = cmd[1];
				curY = cmd[2];
			} else if (op === LINETO) {
				result.accumLine(curX, curY, cmd[1], cmd[2], curMark);
				curX = cmd[1];
				curY = cmd[2];
			} else if (op === CURVETO) {
				result.accumCurve(curX, curY, cmd[1], cmd[2], cmd[3], cmd[4],
					cmd[5], cmd[6], curMark);
				curX = cmd[5];
				curY = cmd[6];
			} else if (op === MARK) {
				curMark = cmd[1];
			}
		}
		return result;
	}
}

class HitTestResult {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.bestDist = 1e12;
		this.bestMark = null;
	}

	accumulate(dist, pt, mark) {
		if (dist < this.bestDist) {
			this.bestDist = dist;
			this.bestMark = mark;
		}
	}

	accumLine(x0, y0, x1, y1, mark) {
		let dx = x1 - x0;
		let dy = y1 - y0;
		let dotp = (this.x - x0) * dx + (this.y - y0) * dy;
		let linDotp = dx * dx + dy * dy;
		let r = Math.hypot(this.x - x0, this.y - y0);
		let rMin = r;
		r = Math.hypot(this.x - x1, this.y - y1);
		rMin = Math.min(rMin, r);
		if (dotp > 0 && dotp < linDotp) {
			let norm = (this.x - x0) * dy - (this.y - y0) * dx;
			r = Math.abs(norm / Math.sqrt(linDotp));
			rMin = Math.min(rMin, r);
		}
		if (rMin < this.bestDist) {
			this.bestDist = rMin;
			this.bestMark = mark;
		}
	}

	accumCurve(x0, y0, x1, y1, x2, y2, x3, y3, mark) {
		let n = 32; // TODO: be adaptive
		let dt = 1.0 / n;
		let lastX = x0;
		let lastY = y0;
		for (let i = 0; i < n; i++) {
			let t = (i + 1) * dt;
			let mt = 1 - t;
			let x = (x0 * mt * mt + 3 * (x1 * mt * t + x2 * t * t)) * mt + x3 * t * t * t;
			let y = (y0 * mt * mt + 3 * (y1 * mt * t + y2 * t * t)) * mt + y3 * t * t * t;
			this.accumLine(lastX, lastY, x, y, mark);
			lastX = x;
			lastY = y;
		}
	}
}
