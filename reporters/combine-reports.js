const { partial, filter, map, reduce, head } = require('lodash/fp')
const fs = require("fs")
const { Subject } = require('rxjs')
const union = require('folktale/adt/union/union')
const uuidv4 = require('uuid/v4')
const program = require('commander')

const safeStringify = JSON => object => {
  try {
    const result = JSON.stringify(object)
    return Promise.resolve(result)
  } catch (error) {
    return Promise.reject(error)
  }
}

const safeParse = JSON => string => {
    try {
        const result = JSON.parse(string)
        return Promise.resolve(result)
    } catch (error) {
        return Promise.reject(error)
    }
}

const safeWriteFile = fs => path => data =>
  new Promise((success, failure) =>
    fs.writeFile(
      path,
      data,
      error =>
        error
          ? failure(error)
          : success({ path, data })
    )
  )

const safeListReportFiles = fs => path =>
    new Promise((success, failure) =>
        fs.readdir(path, (error, files) =>
            error
            ? failure(error)
            : success(files)
        )
    )

const safeReadFile = fs => path =>
    new Promise((success, failure) =>
        fs.readFile(path, (error, data) =>
            error
            ? failure(error)
            : success(data)
        )
    )

const safeBufferToString = buffer => {
    try {
        const result = buffer.toString()
        return Promise.resolve(result)
    } catch (error) {
        return Promise.reject(error)
    }
}

const safeDeleteFile = fs => path =>
    new Promise((success, failure) =>
        fs.unlink(path, error =>
            error
            ? failure(error)
            : success(path)
        )
    )

const getInterimReportFilenames = fs => path =>
    safeListReportFiles(fs)(path)
    .then(
        filter(
            filename => filename.indexOf(getDatMagicPrefixTho()) > -1
        )
    )
    .then(
        map(
            fileName =>
                `${path}/${fileName}`
        )
    )

const combineReportFiles = JSON => fs => path =>
    getInterimReportFilenames(fs)(path)
    .then( fileNames =>
        Promise.all(
            map(
                safeReadFile(fs)
                , fileNames
            )
        )
    )
    .then( buffers =>
        Promise.all(
            map(
                safeBufferToString
                , buffers
            )
        )
    )
    .then( jsonStrings =>
        Promise.all(
            map(
                safeParse(JSON)
                , jsonStrings
            )
        )
    )
    .then(
        reduce(
            (acc, resultList) =>
                [...acc, head(resultList)]
            , []
        )
    )
    .then(
        safeStringify(JSON)
    )
    .then(
        safeWriteFile(fs)('reports/test-results.json')
    )
    .then( _ =>
        getInterimReportFilenames(fs)(path)
    )
    .then( fileNames =>
        Promise.all(
            map(
                safeDeleteFile(fs)
                , fileNames
            )
        )
    )
    .then( _ =>
        console.log("Combined reports and deleted test result files successfully!")
    )
    .catch( error =>
        console.log('Failed to combine reports:', error)
    )

const createTestResults = JSON => fs => path => tests =>
    safeStringify(JSON)(tests)
    .then(safeWriteFile(fs)(path))
    .then( _ => {
      // eslint-disable-next-line no-console
    //   console.log(`Tests results written to: ${path}`)
    })
    .catch( error => {
      // eslint-disable-next-line no-console
    //   console.log(`JSON Reporter ERROR: ${error.message}`)
    })

const createTestResultsPartial =
    createTestResults(JSON)(fs)

const getPassReport = test => ({
  status: "PASSED",
  title: test.title,
  duration: test.duration
})

const getFailReport = test => ({
  status: "FAILED",
  title: test.title,
  duration: 0
})

const safeMakeDirOkIfExistsAlready = (fs, path) => 
  new Promise((success, failure) =>
    fs.mkdir(
      path,
      error =>
        (error && error.code !== "EEXIST")
        ? failure(error)
        : success(path)
    )
  )

const safeMakeReportsDirectory =
  partial(safeMakeDirOkIfExistsAlready, [fs, "reports"])

const getDatMagicPrefixTho = () =>
        '__combine_dem_cows_'

const getUniqueRandomPath = () =>
    `reports/${getDatMagicPrefixTho()}${uuidv4()}.json`

const writeReportFile = tests => {
//   console.log("writeReportFile, tests:", tests)
  return safeMakeReportsDirectory()
  .then(_ => {
    // console.log("After make directory, writing json file...")
    return createTestResultsPartial(getUniqueRandomPath())(tests)
  })
}

const Report = union('Report', {
    Pass(report) { return { report } },
    Fail(report) { return { report } },
    End() { return {} }
})
const { Pass, Fail, End } = Report

const getReportSubject = runner => {
  const subject = new Subject()
  runner.on("pass", test => {
    // console.log("pass, test:", test)
    subject.next(Pass(getPassReport(test)))
  })
  runner.on("fail", test => {
    // console.log("fail, test:", test)
    subject.next(Fail(getFailReport(test)))
  })
  runner.on("end", _ => {
    // console.log("end")
    subject.next(End())
  })
  return subject
}

module.exports = {
    getReportSubject, 
    writeReportFile,
    combineReportFiles: combineReportFiles(JSON)(fs)
}

if (require.main === module) {
        
    program
    .version('1.0.0')
    .option('-r, --reportsFolder [folder]', 'Folder where your unit tests reports are generated [folder]')
    .parse(process.argv)
    
    combineReportFiles(JSON)(fs)(program.reportsFolder)
    .then( _ => {
        console.log("Unit test reports combined and interim reports deleted successfully!")
    })
    .catch( error => {
        console.log("Failed to combine unit test reports:", error)
    })
}
