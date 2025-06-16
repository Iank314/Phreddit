const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 500 },
  commentedBy: { type: String, required: true },
  commentedDate: { type: Date, default: Date.now },
  votes: { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  commentIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  postID: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true}
});

commentSchema.virtual("url").get(function () {
  return `comments/${this._id}`;
});

commentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Comment", commentSchema);
