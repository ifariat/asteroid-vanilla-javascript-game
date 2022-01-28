const meter = {
    _CTX: undefined,
    _FPS_DOM: undefined,
    _H: undefined,
    _W: undefined,
    _bars: [],
    _desiredFPS: 60,
    _dt: undefined,
    _startTime: performance.now(),
    _timeNow: undefined,
    _fps: 0,
    _init: false,
    _data: [],
    _DOM_ELMTS: {
        bg: undefined,
        fpsPrim: undefined,
        fpsSec: undefined
    },
    _theme: {
        dark: {
            accent: '#11F9D8',
            secondary: '#3b3b44',
            background: '#0e0e0f'
        },
        light: {
            accent: '#11F9D8',
            secondary: '#cbcbd3',
            background: '#fff'
        }
    },
    _Bar: class {
        constructor(x, y, w, h, ctx) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.ctx = ctx;
            this.color = {
                light: '#11F9D8',
                dark: '#3b3b44'
            }
        }
        draw() {
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.fillStyle = this.color.dark;
            this.ctx.fillRect(this.x, this.y, this.w, this.h / 1.5);
            this.ctx.fillStyle = this.color.light;
            this.ctx.fillRect(this.x, this.h / 1.5, this.w, 4);
        }
        border() {
            if (this.x + this.w < -10) {
                for (let i = 0; i < meter._bars.length; i++) {
                    meter._bars.unshift();
                }
            }
        }
        update() {
            this.x -= 0.12 * meter._dt * meter._desiredFPS;
            this.border();
            this.draw();
        }
    },
    _tick(timestamp) {
        this._timeNow = timestamp;
        const diff = this._timeNow - this._startTime;
        this._data.push(diff);
        this._dt = diff / 1000;
        this._startTime = this._timeNow;
    },
    setTheme(theme = 'd') {
        if (theme == 'light' || theme == 'l') {
            this._DOM_ELMTS.bg.style.setProperty('--background', this._theme.light.background);
            this._DOM_ELMTS.fpsPrim.style.setProperty('--accent', this._theme.light.accent);
            this._DOM_ELMTS.fpsSec.style.setProperty('--secondary', this._theme.light.secondary);
        }
        if (theme == 'dark' || theme == 'd') {
            this._DOM_ELMTS.bg.style.setProperty('--background', this._theme.dark.background);
            this._DOM_ELMTS.fpsPrim.style.setProperty('--accent', this._theme.dark.accent);
            this._DOM_ELMTS.fpsSec.style.setProperty('--secondary', this._theme.dark.secondary);

        }
    },
    init(theme) {
        const body = document.querySelector('body');
        const html = `
        <div id="meterjs">
            <div class="wrapper">
                <div id="fps"><div>00</div><span>FPS</span></div>
                <canvas id="meter"></canvas>
            </div>
        </div>`;
        body.insertAdjacentHTML('beforeend', html);
        this._DOM_ELMTS.fpsPrim = document.querySelector('#meterjs #fps');
        this._DOM_ELMTS.fpsSec = document.querySelector('#meterjs #fps span');
        this._DOM_ELMTS.bg = document.querySelector('#meterjs');
        this._CTX = document.querySelector('#meter').getContext('2d');
        this._CTX.canvas.width = this._W = 80;
        this._CTX.canvas.height = this._H = 30;
        this.setTheme(theme)
        this._init = true;
    },
    run(timestamp) {
        this._tick(timestamp);
        if (this._init) {
            this._CTX.clearRect(0, 0, this._W, this._H)
            for (const bar of this._bars) {
                bar.update();
            }
            if (this._data.length >= 60) {
                const dtsum = this._data.reduce((a, c) => a + c);
                this._fps = Math.round(1000 / (dtsum / 60));
                this._data.length = 0;
                const digitLen = this._fps.toString().length;
                const fps = digitLen > 1 ? this._fps : '0' + this._fps;
                const html = `<div>${fps}</div><span>FPS</span>`;
                if(this._fps) {
                    this._DOM_ELMTS.fpsPrim.innerHTML = html;
                }
                const map = n => {
                    return (n - 0) * (this._H - 0) / (this._desiredFPS - 0) + 0;
                }
                const pos = {
                    x: this._W,
                    y: 0
                }
                const size = {
                    w: Math.floor(this._W / 15),
                    h: this._fps == 0 ? this._fps : map(this._fps)
                }
                this._bars.push(new this._Bar(pos.x, pos.y, size.w, size.h, this._CTX));
            }
        }
    }
};


export default meter;