const { BadRequestError } = require('../expressError');
const { sqlForPartialUpdate } = require('./sql');

describe('sqlForPartialUpdate', () => {
	let data = { firstName: 'Aliya', age: 32 };
	let jsSqlNames = { firstName: 'first_name', age: 'age' };

	it('should return query with SQL variable names', () => {
		let { setCols, values } = sqlForPartialUpdate(data, jsSqlNames);

		console.log(values);
		console.log(setCols);

		expect(setCols).toEqual(`"first_name"=$1, "age"=$2`);
	});
	it('should return Error if missing data', () => {
		data = {};

		expect(() => {
			sqlForPartialUpdate(data, jsSqlNames);
		}).toThrow();
	});
});
