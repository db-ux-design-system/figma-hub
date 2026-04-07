import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "../../test/test-utils";
import { SelectionControls } from "../SelectionControls";

describe("SelectionControls", () => {
  const defaultProps = {
    selectedCount: 0,
    totalCount: 10,
    totalFilteredSets: 10,
    onSelectAll: vi.fn(),
    onSelectExportPage: vi.fn(),
    onClearSelection: vi.fn(),
  };

  it("should show select all and export page buttons when nothing selected", () => {
    render(<SelectionControls {...defaultProps} />);

    expect(
      screen.getByText(/select all icon sets \(10\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/select export-page/i)).toBeInTheDocument();
    expect(screen.queryByText(/clear selection/i)).not.toBeInTheDocument();
  });

  it("should show all three buttons when some icons selected", () => {
    render(<SelectionControls {...defaultProps} selectedCount={5} />);

    expect(screen.getByText(/^select all$/i)).toBeInTheDocument();
    expect(screen.getByText(/select export-page/i)).toBeInTheDocument();
    expect(screen.getByText(/clear selection/i)).toBeInTheDocument();
  });

  it("should show only clear button when all icons selected", () => {
    render(
      <SelectionControls
        {...defaultProps}
        selectedCount={10}
        totalCount={10}
      />,
    );

    expect(screen.getByText(/clear selection/i)).toBeInTheDocument();
    expect(screen.queryByText(/select all/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/select export-page/i)).not.toBeInTheDocument();
  });

  it("should call onSelectAll when select all button clicked", async () => {
    const onSelectAll = vi.fn();
    render(<SelectionControls {...defaultProps} onSelectAll={onSelectAll} />);

    const selectAllButton = screen.getByText(/select all icon sets/i);
    await userEvent.click(selectAllButton);

    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it("should call onSelectExportPage when export page button clicked", async () => {
    const onSelectExportPage = vi.fn();
    render(
      <SelectionControls
        {...defaultProps}
        onSelectExportPage={onSelectExportPage}
      />,
    );

    const exportPageButton = screen.getByText(/select export-page/i);
    await userEvent.click(exportPageButton);

    expect(onSelectExportPage).toHaveBeenCalledTimes(1);
  });

  it("should call onClearSelection when clear button clicked", async () => {
    const onClearSelection = vi.fn();
    render(
      <SelectionControls
        {...defaultProps}
        selectedCount={10}
        totalCount={10}
        onClearSelection={onClearSelection}
      />,
    );

    const clearButton = screen.getByText(/clear selection/i);
    await userEvent.click(clearButton);

    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });
});
