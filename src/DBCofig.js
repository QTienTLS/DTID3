const mongoose = require('mongoose');

async function connect() {
    try {
        await mongoose.connect(
            'mongodb+srv://qtientls:maihang123@cluster-main.hbhcd.mongodb.net/DataMinning',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            },
        );
        console.log('connect successfully !!! ');
    } catch (error) {
        console.log('connect failed:',error);
    }
}

module.exports = { connect };