## CHANGELOG

### 0.2

  - AMD support
  - onNavigatedAway is passed a direction object, e.g {up: true}. This is useful for knowing whether the page should be cleaned up, or whether it should keep the state around, because we're navigating deeper into the state tree
  - when navigating to a different subtree using navigate(), pop each one of the old pages to call appropriate events for cleanup
  - include .jshintrc file in the repo for easier collaboration on code

### 0.1

  - original navstack

navstack.js
===========

Attempts to solve the problem of page navigation and rebuild from URL in single page webapps.

By accepting a few limitations, navstack.js will automatically give you an URL for each page in your one page webapp, and is also able to rebuild the page from an URL (refreshing, clicking links, ...) without you having to write any special code for it.

Rationale
=========

You often hear the following about the web: "It's made for building static pages of text, not intricate applications. Therefore, single page webapps are hard to make." Let's investigate that claim.

Android, iOS, QT, etc. all have one thing in common: The user interface is represented as a tree structure of views. And a view can listen to user interaction events such as mouse clicks and screen touches. Intrestingly, this is also how the DOM works. Views are called elements, but it's a tree structure, and elements (views) can listen to user interaction events. So why isn't the web just as suited as the various native UI environments to build advanced user interfaces?

The answer is patterns and abstractions. The native environments have a bunch of tools, abstractions and restrictions that solves problems for you. navstack.js is an attempt at making such an abstraction for the web.

Existing libraries and frameworks don't seem to attempt to solve this problem. Backbone.js and Ember.js does not try to solve the problems navstack.js tries to solve.

So just as you wouldn't use raw UIViews with no UINavigationControllers and UIViewControllers in iOS, you shouldn't write single page webapps without abstractions like navstack.js.

Usage
=====

First, create the navstack.

    var n = new Navstack();

You need to set a root page and a target element.

    var myRootPage = {} // Or new MyRootPage(), or whatever.
    n.rootPage = myRootPage;
    n.rootPagetarget = document.body; // Or jQuery("body").get(0), or whatever.

You can also listen to URL changes. navstack.js does not attempt to set document.location.hash or use HTML5 pushState, that's up to you.

    n.onNavigate = function (path) {
        // ...do stuff with path
        // document.location.hash = path
        // ..or whatever
    }

Now you're ready to enable your navigation stack.

    n.navigate("/"); // Or window.location.path, or document.location.hash, or whatever

This will render the root page in the target of the navstack. By default, a page will render an empty div. To make it render your own DOM element, define the following method.

    myRootPage.createElement = function () {
        var element = document.createElement("div");
        var title = document.createElement("h1");
        title.innerHTML = "Welcome!";
        element.appendChild(title);

        return element;
    }

The only requirement is that you return a DOM element. You're free to use any templating language you use, as long as it is able to return a single DOM element from your templates. Serenade.js, jQuery, mustache, handlebars, and others, are good templating systems that works just fine with navstack.js.

    myRootPage.createElement = function () {
        return Handlebars.compile("My handlebars template")();
    }

    myRootPage.createElement = function () {
        return jQuery("<div><h1>Welcome!</h1></div>").get(0);
    }

Having a single page is not that useful. You probably want to navigate deeper into your application's pages and views.

    n.pushPathSegment("events");

In general, pushing a new page will call "route" on the page that's currently on the top of the navigation stack. At this point in time, it's the root page.

    myRootPage.route = function (pathname) {
        if (pathname == "events") {
            return new EventsPage();
        }

        if (pathname == "about") {
            return new AboutPage();
        }
    }

The currently visible page is responsible for routing to the next page. This gives you full flexibility in which page should follow another page. The pathname you passed to n.pushPage is passe don to route, so you can use it to determine which page to load next.

The AboutPage and ContactPage can be any object you want. You can for example just return {createElement: function(){}, route: function(){}}, or use Object.create(EventsPage). It doesn't matter to navstack.js how you initialize your page objects.

    // Example using constructors and prototype. You can use Object.create or
    // whatever, navstack.js doesn't care.
    var EventsPage = function(){};
    EventsPage.prototype = {
        createElement: function () {
            return createMyDomElementSomehow();
        }
    }

The next page is identical to the root page. You define createElement and return a DOM element. This element will be put into the target element of the navstack (document.body in this case), and any other elements already present will be removed first so that we only display one page at a time.

Pages might want to load data. A callback, prepare, is provided for this.

    // Synchronous
    EventsPage.prototype.prepare = function () {
        this.events = [{name: "John's Birthday"}, {name: "Weekly standup"}]
    }

    // Asynchronous
    EventsPage.prototype.prepare = function (done) {
        var self = this;
        $.getJSON("/events", function (data) {
            self.events = data;
            done();
        });
    }

If your page has a prepare function, it will be called before createElement is called. If the prepare function takes an argument (we check .prepare.length === 1 internally), we assume that prepare is asynchronous and we wait for the done() function to be called by you before we continue rendering the page.

    EventsPage.prototype.createElement = function () {
        // You're guaranteed that prepare has been called at this point.
        // We pass in this.events, set in prepare, to our templating system.
        return createDomElementForEvents(this.events);
    }

We'll assume your template creates a list of all the events, and binds a click event on each of them. The click handler can do the following:

    onEventClick: function (e) {
        var eventId = e.targetElement.getAttribute("data-id");
        n.pushPathSegmentRelative(eventId, this);
    }

Note that it is very useful to do relative pushes, so that your push will work even if you're on another part of the page stack (which may happen in partial page updates and/or nested pages).

    n.pushPathSegment("foo");
    n.pushPathSegmentRelative("foo", myRootPage); // Safer

As we saw earlier, pushPage will call route on the currently visible page. Here's how we can implement this route function to respond to the dynamic event IDs passed to it.

    EventsPage.prototype.route = function (pathname) {
        for (var i = 0, ii = this.events.length; i < ii; i++) {
            var event = this.events[i];
            if (event.id == pathname) return new EventPage(event);
        }
    }

You test your data for the ID fetched from the link, and return an event page when you find a match.

You can go back one page too.

   n.popPage();

You might what to have an absolute way of going back.

   n.popPage();
   n.gotoPage(myRootPage); // Safer

TODO:

404 handling