(function () {

    var assertNavigatedTo = window.assertNavigatedTo;
    var assertOnlyChild = window.assertOnlyChild;

    function getDefaultCreateElement() {
        return sinon.spy.create(function () {
            return document.createElement("div");
        });
    }

    buster.testCase("navstack", {
        setUp: function () {
            this.target = document.createElement("div");
            this.n = new window.Navstack();
            this.n.onNavigate = this.stub();
        },

        "navigation": {
            "to plain root page": function () {
                var actualElement = document.createElement("div");
                this.n.rootPage = {
                    createElement: function () {
                        return actualElement;
                    },
                    target: this.target,
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                this.n.navigate("/");

                assertNavigatedTo(this.n, "/");
                assert.pageNavigatedTo(this.n.rootPage);
                assert.pagePrepared(this.n.rootPage);
                assertOnlyChild(this.target, actualElement);
                assert.pageHasGeneratedElement(this.n.rootPage);
                assert.equals(this.n.currentPath(), "/");
            },

            "to plain page via root page": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/foo": "routeFoo"
                    },
                    routeFoo: this.spy(function () {
                        return page1;
                    }),
                    target: this.target,
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                var actualElement = document.createElement("div");
                var page1 = {
                    createElement: function () {
                        return actualElement;
                    },
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                this.n.navigate("/foo");

                assertNavigatedTo(this.n, "/foo");
                assert.pageRoutedTo(this.n.rootPage, "/foo");
                refute.pageNavigatedTo(this.n.rootPage);
                assert.pageNavigatedTo(page1);
                assert.pagePrepared(this.n.rootPage);
                assert.pagePrepared(page1);
                assertOnlyChild(this.target, actualElement);
                assert.pageHasGeneratedElement(this.n.rootPage);
                assert.pageHasGeneratedElement(page1);
                assert.equals(this.n.currentPath(), "/foo");
            },

            "to page with its own element": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/boom": "routeBoom"
                    },
                    routeBoom: this.spy(function () {
                        return page1;
                    }),
                    target: this.target,
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };
                var page1Target = document.createElement("div");
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    onNavigatedTo: this.spy(),
                    prepare: this.spy(),
                    target: page1Target
                };

                this.n.navigate("/boom");

                assertNavigatedTo(this.n, "/boom");
                assert.pageRoutedTo(this.n.rootPage, "/boom");
                refute.pageNavigatedTo(this.n.rootPage);
                assert.pageNavigatedTo(page1);
                assert.pagePrepared(this.n.rootPage);
                assert.pagePrepared(page1);
                assert.pageHasGeneratedElement(this.n.rootPage);
                assert.pageHasGeneratedElement(page1);
                assertOnlyChild(this.target, this.n.rootPage.element);
                assertOnlyChild(page1Target, page1.element);
                assert.equals(this.n.currentPath(), "/boom");
            },

            "to subpage": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/wakka": "routeWakka"
                    },
                    routeWakka: this.spy(function () {
                        return page1;
                    }),
                    target: this.target,
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/shakka": "routeShakka"
                    },
                    routeShakka: this.spy(function () {
                        return page2;
                    }),
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };
                var page2 = {
                    createElement: getDefaultCreateElement(),
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };


                this.n.navigate("/wakka/shakka");

                assertNavigatedTo(this.n, "/wakka/shakka");
                assert.pageRoutedTo(this.n.rootPage, "/wakka");
                assert.pageRoutedTo(page1, "/shakka");
                refute.pageNavigatedTo(this.n.rootPage);
                refute.pageNavigatedTo(page1);
                assert.pageNavigatedTo(page2);
                assert.pagePrepared(this.n.rootPage);
                assert.pagePrepared(page1);
                assert.pagePrepared(page2);
                assert.pageHasGeneratedElement(this.n.rootPage);
                // TODO: We don't really need this element created at all times,
                // since it's not displayed. Only create element if user requests it?
                assert.pageHasGeneratedElement(page1);
                assert.pageHasGeneratedElement(page2);
                assertOnlyChild(this.target, page2.element);
                assert.equals(this.n.currentPath(), "/wakka/shakka");
            },

            "to a page with a parameter": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/foo/:bar": "routeFoo"
                    },
                    routeFoo: this.spy(function () {
                        return page1;
                    }),
                    target: this.target,
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                var actualElement = document.createElement("div");
                var page1 = {
                    createElement: function () {
                        return actualElement;
                    },
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                this.n.navigate("/foo/123");

                assertNavigatedTo(this.n, "/foo/123");
                assert.pageRoutedTo(this.n.rootPage, "/foo/:bar");
                refute.pageNavigatedTo(this.n.rootPage);
                assert.pageNavigatedTo(page1);
                assert.pagePrepared(this.n.rootPage);
                assert.pagePrepared(page1);
                assertOnlyChild(this.target, actualElement);
                assert.pageHasGeneratedElement(this.n.rootPage);
                assert.pageHasGeneratedElement(page1);
                assert.equals(this.n.currentPath(), "/foo/123");
                assert.calledWith(this.n.rootPage.routeFoo, {
                    "bar": "123"
                });
            },

            "to nested pages with parameters": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/posts/:id": "routePosts"
                    },
                    routePosts: this.spy(function () {
                        return page1;
                    }),
                    target: this.target,
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                var page1 = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/:section/:action/dummy": "routeSection"
                    },
                    routeSection: this.spy(function () {
                        return page2;
                    }),
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                var actualElement = document.createElement("div");
                var page2 = {
                    createElement: function () {
                        return actualElement;
                    },
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                this.n.navigate("/posts/123/comments/new/dummy");

                assertNavigatedTo(this.n, "/posts/123/comments/new/dummy");
                assert.pageRoutedTo(this.n.rootPage, "/posts/:id");
                assert.pageRoutedTo(page1, "/:section/:action/dummy");
                refute.pageNavigatedTo(this.n.rootPage);
                refute.pageNavigatedTo(page1);
                assert.pageNavigatedTo(page2);
                assert.pagePrepared(this.n.rootPage);
                assert.pagePrepared(page1);
                assert.pagePrepared(page2);
                assertOnlyChild(this.target, actualElement);
                assert.pageHasGeneratedElement(this.n.rootPage);
                assert.pageHasGeneratedElement(page1);
                assert.pageHasGeneratedElement(page2);
                assert.equals(this.n.currentPath(), "/posts/123/comments/new/dummy");
                assert.calledWith(this.n.rootPage.routePosts, {
                    "id": "123"
                });
                assert.calledWith(page1.routeSection, {
                    "section": "comments",
                    "action": "new"
                });
            },

            "current path while building": function () {
                var self = this;

                var prepareFunc = function () {
                    this.curPath = self.n.currentPath();
                };

                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    target: this.target,
                    prepare: prepareFunc,
                    routes: {
                        "/foo": "routeFoo"
                    },
                    routeFoo: function () { return page1; }
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    prepare: prepareFunc,
                    routes: {
                        "/bar": "routeBar"
                    },
                    routeBar: function () { return page2; }
                };
                var page2 = {
                    createElement: getDefaultCreateElement(),
                    prepare: prepareFunc
                };

                this.n.navigate("/foo/bar");

                assert.equals(this.n.rootPage.curPath, "/");
                assert.equals(page1.curPath, "/foo");
                assert.equals(page2.curPath, "/foo/bar");
            },

            "cancelling by returning false": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    target: this.target,
                    prepare: function () {
                        return false;
                    },
                    routes: {
                        "/foo": "routeFoo"
                    },
                    routeFoo: function () { return page1; },
                    onNavigatedTo: this.spy()
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    prepare: this.spy(),
                    onNavigatedTo: this.spy()
                };

                this.n.navigate("/foo");
                assertNavigatedTo(this.n, "/");
                assert.pageHasGeneratedElement(this.n.rootPage);
                refute.pageHasGeneratedElement(page1);
                assert.pageNavigatedTo(this.n.rootPage);
                refute.pageNavigatedTo(page1);
            },

            "cancelling by asynchronously passing false": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    target: this.target,
                    prepare: function (done) {
                        done(false);
                    },
                    routes: {
                        "foo": "routeFoo"
                    },
                    routeFoo: function () { return page1; },
                    onNavigatedTo: this.spy()
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    prepare: this.spy(),
                    onNavigatedTo: this.spy()
                };

                this.n.navigate("/foo");
                assertNavigatedTo(this.n, "/");
                assert.pageHasGeneratedElement(this.n.rootPage);
                refute.pageHasGeneratedElement(page1);
                assert.pageNavigatedTo(this.n.rootPage);
                refute.pageNavigatedTo(page1);
            },

            "navigates away from page": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    target: this.target,
                    routes: {
                        "/foo": "routeFoo"
                    },
                    routeFoo: function () { return page1; },
                    onNavigatedAway: this.spy()
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    onNavigatedAway: this.spy()
                };

                this.n.navigate("/");
                refute.called(this.n.rootPage.onNavigatedAway);
                refute.called(page1.onNavigatedAway);

                this.n.navigate("/foo");
                assert.calledOnce(this.n.rootPage.onNavigatedAway);
                refute.called(page1.onNavigatedAway);

                this.n.navigate("/");
                assert.calledTwice(this.n.rootPage.onNavigatedAway);
                assert.calledOnce(page1.onNavigatedAway);

                this.n.navigate("/foo");
                assert.calledThrice(this.n.rootPage.onNavigatedAway);
                assert.calledOnce(page1.onNavigatedAway);
            },

            "navigate away is called with a direction object": function () {
                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/foo": "routeFoo"
                    },
                    routeFoo: function () {
                        return page1;
                    },
                    target: this.target,
                    onNavigatedAway: this.spy()
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/bar": "routeBar"
                    },
                    routeBar: function () {
                        return page2;
                    },
                    onNavigatedAway: this.spy()
                };
                var page2 = {
                    createElement: getDefaultCreateElement(),
                    onNavigatedAway: this.spy()
                };

                // there is nothing on the stack yet
                this.n.navigate("/");
                refute.called(this.n.rootPage.onNavigatedAway);
                refute.called(page1.onNavigatedAway);
                refute.called(page2.onNavigatedAway);

                this.n.pushPathSegment("foo");
                assert.calledWith(this.n.rootPage.onNavigatedAway, {
                    up: false
                });

                this.n.pushPathSegment("bar");
                assert.calledWith(page1.onNavigatedAway, {
                    up: false
                });

                this.n.popPage();
                assert.calledWith(page2.onNavigatedAway, {
                    up: true
                });

                this.n.popPage();
                assert.calledWith(page1.onNavigatedAway, {
                    up: true
                });

                // TODO how this should behave?
                // this.n.popPage();
                // assert.calledWith(this.n.rootPage.onNavigatedAway, {
                //     up: false
                // });
            },

            "// onNavigatedAway is called with direction object in all cases": function () {

            },

            "step by step": {
                "pushing from root": function () {
                    this.n.rootPage = {
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/boom": "routeBoom"
                        },
                        routeBoom: this.spy(function () {
                            return page1;
                        }),
                        target: this.target,
                        onNavigatedTo: this.spy(),
                        onNavigatedAway: this.spy(),
                        prepare: this.spy()
                    };
                    var page1 = {
                        createElement: getDefaultCreateElement(),
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };

                    this.n.navigate("/");

                    this.n.onNavigate = this.stub();
                    this.n.pushPathSegment("boom");

                    assertNavigatedTo(this.n, "/boom");
                    assert.pageRoutedTo(this.n.rootPage, "/boom");
                    assert.pageNavigatedTo(this.n.rootPage);
                    assert.pageNavigatedTo(page1);
                    assert.pagePrepared(this.n.rootPage);
                    assert.pagePrepared(page1);
                    assert.pageHasGeneratedElement(this.n.rootPage);
                    assert.pageHasGeneratedElement(page1);
                    assertOnlyChild(this.target, page1.element);
                    assert.calledOnce(this.n.rootPage.onNavigatedAway);
                },

                "popping from page": function () {
                    this.n.rootPage = {
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/boom": "routeBoom"
                        },
                        routeBoom: this.spy(function () {
                            return page1;
                        }),
                        target: this.target,
                        onNavigatedTo: this.spy(),
                        onNavigatedAway: this.spy(),
                        prepare: this.spy()
                    };
                    var page1 = {
                        createElement: getDefaultCreateElement(),
                        onNavigatedTo: this.spy(),
                        prepare: this.spy(),
                        onNavigatedAway: this.spy()
                    };

                    this.n.navigate("/boom");

                    this.n.onNavigate = this.stub();
                    this.n.popPage();

                    assertNavigatedTo(this.n, "/");
                    assertOnlyChild(this.target, this.n.rootPage.element);
                    assert.calledOnce(page1.onNavigatedAway);
                },

                "popping to unrendered page": function () {
                    this.n.rootPage = {
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/foo": "routeFoo"
                        },
                        routeFoo: this.spy(function () {
                            return page1;
                        }),
                        target: this.target,
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };
                    var page1 = {
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/bar": "routeBar"
                        },
                        routeBar: this.spy(function () {
                            return page2;
                        }),
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };
                    var page2 = {
                        createElement: getDefaultCreateElement(),
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };

                    this.n.navigate("/foo/bar");
                    this.n.popPage();

                    assert.pageNavigatedTo(page1);
                    assert.pageHasGeneratedElement(page1);
                    assertOnlyChild(this.target, page1.element);
                },

                "popping when at root page": function () {
                    this.n.rootPage = {
                        createElement: getDefaultCreateElement(),
                        target: this.target,
                        onNavigatedAway: this.spy()
                    };

                    this.n.navigate("/");
                    this.n.onNavigate = this.stub();

                    this.n.popPage();
                    refute.called(this.n.onNavigate);
                    assertOnlyChild(this.target, this.n.rootPage.element);
                    refute.called(this.n.rootPage.onNavigatedAway);
                },

                "relative push": function () {
                    this.n.rootPage = {
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/foo": "routeFoo"
                        },
                        routeFoo: this.spy(function () {
                            return page1;
                        }),
                        target: this.target,
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };
                    var page1 = {
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/bar": "routeBar"
                        },
                        routeBar: this.spy(function () {
                            return page2;
                        }),
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };
                    var page2 = {
                        createElement: getDefaultCreateElement(),
                        onNavigatedTo: this.spy(),
                        onNavigatedAway: this.spy(),
                        prepare: this.spy()
                    };

                    this.n.navigate("/foo/bar");
                    this.n.onNavigate = this.stub();
                    this.n.pushPathSegmentRelative("foo", this.n.rootPage);

                    assertNavigatedTo(this.n, "/foo");
                    assertOnlyChild(this.target, page1.element);
                    assert.calledOnce(page2.onNavigatedAway);
                },

                "// relative pop": function () {
                }
            },

            "to abstract root page": function () {
                var self = this;

                this.n.rootPage = {
                    routes: {
                        "/blaz": "routeBlaz"
                    },
                    routeBlaz: this.spy(function () {
                        return page1;
                    }),
                    target: this.target,
                    onNavigatedTo: this.spy(function () {
                        self.n.pushPathSegment("blaz");
                    }),
                    prepare: this.spy()
                };

                var page1 = {
                    createElement: getDefaultCreateElement(),
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };

                this.n.navigate("/");
                assert.calledTwice(this.n.onNavigate);
                assert.calledWithExactly(this.n.onNavigate, "/blaz");
                assert.pageRoutedTo(this.n.rootPage, "/blaz");
                assert.pageNavigatedTo(this.n.rootPage);
                assert.pageNavigatedTo(page1);
                assert.pagePrepared(this.n.rootPage),
                assert.pagePrepared(page1),
                refute.pageHasGeneratedElement(this.n.rootPage);
                assert.pageHasGeneratedElement(page1);
                assertOnlyChild(this.target, page1.element);
            },

            "test renders stack items while building the stack": function () {
                var eventAttendantsPageTarget = document.createElement("div");

                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    target: this.target,
                    routes: {
                        "/events": "routeEvents"
                    },
                    routeEvents: function () { return eventsListPage; }
                };

                var eventsListPage = {
                    createElement: getDefaultCreateElement(),
                    routes: {
                        "/123": "route123"
                    },
                    route123: function () { return eventPage; }
                };

                var eventPage = {
                    createElement: this.spy(function () {
                        var element = document.createElement("div");
                        this.eventAttendantsPageTarget = eventAttendantsPageTarget;
                        element.appendChild(this.eventAttendantsPageTarget);
                        return element;
                    }),
                    routes: {
                        "/attendants": "routeAttendants"
                    },
                    routeAttendants: function () {
                        eventAttendantsPage.target = this.eventAttendantsPageTarget;
                        return eventAttendantsPage;
                    }
                };

                var eventAttendantsPage = {
                    createElement: getDefaultCreateElement()
                };

                this.n.navigate("/events/123/attendants");

                assert.calledOnce(this.n.rootPage.createElement);
                assert.calledOnce(eventsListPage.createElement);
                assert.calledOnce(eventPage.createElement);
                assert.calledOnce(eventAttendantsPage.createElement);

                assertOnlyChild(this.n.rootPage.target, eventPage.element);
                assertOnlyChild(eventAttendantsPage.target, eventAttendantsPage.element);
            },

            "goto": {
                setUp: function () {
                    this.n.rootPage = {
                        name: "ROOT",
                        createElement: getDefaultCreateElement(),
                        target: this.target,
                        routes: {
                            "/foo": "routeFoo"
                        },
                        routeFoo: function () { return this.page1; }.bind(this),
                        onNavigatedTo: this.spy()
                    };

                    this.page1 = {
                        name: "PAGE1",
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/bar": "routeBar"
                        },
                        routeBar: function () { return this.page2; }.bind(this),
                        onNavigatedTo: this.spy()
                    };

                    this.page2 = {
                        name: "PAGE2",
                        createElement: getDefaultCreateElement(),
                        routes: {
                            "/baz": "routeBaz"
                        },
                        routeBaz: function () { return this.page3; }.bind(this),
                        onNavigatedTo: this.spy()
                    };

                    this.page3 = {
                        name: "PAGE3",
                        createElement: getDefaultCreateElement(),
                        onNavigatedTo: this.spy()
                    };
                },

                "current page does nothing": function () {
                    this.n.navigate("/foo/bar/baz");
                    this.n.gotoPage(this.page3);

                    refute.called(this.page1.onNavigatedTo);
                    refute.called(this.page2.onNavigatedTo);
                    assert.calledOnce(this.page3.onNavigatedTo);
                },

                "stack page navigates to that page": function () {
                    this.n.navigate("/foo/bar/baz");
                    this.n.gotoPage(this.page1);

                    assert.calledOnce(this.page1.onNavigatedTo);
                    refute.called(this.page2.onNavigatedTo);
                    assert.calledOnce(this.page3.onNavigatedTo);
                    assertOnlyChild(this.target, this.page1.element);
                },

                "non-existent page throws error": function () {
                    this.n.navigate("/foo/bar/baz");
                    assert.exception(function () {
                        this.n.gotoPage({});
                    }.bind(this));
                }
            }
        },

        "_findMatchingRoute": {
            setUp: function () {
                this._findMatchingRoute = window.Navstack.prototype._findMatchingRoute;
            },

            "empty path and empty page doesn't match": function () {
                var match = this._findMatchingRoute("", {});
                assert.equals(match, false);
            },

            "long path and empty page doesn't match": function () {
                var match = this._findMatchingRoute("/some/path", {});
                assert.equals(match, false);
            },

            "empty path and page with index matches": function () {
                var page = {
                    routes: {
                        "/": "routeIndex"
                    },
                    routeIndex: function () {}
                };
                var match = this._findMatchingRoute("", page);
                assert.equals(match, {
                    routeHandler: page.routeIndex,
                    pathSegment: "",
                    params: {}
                });
            },
            "empty path and page with no index doesn't match": function () {
                var page = {
                    routes: {
                        "/foo": "routeFoo"
                    },
                    routeFoo: function () {}
                };
                var match = this._findMatchingRoute("", page);
                refute(match);
            },
            "a path and page with no index don't match": function () {
                var page = {
                    routes: {
                        "/foo": "routeFoo"
                    },
                    routeFoo: function () {}
                };
                var match = this._findMatchingRoute("/bar/baz", page);
                refute(match);
            },
            "a path and page with index match": function () {
                var page = {
                    routes: {
                        "/": "routeIndex",
                        "/foo": "routeFoo"
                    },
                    routeIndex: function () {}
                };
                var match = this._findMatchingRoute("/bar/baz", page);
                assert.equals(match, {
                    routeHandler: page.routeIndex,
                    pathSegment: "",
                    params: {}
                });
            }
        },

        "_matchRoutePattern": {
            setUp: function () {
                this.match = window.Navstack.prototype._matchRoutePattern;
            },

            "empty path and empty route match": function () {
                var result = this.match("", "");
                assert.equals(result, {
                    pathSegment: "",
                    params: {}
                });
            },

            "empty path and non empty route doesn't match": function () {
                var result = this.match("", "/foo/bar");
                refute(result);
            },

            "non matching route returns false": function () {
                var result = this.match("abc", "/foo/bar");
                refute(result);
            },

            "matching route returns pathSegment and empty params": function () {
                var result = this.match("foo/bar/baz", "/foo/bar");
                assert.equals(result, {
                    pathSegment: "foo/bar",
                    params: {}
                });
            },

            "parametrized route returns pathSegment and params": function () {
                var result = this.match("foo/bar/53/boo", "/foo/:param1/:param2");
                assert.equals(result, {
                    pathSegment: "foo/bar/53",
                    params: {
                        param1: "bar",
                        param2: "53"
                    }
                });
            }
        },

        "asynchronous prepare": function (done) {
            var rootPage = {
                prepare: function (done) {
                    setTimeout(done, 1);
                },
                target: document.createElement("div")
            };
            this.n.rootPage = rootPage;

            this.n.onNavigate = done(function () {
                assert(true);
            });

            this.n.navigate("/");
        }
    });
}());