const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, maxLength: 100 },
  description: { type: String, required: true, maxLength: 500 },
  startDate: { type: Date, default: Date.now },
  members: [String],
  postIDs: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

communitySchema.virtual("url").get(function () {
  return `communities/${this._id}`;
});

communitySchema.virtual("memberCount").get(function () {
  return this.members.length;
});

communitySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Community", communitySchema);
