const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
    test("should return proper object", function () {
        const dataToUpdate = {
            "firstName":"First",
            "lastName":"Last",
            "email":"email",
            "isAdmin":false
        }
        const jsToSql = {
            firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin"
        }

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual({
            setCols: `"first_name"=$1, "last_name"=$2, "email"=$3, "is_admin"=$4`,
            values: ["First", "Last", "email", false]
        })
    });

    test("should throw error if no keys in object", function() {
        try {
            const dataToUpdate = {}
            const jsToSql = {
                firstName: "first_name",
              lastName: "last_name",
              isAdmin: "is_admin"
            }
            sqlForPartialUpdate(dataToUpdate, jsToSql)
        } catch (e) {
            expect(e instanceof BadRequestError).toBeTruthy();
        }
    });
})