// Copyright 2019 Raph Levien

// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

//! Computation and UI for the new interpolation-based curve families.

// Note: cut'n'paste from biparabola.js, maybe move to a utils file?
function solve_bisect(f, xmin = 0, xmax = 1) {
    let smin = Math.sign(f(xmin));
    if (smin == 0) { return xmin; }
    let smax = Math.sign(f(xmax));
    if (smax == 0) { return xmax; }
    if (smin == smax) {
        //console.log("solve_bisect: doesn't straddle solution");
        return;
    }
    var x;
    for (var i = 0; i < 30; i++) {
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

class TwoCubics {
    // Argument is an array of 6 values. First and last are arm length.
    // Middle 4 are coords of 2 interior points.
    //
    // The angles are implicit and need to be provided.
    //
    // Note: wouldn't be too hard to generalize to N cubics, but trying
    // to stay focused.
    constructor(a) {
        this.a = a;
    }

    getCenterPt(th0, th1) {
        let a0 = this.a[0];
        let a1 = this.a[1];
        let a2 = this.a[2];
        let a3 = this.a[3];
        let a4 = this.a[4];
        let a5 = this.a[5];
        let p1 = new Vec2(a0 * Math.cos(th0), a0 * Math.sin(th0));
        let p2 = new Vec2(a1, a2);
        let p4 = new Vec2(a3, a4);
        let p5 = new Vec2(1 - a5 * Math.cos(th1), a5 * Math.sin(th1));
        // Following code was trying to enforce G2 but had stability problems.
        /*
        let t = solve_bisect(t => {
            let p3x = a1 + t * (a3 - a1);
            let p3y = a2 + t * (a4 - a2);
            let l = new CubicBez([0, 0, p1.x, p1.y, a1, a2, p3x, p3y]);
            let r = new CubicBez([p3x, p3y, a3, a4, p5.x, p5.y, 1, 0]);
            return l.curvature(1) - r.curvature(0);
        }, 0.001, 0.999);
        if (typeof t != "number") { t = 0.5 };
        */
        let t = 0.5;
        return new Vec2(a1 + t * (a3 - a1), a2 + t * (a4 - a2));
    }


    // Render to TwoParamCurve render style
    render(th0, th1) {
        let a0 = this.a[0];
        let a1 = this.a[1];
        let a2 = this.a[2];
        let a3 = this.a[3];
        let a4 = this.a[4];
        let a5 = this.a[5];
        let p1 = new Vec2(a0 * Math.cos(th0), a0 * Math.sin(th0));
        let p2 = new Vec2(a1, a2);
        let p4 = new Vec2(a3, a4);
        let p5 = new Vec2(1 - a5 * Math.cos(th1), a5 * Math.sin(th1));
        let p3 = this.getCenterPt(th0, th1);
        return [p1, p2, p3, p4, p5];
    }

    // Raise from a single cubic. Takes input either as a CubicBez object
    // or in TwoParamCurve render style (the two interior points).
    static raise(cb) {
        if (!(cb instanceof CubicBez)) {
            let coords = new Float64Array(8);
            coords[2] = cb[0].x;
            coords[3] = cb[0].y;
            coords[4] = cb[1].x;
            coords[5] = cb[1].y;
            coords[6] = 1;
            cb = new CubicBez(coords);
        }
        let l = cb.leftHalf();
        let r = cb.rightHalf();
        let a = new Float64Array(6);
        a[0] = Math.hypot(l.c[2], l.c[3]);
        a[1] = l.c[4];
        a[2] = l.c[5];
        a[3] = r.c[2];
        a[4] = r.c[3];
        a[5] = Math.hypot(1 - r.c[4], r.c[5]);
        return new TwoCubics(a);
    }

    // Provide a default value. This is the correct answer for (0, 0) but
    // very poor at other grid points. Perhaps useful for bootstrapping.
    static default() {
        let a = new Float64Array(6);
        a[0] = 1.0/6;
        a[1] = 1.0/3;
        a[2] = 0;
        a[3] = 2.0/3;
        a[4] = 0;
        a[5] = 1.0/6;
        return new TwoCubics(a);
    }

    // Perform 180 degree rotation.
    turn() {
        let a = new Float64Array(6);
        a[0] = this.a[5];
        a[1] = 1 - this.a[3];
        a[2] = -this.a[4];
        a[3] = 1 - this.a[1];
        a[4] = -this.a[2];
        a[5] = this.a[0];
        return new TwoCubics(a);
    }

    // Perform left-right mirror symmetry.
    flip_horiz() {
        let a = new Float64Array(6);
        a[0] = this.a[5];
        a[1] = 1 - this.a[3];
        a[2] = this.a[4];
        a[3] = 1 - this.a[1];
        a[4] = this.a[2];
        a[5] = this.a[0];
        return new TwoCubics(a);
    }

    // Perform up-down mirror symmetry.
    flip_vert() {
        let a = new Float64Array(this.a);
        a[2] = -a[2];
        a[4] = -a[4];
        return new TwoCubics(a);
    }
}

// Compute actual modulo, not remainder.
function mymod(a, b) {
    let r = a % b;
    return r < 0 ? r + b : r;
}

class CurveGrid {
    // There are (n + 1)^2 masters, each a TwoCubics, arranged as follows:
    //
    // . . . . 8
    // . . . 3 7
    // . . 0 2 6 
    // . . . 1 5
    // . . . . 4
    constructor(n, masters) {
        this.n = n;
        this.masters = masters;
    }

    // Get a master for a grid point, only for the right quadrant.
    //
    // In other words, only valid for 0 <= i <= n and -i <= j <= i
    get_master_core(i, j) {
        let ix = i * i + i + j;
        return this.masters[ix];
    }

    // Get a master based on the grid point, applying symmetry.
    get_master(i, j) {
        i = mymod(i + this.n - 1, this.n * 2) - this.n + 1;
        j = mymod(j + this.n - 1, this.n * 2) - this.n + 1;
        if (i >= 0 && -i <= j && j <= i) {
            return this.get_master_core(i, j);
        } else if (j >= 0 && -j <= i && i <= j) {
            return this.get_master_core(j, i).flip_horiz();
        } else if (i <= 0 && i <= j && j <= -i) {
            return this.get_master_core(-i, -j).flip_vert();
        } else {
            return this.get_master_core(-j, -i).turn();
        }
    }

    // Get an interpolated curve.
    //
    // This is currently using bilinear interpolation for simplicity but we
    // want to strongly consider bicubic for greater smoothness.
    //
    // Another possibility is to build "trigonometric polynomials" and evaluate
    // those. These are smoother in a mathematical sense but I am concerned
    // about non-locality.
    get_interp(th0, th1) {
        let i = th0 * 2 * this.n / Math.PI;
        let j = th1 * 2 * this.n / Math.PI;
        let i_int = Math.floor(i);
        let j_int = Math.floor(j);
        let i_frac = i - i_int;
        let j_frac = j - j_int;
        let m00 = this.get_master(i_int, j_int);
        let m01 = this.get_master(i_int + 1, j_int);
        let m10 = this.get_master(i_int, j_int + 1);
        let m11 = this.get_master(i_int + 1, j_int + 1);
        let a = new Float64Array(6);
        for (let k = 0; k < 6; k++) {
            let a00 = m00.a[k];
            let a01 = m01.a[k];
            let a10 = m10.a[k];
            let a11 = m11.a[k];
            let a0 = a00 + i_frac * (a01 - a00);
            let a1 = a10 + i_frac * (a11 - a10);
            a[k] = a0 + j_frac * (a1 - a0);
        }
        return new TwoCubics(a);
    }

    // Return a json object (not a string) serializing the state.
    toJson() {
        let result = {};
        result["n"] = this.n;
        let masters = [];
        for (let master of this.masters) {
            let a = [];
            for (let i = 0; i < master.a.length; i++) {
                a.push(master.a[i]);
            }
            masters.push(a);
        }
        result["masters"] = masters;
        return result;
    }

    // Instantiate from a json object (not a string).
    static fromJson(json) {
        let n = json["n"];
        let masters = [];
        for (let master of json["masters"]) {
            masters.push(new TwoCubics(master));
        }
        return new CurveGrid(n, masters);
    }
}
