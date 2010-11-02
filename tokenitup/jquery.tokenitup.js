/*
 * jquery-tokenitup
 * @requires jQuery v1.4.2 or later, and jQuery-ui 1.8 or later
 *
 * Author: Julien Phalip (http://julienphalip.com)
 *
 * Licensed under the MIT:
 *   http://www.opensource.org/licenses/mit-license.php
 */


(function($) {
    //TODO: rename to something cooler
    // Helper function for highlighting autocomplete result matches
    $.highlight_term = function (term, text){
        var matcher = new RegExp(term, "i");
        if (!term || matcher.test(text)) {
            return text.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + $.ui.autocomplete.escapeRegex(term) + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
        }
        else {
            return text;
        }
    }
})(jQuery);




//TODO: Option for removing duplicates
//TODO: Button for reseting initial data

(function($){
    var Plugin = function(element, settings) {
        var $element = $(element);
        var self = this;

        // Merge settings with default options ------------------------------
        var options = $.extend({
            initialData: [],
            helpText: undefined,
            allowInput: true,
            allowRemoveAll: false,
            useAutocomplete: false,
            loadFromTextField: false, //TODO: Maybe rename this option to something more accurate or meaningful.
            separator: ",",
            sortable: false,
            teaseInputText: "",
            emptyMessage: "(Nothing selected)",
            addLabel: "Add",
            removeTooltipText: "Remove",
            removeLabel: "x",
            removeAllLabel: "Remove All",
            maximumItems: -1,
            processOneResultItem: function(term, resultItem) {
                // Highlight term by default
                return {
                    label: $.highlight_term(term, resultItem),
                    value: resultItem
                };
            },
            postProcessField: undefined
        }, settings || {});



        // Public methods ----------------------------------------------------
        self.clearInputField = function() {
            $inputField.val('');
        };

        self.addItem = function(label, actual_value, animate) {
            if (typeof(actual_value) == 'string' && $.trim(actual_value) == '') // Do not allow tokens that are empty or containing just spaces
                return;
            
            var $newItem = $("<li class='tokenitup-item'><span class='tokenitup-item-label'>" + label + "</span></li>");
            var $removeButton = $("<button type='button' title='" + options.removeTooltipText + "' class='tokenitup-item-remove'>" + options.removeLabel + "</button>");
            $newItem.append($removeButton);
            $removeButton.click(function(){
                $newItem.remove();
                _refreshActualField();
            });
            
            if (options.maximumItems > 0 && $selectedItems.children().length == options.maximumItems) {
                $selectedItems.children().first().remove();
            }
            
            if (animate) {
                $selectedItems.append($newItem.fadeIn('slow'));
            }
            else {
                $selectedItems.append($newItem);
            }
            $newItem.data("actual_value", actual_value);
            return $newItem;
        };

        // Private methods ---------------------------------------------------
        var _refreshActualField = function() {
            var field_value = "";
            $selectedItems.children().each(function() {
                var actual_value = $(this).data("actual_value");
                field_value = field_value + options.separator + actual_value;
            });
            field_value = field_value.substr(1, field_value.length); // Remove last separator
            $actualField.val(field_value);
            if (options.allowRemoveAll) {
                // Show "Remove All" button only if there are selected items
                $removeAllButton.toggle(field_value != "");
            }

            $selectedItems.toggle(field_value != "");
            $emptyMessage.toggle(field_value == "");
            
            if (options.postProcessField) {
                options.postProcessField($actualField);
            }
        };

        // Constructor -------------------------------------------------------

        var $firstObject; // Pointer used for placing other objects.

        // Field for typing stuff
        if (options.allowInput) {
            var $inputField = $("<input type='text' class='tokenitup-input' />"); // Text field used for typing
            if (options.teaseInputText) {
                $inputField.val(options.teaseInputText);
                $inputField.addClass('tokenitup-input-inactive');
                $inputField.focus(function(){
                    $inputField.addClass('tokenitup-input-active');
                    $inputField.removeClass('tokenitup-input-inactive');
                    if (!$inputField.data('touched')) {
                        $inputField.val('');
                    }
                });
                $inputField.blur(function(){
                    if ($inputField.val() == '') {
                        $inputField.removeClass('tokenitup-input-active');
                        $inputField.addClass('tokenitup-input-inactive');
                        $inputField.val(options.teaseInputText);
                        $inputField.data('touched', false);
                    }
                    else {
                        $inputField.data('touched', true);
                    }
                });
            }
            if (options.allowAdd) {
                $inputField.keypress(function(event) {
                    if (event.keyCode == '13') {
                        event.preventDefault(); // Prevent the form from getting submitted if the 'enter' key is pressed.
                        $addButton.trigger('click'); // Trigger the button to add the entered token.
                    }
                });
            }
            $element.after($inputField);
            $firstObject = $inputField;
        }
        else {
            $firstObject = $element;
        }

        // List of tokens
        var $selectedItems = $("<ul class='tokenitup-list'></ul>");
        if (options.sortable) {
            $selectedItems.sortable({
                stop: function(event, ui) {
                    _refreshActualField();
                }
            });
        }

        var $emptyMessage = $("<p class='tokenitup-empty'>" + options.emptyMessage + "</p>");

        //var $actualField = $("<input type='hidden' />"); // Actual field sent with the form
        //$actualField.attr('name', $element.attr('name')); // Swap name attribute from original field to hidden field
        //$element.removeAttr('name'); // Remove name attribute so the field doesn't get sent with the form
        //$element.hide();
        var $actualField = $element; //TODO: get rid of that $actualField variable.
        $actualField.addClass("tokenitup-actual-input").hide();
        $firstObject.after($selectedItems, $emptyMessage, $actualField);

        // Initialise "Remove All" button
        var $removeAllButton;
        if (options.allowRemoveAll) {
            $removeAllButton = $("<button type='button' title='Remove All' class='tokenitup-remove-all'>" + options.removeAllLabel + "</button>");
            $removeAllButton.click(function(){
                $selectedItems.empty();
                _refreshActualField();
            });
            $firstObject.after($removeAllButton);
            $removeAllButton.wrap($("<p></p>"));
        }

        // Initialise help text
        if (options.helpText != undefined) {
            $firstObject.after("<p class='tokenitup-help-text'>" + options.helpText + "</p>");
        }

        // Initilise "Add" button
        if (options.allowAdd && options.allowInput) {
            var $addButton = $("<button type='button' title='Add' class='tokenitup-add'>" + options.addLabel + "</button>");
            $inputField.after($addButton);
            $addButton.click(function() {
                var values = $inputField.val().split(options.separator);
                if (values.length == 0) {
                    values[0] = $inputField.val();
                }

                for (var i=0; i < values.length; i++) {
                    if (values[i] != "") self.addItem(values[i], values[i], true);
                }

                _refreshActualField();
                if (options.allowInput) self.clearInputField();
            });
        }

        // Fill in initial data
        if (options.loadFromTextField && $element.val() != "") {
            var values = $element.val().split(options.separator);
            for (var i=0; i < values.length; i++) {
                self.addItem(values[i], values[i]);
            }
            if (options.allowInput) self.clearInputField();
        }
        else if (options.initialData.length > 0) {
            for (var i=0; i < options.initialData.length; i++) {
                if ((typeof options.initialData[i]) == "string") {
                    self.addItem(options.initialData[i], options.initialData[i]);
                }
                else {
                    self.addItem(options.initialData[i].label, options.initialData[i].actual_value);
                }
            }
        }

        // Initialise autocomplete
        if (options.useAutocomplete && options.allowInput) {
            
            var autocompleteOptions = $.extend(true, {}, options.autocompleteOptions || {});
            if (options.allowAdd) { // Make autocomplete work if multiple values are entered
                autocompleteOptions = $.extend(autocompleteOptions, {
                    source: function(request, response) {
                        // Delegate back to autocomplete, but first extract the last term.
                        var last_term = $.trim(request.term.split(options.separator).pop());
                        
                        if (last_term == "") {
                            // Do not search if the last term is empty or contains just spaces.
                            response([]);
                        }
                        else {
                            var source = options.autocompleteOptions.source;
                            if ($.isFunction(source)) {
                                request.term = last_term;
                                source(request, response);
                            }
                            else {
                                var processed_source = [];
                                for (var i=0; i < source.length; i++) {
                                    processed_source[i] = options.processOneResultItem(last_term, source[i]);
                                }
                                response($.ui.autocomplete.filter(processed_source, last_term));
                            }
                        }
                    },
                    focus: function() { //TODO: What if we override options.autocompleteOptions.focus?
                        // Prevent value inserted on focus
                        return false;
                    },
                    select: function(event, ui) { //TODO: What if we override options.autocompleteOptions.select?
                        var terms = this.value.split(options.separator);
                        // Remove the current input
                        terms.pop();
                        // Add the selected item
                        terms.push( ui.item.value );
                        // Add placeholder to get the comma-and-space at the end
                        terms.push("");
                        var separator = options.separator;
                        if ($.trim(separator) != ' ') {
                            separator += ' ';
                        }
                        this.value = terms.join(separator);
                        return false;
                    }
                });
            }
            $inputField.autocomplete(autocompleteOptions);
            
            
            $inputField.bind("autocompleteselect", function(event, ui) {
                if (!options.allowAdd) {
                    // Auto add when item is selected
                    var value = ui.item.actual_value ? ui.item.actual_value: ui.item.value;
                    self.addItem(ui.item.label, value, true);
                    _refreshActualField();
                    if (options.allowInput) self.clearInputField();
                }
                return false;
            });
        }

        // Initial refresh
        _refreshActualField();
    };


    // Plugin initialisation
    $.fn.tokenItUp = function(settings) {
        return this.each(function() {
            var $element = $(this);

            if (!$element.data('tokenItUp-instance')) {
                $element.data('tokenItUp-instance', new Plugin(this, settings));
            }

            return this;
       });
    };
})(jQuery);




















(function($){
    var Plugin = function(element, settings) {
        var $element = $(element);

        // Merge settings with default options ------------------------------
        var options = $.extend({
            searchURL: undefined,
            tokenItUpOptions: {}
        }, settings || {});

        // Constructor ------------------------------------------------------

        var tokenItUpOptions = $.extend({
            allowRemoveAll: true,
            allowAdd: false,
            loadFromTextField: false,
            separator: ",",
            useAutocomplete: true,
            autocompleteOptions: {
                minLength: 2,
                delay: 500,
                source: function(request, response) {
                    $.getJSON(options.searchURL, $.extend({ term: request.term }, options.extraParams || {}), function(data) {
                        var result = [];
                        for (var i=0; i < data.length; i++) {
                            result[i] = options.processOneResultItem(request.term, data[i]);
                        }
                        response(result);
                    });
                }
            }
        }, options.tokenItUpOptions || {});

        if ($element.val() != "") {
            var $loading = $("<div class='tokenitup-loading'></div>");
            $element.after($loading);
            $.getJSON(options.byIDsURL, { ids: $element.val() }, function(data) {
                var result = [];
                for (var i=0; i < data.length; i++) {
                    result[i] = options.processOneResultItem("", data[i]);
                }
                tokenItUpOptions.initialData = result;
                $element.tokenItUp(tokenItUpOptions);
                $loading.remove();
            });
        }
        else {
            $element.tokenItUp(tokenItUpOptions);
        }

        // Hide the magnifying glass icon that comes with Django's raw id widget.
        $('#lookup_' + element.id).hide();
    };

    // Plugin initialisation
    $.fn.superRawIDWidget = function(settings) {
        return this.each(function() {
            var $element = $(this);

            if (!$element.data('superRawIDWidget-instance')) {
                $element.data('superRawIDWidget-instance', new Plugin(this, settings));
            }

            return this;
       });
    };
})(jQuery);
