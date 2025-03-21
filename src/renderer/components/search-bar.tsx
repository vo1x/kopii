export const Searchbar = () => {
  return (
    <div>
      <input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search clipboard history..."
        type="text"
        className="border-gray-700 focus:border-teal-600 border placeholder:text-gray-500 bg-gray-900 outline-none w-full rounded-md p-2 mb-2 text-gray-200"
      />
    </div>
  )
}
