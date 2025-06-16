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
  // node server/init.js mongodb://localhost:27017/phreddit
  console.log("do node server/init.js mongodb://localhost:27017/phreddit");
  return;
}
console.log("admin creds: admin@admin.com : password123");
mongoose.connect(userArgs[0]);
let db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

async function createUser(communityIDs = []) {
  const passwordHash = await bcrypt.hash("password123", 10);
  const reputation = faker.number.int({ min: 0, max: 200 });
  const newUser = new User({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    passwordHash,
    role: "person",
    reputation,
    communityIDs,
  });
  return await newUser.save();
}

function createLinkFlair(content) {
  return new LinkFlairModel({ content }).save();
}

async function createNestedComments(depth, maxDepth, users, postID) {
  if (depth >= maxDepth) return [];

  const replies = [];
  const numReplies = faker.number.int({ min: 0, max: 2 });

  for (let i = 0; i < numReplies; i++) {
    const replyAuthor = faker.helpers.arrayElement(users);
    const nestedReplies = await createNestedComments(
      depth + 1,
      maxDepth,
      users,
      postID
    );
    const reply = await createComment({
      content: faker.hacker.phrase(),
      commentedBy: replyAuthor.username,
      commentIDs: nestedReplies,
      postID,
      votes: Math.floor(Math.random() * 100),
    });
    replies.push(reply);
  }

  return replies;
}

function createComment({ content, commentedBy, commentIDs =[], postID, votes = 0 }) {
  return new CommentModel({
    content,
    commentedBy,
    commentIDs,
    postID,
    votes,
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
    votes: Math.floor(Math.random() * 100),
    postedDate: faker.date.between({ from: "2024-09-01", to: Date.now() }),
  }).save();
}

function createCommunity(name, createdBy) {
  return new CommunityModel({
    name,
    description: faker.lorem.sentence(),
    startDate: faker.date.past(),
    createdBy,
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
  const adminPasswordHash = await bcrypt.hash("password123", 10);
  const adminUser = new User({
    firstName: "Admin",
    lastName: "User",
    email: "admin@admin.com",
    username: "admin",
    passwordHash: adminPasswordHash,
    role: "admin",
    reputation: 1000,
    createdAt: new Date("2005-05-17T00:00:00Z"),
  });
  await adminUser.save();
  users.push(adminUser);

  const flairTexts = [
    "The jerkstore called...",
    "Literal Saint",
    "They walk among us",
  ];
  const flairRefs = await Promise.all(
    flairTexts.map((content) => createLinkFlair(content))
  );

  const communityNames = ["blah", "gang", "random", "random2", "random3"];
  const communityRefs = [];
  const shuffledUsers = faker.helpers
    .shuffle(users)
    .slice(0, communityNames.length);

  for (let i = 0; i < communityNames.length; i++) {
    const createdBy = shuffledUsers[i];
    const community = await createCommunity(communityNames[i], createdBy._id);
    communityRefs.push(community);
  }

  for (let i = 0; i < 5; i++) {
    const community = faker.helpers.arrayElement(communityRefs);
    const randomMembersCount = faker.number.int({ min: 0, max: 5 });
    community.members = faker.helpers
      .shuffle(users)
      .slice(0, randomMembersCount)
      .map(u => u.username);
    await community.save();
  
    const poster = faker.helpers.arrayElement(users);
    const newPost = await createPost({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      postedBy: poster.username,
      commentIDs: [],
      linkFlairID: faker.helpers.arrayElement(flairRefs),
      communityID: community._id,
    });
  
    const topComments = [];
    for (let j = 0; j < 3; j++) {
      const commenter = faker.helpers.arrayElement(users);
      const nestedReplies = await createNestedComments(0, 2, users, newPost._id);
      const comment = await createComment({
        content: faker.hacker.phrase(),
        commentedBy: commenter.username,
        commentIDs: nestedReplies,
        postID: newPost._id,
      });
      topComments.push(comment);
    }

    newPost.commentIDs = topComments.map(c => c._id);
    await newPost.save();
    community.postIDs.push(newPost._id);
    await community.save();
  }
  
  db.close();
  console.log("Database created successfully!");
  console.log("Passwords for all users are 'password123'");
}

initializeDB().catch((err) => {
  console.error("Initialization error:", err);
  db.close();
});
