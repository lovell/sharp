'use strict';

const fs = require('fs');
const request = require('request');
const tumblr = require('tumblr.js');

const client = tumblr.createClient({
  consumer_key: '***',
  consumer_secret: '***'
});

const fetchImages = function (offset) {
  console.log(`Fetching offset ${offset}`);
  client.posts('humanae', {
    type: 'photo',
    offset: offset
  }, function (err, response) {
    if (err) throw err;
    if (response.posts.length > 0) {
      response.posts.forEach((post) => {
        const url = post.photos[0].alt_sizes
          .filter((image) => image.width === 100)
          .map((image) => image.url)[0];
        const filename = `./images/${post.id}.jpg`;
        try {
          fs.statSync(filename);
        } catch (err) {
          if (err.code === 'ENOENT') {
            request(url).pipe(fs.createWriteStream(filename));
          }
        }
      });
      fetchImages(offset + 20);
    }
  });
};
fetchImages(0);
