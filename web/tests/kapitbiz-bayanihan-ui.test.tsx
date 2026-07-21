import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import BayanihanScreen from "@/components/kapitbiz/BayanihanScreen";
import { createInitialBayanihanState, BayanihanState } from "@/lib/kapitbiz-bayanihan";

describe("Bayanihan Screen UI Tests", () => {
  let mockState: BayanihanState;
  const mockDispatch = vi.fn();
  const businessName = "Maya's Frozen Goods";

  beforeEach(() => {
    cleanup();
    mockDispatch.mockClear();
    mockState = createInitialBayanihanState();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders seeded posts and shows basic post details", () => {
    render(
      <BayanihanScreen
        state={mockState}
        dispatch={mockDispatch}
        businessName={businessName}
      />
    );

    // Verify titles of seeded posts are rendered
    expect(screen.getByText("Preparing for Power Outages (BCP Tip)")).toBeInTheDocument();
    expect(screen.getByText("Heavy Rain & Flood Warning")).toBeInTheDocument();

    // Verify tag badges are rendered
    expect(screen.getAllByText("BCP Tips")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Disaster Alert")[0]).toBeInTheDocument();

    // Verify salamat count and comments count are visible
    expect(screen.getByText(/Salamat \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Komentaryo \(1\)/)).toBeInTheDocument();
  });

  it("filters posts by topic tags correctly", async () => {
    const user = userEvent.setup();
    render(
      <BayanihanScreen
        state={mockState}
        dispatch={mockDispatch}
        businessName={businessName}
      />
    );

    // Initially both should show
    expect(screen.getByText("Preparing for Power Outages (BCP Tip)")).toBeInTheDocument();
    expect(screen.getByText("Heavy Rain & Flood Warning")).toBeInTheDocument();

    // Filter by "BCP Tips"
    const bcpFilterBtn = screen.getByRole("button", { name: "BCP Tips" });
    await user.click(bcpFilterBtn);

    expect(screen.getByText("Preparing for Power Outages (BCP Tip)")).toBeInTheDocument();
    expect(screen.queryByText("Heavy Rain & Flood Warning")).not.toBeInTheDocument();

    // Filter by "Disaster Alert"
    const alertFilterBtn = screen.getByRole("button", { name: "Disaster Alert" });
    await user.click(alertFilterBtn);

    expect(screen.queryByText("Preparing for Power Outages (BCP Tip)")).not.toBeInTheDocument();
    expect(screen.getByText("Heavy Rain & Flood Warning")).toBeInTheDocument();

    // Filter by "General Q&A" (which has no posts in seed data)
    const qaFilterBtn = screen.getByRole("button", { name: "General Q&A" });
    await user.click(qaFilterBtn);

    expect(screen.queryByText("Preparing for Power Outages (BCP Tip)")).not.toBeInTheDocument();
    expect(screen.queryByText("Heavy Rain & Flood Warning")).not.toBeInTheDocument();

    // Filter back to "All"
    const allFilterBtn = screen.getByRole("button", { name: "All" });
    await user.click(allFilterBtn);

    expect(screen.getByText("Preparing for Power Outages (BCP Tip)")).toBeInTheDocument();
    expect(screen.getByText("Heavy Rain & Flood Warning")).toBeInTheDocument();
  });

  it("triggers salamat action on click", async () => {
    const user = userEvent.setup();
    render(
      <BayanihanScreen
        state={mockState}
        dispatch={mockDispatch}
        businessName={businessName}
      />
    );

    // Target the first post's salamat button
    // The first post is "post-seed-1"
    const salamatBtns = screen.getAllByRole("button", { name: /Salamat \(/ });
    await user.click(salamatBtns[0]);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: "salamat-post",
      postId: "post-seed-1",
    });
  });

  it("opens the post form modal and submits a new post", async () => {
    const user = userEvent.setup();
    render(
      <BayanihanScreen
        state={mockState}
        dispatch={mockDispatch}
        businessName={businessName}
      />
    );

    // Open write post popup
    const postBtn = screen.getByRole("button", { name: "Mag-post sa Bayanihan" });
    await user.click(postBtn);

    // Dialog should be present
    const dialog = screen.getByRole("dialog", { name: "Sumulat ng Post" });
    expect(dialog).toBeInTheDocument();

    // Fill the form
    const titleInput = screen.getByLabelText("Pamagat / Title");
    const tagSelect = screen.getByLabelText("Tag / Kategorya");
    const bodyInput = screen.getByLabelText("Detalye / Body");
    const submitBtn = screen.getByRole("button", { name: "I-post" });

    await user.type(titleInput, "Test Title");
    await user.selectOptions(tagSelect, "General Q&A");
    await user.type(bodyInput, "Test post body contents.");
    await user.click(submitBtn);

    // Action should be dispatched
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "add-post",
      post: {
        authorName: businessName,
        authorIndustry: "Retail/Food",
        title: "Test Title",
        body: "Test post body contents.",
        tag: "General Q&A",
      },
    });

    // Dialog should close
    expect(screen.queryByRole("dialog", { name: "Sumulat ng Post" })).not.toBeInTheDocument();
  });

  it("opens the comments list modal, displays comments, and posts a reply", async () => {
    const user = userEvent.setup();
    render(
      <BayanihanScreen
        state={mockState}
        dispatch={mockDispatch}
        businessName={businessName}
      />
    );

    // The first seeded post has 1 comment: "Solid advice! Cold storage space sharing could be an option too."
    // Open comments modal for this post
    const commentBtns = screen.getAllByRole("button", { name: /Komentaryo \(/ });
    await user.click(commentBtns[0]);

    // Dialog should be present
    const dialog = screen.getByRole("dialog", { name: "Mga Komentaryo" });
    expect(dialog).toBeInTheDocument();

    const modal = within(dialog);

    // Verify full post title, body, and comments are visible
    expect(modal.getByText("Preparing for Power Outages (BCP Tip)")).toBeInTheDocument();
    expect(modal.getByText("Ensure you have a secondary power source or coordinate with a cold chain logistics partner before the hazard season.")).toBeInTheDocument();
    expect(modal.getByText("Solid advice! Cold storage space sharing could be an option too.")).toBeInTheDocument();
    expect(modal.getByText("Juan's Sari-Sari Store")).toBeInTheDocument();

    // Reply form elements
    const commentInput = modal.getByPlaceholderText("Sumulat ng reply...");
    const replyBtn = modal.getByRole("button", { name: "Mag-reply" });

    await user.type(commentInput, "This is my reply.");
    await user.click(replyBtn);

    // Action should be dispatched
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "add-comment",
      postId: "post-seed-1",
      comment: {
        authorName: businessName,
        body: "This is my reply.",
      },
    });

    // Modal should remain or close depending on implementation (usually remains open to show comments, but clears text area)
    expect(commentInput).toHaveValue("");
  });
});
