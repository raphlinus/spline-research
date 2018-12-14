# Spline research

This repo contains protoype research code for a new spline. It is
based on my earlier [Spiro] work and builds on my [PhD thesis] but has
significant advantages.

First, the new spline is *robust.* That means that a small change to an
input point yields a proportionally small change in the generated spline.
By contrast, Spiro was prone to large flips, as a loop would change
direction. Even worse, Spiro would sometimes fail to converge (often
producing incorrect results resembline particle accelerator tracks). This
lack of robustness was a major reason Spiro didn’t catch on more widely.

Second, it uses *explicit tangents* as a unifying and simple user experience
refinement to control a wide range of behaviors. These explicit tangents
replace Spiro’s “one-way constraints,” which were powerful but confusing
from a user-experience perspective. With explicit tangents, the designer
make smooth straight-to-curved transitions, control the curvature when
a curve is terminated at a corner, control the exact locations of extrema
(especially important for font design), and signal a transition from low
curvature to high curvature regions. The new control is intuitive and
will be familiar to designers experienced in Bézier drawing.

The new spline should be useful in font design (my original
motivation), vector illustration in general, CAD, and other applications
such as maps and representation of path centerlines for autonomous
vehicles.

Try the [online demo](https://spline.technology/demo).

Read more about the spline in [research paper 1](https://spline.technology/paper1.pdf).

## License and patent grant

All code in this package is released under the terms of the GNU GPL,
version 3 or later, at your choice.

Further, there is a provisional patent application filed for the
underlying curve technology. The following patent grant applies to any
patent which may be issued as a result of that application:

Whereas, Raph Levien (hereinafter “Inventor”) has obtained patent
protection for related technology (hereinafter “Patented Technology”),
Inventor wishes to aid the the GNU free software project in achieving
its goals, and Inventor also wishes to increase public awareness of
Patented Technology, Inventor hereby grants a fully paid up,
nonexclusive, irrevocable, royalty free license to practice the
patents listed below (“the Patents”) if and only if practiced in
conjunction with software distributed under the terms of any version
of the GNU General Public License as published by the Free Software
Foundation, 59 Temple Place, Suite 330, Boston, MA 02111. Inventor
reserves all other rights, including without limitation, licensing for
software not distributed under the GNU General Public License.

## Contributions

This repo is primarily for my individual research. I am open to
collaboration and will accept contributions, but I also want to
preserve full ownership of the code so that I can do commercial
licensing of code derived from it. Thus, contributions to the repo
will require a signed copyright assignment to me.

Please get in touch if this condition is onerous.

— [Raph Levien](https://levien.com)

[Spiro]: https://levien.com/spiro
[PhD thesis]: https://levien.com/phd/phd.html
