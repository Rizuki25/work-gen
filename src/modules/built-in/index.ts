import { base64Generator } from './local/base64-generator'
import { createBuiltInRegistry } from '../registry/create-built-in-registry'
import { csvJsonGenerator } from './local/csv-json-generator'
import { hashGenerator } from './local/hash-generator'
import { jsonYamlGenerator } from './local/json-yaml-generator'
import { jsonFormatterGenerator } from './local/json-formatter-generator'
import { loremDummyGenerator } from './local/lorem-dummy-generator'
import { passwordGenerator } from './local/password-generator'
import { qrCodeGenerator } from './local/qr-code-generator'
import { regexTesterGenerator } from './local/regex-tester-generator'
import { textCounterGenerator } from './local/text-counter-generator'
import { timestampConverterGenerator } from './local/timestamp-generator'
import { uuidGenerator } from './local/uuid-generator'
import { dailyReportGenerator } from './template/daily-report-generator'
import { businessEmailGenerator } from './template/business-email-generator'
import { meetingMinutesGenerator } from './template/meeting-minutes-generator'
import { sopGenerator } from './template/sop-generator'
import { weeklyReportGenerator } from './template/weekly-report-generator'

export function createDefaultRegistry() {
  return createBuiltInRegistry([
    base64Generator,
    businessEmailGenerator,
    csvJsonGenerator,
    dailyReportGenerator,
    hashGenerator,
    jsonFormatterGenerator,
    jsonYamlGenerator,
    loremDummyGenerator,
    meetingMinutesGenerator,
    passwordGenerator,
    qrCodeGenerator,
    regexTesterGenerator,
    sopGenerator,
    textCounterGenerator,
    timestampConverterGenerator,
    uuidGenerator,
    weeklyReportGenerator,
  ])
}
