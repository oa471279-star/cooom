// Centralised Arabic / English translations. No UI text lives in the other modules.
const LANG_KEY = 'balance.lang';
const SUPPORTED = ['ar', 'en'];

const dict = {
  en: {
    'common.loading': 'Loading…', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.delete': 'Delete', 'common.edit': 'Edit',
    'common.error': 'Something went wrong', 'common.retry': 'Try again', 'common.search': 'Search', 'common.all': 'All',
    'common.from': 'From', 'common.to': 'To', 'common.apply': 'Apply', 'common.reset': 'Reset', 'common.today': 'Today',
    'common.prev': 'Previous', 'common.next': 'Next', 'common.view_all': 'View all', 'common.actions': 'Actions',
    'common.not_set': 'Not set', 'common.saved': 'Saved', 'common.deleted': 'Deleted',
    'common.confirm_delete': 'Delete this item? This cannot be undone.',
    'common.page_of': 'Page {p} of {n}', 'common.total_n': '{n} total',

    'nav.dashboard': 'Dashboard', 'nav.money': 'Money Manager', 'nav.budgets': 'Budgets', 'nav.study': 'Study Planner',
    'nav.daily': 'Daily Planner', 'nav.reports': 'Reports', 'nav.settings': 'Settings', 'nav.admin': 'Admin Dashboard',
    'nav.logout': 'Log out', 'nav.menu': 'Open menu',

    'auth.tagline': 'Money and study planning for students.', 'auth.login': 'Log in', 'auth.register': 'Create account',
    'auth.email': 'Email', 'auth.password': 'Password', 'auth.confirm_password': 'Confirm password', 'auth.display_name': 'Display name',
    'auth.password_hint': 'At least 8 characters.', 'auth.forgot_link': 'Forgot your password?', 'auth.forgot_title': 'Reset your password',
    'auth.forgot_text': 'Enter your email and we will send you a reset link.', 'auth.send_reset': 'Send reset link', 'auth.back_login': 'Back to log in',
    'auth.recovery_title': 'Choose a new password', 'auth.new_password': 'New password', 'auth.update_password': 'Update password',
    'auth.check_email': 'Account created. Check your email and open the confirmation link, then log in.',
    'auth.reset_sent': 'If an account exists for this email, a reset link is on its way.',
    'auth.password_updated': 'Your password was updated.',
    'auth.config_title': 'Setup required',
    'auth.config_text': 'Add your Supabase project URL and publishable key to the file below, then reload the page.',

    'err.invalid_login': 'Incorrect email or password.', 'err.email_not_confirmed': 'Please confirm your email first — check your inbox.',
    'err.exists': 'An account with this email already exists. Try logging in instead.',
    'err.rate': 'Too many attempts. Please wait a few minutes and try again.', 'err.network': 'Cannot reach the server. Check your connection.',
    'err.permission': 'You do not have permission to do that.', 'err.generic': 'Something went wrong. Please try again.',
    'err.weak_password': 'Choose a stronger password (at least 8 characters).', 'err.same_password': 'The new password must be different from the old one.',
    'err.profile_missing': 'Your profile could not be loaded. Make sure database/supabase.sql was run, then log in again.',
    'err.link_expired': 'This link is invalid or has expired. Request a new one.',

    'val.email': 'Enter a valid email address.', 'val.password_len': 'Password must be at least 8 characters.',
    'val.password_match': 'Passwords do not match.', 'val.required': 'Please fill in the required fields.',
    'val.amount': 'Enter an amount greater than zero.', 'val.date': 'Enter a valid date.', 'val.name_len': 'Enter a name (1–120 characters; display names up to 60).',
    'val.text_len': 'The text is too long.', 'val.time': 'Enter a valid time.', 'val.end_after_start': 'The end time must be after the start time.',
    'val.minutes': 'Enter whole minutes between 0 and 1440.',

    'cat.food': 'Food and drinks', 'cat.transport': 'Transportation', 'cat.housing': 'Accommodation and bills', 'cat.education': 'Education',
    'cat.entertainment': 'Entertainment', 'cat.health': 'Health', 'cat.small': 'Small purchases', 'cat.allowance': 'Allowance or salary',
    'cat.extra_income': 'Additional income', 'cat.other': 'Other', 'cat.total': 'Total monthly budget',
    'type.income': 'Income', 'type.expense': 'Expense',
    'unit.h': 'h', 'unit.m': 'm',

    'dash.welcome': 'Hello, {name}', 'dash.balance': 'Current balance', 'dash.income': 'Total income', 'dash.expenses': 'Total expenses',
    'dash.month_spend': 'Spent this month', 'dash.remaining_budget': 'Remaining budget', 'dash.savings_progress': 'Savings progress',
    'dash.set_budget': 'Set a monthly budget', 'dash.set_goal': 'Set a savings goal', 'dash.warnings': 'Budget warnings',
    'dash.no_warnings': 'All budgets are on track.', 'dash.no_budgets': 'No budgets yet. Add one to get warnings.',
    'dash.by_category': 'Spending by category (this month)', 'dash.no_spending_month': 'No spending recorded this month.',
    'dash.recent': 'Recent transactions', 'dash.upcoming_tasks': 'Upcoming tasks',
    'dash.study_today': 'Studied today', 'dash.study_week': 'Studied in the last 7 days',

    'tx.title': 'Transactions', 'tx.add': 'Add transaction', 'tx.edit': 'Edit transaction', 'tx.added': 'Transaction added',
    'tx.type': 'Type', 'tx.category': 'Category', 'tx.amount': 'Amount', 'tx.description': 'Description', 'tx.date': 'Date',
    'tx.filters': 'Filter transactions', 'tx.search_ph': 'Description or category',
    'tx.empty': 'No transactions yet. Add your first income or expense.', 'tx.empty_filtered': 'No transactions match these filters.',
    'tx.sum_income': 'Income (filtered)', 'tx.sum_expense': 'Expenses (filtered)', 'tx.sum_net': 'Net (filtered)',

    'bud.title': 'Budgets', 'bud.set': 'Set budget', 'bud.list': 'Monthly budgets', 'bud.category': 'Category', 'bud.limit': 'Limit',
    'bud.spent': 'Spent', 'bud.remaining': 'Remaining', 'bud.used': 'Used', 'bud.used_pct': 'Budget used (%)',
    'bud.month_note': 'Budgets are measured against spending in the current calendar month. A warning appears at 80% and again when you go over.',
    'bud.empty': 'No budgets yet. Start with a total monthly budget.', 'bud.of_limit': 'of {n}',
    'bud.over': 'Over budget ({n}%)', 'bud.near': 'Near limit ({n}%)', 'bud.over_short': 'Over', 'bud.near_short': 'Near limit',
    'bud.goal_title': 'Savings goal', 'bud.goal_set': 'Set goal', 'bud.goal_label': 'Savings goal amount',
    'bud.goal_hint': 'Leave empty to remove the goal.', 'bud.no_goal': 'No savings goal yet.',
    'bud.actual_savings': 'Actual savings (income minus expenses)', 'bud.month_net': 'Net this month',
    'bud.est_title': 'Potential savings', 'bud.estimate_tag': 'Estimate', 'bud.est_need_data': 'Add income and a total monthly budget to see an estimate.',
    'bud.est_monthly': 'Estimated monthly saving if you stay within budget', 'bud.est_months': 'At that pace, you would reach your goal in about {n} month(s).',
    'bud.est_not_reachable': 'At that pace the goal is not reachable. Consider a lower budget.',
    'bud.estimate_note': 'Estimate = average monthly income minus your monthly budget. It is not money you have actually saved.',

    'task.add': 'Add task', 'task.edit': 'Edit task', 'task.name': 'Task', 'task.notes': 'Notes', 'task.priority': 'Priority', 'task.due': 'Deadline',
    'task.status': 'Status', 'task.mark_done': 'Mark as done', 'task.overdue': 'Overdue', 'task.no_due': 'No deadline',
    'task.empty': 'No tasks yet. Add one to get started.', 'task.empty_open': 'No open tasks.', 'task.empty_filtered': 'No tasks match these filters.',
    'task.s_all': 'All', 'task.s_open': 'Open', 'task.s_done': 'Completed', 'task.s_overdue': 'Overdue',
    'task.d_today': 'Due today', 'task.d_week': 'Next 7 days', 'task.d_none': 'No deadline',
    'task.p_low': 'Low', 'task.p_medium': 'Medium', 'task.p_high': 'High',
    'task.c_study': 'Study', 'task.c_university': 'University', 'task.c_work': 'Work', 'task.c_personal': 'Personal',

    'study.tab_tasks': 'Tasks', 'study.tab_sessions': 'Study sessions', 'study.sessions': 'Sessions', 'study.add_session': 'Add session',
    'study.edit_session': 'Edit session', 'study.subject': 'Subject', 'study.target': 'Target', 'study.actual': 'Actual',
    'study.target_min': 'Target (minutes)', 'study.actual_min': 'Actual (minutes)', 'study.log_time': 'Log time', 'study.minutes_to_add': 'Minutes studied',
    'study.no_sessions': 'No study sessions yet.', 'study.no_week': 'No study time logged in the last 7 days.',
    'study.week_actual': 'Studied this week', 'study.week_target': 'Weekly target', 'study.week_progress': 'Target reached',
    'study.week_days': 'Last 7 days', 'study.by_subject': 'By subject', 'study.minutes_unit': 'Minutes per day', 'study.hours': 'Hours',
    'study.pomodoro': 'Pomodoro timer', 'study.focus': 'Focus', 'study.break': 'Break', 'study.start': 'Start', 'study.pause': 'Pause', 'study.reset': 'Reset',
    'study.focus_min': 'Focus (min)', 'study.break_min': 'Break (min)', 'study.need_subject': 'Enter a subject before starting a focus round.',
    'study.focus_done': 'Focus round finished — {n} minutes logged.', 'study.break_done': 'Break over. Ready for another round?',
    'study.pomo_note': 'Completed focus rounds are saved as study sessions. Keep this tab open while the timer runs.',

    'daily.title': 'Daily planner', 'daily.add': 'Add activity', 'daily.edit': 'Edit activity', 'daily.activity': 'Activity',
    'daily.start': 'Start', 'daily.end': 'End (optional)', 'daily.schedule': 'Schedule', 'daily.empty': 'Nothing scheduled for this day.',
    'daily.upcoming': 'Deadlines in the next 7 days', 'daily.no_upcoming': 'No upcoming deadlines.', 'daily.overdue': 'Overdue tasks',
    'daily.completion': 'Completed today', 'daily.plan_items': 'Schedule items', 'daily.tasks_due': 'Tasks due',

    'rep.title': 'Reports', 'rep.period': 'Period', 'rep.months_n': 'Last {n} months', 'rep.insights': 'Financial insights',
    'rep.no_data': 'Not enough data yet.', 'rep.top_categories': 'Highest-spending categories (all time)', 'rep.averages': 'Averages',
    'rep.daily_avg': 'Daily average (this month)', 'rep.monthly_avg': 'Monthly average (all months)',
    'rep.income_vs_expense_month': 'Income vs expenses (this month)', 'rep.small_recurring': 'Small recurring expenses',
    'rep.times': '{n} times', 'rep.no_recurring': 'No repeated small expenses found in the last 90 days.',
    'rep.small_note': 'Same description at least 3 times in 90 days, cheaper than your average expense.',
    'rep.savings': 'Savings', 'rep.actual_savings': 'Actual savings so far', 'rep.est_savings': 'Potential monthly saving',
    'rep.income_vs_expenses': 'Income vs expenses', 'rep.monthly_trend': 'Monthly spending trend', 'rep.by_category': 'Spending by category',
    'rep.budget_util': 'Budget utilization (this month)', 'rep.study_hours': 'Study hours by subject', 'rep.task_completion': 'Task completion',

    'settings.profile': 'Profile', 'settings.role': 'Role', 'settings.role_user': 'User', 'settings.role_admin': 'Admin', 'settings.created': 'Account created',
    'settings.preferences': 'Preferences', 'settings.language': 'Language', 'settings.theme': 'Theme', 'settings.light': 'Light', 'settings.dark': 'Dark',
    'settings.currency': 'Currency', 'settings.local_note': 'Preferences are stored in this browser only.',
    'settings.security': 'Security', 'settings.change_password': 'Change password',

    'admin.users': 'Users', 'admin.activity': 'Login & logout activity', 'admin.total_users': 'Registered users', 'admin.admins': 'Admins',
    'admin.new_week': 'New in the last 7 days', 'admin.last_login': 'Last sign-in', 'admin.logins': 'Logins', 'admin.tx_count': 'Transactions (count)',
    'admin.task_count': 'Tasks (count)', 'admin.user': 'User', 'admin.user_search_ph': 'Email or name', 'admin.no_users': 'No users found.',
    'admin.privacy_note': 'Admins see account details and activity counts only. Private amounts, categories and task contents are never shown here.',
    'admin.online_note': 'Live “online” status is not shown: a browser closing or losing its connection cannot be detected reliably.',
    'admin.event': 'Event', 'admin.time': 'Time', 'admin.source': 'Source', 'admin.details': 'Details', 'admin.no_logs': 'No activity matches these filters.',
    'admin.ev_signup': 'Signup', 'admin.ev_login': 'Login', 'admin.ev_logout': 'Logout',
    'admin.src_server': 'Server (authoritative)', 'admin.src_client': 'Client-reported',
    'admin.source_note': 'Signup and login are recorded by database triggers and are authoritative. Logout is reported by the browser, so a closed tab or lost connection will not appear.',
    'admin.forbidden': 'You do not have access to this page.',
  },

  ar: {
    'common.loading': 'جارٍ التحميل…', 'common.cancel': 'إلغاء', 'common.save': 'حفظ', 'common.delete': 'حذف', 'common.edit': 'تعديل',
    'common.error': 'حدث خطأ ما', 'common.retry': 'حاول مرة أخرى', 'common.search': 'بحث', 'common.all': 'الكل',
    'common.from': 'من', 'common.to': 'إلى', 'common.apply': 'تطبيق', 'common.reset': 'إعادة ضبط', 'common.today': 'اليوم',
    'common.prev': 'السابق', 'common.next': 'التالي', 'common.view_all': 'عرض الكل', 'common.actions': 'الإجراءات',
    'common.not_set': 'غير محدد', 'common.saved': 'تم الحفظ', 'common.deleted': 'تم الحذف',
    'common.confirm_delete': 'هل تريد حذف هذا العنصر؟ لا يمكن التراجع عن ذلك.',
    'common.page_of': 'صفحة {p} من {n}', 'common.total_n': 'الإجمالي {n}',

    'nav.dashboard': 'لوحة التحكم', 'nav.money': 'إدارة الأموال', 'nav.budgets': 'الميزانيات', 'nav.study': 'مخطط الدراسة',
    'nav.daily': 'المخطط اليومي', 'nav.reports': 'التقارير', 'nav.settings': 'الإعدادات', 'nav.admin': 'لوحة المشرف',
    'nav.logout': 'تسجيل الخروج', 'nav.menu': 'فتح القائمة',

    'auth.tagline': 'تخطيط المال والدراسة للطلاب.', 'auth.login': 'تسجيل الدخول', 'auth.register': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني', 'auth.password': 'كلمة المرور', 'auth.confirm_password': 'تأكيد كلمة المرور', 'auth.display_name': 'الاسم المعروض',
    'auth.password_hint': '8 أحرف على الأقل.', 'auth.forgot_link': 'نسيت كلمة المرور؟', 'auth.forgot_title': 'إعادة تعيين كلمة المرور',
    'auth.forgot_text': 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.', 'auth.send_reset': 'إرسال الرابط', 'auth.back_login': 'العودة لتسجيل الدخول',
    'auth.recovery_title': 'اختر كلمة مرور جديدة', 'auth.new_password': 'كلمة المرور الجديدة', 'auth.update_password': 'تحديث كلمة المرور',
    'auth.check_email': 'تم إنشاء الحساب. افتح رابط التأكيد في بريدك الإلكتروني ثم سجّل الدخول.',
    'auth.reset_sent': 'إذا كان هناك حساب بهذا البريد، فسيصلك رابط إعادة التعيين قريبًا.',
    'auth.password_updated': 'تم تحديث كلمة المرور.',
    'auth.config_title': 'الإعداد مطلوب',
    'auth.config_text': 'أضف رابط مشروع Supabase والمفتاح العام (publishable) في الملف التالي ثم أعد تحميل الصفحة.',

    'err.invalid_login': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'err.email_not_confirmed': 'يرجى تأكيد بريدك الإلكتروني أولًا — تحقق من صندوق الوارد.',
    'err.exists': 'يوجد حساب بهذا البريد بالفعل. جرّب تسجيل الدخول.',
    'err.rate': 'محاولات كثيرة. انتظر بضع دقائق ثم حاول مرة أخرى.', 'err.network': 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
    'err.permission': 'ليست لديك صلاحية لتنفيذ هذا الإجراء.', 'err.generic': 'حدث خطأ ما. حاول مرة أخرى.',
    'err.weak_password': 'اختر كلمة مرور أقوى (8 أحرف على الأقل).', 'err.same_password': 'يجب أن تختلف كلمة المرور الجديدة عن القديمة.',
    'err.profile_missing': 'تعذّر تحميل ملفك الشخصي. تأكد من تشغيل ملف database/supabase.sql ثم سجّل الدخول مجددًا.',
    'err.link_expired': 'هذا الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.',

    'val.email': 'أدخل بريدًا إلكترونيًا صحيحًا.', 'val.password_len': 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
    'val.password_match': 'كلمتا المرور غير متطابقتين.', 'val.required': 'يرجى ملء الحقول المطلوبة.',
    'val.amount': 'أدخل مبلغًا أكبر من صفر.', 'val.date': 'أدخل تاريخًا صحيحًا.', 'val.name_len': 'أدخل اسمًا (من 1 إلى 120 حرفًا، والاسم المعروض حتى 60).',
    'val.text_len': 'النص طويل جدًا.', 'val.time': 'أدخل وقتًا صحيحًا.', 'val.end_after_start': 'يجب أن يكون وقت النهاية بعد وقت البداية.',
    'val.minutes': 'أدخل عددًا صحيحًا من الدقائق بين 0 و1440.',

    'cat.food': 'الطعام والمشروبات', 'cat.transport': 'المواصلات', 'cat.housing': 'السكن والفواتير', 'cat.education': 'التعليم',
    'cat.entertainment': 'الترفيه', 'cat.health': 'الصحة', 'cat.small': 'مشتريات صغيرة', 'cat.allowance': 'مصروف أو راتب',
    'cat.extra_income': 'دخل إضافي', 'cat.other': 'أخرى', 'cat.total': 'إجمالي الميزانية الشهرية',
    'type.income': 'دخل', 'type.expense': 'مصروف',
    'unit.h': 'س', 'unit.m': 'د',

    'dash.welcome': 'مرحبًا، {name}', 'dash.balance': 'الرصيد الحالي', 'dash.income': 'إجمالي الدخل', 'dash.expenses': 'إجمالي المصروفات',
    'dash.month_spend': 'المصروف هذا الشهر', 'dash.remaining_budget': 'المتبقي من الميزانية', 'dash.savings_progress': 'التقدم نحو الادخار',
    'dash.set_budget': 'حدّد ميزانية شهرية', 'dash.set_goal': 'حدّد هدفًا للادخار', 'dash.warnings': 'تنبيهات الميزانية',
    'dash.no_warnings': 'جميع الميزانيات ضمن الحدود.', 'dash.no_budgets': 'لا توجد ميزانيات بعد. أضف واحدة لتصلك التنبيهات.',
    'dash.by_category': 'المصروفات حسب الفئة (هذا الشهر)', 'dash.no_spending_month': 'لا توجد مصروفات مسجلة هذا الشهر.',
    'dash.recent': 'آخر المعاملات', 'dash.upcoming_tasks': 'المهام القادمة',
    'dash.study_today': 'مدة الدراسة اليوم', 'dash.study_week': 'مدة الدراسة آخر 7 أيام',

    'tx.title': 'المعاملات', 'tx.add': 'إضافة معاملة', 'tx.edit': 'تعديل المعاملة', 'tx.added': 'تمت إضافة المعاملة',
    'tx.type': 'النوع', 'tx.category': 'الفئة', 'tx.amount': 'المبلغ', 'tx.description': 'الوصف', 'tx.date': 'التاريخ',
    'tx.filters': 'تصفية المعاملات', 'tx.search_ph': 'الوصف أو الفئة',
    'tx.empty': 'لا توجد معاملات بعد. أضف أول دخل أو مصروف.', 'tx.empty_filtered': 'لا توجد معاملات تطابق هذه التصفية.',
    'tx.sum_income': 'الدخل (بعد التصفية)', 'tx.sum_expense': 'المصروفات (بعد التصفية)', 'tx.sum_net': 'الصافي (بعد التصفية)',

    'bud.title': 'الميزانيات', 'bud.set': 'تحديد ميزانية', 'bud.list': 'الميزانيات الشهرية', 'bud.category': 'الفئة', 'bud.limit': 'الحد',
    'bud.spent': 'المصروف', 'bud.remaining': 'المتبقي', 'bud.used': 'المستخدم', 'bud.used_pct': 'نسبة استخدام الميزانية (%)',
    'bud.month_note': 'تُقاس الميزانيات بمصروفات الشهر الحالي. يظهر تنبيه عند 80% وآخر عند تجاوز الحد.',
    'bud.empty': 'لا توجد ميزانيات بعد. ابدأ بميزانية شهرية إجمالية.', 'bud.of_limit': 'من {n}',
    'bud.over': 'تجاوزت الميزانية ({n}%)', 'bud.near': 'اقتربت من الحد ({n}%)', 'bud.over_short': 'تجاوز', 'bud.near_short': 'قريب من الحد',
    'bud.goal_title': 'هدف الادخار', 'bud.goal_set': 'تحديد الهدف', 'bud.goal_label': 'مبلغ هدف الادخار',
    'bud.goal_hint': 'اتركه فارغًا لإزالة الهدف.', 'bud.no_goal': 'لا يوجد هدف ادخار بعد.',
    'bud.actual_savings': 'المدخرات الفعلية (الدخل ناقص المصروفات)', 'bud.month_net': 'صافي هذا الشهر',
    'bud.est_title': 'الادخار المحتمل', 'bud.estimate_tag': 'تقدير', 'bud.est_need_data': 'أضف دخلًا وميزانية شهرية إجمالية لعرض التقدير.',
    'bud.est_monthly': 'الادخار الشهري المقدَّر إذا التزمت بالميزانية', 'bud.est_months': 'بهذا المعدل ستصل إلى هدفك خلال نحو {n} شهر.',
    'bud.est_not_reachable': 'بهذا المعدل لا يمكن الوصول إلى الهدف. فكّر في ميزانية أقل.',
    'bud.estimate_note': 'التقدير = متوسط الدخل الشهري ناقص ميزانيتك الشهرية. وهو ليس مبلغًا ادخرته فعليًا.',

    'task.add': 'إضافة مهمة', 'task.edit': 'تعديل المهمة', 'task.name': 'المهمة', 'task.notes': 'ملاحظات', 'task.priority': 'الأولوية', 'task.due': 'الموعد النهائي',
    'task.status': 'الحالة', 'task.mark_done': 'تحديد كمكتملة', 'task.overdue': 'متأخرة', 'task.no_due': 'بلا موعد نهائي',
    'task.empty': 'لا توجد مهام بعد. أضف مهمة للبدء.', 'task.empty_open': 'لا توجد مهام مفتوحة.', 'task.empty_filtered': 'لا توجد مهام تطابق هذه التصفية.',
    'task.s_all': 'الكل', 'task.s_open': 'مفتوحة', 'task.s_done': 'مكتملة', 'task.s_overdue': 'متأخرة',
    'task.d_today': 'مستحقة اليوم', 'task.d_week': 'خلال 7 أيام', 'task.d_none': 'بلا موعد',
    'task.p_low': 'منخفضة', 'task.p_medium': 'متوسطة', 'task.p_high': 'عالية',
    'task.c_study': 'دراسة', 'task.c_university': 'جامعة', 'task.c_work': 'عمل', 'task.c_personal': 'شخصي',

    'study.tab_tasks': 'المهام', 'study.tab_sessions': 'جلسات الدراسة', 'study.sessions': 'الجلسات', 'study.add_session': 'إضافة جلسة',
    'study.edit_session': 'تعديل الجلسة', 'study.subject': 'المادة', 'study.target': 'الهدف', 'study.actual': 'الفعلي',
    'study.target_min': 'الهدف (دقائق)', 'study.actual_min': 'الفعلي (دقائق)', 'study.log_time': 'تسجيل وقت', 'study.minutes_to_add': 'دقائق الدراسة',
    'study.no_sessions': 'لا توجد جلسات دراسة بعد.', 'study.no_week': 'لا يوجد وقت دراسة مسجل في آخر 7 أيام.',
    'study.week_actual': 'الدراسة هذا الأسبوع', 'study.week_target': 'الهدف الأسبوعي', 'study.week_progress': 'نسبة تحقيق الهدف',
    'study.week_days': 'آخر 7 أيام', 'study.by_subject': 'حسب المادة', 'study.minutes_unit': 'دقائق في اليوم', 'study.hours': 'ساعات',
    'study.pomodoro': 'مؤقت بومودورو', 'study.focus': 'تركيز', 'study.break': 'استراحة', 'study.start': 'ابدأ', 'study.pause': 'إيقاف مؤقت', 'study.reset': 'إعادة ضبط',
    'study.focus_min': 'التركيز (دقيقة)', 'study.break_min': 'الاستراحة (دقيقة)', 'study.need_subject': 'أدخل المادة قبل بدء جولة التركيز.',
    'study.focus_done': 'انتهت جولة التركيز — تم تسجيل {n} دقيقة.', 'study.break_done': 'انتهت الاستراحة. هل أنت جاهز لجولة أخرى؟',
    'study.pomo_note': 'تُحفظ جولات التركيز المكتملة كجلسات دراسة. أبقِ هذه الصفحة مفتوحة أثناء عمل المؤقت.',

    'daily.title': 'المخطط اليومي', 'daily.add': 'إضافة نشاط', 'daily.edit': 'تعديل النشاط', 'daily.activity': 'النشاط',
    'daily.start': 'البداية', 'daily.end': 'النهاية (اختياري)', 'daily.schedule': 'الجدول', 'daily.empty': 'لا يوجد شيء مجدول لهذا اليوم.',
    'daily.upcoming': 'مواعيد التسليم خلال 7 أيام', 'daily.no_upcoming': 'لا توجد مواعيد قادمة.', 'daily.overdue': 'مهام متأخرة',
    'daily.completion': 'المكتمل اليوم', 'daily.plan_items': 'عناصر الجدول', 'daily.tasks_due': 'المهام المستحقة',

    'rep.title': 'التقارير', 'rep.period': 'الفترة', 'rep.months_n': 'آخر {n} أشهر', 'rep.insights': 'تحليلات مالية',
    'rep.no_data': 'لا توجد بيانات كافية بعد.', 'rep.top_categories': 'أعلى الفئات إنفاقًا (كل الفترة)', 'rep.averages': 'المتوسطات',
    'rep.daily_avg': 'المتوسط اليومي (هذا الشهر)', 'rep.monthly_avg': 'المتوسط الشهري (كل الأشهر)',
    'rep.income_vs_expense_month': 'الدخل مقابل المصروفات (هذا الشهر)', 'rep.small_recurring': 'المصروفات الصغيرة المتكررة',
    'rep.times': '{n} مرات', 'rep.no_recurring': 'لا توجد مصروفات صغيرة متكررة خلال آخر 90 يومًا.',
    'rep.small_note': 'الوصف نفسه 3 مرات على الأقل خلال 90 يومًا، وبقيمة أقل من متوسط مصروفاتك.',
    'rep.savings': 'الادخار', 'rep.actual_savings': 'المدخرات الفعلية حتى الآن', 'rep.est_savings': 'الادخار الشهري المحتمل',
    'rep.income_vs_expenses': 'الدخل مقابل المصروفات', 'rep.monthly_trend': 'اتجاه الإنفاق الشهري', 'rep.by_category': 'الإنفاق حسب الفئة',
    'rep.budget_util': 'استخدام الميزانية (هذا الشهر)', 'rep.study_hours': 'ساعات الدراسة حسب المادة', 'rep.task_completion': 'إنجاز المهام',

    'settings.profile': 'الملف الشخصي', 'settings.role': 'الدور', 'settings.role_user': 'مستخدم', 'settings.role_admin': 'مشرف', 'settings.created': 'تاريخ إنشاء الحساب',
    'settings.preferences': 'التفضيلات', 'settings.language': 'اللغة', 'settings.theme': 'المظهر', 'settings.light': 'فاتح', 'settings.dark': 'داكن',
    'settings.currency': 'العملة', 'settings.local_note': 'تُحفظ التفضيلات في هذا المتصفح فقط.',
    'settings.security': 'الأمان', 'settings.change_password': 'تغيير كلمة المرور',

    'admin.users': 'المستخدمون', 'admin.activity': 'نشاط الدخول والخروج', 'admin.total_users': 'المستخدمون المسجلون', 'admin.admins': 'المشرفون',
    'admin.new_week': 'جدد خلال 7 أيام', 'admin.last_login': 'آخر دخول', 'admin.logins': 'مرات الدخول', 'admin.tx_count': 'المعاملات (العدد)',
    'admin.task_count': 'المهام (العدد)', 'admin.user': 'المستخدم', 'admin.user_search_ph': 'البريد أو الاسم', 'admin.no_users': 'لا يوجد مستخدمون.',
    'admin.privacy_note': 'يرى المشرفون بيانات الحسابات وأعداد النشاط فقط. لا تُعرض هنا المبالغ ولا الفئات ولا محتوى المهام.',
    'admin.online_note': 'لا تُعرض حالة «متصل الآن» لأن إغلاق المتصفح أو انقطاع الاتصال لا يمكن اكتشافه بدقة.',
    'admin.event': 'الحدث', 'admin.time': 'الوقت', 'admin.source': 'المصدر', 'admin.details': 'التفاصيل', 'admin.no_logs': 'لا يوجد نشاط يطابق هذه التصفية.',
    'admin.ev_signup': 'تسجيل حساب', 'admin.ev_login': 'دخول', 'admin.ev_logout': 'خروج',
    'admin.src_server': 'الخادم (موثوق)', 'admin.src_client': 'مُبلَّغ من المتصفح',
    'admin.source_note': 'يُسجَّل إنشاء الحساب والدخول بواسطة مشغّلات قاعدة البيانات وهما موثوقان. أما الخروج فيُبلَّغ عنه من المتصفح، لذلك لن يظهر عند إغلاق الصفحة أو انقطاع الاتصال.',
    'admin.forbidden': 'ليست لديك صلاحية الوصول إلى هذه الصفحة.',
  },
};

let lang = (() => {
  const saved = localStorage.getItem(LANG_KEY);
  if (SUPPORTED.includes(saved)) return saved;
  return (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
})();

export const getLang = () => lang;
export const isRTL = () => lang === 'ar';
/** Western digits in both languages keep numbers consistent with form inputs. */
export const getLocale = () => (lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US');

export function t(key, params = {}) {
  const text = dict[lang][key] ?? dict.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => (params[name] ?? `{${name}}`));
}

/** Translates all static markup that carries data-i18n* attributes. */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)));
}

/** Switches language: persists it, mirrors the layout (dir) and notifies the app to re-render. */
export function setLang(next) {
  if (!SUPPORTED.includes(next)) return;
  const changed = next !== lang;
  lang = next;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  applyI18n();
  if (changed) window.dispatchEvent(new Event('balance:langchange'));
}
