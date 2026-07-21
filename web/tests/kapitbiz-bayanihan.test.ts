import { describe, expect, it } from "vitest";
import {
  bayanihanReducer,
  createInitialBayanihanState,
  SEEDED_BAYANIHAN_POSTS,
  type BayanihanPost,
} from "@/lib/kapitbiz-bayanihan";

describe("Bayanihan Forum State & Reducer", () => {
  it("should have at least 2 default posts on load with correct types and tags", () => {
    const initialState = createInitialBayanihanState();
    expect(initialState.posts.length).toBeGreaterThanOrEqual(2);

    const hasBcpTip = initialState.posts.some((post) => post.tag === "BCP Tips");
    const hasDisasterAlert = initialState.posts.some((post) => post.tag === "Disaster Alert");

    expect(hasBcpTip).toBe(true);
    expect(hasDisasterAlert).toBe(true);

    // Verify properties of seeded posts
    initialState.posts.forEach((post) => {
      expect(post.id).toBeDefined();
      expect(post.authorName).toBeDefined();
      expect(post.authorIndustry).toBeDefined();
      expect(post.title).toBeDefined();
      expect(post.body).toBeDefined();
      expect(post.tag).toBeDefined();
      expect(post.createdAt).toBeDefined();
      expect(typeof post.salamatCount).toBe("number");
      expect(Array.isArray(post.comments)).toBe(true);
    });
  });

  it("should handle add-post action by prepending a post to the top of the feed", () => {
    const initialState = createInitialBayanihanState();
    const originalLength = initialState.posts.length;

    const newPostData = {
      authorName: "Test Shop",
      authorIndustry: "Retail",
      title: "New Preparedness Guide",
      body: "Here is what we did during the last storm.",
      tag: "BCP Tips" as const,
    };

    const action = {
      type: "add-post" as const,
      post: newPostData,
    };

    const nextState = bayanihanReducer(initialState, action);

    expect(nextState.posts.length).toBe(originalLength + 1);
    const addedPost = nextState.posts[0];
    expect(addedPost.title).toBe(newPostData.title);
    expect(addedPost.authorName).toBe(newPostData.authorName);
    expect(addedPost.authorIndustry).toBe(newPostData.authorIndustry);
    expect(addedPost.body).toBe(newPostData.body);
    expect(addedPost.tag).toBe(newPostData.tag);
    expect(addedPost.salamatCount).toBe(0);
    expect(addedPost.comments).toEqual([]);
    expect(addedPost.id).toBeDefined();
    expect(addedPost.createdAt).toBeDefined();
  });

  it("should handle add-post action with pre-defined id and createdAt", () => {
    const initialState = createInitialBayanihanState();
    const action = {
      type: "add-post" as const,
      post: {
        id: "custom-id-123",
        authorName: "Admin",
        authorIndustry: "Support",
        title: "Announcement",
        body: "Please stay safe.",
        tag: "General Q&A" as const,
        createdAt: "2026-07-21T09:00:00Z",
      },
    };

    const nextState = bayanihanReducer(initialState, action);
    const addedPost = nextState.posts[0];
    expect(addedPost.id).toBe("custom-id-123");
    expect(addedPost.createdAt).toBe("2026-07-21T09:00:00Z");
  });

  it("should handle add-comment action by appending it to the specified post's comment list", () => {
    const initialState = createInitialBayanihanState();
    // Use the first seeded post
    const targetPost = initialState.posts[0];
    const targetPostId = targetPost.id;
    const originalCommentCount = targetPost.comments.length;

    const newCommentData = {
      authorName: "Responder Bob",
      body: "Agree with this suggestion!",
    };

    const action = {
      type: "add-comment" as const,
      postId: targetPostId,
      comment: newCommentData,
    };

    const nextState = bayanihanReducer(initialState, action);
    const updatedPost = nextState.posts.find((p) => p.id === targetPostId);

    expect(updatedPost).toBeDefined();
    expect(updatedPost!.comments.length).toBe(originalCommentCount + 1);
    
    const addedComment = updatedPost!.comments[updatedPost!.comments.length - 1];
    expect(addedComment.authorName).toBe(newCommentData.authorName);
    expect(addedComment.body).toBe(newCommentData.body);
    expect(addedComment.id).toBeDefined();
    expect(addedComment.createdAt).toBeDefined();
  });

  it("should handle add-comment action with pre-defined id and createdAt", () => {
    const initialState = createInitialBayanihanState();
    const targetPostId = initialState.posts[0].id;
    
    const action = {
      type: "add-comment" as const,
      postId: targetPostId,
      comment: {
        id: "custom-comment-id",
        authorName: "Critique",
        body: "Nice post.",
        createdAt: "2026-07-21T09:10:00Z",
      },
    };

    const nextState = bayanihanReducer(initialState, action);
    const updatedPost = nextState.posts.find((p) => p.id === targetPostId)!;
    const addedComment = updatedPost.comments.find((c) => c.id === "custom-comment-id");
    
    expect(addedComment).toBeDefined();
    expect(addedComment!.createdAt).toBe("2026-07-21T09:10:00Z");
  });

  it("should handle salamat-post action by incrementing the thank-you (Salamat) count", () => {
    const initialState = createInitialBayanihanState();
    const targetPost = initialState.posts[0];
    const targetPostId = targetPost.id;
    const originalSalamat = targetPost.salamatCount;

    const action = {
      type: "salamat-post" as const,
      postId: targetPostId,
    };

    const nextState = bayanihanReducer(initialState, action);
    const updatedPost = nextState.posts.find((p) => p.id === targetPostId);

    expect(updatedPost).toBeDefined();
    expect(updatedPost!.salamatCount).toBe(originalSalamat + 1);
  });

  it("should not modify other posts during actions", () => {
    const initialState = createInitialBayanihanState();
    if (initialState.posts.length < 2) return;

    const targetPostId = initialState.posts[0].id;
    const otherPostId = initialState.posts[1].id;
    const originalOtherPost = { ...initialState.posts[1] };

    // Increment salamat on post 0
    const action = {
      type: "salamat-post" as const,
      postId: targetPostId,
    };

    const nextState = bayanihanReducer(initialState, action);
    const otherPostAfter = nextState.posts.find((p) => p.id === otherPostId);

    expect(otherPostAfter).toEqual(originalOtherPost);
  });
});
