const router = require("express").Router();
const Post = require("../models/posts");
const Comment = require("../models/comments");
const User = require("../models/user");

async function doVote(docModel, idField, req, res, score, repDelta) {
  const { id }        = req.params;
  const { username }  = req.body;

  const voter  = await User.findOne({ username });
  if (!voter) return res.status(404).json({ error: 'voter not found' });


  const update = {
    $inc      : { votes: score },
    $addToSet : { voters: voter._id }        
  };

  const target = await docModel.findOneAndUpdate(
    { _id: id, voters: { $ne: voter._id } },   
    update,
    { new: true }
  );

  if (!target) return res.status(400).json({ error: 'already voted' });

  const repChange = score > 0 ? repDelta : -Math.abs(repDelta);
  await User.updateOne(
    { username: target[idField] },
    { $inc: { reputation: repChange } }
  );

  return res.json({ votes: target.votes });
}


router.post("/posts/:id/up", (req, res) =>
  doVote(Post, "postedBy", req, res, +1, +5)
);
router.post("/posts/:id/down", (req, res) =>
  doVote(Post, "postedBy", req, res, -1, -10)
);

router.post("/comments/:id/up", (req, res) =>
  doVote(Comment, "commentedBy", req, res, +1, +5)
);
router.post("/comments/:id/down", (req, res) =>
  doVote(Comment, "commentedBy", req, res, -1, -10)
);

module.exports = router;