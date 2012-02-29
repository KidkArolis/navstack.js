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
            done(null);
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
                stack.push({
                    path: segment,
                    page: newPage.rootPage,
                    isNavstack: true,
                    navstack: newPage
                });
                navigateIter(pathSegments.slice(1), newPage, stack, done);
            });
        } else {
            preparePage(newPage, function () {
                stack.push({
                    path: segment,
                    page: newPage
                });
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

            navigateIter(pathSegments, this, helperStack, function (err) {
                self._stack = helperStack.slice(1);
                self._doRender();
            });
        },

        pushPage: function (name) {
            var self = this;
            navigateIter([name], this, this._stack, function (err) {
                self._doRender();
            });
        },

        popPage: function () {
            if (this._stack.length === 1) return;
            this._stack.pop();
            this._doRender();
        },

        _doRender: function () {
            var stacks = [];
            var currStack = [this._stack[0]];

            for (var i = 1, ii = this._stack.length; i < ii; i++) {
                var s = this._stack[i];
                if (s.isNavstack) {
                    stacks.push(currStack);
                    currStack = [s];
                } else {
                    currStack.push(s);
                }
            }
            if (stacks[stacks.length - 1] !== currStack) {
                stacks.push(currStack);
            }

            for (var i = 0, ii = stacks.length; i < ii; i++) {
                var stack = stacks[i];
                var navstack = stack[0].navstack;
                var page;
                if (stack.length == 1) {
                    page = navstack.rootPage;
                } else {
                    page = stack[stack.length - 1].page;
                }

                Navstack.renderPage(page);
                renderInTarget(navstack.target, page.element);
            }

            var path = [];
            for (var i = 1, ii = this._stack.length; i < ii; i++) {
                path.push(this._stack[i].path);
            }
            this.onnavigate && this.onnavigate("/" + path.join("/"));
        }
    }

    function renderInTarget(target, element) {
        if (target.firstChild === element) return;

        target.innerHTML = "";
        target.appendChild(element);
    }

    GLOBAL.Navstack = Navstack
}(window));