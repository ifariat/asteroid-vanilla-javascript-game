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
                switch (e.key.toLowerCase()) {
                    case "a":
                        this.left = true;
                        break;
                    case "d":
                        this.right = true;
                        break;
                    case "w":
                        this.up = true;
                        break;
                    case "s":
                        this.down = true;
                        break;
                    case " ":
                        this.space = true;
                        break;
                }
            },
            false
        );
        addEventListener(
            "keyup",
            e => {
                switch (e.key.toLowerCase()) {
                    case "a":
                        this.left = false;
                        break;
                    case "d":
                        this.right = false;
                        break;
                    case "w":
                        this.up = false;
                        break;
                    case "s":
                        this.down = false;
                        break;
                    case " ":
                        this.space = false;
                        break;
                }
            },
            false
        );
    }
};
export default input;