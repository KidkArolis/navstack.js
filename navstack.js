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

    function navigateIter(pathSegments, navstack, done) {
        var topPage = navstack._pages[navstack._pages.length - 1];

        if (pathSegments.length == 0) {
            done(null, topPage);
            return;
        }

        var segment = pathSegments[pathSegments.length - 1];
        var newPage = topPage.route(segment);

        if (newPage === undefined) {
            done(); // 404 somehow
            return;
        }

        preparePage(newPage, function () {
            navstack._pages.push(newPage);
            navigateIter(pathSegments.slice(0, pathSegments.length - 1), navstack, done);
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

            this._pages = [this.rootPage];
            preparePage(this.rootPage, function () {
                navigateIter(self._pathSegments, self, function (err, page) {
                    self._doRender(page);
                });
            });
        },

        pushPage: function (name) {
            var self = this;
            navigateIter([name], this, function (err, page) {
                self._pathSegments.push(name);
                self._doRender(page);
            });
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