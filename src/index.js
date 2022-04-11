// imports
const fs = require('fs');

// constants
// path to the index
const pathToIndex = `${module.path}/index.json`;
// mapping of types to numbers for compareFn
const types = {
    GE_CATEGORY: 4,
    DEPARTMENT: 3,
    COURSE: 2,
    INSTRUCTOR: 1,
};

let index = {};
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
    return a === x.toString() && b === y.toString() ? (x === y ? 0 : x < y ? -1 : 1) : a === b ? 0 : a < b ? -1 : 1;
}

// given an array of keys, return a mapping of those keys to their results in index.objects
function expandResponse(response, numResults) {
    return response
        .sort(compare)
        .slice(0, numResults - 1)
        .reduce((obj, key) => {
            obj[key] = index.objects[key];
            return obj;
        }, {});
}

// load the index into memory
function init() {
    index = JSON.parse(fs.readFileSync(pathToIndex).toString());
    Object.freeze(index);
    initialized = true;
}

// perform a search
function search(query, numResults = 10) {
    // basic sanity checking exceptions
    if (!initialized) {
        throw new Error('Index has not been initialized. Please run init() before executing a query.');
    }
    if (query.length < 2) {
        throw new Error('Query must be at least two characters long.');
    }
    query = query.toLowerCase();
    let response = [];
    // match course codes first if the query contains numbers
    if (query.match(/^[a-z]+[0-9]+$/)) {
        query = query.replace(' ', '');
        for (const [alias, department] of Object.entries(index.aliases)) {
            query = query.replace(new RegExp(`^${alias}`), department.toString());
        }
        response.push(...Object.keys(index.objects).filter((x) => x.includes(query.toUpperCase())));
    }
    // match all keywords
    const keyArrMap = Object.keys(index.keywords)
        .filter((x) => x.includes(query))
        .sort((a, b) => (a.length === b.length ? (a === b ? 0 : a < b ? -1 : 1) : a.length < b.length ? -1 : 1))
        .reduce((obj, val) => {
            obj[val] = index.keywords[val];
            return obj;
        }, {});
    // prioritize exact keyword matches
    let exactDeptMatch = false;
    for (const keyword of Object.keys(keyArrMap)) {
        if (keyword === query) {
            response.push(...keyArrMap[keyword]);
            for (const key of keyArrMap[keyword]) {
                // prioritize exact department matches
                if (
                    index.objects[key].type === 'DEPARTMENT' &&
                    (query.toUpperCase() === key || index.aliases?.[query] === key)
                ) {
                    response.push(
                        ...Object.keys(index.objects).filter((x) => index.objects[x].metadata.department === key)
                    );
                    exactDeptMatch = true;
                }
            }
            delete keyArrMap[keyword];
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
    return expandResponse(response, numResults);
}

module.exports = { init, search };
