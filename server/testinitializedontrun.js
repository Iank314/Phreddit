const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

const User = require("./models/user");
const CommunityModel = require("./models/communities");
const PostModel = require("./models/posts");
const CommentModel = require("./models/comments");
const LinkFlairModel = require("./models/linkflairs");

let userArgs = process.argv.slice(2);
if (!userArgs[0].startsWith("mongodb")) {
  console.log("Add mongodb://localhost:27017/phreddit");
  return;
}

mongoose.connect(userArgs[0]);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

async function createUser() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const newUser = new User({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    passwordHash,
    role: "person",
  });
  return await newUser.save();
}

function createLinkFlair(content) {
  return new LinkFlairModel({ content }).save();
}

async function createNestedComments(depth, maxDepth, users) {
  if (depth >= maxDepth) return [];

  const replies = [];
  const numReplies = faker.number.int({ min: 0, max: 2 });

  for (let i = 0; i < numReplies; i++) {
    const replyAuthor = faker.helpers.arrayElement(users);
    const nestedReplies = await createNestedComments(
      depth + 1,
      maxDepth,
      users
    );
    const reply = await createComment({
      content: faker.hacker.phrase(),
      commentedBy: replyAuthor.username,
      commentIDs: nestedReplies,
    });
    replies.push(reply);
  }

  return replies;
}

function createComment({ content, commentedBy, commentIDs }) {
  return new CommentModel({
    content,
    commentedBy,
    commentIDs,
    commentedDate: faker.date.recent(),
  }).save();
}

function createPost({
  title,
  content,
  postedBy,
  commentIDs,
  linkFlairID,
  communityID,
}) {
  return new PostModel({
    title,
    content,
    postedBy,
    commentIDs,
    linkFlairID,
    communityID,
    views: Math.floor(Math.random() * 100),
    postedDate: faker.date.recent(),
  }).save();
}

function createCommunity(name) {
  return new CommunityModel({
    name,
    description: faker.lorem.sentence(),
    createdAt: faker.date.past(),
  }).save();
}

async function initializeDB() {
  await new Promise((resolve, reject) => {
    db.once("open", resolve);
    db.on("error", reject);
  });

  await mongoose.connection.db.dropDatabase();
  let users = [];
  for (let i = 0; i < 5; i++) {
    users.push(await createUser());
  }

  const flairTexts = [
    "The jerkstore called...",
    "Literal Saint",
    "They walk among us",
  ];
  const flairRefs = await Promise.all(
    flairTexts.map((content) => createLinkFlair(content))
  );

  const communityNames = ["science", "funny", "codeporn", "askme", "books"];
  const communityRefs = await Promise.all(
    communityNames.map((name) => createCommunity(name))
  );

  for (let i = 0; i < 5; i++) {
    let comments = [];
    for (let j = 0; j < 3; j++) {
      const commenter = faker.helpers.arrayElement(users);
      const nestedReplies = await createNestedComments(0, 2, users);
      const comment = await createComment({
        content: faker.hacker.phrase(),
        commentedBy: commenter.username,
        commentIDs: nestedReplies,
      });
      comments.push(comment);
    }

    const poster = faker.helpers.arrayElement(users);
    await createPost({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      postedBy: poster.username,
      commentIDs: comments,
      linkFlairID: faker.helpers.arrayElement(flairRefs),
      communityID: faker.helpers.arrayElement(communityRefs),
    });
  }

  db.close();
  console.log("Database seeded successfully!");
}

initializeDB().catch((err) => {
  console.error("Initialization error:", err);
  db.close();
});
