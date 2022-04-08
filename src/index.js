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
    const keyArrs = JSON.parse(
        JSON.stringify(
            Object.keys(index.keywords)
                .filter((x) => x.includes(query))
                .sort((a, b) => (a.length === b.length ? (a === b ? 0 : a < b ? -1 : 1) : a.length < b.length ? -1 : 1))
                .map((x) => index.keywords[x])
        )
    );
    let response = [];
    if (!keyArrs.length) return response;
    while (true) {
        for (let arr of keyArrs) {
            if (response.length === numResults) return response;
            let key = arr.shift();
            if (key !== undefined) response.push(index.objects[key]);
        }
    }
}

module.exports = { init, search };
