    /* -----------------------------
    Helpers: dates & formatting
    ----------------------------- */
    function getSuffix(n) {
    if (n >= 11 && n <= 13) return "th";
    const lastDigit = n % 10;
    if (lastDigit === 1) return "st";
    if (lastDigit === 2) return "nd";
    if (lastDigit === 3) return "rd";
    return "th";
    }

    function formatFullToday(date) {
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();
    return `Today, ${month} ${day}${getSuffix(day)} ${year}`;
    }

    function formatShortToday(date) {
    const weekday = date.toLocaleString("en-US", { weekday: "long" });
    const day = date.getDate();
    return `${weekday}, ${day}${getSuffix(day)}`;
    }

    // local "YYYY-MM-DD" from Date
    function toISODate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
    }

    /* -----------------------------
    Global date labels
    ----------------------------- */
    function updateDateLabels() {
    const today = new Date();

    document.getElementById("today-heading").textContent =
        formatFullToday(today);

    document.getElementById("today-short-label").textContent =
        formatShortToday(today);

    document.getElementById("task-date-label").textContent =
        "Tasks for " + formatShortToday(today);

    // Week-of label (Monday of this week)
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    const mondayDay = monday.getDate();
    document.getElementById("week-of-label").textContent =
        "Monday the " + mondayDay + getSuffix(mondayDay);

    // Month label above calendar
    const monthName = today.toLocaleString("en-US", { month: "long" });
    document.getElementById("current-month").textContent = monthName;
    }

    /* -----------------------------
    Task storage (global)
    ----------------------------- */
    const STORAGE_KEY = "planner-tasks";

    function loadAllTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
    }

    function saveAllTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

/* task = {
text: string,
done: boolean,
dueDate: "YYYY-MM-DD" | null,
workStart: "YYYY-MM-DD" | null,
workEnd: "YYYY-MM-DD" | null,
dueDateTime?: string | null,
workStartDateTime?: string | null,
workEndDateTime?: string | null,
createdAt: string (ISO)
} */

function createTask({
text,
dueDate = null,
workStart = null,
workEnd = null,
dueDateTime = null,
workStartDateTime = null,
workEndDateTime = null
}) {
const tasks = loadAllTasks();

const normalizedDue =
    dueDate || (dueDateTime ? dueDateTime.slice(0, 10) : null);
const normalizedWorkStart =
    workStart || (workStartDateTime ? workStartDateTime.slice(0, 10) : null);
const normalizedWorkEnd =
    workEnd || (workEndDateTime ? workEndDateTime.slice(0, 10) : null);

tasks.push({
    text,
    done: false,
    dueDate: normalizedDue,
    workStart: normalizedWorkStart,
    workEnd: normalizedWorkEnd,
    dueDateTime: dueDateTime || null,
    workStartDateTime: workStartDateTime || null,
    workEndDateTime: workEndDateTime || null,
    createdAt: new Date().toISOString()
});
saveAllTasks(tasks);
}

    /* tasks that "belong" to a given day, for the left list:
    - due that day OR
    - work window includes that day
    */
    function tasksForDate(isoDate) {
    const tasks = loadAllTasks();
    return tasks.filter((t) => {
        let matchesDue = t.dueDate === isoDate;
        let inWindow = false;
        if (t.workStart && t.workEnd) {
        inWindow = t.workStart <= isoDate && isoDate <= t.workEnd;
        }
        return matchesDue || inWindow;
    });
    }

    /* For calendar marking */
function dayHasDueTask(isoDate) {
    const tasks = loadAllTasks();
    return tasks.some((t) => t.dueDate === isoDate);
}

function tasksDueOnDate(isoDate) {
    const tasks = loadAllTasks();
    return tasks.filter((t) => t.dueDate === isoDate);
}

function dayHasWorkWindow(isoDate) {
    const tasks = loadAllTasks();
    return tasks.some(
        (t) => t.workStart && t.workEnd && t.workStart <= isoDate && isoDate <= t.workEnd
    );
    }

    /* -----------------------------
    Week view (Mon–Sun for current week)
    ----------------------------- */
        function renderWeekView() {
    const today = new Date();

    // 1. Find Monday of this week
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const weekBody = document.getElementById("week-body");
    weekBody.innerHTML = "";

    const weekDates = [];
    const dateRow = document.createElement("tr");

    // --- First (and only) row: day numbers ---
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        const iso = toISODate(date);
        weekDates.push({ date, iso });

        const cell = document.createElement("td");
        cell.textContent = date.getDate();

        if (date.toDateString() === today.toDateString()) {
        cell.classList.add("today");
        }

        // keep your markers if you like
        if (typeof dayHasDueTask === "function" && dayHasDueTask(iso)) {
        cell.classList.add("has-task");
        }
        if (typeof dayHasWorkWindow === "function" && dayHasWorkWindow(iso)) {
        cell.classList.add("has-window");
        }

        dateRow.appendChild(cell);
    }

    weekBody.appendChild(dateRow);

    // Draw overlay bars on top of this row
function drawWeekBars(weekDates, dateRow) {
    const barsLayer = document.getElementById("week-bars-layer");
    if (!barsLayer) return;
    barsLayer.innerHTML = "";

    const allTasks = loadAllTasks();
    if (!allTasks.length) return;

    const weekStartISO = weekDates[0].iso;
    const weekEndISO = weekDates[6].iso;

    // Tasks that touch this week at all
    const tasksInWeek = allTasks.filter((t) => {
        const hasDueInWeek =
        t.dueDate && t.dueDate >= weekStartISO && t.dueDate <= weekEndISO;

        let windowOverlaps = false;
        if (t.workStart && t.workEnd) {
        windowOverlaps = !(
            t.workEnd < weekStartISO || t.workStart > weekEndISO
        );
        }

        return hasDueInWeek || windowOverlaps;
    });

    if (!tasksInWeek.length) return;

    const layerRect = barsLayer.getBoundingClientRect();
    const rowRect = dateRow.getBoundingClientRect();

    const barHeight = 14;
    const gap = 4;
    const radiusPx = barHeight; // quick pill radius
    const baseOffset = 6;
    const dueOffsetLeft = 6;
    const dueOffsetRight = 6;

    const bars = [];

    tasksInWeek.forEach((task) => {
        const hasWindow = task.workStart && task.workEnd;
        const dueInWeek =
        task.dueDate &&
        task.dueDate >= weekStartISO &&
        task.dueDate <= weekEndISO;

        let windowStartIdx = -1;
        let windowEndIdx = -1;

        if (hasWindow) {
        const spanStartISO =
            task.workStart > weekStartISO ? task.workStart : weekStartISO;
        const spanEndISO =
            task.workEnd < weekEndISO ? task.workEnd : weekEndISO;

        windowStartIdx = weekDates.findIndex((d) => d.iso === spanStartISO);
        windowEndIdx = weekDates.findIndex((d) => d.iso === spanEndISO);

        if (windowStartIdx !== -1 && windowEndIdx !== -1) {
            const dueIdxWithinWindow =
            dueInWeek &&
            task.dueDate >= task.workStart &&
            task.dueDate <= task.workEnd
                ? weekDates.findIndex((d) => d.iso === task.dueDate)
                : null;

            bars.push({
            type: "window",
            startIdx: windowStartIdx,
            endIdx: windowEndIdx,
            dueIdx: dueIdxWithinWindow,
            text: task.text
            });
        }
        }

        if (dueInWeek) {
        const dueIdx = weekDates.findIndex((d) => d.iso === task.dueDate);
        const dueInsideWindow =
            hasWindow &&
            task.dueDate >= task.workStart &&
            task.dueDate <= task.workEnd;

        // If no window, or due is outside the window, draw a dedicated due bar.
        if (dueIdx !== -1 && (!hasWindow || !dueInsideWindow)) {
            bars.push({
            type: "dueOnly",
            startIdx: dueIdx,
            endIdx: dueIdx,
            text: task.text
            });
        }
        }
    });

    if (!bars.length) return;

    const totalHeight = bars.length * barHeight + (bars.length - 1) * gap;

    // Leave room for the date numbers at the top of each cell.
    const labelReserve = -40; // px reserved for the day number (smaller gap)
    const baseTop =
        rowRect.top -
        layerRect.top +
        labelReserve +
        (rowRect.height - labelReserve - totalHeight) / 2;

    bars.forEach((bar, index) => {
        const startCellRect =
        dateRow.children[bar.startIdx].getBoundingClientRect();
        const endCellRect = dateRow.children[bar.endIdx].getBoundingClientRect();

        const left = startCellRect.left - layerRect.left + 8; // small inner padding
        const right = endCellRect.right - layerRect.left - 4;
        const width = right - left;

        const top = baseTop + index * (barHeight + gap);

        if (bar.type === "window") {
        const baseBar = document.createElement("div");
        baseBar.className = "week-task-bar week-task-bar-base";
        baseBar.style.left = left - baseOffset + "px";
        baseBar.style.top = top + "px";
        baseBar.style.width = width + "px";
        baseBar.style.height = barHeight + "px";
        baseBar.style.borderRadius = radiusPx + "px";
        baseBar.textContent = bar.text;
        barsLayer.appendChild(baseBar);

        if (bar.dueIdx !== null && bar.dueIdx !== undefined) {
            const dueCellRect =
            dateRow.children[bar.dueIdx].getBoundingClientRect();

            const dLeft = dueCellRect.left - layerRect.left + 7;
            const dRight = dueCellRect.right - layerRect.left - 4;

            const dueBar = document.createElement("div");
            dueBar.className = "week-task-bar week-task-bar-due";
            dueBar.style.left = dLeft - dueOffsetLeft + "px";
            dueBar.style.top = top + "px";
            dueBar.style.width =
            dRight - dLeft - dueOffsetRight + dueOffsetLeft + "px";
            dueBar.style.height = barHeight + "px";
            const tl = bar.dueIdx === bar.startIdx ? radiusPx : 0;
            const tr = bar.dueIdx === bar.endIdx ? radiusPx : 0;
            const br = tr;
            const bl = tl;
            dueBar.style.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;

            barsLayer.appendChild(dueBar);
        }
        } else if (bar.type === "dueOnly") {
        const dueCellRect =
            dateRow.children[bar.startIdx].getBoundingClientRect();
        const dLeft = dueCellRect.left - layerRect.left + 8;
        const dRight = dueCellRect.right - layerRect.left - 4;

        const dueBar = document.createElement("div");
        dueBar.className = "week-task-bar week-task-bar-due";
        dueBar.style.left = dLeft - dueOffsetLeft + "px";
        dueBar.style.top = top + "px";
        dueBar.style.width =
            dRight - dLeft - dueOffsetRight + dueOffsetLeft + "px";
        dueBar.style.height = barHeight + "px";
        dueBar.style.borderRadius = `${radiusPx}px`;
        dueBar.textContent = bar.text;
        barsLayer.appendChild(dueBar);
        }
    });
}

    // Draw overlay bars positioned above the week table cells
    drawWeekBars(weekDates, dateRow);
}


    /* -----------------------------
    Month calendar (Monday start)
    ----------------------------- */
    function renderCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0–11

    const calendarBody = document.getElementById("calendar-body");
    calendarBody.innerHTML = "";

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1);
    const jsFirstDay = firstDay.getDay(); // 0 = Sun ... 6 = Sat

    const startIndex = (jsFirstDay + 6) % 7; // Monday-based index

    let currentDay = 1;

    while (currentDay <= daysInMonth) {
        const row = document.createElement("tr");

        for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");

        if (
            (calendarBody.children.length === 0 && i < startIndex) ||
            currentDay > daysInMonth
        ) {
            cell.textContent = "";
        } else {
            const date = new Date(year, month, currentDay);
            const iso = toISODate(date);

            cell.textContent = currentDay;

            if (
            currentDay === today.getDate() &&
            year === today.getFullYear() &&
            month === today.getMonth()
            ) {
            cell.classList.add("today");
            }

            if (dayHasDueTask(iso)) {
            cell.classList.add("has-task");
            const dueTasks = tasksDueOnDate(iso);
            dueTasks.forEach((t) => {
                const duePill = document.createElement("div");
                duePill.className = "month-due-pill";
                duePill.textContent = t.text;
                duePill.title = t.text;
                cell.appendChild(duePill);
            });
            }

            if (dayHasWorkWindow(iso)) {
            cell.classList.add("has-window");
            }

            currentDay++;
        }

        row.appendChild(cell);
        }

        calendarBody.appendChild(row);
    }
    }
        // Turn stored dueDate or dueDateTime into a nice label
    function formatDueLabel(task) {
    // If we have full datetime stored (e.g. "2025-12-04T23:30")
    if (task.dueDateTime) {
        const d = new Date(task.dueDateTime);

        const month = d.toLocaleString("en-US", { month: "short" }); // Dec
        const day = d.getDate();
        const time = d.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit"
        }); // 11:30 PM

        return ` (due ${month} ${day}${getSuffix(day)}, ${time})`;
    }

    // Fallback: only have date (YYYY-MM-DD)
    if (task.dueDate) {
        const [year, monthStr, dayStr] = task.dueDate.split("-");
        const yearNum = Number(year);
        const monthNum = Number(monthStr) - 1;
        const dayNum = Number(dayStr);

        const d = new Date(yearNum, monthNum, dayNum);
        const monthName = d.toLocaleString("en-US", { month: "short" });

        return ` (due ${monthName} ${dayNum}${getSuffix(dayNum)})`;
    }

    // No due info at all
    return "";
    }


    /* -----------------------------
    Task list (left column)
    ----------------------------- */
    function renderTasksForToday() {
    const todayIso = toISODate(new Date());
    const tasks = tasksForDate(todayIso);
    const list = document.getElementById("task-list");
    list.innerHTML = "";

    const allTasks = loadAllTasks(); // for updating & deleting

    tasks.forEach((task) => {
        const li = document.createElement("li");
        li.classList.add("task-item");
        if (task.done) li.classList.add("done");

        const check = document.createElement("div");
        check.classList.add("check");

        check.addEventListener("click", () => {
        const all = loadAllTasks();
        const idx = all.findIndex(
            (t) =>
            t.text === task.text &&
            t.createdAt === task.createdAt
        );
        if (idx !== -1) {
            all[idx].done = !all[idx].done;
            saveAllTasks(all);
            refreshUI();
        }
        });

        const textSpan = document.createElement("span");
        textSpan.classList.add("text");
        textSpan.textContent = task.text;

        const dueText = formatDueLabel(task);
        if (dueText) {
            const dueLabel = document.createElement("span");
            dueLabel.style.fontSize = "0.75rem";
            dueLabel.style.color = "#999";
            dueLabel.textContent = dueText;
            textSpan.appendChild(dueLabel);
        }


        const del = document.createElement("span");
        del.classList.add("delete");
        del.textContent = "✕";
        del.addEventListener("click", () => {
        const all = loadAllTasks();
        const idx = all.findIndex(
            (t) =>
            t.text === task.text &&
            t.createdAt === task.createdAt
        );
        if (idx !== -1) {
            all.splice(idx, 1);
            saveAllTasks(all);
            refreshUI();
        }
        });

        li.appendChild(check);
        li.appendChild(textSpan);
        li.appendChild(del);
        list.appendChild(li);
    });
    }

/* -----------------------------
Task creation
----------------------------- */

function toggleDueInputs(disabled) {
const dueDateInput = document.getElementById("due-date-input");
const dueTimeInput = document.getElementById("due-time-input");

dueDateInput.disabled = disabled;
dueTimeInput.disabled = disabled;

if (disabled) {
    dueDateInput.value = "";
    dueTimeInput.value = "";
}
}

function toggleWindowInputs(disabled) {
const wsDateInput = document.getElementById("work-start-date-input");
const wsTimeInput = document.getElementById("work-start-time-input");
const weDateInput = document.getElementById("work-end-date-input");
const weTimeInput = document.getElementById("work-end-time-input");

[wsDateInput, wsTimeInput, weDateInput, weTimeInput].forEach((el) => {
    el.disabled = disabled;
});

if (disabled) {
    wsDateInput.value = "";
    wsTimeInput.value = "";
    weDateInput.value = "";
    weTimeInput.value = "";
}
}

function initTaskFormToggles() {
const noDueToggle = document.getElementById("no-due-toggle");
const noWindowToggle = document.getElementById("no-window-toggle");

const syncDue = () => toggleDueInputs(noDueToggle.checked);
const syncWindow = () => toggleWindowInputs(noWindowToggle.checked);

noDueToggle.addEventListener("change", syncDue);
noWindowToggle.addEventListener("change", syncWindow);

syncDue();
syncWindow();
}

function handleQuickAdd() {
const input = document.getElementById("top-add-input");
const text = input.value.trim();
if (!text) return;

    const today = new Date();
    const dueIso = toISODate(today); // daily task, due today at "midnight" conceptually

    createTask({
        text,
        dueDate: dueIso,
        workStart: null,
        workEnd: null
    });

    input.value = "";
    refreshUI();
    }

    function handleFormAdd() {
    const input = document.getElementById("top-add-input");
    const text = input.value.trim();
    if (!text) return;

    const noDue = document.getElementById("no-due-toggle").checked;
    const noWindow = document.getElementById("no-window-toggle").checked;

    // Due date+time fields
    const dueDate = noDue ? null : (document.getElementById("due-date-input").value || null);
    const dueTime = noDue ? null : (document.getElementById("due-time-input").value || null);

    // Work window fields
    const wsDate = noWindow ? null : (document.getElementById("work-start-date-input").value || null);
    const wsTime = noWindow ? null : (document.getElementById("work-start-time-input").value || null);

    const weDate = noWindow ? null : (document.getElementById("work-end-date-input").value || null);
    const weTime = noWindow ? null : (document.getElementById("work-end-time-input").value || null);

    // Build datetime-local strings ONLY if date exists
    const dueDT = dueDate ? `${dueDate}${dueTime ? 'T' + dueTime : ''}` : null;
    const wsDT  = wsDate  ? `${wsDate}${wsTime ? 'T' + wsTime : ''}` : null;
    const weDT  = weDate  ? `${weDate}${weTime ? 'T' + weTime : ''}` : null;

    createTask({
        text,
        dueDateTime: dueDT,
        workStartDateTime: wsDT,
        workEndDateTime: weDT
    });

    // Reset form
    input.value = "";
    document.getElementById("due-date-input").value = "";
    document.getElementById("due-time-input").value = "";
    document.getElementById("work-start-date-input").value = "";
    document.getElementById("work-start-time-input").value = "";
    document.getElementById("work-end-date-input").value = "";
    document.getElementById("work-end-time-input").value = "";
    document.getElementById("no-due-toggle").checked = false;
    document.getElementById("no-window-toggle").checked = false;
    toggleDueInputs(false);
    toggleWindowInputs(false);

    // Close dropdown
    document.getElementById("task-form").classList.add("hidden");

    refreshUI();
    }


    /* -----------------------------
    UI wiring
    ----------------------------- */
    function initTasks() {
    const topInput = document.getElementById("top-add-input");
    const topPlus = document.getElementById("top-add-toggle");
    const taskForm = document.getElementById("task-form");
    const formSubmit = document.getElementById("task-form-submit");
    initTaskFormToggles();

    // Enter in input = quick daily task
    topInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
        handleQuickAdd();
        }
    });

    // + button toggles dropdown
    topPlus.addEventListener("click", () => {
        taskForm.classList.toggle("hidden");
    });

    // Form "Add task" button
    formSubmit.addEventListener("click", () => {
        handleFormAdd();
    });

    renderTasksForToday();
    }

    /* -----------------------------
    Refresh all views
    ----------------------------- */
    function refreshUI() {
    renderTasksForToday();
    renderWeekView();
    renderCalendar();
    }

    /* -----------------------------
    Init on load
    ----------------------------- */
    document.addEventListener("DOMContentLoaded", () => {
    updateDateLabels();
    renderWeekView();
    renderCalendar();
    initTasks();
    initSettingsMenu();


    // Keep overlay bars aligned on resize
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderWeekView, 150);
    });
    
    });
document.getElementById("manage-tasks-btn").addEventListener("click", () => {
    const panel = document.getElementById("all-tasks-panel");
    const tasks = loadAllTasks();

    if (!tasks.length) {
        panel.innerHTML = "<p>No tasks stored.</p>";
        panel.style.display = "block";
        return;
    }

    panel.style.display = panel.style.display === "none" ? "block" : "none";

    panel.innerHTML = tasks
        .map(
            (t, i) => `
        <div style="padding:6px 0; border-bottom:1px solid #ddd;">
            <strong>${t.text}</strong>
            <br>
            <small>
                created: ${t.createdAt}<br>
                due: ${t.dueDate || "none"}, 
                window: ${t.workStart || "-"} → ${t.workEnd || "-"}
            </small>
            <br>
            <button data-index="${i}" class="delete-task-btn">Delete</button>
        </div>`
        )
        .join("");

    document.querySelectorAll(".delete-task-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const idx = Number(e.target.dataset.index);
            const all = loadAllTasks();
            all.splice(idx, 1);
            saveAllTasks(all);
            panel.style.display = "none";
            refreshUI();
        });
    });
});
/* -----------------------------
Settings Dropdown (Manage All Tasks)
----------------------------- */

function renderAllTasksForSettings() {
    const panel = document.getElementById("all-tasks-container");
    const tasks = loadAllTasks();

    if (!tasks.length) {
        panel.innerHTML = "<p>No tasks stored.</p>";
        return;
    }

    panel.innerHTML = tasks
        .map(
            (t, i) => `
        <div>
            <strong>${t.text}</strong><br>
            <small>
                created: ${t.createdAt}<br>
                due: ${t.dueDate || "none"}<br>
                window: ${t.workStart || "-"} → ${t.workEnd || "-"}
            </small>
            <br>
            <button class="delete-task-global" data-index="${i}">
                Delete
            </button>
        </div>
    `
        )
        .join("");

    document.querySelectorAll(".delete-task-global").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.target.dataset.index);
            const all = loadAllTasks();
            all.splice(index, 1);
            saveAllTasks(all);
            renderAllTasksForSettings();
            refreshUI();
        });
    });
}

function initSettingsMenu() {
    const toggle = document.getElementById("settings-toggle");
    const menu = document.getElementById("settings-menu");

    toggle.addEventListener("click", () => {
        menu.classList.toggle("hidden");
        if (!menu.classList.contains("hidden")) {
            renderAllTasksForSettings();
        }
    });
}

/* -----------------------------
Settings editor enhancements (date/time)
----------------------------- */
function updateTaskDateFields(index) {
    const all = loadAllTasks();
    const task = all[index];
    if (!task) return;

    const dueDate = document.getElementById(`settings-due-date-${index}`).value || null;
    const dueTime = document.getElementById(`settings-due-time-${index}`).value || null;
    const wsDate = document.getElementById(`settings-ws-date-${index}`).value || null;
    const wsTime = document.getElementById(`settings-ws-time-${index}`).value || null;
    const weDate = document.getElementById(`settings-we-date-${index}`).value || null;
    const weTime = document.getElementById(`settings-we-time-${index}`).value || null;

    const dueDT = dueDate ? `${dueDate}${dueTime ? "T" + dueTime : ""}` : null;
    const wsDT = wsDate ? `${wsDate}${wsTime ? "T" + wsTime : ""}` : null;
    const weDT = weDate ? `${weDate}${weTime ? "T" + weTime : ""}` : null;

    task.dueDate = dueDate;
    task.dueDateTime = dueDT;
    task.workStart = wsDate;
    task.workStartDateTime = wsDT;
    task.workEnd = weDate;
    task.workEndDateTime = weDT;

    saveAllTasks(all);
    renderAllTasksForSettings();
    refreshUI();
}

function renderAllTasksForSettings() {
    const panel = document.getElementById("all-tasks-container");
    const tasks = loadAllTasks();

    if (!tasks.length) {
        panel.innerHTML = "<p>No tasks stored.</p>";
        return;
    }

    const buildDate = (taskDateTime, taskDateOnly) =>
        taskDateTime ? taskDateTime.slice(0, 10) : taskDateOnly || "";

    const buildTime = (taskDateTime) =>
        taskDateTime && taskDateTime.includes("T") ? taskDateTime.slice(11, 16) : "";

    panel.innerHTML = tasks
        .map((t, i) => {
            const dueDateVal = buildDate(t.dueDateTime, t.dueDate);
            const dueTimeVal = buildTime(t.dueDateTime);
            const wsDateVal = buildDate(t.workStartDateTime, t.workStart);
            const wsTimeVal = buildTime(t.workStartDateTime);
            const weDateVal = buildDate(t.workEndDateTime, t.workEnd);
            const weTimeVal = buildTime(t.workEndDateTime);

            return `
        <div class="settings-task">
            <div class="settings-task-header">
                <strong>${t.text}</strong>
                <small>created: ${t.createdAt}</small>
            </div>
            <div class="settings-task-row">
                <label>Due</label>
                <input type="date" id="settings-due-date-${i}" value="${dueDateVal}">
                <input type="time" id="settings-due-time-${i}" value="${dueTimeVal}">
            </div>
            <div class="settings-task-row">
                <label>Work Start</label>
                <input type="date" id="settings-ws-date-${i}" value="${wsDateVal}">
                <input type="time" id="settings-ws-time-${i}" value="${wsTimeVal}">
            </div>
            <div class="settings-task-row">
                <label>Work End</label>
                <input type="date" id="settings-we-date-${i}" value="${weDateVal}">
                <input type="time" id="settings-we-time-${i}" value="${weTimeVal}">
            </div>
            <div class="settings-task-actions">
                <button class="update-task-btn" data-index="${i}">Update</button>
                <button class="delete-task-global" data-index="${i}">Delete</button>
            </div>
        </div>
    `;
        })
        .join("");

    document.querySelectorAll(".update-task-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.target.dataset.index);
            updateTaskDateFields(index);
        });
    });

    document.querySelectorAll(".delete-task-global").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = Number(e.target.dataset.index);
            const all = loadAllTasks();
            all.splice(index, 1);
            saveAllTasks(all);
            renderAllTasksForSettings();
            refreshUI();
        });
    });
}
