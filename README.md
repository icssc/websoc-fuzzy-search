# websoc-fuzzy-search

A proof of concept fuzzy search using cached WebSOC data.

## Installation

`$ npm install --save websoc-fuzzy-search`

## Documentation

### `CourseLevel`
`CourseLevel` represents the level of a course, and is an integer literal that holds one of the three following values.

|  Literal Value  |                   Meaning                   |
|:---------------:|:-------------------------------------------:|
|       `0`       |        Lower Division courses (1-99)        |
|       `1`       |      Upper Division courses (100-199)       |
|       `2`       |  Graduate/Professional Only courses (200+)  |

### `ResultType`
`ResultType` represents a type of `SearchResult`, and is a string literal that holds one of the four following values.
The internal value is used to sort the final response.

|  Literal Value  |  Internal Value  |
|:---------------:|:----------------:|
|  `GE_CATEGORY`  |       `4`        |
|  `DEPARTMENT`   |       `3`        |
|    `COURSE`     |       `2`        |
|  `INSTRUCTOR`   |       `1`        |

### `Metadata`
`Metadata` represents any additional attributes that may be relevant to its parent `SearchResult`. It is a mapping of
`string`s to other `string`s or `string` arrays.

### `FilterOptions`
`FilterOptions` represents any desired `Metadata` attributes in the final result(s). It has four possible fields, all of
which are optional.

A list of acceptable values for all fields (except `courseLevel`, since it only has three valid values) can be found in
the source data [here](https://github.com/icssc/wfs-scripts/tree/main/sources).

|     Field     |       Type       |                      Description                       |
|:-------------:|:----------------:|:------------------------------------------------------:|
| `courseLevel` | `CourseLevel[]`  |      The course level(s) to match. (Courses only)      |
| `department`  |    `string[]`    | The department(s) to match. (Courses and Instructors)  |
|   `geList`    |    `string[]`    |     The GE categor(y/ies) to match. (Courses only)     |
|   `school`    |    `string[]`    |   The school(s) to match. (Courses and Instructors)    |

### `SearchParams`
`SearchParams` represents the parameters for which to search. It has four possible fields, all of which are optional.

|      Field      |      Type       |                      Description                      |
|:---------------:|:---------------:|:-----------------------------------------------------:|
|     `query`     |    `string`     |                   The search query.                   |
|  `numResults`   |    `number`     |       The maximum number of results to return.        |
|  `resultType`   |  `ResultType`   |      Which type of result to return exclusively.      |
| `filterOptions` | `FilterOptions` | Any `Metadata` attributes the result(s) must possess. |

### `SearchResult`
`SearchResult` represents a single object matched by the fuzzy search process, and is guaranteed to contain exactly
three fields.

|   Field    |     Type     |                 Description                  |
|:----------:|:------------:|:--------------------------------------------:|
|   `type`   | `ResultType` |       The type of the result matched.        |
|   `name`   |   `string`   | The descriptive name of the result matched.  |
| `metadata` |  `Metadata`  | Any metadata relevant to the result matched. |

### `search(params?: SearchParams): Record<string, SearchResult>`
Performs a fuzzy-search query based on the parameters given.

Returns a mapping of unique string identifiers to `SearchResult` objects, the details of which are listed above.
