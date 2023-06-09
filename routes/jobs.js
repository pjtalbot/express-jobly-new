/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError, NotFoundError } = require('../expressError');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth');
const Job = require('../models/job');

const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');
const jobSearchSchema = require('../schemas/jobSearch.json');

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { id, title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post('/', ensureAdmin, async function(req, res, next) {
	try {
		const validator = jsonschema.validate(req.body, jobNewSchema);
		console.log(validator);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}

		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

router.get('/', async function(req, res, next) {
	const query = req.query;

	if (query.minSalary !== undefined) query.minSalary = +query.minSalary;
	query.hasEquity = query.hasEquity === 'true';

	try {
		const validator = jsonschema.validate(query, jobSearchSchema);
		console.log(validator);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		const jobs = await Job.findAll(query);
		console.log(jobs);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

router.get('/:id', async function(req, res, next) {
	try {
		const job = await Job.get(req.params.id);
		return res.json({ job });
	} catch (error) {
		return next(error);
	}
});

router.patch('/:id', ensureAdmin, async (req, res, next) => {
	try {
		const id = req.params.id;
		const data = req.body;

		const job = await Job.update(id, data);
		return res.json({ job });
	} catch (error) {
		return next(error);
	}
});

router.delete('/:id', ensureAdmin, async (req, res, next) => {
	try {
		const id = req.params.id;

		const job = await Job.remove(id);

		if (!job) throw new NotFoundError(`Delete Failed. ID ${id} not found`);
		return res.json({ job });
	} catch (error) {
		return next(error);
	}
});
module.exports = router;
