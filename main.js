const SUBJECTS = {
    "IGCSE Accounting": "0452",
    "AS/A Accounting": "9706",

    "IGCSE Biology": "0610",
    "AS/A Biology": "9700",

    "IGCSE Business Studies": "0450",
    "AS/A Business": "9609",

    "IGCSE Chemistry": "0620",
    "AS/A Chemistry": "9701",

    "IGCSE Computer Science": "0478",
    "AS/A Computer Science": "9618",

    "IGCSE Economics": "0455",
    "AS/A Economics": "9708",

    "IGCSE English 1st Language": "0500",
    "AS/A English Language": "9093",

    "IGCSE English 2nd Language": "0510",
    "AS/A English Literature": "9695",

    "IGCSE Mathematics": "0580",
    "AS/A Mathematics": "9709",

    "IGCSE Additional Mathematics": "0606",
    "AS/A Further Mathematics": "9231",

    "IGCSE Physics": "0625",
    "AS/A Physics": "9702"
};

const SUBJECT_NAMES = Object.keys(SUBJECTS);

const PAST_PAPER_URL =
    "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/";

const SERIES = {
    fm: "m",
    mj: "s",
    on: "w"
};

const MF19 =
    "https://www.cambridgeinternational.org/Images/417318-list-of-formulae-and-statistical-tables.pdf";

const PSEUDO =
    "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/9618_s25_in_22.pdf";

const STORAGE_THEME_KEY = "theme";
const STORAGE_USER_PREF_KEY = "user_preferences";
const STORAGE_BOOKMARKED_SUBJ_KEY = "bookmarked_subj";
const STORAGE_LAST_FORM_KEY = "last_paper_form";

const PAST_PAPER_TAB = "past-papers-tab";
const BOOKMARK_TAB = "bookmarks-tab";

const themeToggle = document.getElementById("themeToggle");
const html = document.documentElement;
const sunIcon = document.getElementById("sunIcon");
const moonIcon = document.getElementById("moonIcon");

function main()
{
    initialize_theme();

    themeToggle.addEventListener("click", async () => {
        const isDark = html.classList.contains("dark");
        const newTheme = isDark ? "light" : "dark";

        html.classList.toggle("dark", newTheme === "dark");
        sunIcon.classList.toggle("hidden", newTheme !== "dark");
        moonIcon.classList.toggle("hidden", newTheme === "dark");

        await chrome.storage.local.set({ theme: newTheme });
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () =>
            switch_tab(btn.dataset.tab)
        );
    });

    switch_tab(PAST_PAPER_TAB);

    const container = document.getElementById("subj_choices");

    if (container)
    {
        SUBJECT_NAMES.forEach(subject => {
            const label = document.createElement("label");
            label.className =
                "flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = subject;
            checkbox.name = "subjects";
            checkbox.className =
                "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-2";
            checkbox.addEventListener("change", updateSaveButtonState);

            const span = document.createElement("span");
            span.className = "ml-2 text-sm";
            span.textContent = subject;

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }

    chrome.storage.local.get(STORAGE_USER_PREF_KEY, result => {
        const prefs = Array.isArray(result[STORAGE_USER_PREF_KEY])
            ? result[STORAGE_USER_PREF_KEY]
            : [];

        applySavedPreferences(prefs);
        restoreLastFormState();
    });

    document.getElementById("subj_form")?.addEventListener("submit", save_pref);
    document.getElementById("papers_form")?.addEventListener("submit", open_stuff);

    populate_table();
}

async function initialize_theme()
{
    if (!themeToggle || !html || !sunIcon || !moonIcon)
    {
        return;
    }

    const result = await chrome.storage.local.get(STORAGE_THEME_KEY);
    const theme = result.theme || "light";

    html.classList.toggle("dark", theme === "dark");
    sunIcon.classList.toggle("hidden", theme !== "dark");
    moonIcon.classList.toggle("hidden", theme === "dark");
}

function switch_tab(tabName)
{
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.add("hidden");
    });

    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add("active");
    document.getElementById(tabName)?.classList.remove("hidden");
}

function get_order(pages)
{
    while (pages % 4 !== 0)
    {
        pages = parseInt(prompt("Page number: "));
    }

    const order = [];

    for (let i = 1; i <= pages / 2; i++)
    {
        if (i % 2 === 1)
        {
            order.push(pages - (i - 1), i);
        }
        else
        {
            order.push(i, pages - (i - 1));
        }
    }

    return order;
}

function open_stuff(event)
{
    event.preventDefault();

    const action = event.submitter?.value;
    if (!action)
    {
        return;
    }

    saveLastFormState();

    const subject = document.getElementById("exam_subj").value;
    const series = document.getElementById("exam_series").value;
    const year = parseInt(document.getElementById("exam_year").value) - 2000;
    const paper = document.getElementById("exam_paper").value;

    let url;

    if (action === "gt")
    {
        url = `${PAST_PAPER_URL}${SUBJECTS[subject]}_${SERIES[series]}${year}_gt.pdf`;
    }
    else if (action === "qp" || action === "ms")
    {
        url = `${PAST_PAPER_URL}${SUBJECTS[subject]}_${SERIES[series]}${year}_${action}_${paper}.pdf`;
    }
    else if (action === "yt")
    {
        url = `https://www.youtube.com/results?search_query=${SUBJECTS[subject]}+${series}+${year}+Paper+${paper}`;
    }
    else if (action === "bk")
    {
        url = `${PAST_PAPER_URL}${SUBJECTS[subject]}_${SERIES[series]}${year}_qp_${paper}.pdf`;
        open_booklet(url);
        return;
    }
    else if (action === "bm")
    {
        save_bookmark({
            id: `${SUBJECTS[subject]}${SERIES[series]}${year}qp${paper}`,
            subject,
            paper_name: `${year + 2000} ${series.toUpperCase()} ${paper}`,
            year: year + 2000,
            series,
            paper_var: paper
        });

        return;
    }

    window.open(url, "_blank");
}

document.addEventListener("DOMContentLoaded", main);
