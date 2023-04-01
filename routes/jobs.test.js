"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  au1Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "job4",
    salary: 90000,
    equity: 0,
    companyHandle: "c3"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {...newJob, equity: "0", id: expect.any(Number)},
    });
  });

  test("unauth if not admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new"
      })
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newJob,
        salary: -100,
      })
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
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
        ],
    });
  });

  test("filter by title should work", async function () {
    const resp = await request(app).get("/jobs?title=3");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "job3",
            salary: 70000,
            equity: "0.4",
            companyHandle: "c2",
          }
        ],
    });
  });

  test("filter by minSalary should work", async function () {
    const resp = await request(app).get("/jobs?minSalary=60000");
    expect(resp.body).toEqual({
      jobs:
        [
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
        ],
    });
  });

  test("filter by hasEquity should work", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
        [
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
        ],
    });
  });

  test("filter by two filters should work", async function () {
    const resp = await request(app).get("/jobs?minSalary=0&hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
        [
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
        ],
    });
  });

  test("should give error if negative value for salary", async function () {
    const resp = await request(app).get("/jobs?minSalary=-1");
    expect(resp.statusCode).toEqual(400);
  });

  test("should give error if invalid value for filter", async function () {
    const resp = await request(app).get("/jobs?minSalary=a");
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app).get(`/jobs/${job.id}`);
    expect(resp.body).toEqual({
      job: {...job, equity: expect.any(String)}
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/9999`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for users", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        title: "new job title",
      })
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.body).toEqual({
      job: {...job, equity: expect.any(String), title: "new job title"},
    });
  });

  test("unauth for anon", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        title: "new job title",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if not admin", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        title: "new job title",
      }).set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/9999`)
      .send({
        title: "new job title",
      })
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on invalid data", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app)
      .patch(`/jobs/${job.id}`)
      .send({
        equity: 25,
      })
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app)
      .delete(`/jobs/${job.id}`)
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.body).toEqual({ deleted: expect.any(String) });
  });

  test("unauth for anon", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app)
      .delete(`/jobs/${job.id}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if not admin", async function () {
    const jobs = await request(app).get(`/jobs`)
    const job = jobs.body.jobs[0]
    const resp = await request(app)
      .delete(`/jobs/${job.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/9999`)
      .set("authorization", `Bearer ${au1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
