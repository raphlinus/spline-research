set term postscript
set output '/tmp/myk.ps'
set contour
set pm3d map
#unset surface
set cntrparam levels incremental -2.1, 0.05, 2.1
set cbrange [-2:2]
set palette rgbformulae 22, 13, 10
set grid
set size square
unset key
#unset colorbox
set xlabel "{/Symbol q}_0"
set ylabel "{/Symbol q}_1"
splot '/tmp/myk.dat'
#pause mouse "Click"
