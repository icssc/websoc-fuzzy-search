# websoc-fuzzy-search

A proof of concept fuzzy search using cached WebSOC data from <https://github.com/icssc/peterportal-public-api/tree/master/cache>.

## Setup

First, install all dependencies with `npm install`.

To populate the index, run `npm run setup`. If the relevant files are not available in `cache/`, they will be downloaded from the link mentioned above. If they exist and are valid JSON files, local data will be used instead.

## Execution

A simple REPL-alike script is available for basic interactive testing. Simply run `npm run driver` to execute it.

Alternatively, if you wish to use the Node.js REPL for more complex operations, run the following after opening a Node shell:
```js
> const search = require('.');
> search.init();
```

Ensure that the index file (`src/index.json`) exists, otherwise `search.init` will fail.

## Documentation

### `search.init()`

Loads the contents of the index into memory. Must be run before any calls are made to `search.search`.

### `search.search(query, numResults = 10)`
Performs a fuzzy-search query and returns at most the given number of results.

Returns a mapping of unique string identifiers to `Response` objects, the details of which are listed below.
#### `query: string`
The query to fuzzy-search on. Note that it must be at least 2 characters in length.

#### `numResults: number`
The maximum number of results to return—defaults to 10.

### `Response` object
The `Response` object is guaranteed to contain two fields: `type`, which will always be one of `['GE_CATEGORY', 'DEPARTMENT', 'COURSE', 'INSTRUCTOR']`, and `name`, the descriptive name ascribed to that object. It may additionally contain any number of other fields.
