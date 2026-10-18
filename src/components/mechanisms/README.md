# Yhteiskunnan kehityspolut 1850–2025

Separate Murrokset tab for seven persistent mechanisms, not a replacement for the existing seven editorial historical anchors or the pinned TTT causal network.

- Power/rights/trust; human capabilities; production/work/renewal; ownership/finance/risk; population/care/regions; energy/nature/environment; international position/security.
- Seven eras form a contiguous 1850–2025 reading path. The era narratives and the seven × seven state captions are explicit editorial interpretation, not numerical observations or scored outcomes.
- Selected events have manual mechanism membership. A shared year line highlights all occurrences of the same event, not a newly inferred source relation. No arrow is drawn between mechanisms.
- Event size marks selection, lane offsets avoid overlap, color identifies mechanism. No visual magnitude encodes policy effectiveness or causal strength.
- Dated decisions use real IDs from lainsaadanto.json. Where enactment and implementation differ (school reform, euro, constitution, welfare areas), the date note says so and the original decision date stays visible in evidence.
- War and the financial/technology shock are background context events with no invented law or decision counterpart. They have dashed circles and an explicit no-decision-link state.
- Sources open original dataset URLs. The decision-card handoff uses the existing DecisionExplorer callback and its exact/context/no-match crosswalk without changes.
- Selecting a dot changes the local reading state without automatic page scrolling. The explicit Lue valinnan tarina control scrolls to the explanation, respecting reduced-motion preference. Era navigation scrolls only the internal timeline. Mechanism labels remain sticky while horizontally scrolling.
- All seven rows remain present when one is emphasized. Reset clears emphasis. Event text buttons offer an alternative to the SVG markers, with keyboard support on both.
- Same component in app and offline/Pages build; no extra live data request.

The selected timeline is not a complete history. The energy/environment row is particularly selective: it does not claim to cover every energy-system transition. The qualitative narratives are hypotheses for reading and discussion, not an independent impact evaluation. Keep chronology, citations and interpretation visibly distinct.

Validation: model tests check era boundaries, actual decision IDs, seven persistent rows and shared chronological positions. Interaction tests cover chapter navigation, keyboard event selection, cross-row selection and source handoff. Browser checks additionally cover sticky labels, mobile overflow and source navigation.

## Question-led main paths

`path-model.ts` defines six curated questions with chronological step IDs and a manually chosen mechanism row for each step. The chosen row must be among the event's existing mechanism memberships. Dashed gold curves show **editorial reading order**, never an inferred causal estimate. Number badges correspond to the text stepper. All seven rows and non-route events remain available; selecting a non-route event or an era exits the route and clears its bridge inspector.

Each bridge opens its editorial rationale, an explicitly unproven branching question, and available exact source relations. `bridgeEvidence` permits only existing directed edges between exact `decision` crosswalk nodes of the two steps. Context mappings, reversed edges and multi-hop shortcuts are excluded. A source relation is labelled a recorded source claim, not independently verified impact research. No evidence is invented if none is available.

All events expose the same six reader questions (need/pressure; actor/choice/alternatives; intended mechanism; observed change/distribution/lag; attribution evidence; next opportunities/constraints). The current dataset does not provide a complete actor/negotiation history, alternative-feasibility record or attributed outcome series. These gaps are stated. Dataset goals and risk assessments are not silently promoted to measured needs or outcomes. Enactment is not equated with goal achievement.

Feedback is offered as a question at the end of the selected route, not a confirmed feedback edge. Routes and steps move only the internal horizontal viewport, not the document. The bridge inspector opens near the route controls without an automatic page jump; its text buttons duplicate SVG hit paths for touch and keyboard readers.

## Progressive landscape entry

`MechanismTimeline` now starts at a deliberately compressed overview, not the full atlas. Seven duration-proportional regions cover the existing eras. Three editorial theme bands connect the reading across time: participation/capacity; livelihood/risk; external connections/environment. These are summaries of the seven mechanisms, not replacement mechanisms, measured trend lines, relative influence scores or new source relations. Mobile uses a vertical chronology without horizontal scrolling.

Selecting a region shows that era's opportunity, unresolved tension and inheritance, plus up to three explicitly curated landmarks. Other events, long question-led routes and the seven mechanism state captions stay behind closed disclosures. A landmark opens the shared `EventReader` with all six questions and exact existing source handoffs. A breadcrumb and back button retain the era context. Returning to the overview clears the route and bridge. Heading focus follows view navigation for keyboard/screen-reader use; no animation is required.

The former dense timeline is preserved as `MechanismExplorer`, explicitly opened from the era's mechanism disclosure and initialized to that era. It shares `EventReader` with the progressive view, preventing evidence/source differences between entry points. Neither the source graph, decision dates, crosswalk nor editorial event memberships changed. No additional runtime data calls are needed for app, Pages or offline exports.

Tests validate proportional durations, landmark membership in the correct era, progressive visibility, exact decision handoff, return navigation and the optional atlas. Existing mechanism and route tests exercise `MechanismExplorer` directly.
