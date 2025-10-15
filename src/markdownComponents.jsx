// // markdownComponents.js
// const markdownComponents = {
//   h1: ({ children }) => (
//     <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-4">{children}</h1>
//   ),
//   h2: ({ children }) => (
//     <h2 className="text-2xl font-semibold text-gray-800 mt-5 mb-3">
//       {children}
//     </h2>
//   ),
//   h3: ({ children }) => (
//     <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">
//       {children}
//     </h3>
//   ),
//   h4: ({ children }) => (
//     <h4 className="text-lg font-semibold text-gray-700 mt-3 mb-2">
//       {children}
//     </h4>
//   ),
//   h5: ({ children }) => (
//     <h5 className="text-base font-semibold text-gray-700 mt-2 mb-1">
//       {children}
//     </h5>
//   ),
//   h6: ({ children }) => (
//     <h6 className="text-sm font-semibold text-gray-600 mt-2 mb-1 uppercase">
//       {children}
//     </h6>
//   ),
//   p: ({ children }) => (
//     <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
//   ),
//   ul: ({ children }) => (
//     <ul className="list-disc ml-6 space-y-1 text-gray-700 mb-4">{children}</ul>
//   ),
//   ol: ({ children }) => (
//     <ol className="list-decimal ml-6 space-y-1 text-gray-700 mb-4">
//       {children}
//     </ol>
//   ),
//   li: ({ children }) => <li className="leading-relaxed">{children}</li>,
//   blockquote: ({ children }) => (
//     <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-gray-600 my-4">
//       {children}
//     </blockquote>
//   ),
//   a: ({ children, href }) => (
//     <a
//       href={href}
//       className="text-indigo-600 underline hover:text-indigo-800"
//       target="_blank"
//       rel="noopener noreferrer"
//     >
//       {children}
//     </a>
//   ),
//   hr: () => <hr className="my-6 border-gray-300" />,
//   img: ({ src, alt }) => (
//     <img src={src} alt={alt} className="rounded-lg shadow-md my-4" />
//   ),
//   table: ({ children }) => (
//     <div className="overflow-x-auto my-4">
//       <table className="min-w-full border border-gray-200 rounded-lg shadow-sm text-sm">
//         {children}
//       </table>
//     </div>
//   ),
//   thead: ({ children }) => (
//     <thead className="bg-indigo-50 text-indigo-900 font-semibold">
//       {children}
//     </thead>
//   ),
//   tr: ({ children }) => (
//     <tr className="border-b border-gray-200 last:border-0 hover:bg-indigo-50/30 transition">
//       {children}
//     </tr>
//   ),
//   th: ({ children }) => (
//     <th className="px-4 py-2 text-left font-semibold">{children}</th>
//   ),
//   td: ({ children }) => <td className="px-4 py-2 text-gray-700">{children}</td>,
// };
// export default markdownComponents;


const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-6 mb-4 break-words">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mt-5 mb-3 break-words">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mt-4 mb-2 break-words">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base sm:text-lg font-semibold text-gray-700 mt-3 mb-2 break-words">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm sm:text-base font-semibold text-gray-700 mt-2 mb-1 break-words">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-xs sm:text-sm font-semibold text-gray-600 mt-2 mb-1 uppercase break-words">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed mb-4 break-words text-sm sm:text-base">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc ml-5 sm:ml-6 space-y-1 text-gray-700 mb-4 text-sm sm:text-base break-words">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal ml-5 sm:ml-6 space-y-1 text-gray-700 mb-4 text-sm sm:text-base break-words">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed break-words">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-gray-600 my-4 text-sm sm:text-base break-words">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-indigo-600 underline hover:text-indigo-800 break-words"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-6 border-gray-300" />,
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt}
      className="rounded-lg shadow-md my-4 max-w-full h-auto object-contain"
    />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-gray-200 rounded-lg shadow-sm text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-indigo-50 text-indigo-900 font-semibold text-sm sm:text-base">
      {children}
    </thead>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-gray-200 last:border-0 hover:bg-indigo-50/30 transition">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 sm:px-4 py-2 text-left font-semibold break-words">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 sm:px-4 py-2 text-gray-700 break-words">{children}</td>
  ),
};

export default markdownComponents;
