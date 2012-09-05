Lemidora = window.Lemidora || {};


Lemidora.WallImageUploader = function(cfg) {
    if (cfg)
        this.init(cfg);
};

/**
 * Images upload manager
 *
 * It's responsible for files drag-and-drop to the work area and upload
 */
Lemidora.WallImageUploader.prototype = {
    editor: null,
    container: '.uploader',
    title: '.title',
    fileList: '.file-list',
    fileItemTmpl: '#file-item',
    progressBar: '.progress-bar',
    closeButton: '.close-button',
    maxFilesAmount: 10,
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeType: /^image\/.*$/,
    uploadUrl: '',
    csrf: '',

    init: function(cfg) {
        $.extend(true, this, cfg);

        this.container = $(this.editor.wall.container.find(this.container));
        this.title = this.container.find(this.title);
        this.fileList = this.container.find(this.fileList);
        this.fileItemTmpl = this.container.find(this.fileItemTmpl).html();
        this.progressBar = this.container.find(this.progressBar);
        this.closeButton = this.container.find(this.closeButton);

        this.initCloseButton();
        this.initDragAndDrop();
    },

    initCloseButton: function() {
        this.closeButton.click(function(e) {
            e.preventDefault();
            cnt.removeClass('active');
        });
    },

    initDragAndDrop: function() {
        if (!window.FormData) {
            Lemidora.messages.warning("Unfortunately your browser doesn't support JS File API and you can't drag'n'drop files", { timeout: false });
        }

        var wallContainer = this.editor.wall.container,
            cnt = this.container;

        function _preventDefault(e) {
            e.stopPropagation();
            e.preventDefault();
        }

        wallContainer.on("dragenter", function(e) {
            _preventDefault(e);
            cnt.addClass('active');
        });

        wallContainer.on("dragexit", function(e) {
            _preventDefault(e);
            cnt.removeClass('active');
        });

        wallContainer.on("dragover", _preventDefault);

        var self = this;

        wallContainer.on("drop", function(e) {
            _preventDefault(e);

            if (cnt.is('.uploading')) {
                Lemidora.messages.warning('Another upload is in progress');
                return false;
            }

            cnt.addClass('uploading');

            var oe = e.originalEvent;
            var files = oe.dataTransfer.files;
            files = self.validateFiles(files);

            if (!files.length) {
                Lemidora.messages.warning('Nothing to upload');
                cnt.removeClass('uploading active');
                return false;
            }

            var coords = {
                x: e.originalEvent.pageX,
                y: e.originalEvent.pageY
            };

            self.initFileList(files);
            self.initProgressBar();
            self.upload(files, coords);
        });
    },

    validateFiles: function(files) {
        var maxAmount = this.maxFilesAmount;
        if (files.length > maxAmount) {
            Lemidora.messages.error("Can't upload more than " + maxAmount + " files at a time, sorry");
            return false;
        }

        var toUpload = [];
        var mime = this.allowedMimeType;
        var maxSize = this.maxFileSize;

        $.each(files, function(i, file) {
            if (!file.type.match(mime)) {
                Lemidora.messages.warning("\"" + file.name + "\" is not an image");
                return true;
            }

            if (file.size > maxSize) {
                Lemidora.messages.warning("Image \"" + file.name + "\" is larger than " + maxSize + " bytes");
                return true;
            }

            toUpload.push(file);
        });

        return toUpload;
    },

    initFileList: function(files) {
        var fileList = this.fileList,
            fileItemTmpl = this.fileItemTmpl;

        fileList.empty();

        $.each(files, function(i, file) {
            var fileName = file.name;
            var nBytes = file.size;

            var sOutput = nBytes + " bytes";
            // optional code for multiples approximation
            for (var aMultiples = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"], nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
                sOutput = nApprox.toFixed(3) + " " + aMultiples[nMultiple] + " <span>(" + nBytes + " bytes)</span>";
            }

            $(fileItemTmpl).appendTo(fileList)
                .find('.name').text(fileName).end()
                .find('.size').html(sOutput);
        });
    },

    initProgressBar: function() {
        this.progressBar.progressbar({ value: 0 })
            .find('.ui-progressbar-value').text('');
    },

    upload: function(files, coords) {
        var formdata = new FormData();

        $.each(files, function(i, file) {
            formdata.append('image_' + i, file);
        });

        formdata.append('x', coords.x);
        formdata.append('y', coords.y - parseInt(this.editor.wall.area.css('margin-top')));
        formdata.append('csrfmiddlewaretoken', this.csrf);

        var self = this,
            cnt = this.container,
            pb = this.progressBar;

        $.ajax({
            url: this.uploadUrl,
            type: "POST",
            data: formdata,
            processData: false,
            contentType: false,

            success: function (res) {
                cnt.removeClass('uploading active');
                self.trigger('uploaded', [res]);
            },

            error: function() {
                cnt.removeClass('uploading active');
                Lemidora.messages.error('Error happend during your file(s) uploading');
            },

            xhr: function() {
                var xhr = new window.XMLHttpRequest();

                xhr.upload.addEventListener("progress", function(e) {
                    if (e.lengthComputable) {
                        var percentComplete = e.loaded / e.total * 100;
                        pb.progressbar({ value: percentComplete });

                        if (percentComplete == 100)
                            pb.find('.ui-progressbar-value').text('processing your images ...');
                    }
                }, false);

                xhr.upload.addEventListener("load", function(e){
                    pb.progressbar({ value: 100 });
                    pb.find('.ui-progressbar-value').text('processing your images ...');
                }, false);

                return xhr;
            }
        });
    },

    on: function(event, fn) {
        return this.container.on(event, fn);
    },

    off: function(event, fn) {
        return this.container.off(event, fn);
    },

    trigger: function(event, args) {
        return this.container.trigger(event, args);
    }
};