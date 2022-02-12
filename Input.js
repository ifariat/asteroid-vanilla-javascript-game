let input = {
    up: false,
    right: false,
    down: false,
    left: false,
    shoot: false,
    listen() {
        addEventListener(
            "keydown",
            e => {
                if(e.key) {
                    switch (e.key.toLowerCase()) {
                        case "arrowleft":
                            this.left = true;
                            break;
                        case "arrowright":
                            this.right = true;
                            break;
                        case "arrowup":
                            this.up = true;
                            break;
                        case "arrowdown":
                            this.down = true;
                            break;
                        case " ":
                            this.space = true;
                            break;
                    }
                }
            },
            false
        );
        addEventListener(
            "keyup",
            e => {
                if(e.key) {
                    switch (e.key.toLowerCase()) {
                        case "arrowleft":
                            this.left = false;
                            break;
                        case "arrowright":
                            this.right = false;
                            break;
                        case "arrowup":
                            this.up = false;
                            break;
                        case "arrowdown":
                            this.down = false;
                            break;
                        case " ":
                            this.space = false;
                            break;
                    }
                }
            },
            false
        );
    }
};
export default input;