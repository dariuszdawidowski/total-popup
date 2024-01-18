/***************************************************************************************************
 *         oO @                                                                                    *
 *       o  ___ __________    Total Popup Window                                                   *
 *     _T___|DC |O O  O O|    Create, drag, resize, minimize and maximize popup window.            *
 *    >|______|-|________|    MIT License                                                          *
 *    /oo-O-OO    oo--oo      Copyright (c) 2022-2024 Dariusz Dawidowski                           *
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
     * @param args.callback.onMaximize: called after window is maximized to full screen 
     * @param args.callback.onDemaximize: called after window is demaximized from full screen
     * @param args.callback.onClose: called after window is closed or locked closed
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
            onMaximize: null,
            onDemaximize: null,
            onClose: null
        };
        assignArgs(this.callback, args.callback);

        // Currently clicked element
        this.target = null;
        // Is window maximized
        this.fullscreen = false;

        // Is close locked
        this.closeLocked = false;

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

        // Toolbar with control buttons
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

        this.controls = null;
        if (controlsOpt.icons.minimize || controlsOpt.icons.maximize || controlsOpt.icons.demaximize || controlsOpt.icons.close || controlsOpt.icons.locked) {
            this.controls = new TotalPopupButtons({
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
        this.startDragEvent = this.startDrag.bind(this);
        this.dragEvent = this.drag.bind(this);
        this.endDragEvent = this.endDrag.bind(this);
        this.main.addEventListener('pointerdown', this.startDragEvent);

        // Out window event
        document.addEventListener('mouseout', (event) => {
            const from = event.relatedTarget || event.toElement;
            if (!from || from.nodeName == 'HTML') {
                this.endDrag();
            }
        });
    }

    startDrag(event) {
        if (!this.fullscreen) {
            this.target = this.getTarget(event.composedPath(), ['border', 'content', 'toolbar', 'total-popup-window']);
            if (this.target != null) {
                // Move to the end of DOM
                this.main.parentNode.append(this.main);
                // Bind events
                this.container.addEventListener('pointermove', this.dragEvent);
                this.container.addEventListener('pointerup', this.endDragEvent);
                this.transform.offset.start(event.x, event.y);
            }
        }
    }

    drag(event) {
        if (this.target != null) {
            this.transform.offset.update(event.x, event.y);
            this.updatePosition(this.target);
            this.update();
        }
    }

    endDrag() {
        this.container.removeEventListener('pointermove', this.dragEvent);
        this.container.removeEventListener('pointerup', this.endDragEvent);
        this.target = null;
    }

    getTarget(path, classNames) {
        for (const element of path) {
            if (element.nodeName == 'DIV' && classNames.some(className => element.classList.contains(className))) return element;
        }
        return null;
    }

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
        else if (element.classList.contains('total-popup-window') || element.classList.contains('content') || element.classList.contains('toolbar')) {
            this.transform.x += frameX;
            this.transform.y += frameY;
        }
    }

    update() {
        this.main.style.transform = `translate(${this.transform.x}px, ${this.transform.y}px)`;
        const width = Math.max(Math.max(this.transform.width, this.transform.minWidth), Math.min(this.transform.width, this.transform.maxWidth));
        const height = Math.max(Math.max(this.transform.height, this.transform.minHeight), Math.min(this.transform.height, this.transform.maxHeight));
        this.main.style.width = `${width}px`;
        this.main.style.height = `${height}px`;
        this.middle.style.width = `${width - (this.transform.borderWidth * 2)}px`;
        const toolbarHeight = this.controls ? this.controls.main.offsetHeight : 0;
        this.middle.style.height = `${height - (this.transform.borderWidth * 2) - toolbarHeight}px`;
    }

    hide() {
        this.container.removeEventListener('pointerdown', this.startDragEvent);
        this.container.removeEventListener('pointermove', this.dragEvent);
        this.container.removeEventListener('pointerup', this.endDragEvent);
        this.main.style.display = 'none';
    }

    show() {
        this.container.addEventListener('pointerdown',this.startDragEvent);
        this.container.addEventListener('pointermove', this.dragEvent);
        this.container.addEventListener('pointerup', this.endDragEvent);
        this.main.style.display = 'grid';
    }

    maximize() {

        // Maximize to full screen
        if (!this.fullscreen) {
            this.fullscreen = true;
            this.controls.maximize.innerHTML = this.controls.icons.demaximize;
            this.main.style.transform = `translate(0px, ${this.transform.margin.top}px)`;
            const width = document.body.clientWidth;
            const height = document.body.clientHeight - this.transform.margin.top;
            this.main.style.width = `${width}px`;
            this.main.style.height = `${height}px`;
            this.middle.style.width = `${width - (this.transform.borderWidth * 2)}px`;
            const toolbarHeight = this.controls ? this.controls.main.offsetHeight : 0;
            this.middle.style.height = `${height - (this.transform.borderWidth * 2) - toolbarHeight}px`;
            if (this.callback.onMaximize) this.callback.onMaximize();
        }

        // Demaximize from full screen
        else { 
            this.fullscreen = false;
            this.controls.maximize.innerHTML = this.controls.icons.maximize;
            this.update();
            if (this.callback.onDemaximize) this.callback.onDemaximize();
        }

    }

    minimize() {
        if (this.callback.onMinimize) this.callback.onMinimize();
        this.hide();
    }

    lockClose() {
        this.closeLocked = true;
        this.controls.close.innerHTML = this.icons.locked;
    }

    unlockClose() {
        this.closeLocked = false;
        this.controls.close.innerHTML = this.icons.close;
    }

    close() {
        if (!this.closeLocked) {
            if (this.callback.onClose) this.callback.onClose();
            this.inner.del();
            this.main.remove();
        }
    }

    fit() {
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
}


class TotalPopupButtons {

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

        this.main = document.createElement('div');
        this.main.style.display = 'flex';
        this.main.classList.add('toolbar');

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

        // Attach to conteiner
        args.container.append(this.main);
 
        // Events
        if (this.icons.close) this.close.addEventListener('pointerup', this.parent.close.bind(this.parent));
        if (this.icons.minimize) this.minimize.addEventListener('pointerup', this.parent.minimize.bind(this.parent));
        if (this.icons.maximize) this.maximize.addEventListener('pointerup', this.parent.maximize.bind(this.parent));
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
