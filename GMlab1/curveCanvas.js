var c=document.getElementById("curveCanvas");
var ctx=c.getContext("2d");
var xs=[]; //x coordinate for p
var ys=[]; //y coordinate for p
var deg=document.getElementById("numDots").value; //degree for the curve
var index=0;
var dragged=-1; //the dot being dragged 
var dragging;
var checkedValue=document.querySelector('.curveChoice:checked').value;  //checked curve to use
var addx=[];
var addy=[]; //points for composition Bezier
var addi=0;  //index for composition Bezier
var drawn=false;
const subCount=5; //times for subdivision
const step=0.01; //step for u increment


//Actions when new curve method chosen
rad=document.getElementsByClassName("curveChoice");
for(i=0;i<rad.length;i++){
	rad[i].onclick=function(){
		checkedValue = document.querySelector('.curveChoice:checked').value;
		updateDotWeight();
		if(drawn){
			ctx.clearRect(0, 0, c.width, c.height);
			resetToDrag();
		}
	};
}

//Button for new New Bezier
nbButton=document.getElementById("nbButton");
nbButton.addEventListener('click',function(){
	if(checkedValue=="bezier"||checkedValue=="subBezier"){
		if(this.innerHTML=="Add new Bezier"){
			alert("Choose the starting point on old Bezier");
			c.removeEventListener("mousemove",moveDots);
			c.removeEventListener("mouseup",dropDots);
			this.innerHTML="New Dots";
		}
		else if(this.innerHTML=="New Dots"){
			if(dragged==0 || dragged==deg-1){
				c.removeEventListener("mousedown",chooseDots);
				addx[addi]=xs[dragged];
				addy[addi]=ys[dragged];
				addi++;
				alert("Choose the dots for new Bezier");
				c.addEventListener("click",addMoreDots);
				this.innerHTML="Composite";
			}
			else alert("Invalid Starting Point");
		}
		else if(this.innerHTML=="Composite") {
			c.removeEventListener("click",addMoreDots);
			if(addi>=2){
				// spine the new Bezier to enforce C1
				var dir;
				if(dragged==0){
					dy=ys[0][0]-ys[1][0];
					dx=xs[0][0]-xs[1][0];
				}
				else{
					dy=ys[deg-1][0]-ys[deg-2][0];
					dx=xs[deg-1][0]-xs[deg-2][0];
				}
				dir=trueTan(dy,dx);
				dragged=-1;
				
				dy=addy[1][0]-addy[0][0];
				dx=addx[1][0]-addx[0][0];
				dir1=trueTan(dy,dx);
				var deltaDir=toDef(dir-dir1);
				
				for(i=1;i<addi;i++){
					var dis=Math.sqrt(Math.pow(addx[i][0]-addx[0][0],2)+Math.pow(addy[i][0]-addy[0][0],2));
					dy=addy[i][0]-addy[0][0];
					dx=addx[i][0]-addx[0][0];
					var preDir= toDef(trueTan(dy,dx)+deltaDir);
					
					addx[i][0]=addx[0][0]+Math.cos(preDir)*dis;
					addy[i][0]=addy[0][0]+Math.sin(preDir)*dis;
				}
				draw(checkedValue);
				for(i=0;i<addi;i++){
					ctx.fillRect(addx[i][0]-3, addy[i][0]-3, 6, 6);
				}
			}
			var x;
			var y;
			var coe //coefficient for Bezier	
			ctx.beginPath();
			ctx.moveTo(addx[0],addy[0]);
			for (u=0;u<=1+step;u+=step){
				coe=calBezierCoe(u,addi);
				x=matrixMul(coe,addx);
				y=matrixMul(coe,addy);
				ctx.lineTo(x,y);
			}
			ctx.stroke();
			this.innerHTML="Clear";
		}
		else{
			addx=[];
			addy=[]; //points for composition Bezier
			addi=0;
			ctx.clearRect(0, 0, c.width, c.height);
			dragging=-1;
			resetToDrag();
			this.innerHTML=="Add new Bezier"
		}
	}
	else{
		alert("This only works for Bezier Curve");
	}
});

//Button for Duplicate V
dupButton = document.getElementById("dupButton");
dupButton.addEventListener('click',function(){
	if(dragged!=-1){
		var x=[];
		x[0]=xs[dragged];
		var y=[];
		y[0]=ys[dragged];
		xs.splice(dragged,0,x);
		ys.splice(dragged,0,y);
		deg++;
	}
	draw(checkedValue);
});
	
//Slider Move
document.getElementById("numDots").addEventListener('change',function(){
	deg=document.getElementById("numDots").value;
	resetToAdd();
	updateDotWeight();
});


// function for adding Bezier
function addMoreDots(e){
	var x= e.pageX-c.offsetLeft;
	var y=e.pageY-c.offsetTop;
	addx[addi]=[];
	addy[addi]=[];
	addx[addi][0]=x;
	addy[addi][0]=y;
	ctx.fillRect(addx[addi]-3, addy[addi]-3, 6, 6);
	addi++;
}
/* functions for adding dots*/
c.addEventListener('click',addDots);
function addDots(e){
	var x= e.pageX-c.offsetLeft;
	var y=e.pageY-c.offsetTop;
	xs[index]=[];
	ys[index]=[];
	xs[index][0]=x;
	ys[index][0]=y;
	ctx.fillRect(xs[index]-3, ys[index]-3, 6, 6);
	index++;
	if(index==deg){
		resetToDrag();
	}

}

function updateDotWeight(){
	div=document.getElementById("weight");
	while (div.hasChildNodes()) {
		div.removeChild(div.lastChild);
	}
	if(checkedValue=='rBezier')
		for (i=0;i<deg;i++){
			var add = document.createElement("input");
			add.id="dot"+i;
			add.type="text";
			add.value="1";
			add.size="2";
			add.name="dotWeight";
			document.getElementById("weight").appendChild(add);
		}
}

function resetToDrag(){
		c.removeEventListener("click",addDots);
		c.addEventListener("mousedown",chooseDots);
		c.addEventListener("mousemove",moveDots);
		c.addEventListener("mouseup",dropDots);
		draw(checkedValue);
		nbButton.disabled=false;
		dupButton.disabled=false;
		drawn=true;
}

function resetToAdd(){
	ctx.clearRect(0, 0, c.width, c.height);
	xs=[];
	ys=[];
	index=0;
	c.addEventListener("click",addDots);
	c.removeEventListener("mousedown",chooseDots);
	c.removeEventListener("mousemove",moveDots);
	c.removeEventListener("mouseup",dropDots);
	nbButton.disabled=true;
	dupButton.disabled=true;
	drawn=false;
}

/* functions for dragging dots*/

function chooseDots(e){
	var x= e.pageX-c.offsetLeft;
	var y=e.pageY-c.offsetTop;
	for(i=0;i<deg;i++){
		if(xs[i][0]-10<=x&&xs[i][0]+10>=x&&ys[i][0]-10<=y&&ys[i][0]+10>=y){
			dragged=i;
			dragging=i;
			break;
		}
	}
}

function moveDots(e){
	var x= e.pageX-c.offsetLeft;
	var y=e.pageY-c.offsetTop;
	if(dragging>-1){
		xs[dragging][0]=x;ys[dragging][0]=y;
		draw(checkedValue);
	}
	
}
		
function dropDots(e){
	dragging=-1;
	draw(checkedValue);
}
/* functions for dragging dots end*/


function draw(curve){
	var x;
	var y;
	ctx.clearRect(0,0,c.width, c.height);
	for(i=0;i<deg;i++){
		ctx.fillRect(xs[i][0]-3, ys[i][0]-3, 6, 6);
	}
	if(dragged!=-1){
		ctx.fillStyle='red';
		ctx.fillRect(xs[dragged][0]-3, ys[dragged][0]-3, 6, 6);
		ctx.fillStyle='black';
	}
	if (curve=='bezier'){
		// draw a Bezier curve
		var coe //coefficient for Bezier	
		ctx.beginPath();
		ctx.moveTo(xs[0],ys[0]);
		for (u=0;u<=1+step;u+=step){
			coe=calBezierCoe(u,deg);
			x=matrixMul(coe,xs);
			y=matrixMul(coe,ys);
			ctx.lineTo(x,y);
		}
		ctx.stroke();
	}
	else if (curve=='bSpline'){
		//draw a B-Spline curve
		var uVec=[[]];
		var coe=[[-1,3,-3,1],[3,-6,3,0],[-3,0,3,0],[1,4,1,0]]; //coefficient for Cubic B-Spline;
		var subx=[];
		var suby=[];
		ctx.beginPath();
		for(j=1;j<deg-2;j++){
			for (k=0;k<4;k++){
				subx[k]=[];
				suby[k]=[];
				subx[k][0]=xs[k+j-1][0];
				suby[k][0]=ys[k+j-1][0];
			}
			for (u=0;u<=1+step;u+=step){
				for(i=0;i<4;i++)
					uVec[0][3-i]=Math.pow(u,i);
				x=1/6* matrixMul(matrixMul(uVec,coe),subx);
				y=1/6* matrixMul(matrixMul(uVec,coe),suby);
				if(u==0) ctx.moveTo(x,y);
				ctx.lineTo(x,y);
			}
		}
		ctx.stroke();
	}
	

	
	else if (curve=='subBezier'){
		var xVec=[];
		var yVec=[]; //x and y for subdivision
		for(i=0;i<deg;i++){
			xVec[i]=xs[i][0];
			yVec[i]=ys[i][0];
		}
		xVec=subdivideBezier(xVec,subCount);
		yVec=subdivideBezier(yVec,subCount);
		ctx.beginPath();
		ctx.moveTo(xVec[0],yVec[0]);
		for(i=0;i<=xVec.length;i++){
			ctx.lineTo(xVec[i],yVec[i]);
		}
		ctx.stroke();
	}
	else if(curve=='subBSpline'){
		var xVec=[];
		var yVec=[]; //x and y for subdivision
		var newDeg=deg;
		var subx=[];
		var suby=[];
		var coe=[[3,1,0],[1,3,0],[0,3,1],[0,1,3]];		
		for(i=0;i<deg;i++){
			xVec[i]=[];
			yVec[i]=[];
			xVec[i][0]=xs[i][0];
			yVec[i][0]=ys[i][0];
		}
		for(m=0;m<4;m++){
			var tempx=[];
			var tempy=[];
			var index=0;
			for(j=0;j<newDeg-2;j++){
				for (k=0;k<3;k++){
					subx[k]=[];
					suby[k]=[];
					subx[k][0]=xVec[k+j][0];
					suby[k][0]=yVec[k+j][0];
				}
				tx=matrixMul(coe,subx);
				ty=matrixMul(coe,suby);
				if(j==0){
					for(i=index;i<index+4;i++){
						tempx[i]=[];
						tempy[i]=[];
						tempx[i][0]=1/4*tx[i-index][0];
						tempy[i][0]=1/4*ty[i-index][0];
					}
					index+=4;
				}
				else{
					for(i=index;i<index+2;i++){
						tempx[i]=[];
						tempy[i]=[];
						tempx[i][0]=1/4*tx[i-index+2][0];
						tempy[i][0]=1/4*ty[i-index+2][0];
					}
					index+=2;
				}
			}
			xVec=tempx;
			yVec=tempy;
			newDeg=xVec.length;
		}
		ctx.beginPath();
		ctx.moveTo(xVec[0][0],yVec[0][0]);
		for(i=0;i<xVec.length;i++){
			ctx.lineTo(xVec[i][0],yVec[i][0]);
		}
		ctx.stroke();
	}
	else if(curve=="rBezier"){
		var coe	
		var w=[];
		var weight=document.getElementsByName("dotWeight");
		for(i=0;i<deg;i++) {
			if (isNaN(weight[i].value)) weight[i].value=1;
			w[i]=weight[i].value;
		}
		ctx.beginPath();
		ctx.moveTo(xs[0],ys[0]);
		for (u=0;u<=1+step;u+=step){
			coe=calBezierCoe(u,deg,w);
			x=matrixMul(coe,xs);
			y=matrixMul(coe,ys);
			ctx.lineTo(x,y);
		}
		ctx.stroke();
	}
}

//recurrence function for subdivide bezier
function subdivideBezier(vec, m){
	var poly1=[];
	var poly2=[];
	var newVec=[];
	if (m==1)
		return oneSubdivideBezier(vec,poly1,poly2);
	else{
		newVec=oneSubdivideBezier(vec,poly1,poly2);
		return subdivideBezier(newVec.slice(0,(newVec.length+1)/2),m-1).concat(
		subdivideBezier(newVec.slice((newVec.length+1)/2-1),m-1)
		);
	}
}

function oneSubdivideBezier(vec, poly1,poly2){
	if (vec.length<=1)
		return (poly1.concat(vec)).concat(poly2);
	else{
			var nextVec=[];
			for (i=0;i<vec.length-1;i++)
				nextVec[i]=(vec[i]+vec[i+1])/2;
			poly1.push(vec.shift());
			poly2.unshift(vec.pop());
			return oneSubdivideBezier(nextVec,poly1,poly2);
	}
}
	

function matrixMul(matrix1,matrix2){
	//function for matrix multiplication
	if(matrix1[0].length!=matrix2.length){
		return false;
	}
	var ans=[];
	for(r1=0; r1<matrix1.length;r1++){
		ans[r1]=[];
		for(c2=0; c2<matrix2[0].length;c2++){
			ans[r1][c2]=0;
			for(r2=0;r2<matrix1[0].length;r2++){
				ans[r1][c2]+=matrix1[r1][r2]*matrix2[r2][c2];
			}
		}
	}
	return ans;
}

function fact(num){
	//factorial
	if(num<0)
		return false;
	else if(num==0)
		return 1;
	else
		return (num *fact(num-1));
}

function calBezierCoe(u,d,w){ 
	//Function to calculate coefficient for different u
	if (w==undefined){
		w=[];
		for(i=0;i<d;i++){
			w[i]=1;
		}
	}
	var c=[[]];
	var sum=0;
	for(i=0;i<d;i++){
		c[0][i]=(fact(d-1)/fact(i)/fact(d-1-i))*Math.pow((1-u),d-1-i)*Math.pow(u,i)*w[i];
		sum+=c[0][i];
	}
	for(i=0;i<d;i++) c[0][i]=c[0][i]/sum;
	return c;
}

function trueTan(dy,dx){
	dir=Math.atan(dy/dx);
	if(dy>0&&dx<0){
		dir+=Math.PI;
		return dir;
	}
	else if(dy<0&&dx<0){
		dir-=Math.PI;
		return dir;
	}
	else return dir;
}

function toDef(preDir){
	if(preDir>Math.PI) return preDir-=2*Math.PI;
	if(preDir<-Math.PI) return preDir+=2*Math.PI;
	else return preDir;
}