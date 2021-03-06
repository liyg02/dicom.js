var DICOM = DICOM || {};

//用于构造一个dicom文件Viewer， container为Viewer容器，
// imageBuffer位Dicom文件字节流 容器大小即为Viewer的渲染范围
DICOM.Viewer = function(container, options) {
    this.uuid = THREE.Math.generateUUID();

    if (typeof(container) === 'string') {
        container = document.getElementById(container);
    }

    this.options = options || {};

    this.selectedPane = new DICOM.Selection();

    this.container = container;
    //防止滚动条干扰canvas的尺寸
    this.container.style.overflow = 'hidden';
    this.container.style.position = 'absolute';

    this.behaviors = [];
    this.overlays = [];

    this.panes = new DICOM.AttachedObjectCollection(this);

    var self = this;
    window.addEventListener('resize', function() {
        var e = {type: 'sizeChanged'};
        self.dispatchEvent(e);
    });

    this.container.oncontextmenu = function(e) {
        e.preventDefault();
    };

    self.init = false;

    this.dcmSeries = new DICOM.DcmSeries();
};

DICOM.AttachedObject.prototype.apply(DICOM.Viewer.prototype);

DICOM.EventDispatcher.prototype.apply(DICOM.Viewer.prototype);

// DICOM.Viewer.prototype.loadDcmSeries = function(dcmSeries) {
//     this.dcmSeries = dcmSeries;
//     this.panes.each(function(pane) {
//         pane.loadDcmSeries(dcmSeries);
//     });
// };

//渲染Viewer， 调用此函数后Viewer开始渲染
DICOM.Viewer.prototype.render = function() {
    self = this;

    function renderImp() {
        if (!self.init) {
            self.init = true;

            self.renderer = new THREE.WebGLRenderer({antialias: true});
            self.renderer.autoClear = false;

            self.addEventListener('sizeChanged', function(e) {
                var viewer = e.target;
                viewer.renderer.setSize(
                    viewer.container.clientWidth, viewer.container.clientHeight);
            });

            self.renderer.setPixelRatio(window.devicePixelRatio);
            self.container.appendChild(self.renderer.domElement);

            var viewerWidth = self.container.clientWidth;
            var viewerHeight = self.container.clientHeight;
            self.renderer.setSize(viewerWidth, viewerHeight);
            self.renderer.getPrecision('highh');

            // self.stats = new Stats();
            // self.stats.setMode(0);
            // self.stats.domElement.style.position = 'absolute';
            // self.stats.domElement.style.right='0px';
            // self.stats.domElement.style.top = '0px';
            //
            // if (self.options.mode == 'debug'){
            // 	self.container.appendChild(self.stats.domElement);
            // }
        } else {
            for (var i = 0; i < self.panes.length; ++i) {
                self.panes.index(i).render();
            }

            // self.stats.update();
        }
    }
    //
    // animate();

    renderImp();
};

DICOM.Viewer.prototype.layoutGrid = function(column, row) {
    var self = this;
    var viewerWidth = self.container.clientWidth;
    var viewerHeight = self.container.clientHeight;

    var customEvent = {type: 'layoutChanged'};

    this.panes.clear();

    DICOM.generateGrid(viewerWidth, viewerHeight, column, row, function(port) {
        var pane = new DICOM.Pane(port.left, port.top, port.width, port.height);
        pane.id = port.id;

        pane.addEventListener('loaded', function() {
            // top overlay is necessary
            var topOverlay = new DICOM.Overlays.TopOverlay();
            pane.overlays.add(topOverlay);
            var cornerInfoOverlay = new DICOM.Overlays.CornerInfoOverlay();
            pane.overlays.add(cornerInfoOverlay);
            var scaleOverlay = new DICOM.Overlays.ScaleOverlay();
            pane.overlays.add(scaleOverlay);
            var shapeOverlay = new DICOM.Overlays.ShapeOverlay();
            pane.overlays.add(shapeOverlay);

            //设置默认的交互行为
            pane.behaviors.add(new DICOM.MouseBehaviors.WWWLBehavior('right', true));
            pane.behaviors.add(new DICOM.MouseBehaviors.PageBehavior('left', true));
            pane.behaviors.add(new DICOM.MouseBehaviors.SelectBehavior(self.selectedPane));
            pane.behaviors.add(new DICOM.TouchBehaviors.WWWLBehavior(true));
        });

        self.panes.add(pane);
    });

    this.dispatchEvent(customEvent);
};
