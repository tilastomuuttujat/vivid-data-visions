/** Wait for a closed group's first render before scrolling to an inner analysis. */
export function revealAnalysis(groupId: string, targetId = groupId) {
  const group = document.getElementById(groupId) as HTMLDetailsElement | null;
  if (!group) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const scroll = () => {
    const target = document.getElementById(targetId);
    if (!target) return false;
    target.scrollIntoView?.({ behavior: "smooth", block: "start" });
    observer?.disconnect();
    clearTimeout(timer);
    return true;
  };
  const observer = new MutationObserver(scroll);
  observer.observe(group, { childList: true, subtree: true });
  group.open = true;
  if (!scroll())
    timer = setTimeout(() => {
      observer?.disconnect();
      group.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }, 1000);
}
