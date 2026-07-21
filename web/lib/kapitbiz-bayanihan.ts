export interface BayanihanComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type BayanihanTag = "BCP Tips" | "Disaster Alert" | "General Q&A";

export interface BayanihanPost {
  id: string;
  authorName: string;
  authorIndustry: string;
  title: string;
  body: string;
  tag: BayanihanTag;
  createdAt: string;
  salamatCount: number;
  comments: BayanihanComment[];
}

export interface BayanihanState {
  posts: BayanihanPost[];
}

export type BayanihanAction =
  | {
      type: "add-post";
      post: {
        id?: string;
        authorName: string;
        authorIndustry: string;
        title: string;
        body: string;
        tag: BayanihanTag;
        createdAt?: string;
      };
    }
  | {
      type: "add-comment";
      postId: string;
      comment: {
        id?: string;
        authorName: string;
        body: string;
        createdAt?: string;
      };
    }
  | {
      type: "salamat-post";
      postId: string;
    };

export const SEEDED_BAYANIHAN_POSTS: BayanihanPost[] = [
  {
    id: "post-seed-1",
    authorName: "Maya's Frozen Goods",
    authorIndustry: "Retail/Food",
    title: "Preparing for Power Outages (BCP Tip)",
    body: "Ensure you have a secondary power source or coordinate with a cold chain logistics partner before the hazard season.",
    tag: "BCP Tips",
    createdAt: "2026-07-21T08:00:00Z",
    salamatCount: 3,
    comments: [
      {
        id: "comment-seed-1",
        authorName: "Juan's Sari-Sari Store",
        body: "Solid advice! Cold storage space sharing could be an option too.",
        createdAt: "2026-07-21T08:15:00Z",
      },
    ],
  },
  {
    id: "post-seed-2",
    authorName: "Tagum Disaster Relief Office",
    authorIndustry: "Government",
    title: "Heavy Rain & Flood Warning",
    body: "Low-lying areas in Tagum City are advised to secure inventory and move electronics to elevated areas.",
    tag: "Disaster Alert",
    createdAt: "2026-07-21T08:10:00Z",
    salamatCount: 8,
    comments: [],
  },
];

let bayanihanIdCounter = 0;
function nextBayanihanId(prefix: string): string {
  const uuid = typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;
  bayanihanIdCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${bayanihanIdCounter}`;
}

export function createInitialBayanihanState(): BayanihanState {
  return {
    posts: JSON.parse(JSON.stringify(SEEDED_BAYANIHAN_POSTS)),
  };
}

export function bayanihanReducer(
  state: BayanihanState,
  action: BayanihanAction
): BayanihanState {
  switch (action.type) {
    case "add-post": {
      const newPost: BayanihanPost = {
        id: action.post.id ?? nextBayanihanId("post"),
        authorName: action.post.authorName,
        authorIndustry: action.post.authorIndustry,
        title: action.post.title,
        body: action.post.body,
        tag: action.post.tag,
        createdAt: action.post.createdAt ?? new Date().toISOString(),
        salamatCount: 0,
        comments: [],
      };
      return {
        ...state,
        posts: [newPost, ...state.posts],
      };
    }
    case "add-comment": {
      const newComment: BayanihanComment = {
        id: action.comment.id ?? nextBayanihanId("comment"),
        authorName: action.comment.authorName,
        body: action.comment.body,
        createdAt: action.comment.createdAt ?? new Date().toISOString(),
      };
      return {
        ...state,
        posts: state.posts.map((post) => {
          if (post.id === action.postId) {
            return {
              ...post,
              comments: [...post.comments, newComment],
            };
          }
          return post;
        }),
      };
    }
    case "salamat-post": {
      return {
        ...state,
        posts: state.posts.map((post) => {
          if (post.id === action.postId) {
            return {
              ...post,
              salamatCount: post.salamatCount + 1,
            };
          }
          return post;
        }),
      };
    }
    default:
      return state;
  }
}
