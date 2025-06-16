const mongoose = require("mongoose");

const Comment = require("./comments");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  content: { type: String, required: true },
  postedBy: { type: String, required: true },
  postedDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  votes:   { type: Number, default: 0 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  linkFlairID: { type: mongoose.Schema.Types.ObjectId, ref: "LinkFlair" },
  commentIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  communityID: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
});


postSchema.pre("findOneAndDelete", async function () {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await Comment.deleteMany({ postID: doc._id });
  }
});

postSchema.virtual("url").get(function () {
  return `posts/${this._id}`;
});

postSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Post", postSchema);
