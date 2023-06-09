'use strict';

const request = require('supertest');

const db = require('../db.js');
const app = require('../app');
const Job = require('../models/job');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	adminToken,
	testJobIds
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function() {
	test('works for admins: create non-admin', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'newJob',
				salary: 100000,
				equity: '0.1',
				companyHandle: 'c1'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			job: {
				id: expect.any(Number),
				title: 'newJob',
				salary: 100000,
				equity: '0.1',
				companyHandle: 'c1'
			}
		});
	});
	test('forbids nonAdmin: create non-admin', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'newJob',
				salary: 100000,
				equity: '0.1',
				companyHandle: 'c1'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('works for admin: create admin', async function() {
		const resp = await request(app)
			.post('/users')
			.send({
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				password: 'password-new',
				email: 'new@email.com',
				isAdmin: true
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(201);
		expect(resp.body).toEqual({
			user: {
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				email: 'new@email.com',
				isAdmin: true
			},
			token: expect.any(String)
		});
	});

	test('unauth for anon', async function() {
		const resp = await request(app).post('/jobs').send({
			title: 'newJob',
			salary: 100000,
			equity: '0.1',
			companyHandle: 'c1'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request if missing data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'newJob'
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test('bad request if invalid data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				username: 'u-new',
				firstName: 'First-new',
				lastName: 'Last-newL',
				password: 'password-new',
				email: 'not-an-email',
				isAdmin: true
			})
			.set('authorization', `Bearer ${adminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */

describe('GET /jobs', function() {
	test('ok for nonAdmin', async function() {
		const resp = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);

		expect(resp.body).toEqual({
			jobs: [
				{
					id: expect.any(Number),
					title: 'J1',
					salary: 1,
					equity: '0.1',
					companyHandle: 'c1',
					companyName: 'C1'
				},
				{
					id: expect.any(Number),
					title: 'J2',
					salary: 2,
					equity: '0.2',
					companyHandle: 'c1',
					companyName: 'C1'
				},
				{
					id: expect.any(Number),
					title: 'J3',
					salary: 3,
					equity: null,
					companyHandle: 'c1',
					companyName: 'C1'
				}
			]
		});
	});
	test('valid minSalary query', async function() {
		const resp = await request(app).get('/jobs').query({ minSalary: 2 });

		expect(resp.status).toEqual(200);
		console.log(resp.body.jobs);
		expect(resp.body.jobs.length).toEqual(2);
	});

	test('valid hasEquity query', async function() {
		const resp = await request(app).get('/jobs').query({ hasEquity: true });

		expect(resp.status).toEqual(200);
		console.log(resp.body.jobs);
		expect(resp.body.jobs.length).toEqual(2);
	});

	test('valid hasEquity and minSalary query', async function() {
		const resp = await request(app).get('/jobs').query({ hasEquity: true, minSalary: 2 });

		expect(resp.status).toEqual(200);
		console.log(resp.body.jobs);
		expect(resp.body.jobs.length).toEqual(1);
		expect(resp.body.jobs[0].title).toEqual('J2');
	});

	test('invalid query key', async function() {
		const resp = await request(app).get('/jobs').query({ min: 2, wrong: 'wrong' });
		expect(resp.statusCode).toEqual(400);
	});

	test('fails: test next() handler', async function() {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query('DROP TABLE jobs CASCADE');
		const resp = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});
});

describe('GET jobs/id', () => {
	test('works', async () => {
		const response = await request(app).get(`/jobs/${testJobIds[0]}`);

		expect(response.status).toEqual(200);
		expect(response.body.job.title).toEqual('J1');
	});

	test('returns 404 if no id', async () => {
		const response = await request(app).get(`/jobs/9999999`);

		expect(response.status).toEqual(404);
	});
});

describe('PATCH jobs/id', () => {
	test('works with admin', async () => {
		const response = await request(app)
			.patch(`/jobs/${testJobIds[0]}`)
			.send({ salary: 400, title: 'newName' })
			.set('authorization', `Bearer ${adminToken}`);

		console.log(response.body);

		expect(response.body.job.title).toEqual('newName');

		expect(response.body.job.salary).toEqual(400);
	});

	test('fails with non-admin', async () => {
		const response = await request(app)
			.patch(`/jobs/${testJobIds[0]}`)
			.send({ salary: 400, title: 'newName' })
			.set('authorization', `Bearer ${u1Token}`);

		console.log(response.body);

		expect(response.status).toEqual(401);
	});
});

describe('DELETE jobs/id', () => {
	test('works with admin', async () => {
		const response = await request(app)
			.delete(`/jobs/${testJobIds[0]}`)
			.set('authorization', `Bearer ${adminToken}`);

		expect(response.status).toEqual(200);
	});

	test('returns 404 with admin', async () => {
		const response = await request(app).delete(`/jobs/0`).set('authorization', `Bearer ${adminToken}`);

		expect(response.status).toEqual(404);
	});

	test('fails without admin', async () => {
		const response = await request(app).delete(`/jobs/${testJobIds[0]}`).set('authorization', `Bearer ${u1Token}`);

		expect(response.status).toEqual(401);
	});
});
