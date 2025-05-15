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
