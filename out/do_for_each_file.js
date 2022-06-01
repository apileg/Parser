"use strict";
exports.__esModule = true;
var rxjs_1 = require("rxjs");
function doForEachFile(filenames, action) {
    var subject = new rxjs_1.Subject();
    var failed = false;
    var completedCount = 0;
    var timeout = null;
    var nextBackoffTimeInMs = 2000;
    var postponedFiles = [];
    filenames.forEach(handle);
    return subject.asObservable();
    function handle(file) {
        action(file).then(onCompleted, function (error) { return onFailed(file, error); });
    }
    function onCompleted(result) {
        if (failed) {
            return;
        }
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        subject.next(result);
        ++completedCount;
        if (completedCount === filenames.length) {
            subject.complete();
            return;
        }
        handleNextPostponedFileIfAny();
    }
    function onFailed(file, error) {
        if (failed) {
            return;
        }
        switch (error.code) {
            case 'ENFILE':
                //Too many files open in the whole operating system
                postponedFiles.push(file);
                if (!timeout) {
                    timeout = setTimeout(function () {
                        handleNextPostponedFileIfAny();
                        timeout = null;
                    }, nextBackoffTimeInMs);
                    nextBackoffTimeInMs *= 2;
                }
                break;
            case 'EMFILE':
                //Too many files open by the current process
                postponedFiles.push(file);
                break;
            default:
                failed = true;
                subject.error(error);
                break;
        }
    }
    function handleNextPostponedFileIfAny() {
        if (postponedFiles.length > 0) {
            var file = postponedFiles.shift();
            handle(file);
        }
    }
}
exports["default"] = doForEachFile;
