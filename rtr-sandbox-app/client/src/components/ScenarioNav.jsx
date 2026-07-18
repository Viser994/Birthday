export default function ScenarioNav({
  scenarios,
  activeId,
  completedIds = [],
  onSelect,
}) {
  const groups = scenarios.reduce((acc, scenario) => {
    if (!acc[scenario.group]) acc[scenario.group] = [];
    acc[scenario.group].push(scenario);
    return acc;
  }, {});

  return (
    <aside className="panel scenario-nav">
      <h2>Scenarios</h2>
      <p className="nav-hint">Completed steps stay checked for this browser session.</p>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          {items.map((scenario) => {
            const done = completedIds.includes(scenario.id);
            return (
              <button
                key={scenario.id}
                type="button"
                className={`scenario-btn${activeId === scenario.id ? " active" : ""}${done ? " done" : ""}`}
                onClick={() => onSelect(scenario.id)}
              >
                <span className="scenario-btn-row">
                  <strong>{scenario.title}</strong>
                  {done && <span className="done-mark" title="Completed">✓</span>}
                </span>
                <span>{scenario.iso}</span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
