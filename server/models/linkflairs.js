const mongoose = require("mongoose");

const linkFlairSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 30 },
});

linkFlairSchema.virtual("url").get(function () {
  return `linkFlairs/${this._id}`;
});

linkFlairSchema.set("toJSON", {virtuals: true});

module.exports = mongoose.model("LinkFlair", linkFlairSchema);