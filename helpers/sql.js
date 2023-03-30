const { BadRequestError } = require("../expressError");

/**
 * Takes data to update and maps it into values usable a sql statement
 * @param {object} dataToUpdate key value pair of data to update
 * @param {object} jsToSql mapping of key from javascript to key in sql (ie. in js the key is firstName but in the database the key is first_name then {'firstName':'first_name'})
 * @returns {object} Object with setCols: the string portion of update sql (ie. col1=$1, col2=$2...) and values: the array of values corresponding to the values in setCols [val1, val2...]
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
