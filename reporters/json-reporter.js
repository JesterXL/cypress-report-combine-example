const mocha = require("mocha")
const { getReportSubject, writeReportFile } = require('./combine-reports')

module.exports = JsonReporter

function JsonReporter(runner) {
  mocha.reporters.Base.call(this, runner)
  const tests = []
  const reportSubscription =
    getReportSubject(runner)
    .subscribe(
      event => event.matchWith({
        Pass: ({ report }) =>
          tests.push(report),
        Fail: ({ report }) => 
          tests.push(report),
        End: _ =>
          Promise.all([
            reportSubscription.unsubscribe(),
            writeReportFile(tests)
          ])
          .then( _ => {
            console.log("Wrote Report.")
          })
          .catch( error => {
            console.log("ERROR writing report:", error)
          })
      })
    )
}