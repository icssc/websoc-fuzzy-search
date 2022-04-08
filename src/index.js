const fs = require('fs');
const pathToIndex = `${module.path}/index.json`;

let index = {};
let initialized = false;

function init() {
    index = JSON.parse(fs.readFileSync(pathToIndex).toString());
    Object.freeze(index);
    initialized = true;
}

function search(query, numResults = 10) {
    if (!initialized) {
        throw new Error('Index has not been initialized. Please run init() before executing a query.');
    }
    if (query.length < 2) {
        throw new Error('Query must be at least two characters long.');
    }
    const keyArrMap = JSON.parse(
        JSON.stringify(
            Object.keys(index.keywords)
                .filter((x) => x.includes(query))
                .sort((a, b) => (a.length === b.length ? (a === b ? 0 : a < b ? -1 : 1) : a.length < b.length ? -1 : 1))
                .reduce((obj, val) => {
                    obj[val] = index.keywords[val];
                    return obj;
                }, {})
        )
    );
    let response = {};
    if (!Object.keys(keyArrMap).length) return response;
    for (const key of Object.keys(JSON.parse(JSON.stringify(keyArrMap)))) {
        if (key === query) {
            response = keyArrMap[key].slice(0, numResults - 1).reduce((obj, val) => {
                obj[val] = index.objects[val];
                return obj;
            }, {});
            delete keyArrMap[key];
            break;
        }
    }
    while (Object.values(keyArrMap).some((x) => x.length)) {
        for (let arr of Object.values(keyArrMap)) {
            if (Object.keys(response).length === numResults) return response;
            let key = arr.shift();
            if (key !== undefined) response[key] = index.objects[key];
        }
    }
    return response;
}

module.exports = { init, search };
