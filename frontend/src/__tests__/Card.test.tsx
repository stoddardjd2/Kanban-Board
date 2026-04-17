import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardDialog } from "../components/CardDialog";
import type { Card } from "../types";

const noop = () => {};

describe("CardDialog — create mode", () => {
  it("renders the create dialog when open", () => {
    render(
      <CardDialog
        open={true}
        onOpenChange={noop}
        onSubmit={noop}
      />
    );
    expect(screen.getByText("New Card")).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("calls onSubmit with form values when submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CardDialog open={true} onOpenChange={noop} onSubmit={onSubmit} />
    );

    await user.type(screen.getByLabelText(/title/i), "My new card");
    await user.click(screen.getByRole("button", { name: /create card/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: "My new card" })
      );
    });
  });

  it("shows validation error when title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CardDialog open={true} onOpenChange={noop} onSubmit={onSubmit} />
    );

    await user.click(screen.getByRole("button", { name: /create card/i }));

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("closes when Cancel is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <CardDialog open={true} onOpenChange={onOpenChange} onSubmit={noop} />
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("CardDialog — edit mode", () => {
  const existingCard: Card = {
    id: "c1",
    columnId: "col1",
    title: "Existing title",
    description: "Existing desc",
    priority: "HIGH",
    tags: ["bug"],
    assignee: "Alice",
    position: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renders Edit Card title in edit mode", () => {
    render(
      <CardDialog
        open={true}
        onOpenChange={noop}
        card={existingCard}
        onSubmit={noop}
      />
    );
    expect(screen.getByText("Edit Card")).toBeInTheDocument();
  });

  it("pre-populates form fields with existing card data", () => {
    render(
      <CardDialog
        open={true}
        onOpenChange={noop}
        card={existingCard}
        onSubmit={noop}
      />
    );
    expect(screen.getByDisplayValue("Existing title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing desc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
  });
});
