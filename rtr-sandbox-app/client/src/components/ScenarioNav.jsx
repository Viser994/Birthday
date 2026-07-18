export default function ScenarioNav({ scenarios, activeId, onSelect }) {
  const groups = scenarios.reduce((acc, scenario) => {
    if (!acc[scenario.group]) acc[scenario.group] = [];
    acc[scenario.group].push(scenario);
    return acc;
  }, {});

  return (
    <aside className="panel scenario-nav">
      <h2>Scenarios</h2>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          {items.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={`scenario-btn${activeId === scenario.id ? " active" : ""}`}
              onClick={() => onSelect(scenario.id)}
            >
              <strong>{scenario.title}</strong>
              <span>{scenario.iso}</span>
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
