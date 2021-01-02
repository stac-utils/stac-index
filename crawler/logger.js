const { DEV } = require('../commons');

module.exports = {
    log(x) {
        if (DEV) {
            console.log(x);
        }
    },
    error(x) {
        if (DEV) {
            console.error(x);
        }
    }
};