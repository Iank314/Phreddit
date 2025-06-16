// ************** THIS IS YOUR APP'S ENTRY POINT. CHANGE THIS FILE AS NEEDED. **************
// ************** DEFINE YOUR REACT COMPONENTS in ./components directory **************
import "./stylesheets/App.css";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { login, logout } from "./auth";
import { authHeader } from "./auth";

const joinCommunity = (cid, username) => {
  console.log("JOIN → cid=", cid);
  return axios.post(`http://localhost:8000/api/communities/${cid}/join`, {
    username,
  });
};

const leaveCommunity = (cid, username) =>
  axios.post(`http://localhost:8000/api/communities/${cid}/leave`, {
    username,
  });

function canVote(role, reputation) {
  return role !== "guest" && reputation >= 50;
}

function commentCounter(commentIDs, commentsState) {
  let total = commentIDs.length;
  // console.log(total);
  commentIDs.forEach((commentID) => {
    const comment = commentsState.find((c) => c.commentID === commentID);
    if (comment) {
      total = total + commentCounter(comment.commentIDs, commentsState);
    }
  });
  return total;
}

function latestCommentDate(commentIDs, commentsState) {
  let latestDate = null;
  function findDate(ids) {
    ids.forEach((oneID) => {
      const comment = commentsState.find((c) => c.commentID === oneID);
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

function sortPosts(posts, sortby, commentsState) {
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
      const latestA = latestCommentDate(a.commentIDs, commentsState);
      const latestB = latestCommentDate(b.commentIDs, commentsState);
      console.log("sorting");
      const compare =
        new Date(latestB || b.postedDate) - new Date(latestA || a.postedDate);
      if (compare !== 0) {
        return compare;
      } else {
        return new Date(b.postedDate) - new Date(a.postedDate);
      }
    });
  }
  return posts;
}

function formatTimestamp(submission, current = new Date()) {
  submission = new Date(submission);
  if (submission.toDateString() === current.toDateString()) {
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
    const diffDays = Math.floor((current - submission) / (1000 * 60 * 60 * 24));
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

function countComments(commentID, wordList, commentsState) {
  const comment = commentsState.find((c) => c.commentID === commentID);
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
      count += countComments(replyID, wordList, commentsState);
    });
  }
  return count;
}
function sendVote(kind, id, dir, username) {
  return axios
    .post(`http://localhost:8000/api/${kind}/${id}/${dir}`, {
      username,
    })
    .catch((err) => {
      if (
        err.response?.status === 400 &&
        err.response?.data?.error === "already voted"
      ) {
        alert("You’ve already voted on this!");
        return Promise.resolve({ data: { skipped: true } });
      }
      throw err;
    });
}

function findPosts(words, postState, commentsState, communitiesState) {
  const wordList = words.split(" ").map((term) => term.toLowerCase().trim());
  const results = [];
  postState.forEach((post) => {
    const postTitle = post.title.toLowerCase();
    // console.log(postTitle);
    const postContent = post.content.toLowerCase();
    const matchesPost = wordList.some(
      (item) => postTitle.includes(item) || postContent.includes(item)
    );

    let matchesComments = false;
    if (!matchesPost) {
      const hasMatchingComment = post.commentIDs.some(
        (commentID) =>
          countComments(commentID, wordList, commentsState, communitiesState) >
          0
      );
      matchesComments = hasMatchingComment;
    }
    if (matchesPost || matchesComments) {
      results.push(post);
    }
  });
  return results;
}

function SearchBar({ onSearch }) {
  const [searchValue, setSearchValue] = useState("");
  function handleKeyPress(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const words = searchValue.trim();
      if (words.length > 0) {
        onSearch(words);
      }
    }
  }
  return (
    <input
      className="search"
      placeholder="Search Phreddit"
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      onKeyPress={handleKeyPress}
    />
  );
}

function postHTML(
  post,
  onViewPost,
  communitiesState,
  linkFlairsState,
  commentsState
) {
  const community = communitiesState.find((c) =>
    c.postIDs.includes(post.postID)
  ); //get the community from the post backwards since we sortby
  const linkFlair = linkFlairsState.find((c) => c._id === post.linkFlairID);
  const comment = commentCounter(post.commentIDs, commentsState);

  return (
    <div className="post">
      <div className="postinfo">
        <span className="postcommunity">
          {community ? community.name : "Community Name Not Found"}{" "}
        </span>
        |<span className="postusername"> {post.postedBy}</span> |
        <span className="postdate"> {formatTimestamp(post.postedDate)}</span>
      </div>
      <div className="posttitle">{post.title}</div>
      <div className="linkflair">{linkFlair ? linkFlair.content : ""}</div>
      <div
        className="postcontent"
        dangerouslySetInnerHTML={{
          __html: post.content.substring(0, 80) + "...",
        }}
      ></div>
      <div className="postbottom">
        <span className="postviews"> Views: {post.views} </span>
        <span className="postcomments"> Comments: {comment} </span>
        <span className="postvotes"> Votes: {post.votes}</span>
      </div>
      <button className="view-post-btn" onClick={() => onViewPost(post.postID)}>
        View Post
      </button>
    </div>
  );
}

function CommentForm({
  postID,
  setCurrentView,
  commentsState,
  setCommentsState,
  postState,
  setPostState,
  fetchAllData,
  username,
}) {
  const [content, setContent] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }
    let hyperlinkRegex = /\[([^\]]*)\]\((.*?)\)/g;
    let valid = false;
    let mainContent = trimmedContent.replace(
      hyperlinkRegex,
      function (_, linkText, url) {
        if (!linkText.trim()) {
          console.log("didnt work");
          alert("Link text can't be empty.");
          valid = true;
          return _;
        }
        if (
          !url.trim().startsWith("http://") &&
          !url.trim().startsWith("https://")
        ) {
          console.log("didnt work");
          alert("URL must start with http:// or https://.");
          valid = true;
          return _;
        }
        console.log("success");
        return `<a href="${url}" target="_blank">${linkText}</a>`;
      }
    );
    if (valid) {
      return;
    }
    const newComment = {
      content: mainContent,
      commentedBy: username,
      commentIDs: [],
      postID,
    };

    axios
      .post("http://localhost:8000/api/comments", newComment)
      .then((res) => {
        const createdComment = res.data;
        axios
          .post(`http://localhost:8000/api/posts/${postID}/addComment`, {
            commentID: createdComment._id,
          })
          .then((updateRes) => {
            console.log(updateRes.data);
            fetchAllData();
          })
          .catch((err) => {
            console.error("Error adding commentID to post:", err);
          });
        setContent("");
        setCurrentView("postDetail");
      })
      .catch((err) => {
        console.error("Error creating comment:", err);
      });
  };
  return (
    <div className="newcomment">
      <div className="icon commenticon">Add a New Comment</div>
      <form className="commentform" onSubmit={handleSubmit}>
        <label htmlFor="commentcontent">
          Comment (required, max 500 characters):
        </label>
        <textarea
          id="commentcontent"
          name="content"
          maxLength="500"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <button type="submit">Submit Comment</button>
      </form>
    </div>
  );
}

function CommentThread({
  commentIDs,
  indentLevel = 0,
  commentsState,
  setMainCommentID,
  setCurrentView,
  role,
  userRep,
  fetchAllData,
  username,
}) {
  if (!commentIDs || commentIDs.length === 0) {
    return null;
  }
  const sortedComments = commentIDs
    .map((cid) => commentsState.find((c) => c.commentID === cid))
    .filter((c) => c)
    .sort((a, b) => new Date(b.commentedDate) - new Date(a.commentedDate));

  return (
    <>
      {sortedComments.map((comment) => (
        <div
          key={comment.commentID}
          className="comment-item"
          style={{ marginLeft: `${indentLevel * 2}em` }}
        >
          <div className="reply-wrapper">
            <div className="comment-info">
              <span className="comment-username">{comment.commentedBy}</span> |{" "}
              <span className="comment-date">
                {formatTimestamp(comment.commentedDate)}
              </span>
              <span className="comment-votes"> Votes: {comment.votes}</span>
            </div>
            {canVote(role, userRep) ? (
              <div className="comment-vote-bar">
                <button
                  onClick={() =>
                    sendVote(
                      "comments",
                      comment.commentID,
                      "up",
                      username
                    ).then(fetchAllData)
                  }
                >
                  ▲
                </button>
                <button
                  onClick={() =>
                    sendVote(
                      "comments",
                      comment.commentID,
                      "down",
                      username
                    ).then(fetchAllData)
                  }
                >
                  ▼
                </button>
              </div>
            ) : null}
            <div
              className="comment-content"
              dangerouslySetInnerHTML={{
                __html: comment.content,
              }}
            ></div>
            <button
              className="reply-btn"
              disabled={role === "guest"}
              style={{
                cursor: role === "guest" ? "not-allowed" : "pointer",
                opacity: role === "guest" ? 0.5 : 1,
              }}
              onClick={() => {
                if (role === "guest") return;
                setMainCommentID(comment.commentID);
                fetchAllData();
                setCurrentView("replyComment");
              }}
            >
              Reply
            </button>
          </div>
          <CommentThread
            commentIDs={comment.commentIDs}
            indentLevel={indentLevel + 1}
            commentsState={commentsState}
            setMainCommentID={setMainCommentID}
            setCurrentView={setCurrentView}
            role={role}
            userRep={userRep}
            fetchAllData={fetchAllData}
            username={username}
          />
        </div>
      ))}
    </>
  );
}
function ReplyCommentForm({
  postID,
  setCurrentView,
  mainCommentID,
  commentsState,
  setCommentsState,
  postState,
  setPostState,
  fetchAllData,
  username,
}) {
  const [content, setContent] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }
    let hyperlinkRegex = /\[([^\]]*)\]\((.*?)\)/g;
    let valid = false;
    let mainContent = trimmedContent.replace(
      hyperlinkRegex,
      function (_, linkText, url) {
        if (!linkText.trim()) {
          console.log("didnt work");
          alert("Link text can't be empty.");
          valid = true;
          return _;
        }
        if (
          !url.trim().startsWith("http://") &&
          !url.trim().startsWith("https://")
        ) {
          console.log("didnt work");
          alert("URL must start with http:// or https://.");
          valid = true;
          return _;
        }
        console.log("success");
        return `<a href="${url}" target="_blank">${linkText}</a>`;
      }
    );
    if (valid) {
      return;
    }
    const newReplyComment = {
      content: mainContent,
      commentedBy: username,
      commentIDs: [],
      postID,
    };
    axios
      .post("http://localhost:8000/api/comments", newReplyComment)
      .then((res) => {
        const createdReplyComment = res.data;
        axios
          .post(
            `http://localhost:8000/api/comments/${mainCommentID}/addReply`,
            {
              replyCommentID: createdReplyComment._id,
              postID,
            }
          )
          .then((updateRes) => {
            console.log(updateRes.data);
            fetchAllData();
            setCurrentView("postDetail");
            setContent("");
          })
          .catch((err) => {
            console.error("Error adding reply to comment:", err);
          });
      })
      .catch((err) => {
        console.error("Error creating reply comment:", err);
      });
  };
  return (
    <div className="newcomment">
      <div className="icon commenticon">Add a New Comment</div>
      <form className="commentform" onSubmit={handleSubmit}>
        <label htmlFor="commentcontent">
          Comment (required, max 500 characters):
        </label>
        <textarea
          id="commentcontent"
          name="content"
          maxLength="500"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <button type="submit">Submit Comment</button>
      </form>
    </div>
  );
}

function NavBar({
  onSelectHome,
  onCreateCommunity,
  onSelectCommunity,
  communities,
  isCreatingCommunity,
  selectedCommunityID,
  role = "guest",
  username = "",
}) {
  const sortedCommunities = [...communities].sort((a, b) => {
    const aJoined = username && a.members?.includes(username);
    const bJoined = username && b.members?.includes(username);

    if (aJoined && !bJoined) return -1;
    if (!aJoined && bJoined) return 1;

    if (aJoined && bJoined) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    return new Date(b.startDate) - new Date(a.startDate);
  });
  const createDisabled = role === "guest";
  return (
    <nav className="navbar">
      <a
        href="/home"
        className="nav-link"
        onClick={(e) => {
          e.preventDefault();
          onSelectHome();
        }}
      >
        Home
      </a>
      <span className="delimiter"></span>
      <span className="delimiter2"></span>

      <h2 className="communities-header">Communities</h2>
      <button
        className="create-community-btn"
        style={{
          backgroundColor: createDisabled
            ? "lightgrey"
            : isCreatingCommunity
            ? "#ff5700"
            : "grey",
          cursor: createDisabled ? "not-allowed" : "pointer",
          opacity: createDisabled ? 0.6 : 1,
        }}
        disabled={createDisabled}
        onClick={(e) => {
          e.preventDefault();
          if (createDisabled) return;
          onCreateCommunity();
        }}
      >
        Create Community
      </button>

      <ul className="communities-list">
        {sortedCommunities.map((comm) => (
          <li key={comm.communityID}>
            <a
              href={`/community/${comm.communityID}`}
              className="community-link"
              style={{
                display: "inline-block",
                padding: "2px 8px",
                backgroundColor:
                  comm.communityID === selectedCommunityID
                    ? "red"
                    : "transparent",
                whiteSpace: "normal",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                maxWidth: "150px",
              }}
              onClick={(e) => {
                e.preventDefault();
                onSelectCommunity(comm.communityID);
              }}
            >
              {comm.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

//Added the react components/JSX and copy pasted the old html
function CreateCommunityPage({ currentUser, onSubmit }) {
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Form submitted:", communityName, currentUser, description);
    const trimmedName = communityName.trim();
    const content = description;
    let hyperlinkRegex = /\[([^\]]*)\]\((.*?)\)/g;
    let valid = false;
    let trimmedDescription = content.replace(
      hyperlinkRegex,
      function (_, linkText, url) {
        if (!linkText.trim()) {
          console.log("didnt work");
          alert("Link text can't be empty.");
          valid = true;
          return _;
        }
        if (
          !url.trim().startsWith("http://") &&
          !url.trim().startsWith("https://")
        ) {
          console.log("didnt work");
          alert("URL must start with http:// or https://.");
          valid = true;
          return _;
        }
        console.log("success");
        return `<a href="${url}" target="_blank">${linkText}</a>`;
      }
    );
    if (valid) {
      return;
    }
    if (!trimmedName) {
      setError("Community name cannot be empty");
      return;
    }
    if (trimmedName.length > 100) {
      setError("Community name cannot exceed 100 characters");
      return;
    }

    if (!trimmedDescription) {
      setError("Community description cannot be empty");
      return;
    }
    if (trimmedDescription.length > 500) {
      setError("Community description cannot exceed 500 characters");
      return;
    }
    setError("");
    onSubmit(communityName, trimmedDescription);
    setCommunityName("");
    setDescription("");
  }
  return (
    <div className="create-community-view">
      <h2>Engender Community</h2>
      {error && (
        <div className="error" style={{ color: "red" }}>
          {error}
        </div>
      )}
      <form id="create-community-form" onSubmit={handleSubmit}>
        <label htmlFor="community-name">Community Name:</label>
        <input
          type="text"
          id="community-name"
          required
          value={communityName}
          onChange={(e) => setCommunityName(e.target.value)}
        />
        <label htmlFor="community-description">Description:</label>
        <textarea
          id="community-description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Engender Community</button>
      </form>
    </div>
  );
}

function CommunityPage({
  communityID,
  communities,
  posts,
  sortBy,
  onSortChange,
  onViewPost,
  commentsState,
  role,
  username,
  refreshAll,
  linkFlairsState,
}) {
  const community = communities.find((c) => c.communityID === communityID);
  if (!community) {
    return <div>Community not found: {communityID}</div>;
  }
  const isMember = username && community.members?.includes(username);
  const canJoin = role !== "guest" && !isMember;
  const canLeave = role !== "guest" && isMember;
  const communityPosts = posts.filter((p) =>
    community.postIDs.includes(p.postID)
  );
  const sortedPosts = sortPosts([...communityPosts], sortBy, commentsState);

  return (
    <div className="community-page">
      <h2 className="community-name">{community.name}</h2>
      <p className="community-creator">
        Created&nbsp;
        {new Date(community.startDate).toLocaleString()}&nbsp;by&nbsp;
        {community.createdBy?.username ?? "unknown"}
      </p>
      {canJoin && (
        <button
          className="join-btn"
          onClick={() => joinCommunity(communityID, username).then(refreshAll)}
        >
          Join Community
        </button>
      )}
      {canLeave && (
        <button
          className="leave-btn"
          onClick={() => leaveCommunity(communityID, username).then(refreshAll)}
        >
          Leave Community
        </button>
      )}

      <p
        className="community-description"
        dangerouslySetInnerHTML={{
          __html: community.description,
        }}
      ></p>
      <p className="community-timestamp">
        Created {new Date(community.startDate).toLocaleString()}
      </p>
      <p className="community-postcount">
        {communityPosts.length} post{communityPosts.length === 1 ? "" : "s"}
        &nbsp;|&nbsp;{community.memberCount} member
        {community.memberCount === 1 ? "" : "s"}
      </p>
      <div className="community-header">
        <div className="sortbuttons">
          <button
            className="sort"
            id="newest"
            onClick={() => onSortChange("newest")}
          >
            Newest
          </button>

          <button
            className="sort"
            id="oldest"
            onClick={() => onSortChange("oldest")}
          >
            Oldest
          </button>

          <button
            className="sort"
            id="active"
            onClick={() => onSortChange("active")}
          >
            Active
          </button>
        </div>
      </div>

      <div className="post-list">
        {sortedPosts.map((post) => {
          const commentCount = commentCounter(post.commentIDs, commentsState);
          const linkFlair = linkFlairsState.find(
            (c) => c._id === post.linkFlairID
          );
          return (
            <div className="post" key={post.postID}>
              <div className="postinfo">
                <span className="postusername">{post.postedBy}</span> |
                <span className="postdate">
                  {formatTimestamp(post.postedDate)}
                </span>
              </div>
              <div className="posttitle">{post.title}</div>
              <div className="linkflair">
                {linkFlair ? linkFlair.content : ""}
              </div>
              <div
                className="postcontent"
                dangerouslySetInnerHTML={{
                  __html: post.content.substring(0, 80) + "...",
                }}
              ></div>
              <div className="postbottom">
                <span className="postviews"> Views: {post.views} </span>
                <span className="postcomments"> Comments: {commentCount} </span>
                <span className="postvotes"> Votes: {post.votes}</span>
              </div>
              <button
                className="view-post-btn"
                onClick={() => onViewPost(post.postID)}
              >
                View Post
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PostDetailView({
  postID,
  onBack,
  buildCommentThread,
  postsState,
  setPostsState,
  commentsState,
  setCommentsState,
  setCurrentView,
  setMainCommentID,
  communitiesState,
  linkFlairsState,
  role,
  userRep,
  fetchAllData,
  username,
}) {
  const post = postsState.find((p) => p.postID === postID);
  if (!post) {
    return <div>Post not found</div>;
  }

  const community = communitiesState.find((c) => c.postIDs.includes(postID));
  const communityName = community ? community.name : "Unknown Community";
  const flair = linkFlairsState.find(
    (lf) => lf.linkFlairID === post.linkFlairID
  );
  const totalComments = commentCounter(post.commentIDs, commentsState);
  return (
    <div className="post-page">
      <div className="post-page-topline">
        <span className="community-name">{communityName}</span> |{" "}
        <span className="post-date">{formatTimestamp(post.postedDate)}</span>
      </div>
      <div className="post-page-username">{post.postedBy}</div>
      <h2 className="post-page-title">{post.title}</h2>
      {flair ? (
        <div className="post-page-flair">{flair.content}</div>
      ) : (
        <div className="post-page-flair" />
      )}
      <div
        className="post-page-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>

      <div className="post-page-stats">
        <span className="view-count"> Views: {post.views}</span>
        <span className="vote-count"> Votes: {post.votes}</span>
        <span className="comment-count"> Comments: {totalComments}</span>
      </div>
      {canVote(role, userRep) && (
        <div className="post-vote-bar">
          <button
            className="up"
            onClick={() =>
              sendVote("posts", post.postID, "up", username).then(fetchAllData)
            }
          >
            ▲
          </button>
          <button
            className="down"
            onClick={() =>
              sendVote("posts", post.postID, "down", username).then(
                fetchAllData
              )
            }
          >
            ▼
          </button>
        </div>
      )}
      <button
        className="add-comment-btn"
        disabled={role === "guest"}
        style={{
          cursor: role === "guest" ? "not-allowed" : "pointer",
          opacity: role === "guest" ? 0.5 : 1,
        }}
        onClick={() => {
          if (role === "guest") return;
          fetchAllData();
          setCurrentView("createComment");
        }}
      >
        Add a comment
      </button>

      <hr style={{ border: "2px solid black", margin: "1em 0" }} />
      <div className="post-page-comments">
        <CommentThread
          commentIDs={post.commentIDs}
          indentLevel={0}
          commentsState={commentsState}
          setMainCommentID={setMainCommentID}
          setCurrentView={setCurrentView}
          role={role}
          userRep={userRep}
          fetchAllData={fetchAllData}
          username={username}
        />
      </div>
      <button className="back-btn" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function renderPosts(
  postsArray,
  onViewPost,
  communitiesState,
  linkFlairsState,
  commentsState
) {
  return postsArray.map((p) =>
    postHTML(p, onViewPost, communitiesState, linkFlairsState, commentsState)
  );
}

function normaliseCommunity(raw) {
  return {
    ...raw,
    communityID: raw._id,
    createdByName:
      typeof raw.createdBy === "object"
        ? raw.createdBy.username
        : raw.createdBy,
  };
}

function App() {
  const [userRep, setUserRep] = useState(0);
  const [communitiesState, setCommunitiesState] = useState([]);
  const [commentsState, setCommentsState] = useState([]);
  const [linkFlairsState, setLinkFlairsState] = useState([]);
  const [postState, setPostState] = useState([]);
  const [profileTab, setProfileTab] = useState("posts");

  const fetchAllData = () => {
    axios
      .get("http://localhost:8000/api/communities")
      .then((res) => {
        setCommunitiesState(res.data.map(normaliseCommunity));
      })
      .catch((err) => console.error("Error fetching communities:", err));

    axios
      .get("http://localhost:8000/api/posts")
      .then((res) => {
        const shapedPosts = res.data.map((post) => ({
          ...post,
          postID: post._id,
        }));
        setPostState(shapedPosts);
      })
      .catch((err) => console.error("Error fetching posts:", err));

    axios
      .get("http://localhost:8000/api/comments")
      .then((res) => {
        const shapedComments = res.data.map((comment) => ({
          ...comment,
          commentID: comment._id,
        }));
        setCommentsState(shapedComments);
      })
      .catch((err) => console.error("Error fetching comments:", err));

    axios
      .get("http://localhost:8000/api/linkFlairs")
      .then((res) => {
        setLinkFlairsState(res.data);
      })
      .catch((err) => console.error("Error fetching link flairs:", err));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const [currentView, setCurrentView] = useState("home");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPostID, setSelectedPostID] = useState(null);
  const [sortingMethod, setSortingMethod] = useState("newest");
  const [selectedCommunityID, setSelectedCommunityID] = useState(null);
  const [mainCommentID, setMainCommentID] = useState("");
  const [welcome, setWelcome] = useState("welcome"); // "welcome" = show screen else dont show
  const [welcomeView, setWelcomeView] = useState("initial"); // shift between initial, signup, login screen in welcome
  const [role, setRole] = useState(""); //can be guest, person, admin
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [userID, setUserID] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [impersonate, setImpersonate] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editType, setEditType] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const attachPostTitlesToComments = (allPosts, userComments) => {
    const postMap = new Map(allPosts.map((p) => [String(p._id), p.title]));
    return userComments.map((c) => ({
      ...c,
      postTitle: postMap.get(String(c.postID)) || "[Unknown Post]",
    }));
  };

  const loadProfile = React.useCallback(
    async (uid = userID) => {
      try {
        const [summary, allUsers] = await Promise.all([
          axios.get(`http://localhost:8000/api/profile/${uid}/summary`, {
            headers: authHeader(),
          }),
          role === "admin"
            ? axios.get("http://localhost:8000/api/profile/allUsers", {
                headers: authHeader(),
              })
            : Promise.resolve({ data: null }),
        ]);
        const posts = summary.data.posts ?? [];
        const comments = summary.data.comments ?? [];
        const enrichedComments = attachPostTitlesToComments(
          [...postState, ...posts],
          comments
        );
        console.log(enrichedComments[0]);
        setProfileData({
          ...summary.data,
          comments: enrichedComments,
          users: allUsers.data,
        });
        setProfileTab(role === "admin" ? "users" : "posts");
      } catch (e) {
        alert(e.response?.data?.error || e.message);
      }
    },
    [role, userID]
  );

  const goToSomeone = React.useCallback(
    (uid) => {
      setImpersonate(uid);
      loadProfile(uid);
      setCurrentView("userProfile");
    },
    [loadProfile]
  );

  const plural = {
    post: "posts",
    comment: "comments",
    community: "communities",
    user: "user",
    posts: "posts",
    comments: "comments",
    communities: "communities",
  };

  const API = "http://localhost:8000";
  const saveDoc = (kind, id, patch) =>
    axios.patch(`${API}/api/profile/${plural[kind]}/${id}`, patch, {
      headers: authHeader(),
    });

  const deleteDoc = (kind, id, ask) => {
    if (!window.confirm(ask)) {
      return Promise.resolve();
    }
    const url =
      kind === "community"
        ? `${API}/api/communities/${id}`
        : `${API}/api/profile/${plural[kind]}/${id}`;
    return axios.delete(url, {
      headers: authHeader(),
    });
  };
  //Welcome Page
  function WelcomePopUp() {
    return (
      <div className="overlay">
        <div className="welcomebox">
          {welcomeView === "initial" && <InitialWelcome />}
          {welcomeView === "signup" && <SignUpWelcome />}
          {welcomeView === "login" && <LoginWelcome />}
        </div>
      </div>
    );
  }
  function InitialWelcome() {
    return (
      <div>
        <h2>Welcome to Phreddit</h2>
        <p>Please choose how you'd like to continue:</p>
        <div className="welcomebtns">
          <button onClick={() => setWelcomeView("login")} id="loginBtn">
            Log In
          </button>
          <button onClick={() => setWelcomeView("signup")} id="signupBtn">
            Sign Up
          </button>
          <button
            id="guestBtn"
            onClick={() => {
              setWelcome("");
              setRole("guest");
              setWelcomeView("");
            }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }
  function SignUpWelcome() {
    const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    });

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();

      const {
        firstName,
        lastName,
        email,
        username,
        password,
        confirmPassword,
      } = formData;

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      try {
        const res = await axios.post("http://localhost:8000/api/users/signup", {
          firstName,
          lastName,
          email,
          username,
          password,
          confirmPassword,
        });

        alert("Account created successfully!");
        console.log("New user:", res.data);
        setWelcomeView("initial");
      } catch (err) {
        console.error("Signup error:", err.response?.data || err.message);
        alert(
          "Error creating account: " +
            (err.response?.data?.error || err.message)
        );
      }
    };

    return (
      <div>
        <form className="signupform" onSubmit={handleSubmit}>
          <div className="signupnames">
            <input
              name="firstName"
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit" className="signupsubmit">
            Sign Up
          </button>
        </form>
        <button
          type="button"
          className="signupback"
          onClick={() => setWelcomeView("initial")}
        >
          Back To Welcome
        </button>
      </div>
    );
  }

  function LoginWelcome() {
    const [creds, setCreds] = useState({ email: "", password: "" });
    const handleChange = (e) =>
      setCreds({ ...creds, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const user = await login(creds.email, creds.password);
        setRole(user.role || "person");
        setUsername(user.username);
        setUserID(user.id);
        setUserRep(user.reputation);
        setEmail(creds.email);
        setImpersonate(null);
        await fetchAllData();
        setCurrentView("home");
        setWelcome("");
      } catch (err) {
        alert(
          err.response?.data?.message ||
            "Login failed, make sure your user/password is correct"
        );
      }
    };
    return (
      <div>
        <form className="loginform" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={creds.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={creds.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="loginsubmit">
            Log In
          </button>
        </form>
        <button
          type="button"
          className="loginback"
          onClick={() => setWelcomeView("initial")}
        >
          Back To Welcome
        </button>
      </div>
    );
  }

  function handleSearch(words) {
    const results = findPosts(words, postState, commentsState);
    setSortingMethod("newest");
    setSearchResults(results);
    setSearchTerm(words);
    fetchAllData();
    setCurrentView("search");
    setSelectedCommunityID(null);
  }
  //SEARCH PAGE HTML
  function guestsearchPage(searchTerm, searchResults, sortBy) {
    const sortedPosts = sortPosts(searchResults, sortBy, commentsState);
    return (
      <div className="searchresult">
        <div className="bannersearch">
          <div className="icon">
            {searchResults.length > 0 ? "R" : "No r"}esults for: "{searchTerm}"
          </div>
          <div className="sortbuttons">
            <button
              className="sort"
              id="newest"
              onClick={(e) => {
                e.preventDefault();
                setSortingMethod("newest");
              }}
            >
              Newest
            </button>
            <button
              className="sort"
              id="oldest"
              onClick={(e) => {
                e.preventDefault();
                setSortingMethod("oldest");
              }}
            >
              Oldest
            </button>
            <button
              className="sort"
              id="active"
              onClick={(e) => {
                e.preventDefault();
                setSortingMethod("active");
              }}
            >
              Active
            </button>
          </div>
        </div>
        <p className="postcount">
          {searchResults.length} post{searchResults.length === 1 ? "" : "s"}{" "}
          found
        </p>
        <div className="post-list">
          {renderPosts(
            sortedPosts,
            handleViewPost,
            communitiesState,
            linkFlairsState,
            commentsState
          )}
        </div>
      </div>
    );
  }
  function searchPage(searchTerm, searchResults, sortBy) {
    const sortedCommunityPosts = [];
    const sortedNonCommunityPosts = [];
    for (const post of searchResults) {
      const postCommunity = communitiesState.find((c) =>
        c.postIDs.includes(post.postID)
      );
      if (!postCommunity) continue;

      const isMember = username && postCommunity.members?.includes(username);

      if (isMember) {
        sortedCommunityPosts.push(post);
      } else {
        sortedNonCommunityPosts.push(post);
      }
    }
    const sorted1 = sortPosts(sortedCommunityPosts, sortBy, commentsState);
    const sorted2 = sortPosts(sortedNonCommunityPosts, sortBy, commentsState);

    return (
      <div className="searchresult">
        <div className="bannersearch">
          <div className="icon">
            {searchResults.length > 0 ? "R" : "No r"}esults for: "{searchTerm}"
          </div>
          <div className="sortbuttons">
            <button
              className="sort"
              id="newest"
              onClick={(e) => {
                e.preventDefault();
                setSortingMethod("newest");
              }}
            >
              Newest
            </button>
            <button
              className="sort"
              id="oldest"
              onClick={(e) => {
                e.preventDefault();
                setSortingMethod("oldest");
              }}
            >
              Oldest
            </button>
            <button
              className="sort"
              id="active"
              onClick={(e) => {
                e.preventDefault();
                setSortingMethod("active");
              }}
            >
              Active
            </button>
          </div>
        </div>

        <p className="postcount">
          {searchResults.length} post{searchResults.length === 1 ? "" : "s"}{" "}
          found
        </p>

        <div className="post-list">
          {sorted1.length > 0 && (
            <>
              <div className="comseparator">Your Communities</div>
              {renderPosts(
                sorted1,
                handleViewPost,
                communitiesState,
                linkFlairsState,
                commentsState
              )}
            </>
          )}

          {sorted2.length > 0 && (
            <>
              <div className="comseparator">Other Communities</div>
              {renderPosts(
                sorted2,
                handleViewPost,
                communitiesState,
                linkFlairsState,
                commentsState
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  function handleViewPost(postID) {
    axios
      .post(`http://localhost:8000/api/posts/${postID}/updateViews`, {
        incrementBy: 1,
      })
      .then((res) => {
        console.log("Post views updated:", res.data);
        fetchAllData();
      })
      .catch((err) => {
        console.error("Error updating views:", err);
      });

    setSelectedPostID(postID);
    setCurrentView("postDetail");
  }
  function handleBack() {
    setCurrentView("home");
    setSelectedCommunityID(null);
  }
  // function handleSelectCommunity(communityID) {
  //   setSelectedCommunityID(communityID);
  //   setCurrentView("community");
  // }

  // function handleCreateCommunity() {
  //   setCurrentView("createCommunity");
  // }
  function handleCommunitySubmit(name, description) {
    axios
      .post("http://localhost:8000/api/communities", {
        name,
        description,
        members: [username],
        createdBy: userID,
      })
      .then(({ data }) => {
        fetchAllData();
        setSelectedCommunityID(data._id);
        setCurrentView("community");
      })
      .catch((err) => {
        console.error("Error creating community:", err.response?.data || err);
        alert(err.response?.data?.error || err.message);
      });
  }

  function handleSortChange(method) {
    setSortingMethod(method);
  }
  //HOMEPAGE HTML
  function homePage(sortBy, onViewPost) {
    // console.log(communities[0]);
    const sortedPosts = sortPosts([...postState], sortBy, commentsState);
    return (
      <div className="homepage">
        <div className="bannerhomepage">
          <h2 className="icon" id="homepageicon">
            All Posts
            <div className="sortbuttons">
              <button
                className="sort"
                id="newest"
                onClick={(e) => {
                  e.preventDefault();
                  setSortingMethod("newest");
                }}
              >
                Newest
              </button>
              <button
                className="sort"
                id="oldest"
                onClick={(e) => {
                  e.preventDefault();
                  setSortingMethod("oldest");
                }}
              >
                Oldest
              </button>
              <button
                className="sort"
                id="active"
                onClick={(e) => {
                  e.preventDefault();
                  setSortingMethod("active");
                }}
              >
                Active
              </button>
            </div>
          </h2>
        </div>
        <p className="postcount">{sortedPosts.length} posts</p>
        <div className="post-list">
          {renderPosts(
            sortedPosts,
            onViewPost,
            communitiesState,
            linkFlairsState,
            commentsState
          )}
        </div>
      </div>
    );
  }

  //NEW POST HTML
  function CreatePost({ username }) {
    const [communityID, setCommunityID] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [linkFlairID, setLinkFlairID] = useState("");
    const [customFlair, setCustomFlair] = useState("");
    function changeValue(setFunction, value, name) {
      setFunction(value);
    }

    function submitCreatePost(e) {
      e.preventDefault();
      // This ones correct let hyperlinkRegex = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)?)\)/g;
      let hyperlinkRegex = /\[([^\]]*)\]\((.*?)\)/g;
      let valid = false;
      let mainContent = content.replace(
        hyperlinkRegex,
        function (_, linkText, url) {
          if (!linkText.trim()) {
            console.log("didnt work");
            alert("Link text can't be empty.");
            valid = true;
            return _;
          }
          if (
            !url.trim().startsWith("http://") &&
            !url.trim().startsWith("https://")
          ) {
            console.log("didnt work");
            alert("URL must start with http:// or https://.");
            valid = true;
            return _;
          }
          console.log("success");
          return `<a href="${url}" target="_blank">${linkText}</a>`;
        }
      );
      if (valid) {
        return;
      }
      if (linkFlairID && customFlair.trim() !== "") {
        alert(
          "Please select either a flair or enter a custom flair — not both."
        );
        return;
      }
      let mainLinkFlair = linkFlairID;
      if (customFlair.trim() !== "") {
        axios
          .post("http://localhost:8000/api/linkFlairs", {
            content: customFlair,
          })
          .then((res) => {
            const createdFlair = res.data;
            mainLinkFlair = createdFlair._id;
            console.log("mainlinkflair updated ", mainLinkFlair);
            createPost(mainLinkFlair);
          })
          .catch((err) => console.error(err));
      } else {
        createPost(mainLinkFlair);
      }
      function createPost(mainLinkFlair) {
        const community = communitiesState.find(
          (c) => c.communityID === communityID
        );
        if (community) {
          console.log(community.communityID, " was updated.");
        }

        const newPost = {
          title,
          content: mainContent,
          linkFlairID: mainLinkFlair || null,
          postedBy: username,
          commentIDs: [],
          communityID,
        };

        axios
          .post("http://localhost:8000/api/posts", newPost)
          .then((res) => {
            const createdPost = res.data;
            axios
              .post(
                `http://localhost:8000/api/communities/${communityID}/addPost`,
                {
                  postID: createdPost._id,
                }
              )
              .then((updateRes) => {
                console.log(updateRes.data);
                fetchAllData();
                setSortingMethod("newest");
                setCurrentView("home");
              })
              .catch((err) => {
                console.error("Error updating community:", err);
              });
          })
          .catch((err) => {
            console.error("Error creating post:", err);
          });
      }
    }

    return (
      <div>
        <div className="icon posticon">Create a New Post</div>
        <div className="newpost">
          <form className="postform" onSubmit={submitCreatePost}>
            <label htmlFor="communityselect">Community: </label>
            <select
              id="communityselect"
              name="community"
              value={communityID}
              onChange={(e) =>
                changeValue(setCommunityID, e.target.value, "CommunityID")
              }
              required
            >
              <option value="" disabled>
                Select a community
              </option>
              {[...communitiesState]
                .sort((a, b) => {
                  const aJoined = username && a.members?.includes(username);
                  const bJoined = username && b.members?.includes(username);

                  if (aJoined && !bJoined) return -1;
                  if (!aJoined && bJoined) return 1;

                  if (aJoined && bJoined) {
                    return a.name.localeCompare(b.name, undefined, {
                      sensitivity: "base",
                    });
                  }

                  return new Date(b.startDate) - new Date(a.startDate);
                })
                .map((c) => (
                  <option key={c.communityID} value={c.communityID}>
                    {c.name}
                  </option>
                ))}
            </select>

            <label htmlFor="posttitle">
              Title (required, max 100 characters):
            </label>
            <input
              type="text"
              id="posttitle"
              name="title"
              maxLength={100}
              onChange={(e) => changeValue(setTitle, e.target.value, "Title")}
              required
            />

            <label htmlFor="flairselect">Link Flair (Optional):</label>
            <select
              id="flairselect"
              name="flair"
              value={linkFlairID}
              onChange={(e) =>
                changeValue(setLinkFlairID, e.target.value, "Link Flair")
              }
            >
              <option value="" selected>
                None
              </option>
              {linkFlairsState.map((lf) => (
                <option key={lf._id} value={lf._id}>
                  {lf.content}
                </option>
              ))}
            </select>

            <label htmlFor="customflair">
              Or enter a new flair (optional, max 30 characters):
            </label>
            <input
              type="text"
              id="customflair"
              maxLength={30}
              onChange={(e) =>
                changeValue(setCustomFlair, e.target.value, "Custom Flair")
              }
            />

            <label htmlFor="postcontent">Content:</label>
            <textarea
              id="postcontent"
              name="content"
              onChange={(e) =>
                changeValue(setContent, e.target.value, "Content")
              }
              required
            ></textarea>
            <button type="submit">Submit Post</button>
          </form>
        </div>
      </div>
    );
  }

  const UserProfileView = () => {
    if (!profileData) return <p>Loading…</p>;

    const switchTab = (t) => setProfileTab(t);

    const myCommunities = profileData.communities ?? [];
    const myPosts = profileData.posts ?? [];
    const myComments = profileData.comments ?? [];
    const allUsers = profileData.users ?? [];

    const renderRow = (kind, doc) => {
      const canDelete =
        role === "admin" ||
        (kind !== "user" &&
          !impersonate &&
          (kind !== "community" || String(doc.createdBy) === userID));

      return (
        <li key={doc._id} className="profile-row">
          <span
            className="profile-link"
            style={{ cursor: "pointer", color: "#0078ff" }}
            onClick={() => {
              if (kind === "user") goToSomeone(String(doc._id));
              setEditType(kind);
              setEditTarget(doc);
              if (kind === "community") setCurrentView("editCommunity");
              else if (kind === "post") setCurrentView("editPost");
              else if (kind === "comment") setCurrentView("editComment");
            }}
          >
            {kind === "community" && doc.name}
            {kind === "post" && doc.title}
            {kind === "comment" &&
              `${doc.postTitle ?? "(post)"} – ${doc.content.slice(0, 20)}…`}
            {kind === "user" && `${doc.username} (${doc.reputation})`}
          </span>

          {canDelete && (
            <button
              style={{ marginLeft: 8 }}
              onClick={() =>
                deleteDoc(kind, doc._id, `Really delete this ${kind}?`).then(
                  () => {
                    loadProfile();
                    fetchAllData();
                  }
                )
              }
            >
              Delete
            </button>
          )}
        </li>
      );
    };

    let list = null;
    if (profileTab === "posts") list = myPosts.map((p) => renderRow("post", p));
    if (profileTab === "comments")
      list = myComments.map((c) => renderRow("comment", c));
    if (profileTab === "communities")
      list = myCommunities.map((c) => renderRow("community", c));
    if (profileTab === "users")
      list = allUsers.map((u) => renderRow("user", u));

    return (
      <div className="profilepage">
        <h2>
          {profileData.username}
          {impersonate ? " (impersonated)" : ""}
        </h2>
        <p>Email: {profileData.email}</p>
        <p>Reputation: {profileData.reputation}</p>
        <p>Member since: {new Date(profileData.joined).toLocaleDateString()}</p>

        <div className="profile-tabs">
          {role === "admin" && (
            <button
              className={profileTab === "users" ? "active" : ""}
              onClick={() => switchTab("users")}
            >
              All Users
            </button>
          )}
          <button
            className={profileTab === "posts" ? "active" : ""}
            onClick={() => switchTab("posts")}
          >
            My Posts
          </button>
          <button
            className={profileTab === "comments" ? "active" : ""}
            onClick={() => switchTab("comments")}
          >
            My Comments
          </button>
          <button
            className={profileTab === "communities" ? "active" : ""}
            onClick={() => switchTab("communities")}
          >
            My Communities
          </button>
        </div>

        <ul style={{ marginTop: 16 }}>
          {list.length ? list : <li>(none)</li>}
        </ul>
      </div>
    );
  };
  const EditModal = ({ kind, doc, onSave, onDelete, onClose }) => {
    const [draft, setDraft] = React.useState({ ...doc });

    function handle(evt) {
      setDraft({ ...draft, [evt.target.name]: evt.target.value });
    }

    const save = () => onSave(draft);
    const del = () => window.confirm("Really delete?") && onDelete();

    return (
      <div className="modal">
        <div className="modal-body">
          <h3>Edit {kind.slice(0, -1)}</h3>

          {kind === "communities" && (
            <>
              <label>Name</label>
              <input name="name" value={draft.name} onChange={handle} />
              <label>Description</label>
              <textarea
                name="description"
                value={draft.description}
                onChange={handle}
              />
            </>
          )}

          {kind === "posts" && (
            <>
              <label>Title</label>
              <input name="title" value={draft.title} onChange={handle} />
              <label>Content</label>
              <textarea
                name="content"
                value={draft.content}
                onChange={handle}
              />
            </>
          )}

          {kind === "comments" && (
            <>
              <label>Content</label>
              <textarea
                name="content"
                value={draft.content}
                onChange={handle}
              />
            </>
          )}

          <div className="modal-actions">
            <button onClick={save}>Save</button>
            <button onClick={del} style={{ marginLeft: 8 }}>
              Delete
            </button>
            <button onClick={onClose} style={{ marginLeft: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  function EditCommunityPage({ doc, onSaved }) {
    const [name, setName] = useState(doc?.name || "");
    const [description, setDescription] = useState(doc?.description || "");
    if (!doc) return <p style={{ padding: 20 }}>Hold...</p>;

    async function save(e) {
      e.preventDefault();
      await saveDoc("communities", doc._id, { name, description });
      await onSaved();
    }

    return (
      <div className="create-community-view">
        <h2>Edit Community</h2>
        <form onSubmit={save}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setCurrentView("userProfile")}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  function EditPostPage({ doc, onSaved }) {
    const [title, setTitle] = useState(doc?.title || "");
    const [content, setContent] = useState(doc?.content || "");
    if (!doc) return <p style={{ padding: 20 }}>Hold...</p>;

    async function save(e) {
      e.preventDefault();
      await saveDoc("post", doc._id, { title, content });
      await onSaved();
    }
    return (
      <div className="edit-pane">
        <h2>Edit Post</h2>
        <form onSubmit={save}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
          <label>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setCurrentView("userProfile")}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  function EditCommentPage({ doc, onSaved }) {
    const [content, setContent] = useState(doc?.content || "");

    if (!doc) return <p style={{ padding: 20 }}>Hold...</p>;

    async function save(e) {
      e.preventDefault();
      await saveDoc("comment", doc._id, { content });
      await onSaved();
    }
    return (
      <div className="edit-pane">
        <h2>Edit Comment</h2>
        <form onSubmit={save}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setCurrentView("userProfile")}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  // MAIN HTML
  return (
    <div className="main">
      <div className="banner">
        <a
          className="icon"
          id="mainicon"
          href="/home"
          style={{ color: currentView === "home" ? "#ff5700" : "grey" }}
          onClick={(e) => {
            e.preventDefault();
            setCurrentView("home");
            setSortingMethod("newest");
            setSelectedCommunityID(null);
          }}
        >
          phreddit
        </a>
        <SearchBar onSearch={handleSearch} />
        <button
          className="createpost"
          style={{
            backgroundColor:
              role === "guest"
                ? "lightgrey"
                : currentView === "createPost"
                ? "#ff5700"
                : "lightgrey",
            cursor: role === "guest" ? "not-allowed" : "pointer",
            opacity: role === "guest" ? 0.6 : 1,
          }}
          disabled={role === "guest"}
          onClick={(e) => {
            e.preventDefault();
            if (role === "guest") return;
            fetchAllData();
            setCurrentView("createPost");
            setSortingMethod("newest");
            setSelectedCommunityID(null);
          }}
        >
          Create Post
        </button>
        <button
          className="profilebtn"
          onClick={() => {
            if (role !== "guest") {
              loadProfile();
              fetchAllData();
              setCurrentView("userProfile");
            }
          }}
        >
          {role === "guest" ? "Guest" : username}
        </button>

        {role && (
          <button
            className="logoutbtn"
            onClick={() => {
              logout();
              setRole("");
              setUsername("");
              setImpersonate(null);
              setWelcome("welcome");
              setWelcomeView("initial");
              fetchAllData();
              setCurrentView("home");
            }}
          >
            Logout
          </button>
        )}
      </div>
      {welcome !== "" && <WelcomePopUp />}
      <div className="body">
        <NavBar
          onSelectHome={() => {
            fetchAllData();
            setCurrentView("home");
            setSortingMethod("newest");
            setSelectedCommunityID(null);
          }}
          onCreateCommunity={() => {
            fetchAllData();
            setCurrentView("createCommunity");
            setSelectedCommunityID(null);
          }}
          onSelectCommunity={(communityID) => {
            fetchAllData();
            setSelectedCommunityID(communityID);
            setCurrentView("community");
          }}
          communities={communitiesState}
          isCreatingCommunity={currentView === "createCommunity"}
          selectedCommunityID={selectedCommunityID}
          role={role}
          username={username}
        />
        <div className="container" id="main">
          {currentView === "userProfile" && <UserProfileView />}
          {currentView === "editCommunity" && (
            <EditCommunityPage
              doc={editTarget}
              onSaved={async () => {
                await Promise.all([loadProfile(), fetchAllData()]);
                setCurrentView("userProfile");
              }}
            />
          )}

          {currentView === "editPost" && (
            <EditPostPage
              doc={editTarget}
              onSaved={async () => {
                await Promise.all([loadProfile(), fetchAllData()]);
                setCurrentView("userProfile");
              }}
            />
          )}

          {currentView === "editComment" && (
            <EditCommentPage
              doc={editTarget}
              onSaved={async () => {
                await Promise.all([loadProfile(), fetchAllData()]);
                setCurrentView("userProfile");
              }}
            />
          )}
          {currentView === "home" && homePage(sortingMethod, handleViewPost)}
          {currentView === "search" &&
            role === "guest" &&
            guestsearchPage(searchTerm, searchResults, sortingMethod)}
          {currentView === "search" &&
            role !== "guest" &&
            searchPage(searchTerm, searchResults, sortingMethod)}
          {currentView === "postDetail" && (
            <PostDetailView
              postID={selectedPostID}
              onBack={handleBack}
              buildCommentThread={CommentThread}
              postsState={postState}
              setPostsState={setPostState}
              commentsState={commentsState}
              setCommentsState={setCommentsState}
              setCurrentView={setCurrentView}
              setMainCommentID={setMainCommentID}
              communitiesState={communitiesState}
              linkFlairsState={linkFlairsState}
              role={role}
              userRep={userRep}
              fetchAllData={fetchAllData}
              username={username}
            />
          )}

          {currentView === "createPost" && <CreatePost username={username} />}
          {currentView === "createComment" && (
            <CommentForm
              postID={selectedPostID}
              setCurrentView={setCurrentView}
              commentsState={commentsState}
              setCommentsState={setCommentsState}
              postState={postState}
              setPostState={setPostState}
              linkFlairsState={linkFlairsState}
              setLinkFlairsState={setLinkFlairsState}
              fetchAllData={fetchAllData}
              username={username}
            />
          )}
          {currentView === "replyComment" && (
            <ReplyCommentForm
              postID={selectedPostID}
              setCurrentView={setCurrentView}
              mainCommentID={mainCommentID}
              commentsState={commentsState}
              setCommentsState={setCommentsState}
              postState={postState}
              setPostState={setPostState}
              linkFlairsState={linkFlairsState}
              setLinkFlairsState={setLinkFlairsState}
              fetchAllData={fetchAllData}
              username={username}
            />
          )}
          {currentView === "community" && (
            <CommunityPage
              communityID={selectedCommunityID}
              communities={communitiesState}
              posts={postState}
              sortBy={sortingMethod}
              commentsState={commentsState}
              role={role}
              username={username}
              refreshAll={fetchAllData}
              onSortChange={handleSortChange}
              onViewPost={handleViewPost}
              linkFlairsState={linkFlairsState}
            />
          )}
          {currentView === "createCommunity" && (
            <CreateCommunityPage
              currentUser={username}
              onSubmit={(name, description) =>
                handleCommunitySubmit(name, description)
              }
            />
          )}
        </div>
      </div>
      {editModal && (
        <EditModal
          kind={editModal.kind}
          doc={editModal.doc}
          onSave={async (patch) => {
            await saveDoc(editModal.kind, editModal.doc._id, patch);
            await Promise.all([loadProfile(), fetchAllData()]);
            setEditModal(null);
          }}
          onDelete={async () => {
            await deleteDoc(
              editModal.kind,
              editModal.doc._id,
              "Really delete?"
            );
            await Promise.all([loadProfile(), fetchAllData()]);
            setEditModal(null);
          }}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

export default App;