import * as process from 'process';
import * as fs from 'fs/promises';
import * as path from 'path';
import doForEachFile from './do_for_each_file';
import { mergeMap, never } from 'rxjs';
import { pipe } from 'ts-functional-pipe';

interface PhoneFormat {
  code: string;
  length: number;
}

interface Args {
  dirWithLogsPath: string;
  PhoneFormats: PhoneFormat[];
}

function getArgs(): Args | never {
  const args = process.argv.splice(2);

  if (args.length < 1 || args.length % 2 !== 1) {
    usage();
  }

  const dirWithLogsPath = path.resolve(process.cwd(), args[0]);
  const codes: PhoneFormat[] = [];

  for (let i = 1; i < args.length; i += 2) {
    const length: number | undefined = Number(args[1 + 1]);

    if (length === undefined) {
      usage();
    }

    codes.push({
      code: args[i],
      length
    });
  }

  return {
    dirWithLogsPath,
    PhoneFormats: codes
  };

  function usage(): never {
    console.log('Usage node phone_parser.js <dir-with-logs> [<phone-code> <phone-length>]*');
    process.exit(-1);
  }
}

const args = getArgs();
main(args);

async function main(args: Args): Promise<void> {
  let files = await fs.readdir(args.dirWithLogsPath);
  files = files.map(f => path.resolve(args.dirWithLogsPath, f));

  const content$ = doForEachFile(files, (fname) => 
    fs.readFile(fname, 'utf-8')
  );

  const pipeline = pipe(
    removeLeadingZeroOrPlus,
    removeAllExceptDigits, 
    p => validateAndAddCodeIfNeeded(p , args.PhoneFormats)
  );

  const phone$ = content$.pipe(
    mergeMap(c => {
        const phones = parsePhones(c)
          .map(pipeline)
          .filter(p => p !== undefined);

        return phones;
    })
  );

  const savePath = path.join(args.dirWithLogsPath, 'parsed_data.txt');
  let arr = [];
  await fs.writeFile(savePath, '');

  const observer = {
    next: (phone: string) => (arr.push(phone)),
    async complete(): Promise<void> {      
      for (const p of arr) {
      await fs.appendFile(savePath, p + '\n');
    }}
  };

  phone$.subscribe(observer);
}

function parsePhones(s: string): string[] {
  const phoneRegex = /"phone":\s*"([0-9@#\$%^&\*\(\)\-_+]+)"/g;
  return matchRegexAndGetFirstGroup(phoneRegex, s);
}

function matchRegexAndGetFirstGroup(regex: RegExp, s: string): string[] {
  const regexArr = [];
  let match: RegExpExecArray;

  while (match = regex.exec(s)) {
    regexArr.push(match[1]);
  }
  
  return regexArr;
}

function removeLeadingZeroOrPlus(p: string): string {
  return p.replace(/^[0\+]*/g, '');
}

function removeAllExceptDigits(p: string): string {
  return p.replace(/\D/g, '');
}

/**
 * Returns a phone ready to use or `undefined` if phone is invalid
 */
function validateAndAddCodeIfNeeded(phone: string, PhoneFormats: PhoneFormat[]): string | undefined {
  for (const code of PhoneFormats) {
    if (phone.length === code.length && phone.startsWith(code.code)) {
      return phone;
    }
    else if(phone.length === code.length - code.code.length){
      return code + phone;
    }
    return undefined;
  }
}

