/* -----------------------------
    Date helpers
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

    function updateDateLabels() {
    const today = new Date();

    // Top big heading
    document.getElementById("today-heading").textContent =
        formatFullToday(today);

    // Tab middle text (Tuesday, 25th)
    document.getElementById("today-short-label").textContent =
        formatShortToday(today);

    // Sub label under tabs
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
    Calendar (month, Monday start)
    ----------------------------- */
    function renderCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11

    const calendarBody = document.getElementById("calendar-body");
    calendarBody.innerHTML = "";

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1);
    const jsFirstDay = firstDay.getDay(); // 0 = Sun ... 6 = Sat

    // Convert to Monday-based index (Mon=0 ... Sun=6)
    const startIndex = (jsFirstDay + 6) % 7;

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
            cell.textContent = currentDay;

            // highlight today
            if (
            currentDay === today.getDate() &&
            year === today.getFullYear() &&
            month === today.getMonth()
            ) {
            cell.classList.add("today");
            }

            currentDay++;
        }

        row.appendChild(cell);
        }

        calendarBody.appendChild(row);
    }
    }

    /* -----------------------------
    To-do list (left column)
    Stored per-day in localStorage
    ----------------------------- */
    function getTaskStorageKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `tasks-${y}-${m}-${day}`; // simple per-date key
    }

    function loadTasks() {
    const raw = localStorage.getItem(getTaskStorageKey());
    return raw ? JSON.parse(raw) : [];
    }

    function saveTasks(tasks) {
    localStorage.setItem(getTaskStorageKey(), JSON.stringify(tasks));
    }

    function renderTasks() {
    const tasks = loadTasks();
    const list = document.getElementById("task-list");
    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.classList.add("task-item");
        if (task.done) li.classList.add("done");

        const check = document.createElement("div");
        check.classList.add("check");
        check.addEventListener("click", () => {
        tasks[index].done = !tasks[index].done;
        saveTasks(tasks);
        renderTasks();
        });

        const textSpan = document.createElement("span");
        textSpan.classList.add("text");
        textSpan.textContent = task.text;

        const del = document.createElement("span");
        del.classList.add("delete");
        del.textContent = "✕";
        del.addEventListener("click", () => {
        tasks.splice(index, 1);
        saveTasks(tasks);
        renderTasks();
        });

        li.appendChild(check);
        li.appendChild(textSpan);
        li.appendChild(del);

        list.appendChild(li);
    });
    }

    function addTaskFromInput(inputEl) {
    const text = inputEl.value.trim();
    if (!text) return;

    const tasks = loadTasks();
    tasks.push({ text, done: false });
    saveTasks(tasks);

    inputEl.value = "";
    renderTasks();
    }

    function initTasks() {
    const mainInput = document.getElementById("new-task-input");
    const mainButton = document.getElementById("add-task-button");
    const topInput = document.getElementById("top-add-input");

    mainButton.addEventListener("click", () => addTaskFromInput(mainInput));

    mainInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") addTaskFromInput(mainInput);
    });

    // Top bar also adds tasks
    topInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") addTaskFromInput(topInput);
    });

    renderTasks();
    }

        function renderWeekView() {
    const today = new Date();

    // Find Monday of this week
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const weekBody = document.getElementById("week-body");
    weekBody.innerHTML = "";

    const row = document.createElement("tr");

    for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        cell.textContent = date.getDate();

        // Highlight today
        if (date.toDateString() === today.toDateString()) {
        cell.classList.add("today");
        }

        row.appendChild(cell);
    }

    weekBody.appendChild(row);
    }


    /* -----------------------------
    Init on load
    ----------------------------- */
    document.addEventListener("DOMContentLoaded", () => {
    renderWeekView();
    updateDateLabels();
    renderCalendar();
    initTasks();
    });
