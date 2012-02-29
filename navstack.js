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
        var newPage = topPage.route(segment);

        if (newPage === undefined) {
            done(); // 404 somehow
            return;
        }

        if (newPage instanceof Navstack) {
            navstack = newPage;
            newPage = navstack.rootPage;
        }

        preparePage(newPage, function () {
            navstack._pages.push(newPage);
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
            if (path == "/") {
                this._pathSegments = [];
            } else {
                this._pathSegments = path.slice(1).split("/");
            }

            this._pages = [this.rootPage];
            preparePage(this.rootPage, function () {
                navigateIter(self._pathSegments, self, function (err, navstack, page) {
                    navstack._doRender(page);
                });
            });
        },

        pushPage: function (name) {
            var self = this;
            navigateIter([name], this, function (err, navstack, page) {
                navstack._pathSegments.push(name);
                navstack._doRender(page);
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
            this.target.appendChild(page.element);
        }
    }

    GLOBAL.Navstack = Navstack
}(window));