/*!
 * Bootstrap Table of Contents v1.0.1 (http://afeld.github.io/bootstrap-toc/)
 * Copyright 2015 Aidan Feldman
 * Licensed under MIT (https://github.com/afeld/bootstrap-toc/blob/gh-pages/LICENSE.md) */
(function($) {
  "use strict";

  window.Toc = {
    helpers: {
      // return all matching elements in the set, or their descendants
      findOrFilter: function($el, selector) {
        // http://danielnouri.org/notes/2011/03/14/a-jquery-find-that-also-finds-the-root-element/
        // http://stackoverflow.com/a/12731439/358804
        var $descendants = $el.find(selector);
        return $el
          .filter(selector)
          .add($descendants)
          .filter(":not([data-toc-skip])");
      },

      generateUniqueIdBase: function(el) {
        var text = $(el).text();

        // adapted from
        // https://github.com/bryanbraun/anchorjs/blob/65fede08d0e4a705f72f1e7e6284f643d5ad3cf3/anchor.js#L237-L257

        // Regex for finding the non-safe URL characters (many need escaping): & +$,:;=?@"#{}|^~[`%!'<>]./()*\ (newlines, tabs, backspace, & vertical tabs)
        var nonsafeChars = /[& +$,:;=?@"#{}|^~[`%!'<>\]\.\/\(\)\*\\\n\t\b\v]/g,
          urlText;

        // Note: we trim hyphens after truncating because truncating can cause dangling hyphens.
        // Example string:                      // " ⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
        urlText = text
          .trim() // "⚡⚡ Don't forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
          .replace(/\'/gi, "") // "⚡⚡ Dont forget: URL fragments should be i18n-friendly, hyphenated, short, and clean."
          .replace(nonsafeChars, "-") // "⚡⚡-Dont-forget--URL-fragments-should-be-i18n-friendly--hyphenated--short--and-clean-"
          .replace(/-{2,}/g, "-") // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated-short-and-clean-"
          .substring(0, 64) // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated-"
          .replace(/^-+|-+$/gm, "") // "⚡⚡-Dont-forget-URL-fragments-should-be-i18n-friendly-hyphenated"
          .toLowerCase(); // "⚡⚡-dont-forget-url-fragments-should-be-i18n-friendly-hyphenated"

        return urlText || el.tagName.toLowerCase();
      },

      generateUniqueId: function(el) {
        var anchorBase = this.generateUniqueIdBase(el);
        for (var i = 0; ; i++) {
          var anchor = anchorBase;
          if (i > 0) {
            // add suffix
            anchor += "-" + i;
          }
          // check if ID already exists
          if (!document.getElementById(anchor)) {
            return anchor;
          }
        }
      },

      generateAnchor: function(el) {
        if (el.id) {
          return el.id;
        } else {
          var anchor = this.generateUniqueId(el);
          el.id = anchor;
          return anchor;
        }
      },

      createNavList: function() {
        return $('<ul class="nav navbar-nav"></ul>');
      },

      createChildNavList: function($parent) {
        var $childList = this.createNavList();
        $parent.append($childList);
        return $childList;
      },

      generateNavEl: function(anchor, text) {
        var $a = $('<a class="nav-link"></a>');
        $a.attr("href", "#" + anchor);
        $a.text(text);
        var $li = $("<li></li>");
        $li.append($a);
        return $li;
      },

      generateNavItem: function(headingEl) {
        var anchor = this.generateAnchor(headingEl);
        var $heading = $(headingEl);
        var text = $heading.data("toc-text") || $heading.text();
        return this.generateNavEl(anchor, text);
      },

      // Find the first heading level (`<h1>`, then `<h2>`, etc.) that has more than one element. Defaults to 1 (for `<h1>`).
      getTopLevel: function($scope) {
        for (var i = 1; i <= 6; i++) {
          var $headings = this.findOrFilter($scope, "h" + i);
          if ($headings.length > 0) {
            return i;
          }
        }
        return 1;
      },

      // returns the elements from the different heading levels
      getHeadings: function($scope, topLevel) {
        // Include all header levels from topLevel to h6
        var selectors = [];
        for (var i = topLevel; i <= 6; i++) {
          selectors.push("h" + i);
        }

        return this.findOrFilter($scope, selectors.join(","));
      },

      getNavLevel: function(el) {
        return parseInt(el.tagName.charAt(1), 10);
      },

      populateNav: function($topContext, $headings) {
        var $contexts = [$topContext];
        var counters = new Array(6).fill(0); // Initialize counters for h1 to h6

        var helpers = this;
        $headings.each(function(i, el) {
          var $newNav = helpers.generateNavItem(el, counters);
          var navLevel = helpers.getNavLevel(el);

          // Adjust the context based on the current heading level
          if (navLevel > $contexts.length) {
            // If the current level is deeper than the current context, create a new nested context
            var $newContext = helpers.createChildNavList($contexts[$contexts.length - 1].children().last());
            $contexts.push($newContext);
          } else if (navLevel < $contexts.length) {
            // If the current level is shallower than the current context, go up the context stack
            $contexts = $contexts.slice(0, navLevel);
          }

          // Append the new navigation item to the current context
          $contexts[$contexts.length - 1].append($newNav);
        });
      },

      parseOps: function(arg) {
        var opts;
        if (arg.jquery) {
          opts = {
            $nav: arg
          };
        } else {
          opts = arg;
        }
        opts.$scope = opts.$scope || $(document.body);
        return opts;
      }
    },

    // accepts a jQuery object, or an options object
    init: function(opts) {
      opts = this.helpers.parseOps(opts);

      // ensure that the data attribute is in place for styling
      opts.$nav.attr("data-toggle", "toc");

      var $topContext = this.helpers.createChildNavList(opts.$nav);
      var topLevel = this.helpers.getTopLevel(opts.$scope);
      var $headings = this.helpers.getHeadings(opts.$scope, topLevel);
      this.helpers.populateNav($topContext, $headings);
    }
  };


  $(function() {
    $('nav[data-toggle="toc"]').each(function(i, el) {
      var $nav = $(el);
      Toc.init($nav);
    });
  });
})(jQuery);
