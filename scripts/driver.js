const prompt = require('prompt-sync')({ sigint: true, eot: true });
const search = require(`${module.path}/..`);
console.time('Initialization took');
search.init();
console.timeEnd('Initialization took');
while (true) {
    try {
        let q = prompt('Enter a query: ');
        console.time('Query took');
        console.log(search.search(q));
        console.timeEnd('Query took');
    } catch (e) {
        console.error(e);
    }
}
