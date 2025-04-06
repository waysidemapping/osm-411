# OSM 411

[OSM 411](https://osm411.org) is a customizable directory of links to OpenStreetMap projects. At first glance it's just a big list, but by setting custom parameters, you can create a single page that allows opening the same context in a variety of different apps.

## Guide

### URL parameters

These parameters affect the behavior of ALL links in the list.

- `#map=z/lat/lon`: Set a specific location and zoom level. Typically this refers to the map viewport.
  - Example: [osm411.org/#map=14/39.9524/-75.1636](https://osm411.org/#map=14/39.9524/-75.1636)

### Preferences

The following options are available at the bottom of the page. Your selections are saved to `localStorage` in your browser and are not sent over the network.

- `Open links in new tabs`: Have each link open in a new tab (or window, depending on your browser settings). Alternatively, you can usually right-click, control-click, or command-click to manually open links in new tabs.
- `Highlight visited links`: Add styling to opened links so you can easily keep track of which ones you've already visited. This is a built-in CSS feature and does not leak your browser history.

## Get involved

Contributions are open. If you found a bug, want to add a project link, or have another idea, feel free to [open an issue](https://github.com/quincylvania/osm-411/issues/new). Please [browse existing issues](https://github.com/quincylvania/osm-411/issues) first to see if someone already posted yours. If an issue has the go-ahead, or if your change is trivial, we welcome you to [open a pull request](https://github.com/quincylvania/osm-411/compare).

### Link guidelines

Not all projects are suitable for inclusion in OSM 411. We follow these general guidelines: The app should be…
- Useful to the OSM community.
- Kept reasonably up-to-date with the latest OSM data.
- Configurable with URL parameters.
- Publicly accessible without login (except via osm.org).

### Development setup
1. [Clone the repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
2. Open your terminal and `cd` into the repo's directory
3. Run `npm run serve` to start the development server
4. Visit [http://localhost:411](http://localhost:411) in your browser
5. That's it!

### Code of conduct

Be kind or be elsewhere :)

## FAQ

### Why "411"?

[4-1-1](https://en.wikipedia.org/wiki/411_(telephone_number)) has historically been the directory assistance phone number in the US and Canada. If you don't live in these countries, or you were born after 1995, you probably have no idea what this is. Basically, "what's the 411" means "give me the info".

### Why are commercial projects included?

Commercial projects are major consumers of OpenStreetMap data. Mappers may want to add data specifically to see it appear in a specific app, even if it's closed-source or for-profit. Thus, it's useful to include commercial apps to compare how they're handling OSM data. Further, many companies and small businesses contribute tools, data, and resources back to the OSM community that are useful to mappers outside of a commercial context.

## License 

OSM 411 uses the MIT license. See [LICENSE](/LICENSE).
