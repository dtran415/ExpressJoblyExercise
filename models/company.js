"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * @param {object} searchFilters An object containing search filter parameters
   * @example 
   * {"name": "net", "minEmployees":3, "maxEmployees":6}
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = 
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies`;
    const {name, minEmployees, maxEmployees} = searchFilters;
    const whereClauses = [];
    const whereValues = [];

    if (minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees cannot be less than maxEmployees");
    }

    if (name) {
      whereValues.push(`%${name}%`);
      whereClauses.push(`name ILIKE $${whereValues.length}`);
    }

    if (minEmployees) {
      whereValues.push(minEmployees);
      whereClauses.push(`num_employees >= $${whereValues.length}`);
    }

    if (maxEmployees) {
      whereValues.push(maxEmployees);
      whereClauses.push(`num_employees <= $${whereValues.length}`);
    }

    if (whereValues.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " ORDER BY name";
    const companiesRes = await db.query(query, whereValues);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity}, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl",
                  id, title, salary, equity, company_handle as companyHandle
           FROM companies c
           LEFT JOIN jobs j
            ON c.handle=j.company_handle
           WHERE handle = $1`,
        [handle]);

    const firstRow = companyRes.rows[0];
    if (!firstRow) throw new NotFoundError(`No company: ${handle}`);

    const company = {
      handle: firstRow.handle,
      name: firstRow.name,
      description: firstRow.description,
      numEmployees: firstRow.numEmployees,
      logoUrl: firstRow.logoUrl
    }

    company.jobs = [];
    for (let row of companyRes.rows) {
      if (row.id) {
        const job = {
          id: row.id,
          title: row.title,
          salary: row.salary,
          equity: row.equity
        }

        company.jobs.push(job);
      }
    }

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
