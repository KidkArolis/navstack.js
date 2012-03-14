(function (GLOBAL) {
    var Navstack = function () {}

    Navstack.getPageElement = function (page) {
        return page.element || (page.element = page.createElement());
    }

    Navstack.prototype = {
        navigate: function (path) {
            var self = this;
            path = path.slice(1);
            var pathSegments;
            if (path.length == 0) {
                pathSegments = [];
            } else {
                pathSegments = path.split("/");
            }

            pathSegments.unshift(null);
            this._stack = [{page: {route: function () { return self.rootPage; }}}];

            navigateIter(pathSegments, this._stack, function (stack) {
                self._renderStack();
                self._didNavigate();
            });
        },

        pushPathSegment: function (pathSegment) {
            var self = this;
            navigateIter([pathSegment], this._stack, function (stack) {
                self._renderStack();
                self._didNavigate();
            });
        },

        pushPathSegmentRelative: function (pathSegment, page) {
            var self = this;
            var stack = [];
            for (var i = 0, ii = this._stack.length; i < ii; i++) {
                var stackItem = this._stack[i];
                stack.push(stackItem);
                if (stackItem.page === page) break;
            }
            this._stack = stack;

            navigateIter([pathSegment], this._stack, function (stack) {
                self._renderStack();
                self._didNavigate();
            });
        },

        popPage: function () {
            if (this._stack.length === 2) return;
            this._stack.pop();
            this._renderStack();
            this._didNavigate();
        },

        currentPath: function () {
            var pathSegments = [];
            for (var i = 2, ii = this._stack.length; i < ii; i++) {
                pathSegments.push(this._stack[i].pathSegment);
            }

            return "/" + pathSegments.join("/");
        },

        _renderStack: function () {
            var pageGroups = pagesGroupedByTargetForStack(this._stack);
            for (var i = 0, ii = pageGroups.length; i < ii; i++) {
                var pageGroup = pageGroups[i];

                var targetPage = pageGroup[0];
                var target = targetPage.target;
                var sourcePage = pageGroup[pageGroup.length - 1];
                if (pageIsAbstract(sourcePage)) continue;

                var element = Navstack.getPageElement(sourcePage);
                if (target.firstChild === element) continue;
                target.innerHTML = "";
                target.appendChild(element);
            }
        },

        _didNavigate: function () {
            this.onNavigate && this.onNavigate(this.currentPath());

            var topStackItem = this._stack[this._stack.length - 1];
            var page = topStackItem.page;
            page.onNavigatedTo && page.onNavigatedTo();
        }
    };

    function navigateIter(pathSegments, stack, done) {
        if (pathSegments.length == 0) {
            return done(stack);
        }

        var topStackItem = stack[stack.length - 1];
        var pathSegment = pathSegments[0];
        var newPage = topStackItem.page.route(pathSegment);
        var newStackItem = {page: newPage, pathSegment: pathSegment};
        stack.push(newStackItem);
        loadPage(newPage, function (status) {
            if (status === false) {
                done(stack);
            } else {
                navigateIter(pathSegments.slice(1), stack, done);
            }
        });
    }

    function loadPage(page, done) {
        if ("prepare" in page) {
            if (page.prepare.length == 0) {
                done(page.prepare());
            } else {
                page.prepare(done);
            }
        } else {
            done();
        }
    }

    function pagesGroupedByTargetForStack(stack) {
        var result = [];
        var currStack = [stack[0].page];

        for (var i = 1, ii = stack.length; i < ii; i++) {
            var page = stack[i].page;
            if (page.target) {
                result.push(currStack);
                currStack = [page];
            } else {
                currStack.push(page);
            }
        }
        if (result[result.length - 1] !== currStack) {
            result.push(currStack);
        }

        return result;
    }

    function pageIsAbstract(page) {
        return !("createElement" in page);
    }

    GLOBAL.Navstack = Navstack
}(window));