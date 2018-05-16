//Variables
const VERMAX = 20;
var curveType;
var vertices = new Array(VERMAX);
var polys = [];
var verI;
var slices;
// x,y,z for calculation.
var x = [];
var y = [];
var z = [];
//dragging
var mouseX;
var mouseY;
var ccc;


//scene camera and renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(90, 2, 0.1, 1000);
camera.position.z = 250;
var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(1000, 500);

//materials
var pointMaterial = new THREE.PointsMaterial();
pointMaterial.color = new THREE.Color("rgb(255, 255,0)");
pointMaterial.size = 3;
var lineMaterial = new THREE.LineBasicMaterial({
  color: 0xffff00
});
lineMaterial.linewidth = 3;
var meshMaterial = new THREE.MeshDepthMaterial();
meshMaterial.wireframe = true;

//Objects
var pointGeo = new THREE.Geometry();
pointGeo.vertices = vertices;
var points = new THREE.Points(pointGeo, pointMaterial);
var axisGeo = new THREE.Geometry();
axisGeo.vertices.push(new THREE.Vector3(0, 250, 0));
axisGeo.vertices.push(new THREE.Vector3(0, -250, 0));
var axis = new THREE.Line(axisGeo, lineMaterial);
var surface = new THREE.Geometry();
var surfMesh = new THREE.Mesh(surface, meshMaterial);


//UI definition
var canvas = document.getElementById('canvasDiv').appendChild(renderer.domElement);
var options = document.getElementById('options');
var drawButton = document.getElementById('draw');
var outputButton = document.getElementById("output");
output.onclick = outfunc;
document.getElementById("checkPlanarity").addEventListener('click',checkPlanarity);
var rad = document.getElementsByName("method");
rad[0].onclick = function() {
  initDrawing("rev");
};
rad[1].onclick = function() {
  initDrawing("ext");
};
rad[2].onclick = function() {
  initDrawing("swp");
};

function render() {
  renderer.render(scene, camera);
}

function isCoplain([a,b,c,d]){
  var v1 = a.clone().sub(b);
  var v2 = b.clone().sub(c);
  var v3 = c.clone().sub(d);
  var array = v1.toArray().concat(v2.toArray()).concat(v3.toArray());
  var m = new THREE.Matrix3();
  m.fromArray(array);
  if(Math.abs(m.determinant())<0.000000000001) return true;
  else return false;
}

function checkPlanarity(){
  makeOriFace(density + 1, density + 1);
  var coCount=0;
  for (var i = 0; i < faces.length; i++) {
    if(isCoplain(faces[i])) coCount++;
  }
  console.log(coCount + " of " + faces.length + " faces are on the same plain");
}
function makeOriFace(r, col) {
  // construct faces in a rectangular mesh
  faces = [];
  for (i = 0; i < col - 1; i++) {
    for (j = 0; j < r - 1; j++) {
      a = j + i * r;
      b = j + (i + 1) * r;
      c = b + 1;
      d = a+1;
      temp = [surface.vertices[a].clone(),
        surface.vertices[b].clone(),
        surface.vertices[c].clone(),
        surface.vertices[d].clone()];
      faces.push(temp);
    }
  }
}

function addDots(e) {
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  var z = 0;
  vertices[verI].set(x, y, z);
  verI++;
  pointGeo.verticesNeedUpdate = true;
  scene.add(points);
  render();
}

function rotateStart(e) {
  mouseX = e.pageX - canvas.offsetLeft - 500;
  mouseY = 250 - (e.pageY - canvas.offsetTop);
  canvas.addEventListener("mousemove", rotating);
}

function rotating(e) {
  var x = e.pageX - canvas.offsetLeft - 500;
  var y = 250 - (e.pageY - canvas.offsetTop);
  delX = (x - mouseX) * Math.PI * 2 / 1000;
  delY = (y - mouseY) * Math.PI * 2 / 1000;
  mouseX = x;
  mouseY = y;
  surfMesh.rotation.x -= delY;
  surfMesh.rotation.y += delX;
  render();
}

function rotateEnd(e) {
  canvas.removeEventListener("mousemove", rotating);
}

function initDrawing(type) {
  scene.remove(surfMesh);
  scene.remove(axis);
  scene.remove(points);
  render();
  canvas.removeEventListener("mousedown", rotateStart);
  canvas.removeEventListener("mouseup", rotateEnd);
  while (options.hasChildNodes()) {
    options.removeChild(options.lastChild);
  }
  function addOptions(opts) {
    for (i = 0; opts[i] != undefined; i++) {
      options.appendChild(document.createTextNode(opts[i]["name"]));
      var opt = document.createElement("input");
      opt.id = opts[i]["name"];
      opt.value = opts[i]["default"];
      options.appendChild(opt);
    }
  }
  surface = new THREE.Geometry();
  surfMesh = new THREE.Mesh(surface, meshMaterial);
  var opts = [];
  for (var i = 0; i < VERMAX; i++) {
    vertices[i] = new THREE.Vector3(10000000, 0, 0);
  }
  polys = [];
  x=[];
  y=[];
  z=[];
  verI = 0;
  opts[0] = {
    "name": "Density",
    "default": 30
  };
  canvas.addEventListener("click", addDots);
  if (type == "rev") {
    scene.add(axis);
    opts[1] = {
      "name": "Slices",
      "default": 10
    };
  } else if (type == "ext") {
    opts[1] = {
      "name": "depth",
      "default": 100
    };
    opts[2] = {
      "name": "dstep",
      "default": 20
    };
  } else if (type == "swp") {
    opts[1] = {
      "name": "distance",
      "default": 150
    };
    opts[2] = {
      "name": "acoe",
      "default": -0.01
    };
    opts[3] = {
      "name": "ystep",
      "default": 10
    };
  }
  addOptions(opts);
  render();
  drawButton.onclick = function() {
    draw(type);
  };
  document.getElementById("drawClosed").onclick=function (){
    ccc = true;
    draw(type);
    ccc =false;
  };
}

function draw(type) {
  if (verI < 2) {
    return -1;
  }
  coe = options.childNodes;
  for (i = 0; coe[i] instanceof HTMLInputElement; i++) {
    if (isNaN(coe[i].value)) return -1;
  }
  canvas.removeEventListener("click", addDots);
  curveType = parseInt(document.querySelector('input[name="curve"]:checked').value);
  density = parseInt(document.getElementById('Density').value);
  polygon(type);
  if (curveType == 0) {
    //means Bezier
    for (ui = 0; ui < density + 1; ui++) {
      var u = 1 / density * ui;
      var coeU = [];
      coeU[0] = calBezierCoe(u, verI);
      for (vi = 0; vi < density + 1; vi++) {
        var v = 1 / density * vi;
        var coeV = [];
        var temp = calBezierCoe(v, slices);
        for (i = 0; temp[i] != undefined; i++) {
          coeV[i] = [];
          coeV[i][0] = temp[i];
        }
        tx = matrixMul(matrixMul(coeU, x), coeV);
        ty = matrixMul(matrixMul(coeU, y), coeV);
        tz = matrixMul(matrixMul(coeU, z), coeV);
        surface.vertices.push(new THREE.Vector3(tx[0], ty[0], tz[0]));
      }
    }
    connect(density + 1, density + 1);
  } else if (curveType == 1) {
    //means b-Spline
    var uVec = [
      []
    ];
    var vVec = [
      []
    ];
    var coeU = [
      [-1, 3, -3, 1],
      [3, -6, 3, 0],
      [-3, 0, 3, 0],
      [1, 4, 1, 0]
    ]; //coefficient for Cubic B-Spline;
    var coeV = [
      [-1, 3, -3, 1],
      [3, -6, 0, 4],
      [-3, 3, 3, 1],
      [1, 0, 0, 0]
    ]; //coefficient for Cubic B-Spline;
    var subx = [];
    var suby = [];
    var subz = [];
    if (type=="ext" || type =="swp"){
      row = slices-3;
      if(ccc==true) col = verI;
      else col = verI-3;

    }else if (type =="rev"){
      if(ccc==true){
        col = verI;
        row = slices;
      }else{
        col = verI-3;
        row = slices-3;
      }
    }
    for (j = 0; j <col; j++) {
      for (i = 0; i < row; i++) {
        for (k = 0; k < 4; k++) {
          subx[k] = [];
          suby[k] = [];
          subz[k] = [];
          for (l = 0; l < 4; l++) {
            subx[k][l] = x[(k + j)%verI][(l + i)%slices];
            suby[k][l] = y[(k + j)%verI][(l + i)%slices];
            subz[k][l] = z[(k + j)%verI][(l + i)%slices];
          }
        }
        for (ui = 0; ui < density + 1; ui++) {
          u = 1 / density * ui;
          for (m = 0; m < 4; m++) uVec[0][3 - m] = Math.pow(u, m);
          for (vi = 0; vi < density + 1; vi++) {
            v = 1 / density * vi;
            for (n = 0; n < 4; n++) {
              vVec[3 - n] = [];
              vVec[3 - n][0] = Math.pow(v, n);
            }
            tx = 1 / 36 * matrixMul(matrixMul(matrixMul(matrixMul(uVec, coeU), subx), coeV), vVec);
            ty = 1 / 36 * matrixMul(matrixMul(matrixMul(matrixMul(uVec, coeU), suby), coeV), vVec);
            tz = 1 / 36 * matrixMul(matrixMul(matrixMul(matrixMul(uVec, coeU), subz), coeV), vVec);
            index = ((density+1)*j+ui)*(density+1)*row+(density+1)*i+vi;
            surface.vertices[index]=new THREE.Vector3(tx, ty, tz);
          }
        }
      }
    }
    connect(row*(density+1),col*(density+1));
  }
  scene.add(surfMesh);
  render();
  canvas.addEventListener("mousedown", rotateStart);
  canvas.addEventListener("mouseup", rotateEnd);
}

function polygon(type) {
  if (curveType==0&&ccc==true){
    var temp=vertices[0].clone().add(vertices[verI-1]).divideScalar(2);
    vertices.splice(0,0,temp);
    verI++;
    vertices[verI]=vertices[0].clone();
    verI++;
  }
  if (type == "rev") {
    slices = parseInt(document.getElementById('Slices').value);
    var ang = Math.PI * 2 / slices;
    // Calculating polygon points
    for (i = 0; i < verI * slices; i++) {
      polys.push(vertices[i % verI].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang * Math.floor(i / verI)));
    }
    if(curveType==0&&ccc==true){
      var temp =[];
      for (i = 0; i < verI; i++){
        temp[i]=polys[i].clone().add(polys[i+(slices-1)*verI]).divideScalar(2);
      }
      polys=temp.concat(polys);
      slices++;
      for (var i = 0; i < verI; i++) {
        polys[verI*slices+i]=polys[i].clone();
      }
      slices++;
    }
  }
  else if (type == "ext"){
    depth = parseInt(document.getElementById("depth").value);
    dstep = parseInt(document.getElementById("dstep").value);
    slices = parseInt(depth/dstep)+1;
    for (i=0;i<slices;i++){
      for (j=0;j<verI;j++){
        temp = vertices[j].clone();
        temp.z+=dstep*i;
        polys.push(temp);
      }
    }
  }
  else if (type == "swp"){
    acoe = parseFloat(document.getElementById("acoe").value);
    ystep = parseInt(document.getElementById("ystep").value);
    distance = parseInt(document.getElementById("distance").value);
    var count = parseInt(distance / ystep);
    slices = count +1;
    for (i = 0; i < slices; i++) {
      for(j=0;j<verI;j++){
        var td = distance + 2 * (vertices[0].y - vertices[j].y);
        var nx = vertices[j].x;
        var ny = vertices[j].y + td * i / count;
        var nz = vertices[j].z + acoe * (td * i / count * (td * i / count - td));
        temp = new THREE.Vector3(nx,ny,nz);
        polys.push(temp);
      }
    }
  }

  toXYZ(verI,slices);
  function toXYZ(r, c) {
    for (i = 0; i < r; i++) {
      x[i] = [];
      y[i] = [];
      z[i] = [];
      for (j = 0; j < c; j++) {
        x[i][j] = polys[j * verI + i].x;
        y[i][j] = polys[j * verI + i].y;
        z[i][j] = polys[j * verI + i].z;
      }
    }
  }
}
function connect(r, col) {
  // construct faces in a rectangular metsh
  for (i = 0; i < col - 1; i++) {
    for (j = 0; j < r - 1; j++) {
      a = j + i * r;
      b = j + (i + 1) * r;
      c = b + 1;
      surface.faces.push(new THREE.Face3(a, b, c));
      a = j + 1 + (i + 1) * r;
      b = j + 1 + i * r;
      c = b - 1;
      surface.faces.push(new THREE.Face3(a, b, c));
    }
  }
}


function outfunc() {
  var str = 'OFF\n';
  var nv = surface.vertices.length;
  var nf = surface.faces.length
  str += nv + " " + nf + "\n";
  for (i = 0; i < nv; i++) {
    str += surface.vertices[i].x + " ";
    str += surface.vertices[i].y + " ";
    str += surface.vertices[i].z + "\n";
  }
  for (i = 0; i < nf; i++) {
    str += 3 + " ";
    str += surface.faces[i].a + " ";
    str += surface.faces[i].b + " ";
    str += surface.faces[i].c + "\n";
  }
  doSave(str,"text/latex", "output.off");
}

function doSave(value, type, name) {
    var blob;
    if (typeof window.Blob == "function") {
        blob = new Blob([value], {type: type});
    } else {
        var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
        var bb = new BlobBuilder();
        bb.append(value);
        blob = bb.getBlob(type);
    }
    var URL = window.URL || window.webkitURL;
    var bloburl = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    if ('download' in anchor) {
        anchor.style.visibility = "hidden";
        anchor.href = bloburl;
        anchor.download = name;
        document.body.appendChild(anchor);
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
        document.body.removeChild(anchor);
    } else if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, name);
    } else {
        location.href = bloburl;
    }
}

function calBezierCoe(u, d, w) {
  //Function to calculate coefficient for different u
  //u: current ux
  //d: number of Dots
  //w: weight
  if (w == undefined) {
    w = [];
    for (i = 0; i < d; i++) {
      w[i] = 1;
    }
  }
  var c = [];
  var sum = 0;
  for (i = 0; i < d; i++) {
    c[i] = (fact(d - 1) / fact(i) / fact(d - 1 - i)) * Math.pow((1 - u), d - 1 - i) * Math.pow(u, i) * w[i];
    sum += c[i];
  }
  for (i = 0; i < d; i++) c[i] = c[i] / sum;
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
