export default class Vec {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    static vector(op, v1, v2) {
        switch (op) {
            case 'add':
                return new Vec(v1.x + v2.x, v1.y + v2.y);
            case 'mult':
                return new Vec(v1.x * v2.x, v1.y * v2.y);
            case 'div':
                return new Vec(v1.x / v2.x, v1.y / v2.y);
            case 'subt':
                return new Vec(v1.x - v2.x, v1.y - v2.y);
        }
    }
    add(v) {
        let isVec = v instanceof Vec;
        if (isVec) {
            this.x += v.x;
            this.y += v.y;
            return new Vec(this.x,this.y);
        } else {
            this.x += v;
            this.y += v;
            return new Vec(this.x,this.y);
        }
    }
    mult(v) {
        let isVec = v instanceof Vec;
        if (isVec) {
            this.x *= v.x;
            this.y *= v.y;
            return new Vec(this.x,this.y);
        } else {
            this.x *= v;
            this.y *= v;
            return new Vec(this.x,this.y);
        }
    }
    sub(v) {
        let isVec = v instanceof Vec;

        if (isVec) {
            this.x -= v.x;
            this.y -= v.y;
            return new Vec(this.x,this.y);
        } else {
            this.x -= v;
            this.y -= v;
            return new Vec(this.x,this.y);
        }
    }
    div(v) {
        let isVec = v instanceof Vec;
        if (isVec) {
            this.x /= v.x;
            this.y /= v.y;
            return new Vec(this.x,this.y);
        } else {
            this.x /= v;
            this.y /= v;
            return new Vec(this.x,this.y);
        }
    }
    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    normalise() {
        let mag = this.mag();
        return new Vec(this.x !== 0 ? this.x / mag : 0, this.y !== 0 ? this.y / mag : 0);
    }
    limit(max) {
        const mag = this.mag();
        if (mag > max) {
            let {
                x,
                y
            } = this.normalise(mag).mult(max);
            this.x = x;
            this.y = y;
        }
        return new Vec(this.x,this.y);
    }
    negative() {
        return new Vec(-this.x, -this.y);
    }
}