/***************************************************************************************************
 *         oO @                                                                                    *
 *       o  ___ __________    Total Popup Window                                                   *
 *     _T___|DC |O O  O O|    Create, drag, resize, minimize and maximize popup window.            *
 *    >|______|-|________|    MIT License                                                          *
 *    /oo-O-OO    oo--oo      Copyright (c) 2022-2025 Dariusz Dawidowski                           *
 *                                                                                                 *
 **************************************************************************************************/

class TotalPopupWindow {

    /**
     * Constructor
     * @param args.container: HTMLElement to attach to
     * @param args.x: left corner position (omit for autocenter)
     * @param args.y: top corner position (omit for autocenter)
     * @param args.width: size of window (omit for default)
     * @param args.height: size of window (omit for default)
     * @param args.minWidth: minimum size of window (omit for default)
     * @param args.minHeight: minimum size of window (omit for default)
     * @param args.maxWidth: maximum size of window (omit for default)
     * @param args.maxHeight: maximum size of window (omit for default)
     * @param args.margin: space between edges and maximized window
     * @param args.borderWidth: width of the border
     * @param args.resizable bool for allow to resize window
     * @param args.side: side of control buttons 'left' or 'right'
     * @param args.content: content inside window can be string, HTMLElement of object with (this.main as main HTMLElement)
     * @param args.callback.onClick: called when middle area is clicked
     * @param args.callback.onMinimize: called after window is minimized
     * @param args.callback.onDeminimize: called after window is deminimized
     * @param args.callback.onMaximize: called after window is maximized to full screen 
     * @param args.callback.onDemaximize: called after window is demaximized from full screen
     * @param args.callback.onClose: called after window is closed or locked closed
     * @param args.callback.onResize: called after window was resized
     * @param args.icons {minimize, maximize, demaximize, close, locked}: custom html string for icons look (null disables button)
     */

    constructor(args = null) {

        // Transforms
        this.transform = {
            x: null,
            y: null,
            width: 500,
            height: 500,
            minWidth: 250,
            minHeight: 250,
            maxWidth: 1500,
            maxHeight: 1500,
            margin: {top: 15, bottom: 15, left: 15, right: 15},
            borderWidth: 4,
            offset: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
                start: function(x, y) {
                    this.x1 = this.x2 = x;
                    this.y1 = this.y2 = y;
                },
                update: function(x, y) {
                    this.x2 = x;
                    this.y2 = y;
                },
                get: function() {
                    const result = [this.x2 - this.x1, this.y2 - this.y1];
                    this.x1 = this.x2;
                    this.y1 = this.y2;
                    return result;
                }
            },
            resizable: true
        };
        assignArgs(this.transform, args);

        this.callback = {
            onMinimize: null,
            onDeminimize: null,
            onMaximize: null,
            onDemaximize: null,
            onClose: null,
            onResize: null
        };
        assignArgs(this.callback, args.callback);

        // Currently clicked element
        this.target = null;

        // Mode: 'window' | 'fullscreen' | 'miniature'
        this.mode = 'window';

        // Is close locked
        this.closeLocked = false;

        // Cache history
        this.history = {
            transform: { ...this.transform },
            mode: this.mode,
            store: () => {
                this.history.transform.x = this.transform.x;
                this.history.transform.y = this.transform.y;
                this.history.transform.width = this.transform.width;
                this.history.transform.height = this.transform.height;
                this.history.transform.minWidth = this.transform.minWidth;
                this.history.transform.minHeight = this.transform.minHeight;
                this.history.transform.maxWidth = this.transform.maxWidth;
                this.history.transform.maxHeight = this.transform.maxHeight;
                this.history.mode = this.mode;
            },
            restore: () => {
                this.transform.x = this.history.transform.x;
                this.transform.y = this.history.transform.y;
                this.transform.width = this.history.transform.width;
                this.transform.height = this.history.transform.height;
                this.transform.minWidth = this.history.transform.minWidth;
                this.transform.minHeight = this.history.transform.minHeight;
                this.transform.maxWidth = this.history.transform.maxWidth;
                this.transform.maxHeight = this.history.transform.maxHeight;
                this.mode = this.history.mode;
            },
        };

        // Main window
        this.main = document.createElement('div');
        this.main.style.position = 'absolute';
        this.main.style.display = 'grid';
        this.main.style.gridTemplateColumns = `${this.transform.borderWidth}px auto ${this.transform.borderWidth}px`;
        this.main.style.gridTemplateRows = `${this.transform.borderWidth}px auto ${this.transform.borderWidth}px`;
        this.main.classList.add('total-popup-window');

        // Border
        this.bottomRight = new TotalPopupBorder('bottom-right', this.transform.resizable);
        this.bottomLeft = new TotalPopupBorder('bottom-left', this.transform.resizable);
        this.topLeft = new TotalPopupBorder('top-left', this.transform.resizable);
        this.topRight = new TotalPopupBorder('top-right', this.transform.resizable);
        this.top = new TotalPopupBorder('top', this.transform.resizable);
        this.bottom = new TotalPopupBorder('bottom', this.transform.resizable);
        this.left = new TotalPopupBorder('left', this.transform.resizable);
        this.right = new TotalPopupBorder('right', this.transform.resizable);

        // Middle page
        this.middle = document.createElement('div');
        this.middle.style.display = 'flex';
        this.middle.style.flexDirection = 'column';
        this.middle.classList.add('middle');

        // Titlebar with control buttons
        const controlsOpt = {
            side: 'right',
            icons: {
                minimize: '&#11451;',
                maximize: '&#43;',
                demaximize: '&#43;',
                close: '&#215;',
                locked: '&#129181;'
            }
        };
        assignArgs(controlsOpt, args);

        this.titlebar = null;
        if (controlsOpt.icons.minimize || controlsOpt.icons.maximize || controlsOpt.icons.demaximize || controlsOpt.icons.close || controlsOpt.icons.locked) {
            this.titlebar = new TotalPopupTitlebar({
                container: this.middle,
                parent: this,
                ...controlsOpt
            });
        }

        // Inner content container
        this.inner = new TotalPopupInner({parent: this, content: 'content' in args ? args.content : null, onClick: 'callback' in args && 'onClick' in args.callback ? args.callback.onClick : null});
        this.middle.append(this.inner.main);

        // Content (for external access and destructor)
        this.content = args.content;

        // Append all elements
        this.main.append(this.topLeft.main);
        this.main.append(this.top.main);
        this.main.append(this.topRight.main);
        this.main.append(this.left.main);
        this.main.append(this.middle);
        this.main.append(this.right.main);
        this.main.append(this.bottomLeft.main);
        this.main.append(this.bottom.main);
        this.main.append(this.bottomRight.main);

        // Append to parent container
        this.container = args.container || document.querySelector('body');
        this.container.append(this.main);

        // Centre window
        if (this.transform.x == null && this.transform.y == null) {
            this.transform.x = (document.body.clientWidth / 2) - (this.transform.width / 2);
            this.transform.y = (document.body.clientHeight / 2) - (this.transform.height / 2);
        }

        // Recalculate
        this.update();

        // Drag Events
        this.dragStartEvent = this.dragStart.bind(this);
        this.dragMoveEvent = this.dragMove.bind(this);
        this.dragEndEvent = this.dragEnd.bind(this);
        this.main.addEventListener('pointerdown', this.dragStartEvent);

        // Out window event
        document.addEventListener('mouseout', (event) => {
            const from = event.relatedTarget || event.toElement;
            if (!from || from.nodeName == 'HTML') {
                this.dragEnd();
            }
        });

    }

    /**
     * Drag events
     */

    dragStart(event) {
        if (this.mode != 'fullscreen') {
            this.target = this.getTarget(event.composedPath(), ['border', 'content', 'titlebar', 'total-popup-window']);
            if (this.target != null) {
                // Move to the end of DOM
                this.main.parentNode.append(this.main);
                // Bind events
                this.container.addEventListener('pointermove', this.dragMoveEvent);
                this.container.addEventListener('pointerup', this.dragEndEvent);
                this.transform.offset.start(event.x, event.y);
            }
        }
    }

    dragMove(event) {
        if (this.target != null) {
            this.transform.offset.update(event.x, event.y);
            this.updatePosition(this.target);
            this.update();
        }
    }

    dragEnd() {
        this.container.removeEventListener('pointermove', this.dragMoveEvent);
        this.container.removeEventListener('pointerup', this.dragEndEvent);
        if (this.callback.onResize && this.target && this.target.classList.contains('border')) this.callback.onResize();
        this.target = null;
    }

    getTarget(path, classNames) {
        for (const element of path) {
            if (element.nodeName == 'DIV' && classNames.some(className => element.classList.contains(className))) return element;
        }
        return null;
    }

    /**
     * Update position
     */

    updatePosition(element) {
        const [frameX, frameY] = this.transform.offset.get();
        
        if (element.classList.contains('bottom-right') && this.transform.resizable) {
            // Y
            if (this.transform.height + frameY >= this.transform.minHeight && this.transform.height + frameY <= this.transform.maxHeight) {
                this.transform.height += frameY;
            }
            // X
            if (this.transform.width + frameX >= this.transform.minWidth && this.transform.width + frameX <= this.transform.maxWidth)
                this.transform.width += frameX;
        }
        else if (element.classList.contains('bottom-left') && this.transform.resizable) {
            // Y
            if (this.transform.height + frameY >= this.transform.minHeight && this.transform.height + frameY <= this.transform.maxHeight) {
                this.transform.height += frameY;
            }
            // X
            if (this.transform.width - frameX >= this.transform.minWidth && this.transform.width - frameX <= this.transform.maxWidth) {
                this.transform.x += frameX;
                this.transform.width -= frameX;
            } 
        }
        else if (element.classList.contains('top-left') && this.transform.resizable) {
            // Y
            if (this.transform.height - frameY >= this.transform.minHeight && this.transform.height - frameY <= this.transform.maxHeight) {
                this.transform.y += frameY;
                this.transform.height -= frameY;
            }
            // X
            if (this.transform.width - frameX >= this.transform.minWidth && this.transform.width - frameX <= this.transform.maxWidth) {
                this.transform.x += frameX;
                this.transform.width -= frameX;
            }
        }
        else if (element.classList.contains('top-right') && this.transform.resizable) {
            // Y
            if (this.transform.height - frameY >= this.transform.minHeight && this.transform.height - frameY <= this.transform.maxHeight) {
                this.transform.y += frameY;
                this.transform.height -= frameY;
            }
            // X
            if (this.transform.width + frameX >= this.transform.minWidth && this.transform.width + frameX <= this.transform.maxWidth) { 
                this.transform.width += frameX;
            }
        }
        else if (element.classList.contains('top') && this.transform.resizable) {
            if (this.transform.height - frameY >= this.transform.minHeight && this.transform.height - frameY <= this.transform.maxHeight) {
                this.transform.y += frameY;
                this.transform.height -= frameY;
            }
        }
        else if (element.classList.contains('bottom') && this.transform.resizable) {
            if (this.transform.height + frameY >= this.transform.minHeight && this.transform.height + frameY <= this.transform.maxHeight) {
                this.transform.height += frameY;
            }
        }
        else if (element.classList.contains('left') && this.transform.resizable) {
            if (this.transform.width - frameX >= this.transform.minWidth && this.transform.width - frameX <= this.transform.maxWidth) {
                this.transform.x += frameX;
                this.transform.width -= frameX;
            }
        }
        else if (element.classList.contains('right') && this.transform.resizable) {
            if (this.transform.width + frameX >= this.transform.minWidth && this.transform.width + frameX <= this.transform.maxWidth) {
                this.transform.width += frameX;
            }
        }
        else if (element.classList.contains('total-popup-window') || element.classList.contains('content') || element.classList.contains('titlebar')) {
            this.transform.x += frameX;
            this.transform.y += frameY;
        }
    }

    /**
     * Update calcs
     */

    update() {
        this.main.style.transform = `translate(${this.transform.x}px, ${this.transform.y}px)`;
        const width = Math.max(Math.max(this.transform.width, this.transform.minWidth), Math.min(this.transform.width, this.transform.maxWidth));
        const height = Math.max(Math.max(this.transform.height, this.transform.minHeight), Math.min(this.transform.height, this.transform.maxHeight));
        this.main.style.width = `${width}px`;
        this.main.style.height = `${height}px`;
        this.middle.style.width = `${width - (this.transform.borderWidth * 2)}px`;
        const titlebarHeight = this.titlebar ? this.titlebar.main.offsetHeight : 0;
        this.middle.style.height = `${height - (this.transform.borderWidth * 2) - titlebarHeight}px`;
    }

    /**
     * Hide window
     */

    hide() {
        this.container.removeEventListener('pointerdown', this.dragStartEvent);
        this.container.removeEventListener('pointermove', this.dragMoveEvent);
        this.container.removeEventListener('pointerup', this.dragEndEvent);
        this.main.style.display = 'none';
    }

    /**
     * Show window
     */

    show() {
        this.container.addEventListener('pointerdown',this.dragStartEvent);
        this.container.addEventListener('pointermove', this.dragMoveEvent);
        this.container.addEventListener('pointerup', this.dragEndEvent);
        this.main.style.display = 'grid';
    }

    /**
     * Maximize window
     */

    maximize() {

        // Maximize to full screen
        if (this.mode == 'window') {
            this.history.store();
            this.mode = 'fullscreen';
            this.titlebar.maximize.innerHTML = this.titlebar.icons.demaximize;
            this.transform.x = 0;
            this.transform.y = 0;
            this.transform.width = document.body.clientWidth;
            this.transform.height = document.body.clientHeight;
            this.update();
            if (this.callback.onMaximize) this.callback.onMaximize();
        }

        // Demaximize from full screen
        else if (this.mode == 'fullscreen') {
            this.history.restore();
            // this.mode = 'window';
            this.titlebar.maximize.innerHTML = this.titlebar.icons.maximize;
            this.update();
            if (this.callback.onDemaximize) this.callback.onDemaximize();
        }

        // Restore from miniature
        else if (this.mode == 'miniature') {
            if (this.callback.onDeminimize) this.callback.onDeminimize();
            this.deminiaturize();
            this.update();
        }

    }

    /**
     * Minimize window
     */

    minimize() {
        if (this.callback.onMinimize) this.callback.onMinimize();
        else this.hide();
    }

    /**
     * Miniature
     */

    miniaturize(args = {}) {
        const { width = 64, height = 64, title = '&#x279A;' } = args;

        // Store transforms and params
        this.history.store();

        // Maximize icon
        if (this.mode == 'fullscreen') {
            this.titlebar.maximize.innerHTML = this.titlebar.icons.maximize;
        }
        else if (this.mode == 'window') {
            this.titlebar.maximize.innerHTML = this.titlebar.icons.demaximize;
        }

        // Mode
        this.mode = 'miniature';

        // Enable animation
        this.main.style.transition = 'width 0.5s ease-out, height 0.5s ease-out, transform 0.5s ease-out';
        setInterval(() => this.main.style.removeProperty('transition'), 500);

        // Hide borders
        this.bottomRight.hide();
        this.bottomLeft.hide();
        this.topLeft.hide();
        this.topRight.hide();
        this.top.hide();
        this.bottom.hide();
        this.left.hide();
        this.right.hide();

        // Hide '-' button
        this.titlebar.minimize.style.display = 'none';

        // Hide content for html
        if ('style' in this.content) this.content.style.display = 'none';
        // Hide content for a tab object
        else if (typeof(this.content) == 'object') this.content.hide();

        // Size
        this.transform.width = width;
        this.transform.height = height;
        this.transform.minWidth = width;
        this.transform.minHeight = height;

        // Position
        if ('left' in args) this.transform.x = args.left + this.transform.margin.left;
        if ('right' in args) this.transform.x = this.container.offsetWidth - args.right - this.transform.width - this.transform.margin.right;
        if ('top' in args) this.transform.y = args.top + this.transform.margin.top;
        if ('bottom' in args) this.transform.y = this.container.offsetHeight - args.bottom - this.transform.height - this.transform.margin.bottom;

        // Content
        this.titlebar.title.innerHTML = title;

        // Tag as miniature
        this.miniature = true;
        this.main.classList.add('miniature');

        // Update
        this.update();
    }

    /**
     * Restore window
     */

    deminiaturize() {

        // Restore transforms and params
        this.history.restore();

        // Show borders
        this.bottomRight.show();
        this.bottomLeft.show();
        this.topLeft.show();
        this.topRight.show();
        this.top.show();
        this.bottom.show();
        this.left.show();
        this.right.show();

        // Show '-' button
        this.titlebar.minimize.style.display = 'block';

        // Show content for html
        if ('style' in this.content) this.content.style.display = 'flex';
        // Show content for a tab object
        else if (typeof(this.content) == 'object') this.content.show();

        // Content
        this.titlebar.title.innerHTML = '';

        // Tag as miniature
        this.miniature = false;
        this.main.classList.remove('miniature');
    }

    /**
     * Lock closing window
     */

    lockClose() {
        this.closeLocked = true;
        this.titlebar.close.innerHTML = this.icons.locked;
    }

    /**
     * Unlock closing window
     */

    unlockClose() {
        this.closeLocked = false;
        this.titlebar.close.innerHTML = this.icons.close;
    }

    /**
     * Close window
     */

    close() {
        if (!this.closeLocked) {
            if (this.callback.onClose) this.callback.onClose();
            this.inner.del();
            this.main.remove();
        }
    }

    /**
     * Align to dimensions of the 'screen' | 'content'
     */

    fit(target = 'screen') {

        // Fit to browser's window dimensions
        if (target == 'screen') {
            const width = document.body.clientWidth - (this.transform.margin.right + this.transform.margin.left);
            const height = document.body.clientHeight - (this.transform.margin.bottom + this.transform.margin.top);

            if (this.transform.maxWidth > width) {
                this.transform.x = this.transform.margin.right;
                this.transform.width = width;
            }
            else {
                this.transform.x = (document.body.clientWidth / 2) - (this.transform.maxWidth / 2);
                this.transform.width = this.transform.maxWidth;
            }

            if (this.transform.maxHeight > height) {
                this.transform.y = this.transform.margin.top;
                this.transform.height = height;
            }
            else {
                this.transform.y = (document.body.clientHeight / 2) - (this.transform.maxHeight / 2);
                this.transform.height = this.transform.maxHeight;
            }
            this.update();
        }

        // Fit to popup's content dimensions
        else if (target == 'content') {
            const width = this.middle.scrollWidth;
            const height = this.middle.scrollHeight + this.titlebar.height();
            this.transform.width = width;
            this.transform.height = height;
            this.adjust();
        }
    }

    /**
     * Keep popup in the screen bounds
     */

    adjust() {
        // Get screen dimensions
        const screenWidth = document.body.clientWidth;
        const screenHeight = document.body.clientHeight;

        // Right edge check
        if (this.transform.x + this.transform.width > screenWidth - this.transform.margin.right) {
            this.transform.x = screenWidth - this.transform.width - this.transform.margin.right;
        }

        // Bottom edge check
        if (this.transform.y + this.transform.height > screenHeight - this.transform.margin.bottom) {
            this.transform.y = screenHeight - this.transform.height - this.transform.margin.bottom;
        }

        // Left edge check
        if (this.transform.x < this.transform.margin.left) {
            this.transform.x = this.transform.margin.left;
        }

        // Top edge check
        if (this.transform.y < this.transform.margin.top) {
            this.transform.y = this.transform.margin.top;
        }

        // Update the window position
        this.update();
    }

    /**
     * Force position / size
     * this.transofrm compatible args
     */

    retransform(args) {
        assignArgs(this.transform, args);
        this.update();
    }

}


class TotalPopupInner {

    constructor(args) {
        this.parent = args.parent;
        this.main = document.createElement('div');
        if ('onClick' in args && args.onClick != null) {
            this.main.addEventListener('click', args.onClick);
        }
        if ('content' in args && args.content != null) {
            this.add(args.content);
        }
        this.main.classList.add('content');
        this.content = null;
    }

    add(content) {
        // HTML string.
        if (typeof(content) == 'string') {
            this.main.innerHTML = content;
        }
        // DOM Element
        else if (Object.getPrototypeOf(content.constructor).name == 'HTMLElement') {
            this.main.append(content);
        }
        // new Costam
        else if (typeof(content) == 'object') {
            this.content = content;
            this.main.append(content.main);
            if ('parent' in content) content.parent = this.parent;
        }
    }

    del() {
        if (this.content)
            delete this.content;
    }
}


class TotalPopupBorder {

    constructor(classId, resizable = false) {

        this.main = document.createElement('div');
        this.main.classList.add('border');
        this.main.classList.add(classId);
        if (resizable)
            this.main.classList.add('resize');
    }

    show() {
        this.main.style.removeProperty('width');
        this.main.style.removeProperty('height');
    }

    hide() {
        this.main.style.width = '0';
        this.main.style.height = '0';
    }

}


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

/* Assign one source dict to target (copy only properties which exists) */

function assignArgs(target, source) {
    if (Object(target) !== target || Object(source) !== source)
        return source;
    for (const p in source)
        if (p in target) target[p] = assignArgs(target[p], source[p]);
    return target;
}
