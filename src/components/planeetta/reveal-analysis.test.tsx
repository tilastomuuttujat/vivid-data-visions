import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ThemeGroup } from "./ThemeGroup";
import { revealAnalysis } from "./reveal-analysis";

afterEach(cleanup);
it("opens a closed group and scrolls to the analysis after it has mounted", async () => {
  const scroll = vi.fn();
  const { container } = render(
    <ThemeGroup id="group" index={1} title="Teema" lead="" span="" tags={[]}>
      <div
        id="target"
        ref={(node) => {
          if (node) node.scrollIntoView = scroll;
        }}
      >
        Analyysi
      </div>
    </ThemeGroup>,
  );
  expect(screen.queryByText("Analyysi")).not.toBeInTheDocument();
  act(() => {
    revealAnalysis("group", "target");
    fireEvent(container.querySelector("details")!, new Event("toggle"));
  });
  await waitFor(() => expect(scroll).toHaveBeenCalledOnce());
  expect(screen.getByText("Analyysi")).toBeInTheDocument();
});
