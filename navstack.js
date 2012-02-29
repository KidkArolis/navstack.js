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
                stack.push({path: segment, page: newPage.rootPage, isNavstack: true, navstack: newPage});
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

            pathSegments.unshift(null);
            var helperStack = [{page: {route: function () { return self; }}}];

            navigateIter(pathSegments, this, helperStack, function (err, navstack, stack) {
                self._stack = helperStack.slice(1);
                self._doRender(stack);
            });
        },

        pushPage: function (name) {
            var self = this;
            navigateIter([name], this, this._stack, function (err, navstack, stack) {
                self._doRender(stack);
            });
        },

        popPage: function () {
            if (this._stack.length === 1) return;
            this._stack.pop();
            this._doRender(this._stack[this._stack.length - 1]);
        },

        _doRender: function (stackItem) {
            var topStack;
            for (var i = 0, ii = this._stack.length; i < ii; i++) {
                var s = this._stack[i];
                if (s.isNavstack) {
                    topStack = s.navstack;
                }
            }

            Navstack.renderPage(stackItem.page);
            topStack.target.innerHTML = "";
            topStack.target.appendChild(stackItem.page.element);

            var path = [];
            for (var i = 1, ii = this._stack.length; i < ii; i++) {
                path.push(this._stack[i].path);
            }
            this.onnavigate && this.onnavigate("/" + path.join("/"));
        }
    }

    GLOBAL.Navstack = Navstack
}(window));