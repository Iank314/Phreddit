const router     = require("express").Router();
const User       = require("../models/user");
const Community  = require("../models/communities");
const Post       = require("../models/posts");
const Comment    = require("../models/comments");


async function deleteCommentAndCleanup(rootId) {
  const root = await Comment.findById(rootId);
  if (!root) return;

  const ids = [];
  async function collect(c) {
    ids.push(c._id);
    if (c.commentIDs?.length) {
      const kids = await Comment.find({ _id: { $in: c.commentIDs } });
      await Promise.all(kids.map(collect));
    }
  }
  await collect(root);

  await Comment.deleteMany({ _id: { $in: ids } });

  await Promise.all([
    Post.updateMany(
      { commentIDs: { $in: ids } },
      { $pull: { commentIDs: { $in: ids } } }
    ),
    Comment.updateMany(
      { commentIDs: { $in: ids } },
      { $pull: { commentIDs: { $in: ids } } }
    ),
  ]);
}

router.get("/:uid/summary", async (req, res) => {
    const { uid } = req.params;
  
    const user = await User.findById(uid, "-passwordHash");
    if (!user) return res.status(404).json({ error: "user not found" });
  
    const [posts, comments, comms] = await Promise.all([
      Post.find({ postedBy: user.username }),
      Comment.find({ commentedBy: user.username }).select("content commentedDate votes postID"),

      Community.find({
        $or: [
          { "createdBy.username": user.username },
          { members: user.username }                
        ]
      })
    ]);

    res.json({ 
      username:   user.username,
      email:      user.email,
      reputation: user.reputation,
      joined:     user.createdAt,
      posts,
      comments,
      communities: comms
    });
  });

  ["posts", "comments", "communities"].forEach(kindPlural => {
    const Model         = require(`../models/${kindPlural}`);
    const kindSingular  = kindPlural.slice(0, -1);

    router.patch(`/${kindPlural}/:id`, async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new:true, runValidators:true }
    );
    if (!doc) return res.status(404).json({ error:`${kindSingular} not found` });
    res.json(doc);
  } catch (e) {
    if (e.name === "CastError") return res.status(400).json({ error:"bad id" });
    next(e);
  }
});
  
router.delete(`/${kindPlural}/:id`, async (req, res, next) => {
  try {
    if (kindPlural === "comments") {
      await deleteCommentAndCleanup(req.params.id);
      return res.json({ deleted: true });
    }
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: `${kindSingular} not found` });
    res.json({ deleted: true });
  } catch (e) {
    if (e.name === "CastError")
      return res.status(400).json({ error: "bad id" });
    next(e);
  }
});
});


    router.get("/allUsers", async (_req, res) => {
        const users = await User.find({}, "username email reputation createdAt");
        res.json(users);
      });
      
      router.delete("/user/:uid", async (req, res) => {
        await User.findByIdAndDelete(req.params.uid);
        res.json({ deleted: true });
      });
    
module.exports = router;