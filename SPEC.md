# מערכת נוכחות עובדים - קובץ איפיון

## תאריך עדכון אחרון: 2025-11-30

---

## מבוא ויעדי המערכת

### מטרת המערכת
מערכת נוכחות מקיפה לניהול שעות עבודה של עובדים, מותאמת לחוקי העבודה בישראל, עם ממשקים נפרדים למנהלים ולעובדים.

### יעדים עסקיים
- **דיוק** - מעקב אחר שעות עבודה בצורה מדויקת עם audit trail מלא
- **שקיפות** - העובד רואה את כל המשמרות והשכר שלו
- **עמידה בחוק** - תמיכה בחוקי שעות נוספות, חגים, ומסמכים נדרשים
- **אוטומציה** - חישוב אוטומטי של שכר, שעות נוספות, ובונוסים
- **נוחות** - ממשק פשוט לעובד (web + mobile), ממשק מקצועי למנהל

---

## סטאק טכנולוגי

### Frontend
| טכנולוגיה | גרסה | תיאור |
|-----------|-------|--------|
| Next.js | 16.0.4 | App Router |
| React | 19.2.0 | UI Framework |
| TypeScript | 5.9.3 | Type Safety |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | - | UI Components (Radix-based) |
| TanStack Table | 8.21.3 | Advanced Data Tables |
| React Hook Form | 7.66.1 | Form Management |
| Zod | 4.1.13 | Validation |
| nuqs | 2.8.1 | URL State Management |
| next-themes | 0.4.6 | Dark/Light Mode |
| date-fns | 4.1.0 | Date Handling |
| Motion | 12.23.24 | Animations |
| Lucide React | 0.554.0 | Icons |

### Backend
| טכנולוגיה | גרסה | תיאור |
|-----------|-------|--------|
| Prisma | 6.19.0 | ORM |
| PostgreSQL | - | Database (via Prisma Postgres on Vercel) |
| Server Actions | - | Next.js Server Actions |
| NextAuth.js | 5 (beta) | Authentication |
| bcryptjs | - | Password hashing |
| xlsx | 0.18.5 | Excel Export |

### Infrastructure
- **Hosting**: Vercel
- **Database**: Prisma Postgres (Vercel)
- **Repository**: GitHub
- **Localization**: RTL מלא (עברית)

---

## מבנה Database (Prisma Schema)

### Models מרכזיים

#### AdminUser
```prisma
model AdminUser {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String   // hashed
  role      String   @default("ADMIN")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Employee
```prisma
model Employee {
  id             String   @id @default(uuid())
  fullName       String
  nationalId     String   @unique
  status         EmployeeStatus @default(ACTIVE)
  baseHourlyRate Int      // באגורות
  requireLocation Boolean @default(false)
  // Relations: workRates, shifts, timeEvents, bonuses, tasks, documentRequests, documents, devices
}
```

#### WorkType
```prisma
model WorkType {
  id          String  @id @default(uuid())
  name        String  @unique
  description String?
  isDefault   Boolean @default(false)
  // Relations: employeeRates, shifts
}
```

#### EmployeeWorkRate
```prisma
model EmployeeWorkRate {
  id         String @id @default(uuid())
  employeeId String
  workTypeId String
  hourlyRate Int    // באגורות
  @@unique([employeeId, workTypeId])
}
```

#### Shift
```prisma
model Shift {
  id           String      @id @default(uuid())
  employeeId   String
  workTypeId   String?
  startTime    DateTime
  endTime      DateTime?
  status       ShiftStatus @default(OPEN)
  source       String      @default("web") // web/mobile/import
  isManual     Boolean     @default(false)
  isRetro      Boolean     @default(false)
  notesEmployee String?
  notesManager  String?
  approvedById  String?
  approvedAt    DateTime?
  @@index([employeeId, startTime])
}
```

#### TimeEvent
```prisma
model TimeEvent {
  id         String        @id @default(uuid())
  employeeId String
  shiftId    String?
  eventType  TimeEventType
  createdBy  ActorType
  time       DateTime
  geoLat     Float?
  geoLng     Float?
  deviceId   String?
  @@index([employeeId, time])
}
```

#### WorkRules
```prisma
model WorkRules {
  id                       Int   @id @default(1) // Singleton
  dailyStandardHours       Float @default(8)
  weeklyStandardHours      Float @default(42)
  overtimeFirstRate        Float @default(1.25)
  overtimeFirstHoursPerDay Float @default(2)
  overtimeSecondRate       Float @default(1.5)
  maxDailyHours           Float @default(12)
}
```

#### EmployeeBonus
```prisma
model EmployeeBonus {
  id            String    @id @default(uuid())
  employeeId    String
  bonusType     BonusType // HOURLY / ONE_TIME
  amountPerHour Int?      // באגורות (ל-HOURLY)
  amountFixed   Int?      // באגורות (ל-ONE_TIME)
  validFrom     DateTime?
  validTo       DateTime?
  description   String?
  @@index([employeeId])
}
```

#### CalendarEvent
```prisma
model CalendarEvent {
  id           String            @id @default(uuid())
  gregorianDate DateTime
  hebrewDate    String?
  eventType     CalendarEventType
  nameHe        String?
  nameEn        String?
  isRestDay     Boolean @default(false)
  isShortDay    Boolean @default(false)
  @@index([gregorianDate])
}
```

#### Task
```prisma
model Task {
  id                    String     @id @default(uuid())
  employeeId            String
  title                 String
  description           String?
  status                TaskStatus @default(OPEN)
  createdBy             ActorType
  dueDate               DateTime?
  requiresDocumentUpload Boolean @default(false)
  employeeNote          String?
  managerNote           String?
  createdAt             DateTime @default(now())
  completedAt           DateTime?
  @@index([employeeId, status])
}
```

#### DocumentRequest & EmployeeDocument
```prisma
model DocumentRequest {
  id               String     @id @default(uuid())
  employeeId       String
  title            String
  description      String?
  status           TaskStatus @default(OPEN)
  dueDate          DateTime?
  completedAt      DateTime?
  relatedDocumentId String?
  @@index([employeeId, status])
}

model EmployeeDocument {
  id         String     @id @default(uuid())
  employeeId String
  docType    String     // license, certificate, etc.
  fileUrl    String
  visibility Visibility // EMPLOYER_ONLY / EMPLOYEE_CAN_SEE
  uploadedBy UploadedBy // EMPLOYEE / MANAGER
  createdAt  DateTime @default(now())
  @@index([employeeId])
}
```

#### Device
```prisma
model Device {
  id            String   @id @default(uuid())
  employeeId    String
  platform      Platform // ANDROID / IOS
  expoPushToken String?
  lastSeenAt    DateTime?
  @@index([employeeId])
}
```

#### AuditLog
```prisma
model AuditLog {
  id        String    @id @default(uuid())
  actorId   String?
  actorType ActorType
  entity    String    // SHIFT, EMPLOYEE, BONUS, etc.
  entityId  String
  action    String    // CREATE, UPDATE, DELETE
  before    Json?
  after     Json?
  createdAt DateTime @default(now())
  @@index([entity, entityId])
  @@index([actorId])
  @@index([createdAt])
}
```

### Enums
```prisma
enum EmployeeStatus { ACTIVE, BLOCKED }
enum ShiftStatus { OPEN, CLOSED, PENDING_APPROVAL, CORRECTED, REJECTED }
enum TimeEventType { CLOCK_IN, CLOCK_OUT, CORRECTION_IN, CORRECTION_OUT }
enum ActorType { EMPLOYEE, MANAGER, SYSTEM }
enum CalendarEventType { HOLIDAY, FAST, ROSH_CHODESH, MEMORIAL, CUSTOM }
enum BonusType { HOURLY, ONE_TIME }
enum TaskStatus { OPEN, COMPLETED, POSTPONED, CANCELED }
enum Visibility { EMPLOYER_ONLY, EMPLOYEE_CAN_SEE }
enum UploadedBy { EMPLOYEE, MANAGER }
enum Platform { ANDROID, IOS }
```

---

## מבנה תיקיות

```
attendance-app/
├── app/
│   ├── layout.tsx                    # Root layout עם RTL + Theme
│   ├── page.tsx                      # Landing page
│   ├── admin/
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── _actions/
│   │   │   ├── employee-actions.ts
│   │   │   ├── bonus-actions.ts
│   │   │   ├── approval-actions.ts
│   │   │   └── employee-work-rate-actions.ts
│   │   ├── _components/
│   │   │   ├── employees-data-table.tsx
│   │   │   ├── employee-form-dialog.tsx
│   │   │   ├── delete-employee-dialog.tsx
│   │   │   ├── employee-bonuses-dialog.tsx
│   │   │   ├── employee-rates-dialog.tsx
│   │   │   ├── pending-shifts-dialog.tsx
│   │   │   ├── edit-pending-shift-dialog.tsx
│   │   │   └── bonus-form-dialog.tsx
│   │   ├── shifts/
│   │   │   ├── page.tsx
│   │   │   ├── _actions/
│   │   │   │   ├── shift-actions.ts
│   │   │   │   ├── calculate-shift-pay.ts
│   │   │   │   └── export-shifts.ts
│   │   │   └── _components/
│   │   │       ├── shifts-data-table.tsx
│   │   │       ├── shift-form-dialog.tsx
│   │   │       ├── shift-payroll-dialog.tsx
│   │   │       ├── delete-shift-dialog.tsx
│   │   │       └── export-shifts-button.tsx
│   │   └── work-types/
│   │       ├── page.tsx
│   │       ├── _actions/work-type-actions.ts
│   │       └── _components/
│   │           ├── work-types-data-table.tsx
│   │           ├── work-type-form-dialog.tsx
│   │           └── delete-work-type-dialog.tsx
│   └── employee/
│       ├── page.tsx                  # Employee dashboard + Clock in/out
│       ├── login/
│       │   ├── page.tsx
│       │   └── login-form.tsx
│       ├── auth/route.ts             # Login handler
│       ├── history/
│       │   ├── page.tsx
│       │   └── _components/
│       │       ├── shift-history-list.tsx
│       │       ├── period-navigator.tsx
│       │       └── period-select.tsx
│       ├── _actions/
│       │   ├── clock-actions.ts
│       │   ├── retro-shift-actions.ts
│       │   └── payroll-actions.ts
│       └── _components/
│           ├── clock-in-button.tsx
│           ├── clock-out-button.tsx
│           ├── work-type-select-dialog.tsx
│           ├── retro-shift-form-dialog.tsx
│           ├── employee-payroll-dialog.tsx
│           ├── my-pending-shifts.tsx
│           └── shift-duration-widget.tsx
├── components/
│   ├── ui/                           # shadcn/ui components (~25 files)
│   ├── data-table/                   # DiceUI/TanStack components (~15 files)
│   ├── animate-ui/                   # Animation wrappers
│   ├── theme-provider.tsx
│   ├── direction-provider.tsx
│   └── mode-toggle.tsx
├── hooks/
│   ├── use-data-table.ts
│   ├── use-callback-ref.ts
│   ├── use-controlled-state.tsx
│   └── use-debounced-callback.ts
├── lib/
│   ├── calculations/
│   │   ├── overtime.ts               # חישובי שעות נוספות (1,341 שורות)
│   │   └── payroll.ts                # חישובי שכר (345 שורות)
│   ├── validations/
│   │   ├── employee.ts
│   │   ├── shift.ts
│   │   ├── work-type.ts
│   │   ├── bonus.ts
│   │   └── employee-work-rate.ts
│   ├── prisma.ts
│   ├── utils.ts
│   ├── format.ts
│   ├── parsers.ts
│   └── id.ts
├── types/
│   ├── prisma.ts
│   └── data-table.ts
├── prisma/
│   └── schema.prisma                 # 298 שורות
└── config/
```

---

## סטטוס פיתוח

### תכונות שמומשו במלואן

| תכונה | סטטוס | קבצים עיקריים |
|--------|--------|----------------|
| ניהול עובדים (CRUD) | ✅ מלא | `employee-actions.ts`, `employees-data-table.tsx` |
| ניהול משמרות (CRUD) | ✅ מלא | `shift-actions.ts`, `shifts-data-table.tsx` |
| ניהול סוגי עבודה | ✅ מלא | `work-type-actions.ts`, `work-types-data-table.tsx` |
| תעריפי שכר לפי סוג עבודה | ✅ מלא | `employee-work-rate-actions.ts`, `employee-rates-dialog.tsx` |
| מערכת בונוסים | ✅ מלא | `bonus-actions.ts`, `employee-bonuses-dialog.tsx` |
| חישוב שעות נוספות | ✅ מלא | `lib/calculations/overtime.ts` |
| חישוב שכר | ✅ מלא | `lib/calculations/payroll.ts` |
| משמרות רטרואקטיביות | ✅ מלא | `retro-shift-actions.ts`, `retro-shift-form-dialog.tsx` |
| Clock In/Out | ✅ מלא | `clock-actions.ts`, `clock-in-button.tsx` |
| היסטוריית משמרות | ✅ מלא | `shift-history-list.tsx`, `period-navigator.tsx` |
| Workflow אישורים | ✅ מלא | `approval-actions.ts`, `pending-shifts-dialog.tsx` |
| דשבורד עובד | ✅ מלא | `employee/page.tsx` |
| דשבורד מנהל | ✅ בסיסי | `admin/page.tsx` |
| Audit Logging | ✅ מלא | כל ה-actions |
| ייצוא Excel | ✅ בסיסי | `export-shifts.ts` |
| התחברות עובד | ✅ בסיסי | `login-form.tsx`, `auth/route.ts` |
| התחברות מנהל | ✅ מלא | NextAuth.js + Credentials + Google OAuth |
| ניהול צוות מנהלים | ✅ מלא | `admin/team/`, הזמנות, תפקידים |
| Theme System | ✅ מלא | `theme-provider.tsx`, `mode-toggle.tsx` |
| RTL Support | ✅ מלא | `direction-provider.tsx` |
| Data Tables | ✅ מלא | `components/data-table/` |

### תכונות שמומשו חלקית

| תכונה | סטטוס | הערות |
|--------|--------|--------|
| ייצוא מתקדם | ⚠️ חלקי | בסיסי, ללא אפשרויות מתקדמות |
| Location Tracking | ⚠️ חלקי | Schema תומך, אין מימוש |

### תכונות שלא מומשו (Schema בלבד)

| תכונה | סטטוס | הערות |
|--------|--------|--------|
| משימות לעובדים | ❌ Schema בלבד | Model קיים, אין UI/actions |
| ניהול מסמכים | ❌ Schema בלבד | Models קיימים, אין UI/actions |
| לוח עברי וחגים | ❌ Schema בלבד | Model קיים, אין אינטגרציה |
| אפליקציה מובייל | ❌ Schema בלבד | Device model קיים |
| Push Notifications | ❌ Schema בלבד | expoPushToken בschema |

---

## חישובי שעות נוספות (חוק ישראלי)

### כללים מרכזיים

#### שבוע עבודה 5 ימים
- שעות תקן שבועיות: 42
- יום רגיל: 8.6 שעות (8:36)
- יום קצר: 7.6 שעות (7:36)

#### שבוע עבודה 6 ימים
- יום רגיל: 8 שעות
- יום שישי: 7 שעות

#### משמרת לילה (22:00-06:00)
- 7 שעות תקן

#### מקסימום יומי
- 12 שעות

### תעריפי שעות נוספות

| סוג | תעריף | הסבר |
|-----|--------|-------|
| רגיל | 100% | עד שעות התקן |
| נוספות 125% | 125% | 2 שעות ראשונות מעל התקן |
| נוספות 150% | 150% | משעה 3 מעל התקן |
| שבת/חג רגיל | 150% | שעות תקן בשבת/חג |
| שבת/חג 175% | 175% | 2 שעות ראשונות נוספות |
| שבת/חג 200% | 200% | משעה 3 נוספות |

### פונקציות חישוב

```typescript
// lib/calculations/overtime.ts
calculateShiftDurationMinutes()
determineShiftType() // REGULAR, SHORT_DAY, NIGHT, FRIDAY, SHABBAT, HOLIDAY
getDailyStandardHours()
calculateDailyOvertimeBreakdown()
calculateWeeklyOvertimeMinutes()
formatMinutesToHoursAndMinutes()

// lib/calculations/payroll.ts
calculateShiftPayroll()
calculatePeriodPayroll()
calculateWeeklyPayroll()
```

---

## Design Patterns

### Server Components + Server Actions
- דפים = Server Components (fetch data)
- פעולות = Server Actions (mutations)
- Client Components רק לאינטראקטיביות

### Form Pattern
```
1. Zod Schema (lib/validations/)
2. Server Action (app/**/_actions/)
3. React Hook Form + Dialog (app/**/_components/)
```

### Data Flow
```
User Input → Form (Client)
  → Server Action
    → Validation (Zod)
      → Database (Prisma)
        → Audit Log
          → Revalidation
            → UI Update
```

### Currency Handling
- אחסון באגורות (1/100 שקל) למניעת בעיות precision
- המרה לשקלים בשכבת ה-UI
- תצוגה בפורמט "₪XX.XX"

---

## מה שנשאר לפתח

### עדיפות גבוהה

#### 1. משימות לעובדים
```
/admin/tasks
├── טבלה: עובד | כותרת | סוג | תאריך יעד | סטטוס | פעולות
└── כפתור "משימה חדשה" → דיאלוג

/employee/tasks
├── רשימת משימות פתוחות
└── tab "הושלמו"
```

**קבצים לפיתוח:**
- `lib/validations/task.ts`
- `app/admin/tasks/page.tsx`
- `app/admin/tasks/_actions/task-actions.ts`
- `app/admin/tasks/_components/tasks-data-table.tsx`
- `app/employee/tasks/page.tsx`

#### 2. ניהול מסמכים
```
/admin/employees/[id]/documents
├── טבלה: שם קובץ | סוג | תאריך העלאה | נראות | פעולות
└── כפתורים: "העלה מסמך" | "בקש מסמך מהעובד"

/employee/documents
├── tab "בקשות פתוחות"
└── tab "המסמכים שלי"
```

**Storage:** Vercel Blob Storage

**קבצים לפיתוח:**
- `lib/validations/document.ts`
- `app/admin/_actions/document-actions.ts`
- `app/admin/employees/[id]/documents/page.tsx`
- `app/employee/documents/page.tsx`
- `lib/storage/upload.ts`

### עדיפות בינונית

#### 3. לוח עברי וחגים
- ספריית `@hebcal/core`
- Seed script לטעינת חגים
- אינטגרציה עם חישוב שכר
- סימון חגים בטבלת משמרות

#### 4. דשבורד מנהל מתקדם
- סטטיסטיקות: עובדים פעילים, משמרות היום, ממתינות לאישור
- גרפים: שעות עבודה לפי חודש, התפלגות עובדים
- התראות: משמרות פתוחות מעל 12 שעות

#### 5. דוחות מתקדמים
- דוח שכר חודשי
- דוח נוכחות
- דוח שעות נוספות
- ייצוא PDF (jsPDF)

### עדיפות נמוכה

#### 6. אפליקציה מובייל
- React Native + Expo
- Clock In/Out
- היסטוריה
- Push Notifications

#### 7. Geofencing
- GPS בעת Clock In/Out
- הגדרת אזורי עבודה
- התרעה אם מחוץ לאזור

#### 8. תכנון משמרות
- קלנדר שבועי/חודשי
- Drag & drop
- שיבוץ אוטומטי

---

## המלצות לשיפור

### Security
- [ ] JWT Tokens במקום cookies פשוטים
- [ ] Rate limiting על Login
- [ ] 2FA / OTP
- [ ] RBAC - תפקידים
- [ ] Middleware protection

### Performance
- [ ] Pagination בשרת
- [ ] Connection pooling (PgBouncer)
- [ ] Caching (Redis)
- [ ] Code splitting

### Testing
- [ ] Unit tests (Vitest)
- [ ] Integration tests (Playwright)
- [ ] E2E tests

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics)
- [ ] Application logs

### UX
- [ ] Loading states (Skeleton loaders)
- [ ] Optimistic updates
- [ ] Toast notifications (Sonner) - כבר מותקן
- [ ] Keyboard shortcuts
- [ ] Breadcrumbs

---

## Prompt להמשך עבודה

```
אני עובד על מערכת נוכחות עובדים ב-Next.js 16 + Prisma + TypeScript.

הסטאק:
- Frontend: Next.js 16.0.4 (App Router), Tailwind v4, shadcn/ui, TanStack Table
- Backend: Prisma 6 + Prisma Postgres, Server Actions
- עברית RTL מלא
- Dark mode support

מבנה:
- /admin - ממשק מנהל
- /employee - ממשק עובד
- Server Actions ב-_actions/
- Validations עם Zod
- AuditLog לכל שינוי

מה שכבר קיים:
✅ CRUD עובדים
✅ CRUD משמרות (כולל ידני למנהל)
✅ CRUD סוגי עבודה
✅ תעריפי שכר לפי סוג עבודה
✅ מערכת בונוסים (HOURLY + ONE_TIME)
✅ חישוב שעות נוספות (חוק ישראלי מלא)
✅ חישוב שכר (כולל בונוסים)
✅ משמרות רטרואקטיביות + אישור מנהל
✅ Clock In/Out לעובד
✅ היסטוריה לעובד (לפי שבוע/חודש)
✅ ייצוא Excel
✅ Theme system + RTL
✅ Audit logging
✅ התחברות מנהל (NextAuth + Google OAuth)
✅ ניהול צוות מנהלים (תפקידים, הזמנות, מחלקות)

❌ לא מומש:
- משימות לעובדים
- ניהול מסמכים
- לוח עברי וחגים
- אפליקציה מובייל

אני רוצה להוסיף: [תאר כאן מה אתה רוצה לפתח]

דרישות:
- קוד TypeScript מלא ללא any
- Zod validation לכל טופס
- Server Actions לכל mutation
- AuditLog לכל שינוי במנהל
- RTL ועברית
- עיצוב עם Tailwind בלבד (ללא CSS)
- shadcn/ui dialogs לכל פעולה
```

---

## סיכום

מערכת נוכחות מתקדמת עם תשתית חזקה לחישובי שכר ושעות נוספות לפי החוק הישראלי. התכונות המרכזיות מומשו במלואן, והפערים העיקריים הם:
1. משימות ומסמכים
2. לוח עברי
3. אפליקציה מובייל

הקוד מאורגן היטב עם patterns עקביים (Server Actions, Zod validation, Audit logging, NextAuth) ומוכן להרחבה.
