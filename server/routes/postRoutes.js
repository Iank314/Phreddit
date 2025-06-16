const express = require("express");
const router = express.Router();
const Post = require("../models/posts");
const Community = require("../models/communities");
const User    = require("../models/user");


router.post("/", async (req, res) => {
  try {
    console.log("Received post creation request:", req.body);
    const { title, content, linkFlairID, postedBy, commentIDs = [], communityID } = req.body;
    const newPost = await Post.create({
      title,
      content,
      linkFlairID,
      postedBy,
      commentIDs,
      communityID
    });

    await Community.findByIdAndUpdate(
      communityID,
      { $addToSet: { postIDs: newPost._id } },
      { new: false }
    );

    res.json(newPost);
  } catch (err) {
    console.error("Error creating post:", err.message);
    res.status(400).json({ error: err.message });
  }
});


router.post("/:postID/updateViews", async (req, res) => {
  try {
    const { postID } = req.params;
    const { incrementBy } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      postID,
      { $inc: { views: incrementBy } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(updatedPost);
  } catch (err) {
    console.error("Error updating post views:", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.post("/:postID/addComment", async (req, res) => {
  try {
    const { postID } = req.params;
    const { commentID } = req.body;

    if (!commentID) {
      return res.status(400).json({ error: "Comment ID is required" });
    }
    const updatedPost = await Post.findByIdAndUpdate(
      postID,
      { $addToSet: { commentIDs: commentID } },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(updatedPost);
  } catch (err) {
    console.error("Error adding commentID to post:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/:dir", async (req, res) => {
  const { id, dir }   = req.params;
  const { username }  = req.body;

  if (!['up', 'down'].includes(dir))
    return res.status(400).json({ error: 'bad dir' });

  const voter = await User.findOne({ username });
  if (!voter) return res.status(404).json({ error: 'voter not found' });

  const post = await Post.findOneAndUpdate(
    { _id: id, voters: { $ne: voter._id } },
    { $inc: { votes: dir === 'up' ? 1 : -1 },
      $addToSet: { voters: voter._id } },
    { new: true }
  );
  if (!post) return res.status(400).json({ error: 'already voted' });

  const delta = dir === 'up' ? 5 : -10;
  await User.updateOne({ username: post.postedBy }, { $inc: { reputation: delta } });

  res.json(post);
});

router.get("/", async (req, res) => {
  try {
    const allPosts = await Post.find().exec();
    res.json(allPosts);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ postID: req.params.id });
    res.status(200).json({ message: "Post and its comments deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;