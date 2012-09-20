/**
 * Navstack.js 0.2.0
 * http://github.com/augustl/navstack.js
 *
 * Licensed under the revised BSD license: http://www.opensource.org/licenses/BSD-3-Clause
 * August Lilleaas <august@augustl.com>
 */
(function () {

    var routeStripper = /^[#\/]/;
    var namedParam = /:(\w+)/g;
    var escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

    var Navstack = function () {};

    Navstack.getPageElement = function (page) {
        return page.element || (page.element = page.createElement());
    };

    Navstack.prototype = {
        navigate: function (path) {
            var self = this;

            if (this._stack) {
                for (var i = 0; i < this._stack.length; i++) {
                    var currentPath = this.currentPath();
                    if (currentPath === "/") {
                        break;
                    }
                    var desiredPath = path;
                    var currentPathArr = currentPath.substr(1).split("/");
                    var desiredPathArr = desiredPath.substr(1).split("/");
                    if (currentPathArr.length <= desiredPathArr.length) {
                        while (desiredPathArr.length > currentPathArr.length) {
                            desiredPathArr.pop();
                        }
                        if (desiredPathArr.join("/") === currentPathArr.join("/")) {
                            path = path.substr(currentPath.length);
                            break;
                        }
                    }
                    this._willNavigateAway({
                        up: true
                    });
                    this._stack.pop();
                }
            }

            this._stack = this._stack || [];
            if (this._stack.length === 0) {
                this._stack = [{
                    page: {
                        routes: {
                            "/": "handleRoute"
                        },
                        handleRoute: function () {
                            return self.rootPage;
                        }
                    },
                    pathSegment: ""
                }];
            }
            
            navigateIter(path, this._stack, function () {
                self._renderStack();
                self._didNavigate();
            });
        },

        pushPathSegment: function (pathSegment) {
            var self = this;
            this._willNavigateAway();
            navigateIter(pathSegment, this._stack, function () {
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
                if (stackItem.page === page) {
                    break;
                }
            }

            var stackLengthBefore = this._stack.length;
            var stackLengthAfter = stack.length;
            this._willNavigateAway({
                up: (stackLengthAfter < stackLengthBefore)
            });

            this._stack = stack;

            navigateIter(pathSegment, this._stack, function () {
                self._renderStack();
                self._didNavigate();
            });
        },

        popPage: function () {
            if (this._stack.length === 2) {
                return;
            }
            this._willNavigateAway({
                up: true
            });
            this._stack.pop();
            this._renderStack();
            this._didNavigate();
        },

        gotoPage: function (page) {
            var currentStackItem = this._stack[this._stack.length - 1];
            var targetStackItem = this._stack.filter(function (s) {
                return s.page === page;
            })[0];

            if (!targetStackItem) {
                var msg = "Page passed to 'gotoPage' is not present in the current stack.";
                throw new Error(msg);
            }

            if (currentStackItem === targetStackItem) {
                return;
            }

            this._willNavigateAway({
                up: true
            });
            this._stack = this._stack.slice(0, this._stack.indexOf(targetStackItem) + 1);
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
            var stackWithoutDummyRoot = this._stack.slice(1);
            var pageGroups = pagesGroupedByTargetForStack(stackWithoutDummyRoot);
            for (var i = 0, ii = pageGroups.length; i < ii; i++) {
                var pageGroup = pageGroups[i];

                var targetPage = pageGroup[0];
                var target = targetPage.target;
                var sourcePage = pageGroup[pageGroup.length - 1];
                if (pageIsAbstract(sourcePage)) {
                    continue;
                }

                var element = Navstack.getPageElement(sourcePage);
                if (target.firstChild === element) {
                    continue;
                }
                target.innerHTML = "";
                target.appendChild(element);
            }
        },

        _didNavigate: function () {
            if (this.onNavigate) {
                this.onNavigate(this.currentPath());
            }

            var topStackItem = this._stack[this._stack.length - 1];
            var page = topStackItem.page;
            if (page.onNavigatedTo) {
                page.onNavigatedTo();
            }
        },

        _willNavigateAway: function (direction) {
            if (!this._stack) {
                return;
            }
            direction = direction || {
                up: false
            };
            var topPage = this._stack[this._stack.length - 1].page;
            if (topPage.onNavigatedAway) {
                topPage.onNavigatedAway(direction);
            }
        },

        _matchRoutePattern: function (path, route) {
            var paramNames = [];

            var addParamName = function (match, paramName) {
                paramNames.push(paramName);
                // Backbone uses "([^\/]+)"
                // This one is from Chaplin
                return "([\\w-]+)";
            };

            route = route
                .replace(escapeRegExp, "\\$&")
                .replace(namedParam, addParamName);
            var re = new RegExp("^" + route);

            var match = re.exec("/" + path);
            if (match) {

                var paramsArr = match.slice(1);
                var params = {};
                for (var i = 0, len = paramsArr.length; i < len; i++) {
                    var paramName = paramNames[i];
                    params[paramName] = paramsArr[i];
                }

                return {
                    pathSegment: match[0].substr(1),
                    params: params
                };
            }

            return false;
        },

        // return all info about matching the route
        //  * the route handler function
        //  * the pathSegment (which is a substring of the path)
        //  * params extracted from the path
        _findMatchingRoute: function (path, page) {
            var pathSegment, routeHandler, params;

            // if page has no routes, we won't find any handlers
            if (!page.routes) {
                return false;
            }

            var result = false;
            for (var key in page.routes) {
                if (page.routes.hasOwnProperty(key)) {
                    var routePattern = key;

                    // skip special index route for now
                    if (routePattern === "/") {
                        continue;
                    }

                    var match = Navstack.prototype._matchRoutePattern(path, routePattern);
                    if (match) {
                        result = {
                            routeHandler: page[page.routes[routePattern]],
                            pathSegment: match.pathSegment,
                            params: match.params
                        };
                    }
                }
            }

            if (!result && page.routes["/"]) {
                result = {
                    routeHandler: page[page.routes["/"]],
                    pathSegment: "",
                    params: {}
                };
            }

            return result;
        }
    };

    function navigateIter(path, stack, done) {
        path = path.replace(routeStripper, "");

        var topStackItem = stack[stack.length - 1];

        // something we need to do to render the root page
        var firstIteration = stack.length === 1;
        if (!firstIteration && path.length === 0 && !topStackItem.page.routes) {
            return done();
        }

        
        var match = Navstack.prototype._findMatchingRoute(path, topStackItem.page);
        if (!match) {
            // TODO this should be handled better
            // This probably won't work well with async prepares?
            // 404 situation
            throw "No matching route found";
        }

        var newPage = match.routeHandler.call(topStackItem.page, match.params);
        var newStackItem = {
            page: newPage,
            pathSegment: match.pathSegment
        };
        stack.push(newStackItem);

        loadPage(newPage, function (status) {
            if (!pageIsAbstract(newPage)) {
                Navstack.getPageElement(newPage);
            }

            if (status === false) {
                done(stack);
            } else {
                navigateIter(path.substr(match.pathSegment.length), stack, done);
            }
        });
    }

    function loadPage(page, done) {
        if ("prepare" in page) {
            if (page.prepare.length === 0) {
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



    // Expose Navstack to the global object
    window.Navstack = Navstack;

    // Expose Navstack as an AMD module
    if (typeof define === "function" && define.amd) {
        define([], function () {
            return Navstack;
        });
    }
})();