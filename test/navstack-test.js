buster.testCase("navstack", {
    setUp: function () {
        this.target = document.createElement("div");
        this.n = new Navstack();
        this.n.target = this.target;
    },

    "page rendering lifecycle": {
        "creates default element if createElement is not defined": function () {
            var c = {};
            Navstack.renderPage(c);
            assert.defined(c.element);
            assert(c.element instanceof Element);
        },

        "calls createElement if defined": function () {
            var actualElement = document.createElement("div");
            var c = {
                createElement: function () {
                    this.element = actualElement;
                }
            };

            Navstack.renderPage(c);
            assert.same(c.element, actualElement);
        },

        "re-renders when already rendered": function () {
            var predefinedElement = document.createElement("div");
            var c = {
                element: predefinedElement
            }
            Navstack.renderPage(c);
            assert.same(c.element, predefinedElement);
        },

        "re-renders with createElement": function () {
            var actualElement = document.createElement("div");
            var c = {
                createElement: this.spy(function () {
                    this.element = actualElement;
                })
            };
            Navstack.renderPage(c);
            Navstack.renderPage(c);
            assert.calledOnce(c.createElement);
            assert.same(c.element, actualElement);
        }
    },

    "page chain": {
        setUp: function () {
            this.bazPage = {};

            this.barPage = {};
            this.barPage.route = this.stub();
            this.barPage.route.returns(this.bazPage);

            this.fooPage = {};
            this.fooPage.route = this.stub();
            this.fooPage.route.returns(this.barPage);

            this.n.rootPage = {};
            this.n.rootPage.route = this.stub();
            this.n.rootPage.route.returns(this.fooPage);
        },

        "navigation calls onnavigate callback": function () {
            this.n.onnavigate = this.stub();

            this.n.navigate("/foo");
            assert.calledOnce(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/foo");

            this.n.navigate("/foo/bar/baz");
            assert.calledTwice(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/foo/bar/baz");
        },

        "navigation prepares all items": function () {
            this.n.rootPage.prepare = function () {
                this.root = 123;
            }

            this.fooPage.prepare = function () {
                this.foo = 123;
            }

            this.barPage.prepare = function () {
                this.bar = 123;
            }

            this.n.navigate("/foo/bar");
            assert.equals(this.n.rootPage.root, 123);
            assert.equals(this.fooPage.foo, 123);
            assert.equals(this.barPage.bar, 123);
        },

        "navigation prepares all items with asynchronous prepare": function (done) {
            var self = this;

            this.n.rootPage.prepare = function (done) {
                this.root = 123;
                setTimeout(done, 1);
            }

            this.fooPage.prepare = function (done) {
                this.foo = 123;
                setTimeout(done, 1);
            }

            this.barPage.prepare = function (done) {
                this.bar = 123;
                setTimeout(done, 1);
            }

            this.n.onnavigate = done(function () {
                assert.equals(self.n.rootPage.root, 123);
                assert.equals(self.fooPage.foo, 123);
                assert.equals(self.barPage.bar, 123);
            });

            this.n.navigate("/foo/bar");
        },

        "navigation renders only last item in stack": function () {
            this.spy(Navstack, "renderPage");
            this.n.navigate("/foo/bar");

            assert.calledOnce(Navstack.renderPage);
            assert.same(Navstack.renderPage.getCall(0).args[0], this.barPage);
        },

        "navigating to root page renders it": function () {
            this.spy(Navstack, "renderPage");
            this.n.navigate("/");
            assert.calledOnce(Navstack.renderPage);
            assert.same(Navstack.renderPage.getCall(0).args[0], this.n.rootPage);
        },

        "navigating to root page prepares it": function () {
            this.n.rootPage.prepare = this.stub();
            this.n.navigate("/");
            assert.calledOnce(this.n.rootPage.prepare);
        },

        "navigating to root page calls onnavigate": function () {
            this.n.onnavigate = this.stub();
            this.n.navigate("/");
            assert.calledOnce(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/");
        },

        "navigating routes with segment name": function () {
            this.n.navigate("/foo/bar/baz");
            assert.calledWithExactly(this.n.rootPage.route, "foo");
            assert.calledWithExactly(this.fooPage.route, "bar");
            assert.calledWithExactly(this.barPage.route, "baz");
        },

        "navigating renders in target element": function () {
            this.n.navigate("/foo");
            assert.equals(this.target.childNodes.length, 1);
            assert.same(this.target.firstChild, this.fooPage.element);
        },

        "navigating twice renders only current page": function () {
            this.n.navigate("/foo");
            this.n.navigate("/foo");
            assert.equals(this.target.childNodes.length, 1);
            assert.same(this.target.firstChild, this.fooPage.element);

            this.n.navigate("/foo/bar");
            assert.equals(this.target.childNodes.length, 1);
            assert.same(this.target.firstChild, this.barPage.element);

            this.n.navigate("/");
            assert.equals(this.target.childNodes.length, 1);
            assert.same(this.target.firstChild, this.n.rootPage.element);
        },

        "navigating to abstract root page prepares it": function () {
            var self = this;
            this.n.rootPage.isAbstract = true;
            this.n.rootPage.prepare = function () { this.root = 123; };

            this.n.navigate("/");
            assert.equals(this.n.rootPage.root, 123);
        },

        "navigating to abstract root page does not render it": function () {
            this.n.rootPage.isAbstract = true;
            this.spy(Navstack, "renderPage");
            this.n.navigate("/");
            refute.called(Navstack.renderPage);
        },

        "navigating to abstract root page calls onnavigate": function () {
            this.n.rootPage.isAbstract = true;
            this.n.onnavigate = this.stub();
            this.n.navigate("/");
            assert.calledOnce(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/");
        },

        "navigating to abstract root page loads it": function () {
            this.n.rootPage.isAbstract = true;
            this.n.rootPage.load = this.stub();
            this.n.navigate("/");
            assert.calledOnce(this.n.rootPage.load);
        },

        "sequential steps": {
            setUp: function () {
                this.n.navigate("/foo");
            },

            "pushing one page calls onnavigate": function () {
                this.n.onnavigate = this.stub();
                this.n.pushPage("bar");
                assert.calledOnce(this.n.onnavigate);
                assert.calledWithExactly(this.n.onnavigate, "/foo/bar");
            },

            "pushing one page prepares it": function () {
                this.barPage.prepare = function () {
                    this.bar = "yup";
                }
                this.n.pushPage("bar");
                assert.equals(this.barPage.bar, "yup");
            },

            "pushing one page prepares asynchronously": function (done) {
                var self = this;
                this.barPage.prepare = function (done) {
                    this.bar = "yup";
                    setTimeout(done, 1);
                }
                this.n.onnavigate = done(function () {
                    assert.equals(self.barPage.bar, "yup");
                });
                this.n.pushPage("bar");
            },

            "pushing one page routes current page with that path name": function () {
                this.n.pushPage("bar");
                assert.calledWithExactly(this.fooPage.route, "bar");

                this.n.pushPage("baz");
                assert.calledWithExactly(this.barPage.route, "baz");
            },

            "pushing one page renders it": function () {
                this.spy(Navstack, "renderPage");
                this.n.pushPage("bar");

                assert.calledOnce(Navstack.renderPage);
                assert.same(Navstack.renderPage.getCall(0).args[0], this.barPage);
            },

            "pushing two pages prepares and renders both": function () {
                this.barPage.prepare = this.stub();
                this.bazPage.prepare = this.stub();
                this.spy(Navstack, "renderPage");
                this.n.onnavigate = this.stub();

                this.n.pushPage("bar");
                this.n.pushPage("baz");

                assert.calledOnce(this.barPage.prepare);
                assert.calledOnce(this.bazPage.prepare);
                assert.calledTwice(Navstack.renderPage);
                assert.same(Navstack.renderPage.getCall(0).args[0], this.barPage);
                assert.same(Navstack.renderPage.getCall(1).args[0], this.bazPage);
                assert.calledTwice(this.n.onnavigate);
                assert.equals(this.n.onnavigate.getCall(0).args[0], "/foo/bar");
                assert.equals(this.n.onnavigate.getCall(1).args[0], "/foo/bar/baz");
            },

            "pushing one page renders that page in target": function () {
                this.n.pushPage("bar");
                assert.equals(this.target.childNodes.length, 1);
                assert.same(this.target.firstChild, this.barPage.element);
            },

            "popping one page calls onnavigate": function () {
                this.n.onnavigate = this.stub();
                this.n.popPage();
                assert.calledOnce(this.n.onnavigate);
                assert.calledWithExactly(this.n.onnavigate, "/");
            },

            "popping one page renders previous page": function () {
                this.spy(Navstack, "renderPage");
                this.n.popPage();
                assert.calledOnce(Navstack.renderPage);
                assert.same(Navstack.renderPage.getCall(0).args[0], this.n.rootPage);
            },

            "popping one page does not prepare previous page": function () {
                this.n.rootPage.prepare = this.stub();
                this.n.popPage();
                refute.called(this.n.rootPage.prepare);
            },

            "popping on root page does not render or prepare": function () {
                this.n.navigate("/");
                this.spy(Navstack, "renderPage");
                this.n.rootPage.prepare = this.stub();
                this.fooPage.prepare = this.stub();

                this.n.popPage();

                refute.called(Navstack.renderPage);
                refute.called(this.n.rootPage.prepare);
                refute.called(this.fooPage.prepare);
            },

            "popping twice renders prev and prev prev page": function () {
                this.n.navigate("/foo/bar/baz");
                this.spy(Navstack, "renderPage");
                this.barPage.prepare = this.stub();
                this.fooPage.prepare = this.stub();

                this.n.popPage();
                refute.called(this.barPage.prepare);
                refute.called(this.fooPage.prepare);
                assert.calledOnce(Navstack.renderPage);
                assert.same(Navstack.renderPage.getCall(0).args[0], this.barPage);

                this.n.popPage();
                refute.called(this.barPage.prepare);
                refute.called(this.fooPage.prepare);
                assert.calledTwice(Navstack.renderPage);
                assert.same(Navstack.renderPage.getCall(1).args[0], this.fooPage);
            },

            "popping renders page in target": function () {
                this.n.pushPage("bar");

                this.n.popPage();
                assert.equals(this.target.childNodes.length, 1);
                assert.same(this.target.firstChild, this.fooPage.element);

                this.n.popPage();
                assert.equals(this.target.childNodes.length, 1);
                assert.same(this.target.firstChild, this.n.rootPage.element);
            }
        }
    },

    "nesting": {
        setUp: function () {
            this.barPage = {};

            this.target2 = document.createElement("div");
            this.n2 = new Navstack();
            this.n2.target = this.target2;
            this.n2.rootPage = {};
            this.n2.rootPage.route = this.stub();
            this.n2.rootPage.route.returns(this.barPage);

            this.fooPage = {};
            this.fooPage.route = this.stub();
            this.fooPage.route.returns(this.n2);

            this.n.rootPage = {};
            this.n.rootPage.route = this.stub();
            this.n.rootPage.route.returns(this.fooPage);
        },

        "should render root page": function () {
            this.spy(Navstack, "renderPage");
            this.n.navigate("/foo/nav2");
            assert.called(Navstack.renderPage);
            assert.calledWithExactly(Navstack.renderPage, this.n2.rootPage);
        },

        "should prepare pages": function () {
            this.n.rootPage.prepare = function () {
                this.root = 123;
            }

            this.fooPage.prepare = function () {
                this.foo = 123;
            }

            this.n2.rootPage.prepare = function () {
                this.root = 123;
            }

            this.n.navigate("/foo/nav2");
            assert.equals(this.n.rootPage.root, 123);
            assert.equals(this.fooPage.foo, 123);
            assert.equals(this.n2.rootPage.root, 123);
        },

        "should render root page in nested navstack target": function () {
            this.n.navigate("/foo");
            assert.equals(this.target2.childNodes.length, 0);
            this.n.navigate("/foo/nav2");
            assert.equals(this.target2.childNodes.length, 1);
            assert.same(this.target2.firstChild, this.n2.rootPage.element);
        },

        "should call onnavigate": function () {
            this.n.onnavigate = this.stub();
            this.n.navigate("/foo/nav2");
            assert.calledOnce(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/foo/nav2");
        },

        "pushing to nested navstack should render": function () {
            this.n.navigate("/foo");
            this.n.pushPage("nav2");
            assert.same(this.target2.firstChild, this.n2.rootPage.element);
        },

        "pushing to nested navstack should call onnavigate": function () {
            this.n.navigate("/foo");
            this.n.onnavigate = this.stub();
            this.n.pushPage("nav2");
            assert.calledOnce(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/foo/nav2");
        },

        "pushing to nested page should render": function () {
            this.n.navigate("/foo/nav2");
            this.n.pushPage("bar");
            assert.same(this.target2.firstChild, this.barPage.element);
        },

        "popping from nested navstack should render": function () {
            this.n.navigate("/foo/nav2");
            this.n.popPage();
            assert.same(this.target.firstChild, this.fooPage.element);
        },

        "popping from nested navstack should call onnavigate": function () {
            this.n.navigate("/foo/nav2");
            this.n.onnavigate = this.stub();
            this.n.popPage();
            assert.calledOnce(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/foo");
        },

        "popping from nested page should render": function () {
            this.n.navigate("/foo/nav2/bar");
            this.n.popPage();
            assert.same(this.target2.firstChild, this.n2.rootPage.element);
        },

        "popping form nested page should call onnavigate": function () {
            this.n.navigate("/foo/nav2/bar");
            this.n.onnavigate = this.stub();
            this.n.popPage();
            assert.calledOnce(this.n.onnavigate);
            assert.calledWithExactly(this.n.onnavigate, "/foo/nav2");
        },

        "navigating should update all target elements": function () {
            var target3 = document.createElement("div");
            var n3 = new Navstack();
            n3.target = target3;
            n3.rootPage = {};

            this.barPage.route = this.stub();
            this.barPage.route.returns(n3);

            this.n.navigate("/foo/nav2/bar/nav3");
            assert.same(this.target.firstChild, this.fooPage.element);
            assert.same(this.target2.firstChild, this.barPage.element);
            assert.same(target3.firstChild, n3.rootPage.element);
        }
    }
});