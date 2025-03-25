import Model from "./model.js";

class Community {
  //can add methods to a class
  constructor(
    communityID,
    name,
    description,
    startDate,
    postIDs = [],
    members = []
  ) {
    this.communityID = communityID;
    this.name = name;
    this.description = description;
    this.postIDs = postIDs;
    this.startDate = new Date(startDate);
    this.members = members;
    this.memberCount = members.length;
  }
}
//example community
// communityID: 'community1',
// name: 'Am I the Jerk?',
// description: 'A practical application of the principles of justice.',
// postIDs: ['p1'],
// startDate: new Date('August 10, 2024 04:18:00'),
// members: ['rollo', 'shemp', 'catlady13', 'astyanax', 'trucknutz69'],
// memberCount: 4,

class Comment {
  constructor(commentID, content, commentedBy, commentedDate, commentIDs = []) {
    this.commentID = commentID;
    this.content = content;
    this.commentIDs = commentIDs;
    this.commentedBy = commentedBy;
    this.commentedDate = new Date(commentedDate);
  }
}
// commentID: 'comment1',
// content: 'There is no higher calling than the protection of Tesla products.  God bless you sir and God bless Elon Musk. Oh, NTJ.',
// commentIDs: ['comment3'],
// commentedBy: 'shemp',
// commentedDate: new Date('August 23, 2024 08:22:00'),

class Post {
  constructor(
    postID,
    title,
    content,
    linkFlairID,
    postedBy,
    postedDate,
    commentIDs = [],
    views
  ) {
    this.postID = postID;
    this.title = title;
    this.content = content;
    this.linkFlairID = linkFlairID;
    this.postedBy = postedBy;
    this.postedDate = new Date(postedDate);
    this.commentIDs = commentIDs;
    this.views = views;
  }
}
//PostID: 'p1'
//title: 'AITJ: I parked my cybertruck in the handicapped spot to protect it from bitter, jealous losers.'
//content:'Recently I went to the store in my brand new Tesla cybertruck. I know there are lots of haters out there, so I wanted to make sure my truck was protected. So I parked it so it overlapped with two of those extra-wide handicapped spots.  When I came out of the store with my beef jerky some Karen in a wheelchair was screaming at me.  So tell me prhreddit, was I the jerk?'
//linkFlairID: 'lf1'
//postedBy: 'trucknutz69'
//postedDate: new Date('August 23, 2024 01:19:00')
//commentIDs:['comment1', 'comment2']
//view: 14

class LinkFlair {
  constructor(linkFlairID, content) {
    this.linkFlairID = linkFlairID;
    this.content = content;
  }
}

//linkFlairID: 'lf1'
//content: 'The jerkstore called...

// check inspect element console for console.logs cause my vscode cant run it
window.onload = function () {
  const model = new Model();
  const communities = model.data.communities.map(
    (c) =>
      new Community(
        c.communityID,
        c.name,
        c.description,
        c.startDate,
        c.postIDs,
        c.members
      )
  );
  const linkFlairs = model.data.linkFlairs.map(
    (c) => new LinkFlair(c.linkFlairID, c.content)
  );
  const posts = model.data.posts.map(
    (c) =>
      new Post(
        c.postID,
        c.title,
        c.content,
        c.linkFlairID,
        c.postedBy,
        c.postedDate,
        c.commentIDs,
        c.views
      )
  );
  const comments = model.data.comments.map(
    (c) =>
      new Comment(
        c.commentID,
        c.content,
        c.commentedBy,
        c.commentedDate,
        c.commentIDs
      )
  );
  console.log("Communities:", communities[0]);
  console.log("Link Flairs:", linkFlairs[0]);
  console.log("Posts:", posts[0]);
  console.log("Comments:", comments[0]);

  // ALL HOMEPAGE STUFF

  const homeNav = document.querySelector(".nav-link");
  const container = document.querySelector(".container");

  function commentCounter(commentIDs) {
    let total = commentIDs.length;
    // console.log(total);
    commentIDs.forEach((commentID) => {
      const comment = comments.find((c) => c.commentID == commentID);
      if (comment) {
        total = total + commentCounter(comment.commentIDs);
      }
    });
    return total;
  }

  function postHTML(post) {
    const community = communities.find((c) => c.postIDs.includes(post.postID)); //get the community from the post backwards since we sortby
    const linkFlair = linkFlairs.find((c) => c.linkFlairID == post.linkFlairID);
    const comment = commentCounter(post.commentIDs);
    return `
    <div class="post">
                <div class="postinfo">
                    <span class="postcommunity">${
                      community ? community.name : "Community Name Not Found"
                    }</span> |
                    <span class="postusername">${post.postedBy}</span> |
                    <span class="postdate">${formatTimestamp(
                      post.postedDate
                    )}</span> 
                </div>
                <div class="posttitle">${post.title}</div>
                <div class="linkflair">${
                  linkFlair ? linkFlair.content : ""
                }</div>
                <div class="postcontent">${post.content.substring(
                  0,
                  20
                )}...</div>
                <div class="postbottom">
                    <span class="postviews">Views: ${post.views}</span>
                    <span class="postcomments">Comments: ${comment}</span>
                </div>
                <button class="view-post-btn" data-post-id="${
                  post.postID
                }">View Post</button>
            </div>
    `;
  }
  function sortPosts(posts, sortby) {
    if (sortby === "newest") {
      return posts.sort(
        (a, b) => new Date(b.postedDate) - new Date(a.postedDate)
      );
    } else if (sortby === "oldest") {
      return posts.sort(
        (a, b) => new Date(a.postedDate) - new Date(b.postedDate)
      );
    } else if (sortby === "active") {
      return posts.sort((a, b) => {
        const latestA = latestCommentDate(a.commentIDs);
        const latestB = latestCommentDate(b.commentIDs);
        console.log("sorting");
        return (
          new Date(latestB || b.postedDate) - new Date(latestA || a.postedDate)
        );
      });
    }
    return posts;
  }

  function latestCommentDate(commentIDs) {
    let latestDate = null;
    function findDate(ids) {
      ids.forEach((oneID) => {
        const comment = comments.find((c) => c.commentID == oneID);
        if (comment) {
          const commentDate = new Date(comment.commentedDate);
          if (!latestDate || commentDate > latestDate) {
            latestDate = commentDate;
          }
          findDate(comment.commentIDs);
        }
      });
    }
    findDate(commentIDs);
    return latestDate;
  }

  function homePage(sortBy) {
    // console.log(communities[0]);
    let sortedPosts = [...posts];
    sortedPosts = sortPosts(sortedPosts, sortBy);
    container.innerHTML = `
            <div class="homepage">
                <div class="bannerhomepage">
                    <h2 class="icon">All Posts</h2>
                    <div class="sortbuttons">
                        <button class="sort" id="newest">Newest</button>
                        <button class="sort" id="oldest">Oldest</button>
                        <button class="sort" id="active">Active</button>
                    </div>
                </div>
                <p class="postcount">${sortedPosts.length} posts</p>
                <div class="post-list">
                    ${sortedPosts.map(postHTML).join("")}
                </div>
            </div>
        `;
    document
      .getElementById("newest")
      .addEventListener("click", () => homePage("newest"));
    document
      .getElementById("oldest")
      .addEventListener("click", () => homePage("oldest"));
    document
      .getElementById("active")
      .addEventListener("click", () => homePage("active"));

    addPostClickEvents();
  }
  homeNav.addEventListener("click", (event) => {
    event.preventDefault();
    homePage("newest");
    console.log("making Homepage");
  });

  function addPostClickEvents() {
    const buttons = document.querySelectorAll(".view-post-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const postID = btn.dataset.postId;
        postDetailView(postID);
      });
    });
  }

  /** TimeStamp */
  function formatTimestamp(submission, current = new Date()) {
    submission = new Date(submission);
    if (submission.toDateString() == current.toDateString()) {
      const diffSeconds = Math.floor((current - submission) / 1000);
      if (diffSeconds < 60) {
        return `${diffSeconds} seconds ago`;
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} minutes ago`;
      } else {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} hours ago`;
      }
    } else {
      const diffDays = Math.floor(
        (current - submission) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 30) {
        return `${diffDays} days ago`;
      }
      const yearsDiff = current.getFullYear() - submission.getFullYear();
      const monthsDiff =
        yearsDiff * 12 + (current.getMonth() - submission.getMonth());
      if (monthsDiff < 12) {
        return `${monthsDiff} months ago`;
      } else {
        return `${yearsDiff} year(s) ago`;
      }
    }
  }
  // SEARCHBAR STUFF
  const searchBox = document.querySelector(".search");
  searchBox.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const words = searchBox.value.trim().toLowerCase();
      if (words.length > 0) {
        findPosts(words);
      }
    }
  });
  function findPosts(words) {
    const wordList = words.split(" ").map((term) => term.toLowerCase().trim());
    const results = [];
    posts.forEach((post) => {
      const postTitle = post.title.toLowerCase();
      // console.log(postTitle);
      const postContent = post.content.toLowerCase();
      if (
        wordList.some(
          (item) => postTitle.includes(item) || postContent.includes(item)
        )
      ) {
        results.push(post);
      } else {
        if (post.commentIDs.some((item) => countComments(item, wordList) > 0)) {
          results.push(post);
        }
      }
    });
    searchResultHTML(results, "newest", words);
  }

  function countComments(commentID, wordList) {
    const comment = comments.find((c) => c.commentID == commentID);
    if (!comment) {
      console.log("not found");
      return 0;
    }
    let count = 0;
    wordList.forEach((word) => {
      if (comment.content.toLowerCase().includes(word)) {
        count++;
      }
    });
    if (comment.commentIDs && comment.commentIDs.length > 0) {
      comment.commentIDs.forEach((replyID) => {
        count += countComments(replyID, wordList);
      });
    }
    return count;
  }

  function searchResultHTML(postsList, sortBy, words) {
    const searchResultsContainer = document.querySelector(".container");
    const sortedPosts = sortPosts(postsList, sortBy);
    searchResultsContainer.innerHTML = `
    <div class="searchresult">
      <div class="bannersearch">
        <div class="icon">${
          postsList.length > 0 ? "R" : "No r"
        }esults for: "${words}"</div>
        <div class="sortbuttons">
          <button class="sort" id="newest">Newest</button>
          <button class="sort" id="oldest">Oldest</button>
          <button class="sort" id="active">Active</button>
        </div>
      </div>
      <p class="postcount">${postsList.length} post${
      postsList.length == 1 ? "" : "s"
    } found</p>
      <div class="post-list">
        ${sortedPosts.map(postHTML).join("")}
      </div>
    </div>
  `;
    document
      .getElementById("newest")
      .addEventListener("click", () =>
        searchResultHTML(postsList, "newest", words)
      );
    document
      .getElementById("oldest")
      .addEventListener("click", () =>
        searchResultHTML(postsList, "oldest", words)
      );
    document
      .getElementById("active")
      .addEventListener("click", () =>
        searchResultHTML(postsList, "active", words)
      );
    addPostClickEvents();
  }

  // create community page
  function createCommunitiesList() {
    const communitiesList = document.querySelector(".communities-list");
    communitiesList.innerHTML = communities
      .map(
        (community) =>
          `<li>
            <a href = "#" class = "community-link" data-community-id="${community.communityID}">
              ${community.name}
            </a>
          </li>`
      )
      .join("");
    communitiesList.querySelectorAll(".community-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const communityID = this.dataset.communityId;
        communityPageView(communityID);
      });
    });
  }

  createCommunitiesList();

  function createCommunityPage() {
    container.innerHTML = `
        <div class = "create-community-view">
          <h2>Engender Community</h2>
          <form id = "create-community-form">
            <label for="community-name">Community Name:</label>
            <input type = "text" id="community-name" name ="community-name" required>

            <label for="username">Username:</label>
            <input type = "text" id="username" name ="username" required>

            <label for="community-description">Description:</label>
            <textarea id = "community-description" name = "community-description" required></textarea>

            <button type = "submit">Engender Community</button>
          </form>
        </div>`;

    const form = document.getElementById("create-community-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("community-name").value;
      const username = document.getElementById("username").value;
      const description = document.getElementById(
        "community-description"
      ).value;
      const newCommunityID = "community" + Date.now();

      const newCommunity = new Community(
        newCommunityID,
        name,
        description,
        new Date(),
        [],
        [username]
      );
      communities.push(newCommunity);
      createCommunitiesList();
      createCommunityView(newCommunityID);
      console.log("New Community Created:", name, description);
    });
  }

  const createCommunityBtn = document.querySelector(".create-community-btn");
  createCommunityBtn.addEventListener("click", (e) => {
    e.preventDefault();
    createCommunityPage();
    console.log("Navigating to create community view");
  });

  function createCommunityView(communityID) {
    const community = communities.find((c) => c.communityID === communityID);
    if (!community) return;
    container.innerHTML = `
            <div class = "community-view">
              <h2 class="community-title">${community.name}</h2>
              <p class="community-description">${community.description}</p>
              <p class="community-timestamp">Created on: ${community.startDate.toLocaleString()}</p>
              <div class="community-stats">
                <span class="member-count">Members: ${
                  community.memberCount
                }</span>
                <span class="post-count">Posts: ${
                  community.postIDs.length
                }</span>
                </div>
              </div>`;
  }

  // CREATE POST PAGE
  const createPostBtn = document.querySelector(".createpost");
  createPostBtn.addEventListener("click", function () {
    const communityOptions = communities
      .map((c) => `<option value="${c.communityID}">${c.name}</option>`)
      .join("");
    const linkFlairOptions = linkFlairs
      .map((lf) => `<option value="${lf.linkFlairID}">${lf.content}</option>`)
      .join("");
    container.innerHTML = `
      <div class="icon posticon">Create a New Post</div>
      <div class="newpost">
        <form class="postform">
          <label for="communityselect">Community: </label>
          <select id="communityselect" name="community" required>
            <option value="" disabled selected>Select a community</option>
            ${communityOptions}
          </select>

          <label for="posttitle">Title (required, max 100 characters):</label>
          <input type="text" id="posttitle" name="title" maxlength="100" required />

          <label for="flairselect">Link Flair (Optional):</label>
          <select id="flairselect" name="flair">
            <option value="" selected>None</option>
            ${linkFlairOptions}
          </select>

          <label for="customflair">Or enter a new flair (optional, max 30 characters):</label>
          <input type="text" id="customflair" maxlength="30" />

          <label for="postcontent">Content:</label>
          <textarea id="postcontent" name="content" required></textarea>

          <label for="username">Username:</label>
          <input type="text" id="username" name="username" required />

          <button type="submit">Submit Post</button>
        </form>
      </div>
    `;

    const postForm = document.querySelector(".postform");
    postForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const communityID = document.getElementById("communityselect").value;
      const title = document.getElementById("posttitle").value;
      const content = document.getElementById("postcontent").value;
      const username = document.getElementById("username").value;
      let linkFlairID = document.getElementById("flairselect").value;
      const customFlair = document.getElementById("customflair").value;
      const newPostID = "p" + Date.now();
      if (customFlair.trim() != "") {
        const newFlairID = "lf" + Date.now();
        const newFlair = new LinkFlair(newFlairID, customFlair);
        linkFlairs.push(newFlair);
        linkFlairID = newFlairID;
      }
      const community = communities.find((c) => c.communityID == communityID);
      if (community) {
        console.log(community.communityID, " was updated.");
        community.postIDs.push(newPostID);
      }

      posts.push(
        new Post(
          newPostID,
          title,
          content,
          linkFlairID || null,
          username,
          new Date(),
          [],
          0
        )
      );
      homePage("newest");
      console.log(communities[0]);
      console.log(posts[2]);
      console.log("post should be posted");
    });
  });

  function communityPageView(communityID, sortBy = "newest") {
    const community = communities.find((c) => c.communityID === communityID);
    if (!community) {
      console.error("Community not found:", communityID);
      return;
    }

    const communityPosts = posts.filter((post) =>
      community.postIDs.includes(post.postID)
    );
    const sortedPosts = sortPosts([...communityPosts], sortBy);
    container.innerHTML = `
    <div class="community-page">
      <h2 class="community-name">${community.name}</h2>
      <p class="community-description">${community.description}</p>
      <p class="community-timestamp">Created ${community.startDate.toLocaleString()}</p>

      <p class="community-postcount">${communityPosts.length} post${
      communityPosts.length === 1 ? "" : "s"
    }
      &nbsp;|&nbsp;
      ${community.memberCount} member${
      community.memberCount === 1 ? "" : "s"
    }</p>
    <div class="community-header">
      <div class="sortbuttons">
        <button class="sort" id="newest">Newest</button>
        <button class="sort" id="oldest">Oldest</button>
        <button class="sort" id="active">Active</button>
      </div>
    </div>
      <div class="post-list">
        ${sortedPosts.map(communityPostHTML).join("")}
      </div>
    </div>
    `;
    document
      .getElementById("newest")
      .addEventListener("click", () =>
        communityPageView(communityID, "newest")
      );
    document
      .getElementById("oldest")
      .addEventListener("click", () =>
        communityPageView(communityID, "oldest")
      );
    document
      .getElementById("active")
      .addEventListener("click", () =>
        communityPageView(communityID, "active")
      );

    const viewButtons = document.querySelectorAll(".view-post-button");
    viewButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const postID = btn.dataset.postId;
        console.log("View Post clicked for:", postID);
        postDetailView(postID);
      });
    });
  }

  function communityPostHTML(post) {
    const flair = linkFlairs.find((lf) => lf.linkFlairID == post.linkFlairID);
    const commentCount = commentCounter(post.commentIDs);
    return `
   <div class="post">
        <div class="postinfo">
          <span class="postusername">${post.postedBy}</span> |
          <span class="postdate">${formatTimestamp(post.postedDate)}</span>
        </div>
        <div class="posttitle">${post.title}</div>
        <div class="linkflair">${flair ? flair.content : ""}</div>
        <div class="postcontent">${post.content.substring(0, 20)}...</div>
        <div class="postbottom">
          <span class="postviews">Views: ${post.views}</span>
          <span class="postcomments">Comments: ${commentCount}</span>
        </div>
        <button class="view-post-button" data-post-id="${post.postID}">
          View Post
        </button>
      </div>`;
  }

  function buildCommentThread(commentIDs, indentLevel = 0) {
    if (!commentIDs || commentIDs.length === 0) {
      return "";
    }
    const sortedComments = commentIDs
      .map((cid) => comments.find((c) => c.commentID === cid))
      .filter((c) => c)
      .sort((a, b) => b.commentedDate - a.commentedDate);
    let html = "";
    sortedComments.forEach((comment) => {
      html += ` <div class="comment-item" style="margin-left:${
        indentLevel * 2
      }em;">
    <div class="reply-wrapper">
      <div class="comment-info">
        <span class="comment-username">${comment.commentedBy}</span> |
        <span class="comment-date">${formatTimestamp(
          comment.commentedDate
        )}</span>
      </div>
      <div class="comment-content">${comment.content}</div>
      <button class="reply-btn" comment-id="${comment.commentID}">Reply</button>
        </div>
      ${buildCommentThread(comment.commentIDs, indentLevel + 1)}
      </div>`;
    });
    return html;
  }

  function postDetailView(postID) {
    const post = posts.find((p) => p.postID === postID);
    if (!post) {
      console.error("Post not found:", postID);
      return;
    }

    post.views = (post.views || 0) + 1;

    const community = communities.find((c) => c.postIDs.includes(postID));
    const communityName = community ? community.name : "Unknown Community";
    const flair = linkFlairs.find((lf) => lf.linkFlairID === post.linkFlairID);
    const totalComments = commentCounter(post.commentIDs);
    container.innerHTML = `
  <div class="post-page">
    <div class="post-page-topline">
      <span class="community-name">${communityName}</span> |
      <span class="post-date">${formatTimestamp(post.postedDate)}</span>
    </div>
    <div class="post-page-username">${post.postedBy}</div>
    <h2 class="post-page-title">${post.title}</h2>
    ${
      flair
        ? `<div class="post-page-flair">${flair.content}</div>`
        : `<div class="post-page-flair"></div>`
    }
    <div class="post-page-content">${post.content}</div>
    <div class="post-page-stats">
      <span class="view-count">Views: ${post.views}</span>
      <span class="comment-count">Comments: ${totalComments}</span>
    </div>
    <button class="add-comment-btn" data-post-id="${post.postID}">
      Add a comment
    </button>


    <hr style="border:2px solid black; margin:1em 0;" />
    <div class="post-page-comments">
      ${buildCommentThread(post.commentIDs, 0)}
      </div>
    <button class="back-btn">Back</button>
    </div>  `;

    attachPostPageEvents(postID);
  }

  function attachPostPageEvents(postID) {
    const post = posts.find((p) => p.postID === postID);
    if (!post) return;
    const backBtn = document.querySelector(".back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        homePage("newest");
      });
    }
    const addCommentBtn = document.querySelector(".add-comment-btn");
    if (addCommentBtn) {
      addCommentBtn.addEventListener("click", () => {
        commentForm(postID);
      });
    }
    document.querySelectorAll(".reply-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const commentID = this.getAttribute("comment-id");
        replyForm(commentID, postID);
      });
    });
  }

  // commentForm
  function commentForm(postID) {
    container.innerHTML = `
    <div class="newcomment">
      <div class="icon commenticon">Add a New Comment</div>
      <form class="commentform">
        <label for="commentcontent">Comment (required, max 500 characters):</label>
        <textarea id="commentcontent" name="content" maxlength="500" required></textarea>

        <label for="commentusername">Username (required):</label>
        <input type="text" id="commentusername" name="username" required />

        <button type="submit">Submit Comment</button>
      </form>
    </div>
  `;

    const commentForm = document.querySelector(".commentform");
    commentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitComment(postID);
    });
  }

  function submitComment(postID) {
    const content = document.getElementById("commentcontent").value.trim();
    const username = document.getElementById("commentusername").value.trim();
    const newCommentID = "c" + Date.now();
    const newComment = new Comment(
      newCommentID,
      content,
      username,
      new Date(),
      []
    );
    comments.push(newComment);
    const post = posts.find((p) => p.postID === postID);
    if (post) {
      post.commentIDs.push(newCommentID);
    }
    postDetailView(postID);
  }

  //reply comment form literally copy paste
  function replyForm(mainCommentID, postID) {
    container.innerHTML = `
    <div class="newcomment">
      <div class="icon commenticon">Add a New Comment</div>
      <form class="commentform">
        <label for="commentcontent">Comment (required, max 500 characters):</label>
        <textarea id="commentcontent" name="content" maxlength="500" required></textarea>

        <label for="commentusername">Username (required):</label>
        <input type="text" id="commentusername" name="username" required />

        <button type="submit">Submit Comment</button>
      </form>
    </div>
  `;

    const commentForm = document.querySelector(".commentform");
    commentForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitReply(mainCommentID, postID);
    });
  }

  function submitReply(mainCommentID, postID) {
    const content = document.getElementById("commentcontent").value.trim();
    const username = document.getElementById("commentusername").value.trim();
    const newCommentID = "c" + Date.now();
    const newComment = new Comment(
      newCommentID,
      content,
      username,
      new Date(),
      []
    );
    comments.push(newComment);
    const parent = comments.find((p) => p.commentID == mainCommentID);
    if (parent) {
      parent.commentIDs.push(newCommentID);
      console.log("pushed comment to", parent);
    } else {
      console.log("failed", mainCommentID);
    }
    postDetailView(postID);
  }

  homePage("newest"); //open homepage off rip

  const mainicon = document.getElementById("mainicon");
  mainicon.addEventListener("click", function (e) {
    e.preventDefault();
    homePage("newest");
  });
};
