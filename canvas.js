const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
canvas.height = 400;
canvas.width = Math.round(canvas.height * (window.innerWidth / window.innerHeight));

class stack {
	constructor(start) {
		this.array = [start];
	}
	push(x) {
		this.array.push(x);
	}
	pop() {
		this.array.pop();
	}
	peek() {
		return this.array[this.array.length - 1];
	}
	empty() {
		this.array = [];
	}
	isempty() {
		if(this.array.length == 0) {
			return true;
		} else return false;
	}
	change(x) {
		this.array[this.array.length - 1] = x;
	}
}

function RB(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

var generateMaze = (marray,min,max) => {
    for(let i = min[0]; i <= max[0]; i++) {
        if(marray[i] === undefined) {
            marray[i] = new Map();
        }
        for(let j = min[1]; j <= max[1]; j++) {
            marray[i][j] = 1;
        }
    }
    let mstackx = new stack(Math.round((max[0]+min[0])/2));
    let mstacky = new stack(Math.round((max[1]+min[1])/2));
    let maze = 1;
    while(maze == 1) { //maze generation (recursive backtracking)
		let went = 0;
		let direction = RB(1,4); // 1 = front, 2 = back, 3 = left, 4 = right
		let direction2 = RB(1,2);
		let count = 0;
		while(went == 0) {
			let y = mstacky.peek();
			let x = mstackx.peek();
			switch(direction) {
				case 1: //front
					if(marray[x]?.[y - 2] !== 0 && y - 2 >= min[1]) {
						mstacky.push(y - 2);
						mstackx.push(x);
						marray[x][y - 1] = 0;
						marray[x][y - 2] = 0;
						went = 1;
					}
				break;
				case 2: //back
					if(marray[x]?.[y + 2] !== 0 && y + 2 <= max[1]) {
						mstacky.push(y + 2);
						mstackx.push(x);
						marray[x][y + 1] = 0;
						marray[x][y + 2] = 0;
						went = 1;
					}
				break;
				case 3: //left
					if(map[x - 2]?.[y] !== 0 && x - 2 >= min[0]) {
						mstacky.push(y);
						mstackx.push(x - 2);
						marray[x - 1][y] = 0;
						marray[x - 2][y] = 0;
						went = 1;
					}
				break;
				case 4: //right
					if(map[x + 2]?.[y] !== 0 && x + 2 <= max[0]) {
						mstacky.push(y);
						mstackx.push(x + 2);
						marray[x + 1][y] = 0;
						marray[x + 2][y] = 0;
						went = 1;
					}
				break;
			}
			if(went == 0) {
				count++;
				if(direction2 == 1) {
					direction--;
					if(direction < 1) direction = 4;
				} else if(direction2 == 2) {
					direction++;
					if(direction > 4) direction = 1;
				}
				if(count >= 3) {
					count = 0;
					direction = RB(1,4);
					direction2 = RB(1,2);
					mstackx.pop();
					mstacky.pop();
					if(mstackx.isempty() || mstacky.isempty()) {
						maze = 0;
                        went = 1;
					}
				}
			}
		}
	}
}


var distance = (x0,y0,x2,y2) => {
    //d=√((x_2-x_0)²+(y_2-y_0)²)
    return Math.sqrt((x2-x0)**2+(y2-y0)**2);
}

var size = (a) => {
    return Math.sqrt(a[0]**2+a[1]**2);
}

var mouse = {
    x: 1,
    y: 1
}

var point = [0,0];

var tfactor = 1 //time factor
var store = tfactor;

class player {
	constructor() {
        this.pos = [0,0];
        this.mpos = [0,0];
        this.cpos = [0,0];
        this.s = [0,0] //distance that will be added to pos array
        this.v = [0,0]; //m/s
        this.a = [0,0]; //m/(s^2)
        this.FF = [0,0]; //friction force
        this.FP = [0,0]; //player force
        //this.FN = [0,0]; //normal force vector
        this.f = [0,0]; //force sum
        this.m = 5; //kg
        this.date = 0;
        this.apply = false;
        this.Vmax = 200; //for 5 kg player yeah
        this.Fmax = 2000;
        this.friction = (this.Fmax*this.m)/(this.Vmax*5);
        this.Pangle = 0; //player angle
        this.vcut = 0.05;
        this.timecheck = 1;
        this.rlength = 20;
        this.noclip = false;
        this.FOV = Math.PI/2;
        this.raydD = 10;
        this.wfactor = 50;
        this.cfactor = 0.01;
        //this.maxd/d = this.cfactor (equation for when this.maxd/d is = this.cfactor)
        //d=this.maxd/this.cfactor (this is the max distance that the player can see)
        //this.maxd = this.cfactor*d (d is the custom max distance the player can see in this scenario)
        this.viewmax = 50;
        this.maxd = this.cfactor*this.viewmax*ospace; //max view distance of viewmax map units in original space
        this.lfactor = 0.5*(this.viewmax/75); //light factor
        console.log((this.maxd/this.cfactor)/ospace); //max map units distance the player can see (in original space)
        for(let i = 0; i <= 1; i++) {
            this.mpos[i] = this.pos[i]/space+(msize/2);
            this.cpos[i] = this.mpos[i]/msize;
        }
	}
	update(delta) {
        if(delta == 0) {
            this.timecheck = 0;
            return 0;
        } else if(this.timecheck == 0) {
            this.timecheck = 1;
            return 0;
        }
        delta /= 1000;
        if(this.Pangle > 2*Math.PI) {
            this.Pangle = 2*Math.PI - this.Pangle;
        }
        this.friction = (this.Fmax*this.m)/(this.Vmax*5);
        let fsize = this.friction*size(this.v);
        for(let i = 0; i <= 2; i++) {
            if(gspace != space) {
                this.pos[i] = (this.mpos[i]-msize/2)*space;
            }
            if(size(this.v) > 0) {
                this.FF[i] = this.v[i] * (fsize/size(this.v));
            } else this.FF = [0,0];
            this.f[i] = /*this.FN[i] +*/ this.FP[i] - this.FF[i];
            this.a[i] = this.f[i] / this.m; //a = f/m
            this.s[i] = ((this.v[i] + (this.v[i]+this.a[i]*delta) )/2) * delta//s = ((v0+v)/2)*t, t is delta
            this.v[i] = this.v[i] + this.a[i]*delta//v = v0+at
            if(Math.abs(this.v[i]) < this.vcut) {
                this.v[i] = 0;
            }
        }
        if(!this.noclip && size(this.s) <= 1) {
            this.colisionCheck(space,this.pos,false,this.m,true);
        } else if(!this.noclip) { //colision check between frames
            let ss = size(this.s); 
            let ns = [this.s[0]/ss,this.s[1]/ss];
            for(let i = 1; i <= ss; i++) { //this can get laggy if player is very fast but luckily there is a max speed and this game takes place in a maze
                if(this.colisionCheck(space,[this.pos[0]+ns[0]*i,this.pos[1]+ns[1]*i],false,this.m,true)) {
                    this.s = [ns[0]*i,ns[1]*i];
                    break;
                }
            }
        }
        for(let i = 0; i <= 1; i++) {
            this.pos[i] += this.s[i];
            this.mpos[i] = this.pos[i]/space+(msize/2);
            this.cpos[i] = this.mpos[i]/msize;
        }
	}
    spacesync(vspace) {
        for(let i = 0; i <= 1; i++) this.pos[i] = (this.mpos[i]-msize/2)*vspace;
    }
    colisionCheck(vspace,coords,ray,mass,maze) {
        let c = true;
        for(let l = 0; l <= c; l++) {
            for(let i = -1; i <= 1; i++) {
                for(let j = -1; j <= 1; j++) {
                    if((Math.abs(i) == Math.abs(j) && l == 0) || (Math.abs(i) != Math.abs(j) && l != 0)) continue;
                    let x = Math.round((coords[0]+(mass/2)*i)/vspace+(msize/2));
                    let y = Math.round((coords[1]+(mass/2)*j)/vspace+(msize/2));
                    if(map[y]?.[x] === undefined) {
                        if(cells[Math.floor(y/msize)] === undefined && maze) {
                            cells[Math.floor(y/msize)] = new Map();
                            cells[Math.floor(y/msize)][Math.floor(x/msize)] = 1;
                            generateMaze(map,[Math.floor(y/msize)*msize,Math.floor(x/msize)*msize],[Math.floor(y/msize)*msize+msize,Math.floor(x/msize)*msize+msize]);
                            generated++;
                            console.log("GENERATED MAZE", ray);
                        } else if(cells[Math.floor(y/msize)]?.[Math.floor(x/msize)] === undefined && maze) {
                            cells[Math.floor(y/msize)][Math.floor(x/msize)] = 1;
                            generateMaze(map,[Math.floor(y/msize)*msize,Math.floor(x/msize)*msize],[Math.floor(y/msize)*msize+msize,Math.floor(x/msize)*msize+msize]);
                            generated++;
                            console.log("GENERATED MAZE", ray);
                        }
                        continue;
                    }
                    if(map[y][x] == 1) {
                        c = false;
                        if(ray == false) {
                            if(i != 0 && ((this.v[0] > 0) == (i > 0))) {
                                this.v[0] = this.v[0] * -1;
                            }
                            if(j != 0 && ((this.v[1] > 0) == (j > 0))) {
                                this.v[1] = this.v[1] * -1;
                            }
                        }
                    }
                }
            }
        }
        if(c == false) {
            return true;
        } else return false;
    }
    mapc(num,vspace) {return num/vspace+(msize/2)}
    wall(acords,bool) {
        if(bool) {
            return this.colisionCheck(space,acords,true,0.1,true);
        } else return false;
    }
    draw() {
        let screen = [[Math.cos(this.Pangle-this.FOV/2)*this.raydD,Math.sin(this.Pangle-this.FOV/2)*this.raydD],[Math.cos(this.Pangle+this.FOV/2)*this.raydD,Math.sin(this.Pangle+this.FOV/2)*this.raydD]];
        for(let r = 0; r < canvas.width; r++) {
            let rpos = [0,0];
            let co = r/canvas.width;
            let screenv = [screen[0][0]+(screen[1][0]-screen[0][0])*co,screen[0][1]+(screen[1][1]-screen[0][1])*co];
            let t = Math.atan(screenv[1]/screenv[0])+(Math.PI*(screenv[0]<0));
            if((t<Math.PI/2+0.001&&t>Math.PI/2-0.001)||(t<(Math.PI*3)/2+0.01&&t>(Math.PI*3)/2-0.01)) t -= 0.002;
            t += Math.PI*4;
            let ray = [[this.mpos[0],this.mpos[1]],[this.mpos[0],this.mpos[1]]];
            let rayn = [Math.cos(t),Math.sin(t)];
            let rayv = [[1,rayn[1]/rayn[0]],[rayn[0]/rayn[1],1]];
            for(let i = 0; i <= 1; i++) {
                if((rayn[0] < 0 && rayv[i][0] > 0) || (rayn[0] > 0 && rayv[i][0] < 0)) rayv[i][0] *= -1;
                if((rayn[1] < 0 && rayv[i][1] > 0) || (rayn[1] > 0 && rayv[i][1] < 0)) rayv[i][1] *= -1;
            }
            if(rayn[1] < 0) {
                ray[1][0] += rayv[1][0] * (ray[1][1] - Math.floor(ray[1][1])-0.5);
                ray[1][1] -= ray[1][1] - Math.floor(ray[1][1])-0.5;
            } else {
                ray[1][0] += rayv[1][0] * (Math.ceil(ray[1][1]) - ray[1][1]-0.5);
                ray[1][1] += Math.ceil(ray[1][1]) - ray[1][1]-0.5;
            }
            if(rayn[0] < 0) {
                ray[0][1] += rayv[0][1] * (ray[0][0] - Math.floor(ray[0][0])-0.5);
                ray[0][0] -= ray[0][0] - Math.floor(ray[0][0])-0.5;
            } else {
                ray[0][1] += rayv[0][1] * (Math.ceil(ray[0][0]) - ray[0][0]-0.5);
                ray[0][0] += Math.ceil(ray[0][0]) - ray[0][0]-0.5;
            }
            //let c = 0;
            let compare = 0;
            for(let a = 0; a <= 1; a++) {
                for(let k = 0; k < Math.ceil(this.rlength/size(rayv[a])); k++) {
                    let apos = [space*(ray[a][0]-msize/2),space*(ray[a][1]-msize/2)];
                    let dis = distance(this.pos[0],this.pos[1],apos[0],apos[1])*Math.cos(t-this.Pangle);
                    let check = ((apos[0]>this.pos[0])==(this.pos[0]+rayn[0]>this.pos[0])&&(apos[1]>this.pos[1])==(this.pos[1]+rayn[1]>this.pos[1])&&this.maxd/dis>=this.cfactor);
                    if(check&&this.wall(apos,check)) {
                        compare = 1;
                        let rx = space*(ray[0][0]-msize/2);
                        let ry = space*(ray[0][1]-msize/2);
                        if(distance(apos[0],apos[1],this.pos[0],this.pos[1]) < distance(rx,ry,this.pos[0],this.pos[1]) && a == 1) {
                            //drawline(this.pos[0],this.pos[1],apos[0],apos[1],"lime");
                            //RelativeDraw(apos[0],apos[1],3);
                            rpos = apos;
                        } else if(a==1) {
                            //drawline(this.pos[0],this.pos[1],rx,ry,"yellow");
                            //RelativeDraw(rx,ry,3);
                            rpos = [rx,ry];
                        }
                        break;
                    } else if(a==1&&compare==1&&k==Math.ceil(this.rlength/size(rayv[a]))-1) {
                        let rx = space*(ray[0][0]-msize/2);
                        let ry = space*(ray[0][1]-msize/2);
                        //drawline(this.pos[0],this.pos[1],rx,ry,"yellow");
                        //RelativeDraw(rx,ry,3);
                        rpos = [rx,ry];
                    }
                    for(let j = 0; j <= 1; j++) {
                        ray[a][j] += rayv[a][j];
                    }
                    //c++;
                }
            }
            //console.log(c);
            if(compare == 0) continue;
            let d = distance(this.pos[0],this.pos[1],rpos[0],rpos[1]) * Math.cos(t-this.Pangle);
            let h = ((this.maxd/d)*canvas.height);
            ctx.globalAlpha = this.maxd/(d*this.lfactor);
            ctx.fillStyle = "red";
            if(h>0) {
                ctx.fillRect(r,canvas.height/2-h/2,1,h);
                /*
                ctx.fillStyle = "yellow";
                let slices = 2;
                let hi = canvas.height/20;
                for(let n = 0; n <= slices; n++) {
                    ctx.fillRect(r,canvas.height/2-h/2+(h/slices)*n-((this.maxd/d)*hi)/2+(n!=0&&n!=slices)*Math.sin(Math.PI*2*(r/canvas.width))*(this.maxd/d)*hi,1,(this.maxd/d)*hi);
                }*/
                ctx.fillStyle = "darkred";
                ctx.globalAlpha /= 2;
                ctx.fillRect(r,canvas.height/2-h,1,h*2);
                /*
                ctx.globalAlpha *= 2;
                ctx.fillRect(r,canvas.height/2+h,1,canvas.height-(canvas.height/2-h));
                ctx.fillRect(r,canvas.height/2-h,1,0-canvas.height-(canvas.height/2-h));
                */
            }
            ctx.globalAlpha = 1;
        }
    }
}

var RelativeDraw = (x,y,size) => {
    let xx = Math.round(canvas.width/2 + (x - player1.pos[0]) - size/2)
    let yy = Math.round(canvas.height/2 + (y - player1.pos[1]) - size/2)
    ctx.fillRect(xx,yy,size,size);
    if((xx < 0-size || xx > canvas.width+size) || (yy < 0-size || yy > canvas.height+size)) {
        return false
    } else {
        return true
    }
}

var map = new Map();
var cells = new Map();

map[0] = new Map();
for(let i = 0; i < 10; i++) map[0][i] = 1;

let msize = 100;
var ospace = 100;
var space = ospace;
var gspace = space;

var generated = 0;

var player1 = new player();

var drawline = (x,y,x2,y2,color) => { //yeah there is a problem if the 2 points are outside the FOV but meh im lazy and dont have any reason to fix it right now. I could fix it if I did a bit of math and caluclated where x/y is in respect to x/y when they r at the border of FOV and then draw that if they r withing the FOV
    ctx.fillStyle = color;
    let d = distance(x,y,x2,y2);
    let kx = (x2-x)/d;
    let ky = (y2-y)/d;
    for(let i = 0; i < d; i++) {
        if(!RelativeDraw(Math.round(x+i*kx),Math.round(y+i*ky),1,1)) return 0;
    }
}

var keys = {};

window.addEventListener('keydown', (e) => {
    stinkyones.play();
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

var checkKeys = (delta) => {
    delta /= 1000
        if(keys["KeyW"] || keys["ArrowUp"]) {//w or up arrrow
            player1.FP = [Math.cos(player1.Pangle)*player1.Fmax,Math.sin(player1.Pangle)*player1.Fmax];
        } else if(keys["KeyS"] || keys["ArrowDown"]) { //s or down arrow
            player1.FP = [0-Math.cos(player1.Pangle)*player1.Fmax,0-Math.sin(player1.Pangle)*player1.Fmax];
	    } else {
            player1.FP = [0,0];
        }
        if(keys["KeyD"] || keys["ArrowRight"]) { //d and right arrow
            player1.Pangle += (delta*2*Math.PI)/1.5;
        }
        if(keys["KeyA"] || keys["ArrowLeft"]) { //a and left arrow
            player1.Pangle -= (delta*2*Math.PI)/1.5;
        }
        if(keys["KeyO"]) {
            if(canvas.height < 1000) {
                canvas.height += Math.ceil((canvas.height/4)*delta);
                canvas.width = Math.round(canvas.height * (window.innerWidth / window.innerHeight));
            }
        }
        if(keys["KeyI"]) {
            if(canvas.height > 100) {
                canvas.height -= (canvas.height/4)*delta;
                canvas.width = Math.round(canvas.height * (window.innerWidth / window.innerHeight));
            }
        }
}

var expandRate = 0.0075;

var spaceset = true;

var elapsed = 0;

var lore = [
    "ESCAPE","TO","BECOME","THE","NEW","LEADER","OF","LPI","FART","ARMY!",""
]

var loretime = [0,250,0];
var gasperiod = RB(1e4,2e4);


var start = performance.now();
var fps = 1000/60;
var hold = false;
var game = () => {
    if(elapsed >= gasperiod) {
        elapsed = 0;
        gasperiod = RB(1e4,3e4);
        gspace = RB(25,175);
        if(gspace < 45) gspace = 45;
        audios[RB(0,audios.length-1)].play();
    } else if(loretime[0] >= loretime[1]) {
        loretime[0] = 0;
        loretime[2]++;
        if(loretime[2] >= lore.length) loretime[2] = 0;
    }
    checkKeys((1000/fps)*tfactor)
    if(hold) {
        p = [mouse.x-canvas.width/2,mouse.y-canvas.height/2];
        player1.Pangle = Math.atan(p[1]/p[0])+(Math.PI*(p[0]<0));
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "darkpink";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(space < gspace-1) {
        space += expandRate*(1000/fps)*tfactor;
        spaceset = false;
    } else if(space > gspace+1) {
        space -= expandRate*(1000/fps)*tfactor;
        spaceset = false;
    } else {
        space = gspace;
        if(!spaceset) {
            player1.spacesync(space);
            spaceset = true;
        }
    }
    if(space < 25 || space > 175) {
        space = gspace+10;
        player1.spacesync(space);
    }
    player1.update((1000/fps)*tfactor);
    elapsed += (1000/fps)*tfactor;
    loretime[0] += (1000/fps)*tfactor;
    player1.draw();
    ctx.globalAlpha = (space/175)*0.75;
    ctx.fillStyle = "green";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "black";
    ctx.fillText("BLOAT: " + Math.round((space/200)*100) + "%",0,10,canvas.width);
    ctx.fillText(lore[loretime[2]],0,20,canvas.width);
    fps = 1000/(performance.now()-start)
    start = performance.now();
    requestAnimationFrame(game);
}

addEventListener("blur", (e) => {
    keys = {};
    hold = false;
    store = tfactor;
    tfactor = 0;
})

addEventListener("focus", (e) => {
    tfactor = store;
    start = performance.now();
})

addEventListener("resize", (e) => {
    canvas.width = Math.round(canvas.height * (window.innerWidth / window.innerHeight));
})

addEventListener("contextmenu", (e) => {
    e.preventDefault();
})

const stinkyones = new Audio("media/TheStinkyOnes.mp3");
stinkyones.loop = true;

var audios = [];
for(let i = 1; i <= 4; i++) {
    audios.push(new Audio("media/"+i+".mp3"));
}

console.log(audios);

onclick = () => {
    stinkyones.play();
}

requestAnimationFrame(game);