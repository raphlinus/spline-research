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

## License

The code in this repository is licensed under the terms of the [Apache-2](LICENSE-APACHE) or
[MIT](LICENSE-MIT) license, at your choice.

The ideas in this repository are free for all to implement. Previously there
were patents and a provisional patent application, but those are hereby passed
into the public domain.

## Contributions

Contributions are welcome.

— [Raph Levien](https://levien.com)

[Spiro]: https://levien.com/spiro
[PhD thesis]: https://levien.com/phd/phd.html
