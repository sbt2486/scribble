(function($) {
//@todo make the canvas class configurable in the UI and it add as var to JS settings
//@todo make the filename dynamic and save it in the form as hidden element, adapt filename 'scribble.png' here accordingly
  /**
   * Behavior for scribble module.
   */
  Drupal.behaviors.createBlackboard = {};
  Drupal.behaviors.createBlackboard.attach = function (context, settings) {

    var drag_img_offset_x;
    var drag_img_offset_y;
    // @todo get this from the server
    var canvas_height = 199;
    var canvas_width = 930;
    var current_file = Drupal.settings.scribble.newestScribble;
    var brush_map = {
      'line': LineBrush,
      'cross': CrossBrush,
      'basic': BasicBrush
    };
    var $draw_canvas = $('.scribble-canvas');
    var $add_img_container = $('.scribble-add-img-container');
    var $save_btn = $('.scribble-save');
    var $size_display = $('.scribble-brush-size-display');
    var $add_img;
    var unchanged = true;
    var img_dialog_width = 0;
    var add_img_height;
    var add_img_width;

    // Initialize the toolbar
    $('.scribble-save').button({
      icons: {
        primary: "ui-icon-disk"
      }
    });
    $('.scribble-add').button({
      icons: {
        primary: "ui-icon-image"
      }
    });
    $('.scribble-clear').button({
      icons: {
        primary: "ui-icon-trash"
      }
    });
    $('.scribble-color-btn')
      .button({
        icons: {
          primary: "ui-icon-pencil"
        }
      })
      .click(function () {
        $('.scribble-color-picker').dialog('open');
      });
    $('.scribble-brushes').buttonset();

    if (current_file != '') {
      // Load the newest image.
      var options = {
        backgroundImage: Drupal.settings.scribble.bgImagePath + '/' + current_file
      };
    }
    // Initialize drawing canvas.
    $draw_canvas.jqScribble(options);

    // Add the color picker.
    $('.scribble-color-picker')
      .farbtastic(function (color) {
        var rgb = hexToRgb(color);
        rgb_string = 'rgb(' + rgb.join(',') + ')';
        $draw_canvas.data("jqScribble").update({brushColor: rgb_string});
        $('.scribble-color-display').css('background-color', color);
      })
      .dialog({
        draggable: true,
        title: Drupal.t('Choose your color'),
        autoOpen: false,
        resizable: false,
        width: 220,
        hide: "explode"
      });

    // Initialize brush size slider.
    options = {
      stop: function (event, ui) {
        $draw_canvas.data("jqScribble").update({brushSize: ui.value});
      },
      slide: function (event, ui) {
        $size_display.text(ui.value);
      },
      min: 1
    };
    $('.scribble-brush-size').slider(options);
    $size_display.text(1);

    // Helper to convert hex to rgb codes.
    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.toString());
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : null;
    }

    // Enable saving after only after first click.
    $draw_canvas.click(function () {
      unchanged = false;
    });

    // Register the handler for the save action.
    $save_btn.click(function () {
      if (!unchanged) {
        $draw_canvas.data("jqScribble").save(function (imageData) {
          if(confirm(Drupal.t('You\'re about to save ur changes. Is that cool with you?')) && !$draw_canvas.data('jqScribble').blank) {
            $.post(Drupal.settings.scribble.saveURL, {imagedata: imageData}, function(response) {
              var options = {
                backgroundImage: Drupal.settings.scribble.bgImagePath + '/' + response.file_name
              };
              $draw_canvas.data('jqScribble').update(options);
              current_file = response.file_name;
            });
          }
        });
      }
    });

    // Register brush handlers
    $('.scribble-brushes input').click(function () {
      // Update the scribble to use the selected brush, the buttons id attribute
      // is the JS brush class name.
      $draw_canvas.data("jqScribble").update({brush: eval($(this).attr('id'))});
    });

    // Reset to last saved background image.
    $('.scribble-clear').click(function () {
      var options = {
        backgroundImage: Drupal.settings.scribble.bgImagePath + '/' + current_file
      };
      $draw_canvas.data('jqScribble').update(options);
      unchanged = true;
    });

    // Handle image add action.
    $('.scribble-add').click(function () {
      var img_src = $('#img-src-txt').val();
      if(img_src !== '') {
        validatedImageLoad(img_src);
      }
      else {
        $('#img-src-txt').addClass('ui-state-error');
      }
    });

    function validatedImageLoad(URL) {
      var $load_img = $(new Image());
      $load_img.error(function() {
        $('#img-src-txt').addClass('ui-state-error');
        success = false;
      })
      .load(function() {
        loadAddImageDialog($(this));
      });
      $load_img.attr('src', URL);
    }

    function loadAddImageDialog($img) {
      $img.addClass('scribble-add-img');
      $add_img_container.html($img);
      $('#img-src-txt').removeClass('ui-state-error');
      img_dialog_width = (img_dialog_width != 0) ? img_dialog_width: $img.width();
      $add_img_container.dialog({
        draggable: true,
        title: Drupal.t('Drag the image on the blackboard in order to add it.'),
        autoOpen: false,
        resizable: false,
        width: img_dialog_width,
        hide: "explode"
      });
      var options = {
        stop: addImgDropHandler,
        start: function (event, ui) {
          // Set the image to be added in var to use it in the drop handler.
          $add_img = $('.scribble-add-img');
          // Set vars for mouse offset left upper corner of the image.
          drag_img_offset_x = event.pageX - $add_img.offset().left;
          drag_img_offset_y = event.pageY - $add_img.offset().top;
          add_img_width = $add_img.width();
          add_img_height = $add_img.height();
          $add_img_container.dialog('close');
        },
        revert: true,
        helper: 'clone',
        appendTo: 'body',
        scroll: false,
        zIndex: 1500
      };
      $img.draggable(options);
      $add_img_container.dialog('open');
    }

    // Fires once the dragged image is dropped on the draw canvas.
    function addImgDropHandler(event, ui) {
      if (droppedOnCanvas(event.pageX, event.pageY)) {
        // Gather data for image merge.
        var x = event.pageX - $draw_canvas.offset().left - drag_img_offset_x;
        var y = event.pageY - $draw_canvas.offset().top - drag_img_offset_y;
        var data = {
          img_url: $add_img.attr('src'),
          img_width: add_img_width,
          img_height: add_img_height,
          dst_x: x,
          dst_y: y
        };
        if (current_file == '') {
          data.canvas_width = canvas_width;
          data.canvas_height = canvas_height;
        }
        // Do AJAX post that merges the images and saves a new image.
        $.post(Drupal.settings.scribble.addURL, data, function(response) {
          var options = {
            backgroundImage: Drupal.settings.scribble.bgImagePath + '/' + response.file_name
          };
          $draw_canvas.data('jqScribble').update(options);
          // Store the latest filename.
          current_file = response.file_name;
        });
      }
    }

    // Helper function to check if image was dropped within the canvas.
    function droppedOnCanvas(x, y) {
      $canvas = $draw_canvas;
      var border_left = $canvas.offset().left;
      var border_top = $canvas.offset().top;
      var border_right = $canvas.offset().left + $canvas.width();
      var border_bottom = $canvas.offset().top + $canvas.height();
      if (x > border_left && x < border_right && y > border_top && y < border_bottom) {
        return true;
      }
      return false;
    }
  }

})(jQuery);
