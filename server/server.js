// Run this script to launch the server.
// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

app.use(cors());
app.use(express.json());

const voteRoutes = require("./routes/voteRoutes");
const communityRoutes = require("./routes/communityRoutes");
const linkFlairRoutes = require("./routes/linkFlairRoutes.js");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const usersRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method}  ${req.originalUrl}`);
  next();
});

app.use("/api/profile", profileRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/linkFlairs", linkFlairRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", usersRoutes);
app.use("/api", voteRoutes);

app.get("/", function (req, res) {
  res.send("Hello Phreddit!");
});

app.use((err, _req, res, _next) => {
  console.error("[SERVER ERROR]", err);         
  if (!res.headersSent) res.status(500).json({ error: "internal error" });
});

mongoose.connect("mongodb://127.0.0.1:27017/phreddit", {});

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB.");

  app.listen(8000, () => {
    console.log("Server listening on port 8000...");
  });
});

