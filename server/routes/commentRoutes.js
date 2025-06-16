const express = require("express");
const router = express.Router();
const Comment = require("../models/comments");
const Post    = require("../models/posts");
const User    = require("../models/user");


router.post("/", async (req, res) => {
  try {
    console.log("Received request:", req.body);
    const { content, commentedBy, commentIDs = [], postID } = req.body;
    if (!postID)
      return res.status(400).json({ error: "postID required" });
    const newComment = await Comment.create({
      content,
      commentedBy,
      commentIDs,
      postID
    });

    res.json(newComment);

  } catch (err) {
    console.error("Error creating comment:", err.message);
    res.status(400).json({ error: err.message });
  }
});


router.post("/:commentID/addReply", async (req, res) => {
  try {
    const { commentID } = req.params;
    const { replyCommentID } = req.body;

    if (!replyCommentID)
      return res.status(400).json({ error: "replyCommentID required" });

     const updatedComment = await Comment.findByIdAndUpdate(
     commentID,
     { $addToSet: { commentIDs: replyCommentID } },   // just link it
     { new: true }
   );

    if (!updatedComment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.json(updatedComment);
  } catch (err) {
    console.error("Error replying to comment:", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.post("/:id/:dir", async (req, res) => {
  const { id, dir }  = req.params;
  const { username } = req.body;

  if (!["up", "down"].includes(dir))
    return res.status(400).json({ error: "bad dir" });

  const voter = await User.findOne({ username });
  if (!voter) return res.status(404).json({ error: "voter not found" });

  const comment = await Comment.findOneAndUpdate(
    { _id: id, voters: { $ne: voter._id } },
    {
      $inc     : { votes: dir === "up" ? 1 : -1 },
      $addToSet: { voters: voter._id }
    },
    { new: true }
  );

  if (!comment) return res.status(400).json({ error: "already voted" });

  const deltaRep = dir === "up" ? 5 : -10;
  await User.updateOne(
    { username: comment.commentedBy },
    { $inc: { reputation: deltaRep } }
  );

  res.json({ votes: comment.votes });
});

router.get("/", async (req, res) => {
  try {
    const allComments = await Comment.find().exec();
    res.json(allComments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const root = await Comment.findById(req.params.id);
    if (!root) return res.status(404).json({ error: "comment not found" });

   const idsToDelete = [];
    async function collect(cmt) {
      idsToDelete.push(cmt._id);
      if (cmt.commentIDs?.length) {
        const kids = await Comment.find({ _id: { $in: cmt.commentIDs } });
        await Promise.all(kids.map(collect));
      }
    }
    await collect(root);
    await Comment.deleteMany({ _id: { $in: idsToDelete } });
    await Promise.all([
      Post.updateMany(
        { commentIDs: { $in: idsToDelete } },
        { $pull: { commentIDs: { $in: idsToDelete } } }
      ),
      Comment.updateMany(
        { commentIDs: { $in: idsToDelete } },
        { $pull: { commentIDs: { $in: idsToDelete } } }
      ),
    ]);

    res.sendStatus(204);           
  } catch (err) {
    next(err);
  }
});

module.exports = router;
