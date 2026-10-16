import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ThemeGroup } from "./ThemeGroup";

afterEach(() => {
  cleanup();
  window.location.hash = "";
});
it("mounts analyses only on first opening and preserves their state when closed", () => {
  const renderChild = vi.fn();
  function Analysis() {
    renderChild();
    return <p>Raskas analyysi</p>;
  }
  const { container } = render(
    <ThemeGroup id="group" index={1} title="Teema" lead="" span="" tags={[]}>
      <Analysis />
    </ThemeGroup>,
  );
  expect(renderChild).not.toHaveBeenCalled();
  const details = container.querySelector("details")!;
  act(() => {
    details.open = true;
    fireEvent(details, new Event("toggle"));
  });
  expect(screen.getByText("Raskas analyysi")).toBeInTheDocument();
  act(() => {
    details.open = false;
    fireEvent(details, new Event("toggle"));
  });
  expect(screen.getByText("Raskas analyysi")).toBeInTheDocument();
});
it("opens an unmounted analysis for deep links and for a group link", () => {
  window.location.hash = "/laboratorio#timeline-care";
  const { container, unmount } = render(
    <ThemeGroup id="group" index={1} title="Teema" lead="" span="" tags={[]}>
      <div id="timeline-care">Hoiva</div>
    </ThemeGroup>,
  );
  expect(container.querySelector("details")).toHaveAttribute("open");
  expect(screen.getByText("Hoiva")).toBeInTheDocument();
  unmount();
  window.location.hash = "group";
  render(
    <ThemeGroup id="group" index={1} title="Teema" lead="" span="" tags={[]}>
      <p>Suora ryhmälinkki</p>
    </ThemeGroup>,
  );
  expect(screen.getByText("Suora ryhmälinkki")).toBeInTheDocument();
});
