(function (GLOBAL) {
    var Navstack = function () {
        this._stack = [];
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

    function navigateIter(pathSegments, navstack, stack, done) {
        var topStackItem = stack[stack.length - 1];

        if (pathSegments.length == 0) {
            done(null, navstack, topStackItem);
            return;
        }

        var segment = pathSegments[0];
        var newPage = topStackItem.page.route(segment);

        if (newPage === undefined) {
            done(); // 404 somehow
            return;
        }

        if (newPage instanceof Navstack) {
            preparePage(newPage.rootPage, function () {
                stack.push({path: segment, page: newPage.rootPage});
                navigateIter(pathSegments.slice(1), newPage, stack, done);
            });
        } else {
            preparePage(newPage, function () {
                stack.push({path: segment, page: newPage});
                navigateIter(pathSegments.slice(1), navstack, stack, done);
            });
        }
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

            this._stack = [{path: null, page: this.rootPage}];
            preparePage(this.rootPage, function () {
                navigateIter(pathSegments, self, self._stack, function (err, navstack, page) {
                    navstack._doRender(page);
                    self._doOnNavigate();
                });
            });
        },

        pushPage: function (name) {
            var self = this;
            navigateIter([name], this, this._stack, function (err, navstack, page) {
                navstack._doRender(page);
                self._doOnNavigate();
            });
        },

        popPage: function () {
            if (this._stack.length === 1) return;

            this._stack.pop();

            this._doRender(this._stack[this._stack.length - 1]);
            this._doOnNavigate();
        },

        _doRender: function (stackItem) {
            Navstack.renderPage(stackItem.page);
            this.target.innerHTML = "";
            this.target.appendChild(stackItem.page.element);
        },

        _doOnNavigate: function () {
            var path = [];
            for (var i = 1, ii = this._stack.length; i < ii; i++) {
                path.push(this._stack[i].path);
            }

            this.onnavigate && this.onnavigate("/" + path.join("/"));
        }
    }

    GLOBAL.Navstack = Navstack
}(window));