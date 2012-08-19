Lemidora = window.Lemidora || {};


Lemidora.Wall = function(cfg) {
    if (cfg)
        this.init(cfg);
};

Lemidora.Wall.prototype = {
    container: null,
    area: '.area',
    imageItemTmpl: '#image-item',

    init: function(cfg) {
        this.uploaderConfig = { wall: this }; // this init must go before $.extend(true, this, cfg);
        $.extend(true, this, cfg);

        this.container = $(this.container);
        this.area = this.container.find(this.area);
        this.imageItemTmpl = this.container.find(this.imageItemTmpl).html();

        this.initUploader();
        this.initExistingImages();
        this.initGreeter();
        this.startAutoUpdate();
    },

    uploader: null,

    initUploader: function() {
        this.uploader = new Lemidora.WallUploader(this.uploaderConfig);

        var self = this;

        this.uploader.on('uploaded', function(e, wallInfo) {
            self.updateWall(wallInfo);
        });
    },

    images: {},

    /**
     * Init images that are already on the wall (initially)
     */
    initExistingImages: function() {
        var self = this,
            images = this.images = {};

        this.container.find('.wall-image').each(function(i, imageEl) {
            self.initImage(imageEl);
        });
    },

    initImage: function(imageEl) {
        var wallImage = new Lemidora.WallImage({
            wall:  this,
            container: imageEl
        });

        this.images[wallImage.attrs.id] = wallImage;

        wallImage.on('image-move-start', $.proxy(this, 'stopAutoUpdate'));
        wallImage.on('image-move', $.proxy(this, 'moveImageRequest'));
        wallImage.on('image-resize-start', $.proxy(this, 'stopAutoUpdate'));
        wallImage.on('image-resize', $.proxy(this, 'resizeImageRequest'));
        wallImage.on('image-delete', $.proxy(this, 'deleteImageRequest'));
    },

    updateImageUrl: '',
    deleteImageUrl: '',
    csrf: '',

    moveImageRequest: function(e, id, x, y) {
        this.updateImageRequest(id, { x: x, y: y });
    },

    resizeImageRequest: function(e, id, width, height) {
        this.updateImageRequest(id, { width: width, height: height });
    },

    deleteImageRequest: function(e, id) {
        this.updateImageRequest(id, null, 'delete, please');
    },

    updateImageRequest: function(id, attrs, del) {
        var self = this;

        this.stopAutoUpdate();

        var data = $.extend(
            true,
            {
                image_id: id,
                csrfmiddlewaretoken: this.csrf
            },
            attrs
        );

        url = del ? this.deleteImageUrl : this.updateImageUrl;

        $.post(url, data)
            .success(function(res) {
                self.updateWall(res);
            })
            .fail(function() {
                self.showMessages({
                    error: ['Your last action was not saved to server. Please, repeat it']
                });
            })
            .complete(function() {
                self.startAutoUpdate();
            });
    },

    initGreeter: function() {
        var count = 0;

        $.each(this.images, function() { count++; });

        if (!count)
            this.container.addClass('greeting');
        else
            this.container.removeClass('greeting');
    },

    autoUpdateUrl: '',
    poll: null,
    pollDelay: 5000,

    startAutoUpdate: function() {
        console.log('next auto-update wil start in 7 sec.');

        var self = this;

        this.poll = setTimeout(function() {
            self.autoUpdate();
        }, this.pollDelay);
    },

    stopAutoUpdate: function() {
        console.log('auto-update stopped');

        clearTimeout(this.poll);
    },

    autoUpdate: function() {
        console.log('auto-update started');

        var self = this;

        $.get(this.autoUpdateUrl)
            .success(function(res) {
                self.updateWall(res);
            })
            .fail(function() {
                self.showMessages({
                    error: ["I can't update the wall :("]
                });
            }).complete(function() {
                self.startAutoUpdate();
            });
    },

    /**
     * 'wallInfo' example:
     *
     * {
     *     "wall": {
     *         "owner": null,
     *         "created_date": "2012-08-19T17:38:34.454021+00:00",
     *         "id": 8,
     *         "key": "OB1RDS",
     *         "title": null
     *     },
     *     "images": [
     *         {
     *             "updated_date": "2012-08-19T17:41:14.619743+00:00",
     *             "updated_by": null,
     *             "title": null,
     *             "url": "/media/cache/e0/a0/e0a0aaa60a8844e60906ad1eaa7af0b3.jpg",
     *             "created_by": null,
     *             "height": 200,
     *             "width": 300,
     *             "created_date": "2012-08-19T17:41:13.277312+00:00",
     *             "y": 198.0,
     *             "x": 742.0,
     *             "rotation": 0.0,
     *             "z": 2,
     *             "id": 29
     *         },
     *     ],
     *     "messages": {
     *         "_exception": [],
     *         "information": [],
     *         "success": [
     *             "File Ski-Photo-20120203-165808.jpg successfully uploaded!"
     *         ],
     *         "alert": [],
     *         "warning": [],
     *         "error": []
     *     }
     * }
     *
     */
    updateWall: function(wallInfo) {
        var wall = this,
            images = this.images,
            incomingImages = wallInfo.images,
            incomingIds = {};

        $.each(incomingImages, function(i, attrs) {
            var id = attrs.id;

            if (id in images) {
                images[id].updateImage(attrs);
            } else {
                Lemidora.WallImage.createImage(wall, attrs);
            }

            incomingIds[id] = true;
        });

        $.each(images, function(i, image) {
            var id = image.attrs.id;

            if (!(id in incomingIds)) {
                image.deleteImage();
                delete images[id];
            }
        });

        if (wallInfo.messages)
            this.showMessages(wallInfo.messages);

        this.initGreeter();
    },

    /**
     * 'messages' example:
     *
     * {
     *     "_exception": [],
     *     "information": [],
     *     "success": [
     *         "File Ski-Photo-20120203-165808.jpg successfully uploaded!"
     *     ],
     *     "alert": [],
     *     "warning": [],
     *     "error": []
     * }
     *
     */
    showMessages: function(messages) {
        $.each(messages, function(type, msgs) {
            if (type in Lemidora.messages.supportedTypes) {
                $.each(msgs, function(i, text) {
                    Lemidora.messages.message(type, text);
                });
            }
        });
    }
};


if (!window.console) {
    console = { log:$.noop };
}
