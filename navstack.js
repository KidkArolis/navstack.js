(function (GLOBAL) {
    var Navstack = function () {
        this._pages = [];
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
            done(null, navstack, topPage);
            return;
        }

        var segment = pathSegments[0];
        var newPage = topPage.page.route(segment);

        if (newPage === undefined) {
            done(); // 404 somehow
            return;
        }

        if (newPage instanceof Navstack) {
            navstack = newPage;
            newPage = navstack.rootPage;
            segment = null;
        }

        preparePage(newPage, function () {
            navstack._pages.push({path: segment, page: newPage});
            navigateIter(pathSegments.slice(1), navstack, done);
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
            var pathSegments;
            if (path == "/") {
                pathSegments = [];
            } else {
                pathSegments = path.slice(1).split("/");
            }

            this._pages = [{path: null, page: this.rootPage}];
            preparePage(this.rootPage, function () {
                navigateIter(pathSegments, self, function (err, navstack, page) {
                    navstack._doRender(page);
                    self._doOnNavigate();
                });
            });
        },

        pushPage: function (name) {
            var self = this;
            navigateIter([name], this, function (err, navstack, page) {
                navstack._doRender(page);
                self._doOnNavigate();
            });
        },

        popPage: function () {
            if (this._pages.length === 1) return;

            this._pages.pop();

            this._doRender(this._pages[this._pages.length - 1]);
            this._doOnNavigate();
        },

        _doRender: function (page) {
            Navstack.renderPage(page.page);
            this.target.innerHTML = "";
            this.target.appendChild(page.page.element);
        },

        _doOnNavigate: function () {
            var path = [];
            for (var i = 1, ii = this._pages.length; i < ii; i++) {
                path.push(this._pages[i].path);
            }

            this.onnavigate && this.onnavigate("/" + path.join("/"));
        }
    }

    GLOBAL.Navstack = Navstack
}(window));