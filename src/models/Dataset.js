const mg = require('mongoose');
const Schema = mg.Schema;

const Dataset = new Schema({
    name: {type: String},
    record: {type: Number},
    data: {type: Object}
});

module.exports = mg.model('Dataset',Dataset);
