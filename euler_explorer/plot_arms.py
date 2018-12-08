import math
import pcorn
import draw_cornu

def compute_arms(th0, th1):
	seg = pcorn.Segment((0, 0), (1, 0), th0, th1)
	curve = pcorn.Curve([seg])
	s0 = 0
	s1 = seg.arclen - 1e-9
	print s1, curve.arclen
	bzs = draw_cornu.pcorn_segment_to_bzs(curve, s0, s1, 1, 1e9)
	a0 = math.hypot(bzs[0][1][0], bzs[0][1][1])
	a1 = math.hypot(1 - bzs[0][2][0], bzs[0][1][1])
	return (a0, a1)

def plot_arms():
	f = open('/tmp/arms.dat', 'w')
	thmin = -math.pi / 2
	thmax = math.pi / 2
	n = 399
	for i in range(n + 1):
		th0 = thmin + (thmax - thmin) * i / n
		for j in range(n + 1):
			th1 = thmin + (thmax - thmin) * j / n
			a0, a1 = compute_arms(th0, th1)
			print >> f, th0, th1, a0
		print >> f

plot_arms()