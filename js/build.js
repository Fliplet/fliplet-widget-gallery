Fliplet.Widget.instance('image-gallery', function (data) {
  var $container = $(this);
  var photoswipeTemplate = Fliplet.Widget.Templates['templates.photoswipe'];
  var wallSelector = '[data-image-gallery-id=' + data.id + '] .wall:not("[data-mce-bogus] [data-image-gallery-id=' + data.id + '] .wall")';

  function initGallery() {
    var $wall = $(wallSelector);
    var $bricks = $();

    // Update remote image URLs to authenticated URLs
    _.forEach(data.images, function (image, index) {
      if (image.url === Fliplet.Media.authenticate(image.url)) {
        return;
      }

      _.set(data, ['images', index, 'url'], Fliplet.Media.authenticate(image.url));
    });

    _.forEach(data.images, function (image) {
      var $img = $('<img />');

      $img.on('load', function() {
        $(window).resize();
      });
      $img.attr('src', image.url);
      $img.attr('alt', image.title);

      var $brick = $('<div class="brick"></div>');

      $brick.append($img);
      $bricks = $bricks.add($brick);
    });
    $wall.append($bricks);

    var wall = new Freewall(wallSelector);

    wall.reset({
      selector: '.brick',
      animate: false,
      cellW: function() {
        var width = $('body').width();
        return width >= 640 ? 200 : 135;
      },
      cellH: 'auto',
      gutterX: 10,
      gutterY: 10,
      onResize: function() {
        wall.fitWidth();
        wall.refresh();
      },
      onComplete: function () {
        $container.addClass('freewall-ready');
      }
    });

    if (!Fliplet.Env.get('interact')) {
      $container.on('click', '.brick img', function() {
        var $clickedBrick = $(this)[0].parentElement;

        data.options = data.options || {};
        data.options.index = $clickedBrick.index - 1;

        var gallery = Fliplet.Navigate.previewImages(data);

        gallery.listen('afterChange', function(context) {
          Fliplet.Page.Context.update({
            galleryId: data.id,
            galleryOpenIndex: this.getCurrentIndex()
          });
        });

        gallery.listen('close', function() {
          Fliplet.Page.Context.remove(['galleryId', 'galleryOpenIndex']);
        });
      });
    }

    wall.fitWidth();
    parseQueries();

    return wall;
  }

  function parseQueries() {
    var query = Fliplet.Navigate.query;

    if (!query.galleryOpenIndex) {
      return;
    }

    if (query.galleryId && query.galleryId != data.id) {
      return;
    }

    if (query.galleryId) {
      $(wallSelector + ' .brick:eq(' + query.galleryOpenIndex + ') img').click();
      return;
    }

    $('[data-image-gallery-id] .wall:not("[data-mce-bogus] [data-image-gallery-id] .wall") .brick:eq(' + query.galleryOpenIndex + ') img').click();
  }

  // Appearance change Hook
  Fliplet.Hooks.on('appearanceChanged', function () {
    initGallery();
  });

  Fliplet().then(function () {
    initGallery();
  });
});
