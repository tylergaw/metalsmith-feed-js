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
};

test('it renders rss feed', (t) => {
  metalsmith('test/fixtures')
    .metadata(metadata)
    .use(collections({
      posts: '*.html'
    }))
    .use(feed({
      collection: 'posts',
      itemDataHandlers: {
        author: (file, defaultValue) => {
          const author = file.author;

          if (!author) {
            return defaultValue;
          }

          if (typeof author === 'string') {
            return author;
          } else {
            return author.name;
          }
        }
      }
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
        t.equal(channel.item.length, 3);

        const post1 = channel.item[0];
        t.equal(post1.title[0], 'Theory of Juice');
        t.equal(post1.description[0], '<p>juice appeal</p>\n');
        t.equal(post1['dc:creator'][0], 'Joe Mosely');

        // Test custom itemDataHandlers with a nested author value
        const post2 = channel.item[1];
        t.equal(post2.title[0], 'My Second Post');
        t.equal(post2.description[0], '<p>She don\'t like her boring job, no!</p>\n');
        t.equal(post2['dc:creator'][0], 'Janie Jones');

        // Test default author
        const post3 = channel.item[2];
        t.equal(post3.title[0], 'All The Defaults');
        t.equal(post3.description[0], '<p>Test for defaults</p>\n');
        t.equal(post3['dc:creator'][0], metadata.site.author);

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
