export const FileTable = () => {
  return (
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" id="selectAll" onclick="toggleSelectAll(event)" />
            </th>
            <th>Name</th>
            <th>Owner</th>
            <th>Last modified</th>
            <th>File size</th>
            <th style="width: 50px;"></th>
          </tr>
        </thead>
        <tbody id="file-list-body">
          {/* Populated by JS */}
        </tbody>
      </table>
    </div>
  )
}
