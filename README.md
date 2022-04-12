# websoc-fuzzy-search

A proof of concept fuzzy search using cached WebSOC data.

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
The `Response` object is guaranteed to contain exactly three fields.

| Field | Type | Notes |
| :-: | :-: | :-: |
| `type` | `string` | One of `['GE_CATEGORY', 'DEPARTMENT', 'COURSE', 'INSTRUCTOR']` |
| `name` | `string` | |
| `metadata` | `Object` | May contain any number of other fields
