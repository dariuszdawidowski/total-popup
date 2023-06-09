/***************************************************************************************************
 *         oO @                                                                                    *
 *       o  ___ __________    Total Popup Window                                                   *
 *     _T___|DC |O O  O O|    Create, drag, resize, minimize and maximize popup window.            *
 *    >|______|-|________|    MIT License                                                          *
 *    /oo-O-OO    oo--oo      Copyright (c) 2022-2023 Dariusz Dawidowski                           *
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
     * @param args.callback.onMinimize: called after window is minimized
     * @param args.callback.onMaximize: called after window is maximized or demaximized
     * @param args.callback.onClose: called after window is closed or locked closed
     * @param args.icons {minimize, maximize, demaximize, close, locked}: custom html string for icons look (null disables button)
     */

    constructor(args = null) {

        // Transforms
        this.transform = {
            x: null,
            y: null,
            w: 500,
            h: 500,
            minWidth: 250,
            minHeight: 250,
            maxHeight: 1500,
            maxWidth: 1500,
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

        // Currently clicked element
        this.target = null;
        // Is window maximized
        this.fullscreen = false;

        // Main window
        this.main = document.createElement('div');
        // this.main.id = uuid();
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
                maximize: '&#9634;',
                demaximize: '&#129196;',
                close: '&#215;',
                locked: '&#129181;'
            },
            callback: {
                onMinimize: null,
                onMaximize: null,
                onClose: null
            }
        };
        assignArgs(controlsOpt, args);

        this.controls = null;
        if (controlsOpt.icons.minimize || controlsOpt.icons.maximize || controlsOpt.icons.demaximize || controlsOpt.icons.close || controlsOpt.icons.locked) {
            this.controls = new TotalPopupControl({
                container: this.middle,
                parent: this,
                ...controlsOpt
            });
        }

        // Inner content container
        this.inner = new TotalPopupInner({parent: this, content: 'content' in args ? args.content : null});
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
            this.transform.x = (document.body.clientWidth / 2) - (this.transform.w / 2);
            this.transform.y = (document.body.clientHeight / 2) - (this.transform.h / 2);
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
            if (this.transform.h + frameY >= this.transform.minHeight && this.transform.h + frameY <= this.transform.maxHeight) 
                this.transform.h += frameY;
            // X
            if (this.transform.w + frameX >= this.transform.minWidth && this.transform.w + frameX <= this.transform.maxWidth)
                this.transform.w += frameX;
        }
        else if (element.classList.contains('bottom-left') && this.transform.resizable) {
            // Y
            if (this.transform.h + frameY >= this.transform.minHeight && this.transform.h + frameY <= this.transform.maxHeight) 
                this.transform.h += frameY;
            // X
            if (this.transform.w - frameX >= this.transform.minWidth && this.transform.w - frameX <= this.transform.maxWidth) {
                this.transform.x += frameX;
                this.transform.w -= frameX;
            } 
        }
        else if (element.classList.contains('top-left') && this.transform.resizable) {
            // Y
            if (this.transform.h - frameY >= this.transform.minHeight && this.transform.h - frameY <= this.transform.maxHeight) {
                this.transform.y += frameY;
                this.transform.h -= frameY;
            }
            // X
            if (this.transform.w - frameX >= this.transform.minWidth && this.transform.w - frameX <= this.transform.maxWidth) {
                this.transform.x += frameX;
                this.transform.w -= frameX;
            }
        }
        else if (element.classList.contains('top-right') && this.transform.resizable) {
            // Y
            if (this.transform.h - frameY >= this.transform.minHeight && this.transform.h - frameY <= this.transform.maxHeight) {
                this.transform.y += frameY;
                this.transform.h -= frameY;
            }
            // X
            if (this.transform.w + frameX >= this.transform.minWidth && this.transform.w + frameX <= this.transform.maxWidth) 
                this.transform.w += frameX;

        }
        else if (element.classList.contains('top') && this.transform.resizable) {
            if (this.transform.h - frameY >= this.transform.minHeight && this.transform.h - frameY <= this.transform.maxHeight) {
                this.transform.y += frameY;
                this.transform.h -= frameY;
            }
        }
        else if (element.classList.contains('bottom') && this.transform.resizable) {
            if (this.transform.h + frameY >= this.transform.minHeight && this.transform.h + frameY <= this.transform.maxHeight) 
                this.transform.h += frameY;

        }
        else if (element.classList.contains('left') && this.transform.resizable) {
            if (this.transform.w - frameX >= this.transform.minWidth && this.transform.w - frameX <= this.transform.maxWidth) {
                this.transform.x += frameX;
                this.transform.w -= frameX;
            }
        }
        else if (element.classList.contains('right') && this.transform.resizable) {
            if (this.transform.w + frameX >= this.transform.minWidth && this.transform.w + frameX <= this.transform.maxWidth)
                this.transform.w += frameX;
        }
        else if (element.classList.contains('total-popup-window') || element.classList.contains('content') || element.classList.contains('toolbar')) {
            this.transform.x += frameX;
            this.transform.y += frameY;
        }
    }

    update() {
        this.main.style.transform = `translate(${this.transform.x}px, ${this.transform.y}px)`;
        this.main.style.width = Math.min(Math.max(this.transform.w, this.transform.minWidth), Math.min(this.transform.w, this.transform.maxWidth)) + 'px';
        this.main.style.height = Math.min(Math.max(this.transform.h, this.transform.minHeight), Math.min(this.transform.h, this.transform.maxHeight)) + 'px';
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
        if (this.fullscreen) {
            this.fullscreen = false;
            this.update();
        }
        else { 
            this.fullscreen = true;
            this.main.style.transform = `translate(0px, ${this.transform.margin.top}px)`;
            this.main.style.width = document.body.clientWidth + 'px';
            this.main.style.height = document.body.clientHeight - this.transform.margin.top + 'px';
        }
    }

    close() {
        this.inner.del();
        this.main.remove();
    }

    fit() {
        const width = document.body.clientWidth - (this.transform.margin.right + this.transform.margin.left);
        const height = document.body.clientHeight - (this.transform.margin.bottom + this.transform.margin.top);

        if (this.transform.maxWidth > width) {
            this.transform.x = this.transform.margin.right;
            this.transform.w = width;
        }
        else {
            this.transform.x = (document.body.clientWidth / 2) - (this.transform.maxWidth / 2);
            this.transform.w = this.transform.maxWidth;
        }

        if (this.transform.maxHeight > height) {
            this.transform.y = this.transform.margin.top;
            this.transform.h = height;
        }
        else {
            this.transform.y = (document.body.clientHeight / 2) - (this.transform.maxHeight / 2);
            this.transform.h = this.transform.maxHeight;
        }

        this.update();
    }
}


class TotalPopupInner {

    constructor(args) {
        this.parent = args.parent;
        this.main = document.createElement('div');
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


class TotalPopupControl {

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

        this.callback = {
            onMinimize: null,
            onMaximize: null,
            onClose: null
        };
        assignArgs(this.callback, args.callback);

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
            this.close.classList.add('button');
        }
        // Minimize
        if (this.icons.minimize) {
            this.minimize.innerHTML = args.icons.minimize;
            this.minimize.classList.add('minimize');
            this.minimize.classList.add('button');
        }
        // Maximize
        if (this.icons.maximize) {
            this.maximize.innerHTML = args.icons.maximize;
            this.maximize.classList.add('maximize');
            this.maximize.classList.add('button');
        }

        // Attach to conteiner
        args.container.append(this.main);
 
        // Is close locked
        this.closeLocked = false;

        // Events
        if (this.icons.close) this.close.addEventListener('pointerup', this.closeWin.bind(this));
        if (this.icons.minimize) this.minimize.addEventListener('pointerup', this.minimizeWin.bind(this));
        if (this.icons.maximize) this.maximize.addEventListener('pointerup', this.maximizeWin.bind(this));
    }

    closeLock() {
        this.closeLocked = true;
        this.close.innerHTML = this.icons.locked;
    }

    closeUnlock() {
        this.closeLocked = false;
        this.close.innerHTML = this.icons.close;
    }

    closeWin() {
        if (!this.closeLocked) this.parent.close();
        if (this.callback.onClose) this.callback.onClose();
    }

    maximizeWin() {
        if (this.maximize.innerHTML == this.icons.maximize) this.maximize.innerHTML = this.icons.demaximize;
        else this.maximize.innerHTML = this.icons.maximize;
        this.parent.maximize();
        if (this.callback.onMaximize) this.callback.onMaximize();
    }

    minimizeWin() {
        this.parent.hide();
        if (this.callback.onMinimize) this.callback.onMinimize();
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
