interface ScrollGestureDelegate {
    onScrollUp?: (pos: number) => void;
    onScrollDown?: (pos: number) => void;
}

class ScrollGesture {

    delegete: ScrollGestureDelegate | null = null;
    pos: number = 0;

    start(delegete: ScrollGestureDelegate) {
        this.delegete = delegete;
        this.pos = this.getPos();

        let self = this;
        window.addEventListener('scroll', function () { self.onWindowScroll(); });
    }

    stop() {
        this.delegete = null;
        this.pos = 0;
        window.removeEventListener('scroll', function () { });
    }

    private getPos(): number {
        let scrollTop = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
        return scrollTop + window.innerWidth;
    }

    private onWindowScroll() {
        if (!this.delegete)
            return;

        let oldPos = this.pos;
        this.pos = this.getPos();
        if (this.pos < oldPos && this.delegete.onScrollUp)
            this.delegete.onScrollUp(this.pos);
        if (this.pos > oldPos && this.delegete.onScrollDown)
            this.delegete.onScrollDown(this.pos);
    }

}

export {
    ScrollGestureDelegate,
    ScrollGesture
}