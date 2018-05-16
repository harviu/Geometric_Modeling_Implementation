//Variables
var vertices = [];
var verI = 0;
var p = [];
var np = 0;
var xs = []; //x coordinate for p
var ys = []; //y coordinate for p
var step;
var ax;
var ay;
var az;
var g;

var scene = new THREE.Scene();

var sg = new THREE.Geometry();

var camera = new THREE.PerspectiveCamera(90, 2, 0.1, 1000);
camera.position.z = 250;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(1000, 500);

var pointMaterial = new THREE.PointsMaterial();
pointMaterial.color = new THREE.Color("rgb(255, 255,0)");
pointMaterial.size = 3;

var lineMaterial = new THREE.LineBasicMaterial({
  color: 0xffff00
});
lineMaterial.linewidth = 3;

var meshMaterial = new THREE.MeshDepthMaterial();
meshMaterial.wireframe = true;
var mesh = new THREE.Mesh();

camera.position.z = 250;

function animateY() {
  ay=requestAnimationFrame(animateY);
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}

function animateX() {
  ax=requestAnimationFrame(animateX);
  mesh.rotation.x += 0.01;
  renderer.render(scene, camera);
}
function animateZ() {
  az=requestAnimationFrame(animateZ);
  mesh.rotation.z += 0.01;
  renderer.render(scene, camera);
}


//UI definition
var rad = document.getElementsByName("method");
rad[0].onclick = revolution;
rad[1].onclick = extrusion;
rad[2].onclick = sweep;
var canvas = document.getElementById('canvasDiv').appendChild(renderer.domElement);
var options = document.getElementById('options');
var draw = document.getElementById('draw');
var step = document.createElement("input");
var output = document.getElementById("output");
output.onclick = outfunc;

function clear() {
  vertices = [];
  verI = 0;
  p = [];
  np = 0;
  xs = []; //x coordinate for p
  ys = []; //y coordinate for p
  cancelAnimationFrame( ax );
  cancelAnimationFrame( ay );
  cancelAnimationFrame( az );
  scene = new THREE.Scene();
  sg = new THREE.Geometry();
  g = new THREE.Geometry();
  while (options.hasChildNodes()) {
    options.removeChild(options.lastChild);
  }
  step = document.createElement("input");
  step.id = 'step';
  step.value = '0.1';
  options.appendChild(document.createTextNode("U Step: "));
  options.appendChild(step);
  renderer.render(scene, camera);
}

function addDots(e) {
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  var z = 0;
  xs[verI] = [];
  ys[verI] = [];
  xs[verI][0] = x;
  ys[verI][0] = y;
  vertices[verI] = new THREE.Vector3(x, y, z);
  verI++;
  var geometry = new THREE.Geometry();
  geometry.vertices.push(vertices[verI - 1]);
  var point = new THREE.Points(geometry, pointMaterial);
  scene.add(point);
  renderer.render(scene, camera);
}



function revolution() {
  clear();
  canvas.addEventListener("click", addDots);
  axisGeo = new THREE.Geometry();
  axisGeo.vertices.push(new THREE.Vector3(0, 250, 0));
  axisGeo.vertices.push(new THREE.Vector3(0, -250, 0));
  axis = new THREE.Line(axisGeo, lineMaterial);
  scene.add(axis);
  renderer.render(scene, camera);

  var t = document.createTextNode("Slices: ");
  var sl = document.createElement("input");
  sl.id = 'slices';
  sl.value = '5';
  options.appendChild(t);
  options.appendChild(sl);
  draw.onclick = drawRev;
}

function extrusion() {
  clear();
  canvas.addEventListener("click", addDots);
  var t = document.createTextNode("Depth: ");
  var depth = document.createElement("input");
  depth.id = 'depth';
  depth.value = '100';
  var dstep = document.createElement("input");
  dstep.id = "dstep";
  dstep.value = '10';
  options.appendChild(t);
  options.appendChild(depth);
  options.appendChild(document.createTextNode("D Step: "));
  options.appendChild(dstep);
  draw.onclick = drawExt;
}

function sweep() {
  clear();
  canvas.addEventListener("click", addDots);

  options.appendChild(document.createTextNode("Distance: "));
  var distance = document.createElement("input");
  distance.value = '150';
  distance.id = 'distance';
  options.appendChild(distance);

  options.appendChild(document.createTextNode("A: "));
  var acoe = document.createElement("input");
  acoe.value = '-0.01';
  acoe.id = 'acoe';
  options.appendChild(acoe);

  options.appendChild(document.createTextNode("Y Step: "));
  var ystep = document.createElement("input");
  ystep.value = '10';
  ystep.id = 'ystep';
  options.appendChild(ystep);

  draw.onclick = drawSweep;
}

function drawSweep() {
  redraw();
  var acoe = parseFloat(document.getElementById('acoe').value);
  var ystep = parseFloat(document.getElementById('ystep').value);
  var distance = parseFloat(document.getElementById('distance').value);
  step = parseFloat(document.getElementById('step').value);
  if (step <= 0 || step >= 1 || isNaN(step)) {
    alert("The step of U should be greater between 0 and 1")
  } else if (isNaN(acoe)) {
    alert("A coefficient should be valid")
  } else if (distance < 10 || isNaN(distance)) {
    alert("The distance should be greater than 10")
  } else if (ystep > distance || isNaN(ystep)) {
    alert("The ystep should not be greater than distance")
  } else if (verI < 2) {
    alert("There should be at least two dots");
  }else {
    canvas.removeEventListener("click", addDots);
    bezier();
    g = new THREE.Geometry();
    for (i = 0; i < np; i++) {
      g.vertices.push(p[i]);
    }
    sg.merge(g);
    var max=0;
    for (i=0;i<np;i++){
      if (p[i].y>p[max].y) max=i;
    }
    var count = distance/ystep;

    for (i = 1; i < count+1; i ++) {
      g = new THREE.Geometry();
      for (j = 0; j< np; j++) {
        var td=distance+2*(p[max].y-p[j].y);
        var nx=p[j].x;
        var ny=p[j].y+td*i/count;
        var nz=p[j].z+acoe*(td*i/count*(td*i/count-td));
        g.vertices.push(new THREE.Vector3(nx,ny,nz));
      }
      sg.merge(g);
    }
    for (i = 0; i < distance/ystep; i++) {
      for (j = 0; j < np - 1; j++) {
        a = j + i * np;
        b = j + (i + 1) * np;
        if (b > distance/ystep * np - 1) {
          continue;
        }
        c = b + 1;
        sg.faces.push(new THREE.Face3(a, b, c));
      }
      for (j = 1; j < np; j++) {
        a = j + i * np;
        b = j + (i - 1) * np;
        if (b < 0) {
          continue;
        }
        c = b - 1;
        sg.faces.push(new THREE.Face3(a, b, c));
      }
    }
    mesh.geometry = sg;
    mesh.material = meshMaterial;
    scene.add(mesh);
    animateY();
  }
}

function drawExt() {
  redraw();
  var depth = parseInt(document.getElementById('depth').value);
  var dstep = parseInt(document.getElementById('dstep').value);
  step = parseFloat(document.getElementById('step').value);
  if (step <= 0 || step >= 1 || isNaN(step)) {
    alert("The step of U should be greater between 0 and 1")
  } else if (depth < 10 || isNaN(depth)) {
    alert("The depth should be greater than 10")
  } else if (dstep > depth || isNaN(dstep)) {
    alert("The dstep should not be greater than depth")
  } else if (verI < 2) {
    alert("There should be at least two dots");
  }else {
    canvas.removeEventListener("click", addDots);
    bezier();
    g = new THREE.Geometry();
    for (i = 0; i < np; i++) {
      g.vertices.push(p[i]);
    }
    sg.merge(g);

    for (i = 0; i < depth; i += dstep) {
      g.translate(0, 0, dstep);
      sg.merge(g);
    }

    for (i = 0; i < depth / dstep; i++) {
      for (j = 0; j < np - 1; j++) {
        a = j + i * np;
        b = j + (i + 1) * np;
        if (b > depth / dstep * np - 1) {
          continue;
        }
        c = b + 1;
        sg.faces.push(new THREE.Face3(a, b, c));
      }
      for (j = 1; j < np; j++) {
        a = j + i * np;
        b = j + (i - 1) * np;
        if (b < 0) {
          continue;
        }
        c = b - 1;
        sg.faces.push(new THREE.Face3(a, b, c));
      }
    }
    mesh.geometry = sg;
    mesh.material = meshMaterial;
    scene.add(mesh);
    animateX();
  }
}

function drawRev() {
  redraw();
  var slices = parseInt(document.getElementById('slices').value);
  step = parseFloat(document.getElementById('step').value);
  if (slices < 3 || isNaN(slices)) {
    alert("The number of slices should be greater than 3");
  } else if (step <= 0 || step >= 1 || isNaN(step)) {
    alert("The step of U should be greater between 0 and 1")
  } else if (verI < 2) {
    alert("There should be at least two dots");
  } else {
    canvas.removeEventListener("click", addDots);
    if (bezier() == 0) {
      for (i = 0; i < np; i++) {
        g.vertices.push(p[i]);
      }
      sg.merge(g);

      for (i = 1; i < slices; i++) {
        g.rotateY(2 * Math.PI / slices);
        sg.merge(g);
      }
      for (i = 0; i < slices; i++) {
        for (j = 0; j < np - 1; j++) {
          a = j + i * np;
          b = j + (i + 1) * np;
          if (b > slices * np - 1) {
            b -= slices * np;
          }
          c = b + 1;
          sg.faces.push(new THREE.Face3(a, b, c));
        }
        for (j = 1; j < np; j++) {
          a = j + i * np;
          b = j + (i - 1) * np;
          if (b < 0) {
            b += slices * np;
          }
          c = b - 1;
          sg.faces.push(new THREE.Face3(a, b, c));
        }
      }
      mesh = new THREE.Mesh();
      console.log(sg);
      mesh.geometry = sg;
      mesh.material = meshMaterial;
      scene.add(mesh);
      animateY();
    } else {
      alert("Overlap Occured");
    }
  }
}

function redraw(){
  scene.remove(mesh);
  g=new THREE.Geometry();
  sg=new THREE.Geometry();
  cancelAnimationFrame( az );
  cancelAnimationFrame( ax );
  cancelAnimationFrame( ay );
  p=[];
  np=0;
}

function bezier() {
  //Calculate Bezier curve
  var s;
  var rc = 0;
  for (u = 0; u <= 1; u += step) {
    coe = calBezierCoe(u, verI);
    x = matrixMul(coe, xs);
    y = matrixMul(coe, ys);
    if (u == 0) {
      if (x < 0) s = -1;
      else s = 1;
    }
    if (s * x < 0) {
      rc = -1;
    }
    p[np] = new THREE.Vector3(x[0][0], y[0][0], 0);
    np++;
    var geometry = new THREE.Geometry();
    geometry.vertices.push(p[np - 1]);
    var point = new THREE.Points(geometry, pointMaterial);
    scene.add(point);
  }
  renderer.render(scene, camera);
  return rc;
}

function outfunc(){
  var str='';
  var nv=sg.vertices.length;
  var nf=sg.faces.length
  str+=nv+" "+nf+"\n";
  for (i=0;i<nv;i++){
    str+=sg.vertices[i].x+" ";
    str+=sg.vertices[i].y+" ";
    str+=sg.vertices[i].z+"\n";
  }
  for (i=0;i<nf;i++){
    str+=3+" ";
    str+=sg.faces[i].a+" ";
    str+=sg.faces[i].b+" ";
    str+=sg.faces[i].c+"\n";
  }
  console.log(str);
}

function calBezierCoe(u, d, w) {
  //Function to calculate coefficient for different u
  if (w == undefined) {
    w = [];
    for (i = 0; i < d; i++) {
      w[i] = 1;
    }
  }
  var c = [
    []
  ];
  var sum = 0;
  for (i = 0; i < d; i++) {
    c[0][i] = (fact(d - 1) / fact(i) / fact(d - 1 - i)) * Math.pow((1 - u), d - 1 - i) * Math.pow(u, i) * w[i];
    sum += c[0][i];
  }
  for (i = 0; i < d; i++) c[0][i] = c[0][i] / sum;
  return c;
}

function matrixMul(matrix1, matrix2) {
  //function for matrix multiplication
  if (matrix1[0].length != matrix2.length) {
    return false;
  }
  var ans = [];
  for (r1 = 0; r1 < matrix1.length; r1++) {
    ans[r1] = [];
    for (c2 = 0; c2 < matrix2[0].length; c2++) {
      ans[r1][c2] = 0;
      for (r2 = 0; r2 < matrix1[0].length; r2++) {
        ans[r1][c2] += matrix1[r1][r2] * matrix2[r2][c2];
      }
    }
  }
  return ans;
}

function fact(num) {
  //factorial
  if (num < 0)
    return false;
  else if (num == 0)
    return 1;
  else
    return (num * fact(num - 1));
}
