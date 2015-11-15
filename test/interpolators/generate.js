'use strict';

['nearest', 'bilinear', 'bicubic', 'vsqbs', 'lbb', 'nohalo'].forEach(function(interpolator) {
  require('../../')('21978966091_b421afe866_o.jpg')
    .resize(480, 320)
    .interpolateWith(interpolator)
    .quality(95)
    .toFile(interpolator + '.jpg', function(err) {
      if (err) throw err;
    });
});
