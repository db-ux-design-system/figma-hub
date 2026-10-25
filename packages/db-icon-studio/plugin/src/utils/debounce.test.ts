/**
 * Debounce Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce, debounceWithCancel } from "./debounce.js";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should delay function execution", () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced();
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should only execute once after multiple rapid calls", () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced();
    debounced();
    debounced();
    debounced();

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should reset the timer on each call", () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced();
    vi.advanceTimersByTime(50);

    debounced(); // Reset timer
    vi.advanceTimersByTime(50);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to the debounced function", () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced("arg1", "arg2", 123);
    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledWith("arg1", "arg2", 123);
  });

  it("should use the latest arguments when called multiple times", () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced("first");
    debounced("second");
    debounced("third");

    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith("third");
  });

  it("should allow multiple executions with sufficient delay", () => {
    const func = vi.fn();
    const debounced = debounce(func, 100);

    debounced();
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);

    debounced();
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(2);
  });
});

describe("debounceWithCancel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have a cancel method", () => {
    const func = vi.fn();
    const debounced = debounceWithCancel(func, 100);

    expect(typeof debounced.cancel).toBe("function");
  });

  it("should cancel pending invocations", () => {
    const func = vi.fn();
    const debounced = debounceWithCancel(func, 100);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(100);
    expect(func).not.toHaveBeenCalled();
  });

  it("should allow execution after cancel if called again", () => {
    const func = vi.fn();
    const debounced = debounceWithCancel(func, 100);

    debounced();
    debounced.cancel();
    debounced();

    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple cancels safely", () => {
    const func = vi.fn();
    const debounced = debounceWithCancel(func, 100);

    debounced();
    debounced.cancel();
    debounced.cancel();
    debounced.cancel();

    vi.advanceTimersByTime(100);
    expect(func).not.toHaveBeenCalled();
  });

  it("should cancel and allow new invocation", () => {
    const func = vi.fn();
    const debounced = debounceWithCancel(func, 100);

    debounced("first");
    vi.advanceTimersByTime(50);
    debounced.cancel();

    debounced("second");
    vi.advanceTimersByTime(100);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith("second");
  });
});
