enum DeviceSize {
    XS = 0,     // Mobile
    SM = 576,   // Tablet 
    MD = 768,   // Desktop
    LG = 992,
    XL = 1200
}

interface DeviceSizeDelegate {

    onSizeChanged: (size: DeviceSize) => void;

}

class DeviceSizeDetector {

    lastSize: number;
    delegetes: Array<DeviceSizeDelegate> = [];

    static detector: DeviceSizeDetector | null = null;

    static instance(): DeviceSizeDetector {
        if (this.detector == null) {
            this.detector = new DeviceSizeDetector();
            this.detector.start();
        }

        return this.detector;
    }

    private constructor() { }

    start() {
        this.lastSize = 0;
        this.delegetes = [];

        let self = this;
        window.addEventListener('resize', function () { self.onWindowResize(); });
    }

    stop() {
        window.removeEventListener('resize', function () { });
    }

    addDelegate(delegate: DeviceSizeDelegate) {
        this.delegetes.push(delegate);
        this.onWindowResize();
    }

    onWindowResize() {
        let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let size = DeviceSize.XS;

        if (DeviceSize.SM <= width && width < DeviceSize.MD)
            size = DeviceSize.SM;
        if (DeviceSize.MD <= width && width < DeviceSize.LG)
            size = DeviceSize.MD;   
        if (DeviceSize.LG <= width && width < DeviceSize.XL)
            size = DeviceSize.LG; 
        if (DeviceSize.XL <= width)
            size = DeviceSize.XL;

        if (size != this.lastSize) {
            this.lastSize = size;

            this.delegetes.forEach(d => {
                d.onSizeChanged(size);
            });
        }
    }

}

export {
    DeviceSize,
    DeviceSizeDelegate,
    DeviceSizeDetector,
}