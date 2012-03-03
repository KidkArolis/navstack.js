function assertOnlyChild(target, element) {
    assert.equals(target.childNodes.length, 1, "Target element did not have one child node.");
    assert.same(target.firstChild, element);
}

function assertNavigatedTo(navstack, expected) {
    assert(navstack instanceof Navstack, "Expected Navstack instance");
    assert(navstack.onNavigate.calledOnce, "Expected onNavigate to be called");
    assert.equals(navstack.onNavigate.getCall(0).args[0], expected, "onNavigate");
}

buster.assertions.add("pageNavigatedTo", {
    assert: function (page) {
        return page.onNavigatedTo.calledOnce;
    },
    assertMessage: "Expected page to have been navigated to",
    refuteMessage: "Expected page to NOT have been navigated to"
});

buster.assertions.add("pageRoutedTo", {
    assert: function (page, expected) {
        this.wtf = expected;
        return page.route.getCall(0).args[0] == expected;
    },
    assertMessage: "Expected page to be routed to ${wtf}"
});

buster.assertions.add("pagePrepared", {
    assert: function (page) {
        return page.prepare.calledOnce;
    },
    assertMessage: "Expected page to have been loaded"
});

buster.assertions.add("pageHasGeneratedElement", {
    assert: function (page) {
        return page.element instanceof Element;
    },
    assertMessage: "Expected page to have element generated",
    refuteMessage: "Expected page to NOT have element generated"
});

