// scripts/test-payroll.ts
// הרץ עם: npx tsx scripts/test-payroll.ts

import {
  calculateDailyOvertimeBreakdown,
  formatMinutesToHoursAndMinutes,
  getDailyStandardHours,
  DEFAULT_WORK_RULES,
  type ShiftType,
} from "../lib/calculations/overtime";

import {
  calculateShiftPayroll,
  formatAgorotToShekels,
  getShiftTypeLabel,
} from "../lib/calculations/payroll";

// ========================================
// פונקציות עזר להדפסה
// ========================================

function printHeader(title: string) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

function printSubHeader(title: string) {
  console.log(`\n--- ${title} ---`);
}

function printResult(label: string, value: string | number) {
  console.log(`  ${label.padEnd(25)} ${value}`);
}

// ========================================
// בדיקת תקני שעות לפי סוג משמרת
// ========================================

function testDailyStandardHours() {
  printHeader("בדיקת תקן שעות יומי לפי סוג משמרת");

  const shiftTypes: ShiftType[] = [
    "REGULAR",
    "SHORT_DAY",
    "NIGHT",
    "FRIDAY",
    "SHABBAT",
    "HOLIDAY",
  ];

  for (const type of shiftTypes) {
    const hours = getDailyStandardHours(type);
    const minutes = hours * 60;
    printResult(
      getShiftTypeLabel(type),
      `${hours} שעות (${formatMinutesToHoursAndMinutes(minutes)})`
    );
  }
}

// ========================================
// בדיקת חלוקת שעות נוספות
// ========================================

function testOvertimeBreakdown() {
  printHeader("בדיקת חלוקת שעות נוספות - יום רגיל");

  const testCases = [
    { hours: 8, description: "8 שעות (מתחת לתקן)" },
    { hours: 8.6, description: "8:36 שעות (בדיוק תקן)" },
    { hours: 9, description: "9 שעות (24 דקות נוספות)" },
    { hours: 10, description: "10 שעות (שעה ו-24 דקות נוספות)" },
    { hours: 10.6, description: "10:36 שעות (2 שעות נוספות 125%)" },
    { hours: 11, description: "11 שעות (2 שעות 125% + 24 דקות 150%)" },
    { hours: 12, description: "12 שעות (2 שעות 125% + 1:24 שעות 150%)" },
  ];

  for (const test of testCases) {
    printSubHeader(test.description);
    const minutes = test.hours * 60;
    const breakdown = calculateDailyOvertimeBreakdown(minutes, "REGULAR");

    printResult("סה״כ", formatMinutesToHoursAndMinutes(breakdown.totalMinutes));
    printResult("רגילות (100%)", formatMinutesToHoursAndMinutes(breakdown.regularMinutes));
    printResult("נוספות (125%)", formatMinutesToHoursAndMinutes(breakdown.overtime125Minutes));
    printResult("נוספות (150%)", formatMinutesToHoursAndMinutes(breakdown.overtime150Minutes));
  }
}

// ========================================
// בדיקת משמרת לילה
// ========================================

function testNightShift() {
  printHeader("בדיקת משמרת לילה (תקן 7 שעות)");

  const testCases = [
    { hours: 7, description: "7 שעות (בדיוק תקן)" },
    { hours: 8, description: "8 שעות (שעה נוספת)" },
    { hours: 10, description: "10 שעות (3 שעות נוספות)" },
  ];

  for (const test of testCases) {
    printSubHeader(test.description);
    const minutes = test.hours * 60;
    const breakdown = calculateDailyOvertimeBreakdown(minutes, "NIGHT");

    printResult("סה״כ", formatMinutesToHoursAndMinutes(breakdown.totalMinutes));
    printResult("רגילות (100%)", formatMinutesToHoursAndMinutes(breakdown.regularMinutes));
    printResult("נוספות (125%)", formatMinutesToHoursAndMinutes(breakdown.overtime125Minutes));
    printResult("נוספות (150%)", formatMinutesToHoursAndMinutes(breakdown.overtime150Minutes));
  }
}

// ========================================
// בדיקת עבודה בשבת
// ========================================

function testShabbatWork() {
  printHeader("בדיקת עבודה בשבת (175%/200%)");

  const testCases = [
    { hours: 2, description: "2 שעות (175%)" },
    { hours: 4, description: "4 שעות (2×175% + 2×200%)" },
    { hours: 8, description: "8 שעות (2×175% + 6×200%)" },
  ];

  for (const test of testCases) {
    printSubHeader(test.description);
    const minutes = test.hours * 60;
    const breakdown = calculateDailyOvertimeBreakdown(minutes, "SHABBAT");

    printResult("סה״כ", formatMinutesToHoursAndMinutes(breakdown.totalMinutes));
    printResult("שבת 175%", formatMinutesToHoursAndMinutes(breakdown.shabbatOvertime175Minutes));
    printResult("שבת 200%", formatMinutesToHoursAndMinutes(breakdown.shabbatOvertime200Minutes));
  }
}

// ========================================
// בדיקת חישוב שכר מלא
// ========================================

function testFullPayrollCalculation() {
  printHeader("בדיקת חישוב שכר מלא");

  const hourlyRate = 5000; // 50 ש"ח באגורות

  // דוגמה 1: יום רגיל עם שעות נוספות
  printSubHeader("דוגמה 1: יום רגיל 08:00-18:00 (10 שעות)");
  const result1 = calculateShiftPayroll({
    startTime: new Date("2024-01-15T08:00:00"),
    endTime: new Date("2024-01-15T18:00:00"),
    hourlyRate,
    bonuses: [],
  });

  printResult("סוג משמרת", getShiftTypeLabel(result1.shiftType));
  printResult("סה״כ שעות", formatMinutesToHoursAndMinutes(result1.breakdown.totalMinutes));
  printResult("שעות רגילות", formatMinutesToHoursAndMinutes(result1.breakdown.regularMinutes));
  printResult("שעות 125%", formatMinutesToHoursAndMinutes(result1.breakdown.overtime125Minutes));
  printResult("שעות 150%", formatMinutesToHoursAndMinutes(result1.breakdown.overtime150Minutes));
  printResult("שכר רגיל", formatAgorotToShekels(result1.regularPay));
  printResult("שכר 125%", formatAgorotToShekels(result1.overtime125Pay));
  printResult("שכר 150%", formatAgorotToShekels(result1.overtime150Pay));
  printResult("סה״כ לתשלום", formatAgorotToShekels(result1.totalPay));

  // דוגמה 2: משמרת לילה
  printSubHeader("דוגמה 2: משמרת לילה 22:00-06:00 (8 שעות)");
  const result2 = calculateShiftPayroll({
    startTime: new Date("2024-01-15T22:00:00"),
    endTime: new Date("2024-01-16T06:00:00"),
    hourlyRate,
    bonuses: [],
  });

  printResult("סוג משמרת", getShiftTypeLabel(result2.shiftType));
  printResult("סה״כ שעות", formatMinutesToHoursAndMinutes(result2.breakdown.totalMinutes));
  printResult("שעות רגילות", formatMinutesToHoursAndMinutes(result2.breakdown.regularMinutes));
  printResult("שעות 125%", formatMinutesToHoursAndMinutes(result2.breakdown.overtime125Minutes));
  printResult("שכר רגיל", formatAgorotToShekels(result2.regularPay));
  printResult("שכר 125%", formatAgorotToShekels(result2.overtime125Pay));
  printResult("סה״כ לתשלום", formatAgorotToShekels(result2.totalPay));

  // דוגמה 3: עבודה בשבת
  printSubHeader("דוגמה 3: עבודה בשבת 10:00-18:00 (8 שעות)");
  const result3 = calculateShiftPayroll({
    startTime: new Date("2024-01-20T10:00:00"), // שבת
    endTime: new Date("2024-01-20T18:00:00"),
    hourlyRate,
    bonuses: [],
    shiftType: "SHABBAT", // מציינים במפורש שזה שבת
  });

  printResult("סוג משמרת", getShiftTypeLabel(result3.shiftType));
  printResult("סה״כ שעות", formatMinutesToHoursAndMinutes(result3.breakdown.totalMinutes));
  printResult("שעות 175%", formatMinutesToHoursAndMinutes(result3.breakdown.shabbatOvertime175Minutes));
  printResult("שעות 200%", formatMinutesToHoursAndMinutes(result3.breakdown.shabbatOvertime200Minutes));
  printResult("שכר 175%", formatAgorotToShekels(result3.shabbatOvertime175Pay));
  printResult("שכר 200%", formatAgorotToShekels(result3.shabbatOvertime200Pay));
  printResult("סה״כ לתשלום", formatAgorotToShekels(result3.totalPay));

  // דוגמה 4: עם בונוס
  printSubHeader("דוגמה 4: יום רגיל + בונוס 5₪ לשעה");
  const result4 = calculateShiftPayroll({
    startTime: new Date("2024-01-15T08:00:00"),
    endTime: new Date("2024-01-15T17:00:00"), // 9 שעות
    hourlyRate,
    bonuses: [
      {
        id: "1",
        bonusType: "HOURLY",
        amountPerHour: 500, // 5 ש"ח באגורות
        amountFixed: null,
        validFrom: new Date("2024-01-01"),
        validTo: new Date("2024-12-31"),
      },
    ],
  });

  printResult("סה״כ שעות", formatMinutesToHoursAndMinutes(result4.breakdown.totalMinutes));
  printResult("שכר בסיס", formatAgorotToShekels(result4.basePay));
  printResult("בונוס", formatAgorotToShekels(result4.totalBonusPay));
  printResult("סה״כ לתשלום", formatAgorotToShekels(result4.totalPay));
}

// ========================================
// בדיקת תקינות לפי החוק
// ========================================

function testLegalCompliance() {
  printHeader("בדיקת תאימות לחוק שעות עבודה ומנוחה");

  const hourlyRate = 5000; // 50 ש"ח

  // בדיקה 1: תקן יומי 8:36
  printSubHeader("בדיקה 1: תקן יומי (5 ימים בשבוע)");
  const standardHours = getDailyStandardHours("REGULAR");
  const expected = 8.6;
  const pass1 = standardHours === expected;
  printResult("תקן יומי", `${standardHours} שעות`);
  printResult("צפוי", `${expected} שעות`);
  printResult("תוצאה", pass1 ? "✅ עבר" : "❌ נכשל");

  // בדיקה 2: תקן יום מקוצר 7:36
  printSubHeader("בדיקה 2: יום מקוצר");
  const shortDayHours = getDailyStandardHours("SHORT_DAY");
  const expectedShort = 7.6;
  const pass2 = shortDayHours === expectedShort;
  printResult("תקן יום מקוצר", `${shortDayHours} שעות`);
  printResult("צפוי", `${expectedShort} שעות`);
  printResult("תוצאה", pass2 ? "✅ עבר" : "❌ נכשל");

  // בדיקה 3: תקן משמרת לילה 7
  printSubHeader("בדיקה 3: משמרת לילה");
  const nightHours = getDailyStandardHours("NIGHT");
  const expectedNight = 7;
  const pass3 = nightHours === expectedNight;
  printResult("תקן לילה", `${nightHours} שעות`);
  printResult("צפוי", `${expectedNight} שעות`);
  printResult("תוצאה", pass3 ? "✅ עבר" : "❌ נכשל");

  // בדיקה 4: תעריף 125%
  printSubHeader("בדיקה 4: תעריף שעות נוספות ראשונות");
  const rate125 = DEFAULT_WORK_RULES.overtimeFirstRate;
  const pass4 = rate125 === 1.25;
  printResult("תעריף", `${rate125 * 100}%`);
  printResult("צפוי", "125%");
  printResult("תוצאה", pass4 ? "✅ עבר" : "❌ נכשל");

  // בדיקה 5: תעריף 150%
  printSubHeader("בדיקה 5: תעריף שעות נוספות נוספות");
  const rate150 = DEFAULT_WORK_RULES.overtimeSecondRate;
  const pass5 = rate150 === 1.5;
  printResult("תעריף", `${rate150 * 100}%`);
  printResult("צפוי", "150%");
  printResult("תוצאה", pass5 ? "✅ עבר" : "❌ נכשל");

  // בדיקה 6: חישוב שכר נכון
  printSubHeader("בדיקה 6: חישוב שכר 10 שעות ביום רגיל");
  const result = calculateShiftPayroll({
    startTime: new Date("2024-01-15T08:00:00"),
    endTime: new Date("2024-01-15T18:00:00"),
    hourlyRate,
    bonuses: [],
  });

  // 8.6 שעות × 50 = 430
  // 1.4 שעות × 50 × 1.25 = 87.5 (מעוגל)
  const expectedRegular = Math.round(8.6 * 50 * 100); // באגורות
  const expectedOvertime = Math.round(1.4 * 50 * 1.25 * 100); // באגורות
  
  printResult("שכר רגיל", formatAgorotToShekels(result.regularPay));
  printResult("שכר צפוי", formatAgorotToShekels(expectedRegular));
  printResult("שכר 125%", formatAgorotToShekels(result.overtime125Pay));

  // סיכום
  printHeader("סיכום בדיקות");
  const allPassed = pass1 && pass2 && pass3 && pass4 && pass5;
  console.log(allPassed ? "\n✅ כל הבדיקות עברו בהצלחה!" : "\n❌ חלק מהבדיקות נכשלו");
}

// ========================================
// הרצת כל הבדיקות
// ========================================

console.log("\n🧪 בדיקת מערכת חישוב שכר ושעות נוספות\n");

testDailyStandardHours();
testOvertimeBreakdown();
testNightShift();
testShabbatWork();
testFullPayrollCalculation();
testLegalCompliance();

console.log("\n" + "=".repeat(60));
console.log("  סיום הבדיקות");
console.log("=".repeat(60) + "\n");