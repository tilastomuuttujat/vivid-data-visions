import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { LongView } from "./LongView";
import framework from "@/data/research/long-view.json";
import evidence from "@/data/murrosmatriisi-evidence.json";
it("kattaa historian ilman aukkoja ja viittaa vain olemassa oleviin tapauksiin", () => {
  expect(framework.periods[0]!.start).toBe(1850);
  expect(framework.periods.at(-1)?.end).toBe(2025);
  framework.periods.forEach((p, i) => {
    if (i) expect(p.start).toBe(framework.periods[i - 1]!.end + 1);
    p.episodes.forEach((code) => expect(evidence.episodes.some((e) => e.code === code)).toBe(true));
  });
  expect(new Set(framework.periods.flatMap((p) => p.episodes)).size).toBe(evidence.episodes.length);
});
it("avaa varhaisen näytön ja pitää tulevaisuuden ehdollisena", () => {
  const onYear = vi.fn();
  render(<LongView onYear={onYear} />);
  fireEvent.click(screen.getByRole("button", { name: /1850–1917/ }));
  expect(onYear).toHaveBeenCalledWith(1917);
  fireEvent.click(screen.getByText(/Näyttö ja keskeiset aukot/));
  expect(screen.getByRole("heading", { name: /1866–1870/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /2025–2050/ }));
  expect(onYear).toHaveBeenLastCalledWith(2050);
  expect(screen.getByText(/Vuosille 2026–2050 ei tässä vaiheessa lasketa/)).toBeInTheDocument();
});
