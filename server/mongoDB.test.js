const mongoose = require("mongoose");
const Post = require("./models/posts");
const Comment = require("./models/comments");

beforeAll(async () => {
  await mongoose.connect("mongodb://localhost:27017/testdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe("Post and comment deletion", () => {
  let postID;
  const allCommentIDs = [];

  const collectAllCommentIDs = async (commentIDs) => {
    for (const id of commentIDs) {
      allCommentIDs.push(id.toString());
      const comment = await Comment.findById(id);
      if (comment && comment.commentIDs.length > 0) {
        await collectAllCommentIDs(comment.commentIDs);
      }
    }
  };

  it("should delete the post and all associated comments", async () => {
    const post = await Post.create({
      title: "Test Post",
      content: "Testing cascade delete",
      postedBy: "testuser",
      commentIDs: [],
    });
    postID = post._id;

    const rootComment = await Comment.create({
      content: "Root comment",
      commentedBy: "testuser",
      commentIDs: [],
      postID: postID,
    });

    const nestedComment = await Comment.create({
      content: "Reply to root",
      commentedBy: "testuser",
      commentIDs: [],
      postID: postID,
    });

    rootComment.commentIDs.push(nestedComment._id);
    await rootComment.save();

    post.commentIDs.push(rootComment._id);
    await post.save();

    await collectAllCommentIDs(post.commentIDs);

    await Post.findByIdAndDelete(postID);

    const deletedPost = await Post.findById(postID);
    expect(deletedPost).toBeNull();

    for (const cid of allCommentIDs) {
      const comment = await Comment.findById(cid);
      expect(comment).toBeNull();
    }
  });
});
