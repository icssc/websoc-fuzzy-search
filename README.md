# websoc-fuzzy-search

A proof of concept fuzzy search using cached WebSOC data from
<https://github.com/icssc/peterportal-public-api/tree/master/cache>.

## Setup

First, install all dependencies with `npm install`.

To populate the index, run `npm run setup`. If the relevant files are not available in `cache/`, they will be downloaded
from the link mentioned above. If they exist and are valid JSON files, local data will be used instead.

Future functionality is currently under construction.
