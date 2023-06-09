'use strict';

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');
const db = require('../db.js');
const Job = require('./job.js');
const User = require('./user.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, testJobIds } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const j1 = { title: 'j1', salary: 100, equity: 0.1, companyHandle: 'c1' };

/************************************** authenticate */

describe('create', function() {
	test('works', async function() {
		const job = await Job.create(j1);
		expect(job).toEqual({
			id: expect.any(Number),
			title: 'j1',
			salary: 100,
			equity: '0.1',
			companyHandle: 'c1'
		});
	});
});

describe('findAll', function() {
	test('works: no filter', async function() {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: 'Job1',
				salary: 100,
				equity: '0.1',
				companyHandle: 'c1',
				companyName: 'C1'
			},
			{
				id: expect.any(Number),
				title: 'Job2',
				salary: 200,
				equity: '0.2',
				companyHandle: 'c1',
				companyName: 'C1'
			},
			{
				id: expect.any(Number),
				title: 'Job3',
				salary: 300,
				equity: '0',
				companyHandle: 'c1',
				companyName: 'C1'
			},
			{
				id: expect.any(Number),
				title: 'Job4',
				salary: null,
				equity: null,
				companyHandle: 'c1',
				companyName: 'C1'
			}
		]);
	});

	test('works: Salary filter', async function() {
		let jobs = await Job.findAll({ minSalary: 299 });
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: 'Job3',
				salary: 300,
				equity: '0',
				companyHandle: 'c1',
				companyName: 'C1'
			}
		]);
	});

	test('works: hasEquity filter', async function() {
		let filter = { hasEquity: true };
		let jobs = await Job.findAll(filter);
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: 'Job1',
				salary: 100,
				equity: '0.1',
				companyHandle: 'c1',
				companyName: 'C1'
			},
			{
				id: expect.any(Number),
				title: 'Job2',
				salary: 200,
				equity: '0.2',
				companyHandle: 'c1',
				companyName: 'C1'
			}
		]);
	});
});

describe('get(id)', () => {
	test('works', async () => {
		let firstJobId = (await Job.findAll())[0].id;
		console.log(firstJobId);
		let job = await Job.get(firstJobId);

		console.log(job);

		expect(job.title).toEqual('Job1');
		expect(job.companyHandle).toEqual('c1');
	});
});

describe('update(id)', () => {
	test('works', async () => {
		let firstJobId = (await Job.findAll())[0].id;

		let job = await Job.update(firstJobId, { title: 'newJobTitle' });

		console.log(job);

		expect(job.title).toEqual('newJobTitle');
		expect(job.companyHandle).toEqual('c1');
	});
});

describe('delete(id)', () => {
	test('works', async () => {
		let firstJobId = (await Job.findAll())[0].id;

		let job = await Job.remove(firstJobId);

		console.log(job);

		expect(job.id).toEqual(firstJobId);
		expect(job.companyHandle).toEqual('c1');
	});
});
