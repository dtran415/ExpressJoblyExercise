"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");
const Job = require("./job.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  test("works", async function () {
    const newJob = {
      title: "job4",
      salary: 80000,
      equity: 0,
      companyHandle: "c3"
    };
    let job = await Job.create(newJob);
    expect(job).toEqual({...newJob, id: expect.any(Number), equity: "0"});

    const result = await db.query(
          `SELECT title, salary, equity, company_handle as "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {...newJob, equity: "0"}
    ]);
  });

  test("fails if salary less than 0", async function () {
    const newJob = {
      title: "job4",
      salary: -1,
      equity: 0,
      companyHandle: "c3"
    };
    try {
      let job = await Job.create(newJob);
      fail();
    } catch (e) {
      expect(e instanceof Error).toBeTruthy();
    }
  });

  test("fails if equity greater than 1", async function () {
    const newJob = {
      title: "job4",
      salary: 0,
      equity: 2,
      companyHandle: "c3"
    };
    try {
      let job = await Job.create(newJob);
      fail();
    } catch (e) {
      expect(e instanceof Error).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "job1",
        salary: 50000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "job2",
        salary: 60000,
        equity: "0.3",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "job3",
        salary: 70000,
        equity: "0.4",
        companyHandle: "c2",
      }
    ]);
  });

  test("filter with title should work", async function() {
    const searchFilters = {title: "2"}
    let jobs = await Job.findAll(searchFilters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "job2",
        salary: 60000,
        equity: "0.3",
        companyHandle: "c1",
      }
    ]);
  });

  test("filter with minSalary should work", async function() {
    const searchFilters = {minSalary: 60000}
    let jobs = await Job.findAll(searchFilters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "job2",
        salary: 60000,
        equity: "0.3",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "job3",
        salary: 70000,
        equity: "0.4",
        companyHandle: "c2",
      }
    ]);
  });

  test("filter with minSalary less than 0 should return error", async function() {
    try {
      const searchFilters = {minSalary: -1}
      let jobs = await Job.findAll(searchFilters);
      fail();
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
    }
  });

  test("filter with hasEquity true should work", async function() {
    const searchFilters = {hasEquity: true}
    let jobs = await Job.findAll(searchFilters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "job2",
        salary: 60000,
        equity: "0.3",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "job3",
        salary: 70000,
        equity: "0.4",
        companyHandle: "c2",
      }
    ]);
  });

  test("filter with hasEquity false should work", async function() {
    const searchFilters = {hasEquity: false}
    let jobs = await Job.findAll(searchFilters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "job1",
        salary: 50000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "job2",
        salary: 60000,
        equity: "0.3",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "job3",
        salary: 70000,
        equity: "0.4",
        companyHandle: "c2",
      }
    ]);
  });

  test("filter with two fields should work", async function() {
    const searchFilters = {minSalary:1, hasEquity: true}
    let jobs = await Job.findAll(searchFilters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "job2",
        salary: 60000,
        equity: "0.3",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "job3",
        salary: 70000,
        equity: "0.4",
        companyHandle: "c2",
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const newJob = {
      title: "job4",
      salary: 80000,
      equity: 0,
      companyHandle: "c3"
    };
    let job = await Job.create(newJob);

    let result = await Job.get(job.id);
    expect(result).toEqual({...job, equity:"0"});
  });

  test("not found if no such Job", async function () {
    try {
      let result = await Job.get(9999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  
  const updateData = {
    title: "New Job Title",
    salary: 100000,
    equity: 0
  };

  test("works", async function () {
    const newJob = {
      title: "job4",
      salary: 80000,
      equity: 0,
      companyHandle: "c3"
    };
    let job = await Job.create(newJob);

    let result = await Job.update(job.id, updateData);
    let updatedJob = {
      ...updateData,
      id: job.id,
      companyHandle: "c3",
      equity: "0"
    }
    expect(result).toEqual(updatedJob);

    result = await db.query(
          `SELECT id, 
          title, 
          salary, 
          equity, 
          company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([updatedJob]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update(9999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const newJob = {
      title: "job4",
      salary: 80000,
      equity: 0,
      companyHandle: "c3"
    };
    let job = await Job.create(newJob);

    await Job.remove(job.id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${job.id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove(9999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
