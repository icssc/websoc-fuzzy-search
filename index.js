// configuration
// path to the index
const indexURL = 'https://raw.githubusercontent.com/icssc/websoc-fuzzy-search/main/index.json';

// imports
import fetch from 'cross-fetch';

// constants
// mapping of types to numbers for compare
const types = {
    GE_CATEGORY: 4,
    DEPARTMENT: 3,
    COURSE: 2,
    INSTRUCTOR: 1,
};

let index;
let initialized = false;

// comparation function for sorting responses
function compare(a, b) {
    // compare object types in the order GE->department->course->instructor
    let aType = index.objects[a].type;
    let bType = index.objects[b].type;
    if (aType !== bType) return Math.sign(types[bType] - types[aType]);
    // find the largest common initial substring of the two keys and strip them
    let s = '';
    for (const i in a) {
        if (a[i] !== b[i] || !isNaN(parseInt(a[i]))) break;
        s += a[i];
    }
    a = a.replace(s, '');
    b = b.replace(s, '');
    let x = parseInt(a);
    let y = parseInt(b);
    // if both course numbers consist only of numbers, compare their numeric values directly
    // otherwise fall back to lexicographical comparison
    return a === x.toString() || b === y.toString() ? (x === y ? 0 : x < y ? -1 : 1) : a === b ? 0 : a < b ? -1 : 1;
}

// given an array of keys, return a mapping of those keys to their results in index.objects
function expandResponse(response, numResults, mask) {
    response = mask.length ? response.filter((x) => !mask.includes(index.objects[x].type)) : response;
    return response
        .sort(compare)
        .slice(0, numResults - 1)
        .reduce((obj, key) => {
            obj[key] = index.objects[key];
            return obj;
        }, {});
}

// search on a single keyword
function searchSingle(keyword, numResults) {
    keyword = keyword.toLowerCase();
    let response = [];
    // match course codes first if the query contains numbers
    if (keyword.match(/^[a-z]+[0-9]+[0-9]*$/)) {
        keyword = keyword.replace(' ', '');
        for (const [alias, department] of Object.entries(index.aliases)) {
            keyword = keyword.replace(new RegExp(`^${alias}`), department.toString());
        }
        response.push(...Object.keys(index.objects).filter((x) => x.includes(keyword.replace(' ', '').toUpperCase())));
    }
    // match all keywords
    const keyArrMap = Object.keys(index.keywords)
        .filter((x) => x.includes(keyword))
        .sort((a, b) => (a.length === b.length ? (a === b ? 0 : a < b ? -1 : 1) : a.length < b.length ? -1 : 1))
        .reduce((obj, val) => {
            obj[val] = index.keywords[val];
            return obj;
        }, {});
    // prioritize exact keyword matches
    let exactDeptMatch = false;
    for (const kw of Object.keys(keyArrMap)) {
        if (kw === keyword) {
            response.push(...keyArrMap[kw]);
            for (const key of keyArrMap[kw]) {
                // prioritize exact department matches
                if (
                    index.objects[key].type === 'DEPARTMENT' &&
                    (keyword.toUpperCase() === key || (index.aliases[keyword] && index.aliases[keyword] === key))
                ) {
                    response.push(
                        ...Object.keys(index.objects).filter((x) => index.objects[x].metadata.department === key)
                    );
                    exactDeptMatch = true;
                }
            }
            delete keyArrMap[kw];
            break;
        }
    }
    // add everything else if no exact department match was found
    if (!exactDeptMatch) response.push(...Object.values(keyArrMap).flat());
    // if there are bare departments and not enough responses, add the courses from that department
    for (const key of response) {
        if (index.objects[key].type === 'DEPARTMENT' && response.length <= numResults) {
            response.push(...Object.keys(index.objects).filter((x) => index.objects[x].metadata.department === key));
        }
    }
    return [...new Set([...response])];
}

// load the index into memory
async function init() {
    const response = await fetch(indexURL);
    index = await response.json();
    Object.freeze(index);
    initialized = true;
}

// perform a search
function search(query, numResults = 10, mask = []) {
    // basic sanity checking exceptions
    if (!initialized) {
        throw new Error('Index has not been initialized. Please run init() before executing a query.');
    }
    query = query.toLowerCase();
    // match course code with space, remove the space if detected
    if (query.match(/([a-z]+) ([0-9]+[a-z]*)/)) {
        query = query.replace(/([a-z]+) ([0-9]+[a-z]*)/, '$1$2');
    }
    const keywords = query.split(' ');
    if (keywords.some((x) => x.length < 2)) {
        throw new Error('Each keyword of the query must be at least two characters long.');
    }
    // if only one keyword was given, just run a single query
    if (keywords.length === 1) {
        return expandResponse(searchSingle(query, numResults), numResults, mask);
    }
    // take the results of all queries and return their intersection
    return expandResponse(
        keywords
            .map((keyword) => searchSingle(keyword, numResults))
            .reduce((array, response) => array.filter((x) => response.includes(x))),
        numResults,
        mask
    );
}

export { init, search };
