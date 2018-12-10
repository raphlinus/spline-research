set term postscript color
set output '/tmp/myk.ps'
set contour
#set pm3d map
#unset surface
set cntrparam levels incremental -20, 0.5, 20
set zrange [-20:20]
#set palette rgbformulae 22, 13, 10
set grid
#set size square
unset key
#unset colorbox
set xlabel "{/Symbol q}_0"
set ylabel "{/Symbol q}_1"
set title "Curvature as function of endpoint tangents, bi-parabola"
splot '/tmp/myk.dat' with pm3d
#pause mouse "Click"
