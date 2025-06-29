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
     * @param args.content: content inside window can be string, HTMLElement of object with (this.element as main HTMLElement)
     * @param args.callback.onClick: called when middle area is clicked
     * @param args.callback.onMinimize: called after window is minimized
     * @param args.callback.onDeminimize: called after window is deminimized
     * @param args.callback.onMaximize: called after window is maximized to full screen 
     * @param args.callback.onDemaximize: called after window is demaximized from full screen
     * @param args.callback.onClose: called after window is closed or locked closed
     * @param args.callback.onMove: called after window was movedd
     * @param args.callback.onResize: called after window was resized
     * @param args.icons {minimize, maximize, demaximize, close, locked}: custom html string for icons look (null disables button)
     * @param args.hidden: initially hidden
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
                    this.delta.x = 0;
                    this.delta.y = 0;
                    this.delta._x = x;
                    this.delta._y = y;
                },
                update: function(x, y) {
                    this.x2 = x;
                    this.y2 = y;
                    this.delta.x = x - this.delta._x;
                    this.delta.y = y - this.delta._y;
                    this.delta._x = x;
                    this.delta._y = y;
                },
                get: function() {
                    const result = [this.x2 - this.x1, this.y2 - this.y1];
                    this.x1 = this.x2;
                    this.y1 = this.y2;
                    return result;
                },
                moved: function() {
                    return Math.abs(this.delta.x) > 0.001 || Math.abs(this.delta.y) > 0.001;
                },
                delta: {
                    _x: 0,
                    _y: 0,
                    x: 0,
                    y: 0
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
            onMove: null,
            onResize: null
        };
        assignArgs(this.callback, args.callback);

        // Currently clicked element
        this.target = null;

        // Mode: 'window' | 'fullscreen' | 'miniature'
        this.mode = 'window';

        // Is hidden
        this.hidden = false;

        // Is close locked
        this.closeLocked = false;

        // Cache history
        this.history = {
            transform: { ...this.transform },
            mode: this.mode,
            display: null,
            title: null,
            store: () => {
                const computedStyles = window.getComputedStyle(this.content);
                const { title = null } = args;
                this.history.transform.x = this.transform.x;
                this.history.transform.y = this.transform.y;
                this.history.transform.width = this.transform.width;
                this.history.transform.height = this.transform.height;
                this.history.transform.minWidth = this.transform.minWidth;
                this.history.transform.minHeight = this.transform.minHeight;
                this.history.transform.maxWidth = this.transform.maxWidth;
                this.history.transform.maxHeight = this.transform.maxHeight;
                this.history.mode = this.mode;
                this.history.display = computedStyles.getPropertyValue('display') || 'block';
                this.history.title = this.titlebar.title.innerHTML;
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
                this.titlebar.title.innerHTML = this.history.title;
            },
        };

        // Main window
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.display = 'grid';
        this.element.style.gridTemplateColumns = `${this.transform.borderWidth}px auto ${this.transform.borderWidth}px`;
        this.element.style.gridTemplateRows = `${this.transform.borderWidth}px auto ${this.transform.borderWidth}px`;
        this.element.classList.add('total-popup-window');

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
                title: ('title' in args) ? args.title : null,
                container: this.middle,
                parent: this,
                ...controlsOpt
            });
        }

        // Inner content container
        this.inner = new TotalPopupInner({parent: this, content: ('content' in args) ? args.content : null, onClick: 'callback' in args && 'onClick' in args.callback ? args.callback.onClick : null});
        this.middle.append(this.inner.main);

        // Content (for external access and destructor)
        this.content = ('content' in args) ? args.content : null;

        // Append all elements
        this.element.append(this.topLeft.main);
        this.element.append(this.top.main);
        this.element.append(this.topRight.main);
        this.element.append(this.left.main);
        this.element.append(this.middle);
        this.element.append(this.right.main);
        this.element.append(this.bottomLeft.main);
        this.element.append(this.bottom.main);
        this.element.append(this.bottomRight.main);

        // Append to parent container
        this.container = args.container || document.querySelector('body');
        this.container.append(this.element);

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
        this.element.addEventListener('pointerdown', this.dragStartEvent);

        // Out window event
        document.addEventListener('mouseout', (event) => {
            const from = event.relatedTarget || event.toElement;
            if (!from || from.nodeName == 'HTML') {
                this.dragEnd();
            }
        });

        // Initially hidden
        if (('hidden' in args) && args.hidden === true) this.hide();

    }

    /**
     * Drag events
     */

    dragStart(event) {
        if (this.mode != 'fullscreen') {
            this.target = this.getTarget(event.composedPath(), ['border', 'content', 'titlebar', 'total-popup-window']);
            if (this.target != null) {
                // Move to the end of DOM
                this.element.parentNode.append(this.element);
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
        // Resize callback
        if (this.callback.onResize && this.target && this.target.classList.contains('border')) this.callback.onResize();
        // Move callback
        else if (this.callback.onMove && this.target && this.transform.offset.moved()) this.callback.onMove();
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
        this.element.style.transform = `translate(${this.transform.x}px, ${this.transform.y}px)`;
        const width = Math.max(Math.max(this.transform.width, this.transform.minWidth), Math.min(this.transform.width, this.transform.maxWidth));
        const height = Math.max(Math.max(this.transform.height, this.transform.minHeight), Math.min(this.transform.height, this.transform.maxHeight));
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.middle.style.width = `${width - (this.transform.borderWidth * 2)}px`;
        this.middle.style.height = `${height - (this.transform.borderWidth * 2)}px`;
    }

    /**
     * Show window
     */

    show() {
        this.container.addEventListener('pointerdown',this.dragStartEvent);
        this.container.addEventListener('pointermove', this.dragMoveEvent);
        this.container.addEventListener('pointerup', this.dragEndEvent);
        this.element.style.display = 'grid';
        this.hidden = false;
    }

    /**
     * Hide window
     */

    hide() {
        this.container.removeEventListener('pointerdown', this.dragStartEvent);
        this.container.removeEventListener('pointermove', this.dragMoveEvent);
        this.container.removeEventListener('pointerup', this.dragEndEvent);
        this.element.style.display = 'none';
        this.hidden = true;
    }

    /**
     * Show/Hide window
     */

    toggle() {
        if (this.hidden) this.show(); else this.hide();
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
     * Minimize window (disapear)
     */

    minimize() {
        if (this.callback.onMinimize) this.callback.onMinimize();
        else this.hide();
    }

    /**
     * Miniaturize window (icon-bar)
     */

    miniaturize(args = {}) {
        const { width = 64, height = 64, title = null } = args;

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
        this.element.style.transition = 'width 0.5s ease-out, height 0.5s ease-out, transform 0.5s ease-out';
        setInterval(() => this.element.style.removeProperty('transition'), 500);

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

        // Hidden mode
        if (this.content) {
            // Hide content for html
            if ('style' in this.content) this.content.style.display = 'none';
            // Hide content for a tab object
            else if (typeof(this.content) == 'object') this.content.hide();
        }

        // Size
        this.transform.width = width;
        this.transform.height = height;
        this.transform.minWidth = width;
        this.transform.minHeight = height;

        // Find the highest positioned popup window already on the screen
        const popups = document.querySelectorAll('.total-popup-window.miniature');
        const topDefault = ('top' in args) ? -Infinity : Infinity;
        let topX = 0, topY = topDefault;
        for (const popup of popups) {
            const transformValue = popup.style.transform;
            const matches = transformValue.match(/translate\((\d+(?:\.\d+)?)px, (\d+(?:\.\d+)?)px\)/);
            if (matches && matches.length === 3) {
                const popupX = parseFloat(matches[1]);
                const popupY = parseFloat(matches[2]);
                if (('top' in args) && popupY > topY) {
                    topX = popupX;
                    topY = popupY;
                }
                else if (('bottom' in args) && popupY < topY) {
                    topX = popupX;
                    topY = popupY;
                }
            }
        }

        // Position of the first miniaturized window
        if (topY == topDefault) {
            if ('left' in args) this.transform.x = args.left + this.transform.margin.left;
            if ('right' in args) this.transform.x = this.container.offsetWidth - args.right - this.transform.width - this.transform.margin.right;
            if ('top' in args) this.transform.y = args.top + this.transform.margin.top;
            if ('bottom' in args) this.transform.y = this.container.offsetHeight - args.bottom - this.transform.height - this.transform.margin.bottom;
        }
        // Position aligned to other miniaturized windows
        else {
            if ('left' in args) this.transform.x = args.left + this.transform.margin.left;
            if ('right' in args) this.transform.x = topX;
            if ('top' in args) this.transform.y = topY + 50;
            if ('bottom' in args) this.transform.y = topY - 50;
        }

        // Title
        if (title) this.titlebar.title.innerHTML = title;

        // Tag as miniature
        this.miniature = true;
        this.element.classList.add('miniature');

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
        if ('style' in this.content) this.content.style.display = this.history.display;
        // Show content for a tab object
        else if (typeof(this.content) == 'object') this.content.show();

        // Tag as miniature
        this.miniature = false;
        this.element.classList.remove('miniature');
    }

    /**
     * Lock closing window
     */

    lockClose() {
        this.closeLocked = true;
        // this.titlebar.close.innerHTML = this.icons.locked;
    }

    /**
     * Unlock closing window
     */

    unlockClose() {
        this.closeLocked = false;
        // this.titlebar.close.innerHTML = this.icons.close;
    }

    /**
     * Close window
     */

    close() {
        if (!this.closeLocked) {
            if (this.callback.onClose) this.callback.onClose();
            this.inner.del();
            this.element.remove();
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

        if (this.mode != 'miniature') {
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
    }

    /**
     * Force position / size
     * this.transform compatible args
     */

    retransform(args) {
        assignArgs(this.transform, args);
        this.update();
    }

}
