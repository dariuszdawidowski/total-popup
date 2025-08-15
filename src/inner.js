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
        // HTML string
        if (typeof(content) == 'string') {
            this.main.innerHTML = content;
        }
        // DOM Element
        else if (Object.getPrototypeOf(content.constructor).name == 'HTMLElement') {
            this.main.append(content);
        }
        // Widget
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
