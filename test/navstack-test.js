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
                    route: this.spy(function () {
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
                assert.pageRoutedTo(this.n.rootPage, "foo");
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
                    route: this.spy(function () {
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
                assert.pageRoutedTo(this.n.rootPage, "boom");
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
                    route: this.spy(function () {
                        return page1;
                    }),
                    target: this.target,
                    onNavigatedTo: this.spy(),
                    prepare: this.spy()
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    route: this.spy(function () {
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
                assert.pageRoutedTo(this.n.rootPage, "wakka");
                assert.pageRoutedTo(page1, "shakka");
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

            "current path while building": function () {
                var self = this;

                var prepareFunc = function () {
                    this.curPath = self.n.currentPath();
                };

                this.n.rootPage = {
                    createElement: getDefaultCreateElement(),
                    target: this.target,
                    prepare: prepareFunc,
                    route: function () { return page1; }
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    prepare: prepareFunc,
                    route: function () { return page2; }
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
                    route: function () { return page1; },
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
                    route: function () { return page1; },
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
                    route: function () { return page1; },
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
                    route: function () {
                        return page1;
                    },
                    target: this.target,
                    onNavigatedAway: this.spy()
                };
                var page1 = {
                    createElement: getDefaultCreateElement(),
                    route: function () {
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
                        route: this.spy(function () {
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
                    assert.pageRoutedTo(this.n.rootPage, "boom");
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
                        route: this.spy(function () {
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
                        route: this.spy(function () {
                            return page1;
                        }),
                        target: this.target,
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };
                    var page1 = {
                        createElement: getDefaultCreateElement(),
                        route: this.spy(function () {
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
                        route: this.spy(function () {
                            return page1;
                        }),
                        target: this.target,
                        onNavigatedTo: this.spy(),
                        prepare: this.spy()
                    };
                    var page1 = {
                        createElement: getDefaultCreateElement(),
                        route: this.spy(function () {
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
                    route: this.spy(function () {
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
                assert.pageRoutedTo(this.n.rootPage, "blaz");
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
                    route: function () { return eventsListPage; }
                };

                var eventsListPage = {
                    createElement: getDefaultCreateElement(),
                    route: function () { return eventPage; }
                };

                var eventPage = {
                    createElement: this.spy(function () {
                        var element = document.createElement("div");
                        this.eventAttendantsPageTarget = eventAttendantsPageTarget;
                        element.appendChild(this.eventAttendantsPageTarget);
                        return element;
                    }),
                    route: function () {
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
                        route: function () { return this.page1; }.bind(this),
                        onNavigatedTo: this.spy()
                    };

                    this.page1 = {
                        name: "PAGE1",
                        createElement: getDefaultCreateElement(),
                        route: function () { return this.page2; }.bind(this),
                        onNavigatedTo: this.spy()
                    };

                    this.page2 = {
                        name: "PAGE2",
                        createElement: getDefaultCreateElement(),
                        route: function () { return this.page3; }.bind(this),
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