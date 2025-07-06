// ui.js
export const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" {...props}>{children}</button>
);

export const Card = ({ children }) => <div className="bg-white rounded-xl shadow-md p-4 w-full">{children}</div>;
export const CardHeader = ({ children }) => <div className="flex justify-between items-center mb-4">{children}</div>;
export const CardTitle = ({ children }) => <h2 className="text-2xl font-bold">{children}</h2>;
export const CardContent = ({ children }) => <div>{children}</div>;
export const Grid = ({ cols = 2, children }) => <div className={`grid grid-cols-${cols} gap-2`}>{children}</div>;
export const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);
export const AttributeBlock = ({ attr, score, mod, primary, check, onTogglePrimary }) => (
  <div className="border rounded-lg p-2 text-center bg-gray-50">
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm font-semibold uppercase">{attr}</span>
      <button
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none ${primary ? "bg-blue-600 border-blue-700" : "bg-white border-gray-300"}`}
        onClick={() => onTogglePrimary(attr)}
        title={primary ? "Unset as primary" : "Set as primary"}
        style={{ minWidth: 24, minHeight: 24 }}
      >
        {primary && <span className="text-white font-bold">P</span>}
      </button>
    </div>
    <div className="text-lg font-bold">{score}</div>
    <div className="text-sm">Mod {mod >= 0 ? `+${mod}` : `${mod}`}</div>
    <div className="text-xs text-gray-500">Check {check >= 0 ? `+${check}` : `${check}`}</div>
  </div>
);
