'use strict'
import Vec from './Vec.js';
import Input from './Input.js';
import Meter from './Meter.js';

const CTX = document.querySelector('#game').getContext('2d'),
    W = CTX.canvas.width = 600 || innerWidth,
    H = CTX.canvas.height = 600 || innerHeight,
    PI = Math.PI,
    PI2 = PI * 2,
    FPS = 60;
let ship,
    particleList = [],
    bulletList = [],
    asteroidList = [],
    explosionList = [],
    starsList = [],
    damagePlumList = [],
    gameOver = false,
    loopId,
    logger = document.querySelector('#logger'),
    angleDom = document.querySelector('#gui_left svg'),
    scoreDom = document.querySelector('#gui_center'),
    buttonDom = document.querySelector('.button'),
    lobbyDom = document.querySelector('.lobby'),
    guiDom = document.querySelector('.gui'),
    cooldown = false;

let helpers = {
    degToRad(deg) {
        return deg * (PI / 180);
    },
    radToDeg(rad) {
        return rad * (180 / PI);
    },
    randColor(){
        return `hsl(${~~(Math.random() * 360)},100%,50%)`
    },
    precise(num,precision) {
        return +(num).toFixed(precision);
    },
    random(min, max) {
        return min + Math.random() * (max - min);
    },
    lerp(v0, v1, t) {
        return v0 * (1 - t) + v1 * t
    },
    distance(a, b) {
        let distX = b.x - a.x,
            distY = b.y - a.y;
        return Math.sqrt((distX * distX + distY * distY));
    },
    scale(number, inMin, inMax, outMin, outMax) {
        return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
}


let state = {
    maxScore: 0,
    score: 0
}
let scene = {
    current:'start',
    setCurrent(scene) {
        this.current = scene;
    },
    start() {
        let randVel = new Vec(0,helpers.random(-1,1));
        for (let i = 0; i < 15; i++) {
            let offset = 20;
            let x = helpers.random(-offset, W+offset);
            let y = helpers.random(-offset, H+offset);
            let pos = new Vec(x, y);
            let size = helpers.random(2,8);
            starsList.push(new Star(pos, size,randVel));
        }
    },
    game() {
        ship = new Ship(new Vec(W / 2, H / 2));
        setTimeout(()=>{
            create({
                type: 'asteroid',
                qty: 4
            })
            guiDom.style.display = 'flex';
            Input.listen();
        }, 1200)

    }
}
class Star {
    constructor(pos,size, randVel) {
        this.pos = pos;
        this.velocity = new Vec(0, 0);
        this.size = size;
        this.randVel = randVel;
        this.maxspeed = 2;
        this.alpha = 1 ;
        this.color = `rgba(255,255,255,${helpers.scale(size, 2,8,0,0.5)})`;
    }
    draw() {
        let {
            x,
            y
        } = this.pos;
        let r = this.size;
        CTX.shadowColor = CTX.fillStyle = this.color;
        CTX.shadowBlur = 20;
        CTX.beginPath();
        CTX.fillRect(x, y, r, r);
        CTX.fill();
        CTX.shadowBlur = 0;
    }
    applyForce(f) {
        this.acceleration.add(f.normalise().mult(this.maxspeed));
    }
    update() {
        let size = this.size;
        let {x,y} = this.pos;
        if(x > W) {
            this.pos.x = -size;
        } else if(x+size<0) {
            this.pos.x = W;
        }
        if(y > H) {
            this.pos.y = -size;
        } else if(y+size<0) {
            this.pos.y = H;
        }
        let vel = scene.current === 'game' ? ship.velocity : this.randVel;
        this.velocity.add(vel.negative().mult(this.size * 0.05));
        this.pos.add(this.velocity);
        this.velocity.limit(0.1);
    }
};
class DamagePlum {
    constructor(pos,dmg) {
        this.pos = pos;
        this.dmg = dmg;
        this.acceleration = new Vec(0,-1);
        this.friction = new Vec(0,0.99);
        this.velocity = new Vec(0, 0);
        this.alpha = 1;
        this.size = 20;
        this.color = 'rgba(255,255,255,';
    }
    draw() {
        let {
            x,
            y
        } = this.pos;
        CTX.shadowColor = CTX.fillStyle = `${this.color}${this.alpha})`; 
        CTX.textAlign = 'center';
        CTX.font = `${this.size}px meter`;
        CTX.fillText(`+${this.dmg}`,x,y)
        CTX.shadowBlur = 0;
    }
    update() {
        if (this.size - 0.4 > 0) {
            this.size -= 0.4;
        }
        this.alpha -= 0.03;
        this.text
        this.velocity.add(this.acceleration);
        this.pos.add(this.velocity);
        this.velocity.mult(this.friction);
        this.acceleration.mult(0);
    }
}
class Explosion {
    constructor(pos, acc, color, nature) {
        this.pos = pos;
        this.velocity = new Vec(0, 0);
        this.acceleration = acc;
        this.friction = 0.99;
        this.isStroke = helpers.random(0,1) < 0.5;
        this.rad = helpers.random(1, 5);
        this.maxspeed = 0.01;
        this.nature = nature;
        this.hue = 40;
        this.color = color || ',80%,50%)';
    }
    draw() {
        let {
            x,
            y
        } = this.pos;
        CTX.globalCompositeOperation = "lighter";
        if(this.nature === 'self') {
            CTX.shadowColor = CTX.fillStyle = this.color; 
        } else {
            CTX.shadowColor = CTX.fillStyle = `hsl(${this.hue}${this.color}`; 
        }
        CTX.shadowBlur = 20;
        CTX.beginPath();
        CTX.arc(x, y, this.rad, 0, PI2)
        CTX.fill();
        CTX.globalCompositeOperation = "source-over";
        CTX.shadowBlur = 0;
    }
    applyForce(f) {
        this.acceleration.add(f.normalise().mult(this.maxspeed));
    }
    update() {
        this.hue -= 1 ;
        if (this.rad - 0.05 >= 0) {
            this.rad -= 0.05;
        }
        this.applyForce(this.acceleration);
        this.velocity.add(this.acceleration);
        this.pos.add(this.velocity);
        this.velocity.mult(this.friction);
        this.acceleration.mult(0);
    }
};

function collisionManager() {
    let bu = bulletList;
    let as = asteroidList;
    if (as.length > 0) {
        for (let i = 0; i < as.length; i++) {
            let a = as[i];
            let s = ship;
            let asteroidShipRads = a.rad + ship.scale;
            if(helpers.distance(s.centroid().add(s.pos), a.pos) < asteroidShipRads) {
                if(!cooldown) {
                    create({
                        type: 'explosion',
                        color: 'hsl(0, 100%, 99%)',
                        nature:  'self',
                        pos:s.centroid().add(s.pos)
                    });
                }
                cooldown = true;
                asteroidList = [];
                setTimeout(() =>{
                    ship.respawn();
                    create({
                        type: 'asteroid',
                        qty: 4
                    });
                    cooldown = false;
                }, 2000)
            }
            if(bu.length > 0) {
                for (let j = 0; j < bu.length; j++) {
                    let b = bu[j];
                    let asteroidBulletRads = a.rad + b.rad;
    
                    if (helpers.distance(a.pos, b.pos) < asteroidBulletRads) {
                        bulletList.splice(j, 1);
                        a.health -= 1;
                        a.lightness += 3.5;
                        if (a.health <= 0) {
                            state.score += 10;
                            let pos = {...a.pos}
                            create({
                                type: 'explosion',
                                nature:'outer',
                                pos
                            });
                            create({
                                type: 'plum',
                                pos,
                                dmg: a.rad === 40 ? 20 : 10
                            })
                            if (a.rad === 40) {
                                create({
                                    type: 'asteroid',
                                    pos,
                                    qty: 2,
                                    rad: 20,
                                })
                                asteroidList[i].spawn();
                            } else {
                                asteroidList.splice(i, 1);
                            }
                        }
                    };
                }
            }
        }
    }
}

class Asteroid {
    constructor(pos, rad, vel) {
        this.pos = pos;
        this.velocity = vel || new Vec(0,0);
        this.friction = 0.01;
        this.health = 10;
        this.rad = rad || 40;
        this.maxspeed = 1;
        this.lightness = 53;
        this.color = 'hsl(15, 100%,';
    }
    border() {
        if (this.pos.x - this.rad > W) {
            this.pos.x = -this.rad;
        } else if (this.pos.x + this.rad < 0) {
            this.pos.x = W + this.rad;
        }
        if (this.pos.y - this.rad > H) {
            this.pos.y = -this.rad;
        } else if (this.pos.y + this.rad < 0) {
            this.pos.y = H + this.rad;
        }
    }
    spawn() {
        let x, y, randDir;
        if (this.rad === 40) {
            if (helpers.random(-1, 1) > 0) {
                x = helpers.random(-1,1)>0? -this.rad : W + this.rad;
                y = helpers.random(-1,1)>0? -this.rad : H + this.rad;
            } else {
                x = helpers.random(-1,1)>0? -this.rad : W + this.rad;
                y = helpers.random(-1,1)>0? -this.rad : H + this.rad;
            }
            randDir = new Vec(helpers.random(-1, 1), helpers.random(-1, 1));
            let targetDir = Vec.vector('subt', ship.pos, new Vec(x, y)).normalise();
            this.velocity = helpers.random(-1, 1) > 0 ? randDir : targetDir;
            this.pos = new Vec(x, y);
            this.health = 10;
        } else {
            this.health = 5;
        }
        this.lightness = 53;
    }
    draw() {
        let {
            x,
            y
        } = this.pos;
        CTX.shadowColor = CTX.strokeStyle = `${this.color}${this.lightness}%)`;
        CTX.shadowBlur = 8;
        CTX.lineWidth = 2.5;
        CTX.beginPath();
        CTX.arc(x, y, this.rad, 0, PI2)
        CTX.closePath();
        CTX.stroke();
        CTX.shadowBlur = 0;
    }
    update() {
        this.pos.add(this.velocity);
    }
};

class Bullet {
    constructor(pos, acc, color) {
        this.pos = pos;
        this.velocity = new Vec(0, 0);
        this.acceleration = acc;
        this.angle = ship.angle;
        this.maxspeed = 20;
        this.rad = 5;
        this.age = 100;
        this.bulletLength = 2;
        this.color = '100%, 60%)';
        this.hue = 185;
    }
    draw() {
        let l = this.bulletLength;
        let {
            x,
            y
        } = this.pos;
        let nx = Math.cos(this.angle) * l + x;
        let ny = Math.sin(this.angle) * l + y;
        CTX.imageSmoothingEnabled = true;
        CTX.strokeStyle = `hsl(${this.hue},${this.color}`;
        CTX.lineWidth = 3.9;
        CTX.shadowColor = `hsl(${this.hue},${this.color}`;
        CTX.shadowBlur = 10;        
        CTX.lineCap = 'round';
        CTX.beginPath();
        CTX.moveTo(x, y);
        CTX.lineTo(nx, ny);
        CTX.stroke();
        CTX.shadowBlur = 0;
    }
    applyForce(f) {
        this.acceleration = f.normalise().mult(this.maxspeed);
    }
    update() {
        this.applyForce(this.acceleration);
        this.hue += 1;
        this.age--;
        this.bulletLength += 0.8;
        this.velocity.add(this.acceleration);
        this.pos.add(this.velocity);
        this.acceleration.mult(0);
    }
}
class Ship {
    constructor(pos) {
        this.pos = pos;
        this.velocity = new Vec(0, 0);
        this.acceleration = new Vec(0, 0);
        this.geometry = [
            [0, 0],
            [-1, 2],
            [1, 2]
        ];
        this.scale = 0.1;
        this.angle = helpers.degToRad(90);
        this.friction = 1;
        this.delay = 2;
        this.hearth = 3;
        this.maxspeed = 0.09;
        this.centroid = () => {
            let g = this.geometry;
            let x = ((g[0][0] + g[1][0] + g[2][0]) * this.scale / 3);
            let y = ((g[0][1] + g[1][1] + g[2][1]) * this.scale / 3);
            return new Vec(x, y);
        };
        this.color = 'rgba(43, 50, 56, 1)';
    }
    draw() {
        if(cooldown) return;
        let {
            x,
            y
        } = this.centroid();
        let g = this.geometry;
        CTX.fillStyle = 'white';
        CTX.lineWidth = 3;
        CTX.save();
        CTX.translate(x + this.pos.x, y + this.pos.y) // translate canvas to centroid of the triangle.
        CTX.rotate(this.angle - helpers.degToRad(90)); // do the rotation.
        CTX.translate(-x - this.pos.x, -y - this.pos.y); // reverse the translation.
        CTX.beginPath();
        CTX.moveTo((g[0][0] * this.scale) + this.pos.x, (g[0][1] * this.scale) + this.pos.y);
        CTX.lineTo((g[1][0] * this.scale) + this.pos.x, (g[1][1] * this.scale) + this.pos.y);
        CTX.lineTo((g[2][0] * this.scale) + this.pos.x, (g[2][1] * this.scale) + this.pos.y);
        CTX.closePath();
        CTX.fill();
        CTX.restore();
    }
    border() {
        let size = this.centroid().y;
        if (this.pos.x - size > W) {
            this.pos.x = -size;
        } else if (this.pos.x + size < 0) {
            this.pos.x = W + size;
        }
        if (this.pos.y - size > H) {
            this.pos.y = -size;
        } else if (this.pos.y + size < 0) {
            this.pos.y = H + size;
        }
    }
    applyForce(f) {
        this.acceleration = f.normalise().mult(this.maxspeed)
    }
    respawn() {
        this.hearth--;
        this.pos = new Vec(W/2,H/2);
        this.velocity = new Vec(0, 0);
        this.acceleration = new Vec(0, 0);
        this.angle = helpers.degToRad(90);
        this.scale = 0.1;
    }
    update() {
        if(cooldown) return;
        if(this.scale<12) {
            this.scale = helpers.lerp(this.scale, 12, 0.05);
        }
        let x = helpers.precise(Math.cos(this.angle),2);
        let y = helpers.precise(Math.sin(this.angle),2);

        if (Input.up) {
            this.applyForce(new Vec(-x, -y));
            create({
                type: 'thrust',
                qty: 1
            });
        }
        if (Math.abs(this.angle) >= helpers.degToRad(360)) {
            this.angle = 0;
        }
        if (Input.right) {
            this.angle += helpers.degToRad(4);
        }
        if (Input.left) {
            this.angle -= helpers.degToRad(4);
        }

        if (Input.space) {
            if (this.delay-- <= 0) {
                create({
                    type: 'bullet',
                    qty: 1
                });
                this.delay = 2;
            }
        }
        this.velocity.limit(4)
        this.applyForce(this.acceleration);
        this.velocity.add(this.acceleration);
        this.pos.add(this.velocity);
        this.velocity.mult(this.friction);
        this.acceleration.mult(0);
    }
}
class ThrustParticle {
    constructor(pos, acc, rad) {
        this.pos = pos;
        this.velocity = new Vec(0, 0);
        this.acceleration = acc;
        this.rad = rad;
        this.angle = ship.angle;
        this.friction = helpers.random(0.7, 0.9);
        this.maxspeed = helpers.random(0.2, 0.2);
        this.alpha = 1;
        this.age = 50;
        this.color = 'rgba(217, 68, 38,';
    }
    draw() {
        CTX.globalCompositeOperation = "lighter";
        CTX.fillStyle = `${this.color}${this.alpha})`;
        CTX.shadowColor = `${this.color}${this.alpha})`;
        CTX.shadowBlur = 20;
        CTX.lineWidth = 2;
        CTX.beginPath();
        CTX.arc(this.pos.x, this.pos.y, this.rad, 0, PI2, false);
        CTX.fill();
        CTX.shadowColor = undefined;
        CTX.shadowBlur = 0;
        CTX.globalCompositeOperation = "source-over";
    }
    update() {
        this.age -= 1;
        if (this.rad - 0.2 > 0.1) {
            this.rad -= 0.2;
        }
        this.velocity.add(this.acceleration.normalise().mult(this.maxspeed));
        this.pos.add(this.velocity);
        this.velocity.mult(this.friction);
    }
}
/////////////// LOOP ////////////////

function loop(timestamp) {
    CTX.clearRect(0, 0, W, H)
    for (let d of starsList) {
        d.update();
        d.draw()
    }
    for (let a of asteroidList) {
        a.draw();
        a.update();
        a.border();
    }
    for (let p of particleList) {
        p.draw()
        p.update();
    }
    for (let b of bulletList) {
        b.draw()
        b.update();
    }
    for (let e of explosionList) {
        e.draw()
        e.update();
    }
    for (let d of damagePlumList) {
        d.update();
        d.draw()
    }
    if(scene.current !== 'start') {
        collisionManager();
        ship.update();
        ship.border();
        ship.draw();
    }
    crtEffect();
    garbageCollector();
    scoreManager()
    // Meter.run(timestamp);
    // log();
    // gui()
}

function init() {
    scene.start();
    setInterval(loop, 1000/FPS);
}

function garbageCollector() {
    for (let i = 0; i < particleList.length; i++) {
        let p = particleList[i];
        if (p.age <= 0.1) {
            particleList.splice(i, 1);
        }
    }
    for (let i = 0; i < bulletList.length; i++) {
        let p = bulletList[i];
        if (p.age <= 0) {
            bulletList.splice(i, 1);
        }
    }
    for (let i = 0; i < explosionList.length; i++) {
        let e = explosionList[i];
        if (e.rad <= 0.1) {
            explosionList.splice(i, 1);
        }
    }
    for (let i = 0; i < damagePlumList.length; i++) {
        let e = damagePlumList[i];
        if (e.size <= 0) {
            damagePlumList.splice(i, 1);
        }
    }
}

function scoreManager() {
    scoreDom.innerText = String(state.score).padStart(4, '0');
}

function crtEffect() {
    for (let i = 0; i < H; i++) {
        let x = 0;
        let y = i * 3;
        CTX.strokeStyle = 'rgba(22,4,37,.8)';
        CTX.imageSmoothingEnabled = false;
        CTX.lineWidth = 1;
        CTX.beginPath();
        CTX.moveTo(x, y);
        CTX.lineTo(W, y);
        CTX.stroke();
    }
}



function create(args) {
    let {
        type,
        qty,
        pos,
        rad,
        color,
        nature,
        dmg
    } = args;
    switch (type) {
        case 'asteroid':
            for (let i = 0; i < qty; i++) {
                let randOff = helpers.random(-40,40);
                let randAngle = helpers.degToRad(helpers.random(0,360));
                let x = Math.cos(randAngle);
                let y = Math.sin(randAngle);                
                let a;
                if (rad) {
                    a = new Asteroid(new Vec(pos.x,pos.y).add(randOff), rad, new Vec(x,y));
                } else {
                    a = new Asteroid();
                }
                a.spawn();
                asteroidList.push(a);
            };
            break;
        case 'bullet':
            {
                let px = ship.centroid().x + ship.pos.x;
                let py = ship.centroid().y + ship.pos.y;
                let s = ship.scale +20;
                let a = ship.angle.toPrecision(3);
                let color = helpers.randColor();
                let acos = a => { // cosine of angle
                    return Math.cos(a - PI); // subtracting PI to mirror the shooting angle.
                }
                let asin = a => { // sine of angle
                    return Math.sin(a - PI); // subtracting PI to mirror the shooting angle.
                }
                let acc = new Vec(acos(a), asin(a));
                let x = acos(a) * s + px;
                let y = asin(a) * s + py;
                bulletList.push(new Bullet(new Vec(x, y), acc, color));
            }
            break;
        case 'thrust':
            for (let i = 0; i < qty; i++) {
                let px = ship.centroid().x + ship.pos.x;
                let py = ship.centroid().y + ship.pos.y;
                let s = ship.scale * 1.1;
                let a = ship.angle;
                let acos = a => {
                    return Math.cos(a);
                }
                let asin = a => {
                    return Math.sin(a);
                }
                let randAcc = new Vec(helpers.random(acos(a) - 2, acos(a) + 2), asin(a));
                let randX = helpers.random(acos(a) * s + px-4, acos(a) * s + px+4);
                let randY = helpers.random(asin(a) * s + py-4, asin(a) * s + py+4);
                let r = helpers.random(1, 8);
                particleList.push(new ThrustParticle(new Vec(randX, randY), randAcc, r));
            }
            break;
        case 'explosion':
            for (let i = 0; i < helpers.random(20,30); i++) {
                let {
                    x,
                    y
                } = pos;
                let ax = helpers.random(-4, 4);
                let ay = helpers.random(-4, 4);
                if(color) {
                    explosionList.push(new Explosion(new Vec(x, y), new Vec(ax, ay), color,nature));
                } else {
                    explosionList.push(new Explosion(new Vec(x, y), new Vec(ax, ay), null,nature));
                }
            }
            break;
            case 'plum':
                let {x,y} = pos;
                damagePlumList.push(new DamagePlum(new Vec(x,y), dmg))
            break;
    }
}
function log() {
    let msg = `ParticleList Length ${particleList.length}
    ExplosionList Length ${explosionList.length}
    StarsList Length ${starsList.length}
    AsteroidList Length ${asteroidList.length}
    damagePlumList Length ${damagePlumList.length}
    BulletList Length ${bulletList.length}
    `
    logger.innerText = msg;
}

function gui() {
    let style = `rotate(${helpers.radToDeg(ship.angle)-90})`;
    angleDom.setAttribute('transform', style);
}

buttonDom.addEventListener('click', () => {
    lobbyDom.style.animation = 'fadeIn 1s forwards cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(()=>{ 
        scene.game();
        scene.setCurrent('game');
        lobbyDom.style.display = 'none';
    },1200)
})
init();

