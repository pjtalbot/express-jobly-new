'use strict';

const db = require('../db');
const bcrypt = require('bcrypt');
const { sqlForPartialUpdate } = require('../helpers/sql');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');

const { BCRYPT_WORK_FACTOR } = require('../config.js');

class Job {
	// id SERIAL PRIMARY KEY,
	// title TEXT NOT NULL,
	// salary INTEGER CHECK (salary >= 0),
	// equity NUMERIC CHECK (equity <= 1.0),
	// company_handle VARCHAR(25) NOT NULL
	//   REFERENCES companies ON DELETE CASCADE

	static async create(data) {
		const { title, salary, equity, companyHandle } = data;

		// checkDuplicate

		// const isDuplicate = async (checkTitle, checkHandle) => {
		// 	const duplicateQuery = `SELECT * FROM jobs
		// 							WHERE title = $1
		// 							AND companyHandle = $1`;

		// 	const duplicateResult = await db.query(duplicateQuery, [ checkTitle, checkHandle ]);

		// 	return duplicateResult.rows;
		// };

		// let duplicateCheck = await isDuplicate(title, companyHandle);

		// if (!duplicateCheck[0]) {
		// 	throw new BadRequestError('Job with same title and company already exists');
		// }

		const result = await db.query(
			`
        INSERT INTO jobs (title,
                          salary,
                          equity,
                          company_handle)
            values ($1, $2, $3, $4)
            returning id,
                      title,
                      salary,
                      equity,
                      company_handle AS "companyHandle"
                      `,
			[ title, salary, equity, companyHandle ]
		);

		let job = result.rows[0];

		return job;
	}

	static async findAll(filter = {}) {
		let baseQuery = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                    FROM jobs j 
                    LEFT JOIN companies AS c ON c.handle = j.company_handle`;

		let values = [];
		let count = 1;

		console.log(filter);

		for (let f in filter) {
			console.log(f);
			console.log(filter[f]);
			console.log(filter);
			if (f == 'minSalary') {
				if (count > 1) {
					baseQuery += ` AND salary >= $1`;
				} else {
					baseQuery += ` WHERE salary >= $1`;
				}
				values.push(filter[f]);

				count++;
			}

			if (f == 'hasEquity' && filter.hasEquity === true) {
				if (count > 1) {
					baseQuery += ` AND equity > 0`;
				} else {
					baseQuery += ` WHERE equity > 0`;
				}

				count++;
			}
		}
		console.log(baseQuery);
		console.log(values);

		const companiesRes = await db.query(`${baseQuery}` + ` ORDER BY title`, values);

		let whereExpressions = [];
		let queries = [];
		return companiesRes.rows;
	}

	static async get(id) {
		let baseQuery = `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle AS "companyHandle"
                    FROM jobs 
                    WHERE id = $1`;

		const jobsRes = await db.query(`${baseQuery}`, [ id ]);
		console.log(jobsRes);
		if (!jobsRes.rows[0]) throw new NotFoundError(`No job with id: ${id}`);

		return jobsRes.rows[0];
	}

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			title: 'title',
			salary: 'salary',
			equity: 'equity'
		});
		const jobIdIdx = '$' + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobIdIdx} 
                      RETURNING id, 
                                title,
								salary, 
                                equity, 
                                company_handle AS "companyHandle"
                                `;
		const result = await db.query(querySql, [ ...values, id ]);

		console.log(querySql);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${id}`);

		return job;
	}

	static async remove(id) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE id = $1
           RETURNING title, id, company_handle AS "companyHandle"`,
			[ id ]
		);
		const job = result.rows[0];
		console.log(job);
		return job;

		if (!job) throw new NotFoundError(`No job: ${id}`);
	}
}

module.exports = Job;
