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

    function navigateIter(pathSegments, page, pages, done) {
        if (page === undefined) {
            done();
            return;
        }

        pages.push(page);
        preparePage(page, function () {
            if (pathSegments.length == 0) {
                done(null, page);
                return;
            }

            var segment = pathSegments.shift();
            navigateIter(pathSegments, page.route(segment), pages, done);
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
            if (path == "/") {
                this._pathSegments = [];
            } else {
                this._pathSegments = path.slice(1).split("/");
            }

            var pages = [];
            navigateIter(this._pathSegments.slice(0), this.rootPage, pages, function (err, page) {
                self._doRender(page);
                self._pages = pages;
            });
        },

        pushPage: function (name) {
            var self = this;
            var page = this._pages[this._pages.length - 1].route(name);
            if (page === undefined) {
                // TODO: 404
            } else {
                preparePage(page, function () {
                    self._pathSegments.push(name);
                    self._doRender(page);
                    self._pages.push(page);
                });
            }
        },

        popPage: function () {
            if (this._pages.length === 1) return;

            this._pathSegments.pop();
            this._pages.pop();

            this._doRender(this._pages[this._pages.length - 1]);
        },

        _doRender: function (page) {
            Navstack.renderPage(page);
            this.onnavigate && this.onnavigate("/" + this._pathSegments.join("/"));
        }
    }

    GLOBAL.Navstack = Navstack
}(window));