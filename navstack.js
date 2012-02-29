(function (GLOBAL) {
    var Navstack = function () {
    }

    Navstack.renderPage = function (page) {
        if (!("element" in page)) {
            if ("createElement" in page) {
                page.createElement();
            } else {
                page.element = document.createElement("div");
            }
        }
    }

    function navigateIter(segments, page, pages, done) {
        if (page === undefined) {
            done();
            return;
        }

        pages.push(page);
        preparePage(page, function () {
            if (segments.length == 0) {
                done(null, page);
                return;
            }

            var segment = segments.shift();
            navigateIter(segments, page.route(segment), pages, done);
        });
    }

    function preparePage(page, done) {
        if ("prepare" in page) {
            if (page.prepare.length == 0) {
                page.prepare();
                done();
            } else {
                page.prepare(done);
            }
        } else {
            done();
        }
    }

    Navstack.prototype = {
        navigate: function (path) {
            var self = this;
            var segments;
            if (path == "/") {
                this.segments = [];
            } else {
                this.segments = path.slice(1).split("/");
            }

            var pages = [];
            navigateIter(this.segments.slice(0), this.rootPage, pages, function (err, page) {
                self._doRender(page);
                self.pages = pages;
            });
        },

        pushPage: function (name) {
            var self = this;
            var page = this.pages[this.pages.length - 1].route(name);
            if (page === undefined) {
                // TODO: 404
            } else {
                preparePage(page, function () {
                    self.segments.push(name);
                    self._doRender(page);
                    self.pages.push(page);
                });
            }
        },

        popPage: function () {
            if (this.pages.length === 1) return;

            this.segments.pop();
            this.pages.pop();

            this._doRender(this.pages[this.pages.length - 1]);
        },

        _doRender: function (page) {
            Navstack.renderPage(page);
            this.onnavigate && this.onnavigate(this._getPath());
        },

        _getPath: function () {
            return "/" + this.segments.join("/");
        }
    }

    GLOBAL.Navstack = Navstack
}(window));