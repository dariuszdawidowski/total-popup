class TotalPopupTitlebar {

    constructor(args) {

        this.parent = args.parent;

        this.icons = {
            minimize: null,
            maximize: null,
            demaximize: null,
            close: null,
            locked: null
        };
        assignArgs(this.icons, args.icons);

        // Main div
        this.main = document.createElement('div');
        this.main.style.display = 'flex';
        this.main.classList.add('titlebar');

        if (args.side == 'left') {
            // Flex left (macOS)
            this.main.style.display = 'flex';
            // Close
            if (this.icons.close) {
                this.close = document.createElement('div');
                this.main.append(this.close);
            }
            // Minimize
            if (this.icons.minimize) {
                this.minimize = document.createElement('div');
                this.main.append(this.minimize);
            }
            // Maximize
            if (this.icons.maximize) {
                this.maximize = document.createElement('div');
                this.main.append(this.maximize);
            }
        }
        else if (args.side == 'right') {
            // Flex reverse (Windows)
            this.main.style.flexDirection = 'row-reverse';
            // Close
            if (this.icons.close) {
                this.close = document.createElement('div');
                this.main.append(this.close);
            }
            // Maximize
            if (this.icons.maximize) {
                this.maximize = document.createElement('div');            
                this.main.append(this.maximize);
            }
            // Minimize
            if (this.icons.minimize) {
                this.minimize = document.createElement('div');
                this.main.append(this.minimize);
            }
        }

        // Close
        if (this.icons.close) {
            this.close.innerHTML = args.icons.close;
            this.close.classList.add('close');
            this.close.classList.add('window-button');
        }
        // Minimize
        if (this.icons.minimize) {
            this.minimize.innerHTML = args.icons.minimize;
            this.minimize.classList.add('minimize');
            this.minimize.classList.add('window-button');
        }
        // Maximize
        if (this.icons.maximize) {
            this.maximize.innerHTML = args.icons.maximize;
            this.maximize.classList.add('maximize');
            this.maximize.classList.add('window-button');
        }

        // Tile
        this.title = document.createElement('div');
        this.title.classList.add('title');
        this.main.append(this.title);

        // Attach to container
        args.container.append(this.main);
 
        // Events
        if (this.icons.close) this.close.addEventListener('pointerup', this.parent.close.bind(this.parent));
        if (this.icons.minimize) this.minimize.addEventListener('pointerup', this.parent.minimize.bind(this.parent));
        if (this.icons.maximize) this.maximize.addEventListener('pointerup', this.parent.maximize.bind(this.parent));
    }

    /**
     * Returns real height
     */

    height() {
        const dim = this.main.getBoundingClientRect();
        return dim.height;
    }

}

