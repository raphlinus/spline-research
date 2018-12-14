# Copyright 2018 Raph Levien

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import math
from numpy.polynomial.polynomial import Polynomial

def hermite5(x0, x1, v0, v1, a0, a1):
  return Polynomial([x0,
          v0,
          0.5 * a0,
          -10 * x0 + 10 * x1 - 6 * v0 - 4 * v1 - 1.5 * a0 + 0.5 * a1,
          15 * x0 - 15 * x1 + 8 * v0 + 7 * v1 + 1.5 * a0 - a1,
          -6 * x0 + 6 * x1 - 3 * v0 - 3 * v1 + -.5 * a0 + 0.5 * a1])

# A quarter circle with a fixed curvature (1 is normal)
def quarter_k(k):
	v = math.pi/2
	return (hermite5(0, 1, v, 0, 0, -k * v**2),
		hermite5(1, 0, 0, -v, -k * v**2, 0))

def plot_poly(p, x, y, xu, yu, xv, yv):
	n = 5
	ds = 1.0 / (3 * n)
	dp0 = p[0].deriv()
	dp1 = p[1].deriv()
	for i in range(n):
		t0 = i * (1.0 / n)
		t1 = (i + 1) * (1.0 / n)
		u0 = p[0](t0)
		v0 = p[1](t0)
		u1 = u0 + dp0(t0) * ds
		v1 = v0 + dp1(t0) * ds
		u3 = p[0](t1)
		v3 = p[1](t1)
		u2 = u3 - dp0(t1) * ds
		v2 = v3 - dp1(t1) * ds
		print(x + xu * u1 + xv * v1, y + yu * u1 + yv * v1)
		print(x + xu * u2 + xv * v2, y + yu * u2 + yv * v2)
		print(x + xu * u3 + xv * v3, y + yu * u3 + yv * v3, 'curveto')

def plot_ellipsish(x, y, s, a, k1, k2):
	p1 = quarter_k(k1 * (1 - a))
	p2 = quarter_k(k2 * (1 + a))
	print(x + s * a, y + s, 'moveto')
	plot_poly(p1, x + s * a, y + s * a, s * (1 - a), 0, 0, s * (1 - a))
	plot_poly(p2, x - s * a, y + s * a, 0, -s * (1 + a), s * (1 + a), 0)
	plot_poly(p1, x - s * a, y - s * a, -s * (1 - a), 0, 0, -s * (1 - a))
	plot_poly(p2, x + s * a, y - s * a, 0, s * (1 + a), -s * (1 + a), 0)
	print('closepath stroke')

def plot_row(row, name, blendf):
	y = 700 - 72 * row
	print(50, y + 27, 'moveto (' + name + ') show')
	for i in range(10):
		a = 1 - (1 - i * .1) ** 2
		x = 72 + 50 * i
		k1 = 1 / (1 - a)
		k2 = 1 / (1 + a)
		if blendf != None:
			k = blendf(k1, k2)
			k1 = k
			k2 = k
		plot_ellipsish(x, y, 22, a, k1, k2)

def arith_mean(k1, k2):
	return 0.5 * (k1 + k2)

def harmonic_mean(k1, k2):
	return 2 / (1/k1 + 1/k2)

def geometric_mean(k1, k2):
	return math.sqrt(k1 * k2)

def atan_mean(k1, k2):
	return math.tan(0.5 * (math.atan(k1) + math.atan(k2)))

def print_chart():
	print('%!PS-Adobe-3.0')
	print('/Times-Roman 12 selectfont')
	plot_row(0, 'none', None)
	plot_row(1, 'minimum', min)
	plot_row(2, 'harmonic mean', harmonic_mean)
	plot_row(3, 'atan mean', atan_mean)
	plot_row(4, 'geometric mean', geometric_mean)
	plot_row(7, 'arithmetic mean', arith_mean)
	print('showpage')

print_chart()
