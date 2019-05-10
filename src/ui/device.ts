enum DeviceSize {
    XS = 0,
    SM = 576,
    MD = 768,
    LG = 992,
    XL = 1200
}

interface DeviceSizeDelegate {

    onSizeChanged: (size: DeviceSize) => void;

}

class DeviceSizeDetector {

    delegete: DeviceSizeDelegate | null = null;

    start(delegete: DeviceSizeDelegate) {
        this.delegete = delegete;

        let self = this;
        window.addEventListener('resize', function () { self.onWindowResize(); });

        this.onWindowResize();
    }

    stop() {
        this.delegete = null;
        window.removeEventListener('resize', function () { });
    }

    onWindowResize() {
        let width = window.innerWidth;
        let size = DeviceSize.XS;

        if (DeviceSize.SM <= width && width < DeviceSize.MD)
            size = DeviceSize.SM;
        if (DeviceSize.MD <= width && width < DeviceSize.LG)
            size = DeviceSize.MD;   
        if (DeviceSize.LG <= width && width < DeviceSize.XL)
            size = DeviceSize.LG; 
        if (DeviceSize.XL <= width)
            size = DeviceSize.XL;

        if (this.delegete)
            this.delegete.onSizeChanged(size);
    }

}

export {
    DeviceSize,
    DeviceSizeDelegate,
    DeviceSizeDetector
}