# websoc-fuzzy-search

A proof of concept fuzzy search using cached WebSOC data from <https://github.com/icssc/peterportal-public-api/tree/master/cache>.

## Setup

First, install all dependencies with `npm install`.

To populate the index, run `npm run setup`. If the relevant files are not available in `cache/`, they will be downloaded from the link mentioned above. If they exist and are valid JSON files, local data will be used instead.

## Execution

A simple REPL-alike script is available for basic interactive testing. Simply run `npm run driver` to activate it.

Alternatively, if you wish to use the Node.js REPL for more complex operations, run the following after opening a Node shell:
```js
> const search = require('.');
> search.init();
```

Ensure that the index file (`src/index.json`) exists, otherwise `search.init()` will fail.
