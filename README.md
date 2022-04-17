# websoc-fuzzy-search

A proof of concept fuzzy search using cached WebSOC data.

## Installation

`$ npm install --save websoc-fuzzy-search`

## Documentation

### `ResultType`
`ResultType` represents a type of `SearchResult`, and is a string literal that holds one of the four following values. The internal value is used to sort the final response.
| Literal Value | Internal Value
| :-: | :-: |
| `GE_CATEGORY` | `4` |
| `DEPARTMENT` | `3` |
| `COURSE` | `2` |
| `INSTRUCTOR` | `1` |

### `Metadata`
`Metadata` represents any additional attributes that may be relevant to its parent `SearchResult`. It is a mapping of `string`s to other `string`s or `string` arrays.

### `SearchResult`
`SearchResult` represents a single object matched by the fuzzy search process, and is guaranteed to contain exactly three fields.

| Field | Type |
| :-: | :-: |
| `type` | `ResultType` |
| `name` | `string` |
| `metadata` | `Metadata` |

### `search(query, numResults = 10, mask = []): Record<string, SearchResult>`
Performs a fuzzy-search query and returns at most the given number of results, ignoring those which match the type(s) given.

Returns a mapping of unique string identifiers to `SearchResult` objects, the details of which are listed above.
#### `query: string`
The query to fuzzy-search on. Note that each of its keywords must be at least 2 characters in length.

#### `numResults: number`
The maximum number of results to return.

#### `mask: ResultType[]`
What types of results to exclude from the final response.
