set term postscript
set output '/tmp/k.ps'
set contour
set pm3d map
set cntrparam levels incremental -1.6, 0.1, 1.6
set cbrange [-1.6:1.6]
set palette rgbformulae 22, 13, 10
set grid
set size square
unset key
set xlabel "th_0"
set ylabel "th_1"
splot '/tmp/k.dat'
#pause mouse "Click"
