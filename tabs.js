/* Tabs manager */

class TotalTabs {

    /**
     * Constructor
     * @param args.width: width of the one tab
     * @param args.height: height of the one tab
     * @param args.newTab: append already created TotalTab
     * @param args.callback.onDock: callback on docking tab
     * @param args.callback.onUndock: callback on undocking tab
     * @param args.callback.onZeroTabs: callback when all tabs are undocked
     */

    constructor(args = {}) {

        const { width = 200, height = 45, newTab = null } = args; 

        // Parent window if exist (set by parent)
        this.parent = null;

        // Unique identifier
        this.id = crypto.randomUUID();

        this.main = document.createElement('div');
        this.main.classList.add('tabs');
        this.main.style.position = 'relative';

        this.tabbar = document.createElement('div');
        this.tabbar.classList.add('tabbar');
        this.tabbar.id = this.id;
        this.tabbar.style.height = height + 'px';

        this.content = document.createElement('div');
        this.content.style.width = '100%';
        this.content.style.height = '100%';
        this.content.classList.add('content');

        this.width = width;
        if ('newTab' in args) this.assignTab(args.newTab);

        this.main.append(this.tabbar);
        this.main.append(this.content);

        // Array for all tabs
        this.list = [];
        // Currently dragged TotalTab
        this.dragTab = null;
        this.canSend = false;
        // Callbacks
        this.callback = {
            onDock: null,
            onUndock: null,
            onZeroTabs: null
        };
        assignArgs(this.callback, args.callback);

        // Transform
        this.transform = {
            dock: true,
            undock: true,
            offset: {
                startPos: {x: 0, y: 0},
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
                start: function(x, y) {
                    this.x1 = this.x2 = this.startPos.x = x;
                    this.y1 = this.y2 = this.startPos.y = y;
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
            }
        }

        // Events
        this.startDragEvent = this.startDrag.bind(this);
        this.dragEvent = this.drag.bind(this);
        this.endDragEvent = this.endDrag.bind(this);
        this.main.addEventListener('pointerdown', this.startDragEvent);
    }

    addTab(name, content) {
        const newTab = new TotalTab({name: name, content: content, width: this.width, tabs: this, icon: '<i class="fa-solid fa-xmark"></i>'});
        this.list.push(newTab);
        this.tabbar.append(newTab.tab);
        this.content.append(newTab.content.content);

        for (const tab of this.list) tab.hideContent();
        newTab.showContent();
    }

    assignTab(newTab) {
        newTab.tabs = this;
        this.list.push(newTab);
        this.tabbar.append(newTab.tab);
        this.content.append(newTab.content.content);

        this.sortTabs();
        for (const tab of this.list) tab.hideContent();
        newTab.showContent();
    }

    hideTabsContent() {
        for (const tab of this.list) tab.hideContent();
    }

    removeTab(tab) {
        arrayRemove(this.list, tab);
        this.sortTabs();
        if (this.list.length > 1)
            this.enableFirstTab();
        else
            if (this.callback.onZeroTabs != null)
                this.callback.onZeroTabs(this.id);
    }

    getActiveTab() {
        for (const tab of this.list)
            if (tab.tab.classList.contains('active'))
                return tab;
        return null;
    }

    startDrag(event) {
        event.stopPropagation();
        if (event.target.classList.contains('active')) {
            this.transform.offset.start(event.x, event.y);
            this.dragTab = this.getActiveTab();
            this.dragTab.tab.classList.remove('animated');
            this.tabbar.append(this.dragTab.tab);
            this.canSend = true;
            document.body.addEventListener('pointermove', this.dragEvent);
            document.body.addEventListener('pointerup', this.endDragEvent);
        }
    }

    drag(event) {
        event.stopPropagation();
        if (this.dragTab != null) {
            this.transform.offset.update(event.x, event.y);
            const frameX = this.transform.offset.get()[0];
            if (this.dragTab.transform.x + frameX >= 0 && (this.dragTab.transform.x + this.width) + frameX < this.tabbar.offsetWidth) {
                this.dragTab.transform.x += frameX;
                this.dragTab.update();

                if (Math.abs(this.transform.offset.startPos.x - this.transform.offset.x1) > this.width - 10) {
                    // Back tab.
                    if (this.transform.offset.startPos.x - this.transform.offset.x1 > 0) {
                        const backTab = this.list[this.list.indexOf(this.dragTab) - 1];
                        if (backTab != null) {
                            backTab.transform.x += this.width;
                            backTab.update();
                            this.transform.offset.startPos.x = this.transform.offset.x1;
    
                            const temp1 = this.list[this.list.indexOf(this.dragTab)];
                            this.list[this.list.indexOf(this.dragTab)] = this.list[this.list.indexOf(backTab)];
                            this.list[this.list.indexOf(backTab)] = temp1;
                        }
                    }
                    // Next tab.
                    else if (this.transform.offset.startPos.x - this.transform.offset.x1 < 0) {
                        if (this.list.indexOf(this.dragTab) < this.list.length - 1) {
                            const nextTab = this.list[this.list.indexOf(this.dragTab) + 1];
                            if (nextTab != null) {
                                nextTab.transform.x -= this.width;
                                nextTab.update();
                                this.transform.offset.startPos.x = this.transform.offset.x1;
        
                                const temp1 = this.list[this.list.indexOf(nextTab)];
                                this.list[this.list.indexOf(nextTab)] = this.list[this.list.indexOf(this.dragTab)];
                                this.list[this.list.indexOf(this.dragTab)] = temp1;
                            }
                        }
                    }
                }
            }

            // Undock
            if (this.transform.undock && this.canSend) {
                if (this.list.length > 1) {
                    if ((Math.abs((this.transform.offset.startPos.y - this.transform.offset.y1)) > 100) ||
                        (Math.abs((this.transform.offset.startPos.x - this.transform.offset.x1)) > this.width + 30)) {
                            //if (this.callback.onUndock) this.callback.onUndock(this.dragTab);
                            if (this.callback.onUndock) arrayRemove(this.callback.onUndock, this.dragTab);
                            this.list.remove(this.dragTab);
                            this.dragTab.transform.x = 0;
                            this.dragTab.update();
                            //this.dragTab.tabbar = null;
                            this.dragTab = null;
                            this.sortTabs();
                            this.enableFirstTab();
                            this.canSend = false;

                            document.body.removeEventListener('pointermove', this.dragEvent);
                            document.body.removeEventListener('pointerup', this.endDragEvent);
                    }
                }
            }
        } 
    }

    endDrag(event) {
        event.stopPropagation();
        document.body.removeEventListener('pointermove', this.dragEvent);
        document.body.removeEventListener('pointerup', this.endDragEvent);

        // Dock
        for (const element of event.composedPath()) {
            if (element.nodeName == 'DIV' && element.classList.contains('tabbar') && element.id != this.tabbar.id) {
                if (this.callback.onDock) {
                    this.callback.onDock(this.dragTab, element.id);
                    this.dragTab = null;
                    return;
                }
            }
        }

        // Enable animation for dropped tab
        if (this.dragTab != null && this.list.includes(this.dragTab)) {
            this.dragTab.tab.classList.add('animated');
            // Move to the end of DOM
            this.dragTab.tab.parentNode.append(this.dragTab.tab);
            // Transform
            this.dragTab.transform.x = this.width * this.list.indexOf(this.dragTab);
            this.dragTab.update();
            this.dragTab = null;
        }

    }

    sortTabs() {
        for (const tab of this.list) {
            tab.transform.x = this.width * this.list.indexOf(tab);
            tab.update();
        }
    }

    enableFirstTab() {
        this.list[0].showContent();
    }

}

/* Single Tab */

class TotalTab {

    /**
     * Constructor
     * @param args.tabs: reference to TotalTabs
     * @param args.width: width of the tab
     * @param args.icon: close icon html
     * @param args.side: aligning to 'left' or 'right'
     * @param args.name: title displayed on tab
     * @param args.content: html with displayed page under this
     */

    constructor(args) {
        this.tabs = args.tabs;

        this.transform = {
            x: args.width * this.tabs.list.length,
            y: 0,
            width: args.width,
            center: args.width / 2
        }

        this.tab = document.createElement('div');
        this.tab.innerHTML = args.name;
        this.tab.classList.add('tab');
        this.tab.classList.add('animated');
        this.tab.style.position = 'absolute'
        this.tab.style.left = this.transform.x + 'px';
        this.tab.style.top = 0 + 'px';
        if (typeof args.width == 'number') this.tab.style.width = 'calc(' + args.width + 'px - 2px)';
        else if (typeof args.width == 'string') this.tab.style.width = args.width;

        this.tab.style.height = 'calc(45px - 2px)';
        this.tab.style.display = 'flex';
        //this.tab.style.justifyContent = 'space-between';

        this.close = document.createElement('div');
        this.close.innerHTML = args.icon;
        this.close.classList.add('close');
        
        if (args.side == 'left')
            this.tab.insertBefore(this.close,  this.tab.firstChild);
        else
            this.tab.append(this.close);
        this.content = new TotalTabPage(args.content);

        this.tab.addEventListener('pointerdown', this.showContent.bind(this));
        this.close.addEventListener('pointerup', this.closeTab.bind(this));
    }

    closeTab(event) {
        for (const element of event.composedPath()) {
            if (element.classList.contains('close')) {
                this.tabs.removeTab(this);
                this.tab.remove();
                this.content.content.remove();
                break;
            }
        }
    }

    showContent() {
        this.tabs.hideTabsContent();
        this.tab.classList.add('active');
        this.content.show();
    }

    hideContent() {
        this.content.hide();
        if (this.tab.classList.contains('active'))
            this.tab.classList.remove('active')
    }

    update() {
        this.tab.style.left = this.transform.x + 'px';
    }
}

/* Single Tab Contents */

class TotalTabPage {

    /**
     * Constructor
     * @param content: html content inside tab page
     */

    constructor(content) {
        this.content = document.createElement('div');
        this.content.classList.add('page');
        this.content.innerHTML = content;
    }

    show() {
        this.content.style.display = 'flex';
    }

    hide() {
        this.content.style.display = 'none';
    }
}
