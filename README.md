# Annotorious Selector Pack

Additional selection tools for Annotorious and the Annotorious OpenSeadragon plugin.

- Circle
- Ellipse
- Freehand

## Using

Include the plugin in your page directl from the CDN:

```html
<html>
  <head>
    <!-- Annotorious first -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@recogito/annotorious@latest/dist/annotorious.min.css">
    <script src="https://cdn.jsdelivr.net/npm/@recogito/annotorious@latest/dist/annotorious.min.js"></script>

    <!-- Tilted box plugin -->
    <script src="https://cdn.jsdelivr.net/npm/@recogito/annotorious-selector-pack@latest/dist/annotorious-selector-pack.min.js"></script>
  </head>

  <body>
    <img id="hallstatt" src="640px-Hallstatt.jpg">
    <script>
      window.onload = function() {
        // Init Annotorious
        var anno = Annotorious.init({
          image: 'hallstatt'
        });

        // Init the plugin
        Annotorious.SelectorPack(anno);

        // [ 'rect', 'polygon', 'circle', 'ellipse', 'freehand' ]
        console.log(anno.listDrawingTools());

        anno.setDrawingTool('ellipse');
      }
    </script>
  </body>
</html>
```

## Development

To run in development mode:

```sh
$ npm install
$ npm start
```
