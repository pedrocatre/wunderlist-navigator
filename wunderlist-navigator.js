

/**
 * WunderlistNavigator
 *
 * This file is part of the WunderlistNavigator; an opensource Google Chrome extension
 * https://github.com/pedrocatre/wunderlist-navigator
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

        // Default favicon to use
        DEFAULT_FAVICON: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAMklEQVR4AWMgEkT9R4INWBUgKX0Q1YBXQYQCkhKEMDILogSnAhhEV4AGRqoCTEhkPAMAbO9DU+cdCDkAAAAASUVORK5CYII=',

        // Templates
        MAIN_TEMPLATE :'<div class="wunderlist-navigator" style="display: none;">' +
                            '<input type="text">' +
                            '<ul class="lists-list">' +
                            '</ul>' +
                        '</div>',

        LIST_TEMPLATE  : '<li data-list-path="{listPath}" class="list-item">' +
                            '<span class="favicon-img">' +
                                '<img src="{favicon}" onerror="this.src=\'{default_favicon}\';">' +
                                '</span>' +
                            '<span class="title">{title}</span>' +
                        '</li>',

        // References to extension DOM elements
        SELECTED_CLASS: 'selected-list',
        LIST_SELECTED  : '.selected-list',
        FAVICON_IMG   : '.favicon-img img',
        LIST_SWITCHER  : '.wunderlist-navigator',
        LISTS_LIST      : '.wunderlist-navigator .lists-list',
        LIST_ITEM      : '.list-item',
        LIST_INPUT     : '.wunderlist-navigator input[type="text"]',

        // References to wunderlist DOM elements
        LIST_LINKS     : '.sidebarItem a',
        SELECTED_TASK     : '.taskItem.selected',

        // Shortcut for activation
        MASTER_KEY    : '⌘+⇧+l',

        // Key codes for certain actions
        DOWN_KEY      : 40,
        UP_KEY        : 38,
        ESCAPE_KEY    : 27,
        ENTER_KEY     : 13,
        SEMICOLON_KEY : 186,

        // Actions
        GOING_UP      : 'going_up',
        GOING_DOWN    : 'going_down',
        ESCAPING      : 'escaping',
        SWITCHING     : 'switching',

        WUNDERLIST_URL       : 'https://www.wunderlist.com'
    };

    /**
     * Houses all the lists, once fetched
     *
     * @type array
     */
    var allLists = [];


    /**
     * Main extension class
     *
     * @returns {{loadExtension: loadExtension, bindUI: bindUI}}
     * @constructor
     */
    function WunderlistNavigator() {

        /**
         * Populates the lists
         * @param lists
         */
        function populateLists(lists) {
            var listsHtml = getListsHtml(lists);

            $(Config.LISTS_LIST).html(listsHtml);
            $(Config.LIST_ITEM).first().addClass(Config.SELECTED_CLASS);
        }

        /**
         * Hides the switcher input and list
         */
        function hideSwitcher() {
            $(Config.LIST_SWITCHER).hide();
            $(Config.LIST_INPUT).val('');
        }

        /**
         * Gets the action to be performed for the given keycode
         *
         * @param keyCode
         * @returns {*}
         */
        function getSwitcherAction(keyCode) {
            switch (keyCode) {
                case Config.UP_KEY:
                    return Config.GOING_UP;
                case Config.DOWN_KEY:
                    return Config.GOING_DOWN;
                case Config.ESCAPE_KEY:
                    return Config.ESCAPING;
                case Config.ENTER_KEY:
                    return Config.SWITCHING;
                default:
                    return false;
            }
        }

        /**
         * Moves the focus for the selected list for the passed action
         *
         * @param action
         */
        function moveListFocus(action) {

            var $firstSelected  = $(Config.LIST_SELECTED);

            // If some list was already selected
            if ($firstSelected.length !== 0 ) {

                // Make it unselected
                $firstSelected.removeClass(Config.SELECTED_CLASS);

                var $toSelect = null;

                if (action === Config.GOING_DOWN) {
                    var $nextSelected = $firstSelected.next(Config.LIST_ITEM);
                    $toSelect         = $nextSelected.length !== 0 ? $nextSelected : $(Config.LIST_ITEM).first();
                } else if (action === Config.GOING_UP) {
                    var $prevSelected = $firstSelected.prev(Config.LIST_ITEM);
                    $toSelect = $prevSelected.length !== 0 ? $prevSelected : $(Config.LIST_ITEM).last();
                }

                $nextSelected = $toSelect.addClass(Config.SELECTED_CLASS);
            } else {
                $nextSelected = $(Config.LIST_ITEM).first().addClass(Config.SELECTED_CLASS);
            }

            $nextSelected.get(0).scrollIntoViewIfNeeded();
        }

        /**
         * Switches to list with specified path
         * @param listPath
         */
        function switchToList(listPath) {

            function navigateToListPath() {
                window.location.href = Config.WUNDERLIST_URL + listPath;
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

        /**
         * Switches to the currently focused list
         */
        function switchToSelectedList() {
            var $firstSelected = $(Config.LIST_SWITCHER).find(Config.LIST_SELECTED).first();
            var listPath = $firstSelected.data('listPath');
            switchToList(listPath);
        }

        /**
         * Performs the action for the passed keypress event
         *
         * @param event
         */
        function handleKeyPress(event) {

            var action = getSwitcherAction(event.keyCode);

            switch (action) {
                case Config.GOING_UP:
                case Config.GOING_DOWN:
                    moveListFocus(action);
                    break;
                case Config.ESCAPING:
                    $(Config.LIST_SWITCHER).hide();
                    break;
                case Config.SWITCHING:
                    switchToSelectedList();
                    break;
            }
        }

        /**
         * Generates HTML string for the passed array of objects
         *
         * @param lists
         * @returns {string}
         */
        function getListsHtml(lists) {
            var listsHtml = '';
            lists.forEach(function(list){

                var tempListTemplate = Config.LIST_TEMPLATE,
                    faviconUrl = list.favIconUrl || Config.DEFAULT_FAVICON;

                tempListTemplate = tempListTemplate.replace('{favicon}', sanitizeHtml(faviconUrl));
                tempListTemplate = tempListTemplate.replace('{default_favicon}', Config.DEFAULT_FAVICON);
                tempListTemplate = tempListTemplate.replace('{title}', sanitizeHtml(list.title));
                tempListTemplate = tempListTemplate.replace('{listPath}', sanitizeHtml(list.href));

                listsHtml += tempListTemplate;
            });

            return listsHtml;
        }

        /**
         * Filters lists by the specified keyword string
         *
         * @param keyword
         */
        function filterLists(keyword) {

            keyword = keyword.toLowerCase();

            var matches   = [],
                tempTitle = '',
                tempUrl   = '';

            allLists.map(function (list) {
                tempTitle = list.title.toLowerCase();
                tempUrl   = list.href.toLowerCase();

                if (tempTitle.match(keyword) || tempUrl.match(keyword)) {
                    matches.push(list);
                }
            });

            populateLists(matches);
        }

        return {

            appendTheUi: function ($container) {
                if (!($container instanceof jQuery)) {
                    $container = $($container);
                }

                $container.append(Config.MAIN_TEMPLATE);
                return $container;
            },

            /**
             * Loads the extension in specified container
             *
             * @param $container
             */
            loadExtension: function ($container) {
                this.appendTheUi($container);
                this.bindUI();
            },

            /**
             * Binds the UI elements for the extension
             */
            bindUI: function () {
                var self = this;
                // mouse-down instead of click because click gets triggered after the blur event in which case wunderlist navigator
                // would already be hidden (@see blur event below) and click will not be performed
                $(document).on('mousedown', Config.LIST_ITEM, function () {

                    var $this = $(this),
                        listPath = $this.data('listPath');

                    switchToList(listPath);
                });

                // Hide the switcher on blurring of input
                $(document).on('blur', Config.LIST_INPUT, function () {
                    hideSwitcher();
                });

                // Actions on tabs listing
                $(document).on('keydown', Config.LIST_INPUT, function (e) {
                    // Switcher was visible and either down or up key was pressed
                    if ($(Config.LIST_SWITCHER).is(':visible')) {
                        handleKeyPress(e);
                    }
                });

                // Filter for lists
                $(document).on('keyup', Config.LIST_INPUT, function (e) {

                    var keyCode = e.keyCode,
                        action  = getSwitcherAction(keyCode);

                    switch (action) {
                        case Config.GOING_DOWN:
                        case Config.GOING_UP:
                        case Config.ESCAPING:
                        case Config.SWITCHING:
                            return;
                        default:
                            var keyword = $(this).val();
                            if ($.trim(keyword) !== '') {
                                filterLists(keyword);
                            } else {
                                populateLists(allLists);
                            }
                    }
                });

                // Master key binding for which extension will be enabled
                function showNavigator() {
                    console.log('>> Wunderlist Navigator shortcut clicked');
                    $(Config.LIST_SWITCHER).show();
                    $(Config.LIST_INPUT).focus();
                    var lists = [];
                    $(Config.LIST_LINKS).each(function (index, element) {
                        var list = {};
                        var $this = $(this);
                        list.href = $this.attr('href');
                        list.title = $this.find('.title').text();
                        lists.push(list);
                    });
                    allLists = lists;
                    populateLists(lists);
                }

                chrome.runtime.onMessage.addListener(
                    function(request, sender, sendResponse) {
                        console.log('got message');
                        if( request.message === 'open-wunderlist-navigator' ) {
                            if($(Config.LIST_SWITCHER).length === 0) {
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
        wunderlistNavigator.loadExtension('body');
    });

}());
