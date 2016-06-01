'use strict';

const RSS = require('rss');
const extend = require('extend');
const url = require('url');

const feed = (opts) => {
  const options = opts || {};

  const limit = options.limit || 20;
  const destination = options.destination || 'rss.xml';
  const collectionName = options.collection;
  const tagName = options.tag;
  const tagHandle = options.handle || 'tags';
  const metadataKey = options.metadataKey || 'feeds';
  const itemDataHandlers = options.itemDataHandlers || null;

  if (!collectionName && !tagName) {
    throw new Error('collection or tag option is required');
  }

  return (files, metalsmith, done) => {
    var tag, _ref;

    let collection = null;
    let metadata = metalsmith.metadata();
    metadata[metadataKey] = metadata[metadataKey] || [];

    if (!metadata.collections && !metadata.tags) {
      return done(
        new Error('no collections or tags configured - see metalsmith-collections or metalsmith-tags')
      );
    }

    if (collectionName) {
      collection = metadata.collections[collectionName];
    }

    if (tagName) {
      collection = metadata[tagHandle][tagName];
    }

    const feedOptions = extend({}, metadata.site, options, {
      site_url: (_ref = metadata.site) != null ? _ref.url : void 0,
      generator: 'metalsmith-feed'
    });

    const siteUrl = feedOptions.site_url;

    if (!siteUrl) {
      return done(
        new Error('either site_url or metadata.site.url must be configured')
      );
    }

    if (feedOptions.feed_url == null) {
      feedOptions.feed_url = url.resolve(siteUrl, destination)
    }

    let feed = new RSS(feedOptions);

    if (limit) {
      collection = collection.slice(0, limit);
    }

    for (let i = 0; i < collection.length; i += 1) {
      const file = collection[i];

      let itemData = extend({}, file, {
        description: file.less || file.excerpt || file.contents
      });

      if (!itemData.url && itemData.path) {
        itemData.url = url.resolve(siteUrl, file.path)
      }

      // This is where we allow for custom handling of certain item data.
      if (itemDataHandlers !== null) {
        Object.keys(itemDataHandlers).forEach((key) => {
          const defaultValue = feed[key] || null;
          const handler = itemDataHandlers[key];

          if (typeof handler === 'function') {
            itemData[key] = handler(file, defaultValue);
          }
        });
      }

      feed.item(itemData)
    }

    // Finally, we create the rss.xml (or provided name) file.
    files[destination] = {
      contents: new Buffer(feed.xml(), 'utf8')
    };
    
    metadata[metadataKey].push(destination);

    return done();
  }
}

module.exports = feed;
