const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);
module.exports = Newsletter;
