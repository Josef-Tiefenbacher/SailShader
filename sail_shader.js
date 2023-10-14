var w = 0;
var h = 0;

function p(x, y) { 	return {x: x, y: y}; }
function l(a, b) { 	return {a: a, b: b}; }
function lc(x1,y1, x2,y2) { return {a: p(x1,y1), b: p(x2,y2)}; }
function neg(a) { return p(-a.x, -a.y); }
function dot(a, b) { return (a.x*b.x)+(a.y*b.y); }
function add(a, b) { return p(a.x+b.x, a.y+b.y); }
function sub(a, b) { return p(a.x-b.x, a.y-b.y); }
function rot90(a) { return p(-a.y, a.x); }
function rot90at(a, zer) 
{
	a = sub(a, zer);
	return p(-a.y+zer.x, a.x+zer.y);
}
function rot90at1(lin) { return l(lin.a, rot90at(lin.b, lin.a)); }
function rot90at2(lin) { return l(rot90at(lin.a, lin.b), lin.b); }
function trans(line, v) { 	return l(add(line.a, v), add(line.b, v)); }
function len(a) { return Math.sqrt(dot(a,a)); }
function scale(v, n) { 	return p (v.x*n, v.y*n); }
function proj(a, b) { return scale(b, dot(a,b)/dot(b,b)); }
function projlin(l1, l2) { 	return proj(trans(l1, neg(l1.a)).b, trans(l2, neg(l2.a)).b); }
function lmid(lin) { return p(avg2(lin.a.x, lin.b.x), avg2(lin.a.y, lin.b.y)); }
function omid(points)
{
	var x = 0;
	var y = 0;
	points.forEach(i => {x += i.x; y += i.y;});
	return p(x/points.length, y/points.length);
}
function otrans(points, v){ points.forEach(poi =>copyPoint(add(v,poi), poi));}
function copyPoint(from, to)
{
	to.x = from.x;
	to.y = from.y;
}
function omov(points, v) { points.forEach(i => copyPoint(add(i, v), i)); }
function angle(a, b) {return Math.acos(dot(a,b)/(len(a)*len(b))); }
function rotv(v, deg) { return irotv(v, Math.sin(deg), Math.cos(deg)); }
function irotv(v, sn, cs) { return p(cs*v.x - sn*v.y, sn*v.x + cs*v.y); }
function irotvat(v, sn, cs, zer) { return add(irotv(sub(v, zer), sn, cs), zer); }
function rotvat(v, deg, zer) { return add(irotv(sub(v, zer), Math.sin(deg), Math.cos(deg)), zer); }
function orot(points, center, deg)
{
	var sn = Math.sin(deg);
	var cs = Math.cos(deg);
	points.forEach(i => copyPoint(irotvat(i, sn, cs, center), i));
}
function orotc(points, deg)
{
	var sn = Math.sin(deg);
	var cs = Math.cos(deg);
	var center = omid(points);
	points.forEach(i => copyPoint(irotvat(i, sn, cs, center), i));
}

function oupdate(physpoints, miscpoints, hold, v)
{
	var phytarget = add(hold, v);
	var phyc = omid(physpoints);
	var handlel = l(phyc, hold);
	var forcel = l(hold, phytarget);
	var rotllen = len(sub(handlel.b, handlel.a)); 
	var rotl = rot90at2(handlel);
	var rotf = dot(sub(forcel.b, forcel.a), scale(sub(rotl.b, rotl.a), 1/rotllen)); 
	var dirl = l(phyc, phytarget);
	var projf = projlin(forcel, dirl);
	var points = physpoints.concat(miscpoints);
	orot(points, phyc, rotf * 0.0008);
	omov(points, scale(projf, 0.04));
}

function copyTo(from, to)
{
	to.a.x = from.a.x;
	to.a.y = from.a.y;
	to.b.x = from.b.x;
	to.b.y = from.b.y;
}

var lines = [];
const objects = [];
var sled;
var tphy;
var phytarget;

function crossAt(l1, l2)
{
	var as = l1.a;
	var ad = sub(l1.b, l1.a);
	var bs = l2.a;
	var bd = sub(l2.b, l2.a);
	var dx = bs.x - as.x;
	var dy = bs.y - as.y;
	var det = bd.x * ad.y - bd.y * ad.x;
	if(det == 0)
		return undefined;
	var u = (dy * bd.x - dx * bd.y) / det;
	//var v = (dy * ad.x - dx * ad.y) / det;
	return add(as, scale(ad, u));
}

function makeSkid(p, dir) { return l(add(p, dir), add(p, neg(dir))); }

function start()
{
	const canvas = document.getElementById('c');
	const div = document.getElementById('div');
	w = canvas.width;
	h = canvas.height;

	var ctx = canvas.getContext("2d");
	canvas.addEventListener('mousedown', function(e) { handleDown(canvas, e) });
	canvas.addEventListener('mouseup', function(e) { handleUp(canvas, e) });

	tphy = { points : [], hold : p(0,0)};
	objects.push(tphy);

	sled = { points : [p(50,50),p(75,100),p(100, 75)]};
	sled.heading = p(-5,-5);
	sled.sailpull = 0.5;
	sled.speed = 0;
	objects.push(sled);

	const render = (timestamp) => {
	  paint(ctx, timestamp);
	  window.requestAnimationFrame(render);
	};
	window.requestAnimationFrame(render);
}

var left = 0;
var right = 0;
var up = 0;
var down = 0;
var push = 0;

function rotsled(deg)
{
	deg = (sled.speed + 0.5) * deg * 0.005;
	var points = [];
	sled.points.forEach(p => points.push(p));
	var sledmid = omid(sled.points); 
	var heading = add(sledmid, sled.heading);
	points.push(heading);
	orot(points, omid(sled.points), deg);
	copyPoint(sub(heading, sledmid), sled.heading);	

}

function coloredline(a, b, c)
{
	var line = l(a,b);
	line.color = c;
	return line;
}


function psin(a) { return (Math.sin(a)/2.0) + 0.5; }
function pcos(a) { return (Math.cos(a)/2.0) + 0.5; }

function land(p)
{
    var x = (p.x / 3.0) / w * 10.0;
    var y = (p.y / 3.0) / w * 10.0;
    var xy = x+y;
    var val = psin(xy+3.0*psin(x)+psin(y)+psin(xy/10.0)*10.0);
    return val *w/10.0;
}


function sledIncline()
{
	var sledmid = omid(sled.points); 
	var heightAt = land(sledmid); 
	var step = add(sledmid, scale(sled.heading, 1/len(sled.heading) ));
		debStep = add(sledmid, scale(sled.heading, 25/len(sled.heading)));
	shaderDeb = [debStep.x/w * 10.0, debStep.y/w* 10.0];
	var stepHeight = land(step) - heightAt; 
	return Math.atan(stepHeight);
}


function sledspeedv() 
{
 	var sca = (sled.speed/len(sled.heading));
 	return scale(sled.heading, sca); 
}



function movsled(speedinc)
{
	if(Math.abs(sled.speed) < 0.01)
		sled.speed = 0;
	sled.speed *= 0.995;
	sled.speed += speedinc/280;
	var incline = sledIncline();
	sled.speed += -Math.sin(incline)/10.0;

	var speedv = sledspeedv();
	speedv = scale(speedv,  Math.cos(incline));
	otrans(sled.points, speedv);
}

function update()
{
	var wind = p(0,-15);

	if(left == 1)  { rotsled(-1);	}
	if(up == 1)    { sled.sailpull += 0.01;	}
	if(right == 1) { rotsled(1);	}
	if(down == 1)  { sled.sailpull -= 0.01;	}
	var phyc = omid(tphy.points);
	var holdp = tphy.hold;
	var handlel = coloredline(phyc, holdp, "red");
	lines.push(handlel);
	var force = scale(sub(wind, sledspeedv()), 0.23);

	sled.sailpull = sled.sailpull < 0 ? 0 : sled.sailpull > 1 ? 1 :  sled.sailpull;

	var normalHeading =  rotv(sled.heading, (Math.PI/2));
	var sailsign = Math.sign(dot(force, normalHeading));
	var sailangle = Math.PI*sled.sailpull;
	var windangle = angle(sled.heading, force);
	sailangle = sailangle > windangle ? sailangle : windangle;
	shaderSailAngle = sailsign*sailangle;
	var sailv = rotv(sled.heading, sailsign*sailangle);
	var sailforcev = rotv(sailv, sailsign*(Math.PI/2));
	var projv = proj(force, sailforcev);
	var speedinc = dot(projv, sled.heading);
	movsled(speedinc);

	var sledmid = omid(sled.points); 
	var projforce = l(sledmid, add(sledmid, scale(projv,10)));
	projforce.color = "red";
	lines.push(projforce);
	var mast = add(sledmid, scale(sled.heading, 2));
	var sail = l(mast, add(mast, scale(sailv, 7)));
	sail.color = "orange";
	lines.push(sail);

	sled.points
		.map(po => makeSkid(po, sled.heading))
		.forEach(sl => lines.push(sl));
	lines.push(coloredline(sledmid, add(sledmid , scale(sled.heading, speedinc)), "green"));

}


function drawline(ctx, l)
{
	ctx.strokeStyle = l.color != undefined ? l.color : "#000000";
	ctx.beginPath();
    ctx.moveTo(l.a.x, l.a.y);
    ctx.lineTo(l.b.x, l.b.y);
    ctx.stroke();
}

function drawobj(ctx, o)
{
	if(o.points.length > 0)
	{
		ctx.strokeStyle = l.color != undefined ? l.color : "#000000";
		ctx.beginPath();
		var first = o.points[0];
	    ctx.moveTo(first.x, first.y);
	    o.points.forEach(i => ctx.lineTo(i.x, i.y));
	    ctx.lineTo(first.x, first.y);
	    ctx.stroke();
	}
}

function paint(ctx, timestamp)
{
	var checkersize = 150;
	update();
	var sledmid = omid(sled.points); 
	shaderPos = [sledmid.x/w * 10.0, sledmid.y/w* 10.0];
	shaderAngle =Math.atan2(sled.heading.x, sled.heading.y); 
	var xtrans = w/2-sledmid.x;
	var ytrans = h/2-sledmid.y;
	var xoff = xtrans % checkersize;
	xoff = xoff < 0 ? xoff + checkersize : xoff;
	var xmod = Math.floor(xtrans / checkersize);
	var yoff = ytrans % checkersize;
	yoff = yoff < 0 ? yoff + checkersize : yoff;
	var ymod = Math.floor(ytrans / checkersize);
	for(var i = -1; i < w/checkersize + 1; i++)
		for(var j = -1; j < h/checkersize +1; j++)
		{
			var colorSwitch = (i + j + xmod + ymod);
			colorSwitch = Math.abs(colorSwitch % 2) ;
			ctx.fillStyle = (colorSwitch == 1) ? "#DDDDDD" : "#EEEEEE";
			ctx.fillRect(xoff + i*checkersize, yoff + j*checkersize, checkersize, checkersize);
		}
	ctx.translate(xtrans, ytrans);
	lines.forEach(i => drawline(ctx, i));
	lines = [];
	objects.forEach(i => drawobj(ctx, i));
	ctx.resetTransform();
}

function dragstart(x, y, left)
{
	if(left)
	{
		tphy.hold = p(x,y);
		phytarget = undefined;
	}
	else
	{
		tphy.points.push(p(x,y));
	}
}

function dragstop(x, y, left)
{
	if(left)
	{
		phytarget = p(x,y);
	}
}


function handleDown(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    dragstart(x, y, event.button == 0);
}

function handleUp(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    dragstop(x, y, event.button == 0);
}

document.addEventListener("keydown", event => {
var pref = true;
if(event.keyCode == 37) //left;
	left = 1;
else if(event.keyCode == 38) //up;
	up = 1;
else if(event.keyCode == 39) //right;
	right = 1;
else if(event.keyCode == 40) //down;
	down = 1 ;
else if(event.keyCode == 32) //space;
	push = 1 ;
else
	pref = false;
if(pref)
  event.preventDefault();
});
document.addEventListener("keyup", event => {
var pref = true;
if(event.keyCode == 37) //left;
	left = 0;
else if(event.keyCode == 38) //up;
	up = 0;
else if(event.keyCode == 39) //right;
	right = 0;
else if(event.keyCode == 40) //down;
	down = 0 ;
else if(event.keyCode == 32) //space;
	push = 0 ;
  event.preventDefault();
});

window.onload = start;