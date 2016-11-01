/**
 * WunderlistNavigator
 *
 * This file is part of the WunderlistNavigator; an opensource Google Chrome extension
 * https://github.com/pedrocatre/wunderlist-navigator
 * It uses the omni-search UI element for global searches
 * https://github.com/pedrocatre/omni-search
 *
 * MIT (c) Pedro Catré <http://pedrocatre.com/>
 */
(function(){

    'use strict';

    /**
     * Configuration constants for the extension
     *
     * @type {Object}
     */
    var Config = {

        // References to extension DOM elements
        OMNI_SEARCH  : '.omni-search',

        // References to wunderlist DOM elements
        LIST_LINKS     : '.sidebarItem a',
        SELECTED_TASK     : '.taskItem.selected',

        // Shortcut for activation
        MASTER_KEY    : '⌘+⇧+l',

        WUNDERLIST_URL       : 'https://www.wunderlist.com'
    };

    /**
     * Houses all the lists, once fetched
     *
     * @type array
     */
    var allLists = [];
    var $search;


    /**
     * Main extension class
     *
     * @returns {{loadExtension: loadExtension, bindUI: bindUI}}
     * @constructor
     */
    function WunderlistNavigator() {

        /**
         * Switches to list with specified path
         * @param listData
         */
        function switchToList(listData) {

            function navigateToListPath() {
                window.location.href = Config.WUNDERLIST_URL + listData.href;
            }

            // Hack... if one of the list elements is selected on wunderlist the action to navigate to a different
            // URL will not work. It navigates there but is immediately pulled back to the page with the element's
            // details open
            if($(Config.SELECTED_TASK).length != 0) {
                setTimeout(navigateToListPath, 1000);
            } else {
                navigateToListPath();
            }
        }

        return {

            appendTheUi: function ($container) {
                if (!($container instanceof jQuery)) {
                    $search = $($container).omniSearch();
                }
                return $search;
            },

            /**
             * Loads the extension in specified container
             *
             * @param $container
             */
            loadExtension: function () {
                this.bindUI();
            },

            /**
             * Binds the UI elements for the extension
             */
            bindUI: function () {
                var self = this;

                // Master key binding for which the extension will be enabled
                function showNavigator() {
                    console.log('>> Wunderlist Navigator shortcut clicked');
                    var lists = [];
                    $(Config.LIST_LINKS).each(function (index, element) {
                        var list = {};
                        var $this = $(this);
                        list.href = $this.attr('href');
                        list.title = $this.find('.title').text();
                        lists.push(list);
                    });
                    allLists = lists;
                    $search.omniSearch('open', lists, switchToList);
                }

                chrome.runtime.onMessage.addListener(
                    function(request, sender, sendResponse) {
                        console.log('got message');
                        if( request.message === 'open-wunderlist-navigator' ) {
                            // Wunderlist might remove the UI after it is attached, so we need to reattach it
                            if($(Config.OMNI_SEARCH).length === 0) {
                                self.appendTheUi('body');
                            }

                            showNavigator();
                        }
                    }
                );
            }
        };
    }

    $(document).ready(function () {
        var wunderlistNavigator = new WunderlistNavigator();
        wunderlistNavigator.loadExtension();
    });

}());
