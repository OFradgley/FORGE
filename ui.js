function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// ui.js
export const Button = ({
  children,
  ...props
}) => /*#__PURE__*/React.createElement("button", _extends({
  className: "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
}, props), children);
export const Card = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  className: "bg-white rounded-xl shadow-md p-4 w-full"
}, children);
export const CardHeader = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  className: "flex justify-between items-center mb-4"
}, children);
export const CardTitle = ({
  children
}) => /*#__PURE__*/React.createElement("h2", {
  className: "text-2xl font-bold"
}, children);
export const CardContent = ({
  children
}) => /*#__PURE__*/React.createElement("div", null, children);
export const Grid = ({
  cols = 2,
  children
}) => /*#__PURE__*/React.createElement("div", {
  className: `grid grid-cols-${cols} gap-2`
}, children);
export const Field = ({
  label,
  value
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  className: "text-xs text-gray-500"
}, label), /*#__PURE__*/React.createElement("div", {
  className: "font-semibold"
}, value));
export const AttributeBlock = ({
  attr,
  score,
  mod,
  primary,
  check,
  onTogglePrimary
}) => /*#__PURE__*/React.createElement("div", {
  className: "border rounded-lg p-2 text-center bg-gray-50"
}, /*#__PURE__*/React.createElement("div", {
  className: "flex items-center justify-center gap-2"
}, /*#__PURE__*/React.createElement("span", {
  className: "text-sm font-semibold uppercase"
}, attr), /*#__PURE__*/React.createElement("button", {
  className: `w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none ${primary ? "bg-blue-600 border-blue-700" : "bg-white border-gray-300"}`,
  onClick: () => onTogglePrimary(attr),
  title: primary ? "Unset as primary" : "Set as primary",
  style: {
    minWidth: 24,
    minHeight: 24
  }
}, primary && /*#__PURE__*/React.createElement("span", {
  className: "text-white font-bold"
}, "P"))), /*#__PURE__*/React.createElement("div", {
  className: "text-lg font-bold"
}, score), /*#__PURE__*/React.createElement("div", {
  className: "text-sm"
}, "Mod ", mod >= 0 ? `+${mod}` : `${mod}`), /*#__PURE__*/React.createElement("div", {
  className: "text-xs text-gray-500"
}, "Check ", check >= 0 ? `+${check}` : `${check}`));
