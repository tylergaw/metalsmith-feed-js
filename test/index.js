'use strict';

const test = require('tape');
const metalsmith = require('metalsmith');
const collections = require('metalsmith-collections');
const tags = require('metalsmith-tags');
const feed = require('../metalsmith-feed');
const parseString = require('xml2js').parseString

const metadata = {
  site: {
    title: 'Example',
    url: 'http://www.example.org',
    author: 'Philodemus'
  }
}

test('it renders rss feed', (t) => {
  metalsmith('test/fixtures')
    .metadata(metadata)
    .use(collections({
      posts: '*.html'
    }))
    .use(feed({
      collection: 'posts'
    }))
    .build((err, files) => {
      t.ok(!err, 'should be no error building')

      parseString(files['rss.xml'].contents, (err, result) => {
        t.ok(!err, 'should be no error on parsing rss')
        t.ok(result, 'there should be some rss content')

        t.equal(result['rss']['$']['xmlns:atom'], 'http://www.w3.org/2005/Atom')

        const channel = result['rss']['channel'][0];
        t.equal(channel.title[0], metadata.site.title);
        t.equal(channel.author[0], metadata.site.author);
        t.equal(channel.item.length, 1);

        const post = channel.item[0];
        t.equal(post.title[0], 'Theory of Juice');
        t.equal(post.description[0], '<p>juice appeal</p>\n');

        t.end();
      })
    })
})

test('it complains if no tags or collections', (t) => {
  metalsmith('test/fixtures')
    .metadata(metadata)
    .use(feed({
      collection: 'posts'
    }))
    .build((err, files) => {
      t.equal(err.message, 'no collections or tags configured - see metalsmith-collections or metalsmith-tags', 'no collections or tags configured - see metalsmith-collections or metalsmith-tags');
      t.end();
    })
})

test('it complains with not site.url', (t) => {
  delete metadata.site.url;
  metalsmith('test/fixtures')
    .metadata(metadata)
    .use(collections({
      posts: '*.html'
    }))
    .use(feed({
      collection: 'posts'
    }))
    .build((err, files) => {
      t.equal(err.message, 'either site_url or metadata.site.url must be configured', 'either site_url or metadata.site.url must be configured');
      t.end();
    })
})
