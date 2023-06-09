const { BadRequestError } = require('../expressError');

// THIS NEEDS SOME GREAT DOCUMENTATION.

// accepts 2 arguments:
// 1st argument: js object <dataToUpdate> format ex: {firstName: 'Aliya', age: 32}
// 2nd argument:  js object <jsToSql> variable names, ex: {firstName: "first_name", age: "age"}

// Function should be called to two deconstructed objects. Ex:

// let {columnsObj, valuesObj} = sqlForPartialUpdate(<data>, <jsToSql>)

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError('No data');

	console.log(jsToSql);

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

	return {
		setCols: cols.join(', '),
		values: Object.values(dataToUpdate)
	};
}

module.exports = { sqlForPartialUpdate };
