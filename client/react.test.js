import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./src/App";
import "@testing-library/jest-dom";

describe("Create Post button behavior", () => {
  test("should be disabled when user is a guest", async () => {
    render(<App />);

    const guestButton = await screen.findByText(/continue as guest/i);
    await userEvent.click(guestButton);

    const createPostButton = await screen.findByText(/create post/i);
    expect(createPostButton).toBeDisabled();
  });

  test("should be enabled when user is logged in", async () => {
    render(<App />);

    const loginButton = await screen.findByText(/log in/i);
    userEvent.click(loginButton);

    const emailInput = await screen.findByPlaceholderText(/email/i);
    const passwordInput = await screen.findByPlaceholderText(/password/i);
    const loginSubmit = await screen.findByText(/^log in$/i);

    userEvent.type(emailInput, "test@example.com");
    userEvent.type(passwordInput, "password123");
    userEvent.click(loginSubmit);

    const createPostButton = await screen.findByText(/create post/i);
    expect(createPostButton).toBeEnabled();
  });
});