"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var process = require("process");
var fs = require("fs/promises");
var path = require("path");
var do_for_each_file_1 = require("./do_for_each_file");
var rxjs_1 = require("rxjs");
var ts_functional_pipe_1 = require("ts-functional-pipe");
function getArgs() {
    var args = process.argv.splice(2);
    if (args.length < 1 || args.length % 2 !== 1) {
        usage();
    }
    var dirWithLogsPath = path.resolve(process.cwd(), args[0]);
    var codes = [];
    for (var i = 1; i < args.length; i += 2) {
        var length_1 = Number(args[1 + 1]);
        if (length_1 === undefined) {
            usage();
        }
        codes.push({
            code: args[i],
            length: length_1
        });
    }
    return {
        dirWithLogsPath: dirWithLogsPath,
        PhoneFormats: codes
    };
    function usage() {
        console.log('Usage node phone_parser.js <dir-with-logs> [<phone-code> <phone-length>]*');
        process.exit(-1);
    }
}
var args = getArgs();
main(args);
function main(args) {
    return __awaiter(this, void 0, void 0, function () {
        var files, content$, pipeline, phone$, savePath, arr, observer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readdir(args.dirWithLogsPath)];
                case 1:
                    files = _a.sent();
                    files = files.map(function (f) { return path.resolve(args.dirWithLogsPath, f); });
                    content$ = (0, do_for_each_file_1["default"])(files, function (fname) {
                        return fs.readFile(fname, 'utf-8');
                    });
                    pipeline = (0, ts_functional_pipe_1.pipe)(removeLeadingZeroOrPlus, removeAllExceptDigits, function (p) { return validateAndAddCodeIfNeeded(p, args.PhoneFormats); });
                    phone$ = content$.pipe((0, rxjs_1.mergeMap)(function (c) {
                        var phones = parsePhones(c)
                            .map(pipeline)
                            .filter(function (p) { return p !== undefined; });
                        return phones;
                    }));
                    savePath = path.join(args.dirWithLogsPath, 'parsed_data.txt');
                    arr = [];
                    return [4 /*yield*/, fs.writeFile(savePath, '')];
                case 2:
                    _a.sent();
                    observer = {
                        next: function (phone) { return (arr.push(phone)); },
                        complete: function () {
                            return __awaiter(this, void 0, void 0, function () {
                                var _i, arr_1, p;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _i = 0, arr_1 = arr;
                                            _a.label = 1;
                                        case 1:
                                            if (!(_i < arr_1.length)) return [3 /*break*/, 4];
                                            p = arr_1[_i];
                                            return [4 /*yield*/, fs.appendFile(savePath, p + '\n')];
                                        case 2:
                                            _a.sent();
                                            _a.label = 3;
                                        case 3:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            });
                        }
                    };
                    phone$.subscribe(observer);
                    return [2 /*return*/];
            }
        });
    });
}
function parsePhones(s) {
    var phoneRegex = /"phone":\s*"([0-9@#\$%^&\*\(\)\-_+]+)"/g;
    return matchRegexAndGetFirstGroup(phoneRegex, s);
}
function matchRegexAndGetFirstGroup(regex, s) {
    var regexArr = [];
    var match;
    while (match = regex.exec(s)) {
        regexArr.push(match[1]);
    }
    return regexArr;
}
function removeLeadingZeroOrPlus(p) {
    return p.replace(/^[0\+]*/g, '');
}
function removeAllExceptDigits(p) {
    return p.replace(/\D/g, '');
}
/**
 * Returns a phone ready to use or `undefined` if phone is invalid
 */
function validateAndAddCodeIfNeeded(phone, PhoneFormats) {
    for (var _i = 0, PhoneFormats_1 = PhoneFormats; _i < PhoneFormats_1.length; _i++) {
        var code = PhoneFormats_1[_i];
        if (phone.length === code.length && phone.startsWith(code.code)) {
            return phone;
        }
        else if (phone.length === code.length - code.code.length) {
            return code + phone;
        }
        return undefined;
    }
}
