const http = require("http");

describe("Express server", () => {
  it("should respond on port 8000", (done) => {
    http
      .get("http://localhost:8000", (res) => {
        expect(res.statusCode).toBeGreaterThanOrEqual(200);
        expect(res.statusCode).toBeLessThan(500);
        done();
      })
      .on("error", (err) => {
        done.fail(`Server not responding on port 8000: ${err.message}`);
      });
  });
});
