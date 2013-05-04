(function($) {

  /**
   * Behavior for scribble module.
   */
  Drupal.behaviors.createBlackboard = {}
  Drupal.behaviors.createBlackboard.attach = function (context, settings) {

    var options = {
      backgroundImage: Drupal.settings.scribble.bgImagePath + '/index.png'
    };
    $('.scribble-canvas').jqScribble(options);

    $('.scribble-save').click(function () {
      $(".scribble-canvas").data("jqScribble").save(function (imageData) {
        if(confirm("You're about to save ur changes. Is that cool with you?")) {
          $.post(Drupal.settings.scribble.saveURL, {imagedata: imageData}, function(response) {
            // @todo print some message and reload the canvas with the new backgroundimage
            console.log('RETURND FROM AJAX');
          });
        }
      });
      return FALSE;
    });
  }

})(jQuery);
