'use strict'
import Vec from './Vec.js';
import Input from './Input.js';
import Meter from './Meter.js';

const CTX = document.querySelector('#game').getContext('2d'),
    W = CTX.canvas.width = 650 || innerWidth,
    H = CTX.canvas.height = 650 || innerHeight,
    PI = Math.PI,
    PI2 = PI * 2,
    FPS = 60;
let ship,
    particleList = [],
    bulletList = [],
    asteroidList = [],
    explosionList = [],
    starsList = [],
    DamagePlumList = [],
    score = 0,
    gameOver = false,
    loopId;

function degToRad(deg) {
    return deg * (PI / 180);
}
const randColor = () => {
    return `hsl(${~~(Math.random() * 360)},100%,50%)`
};
function precise(num,precision = 4) {
    return +(num.toString().toPrecision(precision));
}
function random(min, max) {
    return min + Math.random() * (max - min);
}

function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t
}

function distance(a, b) {
    let distX = b.x - a.x,
        distY = b.y - a.y;
    return Math.sqrt((distX * distX + distY * distY));
}

class Star {
    constructor(pos,size) {
        this.pos = pos;
        this.velocity = new Vec(0, 0);
        this.size = size;
        this.maxspeed = 2;
        this.alpha = 1 ;
        this.color = 'hsl(193, 100%,100%)';;
    }
    draw() {
        let {
            x,
            y
        } = this.pos;
        let r = this.size;
        CTX.shadowColor = CTX.fillStyle = this.color;
        // CTX.shadowBlur = 5;
        CTX.beginPath();
        CTX.fillRect(x, y, r, r)
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
        let vel = ship.velocity;
        this.velocity.add(vel.negative().mult(this.size * 0.05));
        this.pos.add(this.velocity);
        this.velocity.limit(0.05);
    }
};
class DamagePlum {
    constructor(pos, color) {
        this.pos = pos;
        this.acceleration = new Vec(0,-0.5);
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
        CTX.fillText('+20',x,y)
        CTX.shadowBlur = 0;
    }
    update() {
        if (this.size - .5 > 0) {
            this.size -= .5;
        }
        this.velocity.add(this.acceleration);
        this.pos.add(this.velocity);
        this.velocity.mult(this.friction);
        this.acceleration.mult(0);
    }
}
class Explosion {
    constructor(pos, acc, color) {
        this.pos = pos;
        this.velocity = new Vec(0, 0);
        this.acceleration = acc;
        this.friction = 0.99;
        this.isStroke = random(0,1) < 0.5;
        this.rad = random(1, 5);
        this.maxspeed = 0.01;
        this.hue = 40;
        this.color = color || ',50%,50%)';
    }
    draw() {
        let {
            x,
            y
        } = this.pos;
        CTX.globalCompositeOperation = "lighter";
        CTX.shadowColor = CTX.fillStyle = `hsl(${this.hue}${this.color}`; 
        CTX.shadowBlur = 20;
        CTX.beginPath();
        CTX.arc(x, y, this.rad, 0, PI2)
        CTX.fill();
        CTX.shadowBlur = 0;
        CTX.globalCompositeOperation = "source-over";
    }
    applyForce(f) {
        this.acceleration.add(f.normalise().mult(this.maxspeed));
    }
    update() {
        this.hue -= 2 ;
        if (this.rad - 0.05 > 0) {
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
            let radsAsteroidShip = a.rad + ship.scale;
            if(distance(s.centroid().add(s.pos), a.pos) < radsAsteroidShip) {
                // cancelAnimationFrame(loopId);
                if(!gameOver) {
                    create({
                        type: 'explosion',
                        color: 'rgba(255, 255, 255,',
                        pos:s.centroid().add(s.pos)
                    });
                }
                gameOver = true;
            }
            if(bu.length > 0) {
                for (let j = 0; j < bu.length; j++) {
                    let b = bu[j];
                    let radsAsteroidBullet = a.rad + b.rad;
    
                    if (distance(a.pos, b.pos) < radsAsteroidBullet) {
                        bulletList.splice(j, 1);
                        a.health -= 1;
                        a.lightness += 2;
                        if (a.health <= 0) {
                            score += 10;
                            let aCopy = Object.assign({}, a);
                            let {
                                pos
                            } = aCopy;
                            create({
                                type: 'explosion',
                                pos
                            });
                            create({
                                type: 'plum',
                                pos
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
        this.color = 'hsl(13, 100%,';
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
            console.log('running')
            if (random(-1, 1) > 0) {
                x = -this.rad;
                y = random(-this.rad * 2, H);
            } else {
                x = random(-this.rad * 2, W);
                y = -this.rad;
            }
            randDir = new Vec(random(-1, 1), random(-1, 1));
            let targetDir = Vec.vector('subt', ship.pos, new Vec(x, y)).normalise();
            this.velocity = random(-1, 1) > 0 ? randDir : targetDir;
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
        CTX.shadowBlur = 12;
        CTX.lineWidth = 2;
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
        this.color = '100%, 50%)';
        this.hue = 170;
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
        CTX.lineWidth = 3.5;
        CTX.lineCap = 'round';
        CTX.beginPath();
        CTX.moveTo(x, y);
        CTX.lineTo(nx, ny);
        CTX.stroke();
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
        this.scale = 12;
        this.angle = degToRad(90);
        this.friction = 1;
        this.delay = 2;
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
        if(gameOver) return;
        let {
            x,
            y
        } = this.centroid();
        let g = this.geometry;
        CTX.fillStyle = 'white';
        CTX.lineWidth = 3;
        CTX.save();
        CTX.translate(x + this.pos.x, y + this.pos.y) // translate canvas to centroid of the triangle.
        CTX.rotate(this.angle - degToRad(90)); // do the rotation.
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
    update() {
        if(gameOver) return;
        let x = +(Math.cos(this.angle)).toPrecision(2);
        let y = +(Math.sin(this.angle)).toPrecision(2);

        if (Input.up) {
            this.applyForce(new Vec(-x, -y));
            create({
                type: 'thrust',
                qty: 1
            });
        }
        if (Math.abs(this.angle) >= degToRad(360)) {
            this.angle = 0;
        }
        if (Input.right) {
            this.angle += degToRad(4);
        }
        if (Input.left) {
            this.angle -= degToRad(4);
        }
        // if (Input.down) {
        //     this.applyForce(new Vec(x, y));
        // }

        if (Input.space) {
            if (this.delay-- <= 0) {
                create({
                    type: 'bullet',
                    qty: 1
                });
                this.delay = 3;
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
        this.friction = random(0.3, 0.9);
        this.maxspeed = random(0.5, 1);
        this.alpha = 1;
        this.age = 20;
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
        if (this.rad - 0.3 > 0.1) {
            this.rad -= 0.3;
        }
        if (this.alpha - 0.01 > 0.1) {
            this.alpha -= 0.01;
        }
        this.velocity.add(this.acceleration);
        this.pos.add(this.velocity);
        this.velocity.mult(this.friction);
    }
}
/////////////// LOOP ////////////////

function loop(timestamp) {
    CTX.clearRect(0, 0, W, H)
    loopId = requestAnimationFrame(loop);
    collisionManager();
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
    for (let d of starsList) {
        d.update();
        d.draw()
    }
    for (let d of DamagePlumList) {
        d.update();
        d.draw()
    }
    ship.update();
    ship.border();
    ship.draw();
    crtEffect();
    garbageCollector();
    scoreManager()
    Meter.run(timestamp);
}


function init() {
    ship = new Ship(new Vec(W / 2, H / 2))
    create({
        type: 'asteroid',
        qty: 4
    })
    Input.listen();
    loop();
    for (let i = 0; i < 15; i++) {
        let x = random(-100, W+100);
        let y = random(-100, H+100);
        let pos = new Vec(x, y);
        let size = random(1,5);
        starsList.push(new Star(pos, size));
    }
    Meter.init('d');
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
        if (e.alpha <= 0) {
            explosionList.splice(i, 1);
        }
    }
}

function scoreManager() {
    CTX.fillStyle = 'white';
    CTX.font = '40px meter';
    CTX.fillText(score.toString(), W / 2, 50);
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


init();


function create(args) {
    let {
        type,
        qty,
        pos,
        rad,
        color
    } = args;
    switch (type) {
        case 'asteroid':
            for (let i = 0; i < qty; i++) {
                let randOff = random(-40,40);
                let randAngle = degToRad(random(0,360));
                let x = Math.cos(randAngle);
                let y = Math.sin(randAngle);                
                let a;
                if (rad) {
                    a = new Asteroid(pos.add(randOff), rad, new Vec(x,y));
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
                let s = ship.scale * 4;
                let a = ship.angle.toPrecision(3);
                let color = randColor();
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
                let s = ship.scale * 2;
                let a = ship.angle.toPrecision(3);
                let acos = a => {
                    return Math.cos(a);
                }
                let asin = a => {
                    return Math.sin(a);
                }
                let randAcc = new Vec(random(acos(a) - 0.9, acos(a) + 0.9), asin(a));
                let randX = random(acos(a) * s + px, acos(a) * s + px);
                let randY = random(asin(a) * s + py, asin(a) * s + py);
                let r = random(1, 8);
                particleList.push(new ThrustParticle(new Vec(randX, randY), randAcc, r));
            }
            break;
        case 'explosion':
            for (let i = 0; i < random(20,30); i++) {
                let {
                    x,
                    y
                } = pos;
                let ax = random(-4, 4);
                let ay = random(-4, 4);
                if(color) {
                    explosionList.push(new Explosion(new Vec(x, y), new Vec(ax, ay), color));
                } else {
                    explosionList.push(new Explosion(new Vec(x, y), new Vec(ax, ay), null));
                }
            }
            case 'plum':
                DamagePlumList.push(new DamagePlum(pos, 'cyan'))
            break;
    }
}