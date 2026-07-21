"use client";

import React, { useState } from "react";
import { MessageSquare, Heart, Plus, X } from "lucide-react";
import {
  BayanihanState,
  BayanihanAction,
  BayanihanTag,
  BayanihanPost
} from "@/lib/kapitbiz-bayanihan";
import HazardAssistDialog from "./HazardAssistDialog";
import styles from "./KapitBizRelay.module.css";

export interface BayanihanScreenProps {
  state: BayanihanState;
  dispatch: React.Dispatch<BayanihanAction>;
  businessName: string;
}

export default function BayanihanScreen({
  state,
  dispatch,
  businessName
}: BayanihanScreenProps) {
  const [selectedTag, setSelectedTag] = useState<BayanihanTag | "All">("All");
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPostIdForComments, setSelectedPostIdForComments] = useState<string | null>(null);

  // New post form states
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState<BayanihanTag>("BCP Tips");
  const [newBody, setNewBody] = useState("");

  // New comment state
  const [newCommentBody, setNewCommentBody] = useState("");

  // Filter posts
  const filteredPosts = selectedTag === "All"
    ? state.posts
    : state.posts.filter((post) => post.tag === selectedTag);

  // Handle post submit
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    dispatch({
      type: "add-post",
      post: {
        authorName: businessName,
        authorIndustry: "Retail/Food", // Default industry matching pilot demo merchant
        title: newTitle.trim(),
        body: newBody.trim(),
        tag: newTag,
      }
    });

    // Reset and close
    setNewTitle("");
    setNewTag("BCP Tips");
    setNewBody("");
    setShowPostModal(false);
  };

  // Handle comment submit
  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newCommentBody.trim()) return;

    dispatch({
      type: "add-comment",
      postId,
      comment: {
        authorName: businessName,
        body: newCommentBody.trim(),
      }
    });

    setNewCommentBody("");
  };

  // Find selected post details for comment modal (retrieve from state to get live updates)
  const activePost = state.posts.find((p) => p.id === selectedPostIdForComments);

  // Tag list helper
  const tags: (BayanihanTag | "All")[] = ["All", "BCP Tips", "Disaster Alert", "General Q&A"];

  const getTagClass = (tag: BayanihanTag) => {
    switch (tag) {
      case "BCP Tips":
        return styles.tagBcp;
      case "Disaster Alert":
        return styles.tagAlert;
      case "General Q&A":
        return styles.tagQa;
      default:
        return "";
    }
  };

  return (
    <section className={styles.bayanihanContainer} aria-label="Bayanihan Forum">
      <div className={styles.bayanihanHeader}>
        <div className={styles.bayanihanHeaderInfo}>
          <p className={styles.eyebrow}>Bayanihan Forum</p>
          <h2 className={styles.bayanihanTitle}>Bayanihan Community</h2>
          <p className={styles.bayanihanSub}>
            Discussions, emergency alerts, and business preparedness tips in Tagum City.
          </p>
        </div>
        <button
          className={styles.postTriggerBtn}
          type="button"
          onClick={() => setShowPostModal(true)}
        >
          <Plus aria-hidden="true" size={18} />
          <span>Mag-post sa Bayanihan</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <nav className={styles.bayanihanFilters} aria-label="Filter posts by category">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`${styles.filterBtn} ${selectedTag === tag ? styles.activeFilter : ""}`}
            onClick={() => setSelectedTag(tag)}
            aria-pressed={selectedTag === tag}
          >
            {tag}
          </button>
        ))}
      </nav>

      {/* Post List */}
      <div className={styles.postFeed} role="feed" aria-label="Bayanihan Post Feed">
        {filteredPosts.length === 0 ? (
          <div className={styles.emptyFeed}>
            <p>Wala pang mga post sa kategoryang ito.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article key={post.id} className={styles.postCard} aria-labelledby={`post-title-${post.id}`}>
              <div className={styles.postCardHeader}>
                <div className={styles.postMeta}>
                  <strong className={styles.postAuthor}>{post.authorName}</strong>
                  <span className={styles.postDivider}>•</span>
                  <span className={styles.postIndustry}>{post.authorIndustry}</span>
                </div>
                <span className={`${styles.tagBadge} ${getTagClass(post.tag)}`}>
                  {post.tag}
                </span>
              </div>

              <h3 id={`post-title-${post.id}`} className={styles.postCardTitle}>
                {post.title}
              </h3>
              <p className={styles.postCardBody}>{post.body}</p>

              <div className={styles.postCardFooter}>
                <button
                  className={styles.actionBtn}
                  type="button"
                  onClick={() => dispatch({ type: "salamat-post", postId: post.id })}
                >
                  <Heart aria-hidden="true" size={16} />
                  <span>Salamat ({post.salamatCount})</span>
                </button>

                <button
                  className={styles.actionBtn}
                  type="button"
                  onClick={() => setSelectedPostIdForComments(post.id)}
                >
                  <MessageSquare aria-hidden="true" size={16} />
                  <span>Komentaryo ({post.comments.length})</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Write Post Modal */}
      {showPostModal && (
        <HazardAssistDialog
          label="Sumulat ng Post"
          focusKey="write-post"
          onClose={() => setShowPostModal(false)}
        >
          <div className={styles.hazardDialogHeader}>
            <span>Bayanihan Forum</span>
            <button
              className={styles.dialogCloseBtn}
              type="button"
              onClick={() => setShowPostModal(false)}
              aria-label="Close form"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <div className={styles.hazardDialogBody}>
            <h2>Sumulat ng Post</h2>
            <p>Magbahagi ng tips, alerts, o katanungan sa komunidad.</p>

            <form onSubmit={handlePostSubmit} className={styles.postForm}>
              <div className={styles.formGroup}>
                <label htmlFor="post-title-input">Pamagat / Title</label>
                <input
                  id="post-title-input"
                  type="text"
                  required
                  placeholder="Ilagay ang pamagat..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  data-hazard-initial-focus
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="post-tag-select">Tag / Kategorya</label>
                <select
                  id="post-tag-select"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value as BayanihanTag)}
                >
                  <option value="BCP Tips">BCP Tips</option>
                  <option value="Disaster Alert">Disaster Alert</option>
                  <option value="General Q&A">General Q&A</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="post-body-input">Detalye / Body</label>
                <textarea
                  id="post-body-input"
                  required
                  rows={4}
                  placeholder="Ano ang nais mong ibahagi?"
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.cancelBtn}
                  type="button"
                  onClick={() => setShowPostModal(false)}
                >
                  Cancel
                </button>
                <button className={styles.submitBtn} type="submit">
                  I-post
                </button>
              </div>
            </form>
          </div>
        </HazardAssistDialog>
      )}

      {/* Comments / Reply Modal */}
      {activePost && (
        <HazardAssistDialog
          label="Mga Komentaryo"
          focusKey={`comments-${activePost.id}`}
          onClose={() => setSelectedPostIdForComments(null)}
        >
          <div className={styles.hazardDialogHeader}>
            <span>Bayanihan Post</span>
            <button
              className={styles.dialogCloseBtn}
              type="button"
              onClick={() => setSelectedPostIdForComments(null)}
              aria-label="Close comments"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
          <div className={styles.hazardDialogBody}>
            <h2>Mga Komentaryo</h2>

            {/* Original Post context */}
            <div className={styles.commentModalPostCard}>
              <div className={styles.postCardHeader}>
                <div className={styles.postMeta}>
                  <strong className={styles.postAuthor}>{activePost.authorName}</strong>
                  <span className={styles.postDivider}>•</span>
                  <span className={styles.postIndustry}>{activePost.authorIndustry}</span>
                </div>
                <span className={`${styles.tagBadge} ${getTagClass(activePost.tag)}`}>
                  {activePost.tag}
                </span>
              </div>
              <h3 className={styles.postCardTitle}>{activePost.title}</h3>
              <p className={styles.postCardBody}>{activePost.body}</p>
            </div>

            {/* List of Comments */}
            <div className={styles.commentsSection}>
              <h4 className={styles.commentsHeaderTitle}>
                Mga tugon ({activePost.comments.length})
              </h4>
              {activePost.comments.length === 0 ? (
                <p className={styles.noCommentsText}>Wala pang komentaryo. Maging una sa pagsagot!</p>
              ) : (
                <div className={styles.commentsList}>
                  {activePost.comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      <div className={styles.commentMeta}>
                        <strong className={styles.commentAuthor}>{comment.authorName}</strong>
                      </div>
                      <p className={styles.commentBody}>{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Form */}
            <form
              onSubmit={(e) => handleCommentSubmit(e, activePost.id)}
              className={styles.commentForm}
            >
              <div className={styles.formGroup}>
                <label htmlFor="comment-body-input" className={styles.visuallyHidden}>
                  Sumulat ng reply
                </label>
                <textarea
                  id="comment-body-input"
                  required
                  rows={2}
                  placeholder="Sumulat ng reply..."
                  value={newCommentBody}
                  onChange={(e) => setNewCommentBody(e.target.value)}
                  data-hazard-initial-focus
                />
              </div>
              <div className={styles.commentFormActions}>
                <button className={styles.replySubmitBtn} type="submit">
                  Mag-reply
                </button>
              </div>
            </form>
          </div>
        </HazardAssistDialog>
      )}
    </section>
  );
}
