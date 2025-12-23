// Subjects declaration
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


// Subject keys
const SUBJECT_NAMES = Object.keys(SUBJECTS);

// Base PapaCambridge URL
const PAST_PAPER_URL =
    "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/";


// Paper series declaration
const SERIES = {
    "fm": "m",
    "mj": "s",
    "on": "w"
};

// Other stuff
const MF19 =
    "https://www.cambridgeinternational.org/Images/417318-list-of-formulae-and-statistical-tables.pdf";
const PSEUDO =
    "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/9618_s25_in_22.pdf";


// Chrome storage keys
const STORAGE_THEME_KEY = "theme";
const STORAGE_USER_PREF_KEY = "user_preferences";
const STORAGE_BOOKMARKED_SUBJ_KEY = "bookmarked_subj";
const STORAGE_LAST_FORM_KEY = "last_paper_form";

// Tab names
const PAST_PAPER_TAB = "past-papers-tab";
const BOOKMARK_TAB = "bookmarks-tab";


// Theme items
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

        if (newTheme === "dark")
        {
            html.classList.add("dark");
            sunIcon.classList.remove("hidden");
            moonIcon.classList.add("hidden");
        }
        else
        {
            html.classList.remove("dark");
            sunIcon.classList.add("hidden");
            moonIcon.classList.remove("hidden");
        }

        try
        {
            await chrome.storage.local.set({ theme: newTheme });
        }
        catch (error)
        {
            console.error(error);
        }
    });

    const tabBtns = document.querySelectorAll(".tab-btn");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () =>
            switch_tab(btn.dataset.tab)
        );
    });

    switch_tab(PAST_PAPER_TAB);

    const container = document.getElementById("subj_choices");

    if (container)
    {
        SUBJECT_NAMES.forEach(sub => {
            const label = document.createElement("label");
            label.className =
                "flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = sub;
            checkbox.name = "subjects";
            checkbox.className =
                "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
            checkbox.addEventListener("change", updateSaveButtonState);

            const span = document.createElement("span");
            span.className = "ml-2 text-sm text-gray-700 dark:text-gray-300";
            span.textContent = sub;

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }

    chrome.storage.local.get(
        [STORAGE_USER_PREF_KEY],
        result => {
            const prefs = Array.isArray(result[STORAGE_USER_PREF_KEY])
                ? result[STORAGE_USER_PREF_KEY]
                : [];

            applySavedPreferences(prefs);
            restoreLastFormState();
        }
    );

    const subjForm = document.getElementById("subj_form");
    if (subjForm)
    {
        subjForm.addEventListener("submit", save_pref);
    }

    const papersForm = document.getElementById("papers_form");
    if (papersForm)
    {
        papersForm.addEventListener("submit", open_stuff);
    }

    populate_table();
}


async function initialize_theme()
{
    if (!themeToggle || !html || !sunIcon || !moonIcon)
    {
        return;
    }

    try
    {
        const result = await chrome.storage.local.get(STORAGE_THEME_KEY);
        const currentTheme = result.theme || "light";

        if (currentTheme === "dark")
        {
            html.classList.add("dark");
            sunIcon.classList.remove("hidden");
            moonIcon.classList.add("hidden");
        }
        else
        {
            html.classList.remove("dark");
            sunIcon.classList.add("hidden");
            moonIcon.classList.remove("hidden");
        }
    }
    catch (error)
    {
        console.error(error);
    }
}


function switch_tab(tabName)
{
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach(b => {
        b.classList.remove(
            "active",
            "border-blue-600",
            "dark:border-blue-400"
        );
        b.classList.add("border-transparent");

        const span = b.querySelector("span");
        if (span)
        {
            span.classList.remove(
                "text-blue-600",
                "dark:text-blue-400"
            );
            span.classList.add(
                "text-gray-500",
                "dark:text-gray-400"
            );
        }
    });

    const targetBtn =
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`);

    if (targetBtn)
    {
        targetBtn.classList.add(
            "active",
            "border-blue-600",
            "dark:border-blue-400"
        );
        targetBtn.classList.remove("border-transparent");

        const span = targetBtn.querySelector("span");
        if (span)
        {
            span.classList.remove(
                "text-gray-500",
                "dark:text-gray-400"
            );
            span.classList.add(
                "text-blue-600",
                "dark:text-blue-400"
            );
        }
    }

    tabContents.forEach(content =>
        content.classList.add("hidden")
    );

    document
        .getElementById(tabName)
        .classList.remove("hidden");
}


function get_order(num_of_pages)
{
    while (num_of_pages % 4 !== 0)
    {
        num_of_pages = parseInt(prompt("Page number: "));
    }

    const page_order = [];

    for (let i = 1; i <= num_of_pages / 2; i++)
    {
        if (i % 2 === 1)
        {
            page_order.push(num_of_pages - (i - 1));
            page_order.push(i);
        }
        else
        {
            page_order.push(i);
            page_order.push(num_of_pages - (i - 1));
        }
    }

    return page_order;
}


function title_case(s)
{
    return s
        .toLowerCase()
        .split(" ")
        .map(
            word =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}


function open_stuff(event)
{
    event.preventDefault();

    const submitter =
        event.submitter || document.activeElement;
    const action = submitter && submitter.value;

    if (!action)
    {
        return;
    }

    saveLastFormState();

    const chosen_subj =
        document.getElementById("exam_subj").value;
    const chosen_series =
        document.getElementById("exam_series").value;
    const chosen_year =
        parseInt(
            document.getElementById("exam_year").value
        ) - 2000;

    if (action === "gt")
    {
        const url =
            `${PAST_PAPER_URL}${SUBJECTS[chosen_subj]}_${SERIES[chosen_series]}${chosen_year}_${action}.pdf`;

        window.open(url, "_blank").focus();
    }
    else if (action === "qp" || action === "ms")
    {
        const chosen_paper =
            document.getElementById("exam_paper").value;

        const url =
            `${PAST_PAPER_URL}${SUBJECTS[chosen_subj]}_${SERIES[chosen_series]}${chosen_year}_${action}_${chosen_paper}.pdf`;

        window.open(url, "_blank").focus();
    }
    else if (action === "yt")
    {
        const chosen_paper =
            document.getElementById("exam_paper").value;

        const url =
            `https://www.youtube.com/results?search_query=${SUBJECTS[chosen_subj]}+${chosen_series}+${chosen_year}+Paper+${chosen_paper}`;

        window.open(url, "_blank").focus();
    }
    else if (action === "bk")
    {
        const chosen_paper =
            document.getElementById("exam_paper").value;

        const url =
            `${PAST_PAPER_URL}${SUBJECTS[chosen_subj]}_${SERIES[chosen_series]}${chosen_year}_qp_${chosen_paper}.pdf`;

        open_booklet(url);
    }
    else if (action === "bm")
    {
        const chosen_paper =
            document.getElementById("exam_paper").value;

        const id =
            `${SUBJECTS[chosen_subj]}${SERIES[chosen_series]}${chosen_year}qp${chosen_paper}`;

        const paper_name =
            `${chosen_year + 2000} ${chosen_series.toUpperCase()} ${chosen_paper}`;


        const new_entry = {
            id: id,
            subject: chosen_subj,
            paper_name: paper_name,
            year: chosen_year + 2000,
            series: chosen_series,
            paper_var: chosen_paper,
        };

        save_bookmark(new_entry);
    }
}


function saveLastFormState()
{
    const state = {
        subject: document.getElementById("exam_subj").value,
        season: document.getElementById("exam_series").value,
        year: document.getElementById("exam_year").value,
        paper: document.getElementById("exam_paper").value
    };

    chrome.storage.local.set({
        [STORAGE_LAST_FORM_KEY]: state
    });
}


function restoreLastFormState()
{
    chrome.storage.local.get(
        STORAGE_LAST_FORM_KEY,
        result => {
            const state =
                result[STORAGE_LAST_FORM_KEY];
            if (!state)
            {
                return;
            }

            const subj =
                document.getElementById("exam_subj");
            const season =
                document.getElementById("exam_series");
            const year =
                document.getElementById("exam_year");
            const paper =
                document.getElementById("exam_paper");

            if (subj) subj.value = state.subject;
            if (season) season.value = state.season;
            if (year) year.value = state.year;
            if (paper) paper.value = state.paper;
        }
    );
}


async function save_pref(event)
{
    event.preventDefault();

    const checkboxes =
        document.querySelectorAll(
            '#subj_choices input[type="checkbox"]:checked'
        );

    const selectedSubjects =
        Array.from(checkboxes).map(cb => cb.value);

    chrome.storage.local.set(
        { [STORAGE_USER_PREF_KEY]: selectedSubjects },
        () => {
            applySavedPreferences(selectedSubjects);
            switch_tab(PAST_PAPER_TAB);
        }
    );
}


function populateExamSelect(subjects)
{
    const select =
        document.getElementById("exam_subj");

    if (select)
    {
        select.innerHTML =
            "<option selected disabled>Choose...</option>";

        subjects.forEach(subject => {
            const option =
                document.createElement("option");
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });
    }
}


function applySavedPreferences(savedSubjects = [])
{
    const allCheckboxes =
        document.querySelectorAll(
            '#subj_choices input[type="checkbox"]'
        );

    allCheckboxes.forEach(cb => {
        cb.checked = savedSubjects.includes(cb.value);
        cb.addEventListener(
            "change",
            updateSaveButtonState
        );
    });

    populateExamSelect(savedSubjects);
    updateSaveButtonState();
}


function updateSaveButtonState()
{
    const anyChecked =
        document.querySelectorAll(
            '#subj_choices input[type="checkbox"]:checked'
        ).length > 0;

    const saveBtn =
        document.getElementById("save_subj");

    if (saveBtn)
    {
        saveBtn.disabled = !anyChecked;
    }
}


async function save_bookmark(new_entry)
{
    try
    {
        const result =
            await chrome.storage.local.get(
                STORAGE_BOOKMARKED_SUBJ_KEY
            );

        let currentArray =
            result[STORAGE_BOOKMARKED_SUBJ_KEY];

        if (Array.isArray(currentArray))
        {
            currentArray.push(new_entry);
        }
        else
        {
            currentArray = [new_entry];
        }

        await chrome.storage.local.set({
            [STORAGE_BOOKMARKED_SUBJ_KEY]:
                currentArray
        });

        switch_tab(BOOKMARK_TAB);
        populate_table();
    }
    catch (error)
    {
        console.error(error);
    }
}


async function open_booklet(file_url)
{
    try
    {
        const existingPdfBytes =
            await fetch(file_url)
                .then(res => res.arrayBuffer());

        const originalPdfDoc =
            await PDFLib.PDFDocument.load(
                existingPdfBytes
            );

        const pageCount =
            originalPdfDoc.getPageCount();

        const rearrangedPdfDoc =
            await PDFLib.PDFDocument.create();

        const new_order = get_order(pageCount);

        for (const index of new_order)
        {
            const [copiedPage] =
                await rearrangedPdfDoc.copyPages(
                    originalPdfDoc,
                    [index - 1]
                );

            rearrangedPdfDoc.addPage(copiedPage);
        }

        const modifiedPdfBytes =
            await rearrangedPdfDoc.save();

        const blob =
            new Blob(
                [modifiedPdfBytes],
                { type: "application/pdf" }
            );

        const pdfUrlObject =
            URL.createObjectURL(blob);

        window.open(pdfUrlObject, "_blank");
    }
    catch (error)
    {
        console.error(error);
        alert("Failed to process the PDF.");
    }
}


function populate_table()
{
    const tbody =
        document.getElementById("tableBody");

    tbody.innerHTML = "";

    chrome.storage.local.get(
        [STORAGE_BOOKMARKED_SUBJ_KEY],
        result => {
            const bookmarked_papers =
                Array.isArray(
                    result[STORAGE_BOOKMARKED_SUBJ_KEY]
                )
                    ? result[STORAGE_BOOKMARKED_SUBJ_KEY]
                    : [];

            const groupedData = {};

            bookmarked_papers.forEach(item => {
                if (!groupedData[item.subject])
                {
                    groupedData[item.subject] = [];
                }
                groupedData[item.subject].push(item);
            });

            Object.keys(groupedData).forEach(subj => {
                const items = groupedData[subj];
                const rowspan = items.length;

                items.forEach((item, index) => {
                    const row =
                        document.createElement("tr");

                    row.className =
                        "hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors";
                    row.dataset.itemId = item.id;

                    if (index === 0)
                    {
                        const id_cell =
                            document.createElement("td");
                        id_cell.rowSpan = rowspan;
                        id_cell.className =
                            "border border-gray-300 dark:border-gray-600 px-4 py-2 align-top font-medium text-gray-700 dark:text-gray-300";
                        id_cell.textContent = subj;
                        row.appendChild(id_cell);
                    }

                    const paper_cell =
                        document.createElement("td");
                    paper_cell.className =
                        "border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300";
                    paper_cell.textContent = item.paper_name;
                    row.appendChild(paper_cell);

                    const actionsCell =
                        document.createElement("td");
                    actionsCell.className =
                        "border border-gray-300 dark:border-gray-600 px-4 py-2 text-center";

                     const actionsDiv = document.createElement('div');
                actionsDiv.className = 'flex justify-center gap-3';
                
                // Search button
                const searchBtn = document.createElement('button');
                searchBtn.className = 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors';
                searchBtn.title = 'Search';
                searchBtn.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                `;
                searchBtn.addEventListener('click', () => handle_action(item.id));
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors';
                deleteBtn.title = 'Delete';
                deleteBtn.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                `;
                deleteBtn.addEventListener('click', () => delete_item(item.id));
                
                actionsDiv.appendChild(searchBtn);
                actionsDiv.appendChild(deleteBtn);
                actionsCell.appendChild(actionsDiv);
                row.appendChild(actionsCell);

                    tbody.appendChild(row);
                });
            });
        }
    );
}


async function delete_item(id)
{
    try
    {
        const result = await chrome.storage.local.get([STORAGE_BOOKMARKED_SUBJ_KEY]);

        let currentArray =
            result[STORAGE_BOOKMARKED_SUBJ_KEY];

        if (Array.isArray(currentArray))
        {
            currentArray =
                currentArray.filter(
                    item => item.id !== id
                );

            await chrome.storage.local.set({
                [STORAGE_BOOKMARKED_SUBJ_KEY]:
                    currentArray
            });

            populate_table();
        }
    }
    catch (error)
    {
        console.error(error);
    }
}

function handle_action(id) 
{
    chrome.storage.local.get(
        STORAGE_BOOKMARKED_SUBJ_KEY,
        result => {
            const state =
                result[STORAGE_BOOKMARKED_SUBJ_KEY];
            if (!state)
            {
                return;
            }

            const target_paper = state.find(item => item.id === id)

            const subj =
                document.getElementById("exam_subj");
            const season =
                document.getElementById("exam_series");
            const year =
                document.getElementById("exam_year");
            const paper =
                document.getElementById("exam_paper");

            if (subj) subj.value = target_paper.subject;
            if (season) season.value = target_paper.series;
            if (year) year.value = target_paper.year;
            if (paper) paper.value = target_paper.paper_var;

            console.log("Action handled for item:", target_paper);
            switch_tab(PAST_PAPER_TAB);
        }
    );
}


document.addEventListener(
    "DOMContentLoaded",
    function () {
        main();
    }
);
