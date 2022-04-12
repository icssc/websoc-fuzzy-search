# websoc-fuzzy-search

A proof of concept fuzzy search using cached WebSOC data.

## Installation

`$ npm install --save websoc-fuzzy-search`

## Documentation

### `TypeLiteral` object
The `TypeLiteral` object is a string literal that holds one of the four following values. The internal value is used to sort the final response.
| Literal Value | Internal Value
| :-: | :-: |
| `GE_CATEGORY` | `4` |
| `DEPARTMENT` | `3` |
| `COURSE` | `2` |
| `INSTRUCTOR` | `1` |


### `Response` object
The `Response` object represents a single object matched by the fuzzy search process, and is guaranteed to contain exactly three fields.

| Field | Type | Notes |
| :-: | :-: | :-: |
| `type` | `Type` | |
| `name` | `string` | |
| `metadata` | `Object` | May contain any number of other fields

### `search.init() : void`

Loads the contents of the index into memory. Must be run before any calls are made to `search.search`.

### `search.search(query, numResults = 10, mask = []) : Map<string, Response>`
Performs a fuzzy-search query and returns at most the given number of results.

Returns an `Object` which contains a mapping of unique string identifiers to `Response` objects, the details of which are listed above.
#### `query: string`
The query to fuzzy-search on. Note that each of its keywords must be at least 2 characters in length.

#### `numResults: number`
The maximum number of results to return.

#### `mask: Array<TypeLiteral>`
What types of results to exclude from the final response.
