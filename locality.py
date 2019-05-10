# Copyright 2018 Raph Levien

# Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
# http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
# <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
# option. This file may not be copied, modified, or distributed
# except according to those terms.

# Computation of locality ratio for G3, kappa'=0 case

def ratio_g3(a):
	# kappa = a - (1 + a) * (3x^2 - 2x^3)
	# th = ax - (1 + a) * (x^3 - 1/2 x^4)
	# y = 1/2 a x^2 - (1 + a) * (1/4 x^4 - 1/10 x^5)
	y1 = 0.5 * a - (1 + a) * 0.15
	z0 = -y1
	z1 = z0 + a - (1 + a) * 0.5
	print a, -z0 / z1

if False:
	for i in range(10):
		a = 4.44151 + i * 0.000001
		ratio_g3(a)

# k'=0 on high curvature side, k''=0 on low curvature side
def ratio_asym(a):
	# kappa = a - (1 + a) * x^2
	# th = ax - (1 + a) * (1/3 x^3)
	# y = 1/2 a x^2 - (1 + a) * (1/12 x^4)
	y1 = 0.5 * a - (1 + a) * (1./12)
	z0 = -y1
	z1 = z0 + a - (1 + a) * (1./3)
	print a, -z0 / z1

if True:
	for i in range(10):
		a = 2.5 + i * .01
		ratio_asym(a)
