const mg = require('mongoose');
const Schema = mg.Schema;

const ProcessData = new Schema({
    dataID: {type: String},
    name: {type: String},
    data: {type: Object},
    A: {type: Array},
    B: {type: Array},
    C: {type: Array},
    D: {type: Array},
    E: {type: Array},
    record: {type: Number}
});

module.exports = mg.model('ProcessData',ProcessData);
