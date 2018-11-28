set term postscript
set output '/tmp/myk.ps'
set contour
set pm3d map
#unset surface
set cntrparam levels incremental -1.6, 0.1, 1.6
set cbrange [-1.6:1.6]
set palette rgbformulae 22, 13, 10
set grid
set size square
unset key
#unset colorbox
set xlabel "{/Symbol q}_0"
set ylabel "{/Symbol q}_1"
splot '/tmp/myk.dat'
#pause mouse "Click"
